<!--
  TabPanel 组件
  使用 Element Plus 的 Tabs 组件，采用卡片风格
  支持图标、关闭和拖拽排序功能
-->
<template>
  <div class="tab-panel">
    <el-tabs
      v-model="activeName"
      type="card"
      :editable="availableTabTypes && availableTabTypes.length > 0"
      :closable="tabs.length > 1"
      class="tab-panel-tabs"
      @tab-click="handleTabClick"
      @tab-remove="handleTabRemove"
      @tab-add="handleTabAdd"
    >
      <template #add-icon>
        <el-dropdown
          v-if="availableTabTypes && availableTabTypes.length > 0"
          trigger="click"
          placement="bottom-end"
          @command="handleAddTab"
          @click.stop
        >
          <el-icon class="el-tabs__new-tab" @click.stop>
            <Plus />
          </el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="tabType in availableTabTypes"
                :key="tabType.id"
                :command="tabType"
                :disabled="isTabTypeExists(tabType.id)"
              >
                <Icon
                  v-if="getTabIcon(tabType)"
                  :icon="getTabIcon(tabType)"
                  :size="14"
                  style="margin-right: 6px; vertical-align: middle;"
                />
                {{ tabType.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
      <el-tab-pane
        v-for="(tab, index) in tabs"
        :key="tab.id"
        :name="tab.id"
        :closable="tabs.length > 1"
        :class="{
          'tab-pane-dragging': draggedIndex === index,
          'tab-pane-drag-over': dragOverIndex === index && draggedIndex !== index,
        }"
      >
        <template #label>
          <span
            class="tab-label"
            :draggable="true"
            @dragstart="handleDragStart(index, $event)"
            @dragover="handleDragOver(index, $event)"
            @dragleave="handleDragLeave(index)"
            @drop="handleDrop(index, $event)"
            @dragend="handleDragEnd"
            @click.stop="handleLabelClick(index)"
          >
            <Icon
              v-if="getTabIcon(tab)"
              :icon="getTabIcon(tab)"
              :size="14"
              class="tab-label-icon"
            />
            <span class="tab-label-text">{{ tab.label }}</span>
          </span>
        </template>
        <slot :name="`tab-${tab.id}`"></slot>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import type { Tab } from './TabPanel.types';
import Icon from './Icon.vue';

/**
 * 根据标签信息获取合适的图标
 * 如果标签有 icon 属性，直接使用；否则根据 id 或 label 推断
 */
function getTabIcon(tab: Tab): string | undefined {
  // 如果标签有 icon 属性，直接使用
  if (tab.icon) {
    return tab.icon;
  }
  
  // 根据 id 推断图标
  const iconMap: Record<string, string> = {
    hierarchy: 'mdi:file-tree',
    scene: 'mdi:cube-outline',
    project: 'mdi:folder',
    console: 'mdi:console',
    inspector: 'mdi:code-tags',
    tab1: 'mdi:file-document',
    tab2: 'mdi:file-document-outline',
    tab3: 'mdi:file-document-edit',
    tab4: 'mdi:file-document-multiple',
  };
  
  if (iconMap[tab.id]) {
    return iconMap[tab.id];
  }
  
  // 根据 label 推断图标
  const labelLower = tab.label.toLowerCase();
  if (labelLower.includes('层级') || labelLower.includes('hierarchy')) {
    return 'mdi:file-tree';
  }
  if (labelLower.includes('场景') || labelLower.includes('scene')) {
    return 'mdi:cube-outline';
  }
  if (labelLower.includes('项目') || labelLower.includes('project')) {
    return 'mdi:folder';
  }
  if (labelLower.includes('控制台') || labelLower.includes('console')) {
    return 'mdi:console';
  }
  if (labelLower.includes('检查器') || labelLower.includes('inspector')) {
    return 'mdi:code-tags';
  }
  
  // 默认图标
  return 'mdi:file-document-outline';
}

interface Props {
  tabs: Tab[];
  defaultActiveIndex?: number;
  /** 可添加的标签类型列表，用于+按钮显示 */
  availableTabTypes?: Tab[];
}

const props = withDefaults(defineProps<Props>(), {
  defaultActiveIndex: 0,
});

const emit = defineEmits<{
  'tab-change': [index: number];
  'tab-close': [index: number];
  'tab-reorder': [fromIndex: number, toIndex: number];
  'tab-add': [tabType: Tab];
}>();

// 使用 tab.id 作为 activeName，而不是索引
const activeName = ref<string>(
  props.tabs.length > 0 && props.defaultActiveIndex >= 0 && props.defaultActiveIndex < props.tabs.length
    ? props.tabs[props.defaultActiveIndex].id
    : props.tabs.length > 0
      ? props.tabs[0].id
      : ''
);

// 拖拽相关状态
const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);
const isDragging = ref(false);

// 监听 props 变化，更新 activeName
watch(() => props.defaultActiveIndex, (newIndex) => {
  if (newIndex !== undefined && newIndex >= 0 && newIndex < props.tabs.length) {
    activeName.value = props.tabs[newIndex].id;
  }
});

