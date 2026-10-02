<template>
  <div class="host-view">
    <div class="host-toolbar">
      <el-button size="small" text :loading="loading" @click="refresh">刷新</el-button>
      <el-button size="small" text :disabled="!isOpen" :loading="building" @click="runBuild">
        构建（npm run build）
      </el-button>
      <span class="host-note">{{ note }}</span>
    </div>

    <div class="host-info">
      <b>项目根</b>：{{ root ?? '（未打开项目——用 --project &lt;目录&gt; 启动宿主）' }}
    </div>

    <div class="host-columns">
      <div class="host-files">
        <div class="host-new">
          <el-input v-model="newFileName" size="small" placeholder="新文件名（如 note.txt）"
            @keyup.enter="createFile" />
          <el-button size="small" text @click="createFile">新建</el-button>
        </div>

        <div class="host-section-title host-crumbs">
          <!-- 在子目录里时**每一段都可点**（包括"项目根"）——"回到根"是最常用的动作，
               把它做成不可点的装饰等于没有回头路；只有确实在根目录时才显示为纯文本 -->
          <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
            <a v-if="index > 0 || breadcrumbs.length > 1" class="host-crumb" @click="openDir(crumb.path)">
              {{ crumb.label }}
            </a>
            <span v-else class="host-crumb-root">{{ crumb.label }}</span>
            <span v-if="index < breadcrumbs.length - 1" class="host-sep">/</span>
          </template>
        </div>
        <div v-for="entry in entries" :key="entry.path" class="host-file"
          :class="{ 'host-file-dir': entry.directory }"
          :title="entry.path"
          @click="entry.directory ? openDir(entry.path) : undefined">
          {{ entry.directory ? '📁' : '📄' }} {{ entry.name }}
        </div>
        <div v-if="entries.length === 0" class="host-empty">（空）</div>
      </div>

      <div class="host-output">
        <div class="host-section-title">构建输出</div>
        <div v-for="(line, index) in output" :key="index" class="host-line">{{ line }}</div>
        <div v-if="output.length === 0" class="host-empty">（还没跑过构建）</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHostPanel } from './HostView';

const { root, isOpen, entries, breadcrumbs, output, loading, building, note, newFileName, refresh, openDir,
  runBuild, createFile } = useHostPanel();

// 挂载即读一次：面板是插槽驱动的，卸载/重挂都会走到这里（与其它面板一致）
void refresh();
</script>

<style scoped>
.host-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px;
  font-size: 12px;
  color: var(--vscode-foreground, #ccc);
  overflow: hidden;
}

.host-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.host-note {
  opacity: 0.7;
}

.host-info {
  margin-bottom: 8px;
  word-break: break-all;
}

.host-columns {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.host-files,
.host-output {
  flex: 1;
  min-width: 0;
  overflow: auto;
  border: 1px solid var(--vscode-panel-border, #333);
  border-radius: 4px;
  padding: 6px;
}

.host-section-title {
  font-weight: 600;
  margin-bottom: 4px;
  opacity: 0.8;
}

.host-crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
}

.host-new {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.host-crumb {
  color: var(--vscode-textLink-foreground, #3794ff);
  cursor: pointer;
}

.host-crumb:hover {
  text-decoration: underline;
}

.host-crumb-root {
  opacity: 0.8;
}

.host-sep {
  opacity: 0.5;
}

.host-file-dir {
  cursor: pointer;
}

.host-file-dir:hover {
  text-decoration: underline;
}

.host-file,
.host-line {
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  line-height: 1.5;
}

.host-empty {
  opacity: 0.5;
}
</style>
