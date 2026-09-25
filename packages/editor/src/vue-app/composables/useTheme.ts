import { ref, onMounted } from 'vue';

// 主题类型定义
export type ThemeType = 'dark' | 'light';

// 主题切换组合式函数
export function useTheme() {
  const currentTheme = ref<ThemeType>('dark');
  const isDark = ref(true);

  // 获取存储的主题偏好
  function getStoredTheme(): ThemeType | null {
    try {
      return localStorage.getItem('theme') as ThemeType | null;
    } catch {
      return null;
    }
  }

  // 存储主题偏好
  function storeTheme(theme: ThemeType) {
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // 忽略存储错误
    }
  }

  // 应用主题到DOM
  function applyTheme(theme: ThemeType) {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('color-scheme', theme);
  }

  // 设置主题
  function setTheme(theme: ThemeType) {
    currentTheme.value = theme;
    isDark.value = theme === 'dark';
    applyTheme(theme);
    storeTheme(theme);
  }

  // 切换主题
  function toggleTheme() {
    const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }

  // 初始化主题
  function initTheme() {
    // 首先尝试从存储中获取主题
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      setTheme(storedTheme);
      return;
    }

    // 如果没有存储的主题，检测系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme: ThemeType = prefersDark ? 'dark' : 'light';
    
    // 应用系统偏好
    setTheme(systemTheme);
  }

  // 监听系统主题变化
  function watchSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // 只有在没有手动设置主题时才跟随系统
      if (!getStoredTheme()) {
        const systemTheme: ThemeType = e.matches ? 'dark' : 'light';
        setTheme(systemTheme);
      }
    });
  }

  // 在组件挂载时初始化
  onMounted(() => {
    initTheme();
    watchSystemTheme();
  });

  return {
    currentTheme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme
  };
}