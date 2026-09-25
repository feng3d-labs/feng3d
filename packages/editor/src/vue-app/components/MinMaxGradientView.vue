<template>
    <div class="minmax-gradient-view">
        <!-- 模式选择按钮 -->
        <div class="minmax-gradient-header">
            <el-button
                size="small"
                @click="onModeClick"
            >
                {{ modeLabel }}
            </el-button>
        </div>

        <!-- 颜色模式 -->
        <div v-if="mode === MinMaxGradientMode.Color" class="minmax-gradient-color">
            <div
                ref="colorGroup0Ref"
                class="minmax-gradient-color-preview"
                :style="{ backgroundColor: color0Hex }"
                @click="onColor0Click"
                @contextmenu.prevent="onRightClick"
            />
        </div>

        <!-- 渐变模式 -->
        <div v-else-if="mode === MinMaxGradientMode.Gradient" class="minmax-gradient-gradient">
            <div
                ref="gradientGroup0Ref"
                class="minmax-gradient-gradient-preview"
                @click="onGradient0Click"
                @contextmenu.prevent="onRightClick"
            >
                <canvas ref="gradientCanvas0Ref" class="minmax-gradient-canvas" />
            </div>
        </div>

        <!-- 两个颜色模式 -->
        <div v-else-if="mode === MinMaxGradientMode.TwoColors" class="minmax-gradient-two-colors">
            <div
                ref="colorGroup0Ref"
                class="minmax-gradient-color-preview"
                :style="{ backgroundColor: color0Hex }"
                @click="onColor0Click"
                @contextmenu.prevent="onRightClick"
            />
            <div
                ref="colorGroup1Ref"
                class="minmax-gradient-color-preview"
                :style="{ backgroundColor: color1Hex }"
                @click="onColor1Click"
                @contextmenu.prevent="onRightClick"
            />
        </div>

        <!-- 两个渐变模式 -->
        <div v-else-if="mode === MinMaxGradientMode.TwoGradients" class="minmax-gradient-two-gradients">
            <div
                ref="gradientGroup0Ref"
                class="minmax-gradient-gradient-preview"
                @click="onGradient0Click"
                @contextmenu.prevent="onRightClick"
            >
                <canvas ref="gradientCanvas0Ref" class="minmax-gradient-canvas" />
            </div>
            <div
                ref="gradientGroup1Ref"
                class="minmax-gradient-gradient-preview"
                @click="onGradient1Click"
                @contextmenu.prevent="onRightClick"
            >
                <canvas ref="gradientCanvas1Ref" class="minmax-gradient-canvas" />
            </div>
        </div>

        <!-- 随机颜色模式 -->
        <div v-else-if="mode === MinMaxGradientMode.RandomColor" class="minmax-gradient-random-color">
            <div
                ref="colorGroup0Ref"
                class="minmax-gradient-color-preview"
                :style="{ backgroundColor: color0Hex }"
                @click="onColor0Click"
                @contextmenu.prevent="onRightClick"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { MinMaxGradient, MinMaxGradientMode, Color4, ImageUtil, serialization, watcher, Gradient } from 'feng3d';
import { MenuAdapter } from './MenuAdapter';
import { popupView } from './PopupView';
import { useI18n } from '../composables/useI18n';

const props = withDefaults(defineProps<{
    minMaxGradient: MinMaxGradient;
    editable?: boolean;
}>(), {
    editable: true,
});

const emit = defineEmits<{
    change: [];
}>();

const { t } = useI18n();

const colorGroup0Ref = ref<HTMLElement | null>(null);
const colorGroup1Ref = ref<HTMLElement | null>(null);
const gradientGroup0Ref = ref<HTMLElement | null>(null);
const gradientGroup1Ref = ref<HTMLElement | null>(null);
const gradientCanvas0Ref = ref<HTMLCanvasElement | null>(null);
const gradientCanvas1Ref = ref<HTMLCanvasElement | null>(null);

// 当前模式
const mode = computed(() => props.minMaxGradient.mode);

// 模式标签
const modeLabel = computed(() => {
    const modeNames: Record<MinMaxGradientMode, string> = {
        [MinMaxGradientMode.Color]: t('gradient.color'),
        [MinMaxGradientMode.Gradient]: t('gradient.gradient'),
        [MinMaxGradientMode.TwoColors]: t('gradient.twoColors'),
        [MinMaxGradientMode.TwoGradients]: t('gradient.twoGradients'),
        [MinMaxGradientMode.RandomColor]: t('gradient.randomColor'),
    };
    return modeNames[mode.value] || t('gradient.unknown');
});

// 颜色0的十六进制值
const color0Hex = computed(() => {
    const color = props.minMaxGradient.mode === MinMaxGradientMode.Color
        ? props.minMaxGradient.color
        : props.minMaxGradient.mode === MinMaxGradientMode.TwoColors
            ? props.minMaxGradient.colorMin
            : props.minMaxGradient.mode === MinMaxGradientMode.RandomColor
                ? props.minMaxGradient.getValue(0)
                : new Color4(1, 1, 1, 1);
    
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `rgb(${r}, ${g}, ${b})`;
});

