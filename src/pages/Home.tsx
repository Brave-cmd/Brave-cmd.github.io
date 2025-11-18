import React from 'react';
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  Send,
  MessageSquare,
  BookOpen,
  ChevronDown,
  Lightbulb,
  History,
  Sun,
  Moon,
  GraduationCap,
  Building,
  Calendar,
  Trophy,
  Loader2,
  X
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { mockUniversityHistory, mockTimelineEvents } from "@/mock/historyData";
import { getXunfeiAnswer } from '@/utils/xunfeiSpark';
import './Home.css';

// 类型定义
interface ThemeStyles {
  bg: string;
  cardBg: string;
  primary: string;
  primaryLight: string;
  text: string;
  border: string;
  accent: string;
}

interface ChatMessageProps {
  type: "user" | "bot";
  text: string;
  isDark: boolean;
  style: {
    userBubble: React.CSSProperties;
    botBubble: React.CSSProperties;
  };
}

interface UniversityHistoryProps {
  history: Array<{ title: string; content: string }>;
  isDark: boolean;
  style: {
    title: React.CSSProperties;
    text: React.CSSProperties;
    section: React.CSSProperties;
  };
}

interface HistoryTimelineProps {
  events: Array<{ year: string; content: string }>;
  isDark: boolean;
  style: {
    dot: React.CSSProperties;
    line: React.CSSProperties;
    year: React.CSSProperties;
    content: React.CSSProperties;
  };
}

interface AskButtonProps {
  text: string;
  onClick: () => void;
  style: React.CSSProperties;
  disabled?: boolean;
}

interface Message {
  id: string;
  type: "user" | "bot";
  text: string;
}

