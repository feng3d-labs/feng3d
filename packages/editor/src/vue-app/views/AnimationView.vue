<template>
    <div class="animation-view">
        <!-- 空状态 -->
        <div v-if="!animationComponent" class="animation-empty">
            <div class="empty-message">
                <el-icon :size="48" style="color: var(--el-text-color-secondary, #666666); margin-bottom: 16px;">
                    <VideoPlay />
                </el-icon>
                <p>{{ t('animation.noAnimationComponent') }}</p>
            </div>
        </div>

        <!-- 动画视图内容 -->
        <div v-else class="animation-content">
            <SplitPanel direction="horizontal" :split="0.3" :min-size="220">
                <!-- 左侧：控制面板和属性列表 -->
                <template #first>
                    <div class="animation-left-panel">
                        <!-- 播放控制栏 -->
                        <div class="animation-controls">
                            <div class="control-buttons">
                                <el-button
                                    size="small"
                                    :title="t('animation.record')"
                                    @click="onRecordClick"
                                >
                                    <el-icon><VideoCamera /></el-icon>
                                </el-button>
                                <el-button
                                    size="small"
                                    :title="t('animation.begin')"
                                    @click="onBeginClick"
                                >
                                    <el-icon><DArrowLeft /></el-icon>
                                </el-button>
                                <el-button
                                    size="small"
                                    :title="t('animation.previous')"
                                    @click="onPreviousClick"
                                >
                                    <el-icon><ArrowLeft /></el-icon>
                                </el-button>
                                <el-button
                                    size="small"
                                    :type="isPlaying ? 'primary' : 'default'"
                                    :title="isPlaying ? t('animation.pause') : t('animation.play')"
                                    @click="onPlayPauseClick"
                                >
                                    <el-icon v-if="isPlaying"><VideoPause /></el-icon>
                                    <el-icon v-else><VideoPlay /></el-icon>
                                </el-button>
                                <el-button
                                    size="small"
                                    :title="t('animation.next')"
                                    @click="onNextClick"
                                >
                                    <el-icon><ArrowRight /></el-icon>
                                </el-button>
                                <el-button
                                    size="small"
                                    :title="t('animation.end')"
                                    @click="onEndClick"
                                >
                                    <el-icon><DArrowRight /></el-icon>
                                </el-button>
                            </div>
                            <div class="time-display">
                                <el-input
                                    v-model.number="currentTimeInput"
                                    size="small"
                                    style="width: 80px"
                                    @change="onTimeInputChange"
                                />
                                <span class="time-separator">/</span>
                                <span class="time-total">{{ formatTime(totalTime) }}</span>
                            </div>
                        </div>

                        <!-- 动画片段和帧率设置 -->
                        <div class="animation-settings">
                            <div class="setting-row">
                                <el-select
                                    v-model="selectedClipIndex"
                                    size="small"
                                    style="flex: 1"
                                    :placeholder="t('animation.animationClip')"
                                    @change="onClipChange"
                                >
                                    <el-option
                                        v-for="(clip, index) in animationClips"
                                        :key="index"
                                        :label="clip?.name || t('animation.noAnimationClip')"
                                        :value="index"
                                    />
                                </el-select>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">{{ t('animation.fps') }}:</span>
                                <el-input-number
                                    v-model.number="fps"
                                    size="small"
                                    :min="1"
                                    :max="120"
                                    style="width: 80px"
                                />
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">{{ t('animation.speed') }}:</span>
                                <el-input-number
                                    v-model.number="playSpeed"
                                    size="small"
                                    :min="0.1"
                                    :max="5"
                                    :step="0.1"
                                    style="width: 80px"
                                    @change="onSpeedChange"
                                />
                            </div>
                        </div>

                        <!-- 属性列表 -->
                        <div class="animation-properties">
                            <div class="properties-header">
                                <span>{{ t('animation.properties') }}</span>
                            </div>
                            <div class="properties-list">
                                <div
                                    v-for="(propertyClip, index) in propertyClips"
                                    :key="index"
                                    class="property-item"
                                >
                                    <span class="property-name">{{ getPropertyName(propertyClip) }}</span>
                                    <span class="property-type">{{ propertyClip.type }}</span>
                                </div>
                                <div v-if="propertyClips.length === 0" class="property-empty">
                                    {{ t('animation.noAnimationClip') }}
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- 右侧：时间轴/曲线编辑器 -->
                <template #second>
                    <div class="animation-timeline">
                        <div class="timeline-header">
                            <span>{{ t('animation.timeline') }}</span>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-placeholder">
                                <el-icon :size="48" style="color: var(--el-text-color-secondary, #666666); margin-bottom: 16px;">
                                    <DataLine />
                                </el-icon>
                                <p>{{ t('animation.create') }}</p>
                            </div>
                        </div>
                    </div>
                </template>
            </SplitPanel>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { Animation, AnimationClip, PropertyClip, GameObject, globalEmitter, watcher } from 'feng3d';