// 颜色1的十六进制值
const color1Hex = computed(() => {
    if (props.minMaxGradient.mode !== MinMaxGradientMode.TwoColors) {
        return '#ffffff';
    }
    const color = props.minMaxGradient.colorMax;
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `rgb(${r}, ${g}, ${b})`;
});

// 绘制渐变
function drawGradient(canvas: HTMLCanvasElement, gradient: any, width: number, height: number) {
    if (!canvas || width <= 0 || height <= 0) return;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    try {
        const imageUtil = new ImageUtil(width, height);
        imageUtil.drawMinMaxGradient(gradient, true);
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
        console.warn('Failed to draw gradient:', e);
    }
}

// 更新渐变视图
function updateGradientViews() {
    nextTick(() => {
        if (props.minMaxGradient.mode === MinMaxGradientMode.Gradient && gradientGroup0Ref.value && gradientCanvas0Ref.value) {
            const width = gradientGroup0Ref.value.clientWidth;
            const height = gradientGroup0Ref.value.clientHeight;
            drawGradient(gradientCanvas0Ref.value, props.minMaxGradient.gradient, width, height);
        } else if (props.minMaxGradient.mode === MinMaxGradientMode.TwoGradients) {
            if (gradientGroup0Ref.value && gradientCanvas0Ref.value) {
                const width = gradientGroup0Ref.value.clientWidth;
                const height = gradientGroup0Ref.value.clientHeight;
                drawGradient(gradientCanvas0Ref.value, props.minMaxGradient.gradientMin, width, height);
            }
            if (gradientGroup1Ref.value && gradientCanvas1Ref.value) {
                const width = gradientGroup1Ref.value.clientWidth;
                const height = gradientGroup1Ref.value.clientHeight;
                drawGradient(gradientCanvas1Ref.value, props.minMaxGradient.gradientMax, width, height);
            }
        }
    });
}

// 模式按钮点击
function onModeClick() {
    if (!props.editable) return;
    
    const menus = Object.values(MinMaxGradientMode)
        .filter(v => typeof v === 'number')
        .map((modeValue: MinMaxGradientMode) => ({
            label: getModeName(modeValue),
            click: () => {
                props.minMaxGradient.mode = modeValue;
                nextTick(() => {
                    updateGradientViews();
                    emit('change');
                });
            },
        }));
    
    const menuAdapter = new MenuAdapter();
    menuAdapter.popup(menus);
}

// 获取模式名称
function getModeName(modeValue: MinMaxGradientMode): string {
    const names: Record<MinMaxGradientMode, string> = {
        [MinMaxGradientMode.Color]: t('gradient.color'),
        [MinMaxGradientMode.Gradient]: t('gradient.gradient'),
        [MinMaxGradientMode.TwoColors]: t('gradient.twoColors'),
        [MinMaxGradientMode.TwoGradients]: t('gradient.twoGradients'),
        [MinMaxGradientMode.RandomColor]: t('gradient.randomColor'),
    };
    return names[modeValue] || t('gradient.unknown');
}

// 颜色0点击
function onColor0Click() {
    if (!props.editable) return;
    // TODO: 打开颜色选择器
    // 可以使用 OAVColorPicker 的逻辑
    console.log('Open color picker for color0');
}

// 颜色1点击
function onColor1Click() {
    if (!props.editable) return;
    // TODO: 打开颜色选择器
    console.log('Open color picker for color1');
}

// 渐变0点击
function onGradient0Click() {
    if (!props.editable) return;
    openGradientEditor(props.minMaxGradient.gradient);
}

// 渐变1点击
function onGradient1Click() {
    if (!props.editable) return;
    if (props.minMaxGradient.gradientMin) {
        openGradientEditor(props.minMaxGradient.gradientMin);
    }
}

// 打开渐变编辑器
async function openGradientEditor(gradient: Gradient) {
    const module = await import('./GradientEditor.vue');
    const GradientEditor = module.default;
    
    // 创建容器
    const container = document.createElement('div');
    container.style.width = '450px';
    container.style.height = '300px';
    
    // 创建 Vue 应用实例
    const { createApp, h } = await import('vue');
    const app = createApp({
        render: () => h(GradientEditor, {
            gradient: gradient,
            editable: true,
            onChange: () => {
                emit('change');
            },
        }),
    });
    
    app.mount(container);
    
    const rect = gradientGroup0Ref.value?.getBoundingClientRect();
    const pos = rect ? { x: rect.left - 318, y: rect.top } : { x: 100, y: 100 };
    
    // 使用 popupView 而不是 popupViewWindow
    popupView.popupView(container as any, {
        x: pos.x,
        y: pos.y,
        width: 450,
        height: 300,
        closecallback: () => {
            app.unmount();
        },
    });
}

