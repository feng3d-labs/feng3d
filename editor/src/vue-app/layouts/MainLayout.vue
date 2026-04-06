<template>
  <div class="main-layout">
    <!-- 顶部菜单栏和工具栏 -->
    <TopView />
    
    <!-- 主布局：水平分割（左侧：Hierarchy + Scene + Project，右侧：Inspector） -->
    <div class="main-content">
      <SplitPanel direction="horizontal" :split="0.82" :min-size="200">
      <!-- 左侧：Hierarchy + Scene + Project -->
      <template #first>
        <SplitPanel direction="vertical" :split="0.64" :min-size="200">
          <!-- 上方：Hierarchy + Scene -->
          <template #first>
            <SplitPanel direction="horizontal" :split="0.17" :min-size="150">
              <!-- 左侧：Hierarchy -->
              <template #first>
                <TabPanel
                  :tabs="hierarchyTabs"
                  :available-tab-types="allTabTypes"
                  :default-active-index="0"
                  @tab-change="onHierarchyTabChange"
                  @tab-add="onHierarchyTabAdd"
                  @tab-close="onHierarchyTabClose"
                >
                  <template #tab-hierarchy>
                    <HierarchyView />
                  </template>
                  <template #tab-scene>
                    <SceneView />
                  </template>
                  <template #tab-project>
                    <ProjectView />
                  </template>
                  <template #tab-console>
                    <ConsoleView />
                  </template>
                  <template #tab-inspector>
                    <InspectorView />
                  </template>
                </TabPanel>
              </template>
              
              <!-- 右侧：Scene -->
              <template #second>
                <TabPanel
                  :tabs="mainTabs"
                  :available-tab-types="allTabTypes"
                  :default-active-index="0"
                  @tab-change="onMainTabChange"
                  @tab-add="onMainTabAdd"
                  @tab-close="onMainTabClose"
                >
                  <template #tab-hierarchy>
                    <HierarchyView />
                  </template>
                  <template #tab-scene>
                    <SceneView />
                  </template>
                  <template #tab-project>
                    <ProjectView />
                  </template>
                  <template #tab-console>
                    <ConsoleView />
                  </template>
                  <template #tab-inspector>
                    <InspectorView />
                  </template>
                </TabPanel>
              </template>
            </SplitPanel>
          </template>
          
          <!-- 下方：Project + Console -->
          <template #second>
            <TabPanel
              :tabs="projectTabs"
              :available-tab-types="allTabTypes"
              :default-active-index="0"
              @tab-change="onProjectTabChange"
              @tab-add="onProjectTabAdd"
              @tab-close="onProjectTabClose"
            >
              <template #tab-hierarchy>
                <HierarchyView />
              </template>
              <template #tab-scene>
                <SceneView />
              </template>
              <template #tab-project>
                <ProjectView />
              </template>
              <template #tab-console>
                <ConsoleView />
              </template>
              <template #tab-inspector>
                <InspectorView />
              </template>
            </TabPanel>
          </template>
        </SplitPanel>
      </template>
      
      <!-- 右侧：Inspector -->
      <template #second>
        <TabPanel
          :tabs="bottomTabs"
          :available-tab-types="allTabTypes"
          :default-active-index="0"
          @tab-change="onBottomTabChange"
          @tab-add="onBottomTabAdd"
          @tab-close="onBottomTabClose"
        >
          <template #tab-hierarchy>
            <HierarchyView />
          </template>
          <template #tab-scene>
            <SceneView />
          </template>
          <template #tab-project>
            <ProjectView />
          </template>
          <template #tab-console>
            <ConsoleView />
          </template>
          <template #tab-inspector>
            <InspectorView />
          </template>
        </TabPanel>
      </template>
      </SplitPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SplitPanel from '../components/SplitPanel.vue';
import TabPanel from '../components/TabPanel.vue';
import type { Tab } from '../components/TabPanel.types';
import ProjectView from '../views/ProjectView.vue';
import HierarchyView from '../views/HierarchyView.vue';
import InspectorView from '../views/InspectorView.vue';
import SceneView from '../views/SceneView.vue';
import ConsoleView from '../views/ConsoleView.vue';
import TopView from '../components/TopView.vue';
import { useI18n } from '../composables/useI18n';

const { t } = useI18n();

// 所有可用的标签类型
const allTabTypes = computed<Tab[]>(() => [
  { id: 'hierarchy', label: t('panels.hierarchy') },
  { id: 'scene', label: t('panels.scene') },
  { id: 'project', label: t('panels.project') },
  { id: 'console', label: t('panels.console') },
  { id: 'inspector', label: t('panels.inspector') },
]);

// 层级标签页（使用 ref 以便动态修改）
const hierarchyTabs = ref<Tab[]>([
  { id: 'hierarchy', label: t('panels.hierarchy') },
]);

