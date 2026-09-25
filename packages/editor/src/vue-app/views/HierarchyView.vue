<template>
  <div 
    class="hierarchy-view"
    @click="onTreeClick"
    @contextmenu="onTreeRightClick"
    @keydown="onKeyDown"
    tabindex="0"
  >
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      :default-expand-all="false"
      :default-expanded-keys="expandedKeys"
      node-key="id"
      :highlight-current="true"
      :draggable="true"
      :allow-drop="allowDrop"
      :allow-drag="allowDrag"
      @node-click="onNodeClick"
      @node-contextmenu="onNodeRightClick"
      @node-dblclick="onNodeDoubleClick"
      @contextmenu="onTreeRightClick"
      @node-drag-start="onNodeDragStart"
      @node-drag-over="onNodeDragOver"
      @node-drag-leave="onNodeDragLeave"
      @node-drop="onNodeDrop"
    >
      <template #default="{ node, data }">
        <div class="tree-node">
          <Icon
            :icon="getNodeIcon(data)"
            :size="16"
            style="margin-right: 4px"
          />
          <span>{{ data.label }}</span>
        </div>
      </template>
    </el-tree>
    <Teleport to="body">
      <div
        v-if="dropdownVisible && contextMenuItems.length > 0"
        class="context-menu-wrapper"
        :style="{
          position: 'fixed',
          left: contextMenuPosition.x + 'px',
          top: contextMenuPosition.y + 'px',
          zIndex: 2000
        }"
        @click.stop
      >
        <div class="context-menu">
          <div
            v-for="(item, index) in contextMenuItems"
            :key="index"
            :class="['context-menu-item', {
              'context-menu-item-disabled': item.disabled,
              'context-menu-item-divided': item.divided,
              'context-menu-item-has-submenu': item.hasSubmenu
            }]"
            @mouseenter="item.hasSubmenu && onItemMouseEnter(item, index)"
            @mouseleave="item.hasSubmenu && onItemMouseLeave(item, index)"
            @click="!item.disabled && !item.hasSubmenu && onMenuCommand(item.command)"
          >
            <span class="context-menu-item-label">{{ item.label }}</span>
            <Icon
              v-if="item.hasSubmenu"
              icon="mdi:chevron-right"
              :size="16"
              class="context-menu-item-arrow"
            />
          </div>
        </div>
        <!-- 子菜单 -->
        <div
          v-if="submenuVisible && currentSubmenu && currentSubmenu.length > 0"
          class="context-menu submenu"
          :style="{
            position: 'fixed',
            left: submenuPosition.x + 'px',
            top: submenuPosition.y + 'px',
            zIndex: 2001
          }"
          @click.stop
          @mouseenter="onSubmenuMouseEnter"
          @mouseleave="onSubmenuMouseLeave"
        >
          <div
            v-for="(item, index) in currentSubmenu"
            :key="index"
            :class="['context-menu-item', {
              'context-menu-item-disabled': item.disabled,
              'context-menu-item-divided': item.divided
            }]"
            @click="!item.disabled && onMenuCommand(item.command)"
          >
            {{ item.label }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, Teleport, toRaw } from 'vue';
import { globalEmitter, logic as getLogic, reactive, watcher, shortcut, serialization, windowEventProxy } from 'feng3d';
import type { Object3D } from 'feng3d';
import { hierarchy } from '../../feng3d/hierarchy/Hierarchy';
import { HierarchyNode } from '../../feng3d/hierarchy/HierarchyNode';
import { useEditorStore } from '../stores/editorStore';
import { menuConfig } from '../../configs/CommonConfig';
import type { MenuItem } from '../components/MenuAdapter';
import { useI18n } from '../composables/useI18n';
import Icon from '../components/Icon.vue';
import { DragData } from '../../ui/drag/Drag';

const editorStore = useEditorStore();
const { t } = useI18n();

/**
 * Object3D 稳定标识表。
 *
 * 主仓 `Object3D` 已无 `uuid` 字段（旧 `Feng3dObject.uuid` 随基类删除），而 el-tree 的
 * `node-key` / `default-expanded-keys` 需要稳定的字符串键：这里按对象引用（`toRaw` 后）
 * 分配自增 id，同一对象多次调用返回同一 id。
 */
