<template>
    <div class="min-max-curve-editor">
        <!-- 工具栏 -->
        <div class="toolbar">
            <!-- Multiplier 输入 -->
            <div class="toolbar-item">
                <label>Multiplier:</label>
                <el-input-number
                    :model-value="minMaxCurve.curveMultiplier"
                    :min="0"
                    :step="0.01"
                    :precision="2"
                    size="small"
                    style="width: 100px"
                    @update:model-value="onMultiplierChange"
                />
            </div>

            <!-- WrapMode 按钮 -->
            <div class="toolbar-item">
                <el-button
                    v-if="selectTimeline"
                    size="small"
                    @click="onPreWrapModeClick"
                >
                    Pre: {{ getWrapModeName(selectTimeline.preWrapMode) }}
                </el-button>
                <el-button
                    v-if="selectTimeline"
                    size="small"
                    @click="onPostWrapModeClick"
                >
                    Post: {{ getWrapModeName(selectTimeline.postWrapMode) }}
                </el-button>
            </div>
        </div>

        <!-- Canvas 区域 -->
        <div
            ref="viewGroupRef"
            class="canvas-container"
            @mousedown="onMouseDown"
            @dblclick="onDoubleClick"
        >
            <canvas ref="canvasRef" class="curve-canvas" />
            
            <!-- WrapMode 按钮（浮动在曲线上） -->
            <el-button
                v-if="selectTimeline && preWrapModeBtnVisible"
                :style="preWrapModeBtnStyle"
                size="small"
                class="wrap-mode-btn"
                @click.stop="onPreWrapModeClick"
            >
                Pre
            </el-button>
            <el-button
                v-if="selectTimeline && postWrapModeBtnVisible"
                :style="postWrapModeBtnStyle"
                size="small"
                class="wrap-mode-btn"
                @click.stop="onPostWrapModeClick"
            >
                Post
            </el-button>

            <!-- 关键点位置标签 -->
            <div
                v-if="editKey && keyPosLabelVisible"
                :style="keyPosLabelStyle"
                class="key-pos-label"
            >
                {{ keyPosLabelText }}
            </div>
        </div>

        <!-- 预设曲线选择 -->
        <div class="samples-container">
            <div class="samples-header">
                <span>预设曲线:</span>
            </div>
            <div class="samples-grid">
                <div
                    v-for="(sample, index) in sampleImages"
                    :key="index"
                    class="sample-item"
                    @click="onSampleClick(index)"
                >
                    <canvas
                        :ref="el => setSampleCanvasRef(el, index)"
                        class="sample-canvas"
                    />
                </div>
            </div>
        </div>

        <!-- 关键点编辑面板 -->
        <div v-if="selectedKey" class="key-panel">
            <div class="key-panel-row">
                <label>Time:</label>
                <el-input-number
                    :model-value="selectedKey.time"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    :precision="3"
                    size="small"
                    style="width: 100px"
                    @update:model-value="onKeyTimeChange"
                />
            </div>
            <div class="key-panel-row">
                <label>Value:</label>
                <el-input-number
                    :model-value="selectedKey.value"
                    :min="range[1]"
                    :max="range[0]"
                    :step="0.01"
                    :precision="3"
                    size="small"
                    style="width: 100px"
                    @update:model-value="onKeyValueChange"
                />
            </div>
            <div v-if="canEditTangents" class="key-panel-row">
                <label>In Tangent:</label>
                <el-input-number
                    :model-value="selectedKey.inTangent"
                    :step="0.01"
                    :precision="3"
                    size="small"
                    style="width: 100px"
                    @update:model-value="onKeyInTangentChange"
                />
            </div>
            <div v-if="canEditTangents" class="key-panel-row">
                <label>Out Tangent:</label>
                <el-input-number
                    :model-value="selectedKey.outTangent"
                    :step="0.01"
                    :precision="3"
                    size="small"
                    style="width: 100px"
                    @update:model-value="onKeyOutTangentChange"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import {
    AnimationCurve,
    AnimationCurveKeyframe,
    Color4,
    gPartial,
    ImageUtil,
    mathUtil,
    MinMaxCurve,
    MinMaxCurveMode,
    Rectangle,
    serialization,
    Vector2,
    watcher,
    WrapMode,
} from 'feng3d';
import { MenuAdapter } from './MenuAdapter';

