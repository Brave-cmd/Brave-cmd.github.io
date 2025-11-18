import React from 'react';
import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { useTheme } from "@/hooks/useTheme";
import { ThemeProvider, type ThemeContextValue } from "@/contexts/authContext";
import SchoolLogo from './components/SchoolLogo';
import './App.css';

// 定义页面标题常量，便于统一修改
const APP_TITLE = "东北师范大学校史问答智能体";

const App: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  // 主题上下文值（显式类型标注，避免类型隐式转换）
  const themeContextValue: ThemeContextValue = {
    theme,
    toggleTheme,
    isDark
  };

  return (
    <ThemeProvider value={themeContextValue}>
      {/* 使用 Tailwind 工具类统一管理主题样式，减少 CSS 依赖 */}
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gray-900 text-gray-100'
          : 'bg-gray-50 text-gray-900'
      }`}>
        {/* 头部组件：提取为独立结构，增强复用性 */}
        <header className="app-header">
          <div className="header-content">
            <SchoolLogo size="small" />
            <h1 className="app-title">{APP_TITLE}</h1>
          </div>
        </header>

        {/* 路由区域：预留扩展空间，规范路由结构 */}
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* 未来可添加更多路由，如 <Route path="/about" element={<About />} /> */}
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default App;