const objectIdMap = new WeakMap<object, string>();
let objectIdSeed = 0;

/**
 * 取 Object3D 的稳定字符串标识（替代已删除的 `Object3D.uuid`）。
 *
 * @param object3D 游戏对象
 */
function getObjectId(object3D: object): string
{
    const raw = toRaw(object3D);
    let id = objectIdMap.get(raw);
    if (id === undefined) {
        id = `object3D_${++objectIdSeed}`;
        objectIdMap.set(raw, id);
    }

    return id;
}

/**
 * 判断选中项是否为 Object3D。
 *
 * `Object3D` 已是纯数据接口（运行时无值），不能用 `instanceof`；选中列表元素类型为
 * `Object3D | AssetNode`（AssetNode 仍是编辑器自有 class），故用 `__type__` 判别。
 *
 * @param value 待判别值
 */
function isObject3DData(value: unknown): value is Object3D
{
    return (value as { __type__?: string } | undefined)?.__type__ === 'Object3D';
}

/**
 * 判断对象是否为场景根节点。
 *
 * 旧写法 `object3D.scene.object3D === object3D`：`Object3D.scene` 与 `Scene.object3D` 均已删除，
 * 新范式为「对象所属 `Scene` 组件的宿主对象即自身」（`logic(scene).entity`）。
 *
 * @param object3D 游戏对象
 */
function isSceneRootObject(object3D: Object3D | null | undefined): boolean
{
    if (!object3D) return false;
    const scene = getLogic(object3D).scene;
    if (!scene) return false;

    return (getLogic(scene).entity as Object3D | null) === toRaw(object3D);
}

/**
 * 判断 `object3D` 是否位于 `ancestor` 的子孙层级中（替代已删除的 `Object3D.contains`）。
 *
 * @param ancestor 祖先对象
 * @param object3D 待判别对象
 */
function containsObject3D(ancestor: Object3D, object3D: Object3D): boolean
{
    let current = getLogic(object3D).parent as Object3D | null;
    while (current) {
        if (toRaw(current) === toRaw(ancestor)) return true;
        current = getLogic(current).parent as Object3D | null;
    }

    return false;
}

/**
 * 把子对象挂到父对象下（替代已删除的命令式 `parent.addChild(child)`）。
 *
 * 父子关系由主仓 `ContainerLogic` 的 effect 在 `children` 变化后自动维护，因此只需响应式 push。
 *
 * @param parent 父对象
 * @param child 子对象
 */
function addChildObject3D(parent: Object3D, child: Object3D): void
{
    // 先经 logic() 确保父对象已初始化（ContainerLogic 构造时会把缺失的 children 补成数组）
    getLogic(parent);
    const r_children = reactive(parent).children as unknown as Object3D[];
    r_children.push(child);
}

// 树数据
const treeData = ref<any[]>([]);
const treeRef = ref();
const expandedKeys = ref<string[]>([]);
const treeProps = {
  children: 'children',
  label: 'label',
};

// 右键菜单项类型
interface ContextMenuItem {
  label: string;
  command: string;
  disabled?: boolean;
  divided?: boolean;
  submenu?: ContextMenuItem[];
  hasSubmenu?: boolean;
}

// 右键菜单项
const contextMenuItems = ref<ContextMenuItem[]>([]);
const contextMenuCommandMap = ref<Map<string, () => void>>(new Map());
const dropdownVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });

// 子菜单相关
const submenuVisible = ref(false);
const currentSubmenu = ref<ContextMenuItem[]>([]);
const submenuPosition = ref({ x: 0, y: 0 });
const submenuTimer = ref<number | null>(null);

