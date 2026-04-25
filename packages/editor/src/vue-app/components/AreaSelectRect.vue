<template>
    <div
        v-if="actualVisible"
        class="area-select-rect"
        :style="rectStyle"
    />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

export interface Position {
    x: number;
    y: number;
}

const props = withDefaults(defineProps<{
    /** 起始位置 */
    start?: Position | null;
    /** 结束位置 */
    end?: Position | null;
    /** 是否可见 */
    visible?: boolean;
    /** 填充颜色（十六进制，如 0x8888ff） */
    fillColor?: number;
    /** 填充透明度（0-1） */
    fillAlpha?: number;
}>(), {
    visible: false,
    fillColor: 0x8888ff,
    fillAlpha: 0.5,
});

// 内部状态（用于通过方法调用控制）
const internalVisible = ref(false);
const internalStart = ref<Position | null>(null);
const internalEnd = ref<Position | null>(null);

// 判断是否使用 props 模式
const usePropsMode = computed(() => props.start !== undefined || props.end !== undefined);

// 计算实际使用的值
const actualStart = computed(() => (usePropsMode.value ? props.start : internalStart.value) ?? null);
const actualEnd = computed(() => (usePropsMode.value ? props.end : internalEnd.value) ?? null);
const actualVisible = computed(() => {
    if (!actualStart.value || !actualEnd.value) {
        return false;
    }
    // 如果使用 props 模式，使用 props.visible（默认为 true）
    if (usePropsMode.value) {
        return props.visible ?? true;
    }
    // 如果使用方法模式，使用内部状态
    return internalVisible.value;
});

// 计算矩形样式
const rectStyle = computed(() => {
    if (!actualStart.value || !actualEnd.value) {
        return { display: 'none' };
    }

    const minX = Math.min(actualStart.value.x, actualEnd.value.x);
    const maxX = Math.max(actualStart.value.x, actualEnd.value.x);
    const minY = Math.min(actualStart.value.y, actualEnd.value.y);
    const maxY = Math.max(actualStart.value.y, actualEnd.value.y);

    const width = maxX - minX;
    const height = maxY - minY;

    // 将十六进制颜色转换为 RGB
    const r = (props.fillColor >> 16) & 0xff;
    const g = (props.fillColor >> 8) & 0xff;
    const b = props.fillColor & 0xff;

    return {
        left: `${minX}px`,
        top: `${minY}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: `rgba(${r}, ${g}, ${b}, ${props.fillAlpha})`,
    };
});

// 显示方法
function show(start: Position, end: Position) {
    internalStart.value = start;
    internalEnd.value = end;
    internalVisible.value = true;
}

// 隐藏方法
function hide() {
    internalVisible.value = false;
    internalStart.value = null;
    internalEnd.value = null;
}

// 暴露方法供外部调用
defineExpose({
    show,
    hide,
});
</script>

<style scoped>
.area-select-rect {
    position: fixed;
    pointer-events: none;
    z-index: 10002;
    border: 1px solid rgba(136, 136, 255, 0.8);
    box-sizing: border-box;
}
</style>
