<template>
    <div class="terrain-view">
        <!-- 工具按钮组 -->
        <div class="terrain-toolbar">
            <el-button
                :type="activeTool === TerrainTool.RaiseLowerHeight ? 'primary' : 'default'"
                size="small"
                @click="onToolClick(TerrainTool.RaiseLowerHeight)"
                :title="t('terrain.raiseLowerHeight')"
            >
                <Icon icon="mdi:arrow-up-down" :size="16" />
            </el-button>
            <el-button
                :type="activeTool === TerrainTool.PaintHeight ? 'primary' : 'default'"
                size="small"
                @click="onToolClick(TerrainTool.PaintHeight)"
                :title="t('terrain.paintHeight')"
            >
                <Icon icon="mdi:brush" :size="16" />
            </el-button>
            <el-button
                :type="activeTool === TerrainTool.SmoothHeight ? 'primary' : 'default'"
                size="small"
                @click="onToolClick(TerrainTool.SmoothHeight)"
                :title="t('terrain.smoothHeight')"
            >
                <Icon icon="mdi:waves" :size="16" />
            </el-button>
            <el-button
                :type="activeTool === TerrainTool.PaintTexture ? 'primary' : 'default'"
                size="small"
                @click="onToolClick(TerrainTool.PaintTexture)"
                :title="t('terrain.paintTexture')"
            >
                <Icon icon="mdi:texture" :size="16" />
            </el-button>
            <el-button
                :type="activeTool === TerrainTool.Settings ? 'primary' : 'default'"
                size="small"
                @click="onToolClick(TerrainTool.Settings)"
                :title="t('terrain.settings')"
            >
                <Icon icon="mdi:cog" :size="16" />
            </el-button>
        </div>

        <!-- 画笔选择区域 -->
        <div class="terrain-brushes-section">
            <div class="terrain-section-title">{{ t('terrain.brushes') }}</div>
            <div class="terrain-brushes-grid">
                <div
                    v-for="index in 20"
                    :key="index"
                    :class="['terrain-brush-item', { 'is-selected': selectedBrush === index - 1 }]"
                    @click="onBrushSelect(index - 1)"
                >
                    <img
                        :src="getBrushImageUrl(index - 1)"
                        :alt="`Brush ${index}`"
                        class="terrain-brush-image"
                    />
                </div>
            </div>
        </div>

        <!-- 设置面板 -->
        <div v-if="activeTool !== TerrainTool.None" class="terrain-settings-section">
            <div class="terrain-section-title">{{ t('terrain.settings') }}</div>
            
            <!-- 提升/降低高度设置 -->
            <div v-if="activeTool === TerrainTool.RaiseLowerHeight" class="terrain-settings-content">
                <div class="terrain-setting-item">
                    <label class="terrain-setting-label">{{ t('terrain.brushSize') }}</label>
                    <div class="terrain-setting-control">
                        <el-slider
                            v-model="raiseLowerBrushSize"
                            :min="1"
                            :max="100"
                            :step="1"
                            @change="onRaiseLowerBrushSizeChange"
                        />
                        <el-input-number
                            v-model="raiseLowerBrushSize"
                            :min="1"
                            :max="100"
                            :step="1"
                            size="small"
                            style="width: 60px; margin-left: 8px"
                            @change="onRaiseLowerBrushSizeChange"
                        />
                    </div>
                </div>
                <div class="terrain-setting-item">
                    <label class="terrain-setting-label">{{ t('terrain.opacity') }}</label>
                    <div class="terrain-setting-control">
                        <el-slider
                            v-model="raiseLowerOpacity"
                            :min="0"
                            :max="100"
                            :step="1"
                            @change="onRaiseLowerOpacityChange"
                        />
                        <el-input-number
                            v-model="raiseLowerOpacity"
                            :min="0"
                            :max="100"
                            :step="1"
                            size="small"
                            style="width: 60px; margin-left: 8px"
                            @change="onRaiseLowerOpacityChange"
                        />
                    </div>
                </div>
            </div>

            <!-- 绘制高度设置 -->
            <div v-if="activeTool === TerrainTool.PaintHeight" class="terrain-settings-content">
                <div class="terrain-setting-item">
                    <label class="terrain-setting-label">{{ t('terrain.brushSize') }}</label>
                    <div class="terrain-setting-control">
                        <el-slider
                            v-model="paintHeightBrushSize"
                            :min="1"
                            :max="100"
                            :step="1"
                            @change="onPaintHeightBrushSizeChange"
                        />
                        <el-input-number
                            v-model="paintHeightBrushSize"
                            :min="1"
                            :max="100"
                            :step="1"
                            size="small"
                            style="width: 60px; margin-left: 8px"
                            @change="onPaintHeightBrushSizeChange"
                        />
                    </div>
                </div>
                <div class="terrain-setting-item">
                    <label class="terrain-setting-label">{{ t('terrain.opacity') }}</label>
                    <div class="terrain-setting-control">
                        <el-slider
                            v-model="paintHeightOpacity"
                            :min="0"
                            :max="100"
                            :step="1"
                            @change="onPaintHeightOpacityChange"
                        />
                        <el-input-number
                            v-model="paintHeightOpacity"
                            :min="0"
                            :max="100"
                            :step="1"
                            size="small"
                            style="width: 60px; margin-left: 8px"
                            @change="onPaintHeightOpacityChange"
                        />
                    </div>
                </div>
                <div class="terrain-setting-item">
                    <label class="terrain-setting-label">{{ t('terrain.height') }}</label>
                    <div class="terrain-setting-control">
                        <el-slider
                            v-model="paintHeightValue"
                            :min="0"
                            :max="100"
                            :step="1"
                            @change="onPaintHeightValueChange"
                        />
                        <el-input-number
                            v-model="paintHeightValue"
                            :min="0"
                            :max="100"
                            :step="1"
                            size="small"
                            style="width: 60px; margin-left: 8px"
                            @change="onPaintHeightValueChange"
                        />
                    </div>
                </div>
            </div>

            <!-- 平滑高度设置 -->
            <div v-if="activeTool === TerrainTool.SmoothHeight" class="terrain-settings-content">
                <div class="terrain-setting-item">
                    <label class="terrain-setting-label">{{ t('terrain.brushSize') }}</label>
                    <div class="terrain-setting-control">
                        <el-slider
                            v-model="smoothBrushSize"
                            :min="1"
                            :max="100"
                            :step="1"
                            @change="onSmoothBrushSizeChange"
                        />
                        <el-input-number
                            v-model="smoothBrushSize"
                            :min="1"
                            :max="100"
                            :step="1"
                            size="small"
                            style="width: 60px; margin-left: 8px"
                            @change="onSmoothBrushSizeChange"
                        />
                    </div>
                </div>
                <div class="terrain-setting-item">
                    <label class="terrain-setting-label">{{ t('terrain.opacity') }}</label>
                    <div class="terrain-setting-control">
                        <el-slider
                            v-model="smoothOpacity"
                            :min="0"
                            :max="100"
                            :step="1"
                            @change="onSmoothOpacityChange"
                        />
                        <el-input-number
                            v-model="smoothOpacity"
                            :min="0"
                            :max="100"
                            :step="1"
                            size="small"
                            style="width: 60px; margin-left: 8px"
                            @change="onSmoothOpacityChange"
                        />
                    </div>
                </div>
            </div>

            <!-- 绘制纹理设置 -->
            <div v-if="activeTool === TerrainTool.PaintTexture" class="terrain-settings-content">
                <div class="terrain-setting-item">
                    <label class="terrain-setting-label">{{ t('terrain.brushSize') }}</label>
                    <div class="terrain-setting-control">
                        <el-slider
                            v-model="paintTextureBrushSize"
                            :min="1"
                            :max="100"
                            :step="1"
                            @change="onPaintTextureBrushSizeChange"
                        />
                        <el-input-number
                            v-model="paintTextureBrushSize"
                            :min="1"
                            :max="100"
                            :step="1"
                            size="small"
                            style="width: 60px; margin-left: 8px"
                            @change="onPaintTextureBrushSizeChange"
                        />
                    </div>
                </div>
                <div class="terrain-setting-item">
                    <label class="terrain-setting-label">{{ t('terrain.opacity') }}</label>
                    <div class="terrain-setting-control">
                        <el-slider
                            v-model="paintTextureOpacity"
                            :min="0"
                            :max="100"
                            :step="1"
                            @change="onPaintTextureOpacityChange"
                        />
                        <el-input-number
                            v-model="paintTextureOpacity"
                            :min="0"
                            :max="100"
                            :step="1"
                            size="small"
                            style="width: 60px; margin-left: 8px"
                            @change="onPaintTextureOpacityChange"
                        />
                    </div>
                </div>
                <div class="terrain-setting-item">
                    <label class="terrain-setting-label">{{ t('terrain.targetStrength') }}</label>
                    <div class="terrain-setting-control">
                        <el-slider
                            v-model="paintTextureTargetStrength"
                            :min="0"
                            :max="100"
                            :step="1"
                            @change="onPaintTextureTargetStrengthChange"
                        />
                        <el-input-number
                            v-model="paintTextureTargetStrength"
                            :min="0"
                            :max="100"
                            :step="1"
                            size="small"
                            style="width: 60px; margin-left: 8px"
                            @change="onPaintTextureTargetStrengthChange"
                        />
                    </div>
                </div>
            </div>

            <!-- 设置工具 -->
            <div v-if="activeTool === TerrainTool.Settings" class="terrain-settings-content">
                <div class="terrain-setting-item">
                    <label class="terrain-setting-label">{{ t('terrain.terrainSettings') }}</label>
                    <div class="terrain-setting-control">
                        <el-button size="small" @click="onTerrainSettingsClick">
                            {{ t('terrain.openSettings') }}
                        </el-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from '../composables/useI18n';
