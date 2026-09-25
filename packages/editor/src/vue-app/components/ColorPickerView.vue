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
            <div v-if="hasAlpha" class="color-picker-input-row">
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
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Gradient, ImageUtil, mathUtil, Vector2, watcher, windowEventProxy } from 'feng3d';
import type { Color3, Color4 } from 'feng3d';
import {
    COLOR3_BLACK,
    COLOR3_WHITE,
    color3Equals,
    color3FromUnit,
    color3Mix,
    color3Scale,
    color4ToColor3,
    colorRgb,
    colorToHexString,
    colorToInt,
    isColor4,
    type ColorLike,
    type WritableColorLike,
} from '../../utils/colorUtils';

/**
 * 待编辑的颜色。
 *
 * 用读取型的 `ColorLike`（只读 r/g/b/a）而非 `Color3 | Color4`：选择器会在**传入对象上原地写入**，
 * 而调用方传进来的颜色可能是 `@feng3d/math` 的 class 版 Color3（无 `__type__`）——
 * 例如 `GradientEditor` 里 `Gradient.colorKeys[i].color`（`Gradient.getColor()` 会在其上调用
 * `mixTo()`，不能用纯数据字面量替换）。纯数据 Color3 / Color4 天然满足 `ColorLike`。
 */
const props = withDefaults(defineProps<{
    color: ColorLike;
    editable?: boolean;
}>(), {
    editable: true,
});

/**
 * 变更事件。
 *
 * 参数用读取型 `ColorLike`，与 `color` prop 保持同一类型口径：本视图会**原地修改**传入的颜色
 * 对象（可能是纯数据 `Color4`，也可能是 `@feng3d/math` 的 class 版 Color3），事件只是把同一个
 * 对象交回父级，不构造也不断言其形状（见 utils/colorUtils.ts 的形态边界说明）。
 */
const emit = defineEmits<{
    change: [color: ColorLike];
}>();

const colors = [0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0xff00ff, 0xff0000];

const colorRectRef = ref<HTMLElement | null>(null);
const colorRectCanvasRef = ref<HTMLCanvasElement | null>(null);
const colorRectPosRef = ref<HTMLElement | null>(null);
const hueBarRef = ref<HTMLElement | null>(null);
const hueBarCanvasRef = ref<HTMLCanvasElement | null>(null);
const hueBarPosRef = ref<HTMLElement | null>(null);

// 是否带 alpha 通道（旧写法用 `instanceof Color4`，运行时因 Color4 是 interface 而抛错，改为 `__type__` 判别）
const hasAlpha = computed(() => isColor4(props.color));

// 当前颜色状态
const baseColor = ref<Color3>(color3FromUnit(0xff0000)); // 基色（色相）
const rw = ref(0); // 颜色矩形横向位置 (0-1)
const rh = ref(0); // 颜色矩形纵向位置 (0-1)
const ratio = ref(0); // 色相条位置 (0-1)

// 鼠标拖拽状态
const mouseDownGroup = ref<'colorRect' | 'hueBar' | null>(null);

// RGB 值（经 readColor 的响应式快照读取，写入后才能驱动这些输入框刷新）
const rValue = computed(() => Math.round(readColor().r * 255));
const gValue = computed(() => Math.round(readColor().g * 255));
const bValue = computed(() => Math.round(readColor().b * 255));
const aValue = computed(() => hasAlpha.value ? Math.round(readColor().a * 255) : 255);
const hexValue = computed(() =>
{
    const c = readColor();
    // Color3 只显示 RRGGBB；Color4 显示 AARRGGBB（与旧 `toHexString()` 一致）
    const hexColor = hasAlpha.value ? c : color4ToColor3(c);
    return colorToHexString(hexColor).substring(1);
});
const hexFocusIn = ref(false);

/**
 * 当前颜色的响应式快照。
 *
 * `props.color` 是**原始对象**（Vue 的 props 为 shallowReactive，不代理嵌套对象），
 * 直接读 `props.color.r` 建立不了响应式依赖，输入框不会随颜色变化刷新；
 * 这里在闭包内用 `reactive()` 代理读取并返回普通数值快照——
 * 代理不逃出闭包（根规范 §8.2：不返回响应式对象、不把代理当参数传）。
 * 与下方 `writeChannel` 写的是同一个（按 raw 对象缓存的）代理，写入后自动失效重算。
 */
function readColor(): Color4
{
    const r_color = reactive(props.color);

    return {
        __type__: 'Color4',
        r: r_color.r ?? 1,
        g: r_color.g ?? 1,
        b: r_color.b ?? 1,
        a: (r_color as Color4).a ?? 1,
    };
}

/**
 * 写入单个颜色分量。
 *
 * 纯数据接口的字段类型上是 readonly，直接赋值报 TS2540，必须经 `reactive()` 代理写入
 * （根规范 §8.5 / §11.3；`as WritableColorLike` 只断言去掉 readonly，不改变运行时）。
 * 注：`@feng3d/watcher` 在原始对象上以访问器（`Object.defineProperty`）实现监听，
 * 因此经代理写入同样会触发本组件里的 `watcher.watch(..., updateView)`。
 */
