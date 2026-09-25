<template>
    <div
        ref="windowRef"
        class="window-view"
        :style="windowStyle"
        @mousedown="onWindowMouseDown"
    >
        <!-- 标题栏 -->
        <div
            ref="moveAreaRef"
            class="window-view-header"
            @mousedown="onMoveAreaMouseDown"
        >
            <span class="window-view-title">{{ title }}</span>
            <el-button
                text
                size="small"
                class="window-view-close"
                @click="onClose"
            >
                <el-icon><Close /></el-icon>
            </el-button>
        </div>
        
        <!-- 内容区域 -->
        <div ref="contentRef" class="window-view-content">
            <slot />
        </div>
        
        <!-- 调整大小手柄 -->
        <div
            v-if="resizable"
            class="window-view-resize-handle window-view-resize-left"
            @mousedown.stop="onResizeMouseDown('left', $event)"
        />
        <div
            v-if="resizable"
            class="window-view-resize-handle window-view-resize-right"
            @mousedown.stop="onResizeMouseDown('right', $event)"
        />
        <div
            v-if="resizable"
            class="window-view-resize-handle window-view-resize-bottom"
            @mousedown.stop="onResizeMouseDown('bottom', $event)"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Close } from '@element-plus/icons-vue';

const props = withDefaults(defineProps<{
    title?: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    resizable?: boolean;
    minWidth?: number;
    minHeight?: number;
}>(), {
    title: '窗口',
    width: 400,
    height: 300,
    x: undefined,
    y: undefined,
    resizable: true,
    minWidth: 200,
    minHeight: 150,
});

const emit = defineEmits<{
    close: [];
    'update:width': [width: number];
    'update:height': [height: number];
    'update:x': [x: number];
    'update:y': [y: number];
}>();

const windowRef = ref<HTMLElement | null>(null);
const moveAreaRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

// 窗口样式
const windowStyle = computed(() => {
    const style: Record<string, string> = {
        width: `${props.width}px`,
        height: `${props.height}px`,
    };
    
    if (props.x !== undefined) {
        style.left = `${props.x}px`;
    }
    if (props.y !== undefined) {
        style.top = `${props.y}px`;
    }
    
    return style;
});

// 拖拽状态
const dragState = ref<{
    type: 'move' | 'resize-left' | 'resize-right' | 'resize-bottom' | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startLeft: number;
    startTop: number;
}>({
    type: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
});

// 关闭窗口
function onClose() {
    emit('close');
}

// 窗口标题栏鼠标按下（开始拖拽）
function onMoveAreaMouseDown(event: MouseEvent) {
    if (!windowRef.value) return;
    
    const rect = windowRef.value.getBoundingClientRect();
    dragState.value = {
        type: 'move',
        startX: event.clientX,
        startY: event.clientY,
        startWidth: rect.width,
        startHeight: rect.height,
        startLeft: rect.left,
        startTop: rect.top,
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    event.preventDefault();
}

// 窗口鼠标按下（防止点击窗口内容时触发拖拽）
function onWindowMouseDown(event: MouseEvent) {
    // 如果点击的是内容区域，不处理
    if (contentRef.value?.contains(event.target as Node)) {
        return;
    }
}

// 调整大小鼠标按下
function onResizeMouseDown(type: 'left' | 'right' | 'bottom', event: MouseEvent) {
    if (!windowRef.value) return;
    
    const rect = windowRef.value.getBoundingClientRect();
    dragState.value = {
        type: `resize-${type}` as any,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: rect.width,
        startHeight: rect.height,
        startLeft: rect.left,
        startTop: rect.top,
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    event.preventDefault();
    event.stopPropagation();
}

// 鼠标移动
function onMouseMove(event: MouseEvent) {
    if (!windowRef.value || !dragState.value.type) return;
    
    const deltaX = event.clientX - dragState.value.startX;
    const deltaY = event.clientY - dragState.value.startY;
    
    if (dragState.value.type === 'move') {
        // 移动窗口
        const newX = dragState.value.startLeft + deltaX;
        const newY = dragState.value.startTop + deltaY;
        
        // 限制在视口内
        const maxX = window.innerWidth - dragState.value.startWidth;
        const maxY = window.innerHeight - dragState.value.startHeight;
        
        emit('update:x', Math.max(0, Math.min(newX, maxX)));
        emit('update:y', Math.max(0, Math.min(newY, maxY)));
    } else if (dragState.value.type === 'resize-left') {
        // 调整左边
        const newWidth = dragState.value.startWidth - deltaX;
        if (newWidth >= props.minWidth) {
            emit('update:width', newWidth);
            emit('update:x', dragState.value.startLeft + deltaX);
        }
    } else if (dragState.value.type === 'resize-right') {
        // 调整右边
        const newWidth = dragState.value.startWidth + deltaX;
        if (newWidth >= props.minWidth) {
            emit('update:width', newWidth);
        }
    } else if (dragState.value.type === 'resize-bottom') {
        // 调整底部
        const newHeight = dragState.value.startHeight + deltaY;
        if (newHeight >= props.minHeight) {
            emit('update:height', newHeight);
        }
    }
}

// 鼠标释放
function onMouseUp() {
    dragState.value.type = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

// 鼠标悬停效果（调整大小光标）
function updateCursor(event: MouseEvent) {
    if (!windowRef.value || !props.resizable) return;
    
    const rect = windowRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = 4;
    
    let cursor = 'default';
    if (x < size) {
        cursor = 'ew-resize';
    } else if (x > rect.width - size) {
        cursor = 'ew-resize';
    } else if (y > rect.height - size) {
        cursor = 'ns-resize';
    }
    
    if (windowRef.value) {
        windowRef.value.style.cursor = cursor;
    }
}

onMounted(() => {
    if (windowRef.value) {
        windowRef.value.addEventListener('mousemove', updateCursor);
    }
    
    // 居中显示
    if (props.x === undefined || props.y === undefined) {
        const centerX = (window.innerWidth - props.width) / 2;
        const centerY = (window.innerHeight - props.height) / 2;
        emit('update:x', Math.max(0, centerX));
        emit('update:y', Math.max(0, centerY));
    }
});

onUnmounted(() => {
    if (windowRef.value) {
        windowRef.value.removeEventListener('mousemove', updateCursor);
    }
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
});

// 获取内容容器（用于添加子元素）
defineExpose({
    contentElement: contentRef,
});
</script>

<style scoped>
.window-view {
    position: fixed;
    background-color: var(--editor-background, #2d2d2d);
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    z-index: 9999;
    overflow: hidden;
}

.window-view-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: var(--input-background, #1d1d1d);
    border-bottom: 1px solid var(--sideBar-border, #3d3d3d);
    cursor: move;
    user-select: none;
}

.window-view-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--editor-foreground, #cccccc);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.window-view-close {
    margin-left: 8px;
    padding: 4px;
}

.window-view-content {
    flex: 1;
    overflow: auto;
    padding: 8px;
}

.window-view-resize-handle {
    position: absolute;
    background-color: transparent;
    z-index: 1;
}

.window-view-resize-left {
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: ew-resize;
}

.window-view-resize-right {
    right: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: ew-resize;
}

.window-view-resize-bottom {
    left: 0;
    right: 0;
    bottom: 0;
    height: 4px;
    cursor: ns-resize;
}
</style>
