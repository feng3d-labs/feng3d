<template>
  <div v-if="particleSystems.length > 0" class="particle-effect-controller">
    <div class="controller-row">
      <button
        class="control-button"
        @click="onPauseClick"
        :title="isParticlePlaying ? 'Pause' : 'Continue'"
      >
        <Icon :icon="isParticlePlaying ? 'mdi:pause' : 'mdi:play'" :size="18" />
      </button>
      <button
        class="control-button"
        @click="onStopClick"
        title="Stop"
      >
        <Icon icon="mdi:stop" :size="18" />
      </button>
    </div>
    
    <div class="controller-row">
      <label class="control-label">Speed:</label>
      <input
        v-model.number="playbackSpeed"
        type="number"
        step="0.1"
        min="0"
        class="control-input"
        @change="onSpeedChange"
      />
    </div>
    
    <div class="controller-row">
      <label class="control-label">Time:</label>
      <input
        :value="playbackTime.toFixed(3)"
        type="text"
        readonly
        class="control-input control-input-readonly"
      />
    </div>
    
    <div class="controller-row">
      <label class="control-label">Particles:</label>
      <input
        :value="particleCount"
        type="text"
        readonly
        class="control-input control-input-readonly"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ParticleSystem, globalEmitter } from 'feng3d';
import { EditorData } from '../../global/EditorData';
import { useEditorStore } from '../stores/editorStore';
import Icon from './Icon.vue';

const editorStore = useEditorStore();

// 粒子系统列表
const particleSystems = ref<ParticleSystem[]>([]);

// 播放状态
const isParticlePlaying = computed(() => {
  return particleSystems.value.reduce((pv, cv) => pv || cv.isPlaying, false);
});

// 播放速度
const playbackSpeed = ref(1);

// 播放时间
const playbackTime = ref(0);

// 粒子数量
const particleCount = ref(0);

// 动画帧 ID
let animationFrameId: number | null = null;

// 更新视图
function updateView() {
  if (particleSystems.value.length === 0) {
    playbackTime.value = 0;
    particleCount.value = 0;
    playbackSpeed.value = 1;
    return;
  }
  
  // 从第一个粒子系统获取播放速度（假设所有系统使用相同的速度）
  const firstSystem = particleSystems.value[0];
  if (firstSystem) {
    playbackSpeed.value = firstSystem.main.simulationSpeed || 1;
  }
}

// 更新实时数据
function updateRealTimeData() {
  if (particleSystems.value.length === 0) {
    playbackTime.value = 0;
    particleCount.value = 0;
    return;
  }
  
  // 从第一个粒子系统获取播放时间（假设所有系统同步）
  const firstSystem = particleSystems.value[0];
  if (firstSystem) {
    playbackTime.value = firstSystem.time || 0;
  }
  
  // 计算总粒子数
  particleCount.value = particleSystems.value.reduce((pv, cv) => {
    return pv + (cv.particleCount || 0);
  }, 0);
}

// 动画循环
function animate() {
  updateRealTimeData();
  animationFrameId = requestAnimationFrame(animate);
}

// 暂停/继续按钮点击
function onPauseClick() {
  if (isParticlePlaying.value) {
    particleSystems.value.forEach((v) => v.pause());
  } else {
    particleSystems.value.forEach((v) => v.continue());
  }
  updateView();
}

// 停止按钮点击
function onStopClick() {
  particleSystems.value.forEach((v) => v.stop());
  updateView();
}

// 速度改变
function onSpeedChange() {
  particleSystems.value.forEach((v) => {
    if (v.main) {
      v.main.simulationSpeed = playbackSpeed.value;
    }
  });
}

// 数据变化处理
function onDataChange() {
  // 清理旧的粒子系统监听
  particleSystems.value.forEach((v) => {
    v.pause();
    v.off('particleCompleted', updateView);
  });
  
  // 获取选中的游戏对象中的粒子系统
  const selectedGameObjects = editorStore.selectedGameObjects;
  const newParticleSystems: ParticleSystem[] = [];
  
  selectedGameObjects.forEach((gameObject) => {
    const ps = gameObject.getComponent(ParticleSystem);
    if (ps) {
      newParticleSystems.push(ps);
    }
  });
  
  particleSystems.value = newParticleSystems;
  
  // 为新粒子系统添加监听
  particleSystems.value.forEach((v) => {
    v.continue();
    v.on('particleCompleted', updateView);
  });
  
  updateView();
}

// 监听选中对象变化
watch(
  () => editorStore.selectedGameObjects,
  () => {
    onDataChange();
  },
  { deep: true }
);

onMounted(() => {
  // 初始化
  onDataChange();
  
  // 监听选中对象变化事件（作为 watch 的补充）
  globalEmitter.on('editor.selectedObjectsChanged', onDataChange);
  
  // 启动动画循环
  animate();
});

onUnmounted(() => {
  // 清理粒子系统监听
  particleSystems.value.forEach((v) => {
    v.pause();
    v.off('particleCompleted', updateView);
  });
  
  // 移除事件监听
  globalEmitter.off('editor.selectedObjectsChanged', onDataChange);
  
  // 停止动画循环
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
});
</script>

<style scoped>
.particle-effect-controller {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: var(--sideBar-background, rgba(30, 30, 30, 0.9));
  border: 1px solid var(--sideBar-border, #3d3d3d);
  border-radius: 4px;
  padding: 8px;
  min-width: 200px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.controller-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.controller-row:last-child {
  margin-bottom: 0;
}

.control-label {
  color: var(--editor-foreground, #cccccc);
  font-size: 12px;
  min-width: 60px;
  user-select: none;
}

.control-button {
  min-width: 28px;
  min-height: 28px;
  padding: 4px;
  border: 1px solid var(--sideBar-border, #3d3d3d);
  background-color: var(--editor-background, #2d2d2d);
  color: var(--editor-foreground, #cccccc);
  cursor: pointer;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
  margin-right: 4px;
}

.control-button:hover {
  background-color: var(--sideBar-background, #3d3d3d);
}

.control-button:active {
  background-color: var(--sideBar-background-dark, #4d4d4d);
}

.control-input {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  border: 1px solid var(--sideBar-border, #3d3d3d);
  background-color: var(--editor-background, #2d2d2d);
  color: var(--editor-foreground, #cccccc);
  font-size: 12px;
  border-radius: 2px;
  outline: none;
}

.control-input:focus {
  border-color: var(--button-background, #409eff);
}

.control-input-readonly {
  background-color: var(--sideBar-background-light, #1d1d1d);
  cursor: default;
  user-select: none;
}
</style>