import Icon from './Icon.vue';

/**
 * 地形工具枚举
 */
export enum TerrainTool {
    None = 0,
    RaiseLowerHeight = 1,
    PaintHeight = 2,
    SmoothHeight = 3,
    PaintTexture = 4,
    Settings = 5,
}

const props = defineProps<{
    terrain?: any; // Terrain 组件实例
}>();

const emit = defineEmits<{
    toolChange: [tool: TerrainTool];
    brushChange: [brushIndex: number];
    settingsChange: [settings: any];
}>();

const { t } = useI18n();

// 当前激活的工具
const activeTool = ref<TerrainTool>(TerrainTool.None);

// 选中的画笔索引
const selectedBrush = ref(0);

// 提升/降低高度设置
const raiseLowerBrushSize = ref(20);
const raiseLowerOpacity = ref(50);

// 绘制高度设置
const paintHeightBrushSize = ref(20);
const paintHeightOpacity = ref(50);
const paintHeightValue = ref(50);

// 平滑高度设置
const smoothBrushSize = ref(20);
const smoothOpacity = ref(50);

// 绘制纹理设置
const paintTextureBrushSize = ref(20);
const paintTextureOpacity = ref(50);
const paintTextureTargetStrength = ref(50);

// 工具点击
function onToolClick(tool: TerrainTool) {
    if (activeTool.value === tool) {
        // 如果点击的是当前激活的工具，则取消激活
        activeTool.value = TerrainTool.None;
    } else {
        activeTool.value = tool;
    }
    emit('toolChange', activeTool.value);
}