const props = withDefaults(defineProps<{
    minMaxCurve: MinMaxCurve;
    editable?: boolean;
    onChange?: () => void;
}>(), {
    editable: true,
});

const emit = defineEmits<{
    change: [];
}>();

// 触发变化事件
function triggerChange() {
    emit('change');
    if (props.onChange) {
        props.onChange();
    }
}

// Refs
const viewGroupRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const sampleCanvasRefs = ref<(HTMLCanvasElement | null)[]>([]);

// 曲线数据
const timeline = ref<AnimationCurve | null>(null);
const timeline1 = ref<AnimationCurve | null>(null);
const curveRect = ref<Rectangle | null>(null);
const canvasRect = ref<Rectangle | null>(null);

// 编辑状态
const editKey = ref<AnimationCurveKeyframe | null>(null);
const editorControlkey = ref<AnimationCurveKeyframe | null>(null);
const editing = ref(false);
const mousedownxy = ref({ x: -1, y: -1 });
const selectedKey = ref<AnimationCurveKeyframe | null>(null);
const selectTimeline = ref<AnimationCurve | null>(null);

// 绘制参数
const curveColor = new Color4(1, 0, 0);
const backColor = Color4.fromUnit24(0x565656);
const fillTwoCurvesColor = new Color4(1, 1, 1, 0.2);
const range = ref<[number, number]>([1, -1]);

const imageUtil = ref<ImageUtil | null>(null);

// 点绘制尺寸
const pointSize = 5;

// 控制柄长度
const controllerLength = 50;

// 计算属性
const canEditTangents = computed(() => {
    if (!selectedKey.value || !selectTimeline.value) return false;
    const index = selectTimeline.value.keys.indexOf(selectedKey.value);
    return index > 0 || index < selectTimeline.value.keys.length - 1;
});

// WrapMode 按钮样式
const preWrapModeBtnVisible = computed(() => {
    return selectTimeline.value !== null;
});

const postWrapModeBtnVisible = computed(() => {
    return selectTimeline.value !== null;
});

const preWrapModeBtnStyle = computed(() => {
    if (!selectTimeline.value || !curveRect.value) {
        return { display: 'none' } as any;
    }
    const firstKey = selectTimeline.value.keys[0];
    if (!firstKey) return { display: 'none' } as any;
    const pos = curveToUIPos(firstKey.time, firstKey.value);
    return {
        position: 'absolute' as const,
        left: `${pos.x - 60}px`,
        top: `${pos.y}px`,
    };
});

const postWrapModeBtnStyle = computed(() => {
    if (!selectTimeline.value || !curveRect.value) {
        return { display: 'none' } as any;
    }
    const lastKey = selectTimeline.value.keys[selectTimeline.value.keys.length - 1];
    if (!lastKey) return { display: 'none' } as any;
    const pos = curveToUIPos(lastKey.time, lastKey.value);
    return {
        position: 'absolute' as const,
        left: `${pos.x + 15}px`,
        top: `${pos.y}px`,
    };
});

// 关键点位置标签
const keyPosLabelVisible = computed(() => {
    return editKey.value !== null && editing.value;
});

const keyPosLabelStyle = computed(() => {
    if (!editKey.value || !curveRect.value) {
        return { display: 'none' } as any;
    }
    const pos = curveToUIPos(editKey.value.time, editKey.value.value);
    return {
        position: 'absolute' as const,
        left: `${pos.x}px`,
        top: `${pos.y - 25}px`,
    };
});

const keyPosLabelText = computed(() => {
    if (!editKey.value) return '';
    return `${editKey.value.time.toFixed(3)},${editKey.value.value.toFixed(3)}`;
});

// 预设曲线图像
const sampleImages = ref<HTMLCanvasElement[]>([]);

// 设置样本 Canvas ref
function setSampleCanvasRef(el: any, index: number) {
    if (el && el instanceof HTMLCanvasElement) {
        sampleCanvasRefs.value[index] = el;
    }
}

// 曲线坐标转换为 UI 坐标
function curveToUIPos(time: number, value: number): Vector2 {
    if (!curveRect.value) return new Vector2(0, 0);
    const x = mathUtil.mapLinear(time, 0, 1, curveRect.value.left, curveRect.value.right);
    const y = mathUtil.mapLinear(value, range.value[0], range.value[1], curveRect.value.top, curveRect.value.bottom);
    return new Vector2(x, y);
}

