<template>
    <div class="gradient-editor">
        <!-- 模式选择 -->
        <div class="gradient-editor-header">
            <label>Mode:</label>
            <ComboBox
                :data-provider="modeOptions"
                :data="selectedMode"
                @change="onModeChange"
            />
        </div>

        <!-- 渐变预览区域 -->
        <div class="gradient-editor-preview">
            <!-- 透明度关键点线 -->
            <div
                ref="alphaLineGroupRef"
                class="gradient-editor-line-group gradient-editor-alpha-line"
                @mousedown="onAlphaLineMouseDown"
            >
                <canvas ref="alphaLineCanvasRef" class="gradient-editor-line-canvas" />
            </div>

            <!-- 渐变预览图像 -->
            <div class="gradient-editor-color-image-container">
                <canvas ref="colorImageCanvasRef" class="gradient-editor-color-image" />
            </div>

            <!-- 颜色关键点线 -->
            <div
                ref="colorLineGroupRef"
                class="gradient-editor-line-group gradient-editor-color-line"
                @mousedown="onColorLineMouseDown"
            >
                <canvas ref="colorLineCanvasRef" class="gradient-editor-line-canvas" />
            </div>
        </div>

        <!-- 控制器组 -->
        <div v-if="selectedKey" class="gradient-editor-controller">
            <!-- 颜色控制器 -->
            <div v-if="selectedKey.color" class="gradient-editor-controller-row">
                <label>Color:</label>
                <ColorPickerView
                    :color="selectedKey.color"
                    :editable="true"
                    @change="onColorChange"
                />
            </div>

            <!-- Alpha 控制器 -->
            <div v-else class="gradient-editor-controller-row">
                <label>Alpha:</label>
                <el-slider
                    :model-value="alphaValue"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    style="width: 120px"
                    @update:model-value="onAlphaChange"
                />
                <el-input-number
                    :model-value="alphaValue"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    :precision="2"
                    size="small"
                    style="width: 80px"
                    @update:model-value="onAlphaChange"
                />
            </div>

            <!-- Location 控制器 -->
            <div class="gradient-editor-controller-row">
                <label>Location:</label>
                <el-input-number
                    :model-value="locationValue"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    :precision="2"
                    size="small"
                    style="width: 100px"
                    @update:model-value="onLocationChange"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Color3, Color4, Gradient, GradientMode, ImageUtil, Rectangle, Vector2, watcher, windowEventProxy } from 'feng3d';
import ComboBox from './ComboBox.vue';
import ColorPickerView from './ColorPickerView.vue';

const props = withDefaults(defineProps<{
    gradient: Gradient;
    editable?: boolean;
}>(), {
    editable: true,
});

const emit = defineEmits<{
    change: [gradient: Gradient];
}>();

// Refs
const alphaLineGroupRef = ref<HTMLElement | null>(null);
const alphaLineCanvasRef = ref<HTMLCanvasElement | null>(null);
const colorLineGroupRef = ref<HTMLElement | null>(null);
const colorLineCanvasRef = ref<HTMLCanvasElement | null>(null);
const colorImageCanvasRef = ref<HTMLCanvasElement | null>(null);

// 模式选项
const modeOptions = computed(() => {
    const list: Array<{ label: string; value: GradientMode }> = [];
    for (const key in GradientMode) {
        if (isNaN(Number(key))) {
            list.push({ label: key, value: GradientMode[key as keyof typeof GradientMode] });
        }
    }
    return list;
});

const selectedMode = computed(() => {
    return modeOptions.value.find(v => v.value === props.gradient.mode) || modeOptions.value[0];
});

// 选中的关键点
const selectedKey = ref<{ time: number; alpha?: number; color?: Color3 } | null>(null);

const alphaValue = computed(() => {
    if (selectedKey.value && selectedKey.value.alpha !== undefined) {
        return selectedKey.value.alpha;
    }
    return 0;
});

const locationValue = computed(() => {
    if (selectedKey.value) {
        return selectedKey.value.time;
    }
    return 0;
});

// 鼠标拖拽状态
const mouseDownLineGroup = ref<'alpha' | 'color' | null>(null);
const removedTemp = ref(false);

