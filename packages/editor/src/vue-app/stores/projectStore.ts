/**
 * 项目状态 Store
 * 管理项目相关的状态
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * 项目状态 Store
 */
export const useProjectStore = defineStore('project', () => {
    // ========== 状态定义 ==========
    
    /**
     * 当前项目路径
     */
    const projectPath = ref<string | null>(null);

    /**
     * 项目是否已加载
     */
    const isProjectLoaded = ref<boolean>(false);

    // ========== Actions ==========

    /**
     * 设置项目路径
     */
    function setProjectPath(path: string | null) {
        projectPath.value = path;
    }

    /**
     * 设置项目加载状态
     */
    function setProjectLoaded(loaded: boolean) {
        isProjectLoaded.value = loaded;
    }

    return {
        // 状态
        projectPath,
        isProjectLoaded,
        
        // Actions
        setProjectPath,
        setProjectLoaded,
    };
});

