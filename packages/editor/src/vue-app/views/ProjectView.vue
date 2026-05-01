<template>
  <div class="project-view">
    <!-- 左侧：资源树 -->
    <div class="project-view-tree">
      <el-tree
        ref="treeRef"
        :data="processedTreeData"
        :props="treeProps"
        :default-expand-all="false"
        node-key="id"
        :highlight-current="true"
        :draggable="true"
        :allow-drop="allowTreeDrop"
        :allow-drag="allowTreeDrag"
        @node-click="onTreeNodeClick"
        @node-contextmenu="onTreeNodeRightClick"
        @node-drag-start="onTreeNodeDragStart"
        @node-drop="onTreeNodeDrop"
      >
        <template #default="{ node, data }">
          <div 
            v-if="data"
            class="tree-node"
            :class="{ 'tree-node-drag-over': isTreeNodeDragOver(data) }"
          >
            <Icon
              :icon="data.isDirectory ? 'material-symbols:folder' : getFileIcon(data)"
              :size="16"
              style="margin-right: 4px"
            />
            <span>{{ data.label }}</span>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 右侧：文件列表 -->
    <div class="project-view-content">
      <!-- 文件夹路径导航 -->
      <div class="project-view-path">
        <el-breadcrumb separator=">">
          <el-breadcrumb-item
            v-for="(folder, index) in folderPath"
            :key="folder.asset.assetId"
            @click="onPathClick(folder as AssetNode)"
            style="cursor: pointer"
          >
            {{ folder.label }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 文件过滤 -->
      <div class="project-view-filter">
        <el-input
          v-model="includeFilter"
          placeholder="包含（正则）"
          clearable
          size="small"
          style="width: 150px; margin-right: 8px"
        >
          <template #prefix>
            <Icon icon="mdi:magnify" :size="14" />
          </template>
        </el-input>
        <el-input
          v-model="excludeFilter"
          placeholder="排除（正则）"
          clearable
          size="small"
          style="width: 150px"
        >
          <template #prefix>
            <Icon icon="mdi:filter-remove" :size="14" />
          </template>
        </el-input>
      </div>

      <!-- 文件列表 -->
      <div
        ref="fileListRef"
        class="project-view-filelist"
        :class="{ 'file-list-drag-over': isDragOverFileList }"
        @click="onFileListClick"
        @contextmenu="onFileListRightClick"
        @mousedown="onFileListMouseDown"
        @drop="onFileDrop"
        @dragover.prevent="onFileListDragOver"
        @dragenter.prevent="onFileListDragEnter"
        @dragleave="onFileListDragLeave"
      >
        <div
          v-for="(file, index) in filteredFiles"
          :key="(file as AssetNode).asset.assetId || index"
          :class="['file-item', { 
            'file-item-selected': isFileSelected(file as AssetNode), 
            'file-item-dragging': draggingFile === file,
            'file-item-drag-over': dragOverFolder === file && file.isDirectory
          }]"
          :draggable="true"
          @click.stop="onFileClick(file as AssetNode, $event)"
          @dblclick="onFileDoubleClick(file as AssetNode)"
          @contextmenu.stop="onFileRightClick(file as AssetNode, $event)"
          @dragstart="onFileDragStart(file as AssetNode, $event)"
          @dragend="onFileDragEnd"
          @dragover.prevent="onFileItemDragOver(file as AssetNode, $event)"
          @dragenter.prevent="onFileItemDragEnter(file as AssetNode, $event)"
          @dragleave="onFileItemDragLeave(file as AssetNode, $event)"
          @drop.prevent="onFileItemDrop(file as AssetNode, $event)"
        >
          <div class="file-item-icon">
            <Icon
              :icon="(file as AssetNode).isDirectory ? 'material-symbols:folder' : getFileIcon(file as AssetNode)"
              :size="24"
            />
          </div>
          <div class="file-item-label">{{ (file as AssetNode).label }}</div>
        </div>
      </div>

      <!-- 文件路径显示 -->
      <div class="project-view-filepath">
        {{ selectedFilePath }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { globalEmitter, IEvent, windowEventProxy, Rectangle, Vector2, shortcut } from 'feng3d';
import { editorAsset } from '../../ui/assets/EditorAsset';
import { AssetNode } from '../../ui/assets/AssetNode';
import { useEditorStore } from '../stores/editorStore';
import Icon from '../components/Icon.vue';
import { registerProjectView, unregisterProjectView } from './ProjectViewAdapter';
import { DragData } from '../../ui/drag/Drag';

const editorStore = useEditorStore();

// 树数据
const treeData = ref<AssetNode[]>([]);
const treeRef = ref();
const treeProps = {
  children: 'children',
  label: 'label',
};

// 为树节点添加 id 属性（el-tree 需要）
// 注意：返回的对象是普通对象，不是 AssetNode 实例，但包含所有 AssetNode 的属性
// 左边栏仅显示文件夹，过滤掉文件
const processedTreeData = computed(() => {
  function addId(nodes: AssetNode[]): any[] {
    return nodes.map((node) => {
      // 只处理文件夹的子节点，过滤掉文件
      const folderChildren = node.children 
        ? (node.children as AssetNode[]).filter((child) => child.isDirectory)
        : [];
      
      return {
        ...node,
        id: node.asset.assetId, // el-tree 的 node-key
        children: folderChildren.length > 0 ? addId(folderChildren) : undefined,
      };
    });
  }
  return addId(treeData.value as AssetNode[]);
});

// 文件列表
const fileListRef = ref<HTMLElement>();
const filteredFiles = ref<AssetNode[]>([]);
const includeFilter = ref('');
const excludeFilter = ref('');

// 上一次点击的文件（用于 Shift 多选）
let preAssetFile: AssetNode | null = null;

// 文件夹路径（使用 ref 以便在文件夹变化时更新）
const folderPath = ref<AssetNode[]>([]);

// 更新文件夹路径
function updateFolderPath() {
  const path: AssetNode[] = [];
  let folder = editorAsset.showFloder;
  while (folder) {
    path.unshift(folder);
    folder = folder.parent;
  }
  folderPath.value = path;
}

// 选中的文件路径
const selectedFilePath = computed(() => {
  const selected = editorStore.selectedAssetNodes;
  if (selected.length > 0) {
    return selected.map((v) => (v.asset.fileName || v.label) + (v.asset.extenson || '')).join(', ');
  }
  return '';
});

// 区域选择
const areaSelectStartPosition = ref<Vector2 | null>(null);
const isAreaSelecting = ref(false);

// 初始化资源树监听
function setupAssetTreeListeners() {
  if (editorAsset && editorAsset.rootFile) {
    // 移除旧的监听器（如果存在）
    editorAsset.rootFile.off('openChanged', invalidateAssetTree);
    editorAsset.rootFile.off('added', invalidateAssetTree);
    editorAsset.rootFile.off('removed', invalidateAssetTree);
    
    // 添加新的监听器
    editorAsset.rootFile.on('openChanged', invalidateAssetTree);
    editorAsset.rootFile.on('added', invalidateAssetTree);
    editorAsset.rootFile.on('removed', invalidateAssetTree);
    
    // 立即更新资源树
    invalidateAssetTree();
    return true;
  }
  return false;
}

// 初始化
function initList() {
  // 检查 editorAsset 和 rootFile 是否已初始化
  if (setupAssetTreeListeners()) {
    return; // 已成功初始化
  }
  
  // 如果还未初始化，等待一下再试
  let checkCount = 0;
  const maxChecks = 50; // 最多检查 50 次（5 秒）
  const checkInterval = setInterval(() => {
    checkCount++;
    if (setupAssetTreeListeners()) {
      clearInterval(checkInterval);
      console.log('ProjectView: editorAsset initialized after', checkCount * 100, 'ms');
    } else if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
      console.warn('ProjectView: editorAsset initialization timeout after 5 seconds');
    }
  }, 100);
}