// 监听 tabs 变化，确保 activeName 有效
watch(() => props.tabs, (newTabs) => {
  if (newTabs.length > 0) {
    const currentTab = newTabs.find(tab => tab.id === activeName.value);
    if (!currentTab) {
      // 如果当前活动的标签不存在了，切换到第一个
      activeName.value = newTabs[0].id;
    }
  }
}, { deep: true });

// 标签点击处理
function handleTabClick(tab: any) {
  if (isDragging.value) {
    return;
  }
  const index = props.tabs.findIndex(t => t.id === tab.paneName);
  if (index >= 0) {
    emit('tab-change', index);
  }
}

// 标签点击处理（点击标签文本时）
function handleLabelClick(index: number) {
  if (isDragging.value) {
    return;
  }
  if (index >= 0 && index < props.tabs.length) {
    activeName.value = props.tabs[index].id;
    emit('tab-change', index);
  }
}

// 关闭标签
function handleTabRemove(tabName: string) {
  const index = props.tabs.findIndex(t => t.id === tabName);
  if (index < 0 || props.tabs.length <= 1) return; // 至少保留一个标签
  
  // 在发出事件之前确定要切换到的标签（因为父组件删除后数组会立即更新）
  let newActiveName: string | null = null;
  if (tabName === activeName.value) {
    if (index === props.tabs.length - 1) {
      // 关闭的是最后一个，切换到前一个
      if (index > 0 && props.tabs[index - 1]) {
        newActiveName = props.tabs[index - 1].id;
      }
    } else {
      // 切换到下一个
      if (props.tabs[index + 1]) {
        newActiveName = props.tabs[index + 1].id;
      } else if (index > 0 && props.tabs[index - 1]) {
        // 如果没有下一个，切换到前一个
        newActiveName = props.tabs[index - 1].id;
      }
    }
  }
  
  emit('tab-close', index);
  
  // 更新活动标签（如果有新的活动标签）
  if (newActiveName) {
    activeName.value = newActiveName;
  }
}

// 设置活动标签（供外部调用）
function setActiveTab(index: number) {
  if (index >= 0 && index < props.tabs.length) {
    activeName.value = props.tabs[index].id;
    emit('tab-change', index);
  }
}

// 关闭标签（供外部调用）
function closeTab(index: number) {
  if (index < 0 || props.tabs.length <= 1) return;
  handleTabRemove(props.tabs[index].id);
}

// 检查标签类型是否已存在
function isTabTypeExists(tabTypeId: string): boolean {
  return props.tabs.some(tab => tab.id === tabTypeId);
}

// 处理添加标签（Element Plus 原生 tab-add 事件）
// 当使用自定义 add-icon 时，这个事件仍然会被触发
// 我们需要阻止默认行为，只显示下拉菜单
function handleTabAdd() {
  // 阻止默认添加行为，因为我们使用自定义下拉菜单
  // 如果只有一个可用类型，直接添加
  if (props.availableTabTypes && props.availableTabTypes.length === 1) {
    const tabType = props.availableTabTypes[0];
    if (!isTabTypeExists(tabType.id)) {
      emit('tab-add', tabType);
    }
  }
  // 如果有多个类型，下拉菜单会处理，这里不做任何操作
}

// 处理从下拉菜单添加标签
function handleAddTab(tabType: Tab) {
  // 如果该类型的标签已存在，不添加
  if (isTabTypeExists(tabType.id)) {
    return;
  }
  emit('tab-add', tabType);
}

// 拖拽开始
function handleDragStart(index: number, event: DragEvent) {
  isDragging.value = true;
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    // 设置拖拽时的视觉效果
    if (event.dataTransfer.setDragImage) {
      const dragImage = document.createElement('div');
      dragImage.style.opacity = '0.5';
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  }
}

// 拖拽悬停
function handleDragOver(index: number, event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    dragOverIndex.value = index;
  }
}

// 拖拽离开
function handleDragLeave(index: number) {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null;
  }
}

// 拖拽放下
function handleDrop(index: number, event: DragEvent) {
  event.preventDefault();
  if (draggedIndex.value === null || draggedIndex.value === index) {
    return;
  }
  
  const fromIndex = draggedIndex.value;
  const toIndex = index;
  
  // 发出重新排序事件，让父组件处理实际的数组重排
  emit('tab-reorder', fromIndex, toIndex);
  
  // 更新活动标签（如果拖拽的是当前活动标签）
  const currentActiveIndex = props.tabs.findIndex(t => t.id === activeName.value);
  if (currentActiveIndex === fromIndex) {
    // 如果拖拽的是当前活动标签，更新到新位置
    const newTabs = [...props.tabs];
    const [movedTab] = newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, movedTab);
    activeName.value = movedTab.id;
  } else if (fromIndex < currentActiveIndex && toIndex >= currentActiveIndex) {
    // 从前面拖到后面，活动索引减1
    if (currentActiveIndex > 0) {
      activeName.value = props.tabs[currentActiveIndex - 1].id;
    }
  } else if (fromIndex > currentActiveIndex && toIndex <= currentActiveIndex) {
    // 从后面拖到前面，活动索引加1
    if (currentActiveIndex < props.tabs.length - 1) {
      activeName.value = props.tabs[currentActiveIndex + 1].id;
    }
  }
  
  // 重置拖拽状态
  draggedIndex.value = null;
  dragOverIndex.value = null;
}

