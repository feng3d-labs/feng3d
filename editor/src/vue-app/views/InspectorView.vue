<template>
  <div class="inspector-view">
    <!-- 头部 -->
    <div class="inspector-header">
      <el-button
        v-if="historySelectedObjects.length > 1"
        size="small"
        text
        @click="onBackButton"
        :title="t('inspector.backToPrevious')"
      >
        <Icon icon="mdi:arrow-left" :size="16" style="margin-right: 4px" />
        {{ t('inspector.back') }}
      </el-button>
      <div class="inspector-title">
        <span v-if="viewData" class="type-name">{{ typeName }}</span>
        <span v-else class="empty-label">{{ t('inspector.noObjectSelected') }}</span>
      </div>
    </div>

    <!-- 内容区域 -->
    <div ref="contentRef" class="inspector-content">
      <!-- ObjectView 将在这里动态插入 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { globalEmitter, IEvent, Feng3dObject, HideFlags, objectview, FileAsset, ReadRS, GameObject } from 'feng3d';
import { editorRS } from '../../assets/EditorRS';
import { editorAsset } from '../../ui/assets/EditorAsset';
import { AssetNode } from '../../ui/assets/AssetNode';
import { useEditorStore } from '../stores/editorStore';
import { inspectorMultiObject } from '../../ui/inspector/InspectorMultiObject';
import { ObjectViewEvent } from '../../objectview/events/ObjectViewEvent';
import { useI18n } from '../composables/useI18n';
import Icon from '../components/Icon.vue';

const editorStore = useEditorStore();
const { t } = useI18n();

// DOM 引用
const contentRef = ref<HTMLElement>();

// 视图数据
const viewData = ref<any>(null);
const view = ref<any>(null);
const dataChanged = ref(false);

// 历史选中对象列表
const historySelectedObjects = ref<Array<GameObject | AssetNode>[]>([]);
const maxHistorySelectedObject = 10;

// 类型名称
const typeName = computed(() => {
  if (!viewData.value) return '';
  return viewData.value.constructor?.name || '';
});

// 显示数据
function showData(data: any) {
  if (viewData.value === data) return;
  
  if (viewData.value) {
    saveShowData();
  }
  
  viewData.value = data;
  updateView();
}

// 更新视图
async function updateView() {
  // 清理旧视图
  if (view.value && contentRef.value) {
    // 如果视图有 destroy 方法，调用它
    if (view.value.destroy) {
      view.value.destroy();
    } else if (view.value.parent) {
      view.value.parent.removeChild(view.value);
    } else if (view.value.dom && contentRef.value.contains(view.value.dom)) {
      // 如果是 DOM 元素，直接移除
      contentRef.value.removeChild(view.value.dom);
    }
    view.value = null;
  }
  
  // 清空内容区域
  if (contentRef.value) {
    contentRef.value.innerHTML = '';
  }
  
  if (!viewData.value) {
    return;
  }
  
  // 处理 AssetNode
  let showData: any = viewData.value;
  
  if (showData instanceof AssetNode) {
    if (showData.isDirectory) return;
    
    if (showData.asset) {
      showData = showData.asset;
    } else if (!showData.isLoaded) {
      const viewDataNode = showData;
      await viewDataNode.load();
      if (viewDataNode === viewData.value) {
        showData = viewDataNode.asset;
      } else {
        return;
      }
    }
  }
  
  // 获取对象视图
  await nextTick();
  if (!contentRef.value) return;
  
  let editable = true;
  if (showData instanceof Feng3dObject) {
    editable = !(showData.hideFlags & HideFlags.NotEditable);
  }
  
  view.value = objectview.getObjectView(showData, { editable });
  
  // 将视图添加到 DOM
  if (view.value) {
    if (view.value.dom) {
      // Vue 组件返回的 DOM
      contentRef.value.appendChild(view.value.dom);
    } else if (view.value instanceof HTMLElement) {
      // 直接是 DOM 元素
      contentRef.value.appendChild(view.value);
    } else {
      // 未知类型，创建占位
      const placeholder = document.createElement('div');
      placeholder.textContent = `ObjectView (type: ${typeof view.value})`;
      placeholder.style.padding = '20px';
      placeholder.style.color = 'var(--el-text-color-secondary, #666666)';
      contentRef.value.appendChild(placeholder);
    }
    
    // 监听值变化事件
    if (view.value.addEventListener) {
      view.value.addEventListener(ObjectViewEvent.VALUE_CHANGE, onValueChanged);
    } else if (view.value.on) {
      // 使用 EventEmitter 方式
      view.value.on(ObjectViewEvent.VALUE_CHANGE, onValueChanged);
    }
  }
  
  // 滚动到顶部
  if (contentRef.value) {
    contentRef.value.scrollTop = 0;
  }
}

