<template>
    <div class="color-picker-view">
        <div class="color-picker-main">
            <!-- 颜色选择矩形（饱和度/亮度） -->
            <div
                ref="colorRectRef"
                class="color-picker-rect"
                @mousedown="onColorRectMouseDown"
            >
                <canvas ref="colorRectCanvasRef" class="color-picker-canvas" />
                <div
                    ref="colorRectPosRef"
                    class="color-picker-pos"
                    :style="colorRectPosStyle"
                />
            </div>

            <!-- 色相条（垂直渐变） -->
            <div
                ref="hueBarRef"
                class="color-picker-hue-bar"
                @mousedown="onHueBarMouseDown"
            >
                <canvas ref="hueBarCanvasRef" class="color-picker-canvas" />
                <div
                    ref="hueBarPosRef"
                    class="color-picker-pos"
                    :style="hueBarPosStyle"
                />
            </div>
        </div>

        <!-- RGB 输入框 -->
        <div class="color-picker-inputs">
            <div class="color-picker-input-row">
                <label>R:</label>
                <el-input-number
                    :model-value="rValue"
                    :min="0"
                    :max="255"
                    :disabled="!editable"
                    size="small"
                    @update:model-value="onRChange"
                />
            </div>
            <div class="color-picker-input-row">
                <label>G:</label>
                <el-input-number
                    :model-value="gValue"
                    :min="0"
                    :max="255"
                    :disabled="!editable"
                    size="small"
                    @update:model-value="onGChange"
                />
            </div>
            <div class="color-picker-input-row">
                <label>B:</label>
                <el-input-number
                    :model-value="bValue"
                    :min="0"
                    :max="255"
                    :disabled="!editable"
                    size="small"
                    @update:model-value="onBChange"
                />
            </div>
            <div v-if="isColor4" class="color-picker-input-row">
                <label>A:</label>
                <el-input-number
                    :model-value="aValue"
                    :min="0"
                    :max="255"
                    :disabled="!editable"
                    size="small"
                    @update:model-value="onAChange"
                />
            </div>
            <div class="color-picker-input-row">
                <label>#:</label>
                <el-input
                    :model-value="hexValue"
                    :disabled="!editable"
                    size="small"
                    style="width: 80px"
                    @update:model-value="onHexChange"
                    @focus="hexFocusIn = true"
                    @blur="hexFocusIn = false; updateFromHex()"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Color3, Color4, Gradient, ImageUtil, mathUtil, Vector2, watcher, windowEventProxy } from 'feng3d';

const props = withDefaults(defineProps<{
    color: Color3 | Color4;
    editable?: boolean;
}>(), {
    editable: true,
});

const emit = defineEmits<{
    change: [color: Color3 | Color4];
}>();

const colors = [0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0xff00ff, 0xff0000];

const colorRectRef = ref<HTMLElement | null>(null);
const colorRectCanvasRef = ref<HTMLCanvasElement | null>(null);
const colorRectPosRef = ref<HTMLElement | null>(null);
const hueBarRef = ref<HTMLElement | null>(null);
const hueBarCanvasRef = ref<HTMLCanvasElement | null>(null);
const hueBarPosRef = ref<HTMLElement | null>(null);

const isColor4 = computed(() => props.color instanceof Color4);

// 当前颜色状态
const baseColor = ref(new Color3(1, 0, 0)); // 基色（色相）
const rw = ref(0); // 颜色矩形横向位置 (0-1)
const rh = ref(0); // 颜色矩形纵向位置 (0-1)
const ratio = ref(0); // 色相条位置 (0-1)

// 鼠标拖拽状态
const mouseDownGroup = ref<'colorRect' | 'hueBar' | null>(null);

// RGB 值
const rValue = computed(() => Math.round(props.color.r * 255));
const gValue = computed(() => Math.round(props.color.g * 255));
const bValue = computed(() => Math.round(props.color.b * 255));
const aValue = computed(() => isColor4.value ? Math.round((props.color as Color4).a * 255) : 255);
const hexValue = computed(() => props.color.toHexString().substr(1));
const hexFocusIn = ref(false);

// 位置样式
const colorRectPosStyle = computed(() => {
    if (!colorRectRef.value || !colorRectPosRef.value) return {};
    const width = colorRectRef.value.clientWidth;
    const height = colorRectRef.value.clientHeight;
    return {
        left: `${rw.value * (width - (colorRectPosRef.value.clientWidth || 8))}px`,
        top: `${rh.value * (height - (colorRectPosRef.value.clientHeight || 8))}px`,
    };
});

