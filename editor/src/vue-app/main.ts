/**
 * Vue 应用入口
 */
import { createApp } from 'vue';
import App from './App.vue';
import { pinia } from './pinia';

// 配置 Iconify 完全离线模式
// 预加载图标集，完全禁用 API 请求，避免网络连接失败
import { configureOfflineMode, loadIconSets } from './configs/iconify-offline';

// 配置完全离线模式（禁用所有 API 请求）
configureOfflineMode();

// 预加载常用的图标集（异步加载，不阻塞应用启动）
loadIconSets().catch((error) => {
  console.error('[Iconify] 预加载图标集失败:', error);
});

// 引入设计系统样式
import './styles/design-system.css';
// 引入全局主题样式
import './styles/global-theme.css';
// 引入 Element Plus 样式
import 'element-plus/dist/index.css';
// 引入 Element Plus 主题定制样式
import './styles/element-plus-theme.css';

// 注册 Vue 版本的 objectview 组件
import { registerObjectViewComponents } from './objectview/registerComponents';
registerObjectViewComponents();

// 创建 Vue 应用
const app = createApp(App);

// 使用已创建的 Pinia 实例
// 这会将 Pinia 激活，使得 useEditorStore() 可以在 EditorData 中使用
app.use(pinia);

// 挂载到 DOM
app.mount('#vue-app');

// 初始化主题
// 主题加载顺序：
// 1. 首先尝试加载保存的 VSCode 主题（editor-vscode-theme）
// 2. 如果没有，则使用经典主题设置（editor-theme）
import { useThemeStore } from './stores/themeStore';
import { ThemeService } from '../themes';

setTimeout(async () => {
  try {
    // 等待主题列表初始化完成
    await ThemeService.getInstance().waitForInitialization();

    // 优先加载保存的 VSCode 主题
    const savedVscodeThemeId = localStorage.getItem('editor-vscode-theme');
    if (savedVscodeThemeId) {
      await ThemeService.getInstance().loadAndApplyTheme(savedVscodeThemeId);
      // 同步经典主题状态
      const themeStore = useThemeStore();
      if (savedVscodeThemeId.includes('light')) {
        themeStore.currentTheme = 'light';
      } else {
        themeStore.currentTheme = 'dark';
      }
    } else {
      // 如果没有保存的 VSCode 主题，使用经典主题设置
      const themeStore = useThemeStore();
      await themeStore.applyTheme(themeStore.currentTheme);
    }
  } catch (error) {
    console.error('Failed to initialize theme:', error);
  }
}, 100); // 延迟加载以确保DOM已准备就绪

// 初始化国际化 Store
import { useI18nStore } from './stores/i18nStore';
const i18nStore = useI18nStore();
i18nStore.initialize();

// 导出 pinia 实例，确保在需要时可以访问
export { pinia };
