<script setup lang="ts">
import { objectview, type AttributeViewInfo } from 'feng3d';
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{
    /** 属性视图信息 */
    attrInfo: AttributeViewInfo;
}>();

const containerRef = ref<HTMLElement | null>(null);
let view: { dom?: HTMLElement; destroy?: () => void } | null = null;

onMounted(() => {
    if (!containerRef.value || !props.attrInfo) return;

    // 使用 objectview.getAttributeView 获取属性视图
    view = objectview.getAttributeView(props.attrInfo) as { dom?: HTMLElement; destroy?: () => void };

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
    <div ref="containerRef" class="object-attribute-view"></div>
</template>

<style scoped>
.object-attribute-view {
    width: 100%;
}
</style>
