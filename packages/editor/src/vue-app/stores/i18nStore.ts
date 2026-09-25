/**
 * 国际化（i18n）状态 Store
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
    Language, 
    getCurrentLanguage, 
    setLanguage as setI18nLanguage,
    onLanguageChange,
    t as translate,
    initLanguage,
    saveLanguage,
    setLanguageResources,
} from '../../utils/i18n';
import { zh_CN } from '../../utils/i18n/zh_CN';
import { en_US } from '../../utils/i18n/en_US';

/**
 * 国际化状态 Store
 */
export const useI18nStore = defineStore('i18n', () => {
    // ========== 状态定义 ==========
    
    /**
     * 当前语言
     */
    const language = ref<Language>(getCurrentLanguage());

    // ========== 计算属性 ==========

    /**
     * 是否为中文
     */
    const isZhCN = computed(() => language.value === 'zh_CN');

    /**
     * 是否为英文
     */
    const isEnUS = computed(() => language.value === 'en_US');

    // ========== Actions ==========

    /**
     * 设置语言
     * @param lang 语言代码
     */
    function setLanguage(lang: Language): void {
        setI18nLanguage(lang);
        language.value = lang;
        saveLanguage();
    }

    /**
     * 切换语言（在中文和英文之间切换）
     */
    function toggleLanguage(): void {
        const newLanguage: Language = language.value === 'zh_CN' ? 'en_US' : 'zh_CN';
        setLanguage(newLanguage);
    }

    /**
     * 翻译函数（响应式）
     * @param key 翻译键
     * @param params 参数对象
     * @param defaultText 默认文本
     * @returns 翻译后的文本
     */
    function t(key: string, params?: Record<string, string | number>, defaultText?: string): string {
        return translate(key, params, defaultText);
    }

    /**
     * 初始化语言系统
     */
    function initialize(): void {
        // 设置语言资源
        setLanguageResources('zh_CN', zh_CN);
        setLanguageResources('en_US', en_US);
        
        // 初始化语言（从本地存储或浏览器语言）
        initLanguage();
        language.value = getCurrentLanguage();
        
        // 监听语言变更
        onLanguageChange((lang) => {
            language.value = lang;
        });
    }

    return {
        // 状态
        language,
        
        // 计算属性
        isZhCN,
        isEnUS,
        
        // Actions
        setLanguage,
        toggleLanguage,
        t,
        initialize,
    };
});