// 自定义组件
const ChatMessage: React.FC<ChatMessageProps> = React.memo(({
  type, text, isDark, style
}) => {
  // 处理换行和链接
  const renderText = () => {
    const parts = text.split('\n').flatMap(part => [
      part.replace(
        /https?:\/\/[^\s]+/g,
        url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">${url}</a>`
      ),
      <br key={`br-${Math.random()}`} />
    ]);
    parts.pop(); // 移除最后一个多余的br
    return <>{parts.map((part, i) => (
      <span key={i} dangerouslySetInnerHTML={{ __html: part as string }} />
    ))}</>;
  };

  return (
    <div className={`mb-4 flex ${type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] px-4 py-2 rounded-lg break-words"
        style={type === 'user' ? style.userBubble : style.botBubble}
      >
        {renderText()}
      </div>
    </div>
  );
});

const UniversityHistory: React.FC<UniversityHistoryProps> = ({
  history, isDark, style
}) => {
  return (
    <div>
      {history.map((section, index) => (
        <div key={index} style={style.section}>
          <h4 style={style.title}>{section.title}</h4>
          <p style={style.text}>{section.content}</p>
        </div>
      ))}
    </div>
  );
};

const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  events, isDark, style
}) => {
  return (
    <div className="relative pl-6">
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={style.line} />

      {events.map((event, index) => (
        <div key={index} className="mb-6 relative">
          <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full" style={style.dot} />
          <div>
            <p style={style.year}>{event.year}</p>
            <p style={style.content}>{event.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const AskButton: React.FC<AskButtonProps> = ({ text, onClick, style, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      style={style}
      className="transition-all hover:shadow-md"
      disabled={disabled}
      aria-disabled={disabled}
    >
      {text}
    </button>
  );
};

// 东北师范大学官网主题色配置
const NENU_THEME = {
  primary: '#003366',
  primaryLight: '#1E50B3',
  accent: '#D4AF37',
  neutral: '#F5F7FA',
  neutralDark: '#E1E5E8',
  textDark: '#333333',
  textLight: '#FFFFFF',
};

// 预设问题
const PRESET_QUESTIONS: string[] = [
  "学校成立于哪一年？",
  "学校有哪些校区？",
  "校训是什么？",
  "有哪些重点学科？"
];

export default function Home() {
  const { isDark, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 动态主题样式
  const themeStyles: ThemeStyles = {
    bg: isDark ? '#121A29' : NENU_THEME.neutral,
    cardBg: isDark ? '#1E293B' : '#FFFFFF',
    primary: NENU_THEME.primary,
    primaryLight: NENU_THEME.primaryLight,
    text: isDark ? NENU_THEME.textLight : NENU_THEME.textDark,
    border: isDark ? '#334155' : NENU_THEME.neutralDark,
    accent: NENU_THEME.accent
  };

  // 自动滚动到聊天底部
  const scrollToBottom = useCallback(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 发送消息逻辑
  const handleSendMessage = useCallback(async () => {
    const question = inputMessage.trim();
    if (!question || isLoading) return;

    // 生成更稳定的ID
    const timestamp = Date.now();
    const randomStr = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    const messageId = `msg-${timestamp}-${randomStr}`;

    setMessages(prev => [...prev, { id: messageId, type: "user", text: question }]);
    setInputMessage("");
    setIsLoading(true);

    try {
      if (!navigator.onLine) {
        throw new Error('网络连接已断开，请检查网络设置');
      }

      const botAnswer = await getXunfeiAnswer(question);
      setMessages(prev => [...prev, { id: `bot-${messageId}`, type: "bot", text: botAnswer }]);
    } catch (error) {
      const errorMsg = (error as Error).message || '未知错误';
      let displayMsg = "获取回答失败，请重试";

      if (errorMsg.includes('10019')) displayMsg = "问题可能涉及敏感内容，请调整后重试";
      else if (errorMsg.includes('401')) displayMsg = "接口授权失败，请检查密钥配置";
      else if (errorMsg.includes('CORS')) displayMsg = "跨域错误，请检查网络设置";
      else if (errorMsg.includes('500')) displayMsg = "服务器错误，正在修复中";
      else if (errorMsg.includes('超时')) displayMsg = "请求超时，请检查网络后重试";
      else if (errorMsg.includes('网络连接已断开')) displayMsg = errorMsg;
      else displayMsg = `错误: ${errorMsg.slice(0, 30)}...`;

      setMessages(prev => [...prev, { id: `err-${messageId}`, type: "bot", text: displayMsg }]);
      toast.error(displayMsg);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading]);

  // 键盘回车发送
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage, isLoading]);

  // 快速提问按钮逻辑
  const handleQuickQuestion = useCallback((text: string) => {
    setInputMessage(text);
    inputRef.current?.focus();
  }, []);

  // 清空输入框
  const handleClearInput = useCallback(() => {
    setInputMessage("");
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans" style={{
      backgroundColor: themeStyles.bg,
      color: themeStyles.text,
      transition: 'background-color 0.3s ease'
    }}>
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 shadow-md transition-all duration-300" style={{
        backgroundColor: themeStyles.primary
      }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <GraduationCap className="h-6 w-6" style={{ color: themeStyles.primary }} />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight" style={{
              color: NENU_THEME.textLight,
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased' as any
            }}>
              东北师范大学校史问答智能体
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-colors hover:bg-primaryLight/80"
            aria-label={isDark ? "切换至浅色模式" : "切换至深色模式"}
            style={{ color: NENU_THEME.textLight }}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* 欢迎区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 rounded-lg shadow-sm overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: themeStyles.cardBg,
            borderTop: `3px solid ${themeStyles.accent}`
          }}
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-3 flex items-center font-display" style={{
              color: themeStyles.primary,
              letterSpacing: '0.03em'
            }}>
              <Lightbulb className="inline mr-2 h-6 w-6" style={{ color: themeStyles.accent }} />
              欢迎使用东北师范大学校史问答智能体
            </h2>
            <p className="mb-5" style={{
              lineHeight: 1.7,
              textIndent: '2em'
            }}>
              本系统基于东北师范大学官方校史资料开发，可查询学校发展历程、学科建设、知名校友等权威信息，
              助力您全面了解这所"人民教师的摇篮"的百年底蕴。
            </p>
            <div className="flex flex-wrap gap-3">
              {PRESET_QUESTIONS.map((q, i) => (
                <AskButton
                  key={i}
                  text={q}
                  onClick={() => handleQuickQuestion(q)}
                  style={{
                    backgroundColor: themeStyles.primary,
                    color: NENU_THEME.textLight,
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = themeStyles.primaryLight;
                  }}
                  onMouseOut={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = themeStyles.primary;
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* 功能区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 聊天区域 */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-lg shadow-sm overflow-hidden transition-all duration-300"
              style={{ backgroundColor: themeStyles.cardBg }}
            >
              <div className="px-5 py-3 flex items-center" style={{
                borderBottom: `1px solid ${themeStyles.border}`,
                backgroundColor: themeStyles.primaryLight,
                color: NENU_THEME.textLight
              }}>
                <MessageSquare className="mr-2 h-5 w-5" />
                <h3 className="font-semibold font-display">智能问答</h3>
              </div>

              <div
                ref={chatContainerRef}
                className="p-5 h-[400px] overflow-y-auto"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${themeStyles.primaryLight} ${themeStyles.bg}`
                }}
                role="log"
                aria-live="polite"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center" style={{ color: `${themeStyles.text}80` }}>
                    <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
                    <p className="mb-2">暂无对话记录</p>
                    <p className="text-sm">请输入关于东北师范大学校史的问题</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      type={msg.type}
                      text={msg.text}
                      isDark={isDark}
                      style={{
                        userBubble: {
                          backgroundColor: themeStyles.primaryLight,
                          color: NENU_THEME.textLight,
                          fontFamily: 'inherit'
                        },
                        botBubble: {
                          backgroundColor: isDark ? '#334155' : NENU_THEME.neutral,
                          color: themeStyles.text,
                          fontFamily: 'inherit'
                        }
                      }}
                    />
                  ))
                )}

                {isLoading && (
                  <div className="flex items-center mt-4" style={{ color: `${themeStyles.text}80` }}>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" aria-hidden="true" />
                    <span aria-busy="true">正在查询校史资料...</span>
                  </div>
                )}
              </div>

              <div className="p-4 border-t" style={{ borderColor: themeStyles.border }}>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="请输入您的问题..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 rounded border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: isDark ? '#334155' : '#F9FAFB',
                      borderColor: themeStyles.border,
                      color: themeStyles.text,
                      fontFamily: 'inherit'
                    }}
                    aria-label="输入问题"
                  />
                  {inputMessage && !isLoading && (
                    <button
                      onClick={handleClearInput}
                      className="p-2 rounded transition-all self-center"
                      style={{
                        backgroundColor: themeStyles.border,
                        color: themeStyles.text
                      }}
                      aria-label="清空输入"
                      title="清空"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading}
                    className="p-2 rounded transition-all"
                    style={{
                      backgroundColor: isLoading ? themeStyles.border : themeStyles.primary,
                      color: NENU_THEME.textLight
                    }}
                    aria-label="发送消息"
                    aria-disabled={isLoading}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 校史概览 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-lg shadow-sm overflow-hidden transition-all duration-300"
              style={{ backgroundColor: themeStyles.cardBg }}
            >
              <div
                className="px-5 py-3 border-b flex items-center justify-between cursor-pointer transition-colors"
                style={{ borderColor: themeStyles.border }}
                onClick={() => setShowHistory(!showHistory)}
                aria-expanded={showHistory}
                aria-controls="history-content"
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && setShowHistory(!showHistory)}
              >
                <div className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" style={{ color: themeStyles.primary }} />
                  <h3 className="font-semibold font-display">校史概览</h3>
                </div>
                <ChevronDown className="h-5 w-5 transition-transform" style={{
                  transform: showHistory ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.3s ease'
                }} />
              </div>

              <motion.div
                id="history-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="p-5"
                style={{ display: showHistory ? 'block' : 'none' }}
              >
                <UniversityHistory
                  history={mockUniversityHistory}
                  isDark={isDark}
                  style={{
                    title: {
                      color: themeStyles.primary,
                      fontFamily: 'font-display',
                      fontWeight: 'bold',
                      marginBottom: '0.8rem'
                    },
                    text: {
                      color: themeStyles.text,
                      lineHeight: 1.7,
                      textIndent: '2em',
                      marginBottom: '1rem'
                    },
                    section: { marginBottom: '1.5rem' }
                  }}
                />
              </motion.div>
            </motion.div>
          </div>

          {/* 右侧区域 */}
          <div className="space-y-6">
            {/* 校史时间线 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-lg shadow-sm overflow-hidden transition-all duration-300"
              style={{ backgroundColor: themeStyles.cardBg }}
            >
              <div
                className="px-5 py-3 border-b flex items-center justify-between cursor-pointer transition-colors"
                style={{ borderColor: themeStyles.border }}
                onClick={() => setShowTimeline(!showTimeline)}
                aria-expanded={showTimeline}
                aria-controls="timeline-content"
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && setShowTimeline(!showTimeline)}
              >
                <div className="flex items-center">
                  <History className="mr-2 h-5 w-5" style={{ color: themeStyles.primary }} />
                  <h3 className="font-semibold font-display">校史时间线</h3>
                </div>
                <ChevronDown className="h-5 w-5 transition-transform" style={{
                  transform: showTimeline ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.3s ease'
                }} />
              </div>

              <motion.div
                id="timeline-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="p-5 max-h-[400px] overflow-y-auto"
                style={{
                  display: showTimeline ? 'block' : 'none',
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${themeStyles.primaryLight} ${themeStyles.bg}`
                }}
              >
                <HistoryTimeline
                  events={mockTimelineEvents}
                  isDark={isDark}
                  style={{
                    dot: { backgroundColor: themeStyles.accent },
                    line: { backgroundColor: themeStyles.border },
                    year: {
                      color: themeStyles.primary,
                      fontWeight: 600,
                      fontFamily: 'font-display',
                      marginBottom: '0.3rem'
                    },
                    content: {
                      color: themeStyles.text,
                      lineHeight: 1.6
                    }
                  }}
                />
              </motion.div>
            </motion.div>

            {/* 学校基本信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="rounded-lg shadow-sm p-5 transition-all duration-300"
              style={{ backgroundColor: themeStyles.cardBg }}
            >
              <h3 className="font-semibold mb-4 flex items-center font-display" style={{ color: themeStyles.primary }}>
                <Building className="mr-2 h-5 w-5" />
                学校基本信息
              </h3>
              <div className="space-y-4" style={{ color: themeStyles.text }}>
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-3 mt-0.5" style={{ color: themeStyles.primaryLight }} />
                  <div>
                    <p className="text-sm font-medium">创办时间</p>
                    <p style={{ marginTop: '4px' }}>1946年</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Trophy className="h-5 w-5 mr-3 mt-0.5" style={{ color: themeStyles.primaryLight }} />
                  <div>
                    <p className="text-sm font-medium">学校类型</p>
                    <p style={{ marginTop: '4px' }}>教育部直属重点师范大学</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Building className="h-5 w-5 mr-3 mt-0.5" style={{ color: themeStyles.primaryLight }} />
                  <div>
                    <p className="text-sm font-medium">校区</p>
                    <p style={{ marginTop: '4px' }}>本部校区、净月校区</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="py-5 mt-12 transition-colors duration-300" style={{
        backgroundColor: themeStyles.primary,
        color: NENU_THEME.textLight
      }}>
        <div className="container mx-auto px-4 text-center text-sm max-w-6xl font-sans">
          <p>© 2025 东北师范大学 校史研究室 版权所有 | 地址：吉林省长春市人民大街5268号</p>
        </div>
      </footer>

      <Toaster position="top-right" />
    </div>
  );
}