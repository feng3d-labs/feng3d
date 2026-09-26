<template>
  <el-dialog
    v-model="visible"
    :title="t('toolbar.settings')"
    width="600px"
    :close-on-click-modal="false"
    @close="onClose"
  >
    <div class="settings-content">
      <!-- 主题设置 -->
      <div class="settings-section">
        <h3 class="settings-section-title">{{ t('settings.appearance') }}</h3>
        
        <!-- 新主题选择 -->
        <div class="settings-item">
          <label class="settings-label">{{ t('settings.theme') }}</label>
          <el-select
            :model-value="selectedThemeId"
            @update:model-value="onThemeChange"
            class="settings-select-full"
            popper-class="settings-dropdown"
            placeholder="Select a theme"
          >
            <el-option
              v-for="theme in availableThemes"
              :key="theme.id"
              :label="theme.name"
              :value="theme.id"
            />
          </el-select>
        </div>
        
        <!-- 传统主题选择（保留原有功能） -->
        <div class="settings-item">
          <label class="settings-label">{{ t('settings.classicTheme') }}</label>
          <div class="classic-theme-buttons">
            <el-button
              :class="{ 'is-active': classicTheme === 'dark' }"
              @click="onClassicThemeChange('dark')"
            >
              <Icon icon="mdi:weather-night" :size="16" style="margin-right: 4px;" />
              {{ t('settings.dark') }}
            </el-button>
            <el-button
              :class="{ 'is-active': classicTheme === 'light' }"
              @click="onClassicThemeChange('light')"
            >
              <Icon icon="mdi:weather-sunny" :size="16" style="margin-right: 4px;" />
              {{ t('settings.light') }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 语言设置 -->
      <div class="settings-section">
        <h3 class="settings-section-title">{{ t('settings.language') }}</h3>
        <div class="settings-item">
          <label class="settings-label">{{ t('settings.language') }}</label>
          <el-select
            :model-value="currentLanguage"
            @update:model-value="onLanguageChange"
            class="settings-select"
            popper-class="settings-dropdown"
          >
            <el-option
              :label="t('settings.languageZhCN')"
              value="zh_CN"
            />
            <el-option
              :label="t('settings.languageEnUS')"
              value="en_US"
            />
          </el-select>
        </div>
      </div>

      <!-- AI 桥接 -->
      <div class="settings-section">
        <h3 class="settings-section-title">{{ t('settings.aiBridge') }}</h3>

        <div class="settings-item settings-item-column">
          <div class="settings-switch-head">
            <label class="settings-label">{{ t('settings.aiWrite') }}</label>
            <el-switch
              :model-value="aiWriteEnabled"
              @update:model-value="onAiWriteChange"
            />
          </div>
          <div class="settings-hint">{{ t('settings.aiWriteHint') }}</div>
        </div>
      </div>

      <!-- 插件（issue #169）：关了哪个插件、为什么某个面板不见了，都在这里看 -->
      <div class="settings-section">
        <h3 class="settings-section-title">{{ t('settings.plugins') }}</h3>

        <div
          v-for="plugin in plugins"
          :key="plugin.manifest.id"
          class="settings-item settings-item-column"
          data-test="plugin-row"
        >
          <div class="settings-switch-head">
            <label class="settings-label settings-plugin-name">
              {{ plugin.manifest.name }}
              <span class="settings-plugin-id">{{ plugin.manifest.id }}</span>
            </label>
            <el-switch
              :model-value="plugin.enabled"
              :disabled="plugin.required"
              :data-test="`plugin-switch-${plugin.manifest.id}`"
              @update:model-value="(value) => onPluginToggle(plugin.manifest.id, value)"
            />
          </div>
          <div class="settings-hint">
            {{ plugin.manifest.description }}
            <template v-if="plugin.required">（必需插件，不可关闭）</template>
            <template v-else-if="plugin.userSwitch">
              （已由你设为{{ plugin.enabled ? '启用' : '禁用' }}，
              <a href="#" @click.prevent="onPluginReset(plugin.manifest.id)">恢复默认</a>）
            </template>
            <template v-else-if="!plugin.defaultEnabled">（清单默认关闭）</template>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onClose">{{ t('common.close') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useThemeStore, type ThemeType } from '../stores/themeStore';
import { useI18n, type Language } from '../composables/useI18n';
import Icon from './Icon.vue';
import { ThemeService, type ThemeInfo } from '../../themes';
import { isWriteEnabled, setWriteEnabled } from '../../bridge/write/writeCore';
import { usePluginSettings } from '../composables/usePluginSettings';

const props = withDefaults(defineProps<{
  modelValue?: boolean;
}>(), {
  modelValue: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const themeStore = useThemeStore();
const { t, language, setLanguage } = useI18n();

// 对话框显示状态
const visible = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
    // 对话框打开时，同步当前主题ID与写通道开关
    if (value) {
      syncCurrentThemeId();
      syncAiWriteEnabled();
    }
  },
});

// 同步当前主题ID
function syncCurrentThemeId() {
  const currentThemeId = themeService.getCurrentThemeId();
  if (currentThemeId) {
    selectedThemeId.value = currentThemeId;
  } else {
    // 如果没有保存的 VSCode 主题，根据经典主题设置
    selectedThemeId.value = currentTheme.value === 'dark' ? 'dark_modern' : 'light_modern';
  }
}

// 当前主题
const currentTheme = computed(() => themeStore.currentTheme);

// 当前语言
const currentLanguage = computed(() => language.value);

// 主题服务
const themeService = ThemeService.getInstance();

// 可用主题列表
const availableThemes = ref<ThemeInfo[]>([]);

// 当前选中的主题ID
const selectedThemeId = ref<string>('');