// 更新资源树
function invalidateAssetTree() {
  // 检查 editorAsset 和 rootFile 是否已初始化
  if (!editorAsset || !editorAsset.rootFile) {
    // 如果还未初始化，等待一下再试
    setTimeout(() => {
      if (editorAsset && editorAsset.rootFile) {
        invalidateAssetTree();
      }
    }, 100);
    return;
  }
  
  // 直接使用根文件夹构建树形结构，避免使用 getFolderList() 导致的扁平化重复显示
  // processedTreeData 会递归处理并过滤掉文件，只保留文件夹
  treeData.value = [editorAsset.rootFile];
  
  // 更新当前文件夹的文件列表
  updateFileList();
}

// 更新文件列表
function updateFileList() {
  const folder = editorAsset.showFloder;
  if (!folder) {
    filteredFiles.value = [];
    return;
  }

  const children = folder.children || [];
  
  // 应用过滤
  let files = children.filter((file) => {
    // 包含过滤
    if (includeFilter.value) {
      try {
        const includeReg = new RegExp(includeFilter.value);
        if (!includeReg.test(file.label)) {
          return false;
        }
      } catch (e) {
        // 正则表达式错误，忽略
      }
    }
    
    // 排除过滤
    if (excludeFilter.value) {
      try {
        const excludeReg = new RegExp(excludeFilter.value);
        if (excludeReg.test(file.label)) {
          return false;
        }
      } catch (e) {
        // 正则表达式错误，忽略
      }
    }
    
    return true;
  });
  
  // 排序：文件夹在前，然后按名称排序
  files = files.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.label.localeCompare(b.label);
  });
  
  filteredFiles.value = files;
}

