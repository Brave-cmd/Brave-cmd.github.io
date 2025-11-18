import { schoolHistoryKnowledge } from './schoolHistory';

// 类型定义：规范接口请求/响应格式
interface XunfeiRequestPayload {
  model: string;
  user: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
  top_p: number;
  tools?: Array<{
    type: 'web_search';
    web_search: { enable: false };
  }>;
  tool_choice: 'none';
}

interface XunfeiSuccessResponse {
  code: 0;
  message: 'Success';
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
  };
}

interface XunfeiErrorResponse {
  code: number;
  message: string;
}

type XunfeiResponse = XunfeiSuccessResponse | XunfeiErrorResponse;

// 常量配置：集中管理固定参数
const XUNFEI_CONFIG = {
  API_URL: '/api/xfyun/v2/chat/completions',
  MODEL: 'spark-x',
  USER_ID: 'nenu_history_user',
  // 模型参数：根据校史场景优化
  MODEL_PARAMS: {
    temperature: 0.2, // 降低随机性，提升事实准确性
    max_tokens: 4096,
    top_p: 0.8,
  },
};

/**
 * 调用讯飞星火接口获取校史回答
 * @param question 用户问题
 * @returns 基于知识库的回答
 */
export async function getXunfeiAnswer(question: string): Promise<string> {
  // 1. 输入校验
  if (!question.trim()) {
    throw new Error('问题不能为空');
  }
  if (!import.meta.env.VITE_XUNFEI_API_PASSWORD) {
    throw new Error('未配置讯飞API密钥（VITE_XUNFEI_API_PASSWORD）');
  }

  // 2. 构建系统提示词（分离逻辑，便于维护）
  const systemPrompt = `你是东北师范大学校史权威问答助手，严格遵守以下规则：
1. 仅基于以下知识库中的事实性校史信息回答，禁止涉及任何校史外内容；
2. 回答简洁明了，关键信息（时间、地点、人物）准确无误；
3. 知识库中没有的信息，回复“该校史信息暂未收录”；
4. 无关问题回复：“请询问东北师范大学的校史相关问题（如建校时间、发展历程等）。”
5. 禁止使用"搜索"、"查询"等涉及工具调用的表述，直接基于提供的知识库回答。

知识库内容：
${schoolHistoryKnowledge}
`;

  // 3. 构建请求参数（强类型约束）
  const payload: XunfeiRequestPayload = {
    ...XUNFEI_CONFIG.MODEL_PARAMS,
    model: XUNFEI_CONFIG.MODEL,
    user: XUNFEI_CONFIG.USER_ID,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    // 明确禁用工具调用，避免模型试图搜索
    tools: [
      {
        type: 'web_search',
        web_search: { enable: false },
      },
    ],
    tool_choice: 'none',
  };

  try {
    // 4. 发起请求（增加超时控制）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    const response = await fetch(XUNFEI_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_XUNFEI_API_PASSWORD}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 5. 响应处理
    if (!response.ok) {
      const errorText = await response.text();
      // 解析HTTP错误（可能是JSON或纯文本）
      let errorMsg = `请求失败（${response.status}）`;
      try {
        const errorJson = JSON.parse(errorText) as XunfeiErrorResponse;
        errorMsg = `接口错误 ${errorJson.code}：${errorJson.message}`;
      } catch {
        errorMsg += `：${errorText}`;
      }
      // 特殊错误码单独处理
      if (errorText.includes('10019')) {
        errorMsg = '问题可能涉及敏感内容，请调整后重试';
      }
      throw new Error(errorMsg);
    }

    // 解析成功响应
    const data = await response.json() as XunfeiResponse;
    if (data.code !== 0) {
      throw new Error(`接口错误 ${data.code}：${data.message}`);
    }

    // 提取回答内容
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      throw new Error('未获取到有效回答');
    }

    // 清理回答格式（增强鲁棒性）
    return answer
      .replace(/\s+/g, ' ')
      .replace(/[*_~]/g, '')
      .trim();

  } catch (error) {
    // 统一错误处理
    if (error instanceof Error) {
      // 区分超时错误
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }
      throw new Error(error.message);
    }
    throw new Error('获取回答失败，请重试');
  }
}

// 开发环境测试工具（增强易用性）
if (import.meta.env.DEV) {
  const testQuestions = [
    "东北师范大学成立于哪一年？",
    "学校有哪些校区？",
    "校训是什么？",
  ];

  // 挂载到window，支持带参数调用
  (window as any).testXunfei = async (customQuestion?: string) => {
    const question = customQuestion || testQuestions[0];
    console.log(`测试问题：${question}`);
    try {
      const answer = await getXunfeiAnswer(question);
      console.log(`测试回答：\n${answer}`);
    } catch (error) {
      console.error('测试失败：', error);
    }
  };

  // 打印测试提示
  console.log(`%c校史接口测试工具`, 'color: #42b983; font-weight: bold');
  console.log(`调用方式：testXunfei() 或 testXunfei("自定义问题")`);
  console.log(`示例问题：${testQuestions.join('、')}`);
}