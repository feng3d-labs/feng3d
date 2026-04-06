<template>
  <div class="element-plus-example">
    <h2>Element Plus 使用示例</h2>

    <!-- 按钮示例 -->
    <div class="example-section">
      <h3>按钮</h3>
      <el-button>默认按钮</el-button>
      <el-button type="primary">主要按钮</el-button>
      <el-button type="success">成功按钮</el-button>
      <el-button type="info">信息按钮</el-button>
      <el-button type="warning">警告按钮</el-button>
      <el-button type="danger">危险按钮</el-button>
    </div>

    <!-- 输入框示例 -->
    <div class="example-section">
      <h3>输入框</h3>
      <el-input v-model="inputValue" placeholder="请输入内容" style="width: 200px" />
      <el-input v-model="inputValue" placeholder="带图标" clearable style="width: 200px">
        <template #prefix>
          <Icon icon="mdi:magnify" />
        </template>
      </el-input>
    </div>

    <!-- 选择器示例 -->
    <div class="example-section">
      <h3>选择器</h3>
      <el-select v-model="selectValue" placeholder="请选择" style="width: 200px">
        <el-option label="选项1" value="option1" />
        <el-option label="选项2" value="option2" />
        <el-option label="选项3" value="option3" />
      </el-select>
    </div>

    <!-- 图标示例 -->
    <div class="example-section">
      <h3>图标（@iconify/vue）</h3>
      <div class="icon-examples">
        <Icon icon="mdi:home" :size="24" />
        <Icon icon="material-symbols:settings" :size="24" />
        <Icon icon="vscode-icons:file-type-vue" :size="24" />
        <Icon icon="mdi:close" :size="24" color="#ff4444" />
        <Icon icon="mdi:check" :size="24" color="#44ff44" />
      </div>
    </div>

    <!-- 消息提示示例 -->
    <div class="example-section">
      <h3>消息提示</h3>
      <el-button @click="showMessage('success')">成功消息</el-button>
      <el-button @click="showMessage('warning')">警告消息</el-button>
      <el-button @click="showMessage('error')">错误消息</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import Icon from '../components/Icon.vue';

const inputValue = ref('');
const selectValue = ref('');

function showMessage(type: 'success' | 'warning' | 'error') {
  const messages = {
    success: '操作成功！',
    warning: '请注意！',
    error: '操作失败！',
  };
  ElMessage[type](messages[type]);
}
</script>

<style scoped>
.element-plus-example {
  padding: 20px;
  color: #cccccc;
}

.example-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #2d2d2d;
  border-radius: 4px;
}

.example-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #ffffff;
}

.icon-examples {
  display: flex;
  gap: 20px;
  align-items: center;
}

.el-button {
  margin-right: 10px;
}
</style>