// 获取原始对象的辅助函数（避免 Vue Proxy 干扰）
function getRawObject<T>(obj: T): T {
  if (!obj) return obj;
  
  // 检查是否是 Vue Proxy（通过检查是否有 __v_raw 属性）
  const proxy = obj as any;
  if (proxy && typeof proxy === 'object' && '__v_raw' in proxy) {
    return proxy.__v_raw;
  }
  
  // 使用 Vue 的 toRaw 函数
  try {
    return toRaw(obj);
  } catch (e) {
    // 如果 toRaw 失败，返回原对象
    return obj;
  }
}

// 更新层级树
function updateHierarchyTree() {
  if (!hierarchy.rootnode) {
    treeData.value = [];
    return;
  }
  
  // 转换为 el-tree 需要的格式
  function convertNode(node: HierarchyNode): any {
    // 使用游戏对象的稳定标识（替代已删除的 `Object3D.uuid`）作为唯一标识
    const id = node.object3D ? getObjectId(node.object3D) : '';
    return {
      ...node,
      id, // 使用稳定标识作为唯一标识
      label: node.label || node.object3D?.name,
      children: node.children && node.children.length > 0 
        ? node.children.map(convertNode) 
        : undefined,
    };
  }
  
  // el-tree 需要树形结构，以场景作为根节点显示
  treeData.value = hierarchy.rootnode 
    ? [convertNode(hierarchy.rootnode)]
    : [];
  
  // 更新展开状态
  nextTick(() => {
    updateExpandedNodes();
  });
}

// 更新展开的节点
function updateExpandedNodes() {
  if (!hierarchy.rootnode) {
    expandedKeys.value = [];
    return;
  }
  
  const keys: string[] = [];
  
  function collectExpandedKeys(node: HierarchyNode) {
    if (node.isOpen && node.object3D) {
      keys.push(getObjectId(node.object3D));
    }
    
    if (node.children) {
      node.children.forEach(collectExpandedKeys);
    }
  }
  
  collectExpandedKeys(hierarchy.rootnode);
  expandedKeys.value = keys;
  
  // 如果组件已初始化，也尝试调用 setExpandedKeys（如果可用）
  if (treeRef.value && typeof treeRef.value.setExpandedKeys === 'function') {
    try {
      treeRef.value.setExpandedKeys(keys);
    } catch (error) {
      console.warn('Failed to set expanded keys via method:', error);
    }
  }
}

// 使层级树无效（触发更新）
function invalidHierarchy() {
  // 使用 nextTick 确保在下一帧更新
  nextTick(() => {
    updateHierarchyTree();
  });
}

// 监听根节点变化
function onRootNodeChanged() {
  invalidHierarchy();
}

// 递归监听所有节点事件
function onNode(node: HierarchyNode) {
  if (node) {
    node.on('added', invalidHierarchy);
    node.on('removed', invalidHierarchy);
    node.on('openChanged', invalidHierarchy);
    
    // 递归监听子节点
    if (node.children) {
      node.children.forEach(onNode);
    }
  }
}

// 监听根节点事件
function onRootNode(node: HierarchyNode) {
  onNode(node);
}

// 递归取消监听所有节点事件
function offNode(node: HierarchyNode) {
  if (node) {
    node.off('added', invalidHierarchy);
    node.off('removed', invalidHierarchy);
    node.off('openChanged', invalidHierarchy);
    
    // 递归取消监听子节点
    if (node.children) {
      node.children.forEach(offNode);
    }
  }
}

// 取消监听根节点事件
function offRootNode(node: HierarchyNode) {
  offNode(node);
}

// 递归转换菜单项
function convertMenuItems(menuItems: any[], commandIndex: { value: number }): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];
  let prevWasSeparator = false;
  
  menuItems.forEach((item) => {
    if (item.type === 'separator') {
      prevWasSeparator = true;
      return;
    }
    
    if (item.show === false || item.enable === false) {
      return;
    }
    
    const command = `cmd_${commandIndex.value++}`;
    const contextItem: ContextMenuItem = {
      label: item.label || '',
      command,
      disabled: item.enable === false,
      divided: prevWasSeparator,
      hasSubmenu: !!(item.submenu && item.submenu.length > 0),
    };
    
    // 如果有子菜单，递归转换
    if (item.submenu && item.submenu.length > 0) {
      contextItem.submenu = convertMenuItems(item.submenu, commandIndex);
    }
    
    // 如果有点击事件，保存到命令映射
    if (item.click) {
      contextMenuCommandMap.value.set(command, item.click);
    }
    
    items.push(contextItem);
    prevWasSeparator = false;
  });
  
  return items;
}