const hueBarPosStyle = computed(() => {
    if (!hueBarRef.value || !hueBarPosRef.value) return {};
    const height = hueBarRef.value.clientHeight;
    return {
        top: `${ratio.value * (height - (hueBarPosRef.value.clientHeight || 8))}px`,
    };
});

// 绘制颜色矩形（饱和度/亮度）
function drawColorRect() {
    if (!colorRectCanvasRef.value || !colorRectRef.value) return;
    
    const canvas = colorRectCanvasRef.value;
    const width = colorRectRef.value.clientWidth;
    const height = colorRectRef.value.clientHeight;
    
    if (width <= 0 || height <= 0) return;
    
    canvas.width = width;
    canvas.height = height;
    
    try {
        const imageUtil = new ImageUtil(width, height);
        imageUtil.drawColorPickerRect(baseColor.value.toInt());
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
        console.warn('Failed to draw color rect:', e);
    }
}

// 绘制色相条
function drawHueBar() {
    if (!hueBarCanvasRef.value || !hueBarRef.value) return;
    
    const canvas = hueBarCanvasRef.value;
    const width = hueBarRef.value.clientWidth;
    const height = hueBarRef.value.clientHeight;
    
    if (width <= 0 || height <= 0) return;
    
    canvas.width = width;
    canvas.height = height;
    
    try {
        const gradient = new Gradient().fromColors(colors);
        const imageUtil = new ImageUtil(width, height);
        imageUtil.drawMinMaxGradient(gradient, false);
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
        console.warn('Failed to draw hue bar:', e);
    }
}

// 更新视图
function updateView() {
    if (hexFocusIn.value) return; // 如果正在编辑 Hex，不更新
    
    // 从颜色计算位置
    const result = getColorPickerRectPosition(props.color.toInt());
    baseColor.value = result.color;
    rw.value = result.ratioW;
    rh.value = result.ratioH;
    ratio.value = getMixColorRatio(baseColor.value.toInt(), colors);
    
    // 重新绘制
    nextTick(() => {
        drawColorRect();
    });
}

// 颜色矩形鼠标按下
function onColorRectMouseDown(event: MouseEvent) {
    if (!props.editable) return;
    mouseDownGroup.value = 'colorRect';
    onColorRectMouseMove(event);
    windowEventProxy.on('mousemove', onColorRectMouseMove);
    windowEventProxy.on('mouseup', onMouseUp);
}

// 颜色矩形鼠标移动
function onColorRectMouseMove(event: any) {
    if (!colorRectRef.value || mouseDownGroup.value !== 'colorRect') return;
    
    const clientX = event.clientX ?? event.data?.clientX ?? 0;
    const clientY = event.clientY ?? event.data?.clientY ?? 0;
    
    const rect = colorRectRef.value.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const width = colorRectRef.value.clientWidth;
    const height = colorRectRef.value.clientHeight;
    
    rw.value = mathUtil.clamp(x / width, 0, 1);
    rh.value = mathUtil.clamp(y / height, 0, 1);
    
    const color = getColorPickerRectAtPosition(baseColor.value.toInt(), rw.value, rh.value);
    updateColor(color);
}

// 色相条鼠标按下
function onHueBarMouseDown(event: MouseEvent) {
    if (!props.editable) return;
    mouseDownGroup.value = 'hueBar';
    onHueBarMouseMove(event);
    windowEventProxy.on('mousemove', onHueBarMouseMove);
    windowEventProxy.on('mouseup', onMouseUp);
}

// 色相条鼠标移动
function onHueBarMouseMove(event: any) {
    if (!hueBarRef.value || mouseDownGroup.value !== 'hueBar') return;
    
    const clientY = event.clientY ?? event.data?.clientY ?? 0;
    
    const rect = hueBarRef.value.getBoundingClientRect();
    const y = clientY - rect.top;
    
    const height = hueBarRef.value.clientHeight;
    ratio.value = mathUtil.clamp(y / height, 0, 1);
    
    baseColor.value = getMixColorAtRatio(ratio.value, colors);
    
    const color = getColorPickerRectAtPosition(baseColor.value.toInt(), rw.value, rh.value);
    updateColor(color);
    
    // 重新绘制颜色矩形
    nextTick(() => {
        drawColorRect();
    });
}

