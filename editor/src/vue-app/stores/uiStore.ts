/**
 * UI 状态 Store
 * 管理窗口、面板等 UI 状态
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * UI 状态 Store
 */
export const useUIStore = defineStore('ui', () => {
    // ========== 状态定义 ==========
    
    /**
     * 窗口宽度
     */
    const windowWidth = ref<number>(0);

    /**
     * 窗口高度
     */
    const windowHeight = ref<number>(0);

    /**
     * 布局配置（用于保存和恢复布局）
     */
    const layoutConfig = ref<Record<string, any>>({});

    // ========== Actions ==========

    /**
     * 设置窗口尺寸
     */
    function setWindowSize(width: number, height: number) {
        windowWidth.value = width;
        windowHeight.value = height;
    }

    /**
     * 设置布局配置
     */
    function setLayoutConfig(config: Record<string, any>) {
        layoutConfig.value = config;
    }

    /**
     * 获取布局配置
     */
    function getLayoutConfig(): Record<string, any> {
        return layoutConfig.value;
    }

    return {
        // 状态
        windowWidth,
        windowHeight,
        layoutConfig,
        
        // Actions
        setWindowSize,
        setLayoutConfig,
        getLayoutConfig,
    };
});

