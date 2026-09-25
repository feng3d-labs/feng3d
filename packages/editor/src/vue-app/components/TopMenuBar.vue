<template>
  <div class="top-menu-bar">
    <!-- 左侧：项目图标和菜单 -->
    <div class="menu-bar-left">
      <!-- 项目图标 -->
      <div class="project-icon">
        <img src="/favicon.ico" alt="Feng3D Editor" width="32" height="32" />
      </div>
      
      <!-- 菜单 -->
      <el-menu
        mode="horizontal"
        :default-active="activeMenuIndex >= 0 ? String(activeMenuIndex) : ''"
        class="top-menu-bar-menu"
        :ellipsis="false"
      >
        <el-menu-item
          v-for="(item, index) in menuItems"
          :key="index"
          :index="String(index)"
          :ref="el => setMenuItemRef(el, index)"
          @click="onMenuItemClick(item, index)"
        >
          <span class="menu-item-label">{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </div>
  
    <!-- 项目名称（居中显示） -->
    <div class="project-name">
      <span>{{ projectName }}</span>
    </div>
  
    <!-- 右侧：工具按钮 -->
    <div class="menu-bar-right-tools">
      <el-button-group>
        <el-button
          size="small"
          :icon="null"
          @click="onHelpClick"
          :title="t('toolbar.help')"
          class="tool-button"
        >
          <Icon icon="mdi:help-circle" :size="16" />
        </el-button>
        <el-button
          size="small"
          :icon="null"
          @click="onQRCodeClick"
          :title="t('toolbar.qrcode')"
          class="tool-button"
        >
          <Icon icon="mdi:qrcode" :size="16" />
        </el-button>
        <el-button
          size="small"
          :icon="null"
          @click="onSettingClick"
          :title="t('toolbar.settings')"
          class="tool-button"
        >
          <Icon icon="mdi:cog" :size="16" />
        </el-button>
      </el-button-group>
    </div>
    
    <!-- 设置对话框 -->
    <SettingsDialog v-model="settingsDialogVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { globalEmitter } from 'feng3d';
import { menuConfig } from '../../configs/CommonConfig';
import { MenuAdapter } from './MenuAdapter';
import { editorcache } from '../../caches/Editorcache';
import { showQRCode } from '../../utils/QRCode';
import { useI18n } from '../composables/useI18n';
import Icon from './Icon.vue';
import SettingsDialog from './SettingsDialog.vue';

const { t } = useI18n();

// 创建 MenuAdapter 实例
const menuAdapter = new MenuAdapter();

// 菜单项类型
interface MenuItem {
  label?: string;
  priority?: number;
  type?: 'separator';
  click?: () => void;
  submenu?: MenuItem[];
  enable?: boolean;
  show?: boolean;
}

// 状态
const activeMenuIndex = ref<number>(-1);
const menuItems = ref<MenuItem[]>([]);
const projectName = ref<string>('newproject');
const menuItemRefs = ref<Map<number, any>>(new Map());

// 设置对话框显示状态
const settingsDialogVisible = ref(false);

// 获取菜单项
function getMenuItems() {
  const mainMenu = menuConfig.getMainMenu();
  // 过滤掉分隔符，只显示有 label 的菜单项
  const items = mainMenu.filter((item) => item.type !== 'separator' && item.label);

  // 处理菜单显示逻辑
  const processedItems = items.map((item) => {
    const menuItem = menuAdapter.handleShow({ submenu: [item] });
    return menuItem.submenu?.[0] || item;
  });

  return processedItems;
}

// 设置菜单项 ref
function setMenuItemRef(el: any, index: number) {
  if (el) {
    menuItemRefs.value.set(index, el);
  } else {
    menuItemRefs.value.delete(index);
  }
}

// 菜单项点击
function onMenuItemClick(item: MenuItem, index: number) {
  if (!item.submenu || item.submenu.length === 0) return;

  // 从 ref 中获取菜单项元素
  const menuItemRef = menuItemRefs.value.get(index);
  if (!menuItemRef) return;

  // Element Plus 的 menu-item 组件，需要获取其 $el 属性
  const target = menuItemRef.$el || menuItemRef;
  if (!target || !target.getBoundingClientRect) return;

  const rect = target.getBoundingClientRect();

  // 显示菜单
  globalEmitter.emit('menu.show', {
    items: item.submenu,
    x: rect.left,
    y: rect.bottom,
  } as any);

  activeMenuIndex.value = index;
}

// 监听菜单关闭事件
function onMenuHide() {
  activeMenuIndex.value = -1;
}

// 更新项目名称
function updateProjectName() {
  projectName.value = editorcache.projectname || 'newproject';
}

onMounted(() => {
  // 初始化菜单项
  menuItems.value = getMenuItems();
  
  // 更新项目名称
  updateProjectName();
  
  // 监听菜单关闭事件
  globalEmitter.on('menu.hide', onMenuHide);
  
  // 监听项目名称变化（如果有的话）
  // 这里可以根据实际需求添加监听
});

onUnmounted(() => {
  globalEmitter.off('menu.hide', onMenuHide);
});

// 帮助按钮
function onHelpClick() {
  window.open('https://feng3d.com/');
}

// 设置按钮
function onSettingClick() {
  settingsDialogVisible.value = true;
}

// 二维码按钮
function onQRCodeClick() {
  setTimeout(() => {
    const outputElement = document.getElementById('output');
    if (outputElement) {
      // 如果 output 元素为空，需要先初始化二维码
      if (!outputElement.querySelector('canvas')) {
        const url = window.location.href;
        import('../../utils/QRCode').then(({ initQRCode }) => {
          initQRCode(url);
          setTimeout(() => {
            showQRCode();
          }, 300);
        }).catch((error) => {
          console.error('初始化二维码失败:', error);
        });
      } else {
        showQRCode();
      }
    }
  }, 10);
}
</script>

<style scoped>
.top-menu-bar {
  position: relative;
  width: 100%;
  height: 32px;
  background-color: var(--titleBar-activeBackground, #181818);
  display: flex;
  align-items: center;
  z-index: 1000;
  padding: 0 8px;
  box-sizing: border-box;
}

.menu-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 4px;
}

.project-icon img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

/* Element Plus Menu 样式覆盖 */
.top-menu-bar-menu {
  background-color: transparent;
  border-bottom: none;
  height: 100%;
  flex: 1;
  overflow: visible;
}

.top-menu-bar-menu :deep(.el-menu--horizontal) {
  border-bottom: none;
}

.top-menu-bar-menu :deep(.el-menu-item) {
  height: 32px;
  line-height: 32px;
  padding: 0 12px;
  font-size: 12px;
  color: var(--editor-foreground, #cccccc);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.top-menu-bar-menu :deep(.el-menu-item:hover) {
  background-color: var(--sideBar-background, #252526);
  color: var(--editor-foreground, #cccccc);
  border-bottom-color: var(--editor-foreground, #cccccc);
}

.top-menu-bar-menu :deep(.el-menu-item.is-active) {
  color: var(--editor-foreground, #cccccc);
  border-bottom-color: var(--editor-foreground, #cccccc);
  background-color: var(--sideBar-background, #252526);
}

.menu-item-label {
  text-align: center;
  white-space: nowrap;
}

.project-name {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: var(--editor-foreground, #cccccc);
  font-size: 12px;
  pointer-events: none;
  user-select: none;
  font-weight: 500;
}

/* 右侧工具按钮 */
.menu-bar-right-tools {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.menu-bar-right-tools .tool-button {
  min-width: 28px;
  min-height: 28px;
  padding: 4px 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.menu-bar-right-tools :deep(.el-button-group) {
  display: inline-flex;
  gap: 0;
}

.menu-bar-right-tools :deep(.el-button-group .el-button) {
  border-radius: 0;
}

.menu-bar-right-tools :deep(.el-button-group .el-button:first-child) {
  border-top-left-radius: var(--el-border-radius-base);
  border-bottom-left-radius: var(--el-border-radius-base);
}

.menu-bar-right-tools :deep(.el-button-group .el-button:last-child) {
  border-top-right-radius: var(--el-border-radius-base);
  border-bottom-right-radius: var(--el-border-radius-base);
}
</style>

