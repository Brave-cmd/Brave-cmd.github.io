// 2025-11-20 强制更新接口地址
// 讯飞大模型接口请求函数（已替换为最新 Vercel 后端地址）
export const requestXunfeiChat = async (messages, options = {}) => {
  // 新接口地址（固定替换为你的最新 Vercel 后端地址）
  const baseUrl = 'https://xfyun-backend-57xp.vercel.app/api/xfyun/v2/chat/completions';

  // 合并默认参数和前端传递的参数
  const requestParams = {
    model: 'spark-x', // 讯飞 X1.5 要求的 model 值
    messages: messages, // 对话历史（前端传递）
    temperature: 1.2, // 默认随机性
    max_tokens: 65535, // 默认最大输出长度
    stream: false, // 默认非流式返回
    ...options // 允许前端覆盖参数（如 stream: true 开启流式）
  };

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 若有额外请求头（如用户标识），可在此添加
      },
      body: JSON.stringify(requestParams)
    });

    if (!response.ok) {
      throw new Error(`接口请求失败：${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('讯飞接口调用异常：', error);
    throw error; // 抛出错误，让前端组件处理（如弹窗提示）
  }
};

// 若有其他讯飞相关接口（如流式请求），也统一替换地址
export const requestXunfeiStreamChat = async (messages, callback) => {
  const baseUrl = 'https://xfyun-backend-57xp.vercel.app/api/xfyun/v2/chat/completions';
  const requestParams = {
    model: 'spark-x',
    messages: messages,
    stream: true // 开启流式返回
  };

  // 流式请求逻辑（根据前端需求调整）
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestParams)
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    result += chunk;
    callback(chunk); // 实时回调给前端组件
  }

  return result;
};