// 设置上下文菜单
function setupContextMenu(menuItems: any[]) {
  contextMenuCommandMap.value.clear();
  const commandIndex = { value: 0 };
  const items = convertMenuItems(menuItems, commandIndex);
  contextMenuItems.value = items;
  console.log('设置菜单项完成，数量:', items.length);
}

// 菜单命令处理
function onMenuCommand(command: string) {
  const handler = contextMenuCommandMap.value.get(command);
  if (handler) {
    handler();
    // 创建对象后，手动触发层级树更新
    // 使用 setTimeout 确保对象已创建完成
    setTimeout(() => {
      invalidHierarchy();
    }, 0);
  }
  // 清空命令映射和菜单
  contextMenuCommandMap.value.clear();
  dropdownVisible.value = false;
  submenuVisible.value = false;
  currentSubmenu.value = [];
}

// 菜单项鼠标进入（显示子菜单）
function onItemMouseEnter(item: ContextMenuItem, index: number) {
  if (!item.hasSubmenu || !item.submenu || item.submenu.length === 0) {
    return;
  }
  
  // 清除之前的定时器
  if (submenuTimer.value !== null) {
    clearTimeout(submenuTimer.value);
    submenuTimer.value = null;
  }
  
  // 计算子菜单位置
  const menuItemHeight = 32; // 菜单项高度
  const menuWidth = 200; // 菜单宽度
  const submenuX = contextMenuPosition.value.x + menuWidth;
  const submenuY = contextMenuPosition.value.y + index * menuItemHeight;
  
  // 确保子菜单不超出屏幕
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  let finalX = submenuX;
  let finalY = submenuY;
  
  // 如果右侧空间不足，显示在左侧
  if (submenuX + menuWidth > screenWidth) {
    finalX = contextMenuPosition.value.x - menuWidth;
  }
  
  // 如果底部空间不足，向上调整
  const submenuHeight = item.submenu.length * menuItemHeight;
  if (submenuY + submenuHeight > screenHeight) {
    finalY = Math.max(0, screenHeight - submenuHeight);
  }
  
  submenuPosition.value = { x: finalX, y: finalY };
  currentSubmenu.value = item.submenu;
  submenuVisible.value = true;
}

// 菜单项鼠标离开（延迟隐藏子菜单）
function onItemMouseLeave(item: ContextMenuItem, index: number) {
  if (!item.hasSubmenu) {
    return;
  }
  
  // 延迟隐藏，给用户时间移动到子菜单
  submenuTimer.value = window.setTimeout(() => {
    submenuVisible.value = false;
    currentSubmenu.value = [];
  }, 200);
}

// 子菜单鼠标进入（保持显示）
function onSubmenuMouseEnter() {
  if (submenuTimer.value !== null) {
    clearTimeout(submenuTimer.value);
    submenuTimer.value = null;
  }
}

// 子菜单鼠标离开（隐藏子菜单）
function onSubmenuMouseLeave() {
  submenuVisible.value = false;
  currentSubmenu.value = [];
}

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent) {
  if (dropdownVisible.value) {
    const target = event.target as HTMLElement;
    if (!target.closest('.context-menu-container')) {
      dropdownVisible.value = false;
    }
  }
}

// 下拉菜单显示状态变化
function onDropdownVisibleChange(visible: boolean) {
  if (!visible) {
    // 菜单关闭时清空菜单项
    contextMenuItems.value = [];
    contextMenuCommandMap.value.clear();
    dropdownVisible.value = false;
  }
}

// 获取节点图标
function getNodeIcon(data: any): string {
  const node = data as HierarchyNode;
  if (node && node.object3D) {
    // 场景根节点使用场景图标
    if (isSceneRootObject(node.object3D)) {
      return 'material-symbols:view-in-ar';
    }
  }
  // 其他游戏对象使用通用图标
  return 'material-symbols:category';
}