// 拖拽结束
function handleDragEnd() {
  // 延迟重置，避免触发点击事件
  setTimeout(() => {
    isDragging.value = false;
  }, 0);
  draggedIndex.value = null;
  dragOverIndex.value = null;
}

// 暴露方法供父组件调用
defineExpose({
  setActiveTab,
  closeTab,
  activeIndex: computed(() => {
    const index = props.tabs.findIndex(t => t.id === activeName.value);
    return index >= 0 ? index : 0;
  }),
});
</script>

<style scoped>
.tab-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: var(--sideBar-background, #3a3a3a);
  border: none;
  border-radius: 0;
  overflow: hidden;
}

.tab-panel-tabs {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
}

/* Element Plus Tabs 标签头样式 */
.tab-panel-tabs :deep(.el-tabs__header) {
  margin: 0 !important;
  flex-shrink: 0;
  background-color: var(--titleBar-activeBackground);
  border-bottom: 1px solid var(--sideBar-border);
  padding: 0 8px;
  border-radius: 0 !important;
}

.tab-panel-tabs :deep(.el-tabs__nav-wrap) {
  border: none;
}

.tab-panel-tabs :deep(.el-tabs__nav-scroll) {
  padding: 4px 0;
}

.tab-panel-tabs :deep(.el-tabs__nav) {
  border: none;
  margin: 0;
}

.tab-panel-tabs :deep(.el-tabs__item) {
  color: var(--sideBarSectionHeader-foreground);
  border: 1px solid transparent;
  border-radius: 4px 4px 0 0;
  padding: 8px 16px;
  margin: 0 2px;
  height: 36px;
  line-height: 22px;
  background-color: transparent;
  transition: all 0.2s ease;
  cursor: grab;
  user-select: none;
}

.tab-panel-tabs :deep(.el-tabs__item):hover {
  color: var(--editor-foreground);
  background-color: var(--list-hoverBackground);
}

.tab-panel-tabs :deep(.el-tabs__item.is-active) {
  color: var(--button-background);
  background-color: var(--editor-background);
  border-color: var(--sideBar-border);
  border-bottom-color: transparent;
  font-weight: 500;
}

.tab-panel-tabs :deep(.el-tabs__item.is-active):not(.is-closable) {
  border-bottom-color: var(--editor-background);
}

.tab-panel-tabs :deep(.el-tabs__item):active {
  cursor: grabbing;
}

/* 添加按钮样式 */
.tab-panel-tabs :deep(.el-tabs__new-tab) {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: var(--descriptionForeground);
  border: none !important;
  margin-left: 4px;
  outline: none !important;
}

.tab-panel-tabs :deep(.el-tabs__new-tab:hover) {
  background-color: var(--list-hoverBackground) !important;
  color: var(--editor-foreground) !important;
}

/* 关闭按钮样式 */
.tab-panel-tabs :deep(.el-icon.is-close) {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  margin-left: 4px;
  color: var(--descriptionForeground);
  transition: all 0.2s ease;
}

.tab-panel-tabs :deep(.el-icon.is-close):hover {
  background-color: var(--sideBar-background);
  color: var(--editor-foreground);
}

/* Element Plus Tabs 内容区域样式 */
.tab-panel-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
  background-color: var(--editor-background);
  border-radius: 0 !important;
}

.tab-panel-tabs :deep(.el-tab-pane) {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 4px;
  border-radius: 0 !important;
}

/* 标签样式 */
.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  width: 100%;
  height: 100%;
  align-items: center;
}

.tab-label-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  pointer-events: none;
  font-size: 14px;
}

.tab-label-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  pointer-events: none;
  font-size: 13px;
}

/* 拖拽状态样式 */
.tab-pane-dragging :deep(.el-tabs__item) {
  opacity: 0.5;
  cursor: grabbing;
}

.tab-pane-drag-over :deep(.el-tabs__item) {
  transform: translateX(4px);
}

/* 下拉菜单样式 */
.tab-panel-tabs :deep(.el-dropdown) {
  vertical-align: top;
}

.tab-panel-tabs :deep(.el-dropdown-menu) {
  background-color: var(--sideBar-background);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  box-shadow: var(--shadow-lg);
  padding: 4px 0;
}

.tab-panel-tabs :deep(.el-dropdown-menu__item) {
  color: var(--el-text-color-primary);
  padding: 8px 16px;
  transition: all 0.2s ease;
}

.tab-panel-tabs :deep(.el-dropdown-menu__item):hover {
  background-color: var(--el-fill-color);
}

.tab-panel-tabs :deep(.el-dropdown-menu__item.is-disabled) {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
  background-color: transparent;
}
</style>

