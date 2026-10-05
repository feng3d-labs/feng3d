<template>
  <div id="vue-app-container">
    <!-- Vue 应用占位内容，后续会逐步迁移组件到这里 -->
    <!-- 当前阶段：仅作为占位，确保 Vue 应用可以正常挂载 -->
    
    <!-- Menu 组件：显示右键菜单 -->
    <Menu />
    
    <!-- PopupView 容器：用于显示弹出窗口 -->
    <div ref="popupContainerRef" id="popup-container"></div>
    
    <!-- 主布局容器 -->
    <!-- 当前阶段：占位，后续会逐步迁移视图到这里 -->
    <MainLayout />
   
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, onMounted } from 'vue';
import Menu from './components/Menu.vue';
import { popupView } from './components/PopupView';
import { Editor } from '../Editor';
import { installEditorResourceSystem } from '../assets/EditorRS';

// 使用异步组件加载，避免热更新问题
const MainLayout = defineAsyncComponent(() => import('./layouts/MainLayout.vue'));

// PopupView 容器引用
const popupContainerRef = ref<HTMLElement | null>(null);

onMounted(() => {
  // 初始化 PopupView 容器
  if (popupContainerRef.value) {
    popupView.init(popupContainerRef.value);
  }
  
  // 初始化编辑器（启动项目）
  // Editor 构造函数会自动调用 onAddedToStage()，执行项目初始化流程
  // 包括：初始化资源系统、加载场景、设置 gameScene 等
  // 使用全局变量跟踪 Editor 实例，避免在不可扩展的 window.editor 上添加属性
  if (!(window as any).__editorInstance) {
    // **装配点**（#278 阶段 4b）：拿装配函数的**返回值**，而不是 import 单例——
    // 于是"谁在用资源系统"有据可查（单例普查的引用数会跟着降）。
    // 幂等：`main.ts` 已经装过一次，这里再调不会换掉 `FS.fs`。
    const editorInstance = new Editor(installEditorResourceSystem());
    // 保存实例引用到全局变量，避免重复初始化
    (window as any).__editorInstance = editorInstance;
    console.log('Editor: 项目初始化已启动');
  } else {
    console.log('Editor: 项目已初始化，跳过重复初始化');
  }
});

</script>

<style scoped>
#vue-app-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden; /* 防止内容溢出 */
}

/* 布局组件需要 pointer-events: auto 才能交互 */
#vue-app-container :deep(.split-panel),
#vue-app-container :deep(.tab-panel),
#vue-app-container :deep(.main-layout) {
  pointer-events: auto;
}

#popup-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}
</style>

<!-- 全局样式：确保 #vue-app 元素正确显示 -->
<style>
#vue-app {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
}
</style>