// 鼠标抬起
function onMouseUp() {
    mouseDownGroup.value = null;
    windowEventProxy.off('mousemove', onColorRectMouseMove);
    windowEventProxy.off('mousemove', onHueBarMouseMove);
    windowEventProxy.off('mouseup', onMouseUp);
}

// 更新颜色
function updateColor(color: Color3) {
    if (props.color instanceof Color4) {
        const newColor = new Color4(color.r, color.g, color.b, props.color.a);
        (props.color as any).r = newColor.r;
        (props.color as any).g = newColor.g;
        (props.color as any).b = newColor.b;
    } else {
        (props.color as any).r = color.r;
        (props.color as any).g = color.g;
        (props.color as any).b = color.b;
    }
    emit('change', props.color);
}

// RGB 变化
function onRChange(value: number | undefined) {
    if (value !== undefined) {
        (props.color as any).r = value / 255;
        updateView();
        emit('change', props.color);
    }
}

function onGChange(value: number | undefined) {
    if (value !== undefined) {
        (props.color as any).g = value / 255;
        updateView();
        emit('change', props.color);
    }
}

function onBChange(value: number | undefined) {
    if (value !== undefined) {
        (props.color as any).b = value / 255;
        updateView();
        emit('change', props.color);
    }
}

function onAChange(value: number | undefined) {
    if (value !== undefined && isColor4.value) {
        (props.color as Color4).a = value / 255;
        emit('change', props.color);
    }
}

// Hex 变化
function onHexChange(value: string | null) {
    // 仅更新显示，实际更新在 blur 时
}

function updateFromHex() {
    if (!hexValue.value) return;
    
    try {
        const num = parseInt(hexValue.value, 16);
        const color = props.color instanceof Color4 
            ? new Color4().fromUnit(num)
            : new Color3().fromUnit(num);
        
        if (props.color instanceof Color4) {
            (props.color as any).r = color.r;
            (props.color as any).g = color.g;
            (props.color as any).b = color.b;
        } else {
            (props.color as any).r = color.r;
            (props.color as any).g = color.g;
            (props.color as any).b = color.b;
        }
        
        updateView();
        emit('change', props.color);
    } catch (e) {
        // 解析失败，恢复原值
        updateView();
    }
}

// 辅助函数：获取颜色选择矩形位置
function getColorPickerRectPosition(color: number) {
    const black = new Color3(0, 0, 0);
    const white = new Color3(1, 1, 1);
    
    let c = new Color3().fromUnit(color);
    const max = Math.max(c.r, c.g, c.b);
    if (max !== 0) {
        c = black.mix(c, 1 / max);
    }
    const min = Math.min(c.r, c.g, c.b);
    if (min !== 1) {
        c = white.mix(c, 1 / (1 - min));
    }
    const ratioH = 1 - max;
    const ratioW = 1 - min;
    
    return {
        color: c,
        ratioW,
        ratioH,
    };
}

// 辅助函数：获取混合颜色比例
function getMixColorRatio(color: number, colors: number[], ratios?: number[]) {
    if (!ratios) {
        ratios = [];
        for (let i = 0; i < colors.length; i++) {
            ratios[i] = i / (colors.length - 1);
        }
    }
    
    const colors1 = colors.map((v) => new Color3().fromUnit(v));
    const c = new Color3().fromUnit(color);
    
    const r = c.r;
    const g = c.g;
    const b = c.b;
    
    for (let i = 0; i < colors1.length - 1; i++) {
        const c0 = colors1[i];
        const c1 = colors1[i + 1];
        if (c.equals(c0)) return ratios[i];
        if (c.equals(c1)) return ratios[i + 1];
        
        const r1 = c0.r + c1.r;
        const g1 = c0.g + c1.g;
        const b1 = c0.b + c1.b;
        
        const v = r * r1 + g * g1 + b * b1;
        if (v > 2) {
            let result = 0;
            if (r1 === 1) {
                result = mathUtil.mapLinear(r, c0.r, c1.r, ratios[i], ratios[i + 1]);
            } else if (g1 === 1) {
                result = mathUtil.mapLinear(g, c0.g, c1.g, ratios[i], ratios[i + 1]);
            } else if (b1 === 1) {
                result = mathUtil.mapLinear(b, c0.b, c1.b, ratios[i], ratios[i + 1]);
            }
            return result;
        }
    }
    
    return 0;
}