import { useEditorStore } from '../stores/editorStore';
import { useI18n } from '../composables/useI18n';
import SplitPanel from '../components/SplitPanel.vue';
import {
    VideoPlay,
    VideoPause,
    VideoCamera,
    ArrowLeft,
    ArrowRight,
    DArrowLeft,
    DArrowRight,
    DataLine,
} from '@element-plus/icons-vue';

const editorStore = useEditorStore();
const { t } = useI18n();

// 动画组件引用
const animationComponent = ref<Animation | null>(null);

// 播放状态
const isPlaying = computed(() => animationComponent.value?.isplaying || false);
const currentTime = computed(() => animationComponent.value?.time || 0);
const totalTime = computed(() => {
    const clip = animationComponent.value?.animation;
    return clip?.length || 0;
});

// 当前时间输入
const currentTimeInput = ref(0);

// 动画片段列表
const animationClips = computed(() => {
    return animationComponent.value?.animations || [];
});

// 选中的动画片段索引
const selectedClipIndex = ref(-1);

// 当前动画片段
const currentClip = computed(() => {
    if (selectedClipIndex.value >= 0 && animationClips.value[selectedClipIndex.value]) {
        return animationClips.value[selectedClipIndex.value];
    }
    return animationComponent.value?.animation || null;
});

// 属性片段列表
const propertyClips = computed(() => {
    return currentClip.value?.propertyClips || [];
});

// 帧率
const fps = ref(60);

// 播放速度
const playSpeed = computed({
    get: () => animationComponent.value?.playspeed || 1,
    set: (value) => {
        if (animationComponent.value) {
            animationComponent.value.playspeed = value;
        }
    },
});

// 格式化时间（毫秒转秒，保留2位小数）
function formatTime(ms: number): string {
    return (ms / 1000).toFixed(2);
}

// 获取属性名称
function getPropertyName(propertyClip: any): string {
    const path = propertyClip.path;
    if (path && path.length > 0) {
        const lastItem = path[path.length - 1];
        if (lastItem && lastItem.length >= 2) {
            return `${lastItem[1]}.${propertyClip.propertyName}`;
        }
    }
    return propertyClip.propertyName || 'Unknown';
}

// 播放/暂停
function onPlayPauseClick() {
    if (!animationComponent.value) return;
    
    if (isPlaying.value) {
        animationComponent.value.isplaying = false;
    } else {
        animationComponent.value.isplaying = true;
    }
}

// 开始
function onBeginClick() {
    if (!animationComponent.value) return;
    animationComponent.value.time = 0;
    animationComponent.value.isplaying = false;
}

// 上一帧
function onPreviousClick() {
    if (!animationComponent.value) return;
    const frameTime = 1000 / fps.value; // 每帧时间（毫秒）
    const newTime = Math.max(0, currentTime.value - frameTime);
    animationComponent.value.time = newTime;
    animationComponent.value.isplaying = false;
}

// 下一帧
function onNextClick() {
    if (!animationComponent.value) return;
    const frameTime = 1000 / fps.value; // 每帧时间（毫秒）
    const newTime = Math.min(totalTime.value, currentTime.value + frameTime);
    animationComponent.value.time = newTime;
    animationComponent.value.isplaying = false;
}

// 结束
function onEndClick() {
    if (!animationComponent.value) return;
    animationComponent.value.time = totalTime.value;
    animationComponent.value.isplaying = false;
}

// 录制
function onRecordClick() {
    // TODO: 实现录制功能
    console.log('Record clicked');
}

// 时间输入变化
function onTimeInputChange() {
    if (!animationComponent.value) return;
    const newTime = Math.max(0, Math.min(totalTime.value, currentTimeInput.value || 0));
    animationComponent.value.time = newTime;
    currentTimeInput.value = newTime;
}

// 动画片段变化
function onClipChange() {
    if (!animationComponent.value) return;
    const clip = animationClips.value[selectedClipIndex.value];
    if (clip) {
        animationComponent.value.animation = clip;
    }
}

// 播放速度变化
function onSpeedChange() {
    // 通过 computed setter 已经处理
}

// 更新当前时间输入
function updateCurrentTimeInput() {
    currentTimeInput.value = currentTime.value;
}

// 查找选中对象中的 Animation 组件
function findAnimationComponent() {
    const gameObjects = editorStore.selectedGameObjects;
    if (gameObjects.length === 0) {
        animationComponent.value = null;
        return;
    }

    // 查找第一个包含 Animation 组件的对象
    for (const gameObject of gameObjects) {
        const animation = gameObject.getComponent(Animation);
        if (animation) {
            animationComponent.value = animation;
            
            // 设置选中的动画片段索引
            const currentAnimation = animation.animation;
            if (currentAnimation && animation.animations) {
                const index = animation.animations.indexOf(currentAnimation);
                selectedClipIndex.value = index >= 0 ? index : -1;
            } else {
                selectedClipIndex.value = -1;
            }
            
            return;
        }
    }

    animationComponent.value = null;
    selectedClipIndex.value = -1;
}

