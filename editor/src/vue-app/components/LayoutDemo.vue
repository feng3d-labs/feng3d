<template>
  <div class="layout-demo">
    <h2>布局组件演示</h2>
    
    <!-- SplitPanel 演示 -->
    <div class="demo-section">
      <h3>SplitPanel 演示</h3>
      <SplitPanel
        v-model:split="splitValue"
        direction="horizontal"
        :min-size="100"
        style="height: 300px; border: 1px solid #ccc;"
      >
        <template #first>
          <div style="padding: 20px; background-color: #f0f0f0;">
            <h4>左侧面板</h4>
            <p>这是左侧面板的内容</p>
            <p>可以拖拽中间的分割条来调整大小</p>
          </div>
        </template>
        <template #second>
          <div style="padding: 20px; background-color: #e0e0e0;">
            <h4>右侧面板</h4>
            <p>这是右侧面板的内容</p>
            <p>当前分割比例: {{ (splitValue * 100).toFixed(1) }}%</p>
          </div>
        </template>
      </SplitPanel>
    </div>

    <!-- TabPanel 演示 -->
    <div class="demo-section">
      <h3>TabPanel 演示</h3>
      <TabPanel
        :tabs="tabs"
        :default-active-index="0"
        @tab-change="onTabChange"
        @tab-close="onTabClose"
        style="height: 300px; border: 1px solid #ccc;"
      >
        <template #tab-tab1>
          <div style="padding: 20px;">
            <h4>标签页 1</h4>
            <p>这是第一个标签页的内容</p>
          </div>
        </template>
        <template #tab-tab2>
          <div style="padding: 20px;">
            <h4>标签页 2</h4>
            <p>这是第二个标签页的内容</p>
          </div>
        </template>
        <template #tab-tab3>
          <div style="padding: 20px;">
            <h4>标签页 3</h4>
            <p>这是第三个标签页的内容</p>
          </div>
        </template>
      </TabPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SplitPanel from './SplitPanel.vue';
import TabPanel from './TabPanel.vue';
import type { Tab } from './TabPanel.types';

const splitValue = ref(0.5);

const tabs = ref<Tab[]>([
  { id: 'tab1', label: '标签页 1' },
  { id: 'tab2', label: '标签页 2' },
  { id: 'tab3', label: '标签页 3' },
]);

function onTabChange(index: number) {
  console.log('切换到标签页:', index);
}

function onTabClose(index: number) {
  console.log('关闭标签页:', index);
  tabs.value.splice(index, 1);
}
</script>

<style scoped>
.layout-demo {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 1000px;
  max-height: 80vh;
  overflow-y: auto;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  pointer-events: auto;
}

.demo-section {
  margin-bottom: 30px;
}

.demo-section h3 {
  margin-bottom: 10px;
  color: #333;
}

h2 {
  margin-top: 0;
  color: #333;
}
</style>