function writeChannel(channel: 'r' | 'g' | 'b' | 'a', value: number)
{
    const r_color = reactive(props.color) as WritableColorLike;
    r_color[channel] = value;
}

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
        imageUtil.drawColorPickerRect(colorToInt(baseColor.value));
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
    const result = getColorPickerRectPosition(colorToInt(readColor()));
    baseColor.value = result.color;
    rw.value = result.ratioW;
    rh.value = result.ratioH;
    ratio.value = getMixColorRatio(colorToInt(baseColor.value), colors);
    
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
    
    const color = getColorPickerRectAtPosition(colorToInt(baseColor.value), rw.value, rh.value);
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
    
    const color = getColorPickerRectAtPosition(colorToInt(baseColor.value), rw.value, rh.value);
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
function updateColor(color: Color3)
{
    // 只写 rgb：Color4 的 alpha 因此自然保留（旧实现分支里重建 Color4 也只写回了 rgb）
    const r_color = reactive(props.color) as WritableColorLike;
    const { r, g, b } = colorRgb(color);
    r_color.r = r;
    r_color.g = g;
    r_color.b = b;

    emit('change', props.color);
}

// RGB 变化
function onRChange(value: number | undefined) {
    if (value !== undefined) {
        writeChannel('r', value / 255);
        updateView();
        emit('change', props.color);
    }
}

function onGChange(value: number | undefined) {
    if (value !== undefined) {
        writeChannel('g', value / 255);
        updateView();
        emit('change', props.color);
    }
}

function onBChange(value: number | undefined) {
    if (value !== undefined) {
        writeChannel('b', value / 255);
        updateView();
        emit('change', props.color);
    }
}

function onAChange(value: number | undefined) {
    if (value !== undefined && hasAlpha.value) {
        writeChannel('a', value / 255);
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
        // 十六进制输入只改 rgb、保留 alpha（与旧 `new Color3().fromUnit(num)` 分支等价；
        // 旧 Color4 分支重建 Color4 后也只写回了 rgb）
        const r_color = reactive(props.color) as WritableColorLike;
        const { r, g, b } = colorRgb(color3FromUnit(num));
        r_color.r = r;
        r_color.g = g;
        r_color.b = b;

        updateView();
        emit('change', props.color);
    } catch (e) {
        // 解析失败，恢复原值
        updateView();
    }
}

// 辅助函数：获取颜色选择矩形位置
function getColorPickerRectPosition(color: number) {
    let c = color3FromUnit(color);
    
    const max = Math.max(c.r ?? 1, c.g ?? 1, c.b ?? 1);
    if (max !== 0) {
        // 旧写法 `black.mix(c, 1 / max)`（黑色起点插值即纯缩放）
        c = color3Scale(c, 1 / max);
    }
    const min = Math.min(c.r ?? 1, c.g ?? 1, c.b ?? 1);
    if (min !== 1) {
        // 旧写法 `white.mix(c, 1 / (1 - min))`
        c = color3Mix(COLOR3_WHITE, c, 1 / (1 - min));
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
    
    const colors1 = colors.map((v) => color3FromUnit(v));
    const c = color3FromUnit(color);
    
    const r = c.r ?? 1;
    const g = c.g ?? 1;
    const b = c.b ?? 1;
    
    for (let i = 0; i < colors1.length - 1; i++) {
        const c0 = colors1[i];
        const c1 = colors1[i + 1];
        if (color3Equals(c, c0)) return ratios[i];
        if (color3Equals(c, c1)) return ratios[i + 1];
        
        const r1 = (c0.r ?? 1) + (c1.r ?? 1);
        const g1 = (c0.g ?? 1) + (c1.g ?? 1);
        const b1 = (c0.b ?? 1) + (c1.b ?? 1);
        
        const v = r * r1 + g * g1 + b * b1;
        if (v > 2) {
            let result = 0;
            if (r1 === 1) {
                result = mathUtil.mapLinear(r, c0.r ?? 1, c1.r ?? 1, ratios[i], ratios[i + 1]);
            } else if (g1 === 1) {
                result = mathUtil.mapLinear(g, c0.g ?? 1, c1.g ?? 1, ratios[i], ratios[i + 1]);
            } else if (b1 === 1) {
                result = mathUtil.mapLinear(b, c0.b ?? 1, c1.b ?? 1, ratios[i], ratios[i + 1]);
            }
            return result;
        }
    }
    
    return 0;
}

// 辅助函数：获取颜色选择矩形位置的颜色
function getColorPickerRectAtPosition(color: number, rw: number, rh: number) {
    const leftTop = COLOR3_WHITE;
    const rightTop = color3FromUnit(color);
    const leftBottom = COLOR3_BLACK;
    const rightBottom = COLOR3_BLACK;
    
    const top = color3Mix(leftTop, rightTop, rw);
    const bottom = color3Mix(leftBottom, rightBottom, rw);
    const v = color3Mix(top, bottom, rh);
    
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
    
    const colors1 = colors.map((v) => color3FromUnit(v));
    
    for (let i = 0; i < colors1.length - 1; i++) {
        if (ratios[i] <= ratio && ratio <= ratios[i + 1]) {
            const mix = mathUtil.mapLinear(ratio, ratios[i], ratios[i + 1], 0, 1);
            const c = color3Mix(colors1[i], colors1[i + 1], mix);
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
    if (hasAlpha.value) {
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
    if (hasAlpha.value) {
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