// 值变化处理
function onValueChanged(_e: ObjectViewEvent) {
  dataChanged.value = true;
  
  if (viewData.value instanceof FileAsset) {
    if (viewData.value.assetId) {
      const assetNode = editorAsset.getAssetByID(viewData.value.assetId);
      assetNode && assetNode.updateImage();
    }
  } else if (viewData.value instanceof AssetNode) {
    viewData.value.updateImage();
  }
}

// 保存显示数据
async function saveShowData() {
  if (!dataChanged.value || !viewData.value) return;
  
  if (viewData.value.assetId) {
    const feng3dAsset = ReadRS.rs.getAssetById(viewData.value.assetId);
    if (feng3dAsset) {
      await editorRS.writeAsset(feng3dAsset);
    }
  } else if (viewData.value instanceof AssetNode) {
    editorAsset.saveAsset(viewData.value);
  }
  
  dataChanged.value = false;
}

// 选中对象变化处理
function onSelectedObjectsChanged() {
  // 保存历史
  const currentSelected = (editorStore as any).selectedObjects;
  historySelectedObjects.value.push([...currentSelected]);
  if (historySelectedObjects.value.length > maxHistorySelectedObject) {
    historySelectedObjects.value.shift();
  }
  
  // 转换对象（处理多对象选择）
  const data = inspectorMultiObject.convertInspectorObject(currentSelected);
  showData(data);
}

// 返回上一个对象
function preSelectedObjects() {
  if (historySelectedObjects.value.length > 1) {
    historySelectedObjects.value.pop();
    const previousObjects = historySelectedObjects.value.pop();
    if (previousObjects) {
      // 使用 setSelectedObjects 方法设置选中对象
      (editorStore as any).setSelectedObjects(previousObjects);
    }
  }
}

// 返回按钮点击
function onBackButton() {
  preSelectedObjects();
}

// 监听更新事件
function onUpdateView() {
  updateView();
}

// 监听保存事件
async function onSaveShowData(event: IEvent<() => void | Promise<void>>) {
  console.log('InspectorView: 收到 saveShowData 事件', event);
  
  await saveShowData();
  console.log('InspectorView: 数据保存完成');
  
  // 保存完成后执行回调（播放功能）
  if (event.data) {
    try {
      console.log('InspectorView: 执行回调');
      const result = event.data();
      // 如果回调返回 Promise，等待它完成
      if (result instanceof Promise) {
        await result;
        console.log('InspectorView: 回调执行完成');
      }
    } catch (error) {
      console.error('执行回调失败:', error);
    }
  } else {
    console.warn('InspectorView: 事件没有回调数据');
  }
}

onMounted(() => {
  globalEmitter.on('editor.selectedObjectsChanged', onSelectedObjectsChanged);
  globalEmitter.on('inspector.update', onUpdateView);
  globalEmitter.on('inspector.saveShowData', onSaveShowData);
  
  // 初始化视图
  updateView();
});

onUnmounted(() => {
  globalEmitter.off('editor.selectedObjectsChanged', onSelectedObjectsChanged);
  globalEmitter.off('inspector.update', onUpdateView);
  globalEmitter.off('inspector.saveShowData', onSaveShowData);
  
  // 清理视图
  if (view.value) {
    // 移除事件监听
    if (view.value.removeEventListener) {
      view.value.removeEventListener(ObjectViewEvent.VALUE_CHANGE, onValueChanged);
    } else if (view.value.off) {
      view.value.off(ObjectViewEvent.VALUE_CHANGE, onValueChanged);
    }
    
    // 清理 ResizeObserver（如果有）
    if ((view.value as any)._resizeObserver) {
      (view.value as any)._resizeObserver.disconnect();
      delete (view.value as any)._resizeObserver;
    }
    
    // 从 DOM 移除（如果是 DOM 元素）
    if (view.value.dom && view.value.dom.parentElement) {
      view.value.dom.parentElement.removeChild(view.value.dom);
    } else if (view.value instanceof HTMLElement && view.value.parentElement) {
      view.value.parentElement.removeChild(view.value);
    }
    
    // 调用 destroy（如果有）
    if (view.value.destroy) {
      view.value.destroy();
    }
  }
  
  // 保存数据
  saveShowData();
});
</script>

<style scoped>
.inspector-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  /* 使用 VSCode 主题变量 */
  background-color: var(--editor-background);
  color: var(--editor-foreground);
}

.inspector-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--sideBar-border);
  /* 使用 VSCode 主题变量 */
  background-color: var(--sideBar-background);
  gap: 8px;
}

.inspector-title {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.type-name {
  /* 使用 VSCode 主题变量 */
  color: var(--editor-foreground);
}

.empty-label {
  /* 使用 VSCode 主题变量 */
  color: var(--sideBarSectionHeader-foreground);
  font-style: italic;
}

.inspector-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* 确保 ObjectView 内容正确显示 */
.inspector-content :deep(*) {
  /* 使用 VSCode 主题变量 */
  color: var(--editor-foreground);
}
</style>