// 获取文件图标
function getFileIcon(file: AssetNode): string {
  if (file.isDirectory) {
    return 'material-symbols:folder';
  }
  
  // 根据文件扩展名返回图标
  const ext = file.asset.extenson?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    '.js': 'vscode-icons:file-type-js',
    '.ts': 'vscode-icons:file-type-typescript',
    '.json': 'vscode-icons:file-type-json',
    '.vue': 'vscode-icons:file-type-vue',
    '.html': 'vscode-icons:file-type-html',
    '.css': 'vscode-icons:file-type-css',
    '.png': 'vscode-icons:file-type-image',
    '.jpg': 'vscode-icons:file-type-image',
    '.jpeg': 'vscode-icons:file-type-image',
    '.gif': 'vscode-icons:file-type-image',
    '.svg': 'vscode-icons:file-type-svg',
  };
  
  return iconMap[ext] || 'vscode-icons:default-file';
}

// 树节点点击
function onTreeNodeClick(data: any) {
  // data 是 processedTreeData 返回的对象，包含所有 AssetNode 的属性
  // 使用 editorAsset.getAssetByID 直接获取 AssetNode 实例
  const assetId = data.asset?.assetId || data.id;
  if (!assetId) return;
  
  const node = editorAsset.getAssetByID(assetId);
  if (node && node.isDirectory) {
    // 设置显示文件夹，这会触发 watch 更新右侧文件列表
    editorAsset.showFloder = node;
  }
}

// 根据 assetId 查找 AssetNode 实例
function findAssetNodeByAssetId(assetId: string): AssetNode | null {
  function search(nodes: AssetNode[]): AssetNode | null {
    for (const node of nodes) {
      if (node.asset.assetId === assetId) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = search(node.children as AssetNode[]);
        if (found) return found;
      }
    }
    return null;
  }
  return search(treeData.value as AssetNode[]);
}

// 树节点右键
function onTreeNodeRightClick(event: MouseEvent, data: any) {
  event.preventDefault();
  // 使用 editorAsset.getAssetByID 直接获取 AssetNode 实例
  const assetId = data.asset?.assetId || data.id;
  if (!assetId) return;
  
  const node = editorAsset.getAssetByID(assetId);
  if (node) {
    editorAsset.popupmenu(node);
  }
}

// 路径点击
function onPathClick(folder: AssetNode) {
  editorAsset.showFloder = folder;
}

// 文件点击
function onFileClick(file: AssetNode, event?: MouseEvent) {
  // 处理按下 Shift 键时的多选
  const isShift = event?.shiftKey || shortcut.keyState.getKeyState('shift');
  if (isShift && preAssetFile) {
    // 找到当前点击的文件和之前点击的文件之间的所有文件
    const source = filteredFiles.value as AssetNode[];
    let currentIndex = source.indexOf(file);
    let preIndex = source.indexOf(preAssetFile);
    
    // 如果找不到之前的文件，只选择当前文件
    if (preIndex === -1) {
      editorStore.selectObject(file);
      preAssetFile = file;
      return;
    }
    
    // 确定选择范围
    let min = Math.min(currentIndex, preIndex);
    let max = Math.max(currentIndex, preIndex);
    
    // 选择范围内的所有文件
    const filesToSelect = source.slice(min, max + 1);
    editorStore.selectMultiObject(filesToSelect, false);
  } else {
    // 正常选择
    editorStore.selectObject(file);
    preAssetFile = file;
  }
}

