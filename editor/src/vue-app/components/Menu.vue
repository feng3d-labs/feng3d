<!--
  ⚠️ 自定义组件说明：
  此组件保持自定义实现，未使用 Element Plus 的 ElDropdownMenu，原因：
  1. 需要支持多级子菜单（递归嵌套）
  2. 需要动态位置计算（防止菜单溢出屏幕）
  3. 需要支持右键菜单的特殊交互（点击外部关闭、键盘导航等）
  4. 已有适配层（MenuAdapter）与旧代码桥接
  
  如果未来需要替换为 ElDropdownMenu，需要：
  - 实现多级子菜单支持
  - 实现动态位置计算
  - 移除 MenuAdapter 适配层
-->
<template>
  <Teleport to="body">
    <div
      v-if="menu.visible"
      class="menu-mask"
      @click="closeMenu"
    >
      <div
        v-for="(menuInstance, index) in menu.instances"
        :key="index"
        class="menu-container"
        :style="getMenuStyle(menuInstance)"
        @click.stop
      >
        <div
          v-for="(item, itemIndex) in menuInstance.items"
          :key="itemIndex"
          :class="['menu-item', {
            'menu-item-separator': item.type === 'separator',
            'menu-item-disabled': item.enable === false,
            'menu-item-hover': hoveredItem === item && itemIndex === hoveredIndex,
            'menu-item-has-submenu': item.submenu && item.submenu.length > 0
          }]"
          @mouseenter="onItemMouseEnter(menuInstance, item, itemIndex)"
          @mouseleave="onItemMouseLeave"
          @click="onItemClick(item)"
        >
          <span v-if="item.type !== 'separator'" class="menu-item-label">
            {{ item.label }}
          </span>
          <Icon
            v-if="item.submenu && item.submenu.length > 0"
            icon="mdi:chevron-right"
            :size="16"
            class="menu-item-arrow"
          />
          <div v-if="item.type === 'separator'" class="menu-separator"></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { globalEmitter, IEvent, windowEventProxy } from 'feng3d';
import Icon from './Icon.vue';

export interface MenuItem {
  label?: string;
  priority?: number;
  type?: 'separator';
  click?: () => void;
  submenu?: MenuItem[];
  enable?: boolean;
  show?: boolean;
}

interface MenuInstance {
  items: MenuItem[];
  x: number;
  y: number;
  parentRect?: { left: number; top: number; right: number; bottom: number };
}

interface MenuData {
  visible: boolean;
  instances: MenuInstance[];
}

const menu = ref<MenuData>({
  visible: false,
  instances: [],
});

let hoveredItem: MenuItem | null = null;
let hoveredIndex = -1;

// 计算菜单样式
function getMenuStyle(instance: MenuInstance) {
  return {
    left: `${instance.x}px`,
    top: `${instance.y}px`,
  };
}

// 处理菜单显示逻辑
function handleShow(menuItem: MenuItem): MenuItem {
  if (menuItem.submenu) {
    let submenu = menuItem.submenu.filter((v) => v.show !== false);
    
    // 移除首尾的分隔符
    for (let i = submenu.length - 1; i >= 0; i--) {
      if (submenu[i].type === 'separator') {
        if (i === 0 || i === submenu.length - 1) {
          submenu.splice(i, 1);
        } else if (submenu[i - 1].type === 'separator') {
          submenu.splice(i, 1);
        }
      }
    }
    
    menuItem.submenu = submenu;
    menuItem.submenu.forEach((v) => handleShow(v));
  }
  
  return menuItem;
}

// 计算菜单位置
function calculateMenuPosition(
  items: MenuItem[],
  parentRect?: { left: number; top: number; right: number; bottom: number }
): { x: number; y: number } {
  const menuWidth = 200; // 估算菜单宽度
  const menuHeight = items.length * 30; // 估算菜单高度（每项30px）
  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight;
  
  let x: number;
  let y: number;
  
  if (!parentRect) {
    // 主菜单：使用鼠标位置
    x = windowEventProxy.clientX;
    y = windowEventProxy.clientY;
    
    // 确保菜单不超出屏幕
    if (x + menuWidth > stageWidth - 10) {
      x = stageWidth - menuWidth - 10;
    }
  } else {
    // 子菜单：在父菜单右侧
    x = parentRect.right;
    y = parentRect.top;
    
    // 如果右侧空间不足，显示在左侧
    if (x + menuWidth > stageWidth) {
      x = parentRect.left - menuWidth;
    }
  }
  
  // 确保菜单不超出屏幕底部
  if (y + menuHeight > stageHeight) {
    y = stageHeight - menuHeight;
  }
  
  return { x, y };
}

