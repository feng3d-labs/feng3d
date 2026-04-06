<template>
    <div class="minmax-curve-view">
        <!-- 模式选择按钮 -->
        <div class="minmax-curve-header">
            <el-button
                size="small"
                @click="onModeClick"
            >
                {{ modeLabel }}
            </el-button>
        </div>

        <!-- 常量模式 -->
        <div v-if="mode === MinMaxCurveMode.Constant" class="minmax-curve-constant">
            <el-input-number
                :model-value="minMaxCurve.constant"
                :disabled="!editable"
                size="small"
                :step="0.01"
                @update:model-value="onConstantChange"
            />
        </div>

        <!-- 两个常量模式 -->
        <div v-else-if="mode === MinMaxCurveMode.TwoConstants" class="minmax-curve-two-constants">
            <el-input-number
                :model-value="minMaxCurve.constantMin"
                :disabled="!editable"
                size="small"
                :step="0.01"
                label="Min"
                @update:model-value="onConstantMinChange"
            />
            <el-input-number
                :model-value="minMaxCurve.constantMax"
                :disabled="!editable"
                size="small"
                :step="0.01"
                label="Max"
                @update:model-value="onConstantMaxChange"
            />
        </div>

        <!-- 曲线模式 -->
        <div
            v-else
            ref="curveGroupRef"
            class="minmax-curve-curve"
            @click="onCurveClick"
            @contextmenu.prevent="onRightClick"
        >
            <canvas
                ref="curveCanvasRef"
                class="minmax-curve-canvas"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { MinMaxCurve, MinMaxCurveMode, Color4, ImageUtil, serialization, watcher } from 'feng3d';
import { MenuAdapter } from './MenuAdapter';
import { useI18n } from '../composables/useI18n';
import { popupView } from './PopupView';
import MinMaxCurveEditor from './MinMaxCurveEditor.vue';

const props = withDefaults(defineProps<{
    minMaxCurve: MinMaxCurve;
    editable?: boolean;
}>(), {
    editable: true,
});

const emit = defineEmits<{
    change: [];
}>();

const curveGroupRef = ref<HTMLElement | null>(null);
const curveCanvasRef = ref<HTMLCanvasElement | null>(null);

// 当前模式
const mode = computed(() => props.minMaxCurve.mode);

// 模式标签
const modeLabel = computed(() => {
    const modeNames: Record<MinMaxCurveMode, string> = {
        [MinMaxCurveMode.Constant]: '常量',
        [MinMaxCurveMode.Curve]: '曲线',
        [MinMaxCurveMode.TwoConstants]: '两个常量',
        [MinMaxCurveMode.TwoCurves]: '两条曲线',
    };
    return modeNames[mode.value] || '未知';
});

// 常量变化
function onConstantChange(value: number | undefined) {
    if (value !== undefined) {
        props.minMaxCurve.constant = value;
        emit('change');
    }
}

// 最小常量变化
function onConstantMinChange(value: number | undefined) {
    if (value !== undefined) {
        props.minMaxCurve.constantMin = value;
        emit('change');
    }
}

// 最大常量变化
function onConstantMaxChange(value: number | undefined) {
    if (value !== undefined) {
        props.minMaxCurve.constantMax = value;
        emit('change');
    }
}

// 模式按钮点击
function onModeClick() {
    if (!props.editable) return;
    
    const menus = Object.values(MinMaxCurveMode)
        .filter(v => typeof v === 'number')
        .map((modeValue: MinMaxCurveMode) => ({
            label: getModeName(modeValue),
            click: () => {
                props.minMaxCurve.mode = modeValue;
                nextTick(() => {
                    drawCurve();
                    emit('change');
                });
            },
        }));
    
    const menuAdapter = new MenuAdapter();
    menuAdapter.popup(menus);
}

// 获取模式名称
function getModeName(modeValue: MinMaxCurveMode): string {
    const names: Record<MinMaxCurveMode, string> = {
        [MinMaxCurveMode.Constant]: '常量',
        [MinMaxCurveMode.Curve]: '曲线',
        [MinMaxCurveMode.TwoConstants]: '两个常量',
        [MinMaxCurveMode.TwoCurves]: '两条曲线',
    };
    return names[modeValue] || '未知';
}

// 绘制曲线
function drawCurve() {
    if (!curveCanvasRef.value || !curveGroupRef.value) return;
    
    const canvas = curveCanvasRef.value;
    const width = curveGroupRef.value.clientWidth - 2;
    const height = curveGroupRef.value.clientHeight - 2;
    
    if (width <= 0 || height <= 0) return;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清空画布
    ctx.fillStyle = '#565656';
    ctx.fillRect(0, 0, width, height);
    
    // 使用 ImageUtil 绘制曲线（如果可用）
    try {
        const imageUtil = new ImageUtil(width, height, Color4.fromUnit(0xff565656));
        
        if (props.minMaxCurve.mode === MinMaxCurveMode.Curve) {
            imageUtil.drawCurve(
                props.minMaxCurve.curve,
                props.minMaxCurve.between0And1,
                new Color4(1, 0, 0)
            );
        } else if (props.minMaxCurve.mode === MinMaxCurveMode.TwoCurves) {
            imageUtil.drawBetweenTwoCurves(
                props.minMaxCurve.curveMin || props.minMaxCurve.curve,
                props.minMaxCurve.curveMax,
                props.minMaxCurve.between0And1,
                new Color4(1, 0, 0)
            );
        }
        
        const dataURL = imageUtil.toDataURL();
        if (dataURL) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = dataURL;
        }
    } catch (e) {
        console.warn('Failed to draw curve:', e);
    }
}

