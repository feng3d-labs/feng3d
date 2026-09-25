<template>
    <div
        v-if="visible"
        class="mask-view"
        @click="onMaskClick"
    />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { shortcut } from 'feng3d';

const props = defineProps<{
    target?: HTMLElement | null;
}>();

const visible = ref(false);
let maskElement: HTMLElement | null = null;

// 显示遮罩
function show(target: HTMLElement) {
    visible.value = true;
    maskElement = target;
    shortcut.activityState('inModal');
}

// 隐藏遮罩
function hide() {
    visible.value = false;
    maskElement = null;
    shortcut.deactivityState('inModal');
}

// 点击遮罩
function onMaskClick(event: MouseEvent) {
    if (maskElement && event.target === event.currentTarget) {
        // 移除目标元素
        if (maskElement.parentElement) {
            maskElement.parentElement.removeChild(maskElement);
        }
    }
}

// 监听目标元素移除
watch(() => props.target, (newTarget) => {
    if (newTarget) {
        show(newTarget);
        
        // 监听目标元素移除
        const observer = new MutationObserver(() => {
            if (!newTarget.parentElement) {
                hide();
                observer.disconnect();
            }
        });
        
        if (newTarget.parentElement) {
            observer.observe(newTarget.parentElement, { childList: true });
        }
        
        return () => {
            observer.disconnect();
            hide();
        };
    } else {
        hide();
    }
}, { immediate: true });

defineExpose({
    show,
    hide,
});
</script>

<style scoped>
.mask-view {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: transparent;
    z-index: 9998;
    pointer-events: auto;
}
</style>
