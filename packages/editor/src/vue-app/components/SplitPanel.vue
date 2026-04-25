<!--
  使用 Element Plus 的 Splitter 组件实现分隔面板
  保持与原有 API 的兼容性，支持水平和垂直两种方向
-->
<template>
  <el-splitter
    :layout="direction"
    class="split-panel"
    @resize="onResize"
  >
    <el-splitter-panel
      v-model:size="firstPanelSize"
      :min="minSize"
    >
      <div class="split-panel-content">
        <slot name="first"></slot>
      </div>
    </el-splitter-panel>
    <el-splitter-panel :min="minSize">
      <div class="split-panel-content">
        <slot name="second"></slot>
      </div>
    </el-splitter-panel>
  </el-splitter>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';

interface Props {
  direction?: 'horizontal' | 'vertical';
  split?: number; // 分割比例 0-1，默认 0.5
  minSize?: number; // 最小尺寸（像素）
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
  split: 0.5,
  minSize: 100,
});

const emit = defineEmits<{
  'update:split': [value: number];
}>();

// 当前分割比例
const currentSplit = ref(props.split);

// 将 split (0-1) 转换为百分比字符串，用于 Element Plus
const firstPanelSize = computed({
  get: () => {
    return `${currentSplit.value * 100}%`;
  },
  set: (value: string | number) => {
    // 处理 Element Plus 返回的大小值
    let ratio: number;
    
    if (typeof value === 'string') {
      // 如果是百分比字符串，提取数字并转换为 0-1 的比例
      const match = value.match(/(\d+(?:\.\d+)?)%/);
      if (match) {
        ratio = parseFloat(match[1]) / 100;
      } else {
        // 如果无法解析，保持当前值
        return;
      }
    } else {
      // 如果是数字（像素），这种情况在 onResize 中处理
      return;
    }
    
    currentSplit.value = ratio;
    emit('update:split', ratio);
  },
});

// 处理 resize 事件（当拖拽调整大小时触发）
function onResize(index: number, sizes: number[]) {
  // index 是拖拽条的索引，sizes 是所有面板的大小数组（像素值）
  // 对于两个面板的情况，sizes[0] 是第一个面板的大小，sizes[1] 是第二个面板的大小
  if (sizes.length >= 2 && sizes[0] !== undefined && sizes[1] !== undefined) {
    const totalSize = sizes[0] + sizes[1];
    if (totalSize > 0) {
      const ratio = sizes[0] / totalSize;
      currentSplit.value = ratio;
      emit('update:split', ratio);
    }
  }
}

// 监听 split prop 变化
watch(() => props.split, (newValue) => {
  currentSplit.value = newValue;
});
</script>

<style scoped>
.split-panel {
  width: 100%;
  height: 100%;
  border-radius: 0;
  overflow: hidden;
  border: none;
}

.split-panel-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
  background-color: var(--editor-background);
}

/* Element Plus Splitter 优化样式 */
:deep(.el-splitter) {
  border: none !important;
  background-color: transparent !important;
  border-radius: 0 !important;
}

:deep(.el-splitter__pane) {
  background-color: transparent !important;
  border: none !important;
  border-radius: 0 !important;
}

:deep(.el-splitter__pane .el-splitter__pane-wrapper) {
  border-radius: 0 !important;
}

:deep(.el-splitter__divider) {
  background-color: var(--sideBar-border, #2b2b2b) !important;
  border-radius: 0 !important;
  transition: background-color 0.2s ease;
}

:deep(.el-splitter__divider:hover) {
  background-color: var(--button-background) !important;
}

:deep(.el-splitter__divider.is-horizontal) {
  height: 1px !important;
}

:deep(.el-splitter__divider.is-vertical) {
  width: 1px !important;
}

/* Element Plus Splitter 分割线样式 */
:deep(.el-splitter-bar) {
  background-color: transparent !important;
}

:deep(.el-splitter-bar.is-horizontal) {
  width: 1px !important;
}

:deep(.el-splitter-bar.is-vertical) {
  height: 1px !important;
}

/* dragger 作为分割线显示，同时保持拖拽功能 */
:deep(.el-splitter-bar__dragger) {
  background-color: var(--sideBar-border, #2b2b2b) !important;
  border: none !important;
  pointer-events: auto !important;
  opacity: 1 !important;
}

/* 隐藏 Element Plus 默认的白色伪元素 */
:deep(.el-splitter-bar__dragger::before),
:deep(.el-splitter-bar__dragger::after) {
  display: none !important;
}

:deep(.el-splitter-bar__dragger-horizontal) {
  width: 1px !important;
  cursor: ew-resize !important;
}

:deep(.el-splitter-bar__dragger-vertical) {
  height: 1px !important;
  cursor: ns-resize !important;
}

/* hover 时放大拖拽区域方便操作 */
:deep(.el-splitter-bar__dragger-horizontal:hover) {
  width: 4px !important;
  background-color: var(--button-background) !important;
}

:deep(.el-splitter-bar__dragger-vertical:hover) {
  height: 4px !important;
  background-color: var(--button-background) !important;
}
</style>

