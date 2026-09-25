<script setup lang="ts">
import { objectview, type BlockViewInfo } from 'feng3d';
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{
    /** 块视图信息 */
    blockInfo: BlockViewInfo;
}>();

const containerRef = ref<HTMLElement | null>(null);
let view: { dom?: HTMLElement; destroy?: () => void } | null = null;

onMounted(() => {
    if (!containerRef.value || !props.blockInfo) return;

    // 使用 objectview.getBlockView 获取块视图
    view = objectview.getBlockView(props.blockInfo) as { dom?: HTMLElement; destroy?: () => void };

    // 将视图的 DOM 添加到容器
    if (view.dom) {
        containerRef.value.appendChild(view.dom);
    }
});

onUnmounted(() => {
    // 清理视图
    if (view?.destroy) {
        view.destroy();
    }
    view = null;
});
</script>

<template>
    <div ref="containerRef" class="object-block-view"></div>
</template>

<style scoped>
.object-block-view {
    width: 100%;
}
</style>