// 文件双击
function onFileDoubleClick(file: AssetNode) {
  if (file.isDirectory) {
    editorAsset.showFloder = file;
  } else {
    // 打开文件（根据文件类型处理）
    // TODO: 实现文件打开逻辑
  }
}

// 文件右键
function onFileRightClick(file: AssetNode, event: MouseEvent) {
  event.preventDefault();
  editorStore.selectObject(file);
  editorAsset.popupmenu(file);
}

// 文件列表点击（空白处）
function onFileListClick(event: MouseEvent) {
  if (event.target === fileListRef.value) {
    editorStore.clearSelectedObjects();
  }
}

// 文件列表右键（空白处）
function onFileListRightClick(event: MouseEvent) {
  event.preventDefault();
  editorStore.clearSelectedObjects();
  editorAsset.popupmenu(editorAsset.showFloder);
}

// 文件列表鼠标按下（区域选择）
function onFileListMouseDown(event: MouseEvent) {
  if (event.target !== fileListRef.value) return;
  if (shortcut.getState('splitGroupDraging')) return;
  
  areaSelectStartPosition.value = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
  isAreaSelecting.value = true;
  
  windowEventProxy.on('mousemove', onMouseMove);
  windowEventProxy.on('mouseup', onMouseUp);
}

// 鼠标移动（区域选择）
function onMouseMove() {
  if (!isAreaSelecting.value || !areaSelectStartPosition.value || !fileListRef.value) return;
  
  const endPosition = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
  const rect = fileListRef.value.getBoundingClientRect();
  
  // 限制在选择区域内
  const clampedEnd = new Vector2(
    Math.max(rect.left, Math.min(rect.right, endPosition.x)),
    Math.max(rect.top, Math.min(rect.bottom, endPosition.y))
  );
  
  // TODO: 显示选择矩形
  // 计算选中的文件
  const min = areaSelectStartPosition.value.clone().min(clampedEnd);
  const max = areaSelectStartPosition.value.clone().max(clampedEnd);
  const areaRect = new Rectangle(min.x, min.y, max.x - min.x, max.y - min.y);
  
  // 获取选中的文件（需要根据实际渲染位置计算）
  // 这里简化处理，实际需要根据文件项的实际位置判断
  const selectedFiles: AssetNode[] = [];
  // TODO: 实现区域选择逻辑
  
  if (selectedFiles.length > 0) {
    editorStore.selectMultiObject(selectedFiles);
  }
}

// 鼠标释放
function onMouseUp() {
  isAreaSelecting.value = false;
  areaSelectStartPosition.value = null;
  windowEventProxy.off('mousemove', onMouseMove);
  windowEventProxy.off('mouseup', onMouseUp);
}

// 判断文件是否被选中
function isFileSelected(file: AssetNode): boolean {
  return editorStore.selectedAssetNodes.some(
    (node) => node.asset.assetId === file.asset.assetId
  );
}

// 树节点拖拽相关
let treeDragData: DragData | null = null;
let treeDragSourceNode: AssetNode | null = null;
const dragOverTreeNode = ref<any>(null); // 当前拖拽悬停的树节点（响应式）

// 检查节点是否应该高亮（用于模板中的安全访问）
function isTreeNodeDragOver(data: any): boolean {
  return dragOverTreeNode.value === data;
}

// 判断树节点是否允许拖拽
function allowTreeDrag(node: any): boolean {
  const assetNode = node.data as AssetNode;
  return assetNode && assetNode.isDirectory;
}

