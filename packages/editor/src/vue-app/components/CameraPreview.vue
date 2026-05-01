<template>
  <div
    v-if="camera"
    ref="previewContainerRef"
    class="camera-preview"
    :style="containerStyle"
  >
    <!-- 标题栏 -->
    <div class="camera-preview-header">
      <span class="camera-preview-title">摄像机 预览</span>
    </div>
    
    <!-- 预览区域 -->
    <div ref="previewAreaRef" class="camera-preview-area">
      <!-- Canvas 将通过 ref 动态管理 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, markRaw, Ref } from 'vue';
import { View, ticker, Camera, globalEmitter, GameObject } from 'feng3d';
import { EditorData } from '../../global/EditorData';
import { useEditorStore } from '../stores/editorStore';

// Props
interface Props {
  parentContainer?: Ref<HTMLElement | undefined>;
}

const props = withDefaults(defineProps<Props>(), {
  parentContainer: undefined,
});

const editorStore = useEditorStore();

// DOM 引用
const previewContainerRef = ref<HTMLElement>();
const previewAreaRef = ref<HTMLElement>();

// 状态
const camera = ref<Camera | null>(null);
const previewView = ref<View | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const containerPosition = ref({ right: 10, bottom: 10 });

// 容器样式（定位在父容器的右下角）
const containerStyle = computed(() => {
  return {
    position: 'absolute' as const,
    right: `${containerPosition.value.right}px`,
    bottom: `${containerPosition.value.bottom}px`,
    width: '400px',
    height: '240px', // 400 * 3 / 5
    zIndex: 10,
    pointerEvents: 'auto' as const,
  };
});

// 初始化预览视图
function initPreviewView() {
  if (!previewAreaRef.value || canvas.value) return;
  
  // 创建 canvas
  const canvasElement = document.createElement('canvas');
  canvas.value = canvasElement;
  
  // 添加到预览区域
  previewAreaRef.value.appendChild(canvasElement);
  
  // 创建 View
  const view = markRaw(new View(canvasElement));
  view.mouse3DManager.mouseInput.enable = false;
  view.stop();
  previewView.value = view;
  
  // 设置 canvas 样式和尺寸
  updateCanvasStyle();
  
  // 如果已有相机，设置相机
  if (camera.value) {
    // 确保传递原始对象（不是 Vue Proxy）
    const rawCamera = (camera.value as any).__v_raw || camera.value;
    view.camera = rawCamera as Camera;
    ticker.onframe(onFrame);
  }
}

// 更新 canvas 样式和尺寸
function updateCanvasStyle() {
  if (!canvas.value || !previewAreaRef.value) return;
  
  const rect = previewAreaRef.value.getBoundingClientRect();
  
  // 如果尺寸无效，延迟重试
  if (rect.width <= 0 || rect.height <= 0) {
    nextTick(() => {
      updateCanvasStyle();
    });
    return;
  }
  
  const style = canvas.value.style;
  style.position = 'absolute';
  style.left = '0';
  style.top = '0';
  style.width = `${rect.width}px`;
  style.height = `${rect.height}px`;
  style.cursor = 'hand';
  style.zIndex = '1';
  
  // 设置 canvas 的实际尺寸（重要：View 需要正确的 canvas 尺寸）
  canvas.value.width = rect.width;
  canvas.value.height = rect.height;
  
  // 通知 View 尺寸变化（使用 setSize 方法）
  if (previewView.value && typeof (previewView.value as any).setSize === 'function') {
    (previewView.value as any).setSize(rect.width, rect.height);
  }
}

// 设置相机
function setCamera(newCamera: Camera | null) {
  // 移除旧相机的渲染
  if (camera.value && previewView.value) {
    ticker.offframe(onFrame);
  }
  
  camera.value = newCamera;
  
  // 如果还没有初始化预览视图，先初始化
  if (!previewView.value && newCamera) {
    // 等待组件渲染完成（v-if 条件满足后）
    nextTick(() => {
      if (previewAreaRef.value) {
        initPreviewView();
        // 初始化后设置相机
        if (previewView.value && newCamera) {
          previewView.value.camera = newCamera;
          // 更新 canvas 尺寸
          updateCanvasStyle();
          ticker.onframe(onFrame);
        }
      } else {
        // 如果 previewAreaRef 还没有准备好，再等一帧
        setTimeout(() => {
          if (previewAreaRef.value && !previewView.value) {
            initPreviewView();
            if (previewView.value && newCamera) {
              previewView.value.camera = newCamera;
              updateCanvasStyle();
              ticker.onframe(onFrame);
            }
          }
        }, 100);
      }
    });
    return;
  }
  
  if (previewView.value) {
    // 确保传递原始对象（不是 Vue Proxy）
    const rawCamera = newCamera ? ((newCamera as any).__v_raw || newCamera) : null;
    previewView.value.camera = rawCamera;
    
    if (newCamera) {
      // 显示预览
      if (previewContainerRef.value) {
        previewContainerRef.value.style.display = 'block';
      }
      if (canvas.value) {
        canvas.value.style.display = 'block';
      }
      // 更新 canvas 尺寸
      nextTick(() => {
        updateCanvasStyle();
      });
      ticker.onframe(onFrame);
      // 更新位置
      nextTick(() => {
        updateContainerPosition();
      });
    } else {
      // 隐藏预览
      if (previewContainerRef.value) {
        previewContainerRef.value.style.display = 'none';
      }
      if (canvas.value) {
        canvas.value.style.display = 'none';
      }
    }
  }
}

