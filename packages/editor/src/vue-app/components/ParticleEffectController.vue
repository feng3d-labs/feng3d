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
import { ParticleSystem, globalEmitter, logic } from 'feng3d';
import type { Object3D } from 'feng3d';
import { EditorData } from '../../global/EditorData';
import { AssetNode } from '../../ui/assets/AssetNode';
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

/**
 * 旧粒子系统的实例事件能力（仅在兼容实现上存在）。
 *
 * `particleCompleted` 是旧版 `ParticleSystem`（继承 `EventDispatcher`）抛出的事件。
 * 主仓已整体废除**组件 / 对象实例事件**（`Entity` / `Container` 改用响应式 effect 驱动，
 * 见 packages/editor/docs/API_MIGRATION.md §3.4），当前 `ParticleSystem` 上已没有 `on` / `off`。
 * 因此这里做**能力探测**：仅当运行时的粒子系统仍提供事件订阅时才注册回调
 * （老的兼容实现保持原有行为），不再假设事件必然存在。
 *
 * TODO(P1 API 迁移)：粒子系统的播放状态目前只能在 rAF 循环里轮询
 * （见 `updateRealTimeData()`）。待 logic 侧暴露可响应式的播放状态（如 `isPlaying`）后，
 * 改用 `effect()` 在状态跃迁时刷新视图，并删除本能力探测。
 */
interface ParticleSystemEventTarget
{
    on(type: string, callback: () => void): void;
    off(type: string, callback: () => void): void;
}

/**
 * 探测参数用 `object` 而非 `ParticleSystem`：`ref<ParticleSystem[]>` 取出的元素是 Vue 解包后的
 * 结构类型（`UnwrapRefSimple` 会丢掉 class 私有成员），与 class 类型互不可赋值；本探测只读
 * 可选的 `on` / `off`，不需要 class 的完整形态。
 *
 * @param system 粒子系统实例
 * @param callback `particleCompleted` 回调
 */
function onParticleCompleted(system: object, callback: () => void): void
{
    const emitter = system as Partial<ParticleSystemEventTarget>;
    if (typeof emitter.on === 'function') {
        emitter.on('particleCompleted', callback);
    }
}

/**
 * 若粒子系统仍支持实例事件，则退订 `particleCompleted`（否则静默跳过）。
 *
 * @param system 粒子系统实例
 * @param callback `particleCompleted` 回调
 */
function offParticleCompleted(system: object, callback: () => void): void
{
    const emitter = system as Partial<ParticleSystemEventTarget>;
    if (typeof emitter.off === 'function') {
        emitter.off('particleCompleted', callback);
    }
}

// 数据变化处理
function onDataChange() {
  // 清理旧的粒子系统监听
  particleSystems.value.forEach((v) => {
    v.pause();
    offParticleCompleted(v, updateView);
  });
  
  // 获取选中的游戏对象中的粒子系统
  const selectedObject3Ds = editorStore.selectedObjects;
  const newParticleSystems: ParticleSystem[] = [];

  selectedObject3Ds.forEach((item) => {
    // `Object3D` 是纯数据接口，运行时没有构造器（`instanceof Object3D` 会抛 TypeError）。
    // 改为反向判别：编辑器资源节点 `AssetNode` 是 class，`instanceof` 合法——
    // 与 shortcut/Editorshortcut.ts 的做法一致。
    if (item instanceof AssetNode) return;

    // 旧的 `item.getComponent(ParticleSystem)` 已废除：`getComponent` 是宿主 logic 的方法，
    // 且组件类型只能以 `__type__` 字符串参与运行时判别（`ParticleSystem` 此处仅作类型参数）。
    const ps = logic(item as Object3D).getComponent<ParticleSystem>('ParticleSystem');
    if (ps) {
      newParticleSystems.push(ps);
    }
  });
  
  particleSystems.value = newParticleSystems;
  
  // 为新粒子系统添加监听
  particleSystems.value.forEach((v) => {
    v.continue();
    onParticleCompleted(v, updateView);
  });
  
  updateView();
}

// 监听选中对象变化
watch(
  () => editorStore.selectedObjects,
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
    offParticleCompleted(v, updateView);
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