// 判断树节点是否允许放置
function allowTreeDrop(draggingNode: any, dropNode: any, type: 'prev' | 'inner' | 'next'): boolean {
  const sourceNode = draggingNode.data as AssetNode;
  const targetNode = dropNode.data as AssetNode;
  
  if (!targetNode || !targetNode.isDirectory) {
    // 更新高亮状态
    dragOverTreeNode.value = null;
    return false;
  }
  
  // 检查是否是从树节点拖拽
  if (sourceNode) {
    // 不能拖拽到自己或自己的子节点中
    if (sourceNode === targetNode || sourceNode.contain(targetNode)) {
      dragOverTreeNode.value = null;
      return false;
    }
    
    // 只允许拖拽到节点内部（作为子节点）
    if (type === 'inner') {
      dragOverTreeNode.value = dropNode.data; // 更新高亮状态
      return true;
    }
    dragOverTreeNode.value = null;
    return false;
  }
  
  // 检查是否是从文件列表拖拽
  if (fileDragData && draggingFile) {
    // 不能拖拽到自己或自己的子文件夹中
    if (draggingFile === targetNode || draggingFile.contain(targetNode)) {
      dragOverTreeNode.value = null;
      return false;
    }
    
    // 只允许拖拽到节点内部（作为子节点）
    if (type === 'inner') {
      dragOverTreeNode.value = dropNode.data; // 更新高亮状态
      return true;
    }
    dragOverTreeNode.value = null;
    return false;
  }
  
  dragOverTreeNode.value = null;
  return false;
}

// 树节点拖拽开始
function onTreeNodeDragStart(node: any) {
  const assetNode = node.data as AssetNode;
  if (!assetNode || !assetNode.isDirectory) {
    return;
  }
  
  treeDragSourceNode = assetNode;
  treeDragData = new DragData();
  assetNode.setdargSource(treeDragData);
  dragOverTreeNode.value = null; // 重置拖拽悬停状态
}

// 树节点拖拽悬停
function onTreeNodeDragOver(draggingNode: any, dropNode: any, event: DragEvent) {
  if (!treeDragData || !dropNode) {
    return;
  }
  
  const sourceNode = draggingNode.data as AssetNode;
  const targetNode = dropNode.data as AssetNode;
  
  // 检查是否允许放置（只允许拖拽到节点内部）
  if (sourceNode && targetNode && targetNode.isDirectory) {
    // 不能拖拽到自己或自己的子节点中
    if (sourceNode !== targetNode && !sourceNode.contain(targetNode)) {
      dragOverTreeNode.value = dropNode.data;
      return;
    }
  }
  
  // 如果是从文件列表拖拽过来的
  if (fileDragData && targetNode && targetNode.isDirectory) {
    if (draggingFile && draggingFile !== targetNode && !draggingFile.contain(targetNode)) {
      dragOverTreeNode.value = dropNode.data;
      return;
    }
  }
  
  dragOverTreeNode.value = null;
}

// 树节点拖拽离开
function onTreeNodeDragLeave(draggingNode: any, dropNode: any, event: DragEvent) {
  // 检查是否真的离开了节点
  const target = event.target as HTMLElement;
  const treeElement = treeRef.value?.$el;
  if (treeElement && !treeElement.contains(target)) {
    dragOverTreeNode.value = null;
  }
}

// 树节点拖拽放置
function onTreeNodeDrop(draggingNode: any, dropNode: any, dropType: 'prev' | 'inner' | 'next', event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  
  if (!dropNode) {
    dragOverTreeNode.value = null;
    return;
  }
  
  // 处理树节点拖拽
  if (treeDragData) {
    const targetNode = dropNode.data as AssetNode;
    if (!targetNode || !targetNode.isDirectory) {
      dragOverTreeNode.value = null;
      return;
    }
    
    // 只处理拖拽到节点内部的情况
    if (dropType === 'inner') {
      targetNode.acceptDragDrop(treeDragData);
      // 触发资源树更新
      invalidateAssetTree();
    }
    
    // 清理拖拽状态
    treeDragData = null;
    treeDragSourceNode = null;
  }
  
  // 处理文件列表拖拽到树节点
  if (fileDragData && draggingFile) {
    const targetNode = dropNode.data as AssetNode;
    if (targetNode && targetNode.isDirectory && dropType === 'inner') {
      // 不能拖到自己或自己的子文件夹中
      if (draggingFile !== targetNode && !draggingFile.contain(targetNode)) {
        targetNode.acceptDragDrop(fileDragData);
        // 触发资源树更新
        invalidateAssetTree();
      }
    }
    
    // 清理文件拖拽状态
    onFileDragEnd();
  }
  
  dragOverTreeNode.value = null;
}