// 树节点点击
function onNodeClick(data: any) {
  try {
    // data 可能是转换后的对象，需要通过 gameobject 获取真正的节点
    if (data && data.object3D) {
      editorStore.selectObject(data.object3D);
    }
  } catch (error) {
    console.error('HierarchyView: 节点点击失败', error);
  }
}

// 树节点双击
function onNodeDoubleClick(data: any) {
  try {
    // data 可能是转换后的对象，需要通过 gameobject 获取真正的节点
    if (data && data.object3D) {
      shortcut.emit('lookToSelectedObject3D');
    }
  } catch (error) {
    console.error('HierarchyView: 节点双击失败', error);
  }
}

// 树节点右键
function onNodeRightClick(event: MouseEvent, data: any) {
  try {
    event.preventDefault();
    event.stopPropagation();
    
    // data 可能是转换后的对象，需要通过 gameobject 获取真正的节点
    if (!data || !data.object3D) return;
    
    // 选中节点
    editorStore.selectObject(data.object3D);
  
  // 构建右键菜单
  const menus: any[] = [];
  
  // scene 无法删除（场景根节点判定：见 isSceneRootObject）
  if (!isSceneRootObject(data.object3D as Object3D)) {
    menus.push(
      {
        label: t('contextMenu.copy'),
        click: () => {
          const objects = editorStore.selectedObjects;
          editorStore.copyObjects = objects;
        },
      },
      {
        label: t('contextMenu.paste'),
        click: () => {
          const undoSelectedObjects = editorStore.selectedObjects;
          // `Object3D` 是纯数据接口，不能用 `instanceof`；选中列表元素为 `Object3D | AssetNode`
          const objects = editorStore.copyObjects.filter(isObject3DData);
          if (objects.length === 0) return;
          
          const newObject3Ds = objects.map((v) => serialization.clone(v));
          // 旧 `data.object3D.parent.addChild(v)` → 响应式 push（父级关系由 ContainerLogic 的 effect 维护）
          const targetObject3D = data.object3D as Object3D;
          const parent = getLogic(targetObject3D).parent as Object3D | null;
          if (parent) {
            newObject3Ds.forEach((v) => {
              addChildObject3D(parent, v);
            });
          }
          editorStore.selectMultiObject(newObject3Ds);
          
          // undo
          editorStore.undoList.push(() => {
            newObject3Ds.forEach((v) => {
              // 旧 `v.remove()` → `dispose()`（内含从父级 children 摘除）
              getLogic(v).dispose();
            });
            editorStore.selectMultiObject(undoSelectedObjects as any, false);
          });
        },
      },
      { type: 'separator' },
      {
        label: t('contextMenu.duplicate'),
        click: () => {
          const undoSelectedObjects = [...editorStore.selectedObjects] as any;
          const objects = editorStore.selectedObjects;
          const newObject3Ds = objects.map((v) => {
            const no = serialization.clone(v);
            if (isObject3DData(v)) {
              const parent = getLogic(v).parent as Object3D | null;
              if (parent) {
                addChildObject3D(parent, no as Object3D);
              }
            }
            return no;
          });
          editorStore.selectMultiObject(newObject3Ds);
          
          // undo
          editorStore.undoList.push(() => {
            newObject3Ds.forEach((v) => {
              // 仅 Object3D 需要释放（AssetNode 为资源节点，无场景层级）
              if (isObject3DData(v)) getLogic(v).dispose();
            });
            editorStore.selectMultiObject(undoSelectedObjects as any, false);
          });
        },
      },
      {
        label: t('contextMenu.delete'),
        click: () => {
          // 旧 `parent.removeChild(data.object3D)` → `dispose()`（摘除自身 + 递归释放子对象/组件）
          getLogic(data.object3D as Object3D).dispose();
          const index = editorStore.selectedObjects.indexOf(data.object3D);
          if (index !== -1) {
            const selectedObjects = [...editorStore.selectedObjects];
            selectedObjects.splice(index, 1);
            editorStore.selectMultiObject(selectedObjects as Array<Object3D | import('../../ui/assets/AssetNode').AssetNode>);
          }
        },
      }
    );
  }
  
  menus.push({ type: 'separator' }, ...menuConfig.getCreateObjectMenu());
  
  // 设置菜单位置
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  };
  
  // 转换为 Element Plus 格式并设置菜单项
  setupContextMenu(menus);
  
  // 使用 nextTick 确保菜单项已设置，然后显示菜单
  nextTick(() => {
    console.log('显示菜单，菜单项数量:', contextMenuItems.value.length);
    console.log('菜单位置:', contextMenuPosition.value);
    if (contextMenuItems.value.length > 0) {
      dropdownVisible.value = true;
      console.log('dropdownVisible 设置为 true');
    } else {
      console.warn('菜单项为空，不显示菜单');
    }
  });
  } catch (error) {
    console.error('HierarchyView: 节点右键失败', error);
  }
}