// 绘制渐变预览
function drawGradientPreview() {
    if (!colorImageCanvasRef.value || !alphaLineGroupRef.value) return;
    
    const canvas = colorImageCanvasRef.value;
    const width = alphaLineGroupRef.value.clientWidth;
    const height = 50;
    
    if (width <= 0 || height <= 0) return;
    
    canvas.width = width;
    canvas.height = height;
    
    try {
        const imageUtil = new ImageUtil(width, height);
        imageUtil.drawMinMaxGradient(props.gradient);
        const dataURL = imageUtil.toDataURL();
        
        if (dataURL) {
            const img = new Image();
            img.onload = () => {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0);
                }
            };
            img.src = dataURL;
        }
    } catch (e) {
        console.warn('Failed to draw gradient preview:', e);
    }
}

// 绘制 Alpha 关键点
function drawAlphaKeys() {
    if (!alphaLineCanvasRef.value || !alphaLineGroupRef.value) return;
    
    const canvas = alphaLineCanvasRef.value;
    const width = alphaLineGroupRef.value.clientWidth;
    const height = alphaLineGroupRef.value.clientHeight;
    
    if (width <= 0 || height <= 0) return;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);
    
    const alphaKeys = props.gradient.alphaKeys;
    for (let i = 0; i < alphaKeys.length; i++) {
        const key = alphaKeys[i];
        const isSelected = selectedKey.value === key;
        drawAlphaKey(ctx, key.time, key.alpha, width, height, isSelected);
    }
}

// 绘制单个 Alpha 关键点
function drawAlphaKey(ctx: CanvasRenderingContext2D, time: number, alpha: number, width: number, height: number, selected: boolean) {
    const x = time * width;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.strokeStyle = selected ? '#0091ff' : '#606060';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x - 5, height - 10);
    ctx.lineTo(x - 5, height - 15);
    ctx.lineTo(x + 5, height - 15);
    ctx.lineTo(x + 5, height - 10);
    ctx.lineTo(x, height);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
}

// 绘制 Color 关键点
function drawColorKeys() {
    if (!colorLineCanvasRef.value || !colorLineGroupRef.value) return;
    
    const canvas = colorLineCanvasRef.value;
    const width = colorLineGroupRef.value.clientWidth;
    const height = colorLineGroupRef.value.clientHeight;
    
    if (width <= 0 || height <= 0) return;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);
    
    const colorKeys = props.gradient.colorKeys;
    for (let i = 0; i < colorKeys.length; i++) {
        const key = colorKeys[i];
        const isSelected = selectedKey.value === key;
        drawColorKey(ctx, key.time, key.color, width, height, isSelected);
    }
}

// 绘制单个 Color 关键点
function drawColorKey(ctx: CanvasRenderingContext2D, time: number, color: Color3, width: number, height: number, selected: boolean) {
    const x = time * width;
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.strokeStyle = selected ? '#0091ff' : '#606060';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 5, 10);
    ctx.lineTo(x - 5, 15);
    ctx.lineTo(x + 5, 15);
    ctx.lineTo(x + 5, 10);
    ctx.lineTo(x, 0);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
}

// 更新视图
function updateView() {
    nextTick(() => {
        drawGradientPreview();
        drawAlphaKeys();
        drawColorKeys();
    });
}

// Alpha 线鼠标按下
function onAlphaLineMouseDown(event: MouseEvent) {
    if (!props.editable || !alphaLineGroupRef.value) return;
    
    mouseDownLineGroup.value = 'alpha';
    const rect = alphaLineGroupRef.value.getBoundingClientRect();
    const localPosX = event.clientX - rect.left;
    const time = Math.max(0, Math.min(1, localPosX / rect.width));
    
    // 检查是否点击了现有关键点
    const alphaKeys = props.gradient.alphaKeys;
    let onClickIndex = -1;
    for (let i = 0; i < alphaKeys.length; i++) {
        const key = alphaKeys[i];
        if (Math.abs(key.time * rect.width - localPosX) < 8) {
            onClickIndex = i;
            break;
        }
    }
    
    if (onClickIndex !== -1) {
        selectedKey.value = alphaKeys[onClickIndex];
    } else if (alphaKeys.length < 8) {
        const newKey = { time, alpha: props.gradient.getAlpha(time) };
        selectedKey.value = newKey;
        alphaKeys.push(newKey);
        alphaKeys.sort((a, b) => a.time - b.time);
    }
    
    removedTemp.value = false;
    updateView();
    
    windowEventProxy.on('mousemove', onAlphaColorMouseMove);
    windowEventProxy.on('mouseup', onAlphaColorMouseUp);
}

