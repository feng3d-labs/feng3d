<template>
    <div class="tip-string">
        <div class="tip-string-content">
            {{ value }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { watcher } from 'feng3d';

const props = withDefaults(defineProps<{
    value?: string | number;
}>(), {
    value: '',
});

// 监听 value 变化（使用 watcher 以保持与旧代码兼容）
watch(() => props.value, () => {
    // value 变化时自动更新显示（Vue 的响应式会自动处理）
}, { immediate: true });
</script>

<style scoped>
.tip-string {
    width: 100%;
    height: 100%;
    background-color: var(--sideBar-background, #eeeeee);
    border-radius: 2px;
    padding: 4px 5px;
    box-sizing: border-box;
}

.tip-string-content {
    font-size: 12px;
    color: var(--editor-foreground, #000000);
    max-width: 200px;
    word-wrap: break-word;
    white-space: normal;
    line-height: 1.4;
}
</style>