// 树列表点击（空白处）
function onTreeClick(event: MouseEvent) {
  // 检查点击的是否是空白处（不是树节点）
  const target = event.target as HTMLElement;
  
  // 如果点击的是容器本身，取消选择
  if (target.classList.contains('hierarchy-view')) {
    editorStore.selectObject(null);
    return;
  }
  
  // 检查是否点击在树的空白区域（不是节点）
  const treeEl = treeRef.value?.$el;
  if (treeEl && treeEl.contains(target)) {
    // 如果点击的不是树节点，取消选择
    const treeNode = target.closest('.el-tree-node');
    if (!treeNode) {
      editorStore.selectObject(null);
    }
  }
}

// 树列表右键（空白处）
function onTreeRightClick(event: MouseEvent) {
  // 检查右键的是否是空白处（不是树节点）
  const target = event.target as HTMLElement;
  
  // 如果右键的是容器本身，显示创建对象菜单
  if (target.classList.contains('hierarchy-view')) {
    event.preventDefault();
    event.stopPropagation();
    
    // 取消选择
    editorStore.selectObject(null);
    
    // 设置菜单位置
    contextMenuPosition.value = {
      x: event.clientX,
      y: event.clientY
    };
    
    // 显示创建对象菜单
    const menus = menuConfig.getCreateObjectMenu();
    setupContextMenu(menus);
    
    // 使用 nextTick 确保菜单项已设置，然后显示菜单
    nextTick(() => {
      dropdownVisible.value = true;
    });
    return;
  }
  
  // 检查是否右键在树的空白区域（不是节点）
  const treeEl = treeRef.value?.$el;
  if (treeEl && treeEl.contains(target)) {
    // 如果右键的不是树节点，显示创建对象菜单
    const treeNode = target.closest('.el-tree-node');
    if (!treeNode) {
      event.preventDefault();
      event.stopPropagation();
      
      // 取消选择
      editorStore.selectObject(null);
      
      // 设置菜单位置
      contextMenuPosition.value = {
        x: event.clientX,
        y: event.clientY
      };
      
      // 显示创建对象菜单
      const menus = menuConfig.getCreateObjectMenu();
      setupContextMenu(menus);
      
      // 使用 nextTick 确保菜单项已设置，然后显示菜单
      nextTick(() => {
        dropdownVisible.value = true;
      });
    }
  }
}

// 监听 hierarchy.rootnode 变化
watch(
  () => hierarchy.rootnode,
  (newNode, oldNode) => {
    offRootNode(oldNode);
    onRootNode(newNode);
    invalidHierarchy();
  },
  { immediate: true }
);

// 监听 gameScene 变化，确保 hierarchy.rootnode 被初始化
watch(
  () => (editorStore as any).gameScene,
  (newScene) => {
    if (newScene && !hierarchy.rootnode) {
      // 如果 gameScene 已设置但 rootnode 还未初始化，等待 EditorView.render() 设置
      // 这里可以触发一次更新检查
      setTimeout(() => {
        if (hierarchy.rootnode) {
          invalidHierarchy();
        }
      }, 100);
    }
  },
  { immediate: true }
);