// Color 线鼠标按下
function onColorLineMouseDown(event: MouseEvent) {
    if (!props.editable || !colorLineGroupRef.value) return;
    
    mouseDownLineGroup.value = 'color';
    const rect = colorLineGroupRef.value.getBoundingClientRect();
    const localPosX = event.clientX - rect.left;
    const time = Math.max(0, Math.min(1, localPosX / rect.width));
    
    // 检查是否点击了现有关键点
    const colorKeys = props.gradient.colorKeys;
    let onClickIndex = -1;
    for (let i = 0; i < colorKeys.length; i++) {
        const key = colorKeys[i];
        if (Math.abs(key.time * rect.width - localPosX) < 8) {
            onClickIndex = i;
            break;
        }
    }
    
    if (onClickIndex !== -1) {
        selectedKey.value = colorKeys[onClickIndex];
    } else if (colorKeys.length < 8) {
        const newKey = { time, color: props.gradient.getColor(time) };
        selectedKey.value = newKey;
        colorKeys.push(newKey);
        colorKeys.sort((a, b) => a.time - b.time);
    }
    
    removedTemp.value = false;
    updateView();
    
    windowEventProxy.on('mousemove', onAlphaColorMouseMove);
    windowEventProxy.on('mouseup', onAlphaColorMouseUp);
}

// Alpha/Color 鼠标移动
function onAlphaColorMouseMove() {
    if (!selectedKey.value || !mouseDownLineGroup.value) return;
    
    const lineGroup = mouseDownLineGroup.value === 'alpha' ? alphaLineGroupRef.value : colorLineGroupRef.value;
    if (!lineGroup) return;
    
    const rect = lineGroup.getBoundingClientRect();
    const mousePos = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
    const expandedRect = new Rectangle(rect.left, rect.top, rect.width, rect.height);
    expandedRect.inflate(8, 8);
    
    if (expandedRect.containsPoint(mousePos)) {
        if (removedTemp.value) {
            // 重新添加关键点
            if (selectedKey.value.color) {
                const index = props.gradient.colorKeys.indexOf(selectedKey.value as any);
                if (index === -1) {
                    props.gradient.colorKeys.push(selectedKey.value as any);
                }
                props.gradient.colorKeys.sort((a, b) => a.time - b.time);
            } else {
                const index = props.gradient.alphaKeys.indexOf(selectedKey.value as any);
                if (index === -1) {
                    props.gradient.alphaKeys.push(selectedKey.value as any);
                }
                props.gradient.alphaKeys.sort((a, b) => a.time - b.time);
            }
            removedTemp.value = false;
        }
    } else {
        if (!removedTemp.value) {
            // 移除关键点
            if (selectedKey.value.color) {
                const index = props.gradient.colorKeys.indexOf(selectedKey.value as any);
                if (index !== -1) {
                    props.gradient.colorKeys.splice(index, 1);
                }
                props.gradient.colorKeys.sort((a, b) => a.time - b.time);
            } else {
                const index = props.gradient.alphaKeys.indexOf(selectedKey.value as any);
                if (index !== -1) {
                    props.gradient.alphaKeys.splice(index, 1);
                }
                props.gradient.alphaKeys.sort((a, b) => a.time - b.time);
            }
            removedTemp.value = true;
        }
    }
    
    // 更新位置
    const localPosX = windowEventProxy.clientX - rect.left;
    selectedKey.value.time = Math.max(0, Math.min(1, localPosX / rect.width));
    
    if (selectedKey.value.color) {
        props.gradient.colorKeys.sort((a, b) => a.time - b.time);
    } else {
        props.gradient.alphaKeys.sort((a, b) => a.time - b.time);
    }
    
    updateView();
    emit('change', props.gradient);
}

// Alpha/Color 鼠标抬起
function onAlphaColorMouseUp() {
    if (removedTemp.value) {
        selectedKey.value = null;
    }
    mouseDownLineGroup.value = null;
    windowEventProxy.off('mousemove', onAlphaColorMouseMove);
    windowEventProxy.off('mouseup', onAlphaColorMouseUp);
    updateView();
}

// 模式变化
function onModeChange(item: { label: string; value: GradientMode } | null) {
    if (item) {
        props.gradient.mode = item.value;
        updateView();
        emit('change', props.gradient);
    }
}

// 颜色变化
function onColorChange(color: Color3 | Color4) {
    if (selectedKey.value && selectedKey.value.color) {
        selectedKey.value.color.r = color.r;
        selectedKey.value.color.g = color.g;
        selectedKey.value.color.b = color.b;
        updateView();
        emit('change', props.gradient);
    }
}