// 曲线点击（打开编辑器）
function onCurveClick() {
    if (!props.editable) return;
    
    // 打开曲线编辑器窗口
    popupView.popupViewWindow(MinMaxCurveEditor, {
        width: 600,
        height: 500,
        mode: true,
        title: 'MinMax Curve Editor',
        props: {
            minMaxCurve: props.minMaxCurve,
            editable: props.editable,
            onChange: () => {
                // 编辑器变化时刷新视图
                nextTick(() => {
                    drawCurve();
                    emit('change');
                });
            },
        },
        closecallback: () => {
            // 编辑器关闭后刷新视图
            nextTick(() => {
                drawCurve();
            });
        },
    });
}

// 右键菜单
let copyCurve: MinMaxCurve | null = null;

function onRightClick(event: MouseEvent) {
    if (!props.editable) return;
    if (props.minMaxCurve.mode === MinMaxCurveMode.Constant || 
        props.minMaxCurve.mode === MinMaxCurveMode.TwoConstants) {
        return;
    }
    
    const { t } = useI18n();
    
    const menus: any[] = [{
        label: t('contextMenu.copy'),
        click: () => {
            copyCurve = serialization.clone(props.minMaxCurve);
        },
    }];

    if (copyCurve && 
        props.minMaxCurve.mode === copyCurve.mode && 
        copyCurve.between0And1 === props.minMaxCurve.between0And1) {
        menus.push({
            label: t('contextMenu.paste'),
            click: () => {
                if (copyCurve.mode === MinMaxCurveMode.Curve) {
                    props.minMaxCurve.curve = serialization.clone(copyCurve.curve);
                } else if (copyCurve.mode === MinMaxCurveMode.TwoCurves) {
                    props.minMaxCurve.curveMin = serialization.clone(copyCurve.curveMin || copyCurve.curve);
                    props.minMaxCurve.curveMax = serialization.clone(copyCurve.curveMax);
                }
                props.minMaxCurve.curveMultiplier = copyCurve.curveMultiplier;
                
                nextTick(() => {
                    drawCurve();
                    emit('change');
                });
            },
        });
    }
    
    const menuAdapter = new MenuAdapter();
    const placeholder = menuAdapter.popup(menus);
    placeholder.x = event.clientX;
    placeholder.y = event.clientY;
}

// 监听曲线变化
function onMinMaxCurveChanged() {
    nextTick(() => {
        drawCurve();
    });
}

// 监听尺寸变化
const resizeObserver = ref<ResizeObserver | null>(null);

onMounted(() => {
    drawCurve();
    
    // 监听曲线变化
    watcher.watch(props.minMaxCurve as any, 'mode' as any, onMinMaxCurveChanged);
    watcher.watch(props.minMaxCurve as any, 'curve' as any, onMinMaxCurveChanged);
    watcher.watch(props.minMaxCurve as any, 'curveMin' as any, onMinMaxCurveChanged);
    watcher.watch(props.minMaxCurve as any, 'curveMax' as any, onMinMaxCurveChanged);
    
    // 监听容器尺寸变化
    if (curveGroupRef.value) {
        resizeObserver.value = new ResizeObserver(() => {
            drawCurve();
        });
        resizeObserver.value.observe(curveGroupRef.value);
    }
});

onUnmounted(() => {
    if (resizeObserver.value) {
        resizeObserver.value.disconnect();
    }
    
    watcher.unwatch(props.minMaxCurve as any, 'mode' as any, onMinMaxCurveChanged);
    watcher.unwatch(props.minMaxCurve as any, 'curve' as any, onMinMaxCurveChanged);
    watcher.unwatch(props.minMaxCurve as any, 'curveMin' as any, onMinMaxCurveChanged);
    watcher.unwatch(props.minMaxCurve as any, 'curveMax' as any, onMinMaxCurveChanged);
});

// 监听模式变化
watch(() => mode.value, () => {
    nextTick(() => {
        drawCurve();
    });
});
</script>

<style scoped>
.minmax-curve-view {
    padding: 4px 0;
}

.minmax-curve-header {
    padding: 4px 8px;
}

.minmax-curve-constant,
.minmax-curve-two-constants {
    padding: 4px 8px;
    display: flex;
    gap: 8px;
    align-items: center;
}

.minmax-curve-curve {
    position: relative;
    width: 100%;
    height: 60px;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    background-color: var(--input-background, #1d1d1d);
    cursor: pointer;
}

.minmax-curve-canvas {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