onMounted(() => {
  // 初始化
  if (hierarchy.rootnode) {
    onRootNode(hierarchy.rootnode);
    invalidHierarchy();
  }
  
  // 监听根节点变化
  watcher.watch(hierarchy, 'rootnode', onRootNodeChanged);
  
  // 监听选中对象变化，更新树节点高亮
  globalEmitter.on('editor.selectedObjectsChanged', () => {
    nextTick(() => {
      updateSelectedNode();
    });
  });
  
  // 监听快捷键删除命令
  shortcut.on('deleteSeletedObject3D', deleteSelectedObjects);
  
  // 监听点击外部关闭菜单
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('contextmenu', handleClickOutside);
});

onUnmounted(() => {
  watcher.unwatch(hierarchy, 'rootnode', onRootNodeChanged);
  if (hierarchy.rootnode) {
    offRootNode(hierarchy.rootnode);
  }
  globalEmitter.off('editor.selectedObjectsChanged', () => {});
  
  // 移除快捷键监听
  shortcut.off('deleteSeletedObject3D', deleteSelectedObjects);
  
  // 移除点击外部关闭菜单的监听
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('contextmenu', handleClickOutside);
});

// 更新选中的节点
function updateSelectedNode() {
  if (!treeRef.value) return;
  
  const selectedNode = hierarchy.getSelectedNode();
  if (selectedNode && selectedNode.object3D) {
    treeRef.value.setCurrentKey(getObjectId(selectedNode.object3D));
  } else {
    treeRef.value.setCurrentKey(null);
  }
}

// 删除选中的对象
function deleteSelectedObjects() {
  const selectedObjects = editorStore.selectedObjects;
  if (!selectedObjects || selectedObjects.length === 0) {
    return;
  }
  
  // 过滤出 Object3D（scene 无法删除）
  const gameObjects = selectedObjects.filter((obj) => {
    if (isObject3DData(obj)) {
      // 检查是否是 scene 根对象
      return !isSceneRootObject(obj);
    }
    return false;
  }) as Object3D[];
  
  if (gameObjects.length === 0) {
    return;
  }
  
  // 删除所有选中的 Object3D
  // 旧 `gameObject.parent.removeChild(gameObject)` → `dispose()`（摘除自身 + 递归释放）
  gameObjects.forEach((gameObject) => {
    getLogic(gameObject).dispose();
  });
  
  // 清空选中对象
  editorStore.clearSelectedObjects();
  
  // 触发层级树更新
  invalidHierarchy();
}

// 键盘事件处理（仅处理 Delete 键，作为快捷键系统的补充）
function onKeyDown(event: KeyboardEvent) {
  // 检查是否按下了 Delete 键
  if (event.key === 'Delete') {
    // 检查是否在输入框中（避免在输入时误删）
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    
    // 阻止默认行为
    event.preventDefault();
    event.stopPropagation();
    
    // 删除选中的对象
    deleteSelectedObjects();
  }
}

// 拖拽相关
let dragData: DragData | null = null;
let dragSourceNode: HierarchyNode | null = null;

// 判断节点是否允许拖拽
function allowDrag(node: any): boolean {
  const data = node.data;
  if (!data || !data.object3D) {
    return false;
  }
  // 场景根节点不允许拖拽
  if (isSceneRootObject(data.object3D as Object3D)) {
    return false;
  }
  return true;
}

// 判断是否允许放置
function allowDrop(draggingNode: any, dropNode: any, type: 'prev' | 'inner' | 'next'): boolean {
  const sourceData = draggingNode.data;
  const targetData = dropNode.data;
  
  if (!sourceData || !targetData || !sourceData.object3D || !targetData.object3D) {
    return false;
  }
  
  // 场景根节点不允许作为目标
  if (isSceneRootObject(targetData.object3D as Object3D)) {
    return false;
  }
  
  // 不能拖拽到自己或自己的子节点中（`Object3D.contains` 已删除，改用向上遍历父级）
  if (sourceData.object3D === targetData.object3D
    || containsObject3D(sourceData.object3D as Object3D, targetData.object3D as Object3D)) {
    return false;
  }
  
  // 只允许拖拽到节点内部（作为子节点）
  return type === 'inner';
}