// UI 坐标转换为曲线坐标
function uiToCurvePos(x: number, y: number): { time: number; value: number } {
    if (!curveRect.value) return { time: 0, value: 0 };
    const time = mathUtil.mapLinear(x, curveRect.value.left, curveRect.value.right, 0, 1);
    const value = mathUtil.mapLinear(y, curveRect.value.top, curveRect.value.bottom, range.value[0], range.value[1]);
    return { time, value };
}

// 获取关键点 UI 位置
function getKeyUIPos(key: AnimationCurveKeyframe): Vector2 {
    return curveToUIPos(key.time, key.value);
}

// 获取关键点左侧控制点 UI 位置
function getKeyLeftControlUIPos(key: AnimationCurveKeyframe): Vector2 {
    if (!curveRect.value) return new Vector2(0, 0);
    const current = curveToUIPos(key.time, key.value);
    const currenttan = key.inTangent * curveRect.value.height / curveRect.value.width;
    const lcp = new Vector2(
        current.x - controllerLength * Math.cos(Math.atan(currenttan)),
        current.y + controllerLength * Math.sin(Math.atan(currenttan))
    );
    return lcp;
}

// 获取关键点右侧控制点 UI 位置
function getKeyRightControlUIPos(key: AnimationCurveKeyframe): Vector2 {
    if (!curveRect.value) return new Vector2(0, 0);
    const current = curveToUIPos(key.time, key.value);
    const currenttan = key.outTangent * curveRect.value.height / curveRect.value.width;
    const rcp = new Vector2(
        current.x + controllerLength * Math.cos(Math.atan(currenttan)),
        current.y - controllerLength * Math.sin(Math.atan(currenttan))
    );
    return rcp;
}

// 查找控制点
function findControlKey(key: AnimationCurveKeyframe, x: number, y: number, radius: number): AnimationCurveKeyframe | null {
    const lcp = getKeyLeftControlUIPos(key);
    if (Math.abs(lcp.x - x) < radius && Math.abs(lcp.y - y) < radius) {
        return key;
    }
    const rcp = getKeyRightControlUIPos(key);
    if (Math.abs(rcp.x - x) < radius && Math.abs(rcp.y - y) < radius) {
        return key;
    }
    return null;
}

// 绘制网格
function drawGrid(ctx: CanvasRenderingContext2D, segmentW = 10, segmentH = 2) {
    if (!curveRect.value) return;
    
    const c0 = Color4.fromUnit24(0x494949);
    const c1 = Color4.fromUnit24(0x4f4f4f);
    
    for (let i = 0; i <= segmentW; i++) {
        const x = curveRect.value.x + (curveRect.value.width * i / segmentW);
        const color = i % 2 === 0 ? c0 : c1;
        ctx.strokeStyle = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
        ctx.beginPath();
        ctx.moveTo(x, curveRect.value.y);
        ctx.lineTo(x, curveRect.value.y + curveRect.value.height);
        ctx.stroke();
    }
    
    for (let i = 0; i <= segmentH; i++) {
        const y = curveRect.value.y + (curveRect.value.height * i / segmentH);
        const color = i % 2 === 0 ? c0 : c1;
        ctx.strokeStyle = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
        ctx.beginPath();
        ctx.moveTo(curveRect.value.x, y);
        ctx.lineTo(curveRect.value.x + curveRect.value.width, y);
        ctx.stroke();
    }
}

