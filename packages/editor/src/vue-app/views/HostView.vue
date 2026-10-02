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
        <div class="host-section-title">项目文件</div>
        <div v-for="entry in entries" :key="entry.path" class="host-file">
          {{ entry.directory ? '📁' : '📄' }} {{ entry.path }}
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

const { root, isOpen, entries, output, loading, building, note, refresh, runBuild } = useHostPanel();

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
