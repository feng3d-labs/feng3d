/**
 * 国际化（i18n）核心模块
 * 提供多语言支持，适用于 Vue 组件
 */

/**
 * 支持的语言类型
 */
export type Language = 'zh_CN' | 'en_US';

/**
 * 语言资源类型定义
 */
export interface LanguageResources {
    [key: string]: string | LanguageResources;
}

/**
 * 语言资源映射
 */
const languageResources: Record<Language, LanguageResources> = {
    zh_CN: {},
    en_US: {},
};

/**
 * 当前语言
 */
let currentLanguage: Language = 'zh_CN';

/**
 * 语言变更监听器
 */
const languageChangeListeners: Array<(language: Language) => void> = [];

/**
 * 设置语言资源
 * @param language 语言代码
 * @param resources 语言资源对象
 */
export function setLanguageResources(language: Language, resources: LanguageResources): void {
    languageResources[language] = resources;
}

/**
 * 获取当前语言
 */
export function getCurrentLanguage(): Language {
    return currentLanguage;
}

/**
 * 设置当前语言
 * @param language 语言代码
 */
export function setLanguage(language: Language): void {
    if (currentLanguage !== language) {
        currentLanguage = language;
        // 触发所有监听器
        languageChangeListeners.forEach(listener => listener(language));
    }
}

/**
 * 添加语言变更监听器
 * @param listener 监听器函数
 * @returns 取消监听的函数
 */
export function onLanguageChange(listener: (language: Language) => void): () => void {
    languageChangeListeners.push(listener);
    return () => {
        const index = languageChangeListeners.indexOf(listener);
        if (index > -1) {
            languageChangeListeners.splice(index, 1);
        }
    };
}

/**
 * 根据路径获取嵌套对象的值
 * @param obj 对象
 * @param path 路径，用点分隔
 * @returns 值或 undefined
 */
function getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
        if (value === null || value === undefined || typeof value !== 'object') {
            return undefined;
        }
        value = value[key];
    }
    return value;
}

/**
 * 翻译函数
 * @param key 翻译键，支持点分隔的嵌套路径，如 'common.ok' 或 'toolbar.move'
 * @param params 参数对象，用于替换占位符，如 { name: 'World' } 会替换 {name}
 * @param defaultText 默认文本，如果找不到翻译则返回此文本
 * @returns 翻译后的文本
 */
export function t(key: string, params?: Record<string, string | number>, defaultText?: string): string {
    const resources = languageResources[currentLanguage];
    let text: string | undefined = getNestedValue(resources, key) as string | undefined;

    // 如果找不到翻译，尝试使用默认文本或返回键名
    if (text === undefined) {
        text = defaultText || key;
    }

    // 替换参数占位符
    if (params && typeof text === 'string') {
        Object.keys(params).forEach(paramKey => {
            const value = String(params[paramKey]);
            text = (text as string).replace(new RegExp(`\\{${paramKey}\\}`, 'g'), value);
        });
    }

    return text;
}

/**
 * 初始化语言（从本地存储或浏览器语言）
 */
export function initLanguage(): void {
    // 尝试从本地存储读取
    const savedLanguage = localStorage.getItem('editor.language') as Language | null;
    if (savedLanguage && (savedLanguage === 'zh_CN' || savedLanguage === 'en_US')) {
        setLanguage(savedLanguage);
        return;
    }

    // 从浏览器语言检测
    const browserLanguage = navigator.language || (navigator as any).browserLanguage || 'en_US';
    const normalizedLanguage = browserLanguage.replace('-', '_');
    
    if (normalizedLanguage.startsWith('zh')) {
        setLanguage('zh_CN');
    } else {
        setLanguage('en_US');
    }
}

/**
 * 保存语言到本地存储
 */
export function saveLanguage(): void {
    localStorage.setItem('editor.language', currentLanguage);
}