// 绘制点
function drawPoint(ctx: CanvasRenderingContext2D, x: number, y: number, color: Color4, size: number) {
    ctx.fillStyle = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制线
function drawLine(ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2, color: Color4) {
    ctx.strokeStyle = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
}

// 绘制曲线关键点
function drawCurveKeys(ctx: CanvasRenderingContext2D, animationCurve: AnimationCurve) {
    const c = new Color4(1, 0, 0);
    animationCurve.keys.forEach((key) => {
        const pos = curveToUIPos(key.time, key.value);
        drawPoint(ctx, pos.x, pos.y, c, pointSize);
    });
}

// 绘制选中的关键点
function drawSelectedKey(ctx: CanvasRenderingContext2D) {
    if (!selectedKey.value || !selectTimeline.value) return;
    
    const key = selectedKey.value;
    const i = selectTimeline.value.keys.indexOf(key);
    if (i === -1) return;
    
    const n = selectTimeline.value.keys.length;
    const c = new Color4(0, 1, 0);
    
    const current = getKeyUIPos(key);
    drawPoint(ctx, current.x, current.y, c, pointSize);
    
    // 绘制控制点
    if (i > 0) {
        const lcp = getKeyLeftControlUIPos(key);
        drawPoint(ctx, lcp.x, lcp.y, c, pointSize);
        drawLine(ctx, current, lcp, c);
    }
    if (i < n - 1) {
        const rcp = getKeyRightControlUIPos(key);
        drawPoint(ctx, rcp.x, rcp.y, c, pointSize);
        drawLine(ctx, current, rcp, c);
    }
}

// 更新视图
function updateView() {
    if (!canvasRef.value || !viewGroupRef.value) return;
    
    const canvas = canvasRef.value;
    const width = viewGroupRef.value.clientWidth;
    const height = viewGroupRef.value.clientHeight;
    
    if (width <= 0 || height <= 0) return;
    
    canvas.width = width;
    canvas.height = height;
    
    // 计算曲线绘制区域（留出边距）
    const padding = 40;
    const curveWidth = width - padding * 2;
    const curveHeight = height - padding * 2;
    
    curveRect.value = new Rectangle(padding, padding, curveWidth, curveHeight);
    canvasRect.value = new Rectangle(0, 0, width, height);
    
    if (curveWidth < 10 || curveHeight < 10) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清空画布
    ctx.fillStyle = `rgba(${Math.round(backColor.r * 255)}, ${Math.round(backColor.g * 255)}, ${Math.round(backColor.b * 255)}, ${backColor.a})`;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制网格
    drawGrid(ctx);
    
    // 使用 ImageUtil 绘制曲线
    try {
        imageUtil.value = new ImageUtil(width, height, backColor);
        
        timeline.value = props.minMaxCurve.curve;
        timeline1.value = props.minMaxCurve.curveMax;
        
        if (props.minMaxCurve.mode === MinMaxCurveMode.Curve) {
            imageUtil.value.drawCurve(timeline.value, props.minMaxCurve.between0And1, curveColor, curveRect.value);
            drawCurveKeys(ctx, timeline.value);
        } else if (props.minMaxCurve.mode === MinMaxCurveMode.TwoCurves) {
            imageUtil.value.drawBetweenTwoCurves(
                props.minMaxCurve.curve,
                props.minMaxCurve.curveMax,
                props.minMaxCurve.between0And1,
                curveColor,
                fillTwoCurvesColor,
                curveRect.value
            );
            drawCurveKeys(ctx, timeline.value);
            drawCurveKeys(ctx, timeline1.value);
        }
        
        // 将 ImageUtil 的绘制结果绘制到 Canvas
        const dataURL = imageUtil.value.toDataURL();
        if (dataURL) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                // 在图像上绘制关键点
                if (timeline.value) {
                    drawCurveKeys(ctx, timeline.value);
                }
                if (timeline1.value) {
                    drawCurveKeys(ctx, timeline1.value);
                }
                drawSelectedKey(ctx);
            };
            img.src = dataURL;
        } else {
            // 如果 ImageUtil 不支持，直接绘制关键点
            if (timeline.value) {
                drawCurveKeys(ctx, timeline.value);
            }
            if (timeline1.value) {
                drawCurveKeys(ctx, timeline1.value);
            }
            drawSelectedKey(ctx);
        }
    } catch (e) {
        console.warn('Failed to draw curve:', e);
    }
}