// 监听选中对象变化
function onSelectedObjectsChanged() {
    findAnimationComponent();
}

// 监听动画时间变化
function onAnimationTimeChanged() {
    updateCurrentTimeInput();
}

// 监听动画播放状态变化
function onAnimationPlayingChanged() {
    // 可以在这里添加额外的逻辑
}

// 监听动画片段变化
function onAnimationClipChanged() {
    const currentAnimation = animationComponent.value?.animation;
    if (currentAnimation && animationClips.value) {
        const index = animationClips.value.indexOf(currentAnimation);
        selectedClipIndex.value = index >= 0 ? index : -1;
    } else {
        selectedClipIndex.value = -1;
    }
}

onMounted(() => {
    // 监听选中对象变化
    globalEmitter.on('editor.selectedObjectsChanged', onSelectedObjectsChanged);
    
    // 初始查找
    findAnimationComponent();
    
    // 监听动画组件属性变化
    if (animationComponent.value) {
        watcher.watch(animationComponent.value as any, 'time' as any, onAnimationTimeChanged);
        watcher.watch(animationComponent.value as any, 'isplaying' as any, onAnimationPlayingChanged);
        watcher.watch(animationComponent.value as any, 'animation' as any, onAnimationClipChanged);
    }
    
    // 初始化时间输入
    updateCurrentTimeInput();
});

onUnmounted(() => {
    globalEmitter.off('editor.selectedObjectsChanged', onSelectedObjectsChanged);
    
    if (animationComponent.value) {
        watcher.unwatch(animationComponent.value as any, 'time' as any, onAnimationTimeChanged);
        watcher.unwatch(animationComponent.value as any, 'isplaying' as any, onAnimationPlayingChanged);
        watcher.unwatch(animationComponent.value as any, 'animation' as any, onAnimationClipChanged);
    }
});

// 监听动画组件变化，更新监听器
watch(() => animationComponent.value, (newComponent, oldComponent) => {
    // 移除旧组件的监听
    if (oldComponent) {
        watcher.unwatch(oldComponent as any, 'time' as any, onAnimationTimeChanged);
        watcher.unwatch(oldComponent as any, 'isplaying' as any, onAnimationPlayingChanged);
        watcher.unwatch(oldComponent as any, 'animation' as any, onAnimationClipChanged);
    }
    
    // 添加新组件的监听
    if (newComponent) {
        watcher.watch(newComponent as any, 'time' as any, onAnimationTimeChanged);
        watcher.watch(newComponent as any, 'isplaying' as any, onAnimationPlayingChanged);
        watcher.watch(newComponent as any, 'animation' as any, onAnimationClipChanged);
        updateCurrentTimeInput();
    }
});

// 监听当前时间变化，更新输入框
watch(() => currentTime.value, () => {
    updateCurrentTimeInput();
});
</script>

<style scoped>
.animation-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: var(--editor-background, #1e1e1e);
    color: var(--editor-foreground, #cccccc);
}

.animation-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.empty-message {
    text-align: center;
    color: var(--descriptionForeground, #666666);
}

.animation-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
}

.animation-left-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-right: 1px solid var(--sideBar-border, #3d3d3d);
}

.animation-controls {
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 8px;
    border-bottom: 1px solid var(--sideBar-border, #3d3d3d);
}

.control-buttons {
    display: flex;
    gap: 4px;
    align-items: center;
}

.time-display {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.time-separator {
    color: var(--descriptionForeground, #666666);
}

.time-total {
    color: var(--descriptionForeground, #666666);
}

.animation-settings {
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 8px;
    border-bottom: 1px solid var(--sideBar-border, #3d3d3d);
}

.setting-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.setting-label {
    font-size: 12px;
    color: var(--descriptionForeground, #999999);
    min-width: 60px;
}

.animation-properties {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
}

.properties-header {
    padding: 8px;
    font-size: 14px;
    font-weight: 500;
    border-bottom: 1px solid var(--sideBar-border, #3d3d3d);
}

.properties-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
}

.property-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    font-size: 12px;
    border-bottom: 1px solid var(--sideBar-border, #2d2d2d);
    cursor: pointer;
}

.property-item:hover {
    background-color: var(--list-hoverBackground, #2d2d2d);
}

.property-name {
    flex: 1;
    color: var(--editor-foreground, #cccccc);
}

.property-type {
    font-size: 11px;
    color: var(--descriptionForeground, #666666);
    margin-left: 8px;
}

.property-empty {
    padding: 20px;
    text-align: center;
    color: var(--descriptionForeground, #666666);
    font-size: 12px;
}

.animation-timeline {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.timeline-header {
    padding: 8px;
    font-size: 14px;
    font-weight: 500;
    border-bottom: 1px solid var(--sideBar-border, #3d3d3d);
}

.timeline-content {
    flex: 1;
    overflow: auto;
}

.timeline-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--descriptionForeground, #666666);
}
</style>
