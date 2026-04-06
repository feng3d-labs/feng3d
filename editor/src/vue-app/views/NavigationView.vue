<template>
    <div class="navigation-view">
        <div class="navigation-header">
            <h3 class="navigation-title">导航视图</h3>
        </div>
        <div class="navigation-content">
            <div class="navigation-controls">
                <el-button-group>
                    <el-button size="small" @click="onPan">
                        <el-icon><Rank /></el-icon>
                        平移
                    </el-button>
                    <el-button size="small" @click="onRotate">
                        <el-icon><Refresh /></el-icon>
                        旋转
                    </el-button>
                    <el-button size="small" @click="onZoom">
                        <el-icon><ZoomIn /></el-icon>
                        缩放
                    </el-button>
                </el-button-group>
            </div>
            <div class="navigation-status">
                <div class="status-item">
                    <span class="status-label">模式:</span>
                    <span class="status-value">{{ currentMode }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Rank, Refresh, ZoomIn } from '@element-plus/icons-vue';

// 当前导航模式
const currentMode = ref<'pan' | 'rotate' | 'zoom' | 'none'>('none');

// 平移模式
function onPan() {
    currentMode.value = 'pan';
    // TODO: 实现平移功能
    console.log('切换到平移模式');
}

// 旋转模式
function onRotate() {
    currentMode.value = 'rotate';
    // TODO: 实现旋转功能
    console.log('切换到旋转模式');
}

// 缩放模式
function onZoom() {
    currentMode.value = 'zoom';
    // TODO: 实现缩放功能
    console.log('切换到缩放模式');
}
</script>

<style scoped>
.navigation-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--editor-background, #1d1d1d);
    color: var(--editor-foreground, #cccccc);
}

.navigation-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--sideBar-border, #3d3d3d);
}

.navigation-title {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--editor-foreground, #cccccc);
}

.navigation-content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
}

.navigation-controls {
    margin-bottom: 16px;
}

.navigation-status {
    padding-top: 16px;
    border-top: 1px solid var(--sideBar-border, #3d3d3d);
}

.status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.status-label {
    font-size: 12px;
    color: var(--descriptionForeground, #999999);
}

.status-value {
    font-size: 12px;
    color: var(--editor-foreground, #cccccc);
}
</style>
