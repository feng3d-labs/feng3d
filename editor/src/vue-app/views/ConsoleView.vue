<template>
  <div class="console-view">
    <!-- 工具栏 -->
    <div class="console-toolbar">
      <el-button-group>
        <el-button size="small" text @click="clearLogs" :title="t('console.clearAll')">
          <Icon icon="mdi:delete-outline" :size="16" style="margin-right: 4px" />
          {{ t('console.clear') }}
        </el-button>
        <el-button size="small" text @click="toggleAutoScroll" :type="autoScroll ? 'primary' : 'default'"
          :title="t('console.autoScroll')">
          <Icon icon="mdi:arrow-down" :size="16" style="margin-right: 4px" />
          {{ t('console.autoScroll') }}
        </el-button>
      </el-button-group>

      <div class="console-filter">
        <el-checkbox v-model="showLog" size="small">{{ t('console.info') }}</el-checkbox>
        <el-checkbox v-model="showWarn" size="small">{{ t('console.warning') }}</el-checkbox>
        <el-checkbox v-model="showError" size="small">{{ t('console.error') }}</el-checkbox>
      </div>
    </div>

    <!-- 日志内容区域 -->
    <div ref="logContainerRef" class="console-content" @scroll="onScroll">
      <div v-for="(log, index) in filteredLogs" :key="index" :class="['console-log-item', `log-${log.type}`]">
        <span class="log-time">{{ formatTime(log.timestamp) }}</span>
        <span class="log-type">{{ log.type.toUpperCase() }}</span>
        <span class="log-message">{{ log.message }}</span>
        <div v-if="log.stack" class="log-stack">{{ log.stack }}</div>
      </div>
      <div v-if="filteredLogs.length === 0" class="console-empty">
        <p>{{ t('console.empty') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { serialization } from 'feng3d';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import Icon from '../components/Icon.vue';
import { useI18n } from '../composables/useI18n';

// 日志类型
type LogType = 'log' | 'warn' | 'error' | 'info';

// 日志项接口
interface LogItem
{
  type: LogType;
  message: string;
  timestamp: number;
  stack?: string;
}

const { t } = useI18n();

// 状态
const logs = ref<LogItem[]>([]);
const autoScroll = ref(true);
const showLog = ref(true);
const showWarn = ref(true);
const showError = ref(true);
const logContainerRef = ref<HTMLElement>();

// 过滤后的日志
const filteredLogs = computed(() =>
{
  return logs.value.filter(log =>
  {
    if (log.type === 'log' || log.type === 'info') return showLog.value;
    if (log.type === 'warn') return showWarn.value;
    if (log.type === 'error') return showError.value;
    return true;
  });
});

// 添加日志
function addLog(type: LogType, message: string, stack?: string)
{
  logs.value.push({
    type,
    message: String(message),
    timestamp: Date.now(),
    stack,
  });

  // 限制日志数量，避免内存溢出
  if (logs.value.length > 1000)
  {
    logs.value.shift();
  }

  // 自动滚动到底部
  if (autoScroll.value)
  {
    nextTick(() =>
    {
      scrollToBottom();
    });
  }
}

// 清空日志
function clearLogs()
{
  logs.value = [];
}

// 切换自动滚动
function toggleAutoScroll()
{
  autoScroll.value = !autoScroll.value;
  if (autoScroll.value)
  {
    scrollToBottom();
  }
}

// 滚动到底部
function scrollToBottom()
{
  if (logContainerRef.value)
  {
    logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
  }
}

// 滚动事件处理
function onScroll()
{
  if (!logContainerRef.value) return;

  const container = logContainerRef.value;
  const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;

  // 如果用户手动滚动到底部，恢复自动滚动
  if (isAtBottom && !autoScroll.value)
  {
    autoScroll.value = true;
  } else if (!isAtBottom && autoScroll.value)
  {
    // 如果用户向上滚动，暂停自动滚动
    autoScroll.value = false;
  }
}

// 格式化时间
function formatTime(timestamp: number): string
{
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// 安全地序列化对象，处理循环引用
function safeStringify(obj: any, indent = 2): string
{
  if (obj === null || obj === undefined) {
    return String(obj);
  }
  
  // 处理 Error 对象
  if (obj instanceof Error) {
    return `Error: ${obj.message}${obj.stack ? '\n' + obj.stack : ''}`;
  }
  
  // 处理基本类型
  if (typeof obj !== 'object') {
    return String(obj);
  }
  
  // 处理循环引用
  const seen = new WeakSet();
  
  try {
    return JSON.stringify(obj, (key, value) => {
      // 跳过函数和 undefined
      if (typeof value === 'function' || value === undefined) {
        return '[Function]';
      }
      
      // 检查循环引用
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      
      return value;
    }, indent);
  } catch (error) {
    // 如果 JSON.stringify 仍然失败，尝试使用 toString
    try {
      return String(obj);
    } catch {
      return '[Object]';
    }
  }
}

// 拦截 console 方法
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

// 重写 console 方法
function setupConsoleInterception()
{
  console.log = (...args: any[]) =>
  {
    originalConsole.log(...args);
    addLog('log', args.map(arg => safeStringify(arg)).join(' '));
  };

  console.warn = (...args: any[]) =>
  {
    originalConsole.warn(...args);
    addLog('warn', args.map(arg => safeStringify(arg)).join(' '));
  };

  console.error = (...args: any[]) =>
  {
    originalConsole.error(...args);
    const error = args.find(arg => arg instanceof Error);
    const stack = error ? error.stack : undefined;
    addLog('error', args.map(arg =>
      arg instanceof Error ? arg.message : safeStringify(arg)
    ).join(' '), stack);
  };

  console.info = (...args: any[]) =>
  {
    originalConsole.info(...args);
    addLog('info', args.map(arg => safeStringify(arg)).join(' '));
  };
}

// 恢复原始 console 方法
function restoreConsole()
{
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
}

// 监听日志变化，自动滚动
watch(filteredLogs, () =>
{
  if (autoScroll.value)
  {
    nextTick(() =>
    {
      scrollToBottom();
    });
  }
});

onMounted(() =>
{
  setupConsoleInterception();

  // 添加欢迎信息
  addLog('info', t('console.started'));
});

onUnmounted(() =>
{
  restoreConsole();
});
</script>

<style scoped>
.console-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  /* 使用 VSCode 主题变量 */
  background-color: var(--editor-background, #1e1e1e);
  color: var(--editor-foreground, #cccccc);
}

.console-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--panel-border, #3d3d3d);
  /* 使用 VSCode 主题变量 */
  background-color: var(--sideBar-background, #2d2d2d);
  gap: 12px;
}

.console-filter {
  display: flex;
  gap: 12px;
  align-items: center;
}

.console-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.console-log-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--panel-border, #252525);
  word-break: break-all;
}

.console-log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: var(--descriptionForeground, #666666);
  min-width: 100px;
  flex-shrink: 0;
}

.log-type {
  min-width: 50px;
  flex-shrink: 0;
  font-weight: bold;
}

.log-message {
  flex: 1;
  color: var(--editor-foreground, #cccccc);
}

.log-stack {
  width: 100%;
  margin-top: 4px;
  padding-left: 158px;
  color: var(--descriptionForeground, #999999);
  font-size: 11px;
  white-space: pre-wrap;
}

/* 日志类型颜色 */
.log-log .log-type,
.log-info .log-type {
  color: var(--editor-foreground, #cccccc);
}

.log-warn .log-type {
  color: var(--el-color-warning);
}

.log-error .log-type {
  color: var(--el-color-danger);
}

.log-error .log-message {
  color: var(--el-color-danger);
}

.log-warn .log-message {
  color: var(--el-color-warning);
}

.console-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--descriptionForeground, #666666);
  font-style: italic;
}

/* 滚动条样式 */
.console-content::-webkit-scrollbar {
  width: 10px;
}

.console-content::-webkit-scrollbar-track {
  background: var(--editor-background, #1e1e1e);
}

.console-content::-webkit-scrollbar-thumb {
  background: var(--input-background, #3d3d3d);
  border-radius: 5px;
}

.console-content::-webkit-scrollbar-thumb:hover {
  background: var(--editor-selectionForeground, #4d4d4d);
}
</style>