// 更新预设曲线图像
function updateSampleImages() {
    const curves = props.minMaxCurve.between0And1 ? particleCurves : particleCurvesSingend;
    const doubleCurves = props.minMaxCurve.between0And1 ? particleDoubleCurves : particleDoubleCurvesSingend;
    
    for (let i = 0; i < 8; i++) {
        const canvas = sampleCanvasRefs.value[i];
        if (!canvas) continue;
        
        const width = 60;
        const height = 40;
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        
        ctx.fillStyle = `rgba(${Math.round(backColor.r * 255)}, ${Math.round(backColor.g * 255)}, ${Math.round(backColor.b * 255)}, ${backColor.a})`;
        ctx.fillRect(0, 0, width, height);
        
        if (props.minMaxCurve.mode === MinMaxCurveMode.Curve && curves[i]) {
            const imageUtil = new ImageUtil(width, height, backColor);
            if (!props.minMaxCurve.between0And1) {
                imageUtil.drawLine(new Vector2(0, height / 2), new Vector2(width, height / 2), Color4.BLACK);
            }
            const curve = serialization.setValue(new AnimationCurve(), curves[i]);
            imageUtil.drawCurve(curve, props.minMaxCurve.between0And1, Color4.WHITE);
            
            const dataURL = imageUtil.toDataURL();
            if (dataURL) {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = dataURL;
            }
        } else if (props.minMaxCurve.mode === MinMaxCurveMode.TwoCurves && doubleCurves[i]) {
            const imageUtil = new ImageUtil(width, height, backColor);
            if (!props.minMaxCurve.between0And1) {
                imageUtil.drawLine(new Vector2(0, height / 2), new Vector2(width, height / 2), Color4.BLACK);
            }
            
            const curveMin = serialization.setValue(new AnimationCurve(), doubleCurves[i].curve);
            const curveMax = serialization.setValue(new AnimationCurve(), doubleCurves[i].curveMax);
            
            imageUtil.drawBetweenTwoCurves(curveMin, curveMax, props.minMaxCurve.between0And1, Color4.WHITE);
            
            const dataURL = imageUtil.toDataURL();
            if (dataURL) {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = dataURL;
            }
        }
    }
}

// 鼠标按下
function onMouseDown(event: MouseEvent) {
    if (!props.editable || !viewGroupRef.value || !curveRect.value) return;
    
    const rect = viewGroupRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    mousedownxy.value = { x, y };
    
    const curvePos = uiToCurvePos(x, y);
    
    let currentTimeline = timeline.value;
    if (!currentTimeline) return;
    
    editKey.value = currentTimeline.findKey(curvePos.time, curvePos.value, pointSize / curveRect.value.height);
    if (!editKey.value && timeline1.value) {
        currentTimeline = timeline1.value;
        editKey.value = currentTimeline.findKey(curvePos.time, curvePos.value, pointSize / curveRect.value.height);
    }
    
    if (editKey.value) {
        selectedKey.value = editKey.value;
        selectTimeline.value = currentTimeline;
    } else if (selectedKey.value) {
        editorControlkey.value = findControlKey(selectedKey.value, x, y, pointSize);
        if (!editorControlkey.value) {
            selectedKey.value = null;
            selectTimeline.value = null;
        }
    }
    
    if (editKey.value || editorControlkey.value) {
        editing.value = true;
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }
    
    updateView();
    triggerChange();
}

// 鼠标移动
function onMouseMove(event: MouseEvent) {
    if (!viewGroupRef.value || !curveRect.value) return;
    
    editing.value = true;
    
    const rect = viewGroupRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const curvePos = uiToCurvePos(x, y);
    
    if (editKey.value && selectTimeline.value) {
        curvePos.time = mathUtil.clamp(curvePos.time, 0, 1);
        curvePos.value = mathUtil.clamp(curvePos.value, range.value[1], range.value[0]);
        
        editKey.value.time = curvePos.time;
        editKey.value.value = curvePos.value;
        selectTimeline.value.sort();
        
        updateView();
        emit('change');
    } else if (editorControlkey.value && selectTimeline.value) {
        const index = selectTimeline.value.indexOfKeys(editorControlkey.value);
        
        if (index === 0 && curvePos.time < editorControlkey.value.time) {
            editorControlkey.value.inTangent = curvePos.value > editorControlkey.value.value ? Infinity : -Infinity;
            updateView();
            emit('change');
            return;
        }
        if (index === selectTimeline.value.numKeys - 1 && curvePos.time > editorControlkey.value.time) {
            editorControlkey.value.outTangent = curvePos.value > editorControlkey.value.value ? -Infinity : Infinity;
            updateView();
            emit('change');
            return;
        }
        
        editorControlkey.value.inTangent = editorControlkey.value.outTangent = 
            (curvePos.value - editorControlkey.value.value) / (curvePos.time - editorControlkey.value.time);
        
        updateView();
        emit('change');
    }
}

// 鼠标抬起
function onMouseUp() {
    editing.value = false;
    editorControlkey.value = null;
    
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    
    updateView();
}

