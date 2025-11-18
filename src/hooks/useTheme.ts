import { useState, useEffect } from 'react';
import type { Theme } from '@/contexts/authContext';

// 明确 Theme 类型范围（如果类型定义中未限制，这里补充约束）
type ValidTheme = 'light' | 'dark';

export function useTheme() {
  // 1. 初始状态获取：增加类型校验和容错处理
  const [theme, setTheme] = useState<ValidTheme>(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      // 验证本地存储的主题是否合法
      if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        return savedTheme as ValidTheme;
      }
      // 否则使用系统偏好
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch (error) {
      // 异常情况下默认使用亮色主题
      console.error('获取主题失败:', error);
      return 'light';
    }
  });

  // 2. 主题变更副作用：增加 DOM 操作的条件判断，避免无效更新
  useEffect(() => {
    const root = document.documentElement;
    // 只有当类名与当前主题不一致时才执行操作
    if (root.classList.contains(theme)) return;

    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // 本地存储容错（某些环境可能禁用 localStorage）
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('无法保存主题到本地存储:', error);
    }
  }, [theme]);

  // 3. 切换主题：增加不可变更新保证
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };
}