// 文件列表拖拽相关
let fileDragData: DragData | null = null;
let draggingFile: AssetNode | null = null;
let isDragOverFileList = ref(false);
let dragOverFolder: AssetNode | null = null;

// 文件拖拽开始
function onFileDragStart(file: AssetNode, event: DragEvent) {
  draggingFile = file;
  fileDragData = new DragData();
  file.setdargSource(fileDragData);
  
  // 设置拖拽效果
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

// 文件拖拽结束
function onFileDragEnd() {
  draggingFile = null;
  fileDragData = null;
  isDragOverFileList.value = false;
  dragOverFolder = null;
  dragOverTreeNode.value = null; // 清理树节点拖拽悬停状态
}

// 文件项拖拽悬停
function onFileItemDragOver(file: AssetNode, event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  
  // 如果是内部文件拖拽，且目标是文件夹
  if (fileDragData && file.isDirectory && draggingFile) {
    // 不能拖到自己或自己的子文件夹中
    if (draggingFile !== file && !draggingFile.contain(file)) {
      dragOverFolder = file;
      isDragOverFileList.value = true;
    } else {
      dragOverFolder = null;
    }
  }
  // 如果是树节点拖拽到文件列表
  else if (treeDragData && treeDragSourceNode && file.isDirectory) {
    // 不能拖到自己或自己的子文件夹中
    if (treeDragSourceNode !== file && !treeDragSourceNode.contain(file)) {
      dragOverFolder = file;
      isDragOverFileList.value = true;
    } else {
      dragOverFolder = null;
    }
  }
}

// 文件项拖拽进入
function onFileItemDragEnter(file: AssetNode, event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  onFileItemDragOver(file, event);
}

// 文件项拖拽离开
function onFileItemDragLeave(file: AssetNode, event: DragEvent) {
  // 检查是否真的离开了文件项
  const target = event.target as HTMLElement;
  const fileItem = event.currentTarget as HTMLElement;
  if (!fileItem.contains(target)) {
    if (dragOverFolder === file) {
      dragOverFolder = null;
      isDragOverFileList.value = false;
    }
  }
}

// 文件项拖拽放置
async function onFileItemDrop(file: AssetNode, event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  
  // 如果是内部文件拖拽，且目标是文件夹
  if (fileDragData && file.isDirectory && draggingFile) {
    try {
      // 不能拖到自己或自己的子文件夹中
      if (draggingFile === file || draggingFile.contain(file)) {
        onFileDragEnd();
        return;
      }
      
      // 调用文件夹的 acceptDragDrop 方法
      file.acceptDragDrop(fileDragData);
      
      // 等待异步操作完成
      await nextTick();
      
      // 触发资源树更新
      invalidateAssetTree();
    } catch (error) {
      console.error('ProjectView: 文件拖拽放置失败', error);
    } finally {
      onFileDragEnd();
    }
  }
  // 如果是树节点拖拽到文件列表
  else if (treeDragData && treeDragSourceNode && file.isDirectory) {
    try {
      // 不能拖到自己或自己的子文件夹中
      if (treeDragSourceNode === file || treeDragSourceNode.contain(file)) {
        treeDragData = null;
        treeDragSourceNode = null;
        dragOverTreeNode.value = null;
        return;
      }
      
      // 调用文件夹的 acceptDragDrop 方法
      file.acceptDragDrop(treeDragData);
      
      // 等待异步操作完成
      await nextTick();
      
      // 触发资源树更新
      invalidateAssetTree();
    } catch (error) {
      console.error('ProjectView: 树节点拖拽到文件列表失败', error);
    } finally {
      treeDragData = null;
      treeDragSourceNode = null;
      dragOverTreeNode.value = null;
    }
  }
}

// 文件列表拖拽悬停（用于拖拽到空白区域）
function onFileListDragOver(event: DragEvent) {
  event.preventDefault();
  
  // 如果是内部文件拖拽，检查是否悬停在当前文件夹上（可以拖到当前文件夹）
  if (fileDragData && editorAsset.showFloder && editorAsset.showFloder.isDirectory) {
    // 检查是否悬停在文件项上（如果悬停在文件项上，由 onFileItemDragOver 处理）
    const target = event.target as HTMLElement;
    const fileItem = target.closest('.file-item');
    if (!fileItem) {
      // 悬停在空白区域，可以拖到当前文件夹
      dragOverFolder = editorAsset.showFloder;
      isDragOverFileList.value = true;
    }
  }
  // 外部文件拖入时，允许拖入到当前文件夹
  else if (editorAsset.showFloder && editorAsset.showFloder.isDirectory) {
    isDragOverFileList.value = true;
  }
}

// 文件列表拖拽进入
function onFileListDragEnter(event: DragEvent) {
  event.preventDefault();
  onFileListDragOver(event);
}

// 文件列表拖拽离开
function onFileListDragLeave(event: DragEvent) {
  // 检查是否真的离开了文件列表区域
  const target = event.target as HTMLElement;
  if (!fileListRef.value || !fileListRef.value.contains(target)) {
    isDragOverFileList.value = false;
    dragOverFolder = null;
  }
}

// 文件拖拽放置（更新原有的 onFileDrop，用于拖拽到空白区域）
async function onFileDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  
  const dt = event.dataTransfer;
  if (!dt) {
    onFileDragEnd();
    return;
  }
  
  // 优先处理从外部拖入的文件
  const fileList = dt.files;
  if (fileList.length > 0) {
    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      files.push(fileList[i]);
    }
    
    if (files.length > 0) {
      editorAsset.inputFiles(files);
      onFileDragEnd();
      return;
    }
  }
  
  // 处理内部文件拖拽（拖到当前文件夹的空白区域）
  if (fileDragData && dragOverFolder && draggingFile) {
    // 不能拖到自己或自己的子文件夹中
    if (draggingFile === dragOverFolder || draggingFile.contain(dragOverFolder)) {
      onFileDragEnd();
      return;
    }
    
    // 调用文件夹的 acceptDragDrop 方法
    dragOverFolder.acceptDragDrop(fileDragData);
    
    // 触发资源树更新
    invalidateAssetTree();
  }
  
  onFileDragEnd();
}