// AI 写通道开关（默认开启；判断的优先级见 bridge/write/writeCore.ts 的 isWriteEnabled）
const aiWriteEnabled = ref(isWriteEnabled());

// 经典主题（保留原有功能）
// 只有当选中的主题ID正好是 dark_modern 或 light_modern 时才返回对应值
const classicTheme = computed<ThemeType | undefined>(() => {
  if (selectedThemeId.value === 'dark_modern') {
    return 'dark';
  }
  if (selectedThemeId.value === 'light_modern') {
    return 'light';
  }
  return undefined;
});

// 在组件挂载时加载主题信息
onMounted(async () => {
  // 等待主题列表加载完成
  // 由于initThemes是异步的，我们等待一会儿确保主题加载完成
  await new Promise(resolve => setTimeout(resolve, 100));
  
  availableThemes.value = themeService.getThemes();
  
  // 设置当前主题ID
  const currentThemeId = themeService.getCurrentThemeId();
  if (currentThemeId) {
    selectedThemeId.value = currentThemeId;
  } else {
    // 如果没有加载过特定主题，则根据当前经典主题设置默认值
    selectedThemeId.value = currentTheme.value === 'dark' ? 'dark_modern' : 'light_modern';
  }
});

// 主题变化处理（新的主题系统）
async function onThemeChange(themeId: string) {
  try {
    await themeService.loadAndApplyTheme(themeId);
    selectedThemeId.value = themeId;
    
    // 保存主题ID到本地存储
    localStorage.setItem('editor-vscode-theme', themeId);
  } catch (error) {
    console.error('Failed to apply theme:', error);
  }
}

// 经典主题与 VSCode 主题的映射
const CLASSIC_THEME_MAP: Record<ThemeType, string> = {
  dark: 'dark_modern',
  light: 'light_modern'
};

// 经典主题变化处理（保留原有功能）
async function onClassicThemeChange(theme: ThemeType) {
  await themeStore.setTheme(theme);

  // 同步更新下拉列表中显示的主题ID
  selectedThemeId.value = CLASSIC_THEME_MAP[theme];
}

// 语言变化处理
function onLanguageChange(lang: Language) {
  setLanguage(lang);
}

// 同步写通道开关（打开对话框时调一次：状态可能被 URL 参数强制、或被另一个标签页改过）
function syncAiWriteEnabled() {
  aiWriteEnabled.value = isWriteEnabled();
}

// 切换写通道
function onAiWriteChange(value: boolean | string | number) {
  setWriteEnabled(value === true);
  // 回读一次而不是直接用 value：URL ?bridge=write / ?bridge=read 会强制覆盖本地设置
  aiWriteEnabled.value = isWriteEnabled();
}

// 插件启用状态（issue #169）。列表与开关都在 composable 里，这里只转发用户操作：
// 开关不做乐观更新——必需插件会被注册表拒绝，回读实际状态才不会出现"看起来开了其实没开"
const { plugins, enable: onPluginToggle, reset: onPluginReset } = usePluginSettings();

// 关闭对话框
function onClose() {
  visible.value = false;
}
</script>

<style scoped>
.settings-content {
  padding: 8px 0;
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--editor-foreground);
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--panel-border);
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.settings-item:not(:last-child) {
  margin-bottom: 8px;
}

.settings-label {
  font-size: 13px;
  color: var(--foreground);
  flex-shrink: 0;
  margin-right: 16px;
  min-width: 120px;
}

.settings-radio-group {
  flex: 1;
  display: flex;
  gap: 8px;
}

/* AI 桥接：说明文字另起一行，窄对话框里也放得下 */
.settings-item-column {
  flex-direction: column;
  align-items: stretch;
}

.settings-switch-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.settings-hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--foreground);
  opacity: 0.7;
  margin-top: 4px;
}

/* 插件行：名字给足空间，id 用小字跟在后面（id 是查问题时要复制的东西） */
.settings-plugin-name {
  min-width: 0;
  flex: 1;
}

.settings-plugin-id {
  font-size: 11px;
  opacity: 0.6;
  margin-left: 6px;
  word-break: break-all;
}

.settings-hint a {
  color: var(--button-background);
  text-decoration: underline;
}

.settings-radio-group :deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
}

.classic-theme-buttons {
  flex: 1;
  display: flex;
  gap: 8px;
}

/* 经典主题按钮样式 - 使用 VSCode 主题颜色 */
.classic-theme-buttons .el-button {
  background-color: var(--sideBar-background);
  border-color: var(--sideBar-border);
  color: var(--editor-foreground);
}

.classic-theme-buttons .el-button:hover {
  background-color: var(--list-hoverBackground);
  border-color: var(--activityBar-inactiveForeground);
}

/* 选中状态 - 使用主题色 */
.classic-theme-buttons .el-button.is-active {
  background-color: var(--button-background);
  border-color: var(--button-background);
  color: var(--button-foreground);
}

.classic-theme-buttons .el-button.is-active:hover {
  background-color: var(--button-hoverBackground);
  border-color: var(--button-hoverBackground);
}

.settings-select {
  flex: 1;
  max-width: 200px;
}

.settings-select {
  flex: 1;
  max-width: 200px;
}

.settings-select-full {
  flex: 1;
  max-width: 100%;
}

/* 确保下拉框输入框使用正确的背景色 */
/* Element Plus select 使用 .el-select__wrapper 而不是 .el-input__wrapper */
.settings-select-full :deep(.el-select__wrapper) {
  background-color: var(--input-background) !important;
  border: 1px solid var(--input-border) !important;
  box-shadow: none !important;
}

.settings-select :deep(.el-select__wrapper) {
  background-color: var(--input-background) !important;
  border: 1px solid var(--input-border) !important;
  box-shadow: none !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
