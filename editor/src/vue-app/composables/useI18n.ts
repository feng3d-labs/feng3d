/**
 * Vue 组合式函数：使用国际化
 * 在 Vue 组件中使用多语言功能
 */
import { computed } from 'vue';
import { useI18nStore } from '../stores/i18nStore';
import type { Language } from '../../utils/i18n';

// 导出 Language 类型供外部使用
export type { Language };

/**
 * 使用国际化的组合式函数
 * @returns 国际化相关的响应式数据和方法
 */
export function useI18n() {
    const i18nStore = useI18nStore();

    /**
     * 当前语言（响应式）
     */
    const language = computed(() => i18nStore.language);

    /**
     * 是否为中文
     */
    const isZhCN = computed(() => i18nStore.isZhCN);

    /**
     * 是否为英文
     */
    const isEnUS = computed(() => i18nStore.isEnUS);

    /**
     * 翻译函数（响应式）
     * 在模板中使用时，会自动响应语言变化
     * @param key 翻译键，支持点分隔的嵌套路径，如 'common.ok' 或 'toolbar.move'
     * @param params 参数对象，用于替换占位符，如 { name: 'World' } 会替换 {name}
     * @param defaultText 默认文本，如果找不到翻译则返回此文本
     * @returns 翻译后的文本（响应式）
     */
    function t(key: string, params?: Record<string, string | number>, defaultText?: string): string {
        // 访问 language 以建立响应式依赖，确保语言变化时模板会重新渲染
        void language.value;
        return i18nStore.t(key, params, defaultText);
    }

    /**
     * 设置语言
     * @param lang 语言代码
     */
    function setLanguage(lang: Language): void {
        i18nStore.setLanguage(lang);
    }

    /**
     * 切换语言
     */
    function toggleLanguage(): void {
        i18nStore.toggleLanguage();
    }

    return {
        language,
        isZhCN,
        isEnUS,
        t,
        setLanguage,
        toggleLanguage,
    };
}