// 双击
function onDoubleClick(event: MouseEvent) {
    if (!props.editable || !viewGroupRef.value || !curveRect.value) return;
    
    editing.value = false;
    editKey.value = null;
    editorControlkey.value = null;
    
    const rect = viewGroupRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const curvePos = uiToCurvePos(x, y);
    
    if (!timeline.value) return;
    
    let foundKey = timeline.value.findKey(curvePos.time, curvePos.value, pointSize / curveRect.value.height);
    if (foundKey !== null) {
        timeline.value.deleteKey(foundKey);
        updateView();
        emit('change');
        return;
    }
    
    if (timeline1.value) {
        foundKey = timeline1.value.findKey(curvePos.time, curvePos.value, pointSize / curveRect.value.height);
        if (foundKey) {
            timeline1.value.deleteKey(foundKey);
            updateView();
            emit('change');
            return;
        }
    }
    
    // 没有选中关键点时，检查是否点击到曲线，添加新关键点
    let newKey = timeline.value.addKeyAtCurve(curvePos.time, curvePos.value, pointSize / curveRect.value.height);
    if (newKey) {
        selectedKey.value = newKey;
        selectTimeline.value = timeline.value;
        updateView();
        emit('change');
        return;
    }
    
    if (timeline1.value) {
        newKey = timeline1.value.addKeyAtCurve(curvePos.time, curvePos.value, pointSize / curveRect.value.height);
        if (newKey) {
            selectedKey.value = newKey;
            selectTimeline.value = timeline1.value;
            updateView();
            emit('change');
        }
    }
}

// 预设曲线点击
function onSampleClick(index: number) {
    if (!props.editable) return;
    
    const curves = props.minMaxCurve.between0And1 ? particleCurves : particleCurvesSingend;
    const doubleCurves = props.minMaxCurve.between0And1 ? particleDoubleCurves : particleDoubleCurvesSingend;
    
    if (props.minMaxCurve.mode === MinMaxCurveMode.Curve && curves[index]) {
        props.minMaxCurve.curve = serialization.setValue(new AnimationCurve(), curves[index]);
    } else if (props.minMaxCurve.mode === MinMaxCurveMode.TwoCurves && doubleCurves[index]) {
        props.minMaxCurve.curve = serialization.setValue(new AnimationCurve(), doubleCurves[index].curve);
        props.minMaxCurve.curveMax = serialization.setValue(new AnimationCurve(), doubleCurves[index].curveMax);
    }
    
    selectedKey.value = null;
    nextTick(() => {
        updateView();
        updateSampleImages();
        emit('change');
    });
}

// Multiplier 变化
function onMultiplierChange(value: number | undefined) {
    if (value !== undefined) {
        props.minMaxCurve.curveMultiplier = value;
        emit('change');
    }
}

// WrapMode 名称
function getWrapModeName(wrapMode: WrapMode): string {
    const names: Partial<Record<WrapMode, string>> = {
        [WrapMode.Clamp]: 'Clamp',
        [WrapMode.Loop]: 'Loop',
        [WrapMode.PingPong]: 'PingPong',
        [WrapMode.Once]: 'Once',
        [WrapMode.Default]: 'Default',
    };
    return names[wrapMode] || 'Unknown';
}

// Pre WrapMode 点击
function onPreWrapModeClick() {
    if (!selectTimeline.value) return;
    
    const menuAdapter = new MenuAdapter();
    const menus = Object.values(WrapMode)
        .filter(v => typeof v === 'number')
        .map((wrapMode: WrapMode) => ({
            label: getWrapModeName(wrapMode),
            click: () => {
                if (selectTimeline.value) {
                    selectTimeline.value.preWrapMode = wrapMode;
                    updateView();
                    emit('change');
                }
            },
        }));
    
    menuAdapter.popup(menus);
}

// Post WrapMode 点击
function onPostWrapModeClick() {
    if (!selectTimeline.value) return;
    
    const menuAdapter = new MenuAdapter();
    const menus = Object.values(WrapMode)
        .filter(v => typeof v === 'number')
        .map((wrapMode: WrapMode) => ({
            label: getWrapModeName(wrapMode),
            click: () => {
                if (selectTimeline.value) {
                    selectTimeline.value.postWrapMode = wrapMode;
                    updateView();
                    emit('change');
                }
            },
        }));
    
    menuAdapter.popup(menus);
}

// 关键点时间变化
function onKeyTimeChange(value: number | undefined) {
    if (value !== undefined && selectedKey.value && selectTimeline.value) {
        selectedKey.value.time = mathUtil.clamp(value, 0, 1);
        selectTimeline.value.sort();
        updateView();
        emit('change');
    }
}

