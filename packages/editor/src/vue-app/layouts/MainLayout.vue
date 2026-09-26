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
                />
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
                />
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
            />
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
        />
      </template>
      </SplitPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, markRaw, onBeforeUnmount } from 'vue';
import type { Component, Ref } from 'vue';
import SplitPanel from '../components/SplitPanel.vue';
import TabPanel from '../components/TabPanel.vue';
import type { Tab } from '../components/TabPanel.types';
import TopView from '../components/TopView.vue';
import { useI18n } from '../composables/useI18n';
import { usePluginVersion } from '../composables/usePluginVersion';
import { getPanelContributions, getPanelContributionsAt, onPluginStateChanged, toViewComponent } from '../../plugins';
import type { PanelContribution, PanelPlacement } from '../../plugins';

const { t } = useI18n();

/**
 * 面板 id → 异步组件包装。
 *
 * **必须缓存**：每次 `defineAsyncComponent` 都产生一个新的组件对象，而 Vue 靠"组件对象
 * 是不是同一个"决定复用还是重新挂载。不缓存的话，插件状态一变（哪怕变的是与面板无关的
 * 插件）整块界面都会被卸载重建——实测把场景视图反复销毁重建，触发引擎侧的响应式风暴
 * （`RangeError: Maximum call stack size exceeded` + `reading 'elements'`）。
 * 这个坑只有真去连续开关插件才会暴露：单次开关看起来是好的。
 */
const tabComponents = new Map<string, Component>();

/**
 * 把一个面板贡献点变成标签页。
 *
 * 视图在这里才 `defineAsyncComponent` + `markRaw`：
 * - `markRaw` 必须加——标签页数组是 `ref`（深层响应式），不加会把组件定义变成响应式代理，
 *   Vue 会报警告且渲染路径变慢；
 * - 清单里存的是 loader（纯数据），"怎么渲染"是核心的事，不该让清单操心。
 *
 * @param panel 面板贡献点
 * @returns 标签页描述
 */
function toTab(panel: PanelContribution): Tab {
  let component = tabComponents.get(panel.id);
  if (!component) {
    component = markRaw(defineAsyncComponent(toViewComponent(panel.view)));
    tabComponents.set(panel.id, component);
  }

  return {
    id: panel.id,
    label: t(panel.labelKey),
    icon: panel.icon,
    component,
  };
}

/**
 * 取某个落位的默认标签页。
 *
 * 默认布局由插件的 `placement` 决定，这里不再写死——加一个面板不用改本文件。
 *
 * @param placement 落位
 * @returns 该落位的默认标签页
 */
function defaultTabs(placement: PanelPlacement): Tab[] {
  return getPanelContributionsAt(placement).map(toTab);
}

// 所有可用的标签类型（TabPanel 的 + 菜单列出全部面板，可加到任意落位）
const pluginVersion = usePluginVersion();
const allTabTypes = computed<Tab[]>(() => {
  // 显式建立依赖：插件开关一变，可选面板集合就要跟着变（见 usePluginVersion 的说明）
  void pluginVersion.value;
  return getPanelContributions().map(toTab);
});

// 各落位的标签页（使用 ref 以便动态增删）
const hierarchyTabs = ref<Tab[]>(defaultTabs('hierarchy'));
const mainTabs = ref<Tab[]>(defaultTabs('main'));
const projectTabs = ref<Tab[]>(defaultTabs('project'));
const bottomTabs = ref<Tab[]>(defaultTabs('bottom'));

/**
 * 两组标签页的面板集合是否相同。
 *
 * @param current 当前集合
 * @param next 新算出来的集合
 * @returns 面板 id 列表是否逐个相同
 */
function sameTabIds(current: Tab[], next: Tab[]): boolean {
  return current.length === next.length && current.every((tab, index) => tab.id === next[index].id);
}

/**
 * 按当前启用的插件重建四个落位的标签页。
 *
 * 关闭一个插件后，它贡献的面板必须**立刻**从界面上消失（issue #169 的验收点），
 * 而不是留到下次刷新。重建会丢掉用户手动调整过的标签布局（效果等同于刷新页面）——
 * 比起停在一个引用了已消失面板的布局上，这个取舍更容易猜。
 *
 * 集合没变的落位**不替换数组**：替换会白白触发一次全量 patch（配合上面缓存的组件对象
 * 虽然不会重新挂载，但没有任何理由去动它）。
 */
function rebuildTabs() {
  const placements: readonly [Ref<Tab[]>, PanelPlacement][] = [
    [hierarchyTabs, 'hierarchy'],
    [mainTabs, 'main'],
    [projectTabs, 'project'],
    [bottomTabs, 'bottom'],
  ];

  for (const [target, placement] of placements) {
    const next = defaultTabs(placement);
    if (!sameTabIds(target.value, next)) target.value = next;
  }
}

// 订阅放在 setup 里（而不是模块顶层）：对齐 R2，import 本组件不该执行任何代码
const unobservePlugins = onPluginStateChanged(rebuildTabs);
onBeforeUnmount(unobservePlugins);

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