// 画笔选择
function onBrushSelect(index: number) {
    selectedBrush.value = index;
    emit('brushChange', index);
}

/**
 * 获取画笔图片 URL
 * @param index 画笔索引 (0-19)
 * @returns 画笔图片 URL
 */
function getBrushImageUrl(index: number): string {
    // 尝试从资源中加载画笔图片
    // 如果资源不存在，返回占位符
    const brushName = `terrain_brushes_${index}_png`;
    // TODO: 从资源管理器加载图片
    // 这里暂时返回一个占位符路径
    // 实际使用时应该通过资源管理器获取图片 URL
    try {
        // 尝试从资源系统获取
        // const resource = EditorRS.getRes(brushName);
        // if (resource) return resource;
    } catch (e) {
        // 资源加载失败，使用占位符
    }
    // 使用相对路径，与 index.html 处于同一层级
    return `./resource/assets/${brushName}`;
}

// 设置变化处理函数
function onRaiseLowerBrushSizeChange() {
    emit('settingsChange', {
        tool: TerrainTool.RaiseLowerHeight,
        brushSize: raiseLowerBrushSize.value,
    });
}

function onRaiseLowerOpacityChange() {
    emit('settingsChange', {
        tool: TerrainTool.RaiseLowerHeight,
        opacity: raiseLowerOpacity.value,
    });
}

