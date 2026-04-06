/**
 * 主题状态 Store
 * 管理应用的主题（暗色/亮色）
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ThemeService } from '../../themes';

/**
 * 主题类型
 */
export type ThemeType = 'dark' | 'light';

/**
 * 经典主题与 VSCode 主题的映射
 */
const CLASSIC_THEME_MAP: Record<ThemeType, string> = {
    dark: 'dark_modern',
    light: 'light_modern'
};

/**
 * 主题状态 Store
 */
export const useThemeStore = defineStore('theme', () => {
    // ========== 状态定义 ==========

    /**
     * 当前主题
     * 默认从 localStorage 读取，如果没有则使用暗色主题
     */
     const getInitialTheme = (): ThemeType => {
         if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
             // 检测系统主题偏好
             if (typeof window !== 'undefined' && window.matchMedia) {
                 const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                 return prefersDark ? 'dark' : 'light';
             }
             return 'dark';
         }
         const saved = localStorage.getItem('editor-theme');
         return (saved === 'light' || saved === 'dark') ? saved : 'dark';
     };

    const currentTheme = ref<ThemeType>(getInitialTheme());

    // ========== Actions ==========

    /**
     * 设置主题
     * @param theme 主题类型
     */
    async function setTheme(theme: ThemeType) {
        currentTheme.value = theme;
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem('editor-theme', theme);
        }
        await applyTheme(theme);
    }

    /**
     * 切换主题
     */
    async function toggleTheme() {
        const newTheme: ThemeType = currentTheme.value === 'dark' ? 'light' : 'dark';
        await setTheme(newTheme);
    }

    /**
     * 应用主题样式
     * @param theme 主题类型
     */
    async function applyTheme(theme: ThemeType) {
        if (typeof document === 'undefined') {
            return;
        }

        // 使用 ThemeService 应用对应的 VSCode 主题
        try {
            const themeService = ThemeService.getInstance();
            const vscodeThemeId = CLASSIC_THEME_MAP[theme];
            await themeService.loadAndApplyTheme(vscodeThemeId);
        } catch (error) {
            console.error('Failed to apply classic theme:', error);
        }
    }

    // 不在 store 初始化时自动应用主题
    // 主题应用将在 main.ts 中应用挂载后手动调用

    return {
        // 状态
        currentTheme,

        // Actions
        setTheme,
        toggleTheme,
        applyTheme,
    };
});