// 关键点值变化
function onKeyValueChange(value: number | undefined) {
    if (value !== undefined && selectedKey.value) {
        selectedKey.value.value = mathUtil.clamp(value, range.value[1], range.value[0]);
        updateView();
        emit('change');
    }
}

// 关键点 In Tangent 变化
function onKeyInTangentChange(value: number | undefined) {
    if (value !== undefined && selectedKey.value) {
        selectedKey.value.inTangent = value;
        updateView();
        emit('change');
    }
}

// 关键点 Out Tangent 变化
function onKeyOutTangentChange(value: number | undefined) {
    if (value !== undefined && selectedKey.value) {
        selectedKey.value.outTangent = value;
        updateView();
        emit('change');
    }
}

// 监听曲线变化
function onMinMaxCurveChanged() {
    range.value = props.minMaxCurve.between0And1 ? [1, 0] : [1, -1];
    nextTick(() => {
        updateView();
        updateSampleImages();
    });
}

// 监听尺寸变化
const resizeObserver = ref<ResizeObserver | null>(null);

onMounted(() => {
    range.value = props.minMaxCurve.between0And1 ? [1, 0] : [1, -1];
    
    updateView();
    updateSampleImages();
    
    // 监听曲线变化
    watcher.watch(props.minMaxCurve as any, 'mode' as any, onMinMaxCurveChanged);
    watcher.watch(props.minMaxCurve as any, 'curve' as any, onMinMaxCurveChanged);
    watcher.watch(props.minMaxCurve as any, 'curveMax' as any, onMinMaxCurveChanged);
    watcher.watch(props.minMaxCurve as any, 'curveMultiplier' as any, onMinMaxCurveChanged);
    watcher.watch(props.minMaxCurve as any, 'between0And1' as any, onMinMaxCurveChanged);
    
    // 监听容器尺寸变化
    if (viewGroupRef.value) {
        resizeObserver.value = new ResizeObserver(() => {
            updateView();
        });
        resizeObserver.value.observe(viewGroupRef.value);
    }
});

onUnmounted(() => {
    if (resizeObserver.value) {
        resizeObserver.value.disconnect();
    }
    
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    
    watcher.unwatch(props.minMaxCurve as any, 'mode' as any, onMinMaxCurveChanged);
    watcher.unwatch(props.minMaxCurve as any, 'curve' as any, onMinMaxCurveChanged);
    watcher.unwatch(props.minMaxCurve as any, 'curveMax' as any, onMinMaxCurveChanged);
    watcher.unwatch(props.minMaxCurve as any, 'curveMultiplier' as any, onMinMaxCurveChanged);
    watcher.unwatch(props.minMaxCurve as any, 'between0And1' as any, onMinMaxCurveChanged);
});

// 监听模式变化
watch(() => props.minMaxCurve.mode, () => {
    onMinMaxCurveChanged();
});

// 预设曲线数据
const particleCurves: gPartial<AnimationCurve>[] = [
    { keys: [{ time: 0, value: 1, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] },
    { keys: [{ time: 0, value: 0, inTangent: 1, outTangent: 1 }, { time: 1, value: 1, inTangent: 1, outTangent: 1 }] },
    { keys: [{ time: 0, value: 1, inTangent: -1, outTangent: -1 }, { time: 1, value: 0, inTangent: -1, outTangent: -1 }] },
    { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 2, outTangent: 2 }] },
    { keys: [{ time: 0, value: 1, inTangent: -2, outTangent: -2 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] },
    { keys: [{ time: 0, value: 0, inTangent: 2, outTangent: 2 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] },
    { keys: [{ time: 0, value: 1, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: -2, outTangent: -2 }] },
    { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] },
];

const particleCurvesSingend: gPartial<AnimationCurve>[] = [
    { keys: [{ time: 0, value: 1, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] },
    { keys: [{ time: 0, value: 0, inTangent: 1, outTangent: 1 }, { time: 1, value: 1, inTangent: 1, outTangent: 1 }] },
    { keys: [{ time: 0, value: 1, inTangent: -1, outTangent: -1 }, { time: 1, value: 0, inTangent: -1, outTangent: -1 }] },
    { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 2, outTangent: 2 }] },
    { keys: [{ time: 0, value: 1, inTangent: -2, outTangent: -2 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] },
    { keys: [{ time: 0, value: 0, inTangent: 2, outTangent: 2 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] },
    { keys: [{ time: 0, value: 1, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: -2, outTangent: -2 }] },
    { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] },
];