function onPaintHeightBrushSizeChange() {
    emit('settingsChange', {
        tool: TerrainTool.PaintHeight,
        brushSize: paintHeightBrushSize.value,
    });
}

function onPaintHeightOpacityChange() {
    emit('settingsChange', {
        tool: TerrainTool.PaintHeight,
        opacity: paintHeightOpacity.value,
    });
}

function onPaintHeightValueChange() {
    emit('settingsChange', {
        tool: TerrainTool.PaintHeight,
        height: paintHeightValue.value,
    });
}

function onSmoothBrushSizeChange() {
    emit('settingsChange', {
        tool: TerrainTool.SmoothHeight,
        brushSize: smoothBrushSize.value,
    });
}

function onSmoothOpacityChange() {
    emit('settingsChange', {
        tool: TerrainTool.SmoothHeight,
        opacity: smoothOpacity.value,
    });
}

function onPaintTextureBrushSizeChange() {
    emit('settingsChange', {
        tool: TerrainTool.PaintTexture,
        brushSize: paintTextureBrushSize.value,
    });
}

function onPaintTextureOpacityChange() {
    emit('settingsChange', {
        tool: TerrainTool.PaintTexture,
        opacity: paintTextureOpacity.value,
    });
}

function onPaintTextureTargetStrengthChange() {
    emit('settingsChange', {
        tool: TerrainTool.PaintTexture,
        targetStrength: paintTextureTargetStrength.value,
    });
}

function onTerrainSettingsClick() {
    // TODO: 打开地形设置对话框
    console.log('Open terrain settings');
}

// 暴露给外部使用
defineExpose({
    activeTool,
    selectedBrush,
    settings: computed(() => ({
        raiseLower: {
            brushSize: raiseLowerBrushSize.value,
            opacity: raiseLowerOpacity.value,
        },
        paintHeight: {
            brushSize: paintHeightBrushSize.value,
            opacity: paintHeightOpacity.value,
            height: paintHeightValue.value,
        },
        smooth: {
            brushSize: smoothBrushSize.value,
            opacity: smoothOpacity.value,
        },
        paintTexture: {
            brushSize: paintTextureBrushSize.value,
            opacity: paintTextureOpacity.value,
            targetStrength: paintTextureTargetStrength.value,
        },
    })),
});
</script>

<style scoped>
.terrain-view {
    width: 100%;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.terrain-toolbar {
    display: flex;
    gap: 4px;
    justify-content: center;
    padding: 4px 0;
    border-bottom: 1px solid var(--sideBar-border, #3d3d3d);
}

.terrain-brushes-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.terrain-section-title {
    font-size: 12px;
    font-weight: bold;
    color: var(--editor-foreground, #e5e5e5);
    padding: 4px 0;
}

.terrain-brushes-grid {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 4px;
    padding: 8px;
    background-color: var(--sideBar-background, #2d2d2d);
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 4px;
}

.terrain-brush-item {
    width: 32px;
    height: 32px;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.terrain-brush-item:hover {
    border-color: var(--button-background, #409eff);
    background-color: var(--sideBar-background, #3d3d3d);
}

.terrain-brush-item.is-selected {
    border-color: var(--button-background, #409eff);
    background-color: var(--button-hoverBackground, rgba(64, 158, 255, 0.1));
}

.terrain-brush-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.terrain-settings-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.terrain-settings-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px;
    background-color: var(--sideBar-background, #2d2d2d);
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 4px;
}

.terrain-setting-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.terrain-setting-label {
    font-size: 12px;
    color: var(--foreground, #b0b0b0);
    min-width: 80px;
}

.terrain-setting-control {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}
</style>