// 右键菜单
let copyGradient: MinMaxGradient | null = null;

function onRightClick(event: MouseEvent) {
    if (!props.editable) return;
    
    const menus: any[] = [{
        label: t('contextMenu.copy'),
        click: () => {
            copyGradient = serialization.clone(props.minMaxGradient);
        },
    }];
    
    if (copyGradient && props.minMaxGradient.mode === copyGradient.mode) {
        menus.push({
            label: t('contextMenu.paste'),
            click: () => {
                if (copyGradient.mode === MinMaxGradientMode.Color) {
                    props.minMaxGradient.color = serialization.clone(copyGradient.color);
                } else if (copyGradient.mode === MinMaxGradientMode.Gradient) {
                    props.minMaxGradient.gradient = serialization.clone(copyGradient.gradient);
                } else if (copyGradient.mode === MinMaxGradientMode.TwoColors) {
                    props.minMaxGradient.colorMin = serialization.clone(copyGradient.colorMin);
                    props.minMaxGradient.colorMax = serialization.clone(copyGradient.colorMax);
                } else if (copyGradient.mode === MinMaxGradientMode.TwoGradients) {
                    props.minMaxGradient.gradientMin = serialization.clone(copyGradient.gradientMin);
                    props.minMaxGradient.gradientMax = serialization.clone(copyGradient.gradientMax);
                }
                
                nextTick(() => {
                    updateGradientViews();
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

// 监听渐变变化
function onMinMaxGradientChanged() {
    updateGradientViews();
}

// 监听尺寸变化
const resizeObserver0 = ref<ResizeObserver | null>(null);
const resizeObserver1 = ref<ResizeObserver | null>(null);

onMounted(() => {
    updateGradientViews();
    
    // 监听渐变变化
    watcher.watch(props.minMaxGradient as any, 'mode' as any, onMinMaxGradientChanged);
    watcher.watch(props.minMaxGradient as any, 'color' as any, onMinMaxGradientChanged);
    watcher.watch(props.minMaxGradient as any, 'colorMin' as any, onMinMaxGradientChanged);
    watcher.watch(props.minMaxGradient as any, 'colorMax' as any, onMinMaxGradientChanged);
    watcher.watch(props.minMaxGradient as any, 'gradient' as any, onMinMaxGradientChanged);
    watcher.watch(props.minMaxGradient as any, 'gradientMin' as any, onMinMaxGradientChanged);
    watcher.watch(props.minMaxGradient as any, 'gradientMax' as any, onMinMaxGradientChanged);
    
    // 监听容器尺寸变化
    if (gradientGroup0Ref.value) {
        resizeObserver0.value = new ResizeObserver(() => {
            updateGradientViews();
        });
        resizeObserver0.value.observe(gradientGroup0Ref.value);
    }
    
    if (gradientGroup1Ref.value) {
        resizeObserver1.value = new ResizeObserver(() => {
            updateGradientViews();
        });
        resizeObserver1.value.observe(gradientGroup1Ref.value);
    }
});

onUnmounted(() => {
    if (resizeObserver0.value) {
        resizeObserver0.value.disconnect();
    }
    if (resizeObserver1.value) {
        resizeObserver1.value.disconnect();
    }
    
    watcher.unwatch(props.minMaxGradient as any, 'mode' as any, onMinMaxGradientChanged);
    watcher.unwatch(props.minMaxGradient as any, 'color' as any, onMinMaxGradientChanged);
    watcher.unwatch(props.minMaxGradient as any, 'colorMin' as any, onMinMaxGradientChanged);
    watcher.unwatch(props.minMaxGradient as any, 'colorMax' as any, onMinMaxGradientChanged);
    watcher.unwatch(props.minMaxGradient as any, 'gradient' as any, onMinMaxGradientChanged);
    watcher.unwatch(props.minMaxGradient as any, 'gradientMin' as any, onMinMaxGradientChanged);
    watcher.unwatch(props.minMaxGradient as any, 'gradientMax' as any, onMinMaxGradientChanged);
});

// 监听模式变化
watch(() => mode.value, () => {
    updateGradientViews();
});
</script>

<style scoped>
.minmax-gradient-view {
    padding: 4px 0;
}

.minmax-gradient-header {
    padding: 4px 8px;
}

.minmax-gradient-color,
.minmax-gradient-gradient,
.minmax-gradient-two-colors,
.minmax-gradient-two-gradients,
.minmax-gradient-random-color {
    padding: 4px 8px;
    display: flex;
    gap: 8px;
    align-items: center;
}

.minmax-gradient-color-preview {
    width: 100%;
    height: 30px;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    cursor: pointer;
    border-radius: 2px;
}

.minmax-gradient-gradient-preview {
    position: relative;
    width: 100%;
    height: 30px;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    background-color: var(--input-background, #1d1d1d);
    cursor: pointer;
    border-radius: 2px;
}

.minmax-gradient-canvas {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
