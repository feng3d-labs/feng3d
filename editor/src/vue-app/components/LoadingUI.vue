<template>
    <div class="loading-ui">
        <div class="loading-text">{{ loadingText }}</div>
        <div v-if="showProgress" class="loading-progress">
            {{ current }}/{{ total }}
        </div>
        <div class="loading-spinner" v-if="showSpinner">
            <div class="spinner"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = withDefaults(defineProps<{
    showSpinner?: boolean;
}>(), {
    showSpinner: true,
});

const current = ref(0);
const total = ref(0);

// 加载文本
const loadingText = computed(() => {
    if (total.value > 0) {
        return `Loading...${current.value}/${total.value}`;
    }
    return 'Loading...';
});

// 是否显示进度
const showProgress = computed(() => total.value > 0);

/**
 * 设置加载进度
 * @param currentValue 当前进度
 * @param totalValue 总进度
 */
function setProgress(currentValue: number, totalValue: number) {
    current.value = currentValue;
    total.value = totalValue;
}

// 暴露方法供外部调用
defineExpose({
    setProgress,
});
</script>

<style scoped>
.loading-ui {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: var(--editor-foreground, #cccccc);
    font-size: 14px;
}

.loading-text {
    margin-bottom: 8px;
    text-align: center;
}

.loading-progress {
    margin-top: 4px;
    font-size: 12px;
    color: var(--sideBarSectionHeader-foreground, #999999);
}

.loading-spinner {
    margin-top: 16px;
}

.spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--panel-border, #4d4d4d);
    border-top-color: var(--button-background, #409eff);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