// Alpha 变化
function onAlphaChange(value: number | undefined) {
    if (value !== undefined && selectedKey.value && selectedKey.value.alpha !== undefined) {
        selectedKey.value.alpha = Math.max(0, Math.min(1, value));
        updateView();
        emit('change', props.gradient);
    }
}

// Location 变化
function onLocationChange(value: number | undefined) {
    if (value !== undefined && selectedKey.value) {
        selectedKey.value.time = Math.max(0, Math.min(1, value));
        
        if (selectedKey.value.color) {
            props.gradient.colorKeys.sort((a, b) => a.time - b.time);
        } else {
            props.gradient.alphaKeys.sort((a, b) => a.time - b.time);
        }
        
        updateView();
        emit('change', props.gradient);
    }
}

// 监听尺寸变化
const resizeObserver1 = ref<ResizeObserver | null>(null);
const resizeObserver2 = ref<ResizeObserver | null>(null);
const resizeObserver3 = ref<ResizeObserver | null>(null);

onMounted(() => {
    // 初始化选中第一个颜色关键点
    if (props.gradient.colorKeys.length > 0) {
        selectedKey.value = props.gradient.colorKeys[0] as any;
    } else if (props.gradient.alphaKeys.length > 0) {
        selectedKey.value = props.gradient.alphaKeys[0] as any;
    }
    
    updateView();
    
    // 监听渐变变化
    watcher.watch(props.gradient, 'mode' as any, updateView);
    watcher.watch(props.gradient, 'alphaKeys' as any, updateView);
    watcher.watch(props.gradient, 'colorKeys' as any, updateView);
    
    // 监听尺寸变化
    if (alphaLineGroupRef.value) {
        resizeObserver1.value = new ResizeObserver(() => {
            updateView();
        });
        resizeObserver1.value.observe(alphaLineGroupRef.value);
    }
    
    if (colorLineGroupRef.value) {
        resizeObserver2.value = new ResizeObserver(() => {
            updateView();
        });
        resizeObserver2.value.observe(colorLineGroupRef.value);
    }
    
    if (colorImageCanvasRef.value?.parentElement) {
        resizeObserver3.value = new ResizeObserver(() => {
            updateView();
        });
        resizeObserver3.value.observe(colorImageCanvasRef.value.parentElement);
    }
});

onUnmounted(() => {
    if (resizeObserver1.value) {
        resizeObserver1.value.disconnect();
    }
    if (resizeObserver2.value) {
        resizeObserver2.value.disconnect();
    }
    if (resizeObserver3.value) {
        resizeObserver3.value.disconnect();
    }
    
    watcher.unwatch(props.gradient, 'mode' as any, updateView);
    watcher.unwatch(props.gradient, 'alphaKeys' as any, updateView);
    watcher.unwatch(props.gradient, 'colorKeys' as any, updateView);
    
    windowEventProxy.off('mousemove', onAlphaColorMouseMove);
    windowEventProxy.off('mouseup', onAlphaColorMouseUp);
});

// 监听渐变变化
watch(() => props.gradient, () => {
    if (!mouseDownLineGroup.value) {
        updateView();
    }
}, { deep: true });
</script>

<style scoped>
.gradient-editor {
    padding: 10px;
    background-color: var(--editor-background, #1d1d1d);
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 4px;
    min-width: 300px;
}

.gradient-editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.gradient-editor-header label {
    font-size: 12px;
    color: var(--editor-foreground, #cccccc);
}

.gradient-editor-preview {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 10px;
}

.gradient-editor-line-group {
    position: relative;
    height: 15px;
    width: 100%;
    cursor: crosshair;
}

.gradient-editor-line-canvas {
    width: 100%;
    height: 100%;
    display: block;
}

.gradient-editor-color-image-container {
    position: relative;
    height: 50px;
    width: 100%;
    background-image: url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A');
    background-repeat: repeat;
}

.gradient-editor-color-image {
    width: 100%;
    height: 100%;
    display: block;
}

.gradient-editor-controller {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    background-color: var(--sideBar-background, #2d2d2d);
    border-radius: 4px;
}

.gradient-editor-controller-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.gradient-editor-controller-row label {
    width: 60px;
    font-size: 12px;
    color: var(--editor-foreground, #cccccc);
    flex-shrink: 0;
}
</style>