// 监听选中变化
function onSelectedObjectsChanged() {
  // 更新文件路径显示
  // 已通过 computed 自动更新
}

// 处理显示文件夹变化
function onShowFloderChanged() {
  // 使用 nextTick 确保 editorAsset.showFloder 已经更新
  nextTick(() => {
    updateFolderPath(); // 更新文件夹路径
    updateFileList();
    // 更新树节点选中状态
    if (treeRef.value && editorAsset.showFloder) {
      // 使用 assetId 作为 node-key
      treeRef.value.setCurrentKey(editorAsset.showFloder.asset.assetId);
    }
  });
}

// 监听过滤变化
watch([includeFilter, excludeFilter], () => {
  updateFileList();
});

// 监听项目资源树失效事件的回调函数
function onProjectViewInvalidate() {
  // 如果资源树监听器还未设置，尝试设置
  if (!editorAsset || !editorAsset.rootFile) {
    initList();
  } else {
    invalidateAssetTree();
  }
}

onMounted(() => {
  initList();
  
  // 注册适配器，支持旧代码调用
  registerProjectView({
    invalidateAssettree: invalidateAssetTree, // 使用正确的函数名
  });
  
  // 监听显示文件夹变化事件（editorAsset.showFloder 不是响应式对象，需要使用事件监听）
  globalEmitter.on('asset.showFloderChanged', onShowFloderChanged);
  
  globalEmitter.on('editor.selectedObjectsChanged', onSelectedObjectsChanged);
  globalEmitter.on('asset.showAsset', () => {
    // TODO: 处理显示资源
  });
  
  // 监听项目资源树失效事件（当项目初始化完成或资源更新时触发）
  globalEmitter.on('projectview.invalidateAssettree', onProjectViewInvalidate);
  
  // 初始化时显示当前文件夹内容和路径
  if (editorAsset && editorAsset.showFloder) {
    updateFolderPath();
    onShowFloderChanged();
  }
});