// 节点拖拽开始
function onNodeDragStart(node: any) {
  try {
    const data = node.data;
    if (!data || !data.object3D) {
      return;
    }
    
    // 获取原始 gameobject（不是 Vue Proxy）
    const rawObject3D = getRawObject(data.object3D);
    
    // 通过 gameobject 获取真正的 HierarchyNode 实例
    // 因为 convertNode 创建的是普通对象，方法会丢失
    const hierarchyNode = hierarchy.getNode(rawObject3D);
    if (!hierarchyNode) {
      console.warn('HierarchyView: 无法找到 HierarchyNode 实例', rawObject3D);
      return;
    }
    
    dragSourceNode = hierarchyNode;
    dragData = new DragData();
    hierarchyNode.setdargSource(dragData);
  } catch (error) {
    console.error('HierarchyView: 拖拽开始失败', error);
    // 清理状态，避免后续操作出错
    dragSourceNode = null;
    dragData = null;
  }
}

// 节点拖拽悬停
function onNodeDragOver(node: any) {
  // 可以在这里添加视觉反馈
}

// 节点拖拽离开
function onNodeDragLeave(node: any) {
  // 可以在这里移除视觉反馈
}

// 节点拖拽放置
function onNodeDrop(draggingNode: any, dropNode: any, dropType: 'prev' | 'inner' | 'next', event: DragEvent) {
  try {
    event.preventDefault();
    event.stopPropagation();
    
    if (!dragData || !dropNode) {
      return;
    }
    
    const targetData = dropNode.data;
    if (!targetData || !targetData.object3D) {
      return;
    }
    
    // 获取原始 gameobject（不是 Vue Proxy）
    const rawObject3D = getRawObject(targetData.object3D);
    
    // 通过 gameobject 获取真正的 HierarchyNode 实例
    const targetNode = hierarchy.getNode(rawObject3D);
    if (!targetNode) {
      console.warn('HierarchyView: 无法找到目标 HierarchyNode 实例', rawObject3D);
      return;
    }
    
    // 只处理拖拽到节点内部的情况
    if (dropType === 'inner') {
      targetNode.acceptDragDrop(dragData);
      // 触发层级树更新
      invalidHierarchy();
    }
  } catch (error) {
    console.error('HierarchyView: 拖拽放置失败', error);
  } finally {
    // 清理拖拽状态
    dragData = null;
    dragSourceNode = null;
  }
}
</script>

<style scoped>
.hierarchy-view {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  /* 使用 VSCode 主题变量 */
  background-color: var(--editor-background);
  color: var(--editor-foreground);
  padding: 8px;
}

.tree-node {
  display: flex;
  align-items: center;
  flex: 1;
}

/* 树形组件样式已移至全局主题 global-theme.css */

/* 右键菜单容器 */
.context-menu-wrapper {
  position: fixed;
  z-index: 2000;
}

.context-menu {
  background-color: var(--sideBar-background, #2d2d2d);
  border: 1px solid var(--sideBar-border, #3d3d3d);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  min-width: 150px;
  padding: 4px 0;
  overflow: hidden;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  color: var(--editor-foreground, #cccccc);
  font-size: 14px;
  user-select: none;
  transition: background-color 0.2s;
}

.context-menu-item:hover:not(.context-menu-item-disabled) {
  background-color: var(--list-hoverBackground, #2d2d2d);
}

.context-menu-item-disabled {
  color: var(--descriptionForeground, #666666);
  cursor: not-allowed;
  opacity: 0.5;
}

.context-menu-item-divided {
  border-top: 1px solid var(--sideBar-border, #3d3d3d);
  margin-top: 4px;
  padding-top: 8px;
}

.context-menu-item-has-submenu {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.context-menu-item-label {
  flex: 1;
}

.context-menu-item-arrow {
  margin-left: 8px;
  color: var(--sideBarSectionHeader-foreground, #666666);
}

.context-menu.submenu {
  margin-left: 0;
}
</style>