// 渲染帧
function onFrame() {
  if (!previewView.value || !camera.value) return;
  
  // 确保场景正确
  if (previewView.value.scene !== EditorData.editorData.gameScene) {
    previewView.value.scene = EditorData.editorData.gameScene;
  }
  
  previewView.value.render();
}

// 选中对象变化处理
function onSelectedObjectsChanged() {
  const selectedGameObjects = (editorStore as any).selectedGameObjects || [];
  
  if (selectedGameObjects.length > 0) {
    // 查找包含 Camera 组件的对象
    for (let i = 0; i < selectedGameObjects.length; i++) {
      const gameObject = selectedGameObjects[i];
      if (gameObject instanceof GameObject) {
        const cameraComponent = gameObject.getComponent(Camera);
        if (cameraComponent) {
          // 使用 markRaw 防止 Vue 响应式包装
          setCamera(markRaw(cameraComponent));
          return;
        }
      }
    }
  }
  
  // 没有找到相机，隐藏预览
  setCamera(null);
}

// 更新容器位置（相对于父容器）
function updateContainerPosition() {
  if (!props.parentContainer?.value) return;
  
  // 预览窗口始终定位在父容器的右下角
  // 使用固定的 right 和 bottom 值，CSS 会自动处理定位
  containerPosition.value = { right: 10, bottom: 10 };
}

// 监听窗口大小变化，更新 canvas 尺寸和容器位置
let resizeObserver: ResizeObserver | null = null;
let parentResizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  await nextTick();
  
  // 监听选中对象变化
  globalEmitter.on('editor.selectedObjectsChanged', onSelectedObjectsChanged);
  
  // 初始检查（可能会触发相机设置，从而显示组件）
  onSelectedObjectsChanged();
  
  // 如果组件已显示（有相机），初始化预览视图
  if (camera.value && previewAreaRef.value) {
    initPreviewView();
  }
  
  // 监听预览区域大小变化
  watch(() => previewAreaRef.value, (newVal) => {
    if (newVal && !resizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateCanvasStyle();
      });
      resizeObserver.observe(newVal);
    }
  }, { immediate: true });
  
  // 监听父容器大小变化，更新预览窗口位置
  watch(() => props.parentContainer?.value, (newVal) => {
    if (newVal && !parentResizeObserver) {
      parentResizeObserver = new ResizeObserver(() => {
        updateContainerPosition();
      });
      parentResizeObserver.observe(newVal);
      // 初始更新位置
      updateContainerPosition();
    }
  }, { immediate: true });
});

onUnmounted(() => {
  // 移除事件监听
  globalEmitter.off('editor.selectedObjectsChanged', onSelectedObjectsChanged);
  
  // 停止渲染
  if (camera.value) {
    ticker.offframe(onFrame);
  }
  
  // 清理 ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  
  if (parentResizeObserver) {
    parentResizeObserver.disconnect();
    parentResizeObserver = null;
  }
  
  // 清理 canvas
  if (canvas.value && canvas.value.parentElement) {
    canvas.value.parentElement.removeChild(canvas.value);
  }
  canvas.value = null;
  previewView.value = null;
});
</script>

<style scoped>
.camera-preview {
  display: flex;
  flex-direction: column;
  /* 使用 Element Plus 主题变量 */
  background-color: var(--sideBar-background, #2d2d2d);
  border: 1px solid var(--sideBar-border, #3d3d3d);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  /* 确保预览窗口显示在场景上方 */
  z-index: 10;
}

/* 标题栏 - 参考 exml 中的标题栏样式 */
.camera-preview-header {
  width: 100%;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 使用 Element Plus 主题变量 */
  background-color: rgba(45, 45, 45, 0.5); /* fillAlpha="0.5" */
  border-bottom: 1px solid var(--sideBar-border, #3d3d3d);
}

.camera-preview-title {
  font-size: 12px;
  color: #ffffff;
  text-align: center;
  width: 100%;
}

/* 预览区域 - 参考 exml 中的预览区域样式 */
.camera-preview-area {
  flex: 1;
  position: relative;
  /* 使用 Element Plus 主题变量 */
  background-color: #272727;
  border: 3px solid #444444; /* strokeColor="0x444444" strokeWeight="3" */
  overflow: hidden;
}

/* Canvas 样式 */
.camera-preview-area canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>