// 显示菜单
function showMenu(event: IEvent<{ items: MenuItem[]; parentRect?: { left: number; top: number; right: number; bottom: number }; x?: number; y?: number }>) {
  const { items, parentRect, x, y } = event.data;

  const menuItem = handleShow({ submenu: items });
  if (!menuItem.submenu || menuItem.submenu.length === 0) return;

  // 如果提供了 x, y 坐标，使用它们；否则计算位置
  let position: { x: number; y: number };
  if (x !== undefined && y !== undefined) {
    position = { x, y };
  } else {
    position = calculateMenuPosition(menuItem.submenu, parentRect);
  }

  menu.value = {
    visible: true,
    instances: [{
      items: menuItem.submenu,
      x: position.x,
      y: position.y,
      parentRect,
    }],
  };
}

// 显示子菜单
function showSubMenu(parentInstance: MenuInstance, item: MenuItem, itemIndex: number) {
  if (!item.submenu || item.submenu.length === 0 || item.enable === false) return;
  
  // 计算父菜单项的位置
  const itemHeight = 30;
  const parentRect = {
    left: parentInstance.x,
    top: parentInstance.y + itemIndex * itemHeight,
    right: parentInstance.x + 200, // 估算菜单宽度
    bottom: parentInstance.y + (itemIndex + 1) * itemHeight,
  };
  
  const submenuItem = handleShow({ submenu: item.submenu });
  if (!submenuItem.submenu || submenuItem.submenu.length === 0) return;
  
  const position = calculateMenuPosition(submenuItem.submenu, parentRect);
  
  // 添加子菜单实例
  menu.value.instances.push({
    items: submenuItem.submenu,
    x: position.x,
    y: position.y,
    parentRect,
  });
}

// 隐藏子菜单
function hideSubMenus(fromIndex: number) {
  if (fromIndex >= 0) {
    menu.value.instances = menu.value.instances.slice(0, fromIndex + 1);
  }
}

// 菜单项鼠标进入
function onItemMouseEnter(instance: MenuInstance, item: MenuItem, itemIndex: number) {
  hoveredItem = item;
  hoveredIndex = itemIndex;
  
  // 隐藏当前实例之后的所有子菜单
  const instanceIndex = menu.value.instances.indexOf(instance);
  hideSubMenus(instanceIndex);
  
  // 如果有子菜单，显示它
  if (item.submenu && item.submenu.length > 0) {
    showSubMenu(instance, item, itemIndex);
  }
}

// 菜单项鼠标离开
function onItemMouseLeave() {
  // 不立即隐藏，让子菜单可以显示
}

// 菜单项点击
function onItemClick(item: MenuItem) {
  if (item.enable === false) return;
  
  if (item.click) {
    item.click();
  }
  
  closeMenu();
}

// 关闭菜单
function closeMenu() {
  menu.value = {
    visible: false,
    instances: [],
  };
  hoveredItem = null;
  hoveredIndex = -1;
}

onMounted(() => {
  globalEmitter.on('menu.show', showMenu);
  globalEmitter.on('menu.hide', closeMenu);
});

onUnmounted(() => {
  globalEmitter.off('menu.show', showMenu);
  globalEmitter.off('menu.hide', closeMenu);
});
</script>

<style scoped>
.menu-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10002;
  background-color: transparent;
}

.menu-container {
  position: fixed;
  /* 使用 Element Plus 主题变量 */
  background-color: var(--sideBar-background, #2d2d2d);
  border: 1px solid var(--sideBar-border, #3d3d3d);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  min-width: 150px;
  padding: 4px 0;
  z-index: 10003;
}

.menu-item {
  position: relative;
  padding: 6px 24px 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  /* 使用 Element Plus 主题变量 */
  color: var(--editor-foreground, #cccccc);
  font-size: 14px;
}

.menu-item:hover:not(.menu-item-separator):not(.menu-item-disabled) {
  /* 使用 Element Plus 主题变量 */
  background-color: var(--sideBar-background, #2d2d2d);
}

.menu-item-disabled {
  /* 使用 Element Plus 主题变量 */
  color: var(--activityBar-inactiveForeground, #444444);
  cursor: not-allowed;
}

.menu-item-separator {
  padding: 0;
  height: 1px;
  margin: 4px 0;
  cursor: default;
}

.menu-separator {
  height: 1px;
  /* 使用 Element Plus 主题变量 */
  background-color: var(--sideBar-border, #3d3d3d);
  margin: 0 8px;
}

.menu-item-label {
  flex: 1;
}

.menu-item-arrow {
  margin-left: 8px;
  font-size: 10px;
  /* 使用 Element Plus 主题变量 */
  color: var(--sideBarSectionHeader-foreground, #666666);
}

.menu-item-hover {
  /* 使用 Element Plus 主题变量 */
  background-color: var(--input-background, #3d3d3d);
}
</style>