// 辅助函数：获取颜色选择矩形位置的颜色
function getColorPickerRectAtPosition(color: number, rw: number, rh: number) {
    const leftTop = new Color3(1, 1, 1);
    const rightTop = new Color3().fromUnit(color);
    const leftBottom = new Color3(0, 0, 0);
    const rightBottom = new Color3(0, 0, 0);
    
    const top = leftTop.mixTo(rightTop, rw);
    const bottom = leftBottom.mixTo(rightBottom, rw);
    const v = top.mixTo(bottom, rh);
    
    return v;
}

// 辅助函数：获取混合颜色
function getMixColorAtRatio(ratio: number, colors: number[], ratios?: number[]) {
    if (!ratios) {
        ratios = [];
        for (let i = 0; i < colors.length; i++) {
            ratios[i] = i / (colors.length - 1);
        }
    }
    
    const colors1 = colors.map((v) => new Color3().fromUnit(v));
    
    for (let i = 0; i < colors1.length - 1; i++) {
        if (ratios[i] <= ratio && ratio <= ratios[i + 1]) {
            const mix = mathUtil.mapLinear(ratio, ratios[i], ratios[i + 1], 0, 1);
            const c = colors1[i].mixTo(colors1[i + 1], mix);
            return c;
        }
    }
    
    return colors1[0];
}

// 监听尺寸变化
const resizeObserver1 = ref<ResizeObserver | null>(null);
const resizeObserver2 = ref<ResizeObserver | null>(null);

onMounted(() => {
    updateView();
    drawHueBar();
    
    // 监听颜色变化
    watcher.watch(props.color as any, 'r' as any, updateView);
    watcher.watch(props.color as any, 'g' as any, updateView);
    watcher.watch(props.color as any, 'b' as any, updateView);
    if (isColor4.value) {
        watcher.watch(props.color as any, 'a' as any, () => {
            emit('change', props.color);
        });
    }
    
    // 监听尺寸变化
    if (colorRectRef.value) {
        resizeObserver1.value = new ResizeObserver(() => {
            nextTick(() => {
                drawColorRect();
                updateView();
            });
        });
        resizeObserver1.value.observe(colorRectRef.value);
    }
    
    if (hueBarRef.value) {
        resizeObserver2.value = new ResizeObserver(() => {
            nextTick(() => {
                drawHueBar();
                updateView();
            });
        });
        resizeObserver2.value.observe(hueBarRef.value);
    }
});

onUnmounted(() => {
    if (resizeObserver1.value) {
        resizeObserver1.value.disconnect();
    }
    if (resizeObserver2.value) {
        resizeObserver2.value.disconnect();
    }
    
    watcher.unwatch(props.color as any, 'r' as any, updateView);
    watcher.unwatch(props.color as any, 'g' as any, updateView);
    watcher.unwatch(props.color as any, 'b' as any, updateView);
    if (isColor4.value) {
        watcher.unwatch(props.color as any, 'a' as any, () => {});
    }
    
    windowEventProxy.off('mousemove', onColorRectMouseMove);
    windowEventProxy.off('mousemove', onHueBarMouseMove);
    windowEventProxy.off('mouseup', onMouseUp);
});

// 监听颜色变化
watch(() => props.color, () => {
    if (!mouseDownGroup.value && !hexFocusIn.value) {
        updateView();
    }
}, { deep: true });
</script>

<style scoped>
.color-picker-view {
    padding: 8px;
    background-color: var(--editor-background, #1d1d1d);
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 4px;
}

.color-picker-main {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.color-picker-rect {
    position: relative;
    width: 200px;
    height: 200px;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    cursor: crosshair;
}

.color-picker-hue-bar {
    position: relative;
    width: 20px;
    height: 200px;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    cursor: crosshair;
}

.color-picker-canvas {
    width: 100%;
    height: 100%;
    display: block;
}

.color-picker-pos {
    position: absolute;
    width: 8px;
    height: 8px;
    border: 2px solid #fff;
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.color-picker-inputs {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.color-picker-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.color-picker-input-row label {
    width: 20px;
    font-size: 12px;
    color: var(--editor-foreground, #cccccc);
}
</style>