// 场景标签页（使用 ref 以便动态修改）
const mainTabs = ref<Tab[]>([
  { id: 'scene', label: t('panels.scene') },
]);

// 项目标签页（使用 ref 以便动态修改）
const projectTabs = ref<Tab[]>([
  { id: 'project', label: t('panels.project') },
  { id: 'console', label: t('panels.console') },
]);

// 底部标签页（使用 ref 以便动态修改）
const bottomTabs = ref<Tab[]>([
  { id: 'inspector', label: t('panels.inspector') },
]);

// 标签切换处理（可选，用于保存状态等）
function onHierarchyTabChange(index: number) {
  // TODO: 可以保存标签状态
}

function onMainTabChange(index: number) {
  // TODO: 可以保存标签状态
}

function onProjectTabChange(index: number) {
  // TODO: 可以保存标签状态
}

function onBottomTabChange(index: number) {
  // TODO: 可以保存标签状态
}

// 层级标签页添加处理
function onHierarchyTabAdd(tabType: Tab) {
  // 检查是否已存在
  if (hierarchyTabs.value.some(tab => tab.id === tabType.id)) {
    return;
  }
  hierarchyTabs.value.push({ ...tabType });
}

// 层级标签页关闭处理
function onHierarchyTabClose(index: number) {
  if (hierarchyTabs.value.length <= 1) return; // 至少保留一个标签
  hierarchyTabs.value.splice(index, 1);
}

// 场景标签页添加处理
function onMainTabAdd(tabType: Tab) {
  // 检查是否已存在
  if (mainTabs.value.some(tab => tab.id === tabType.id)) {
    return;
  }
  mainTabs.value.push({ ...tabType });
}

// 场景标签页关闭处理
function onMainTabClose(index: number) {
  if (mainTabs.value.length <= 1) return; // 至少保留一个标签
  mainTabs.value.splice(index, 1);
}

// 项目标签页添加处理
function onProjectTabAdd(tabType: Tab) {
  // 检查是否已存在
  if (projectTabs.value.some(tab => tab.id === tabType.id)) {
    return;
  }
  projectTabs.value.push({ ...tabType });
}

// 项目标签页关闭处理
function onProjectTabClose(index: number) {
  if (projectTabs.value.length <= 1) return; // 至少保留一个标签
  projectTabs.value.splice(index, 1);
}

// 底部标签页添加处理
function onBottomTabAdd(tabType: Tab) {
  // 检查是否已存在
  if (bottomTabs.value.some(tab => tab.id === tabType.id)) {
    return;
  }
  bottomTabs.value.push({ ...tabType });
}

// 底部标签页关闭处理
function onBottomTabClose(index: number) {
  if (bottomTabs.value.length <= 1) return; // 至少保留一个标签
  bottomTabs.value.splice(index, 1);
}
</script>

<style scoped>
.main-layout {
  width: 100%;
  height: 100%;
  position: relative;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  background-color: var(--editor-background, #1f1f1f);
  color: var(--editor-foreground, #ffffff);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

.main-content {
  flex: 1;
  min-height: 0;
  position: relative;
  padding: 0;
  background-color: var(--editor-background, #1f1f1f);
}

.panel-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--sideBarSectionHeader-foreground);
  font-size: 14px;
  text-align: center;
  background-color: var(--panel-background);
  border: 1px solid var(--sideBar-border);
  border-radius: 6px;
  margin: 4px;
}

.panel-placeholder p {
  margin: 10px 0;
}

/* 分割面板样式 */
.split-panel {
  border-radius: 6px;
  overflow: hidden;
}

/* 标签面板样式 */
.tab-panel {
  background-color: var(--panel-background);
  border: 1px solid var(--sideBar-border);
  border-radius: 6px;
  margin: 4px;
  overflow: hidden;
}

.tab-panel-header {
  background-color: var(--titleBar-activeBackground);
  border-bottom: 1px solid var(--sideBar-border);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-panel-content {
  padding: 12px;
  height: calc(100% - 40px);
  overflow: auto;
  background-color: var(--editor-background);
}

/* 标签页样式 */
.tab-item {
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.tab-item.active {
  background-color: var(--list-activeSelectionBackground);
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.tab-item:hover:not(.active) {
  background-color: var(--list-hoverBackground);
}

/* 添加按钮样式 */
.tab-add-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--sideBarSectionHeader-foreground);
  border: 1px solid transparent;
}

.tab-add-btn:hover {
  background-color: var(--list-hoverBackground);
  color: var(--editor-foreground);
  border-color: var(--sideBar-border);
}

/* 关闭按钮样式 */
.tab-close-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--descriptionForeground);
  margin-left: 4px;
}

.tab-close-btn:hover {
  background-color: var(--sideBar-background);
  color: var(--editor-foreground);
}

/* main-layout 样式统一使用 VSCode 变量，主题切换时自动更新 */
</style>