const particleDoubleCurves: gPartial<MinMaxCurve>[] = [{
    curve: { keys: [{ time: 0, value: 1, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] },
    curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
},
{
    curve: { keys: [{ time: 0, value: 0, inTangent: 1, outTangent: 1 }, { time: 1, value: 1, inTangent: 1, outTangent: 1 }] },
    curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
},
{
    curve: { keys: [{ time: 0, value: 1, inTangent: -1, outTangent: -1 }, { time: 1, value: 0, inTangent: -1, outTangent: -1 }] },
    curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
},
{
    curve: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 2, outTangent: 2 }] },
    curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
},
{
    curve: { keys: [{ time: 0, value: 1, inTangent: -2, outTangent: -2 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] },
    curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
},
{
    curve: { keys: [{ time: 0, value: 0, inTangent: 2, outTangent: 2 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] },
    curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
},
{
    curve: { keys: [{ time: 0, value: 1, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: -2, outTangent: -2 }] },
    curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
},
{
    curve: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] },
    curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
},
];

const particleDoubleCurvesSingend: gPartial<MinMaxCurve>[] = [
    {
        curve: { keys: [{ time: 0, value: 1, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] },
        curveMax: { keys: [{ time: 0, value: -1, inTangent: 0, outTangent: 0 }, { time: 1, value: -1, inTangent: 0, outTangent: 0 }] }
    },
    {
        curve: { keys: [{ time: 0, value: 0, inTangent: 1, outTangent: 1 }, { time: 1, value: 1, inTangent: 1, outTangent: 1 }] },
        curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
    },
    {
        curve: { keys: [{ time: 0, value: 1, inTangent: -1, outTangent: -1 }, { time: 1, value: 0, inTangent: -1, outTangent: -1 }] },
        curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
    },
    {
        curve: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 2, outTangent: 2 }] },
        curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
    },
    {
        curve: { keys: [{ time: 0, value: 1, inTangent: -2, outTangent: -2 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] },
        curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
    },
    {
        curve: { keys: [{ time: 0, value: 0, inTangent: 2, outTangent: 2 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] },
        curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
    },
    {
        curve: { keys: [{ time: 0, value: 1, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: -2, outTangent: -2 }] },
        curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
    },
    {
        curve: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] },
        curveMax: { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 0, inTangent: 0, outTangent: 0 }] }
    },
];
</script>

<style scoped>
.min-max-curve-editor {
    padding: 10px;
    background-color: var(--editor-background, #1d1d1d);
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 4px;
    min-width: 400px;
    min-height: 300px;
}

.toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--sideBar-border, #3d3d3d);
}

.toolbar-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.toolbar-item label {
    font-size: 12px;
    color: var(--editor-foreground, #cccccc);
    white-space: nowrap;
}

.canvas-container {
    position: relative;
    width: 100%;
    height: 300px;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    background-color: var(--input-background, #1d1d1d);
    cursor: crosshair;
    margin-bottom: 10px;
}

.curve-canvas {
    width: 100%;
    height: 100%;
    display: block;
}

.wrap-mode-btn {
    position: absolute;
    z-index: 10;
}

.key-pos-label {
    position: absolute;
    background-color: var(--sideBar-background, #2d2d2d);
    color: var(--editor-foreground, #cccccc);
    padding: 2px 6px;
    border-radius: 2px;
    font-size: 11px;
    pointer-events: none;
    z-index: 10;
}

.samples-container {
    margin-bottom: 10px;
}

.samples-header {
    font-size: 12px;
    color: var(--editor-foreground, #cccccc);
    margin-bottom: 8px;
}

.samples-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
}

.sample-item {
    cursor: pointer;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 2px;
    overflow: hidden;
    transition: border-color 0.2s;
}

.sample-item:hover {
    border-color: var(--button-background, #409eff);
}

.sample-canvas {
    width: 100%;
    height: 40px;
    display: block;
}

.key-panel {
    padding: 10px;
    background-color: var(--sideBar-background, #2d2d2d);
    border-radius: 4px;
    border: 1px solid var(--sideBar-border, #3d3d3d);
}

.key-panel-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.key-panel-row:last-child {
    margin-bottom: 0;
}

.key-panel-row label {
    width: 80px;
    font-size: 12px;
    color: var(--editor-foreground, #cccccc);
    flex-shrink: 0;
}
</style>