onUnmounted(() => {
  // 注销适配器
  unregisterProjectView();
  
  // 移除资源变化监听
  if (editorAsset && editorAsset.rootFile) {
    editorAsset.rootFile.off('openChanged', invalidateAssetTree);
    editorAsset.rootFile.off('added', invalidateAssetTree);
    editorAsset.rootFile.off('removed', invalidateAssetTree);
  }
  
  // 清理初始化检查定时器（如果有）
  // 注意：这里无法直接清理，因为定时器在 initList 内部
  // 但组件卸载时定时器会自动停止
  
  // 移除事件监听
  globalEmitter.off('asset.showFloderChanged', onShowFloderChanged);
  globalEmitter.off('editor.selectedObjectsChanged', onSelectedObjectsChanged);
  globalEmitter.off('asset.showAsset', () => {});
  globalEmitter.off('projectview.invalidateAssettree', onProjectViewInvalidate);
  
  if (isAreaSelecting.value) {
    onMouseUp();
  }
});
</script>

<style scoped>
.project-view {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  /* 使用 VSCode 主题变量 */
  background-color: var(--editor-background);
  color: var(--editor-foreground);
}

.project-view-tree {
  width: 200px;
  min-width: 150px;
  border-right: 1px solid var(--sideBar-border);
  overflow-y: auto;
  padding: 8px;
}

.project-view-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.project-view-path {
  padding: 8px 12px;
  border-bottom: 1px solid var(--sideBar-border, #3d3d3d);
  /* 使用 VSCode 主题变量 */
  background-color: var(--sideBar-background, #2d2d2d);
}

.project-view-filter {
  padding: 8px 12px;
  border-bottom: 1px solid var(--sideBar-border, #3d3d3d);
  display: flex;
  align-items: center;
  /* 使用 VSCode 主题变量 */
  background-color: var(--sideBar-background, #2d2d2d);
}

.project-view-filelist {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  align-content: start;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  /* 使用 VSCode 主题变量 */
  background-color: var(--sideBar-background, #2d2d2d);
  border: 1px solid transparent;
}

.file-item:hover {
  /* 使用 VSCode 主题变量 */
  background-color: var(--list-hoverBackground, #2d2d2d);
  border-color: var(--sideBar-border, #3d3d3d);
}

.file-item-selected {
  /* 使用 VSCode 主题变量 */
  background-color: var(--list-activeSelectionBackground, #3d3d3d);
  border-color: var(--button-background, #007acc);
}

.file-item-dragging {
  opacity: 0.5;
  cursor: move;
}

.file-item-drag-over {
  background-color: var(--list-activeSelectionBackground, #1e3a5f) !important;
  border-color: var(--button-background, #007acc) !important;
  border-style: dashed !important;
}

.file-list-drag-over {
  background-color: var(--list-hoverBackground, #2a2a2a);
  border: 2px dashed var(--button-background, #007acc);
}

.file-item-icon {
  margin-bottom: 4px;
}

.file-item-label {
  font-size: 12px;
  text-align: center;
  word-break: break-all;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  /* 使用 VSCode 主题变量 */
  color: var(--editor-foreground, #cccccc);
}

.project-view-filepath {
  padding: 4px 12px;
  font-size: 12px;
  border-top: 1px solid var(--sideBar-border, #3d3d3d);
  /* 使用 VSCode 主题变量 */
  background-color: var(--sideBar-background, #2d2d2d);
  color: var(--sideBarSectionHeader-foreground, #666666);
}

.tree-node {
  display: flex;
  align-items: center;
  flex: 1;
}

.tree-node-drag-over {
  background-color: var(--list-activeSelectionBackground, #1e3a5f) !important;
  border-radius: 4px;
  padding: 2px 4px;
}

/* 树形组件样式已移至全局主题 global-theme.css */

/* Element Plus Breadcrumb 样式覆盖 */
:deep(.el-breadcrumb) {
  font-size: 12px;
}

:deep(.el-breadcrumb__inner) {
  color: var(--editor-foreground, #cccccc);
}

:deep(.el-breadcrumb__inner:hover) {
  color: var(--button-background, #007acc);
}
</style>

