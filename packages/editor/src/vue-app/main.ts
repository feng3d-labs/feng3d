/**
 * Vue 应用入口
 */
import { createApp } from 'vue';
import App from './App.vue';
import { pinia } from './pinia';
import { enableErrorDecoding } from 'feng3d';

// 编辑器是 dev 场景：打开错误解码，降级信息会带完整上下文（issue #94）
enableErrorDecoding();

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
// 引入属性面板的布局覆盖层（字段行自适应 / 悬停提示定位）
import './styles/object-view.css';

// 注册 Vue 版本的 objectview 组件
import { registerObjectViewComponents } from './objectview/registerComponents';
registerObjectViewComponents();

// 安装内置插件：主界面面板与场景浮层都来自插件清单（见 src/plugins/）。
// 显式安装而不是模块级副作用——"有哪些功能"由清单决定，门禁见 issue #170
import { installBuiltinPlugins, loadUserPatch } from '../plugins';
import { installEditorResourceSystem, pickBaseFS } from '../assets/EditorRS';
import { editorRSKey } from './composables/useEditorRS';
import { menusKey } from './composables/useMenus';
import { MenuConfig } from '../configs/CommonConfig';
import { assetManagerKey } from './composables/useEditorAssets';
import { EditorAsset } from '../ui/assets/EditorAsset';
installBuiltinPlugins();

// **显式装配资源系统**（#278 阶段 4a）：原来是 `EditorRS.ts` 的模块顶层副作用
//（`FS.fs = …` 与 `ReadRS.rs = …`），现在由入口调用——门禁
//（`editor-singleton-survey.mjs` 的"`editorRS` 不许出现在模块顶层"）会拦住"又写回去"。
// 必须在下面的 `pickBaseFS()` **之前**：读写包装先就位，再按宿主能力选 `FS.basefs`。
// **装配并留住返回值**：Vue 侧通过注入拿它（`useEditorRS()`），而不是各自 import 单例
const resourceSystem = installEditorResourceSystem();

// 项目形态（#274）：**宿主开着项目就用它的磁盘目录当文件系统**，否则保持原来的（indexedDB）。
// 位置有讲究：必须在**任何资源读取之前**——所以放在这里（模块顶层 await，早于 mount 与主题初始化）。
// 探测失败是正常态（静态部署），静默保持原样；见 docs/MIGRATE_TO_HOST_FS.md。
if (await pickBaseFS()) console.info('[editor] 项目来自宿主（磁盘目录）');

// 安装插槽（#276 S2b）：声明核心界面座位，并把**启用的清单投影进座位**。
// 顺序有讲究：必须在 installBuiltinPlugins() 之后（投影要读清单）、在 mount 之前（首帧就要有内容）。
// 之后插件开关 / 用户 patch 的变化会自动重投 → slots/changed → 界面重算（见 plugins/slots/install.ts）。
import { installEditorSlots } from '../plugins/slots';
installEditorSlots();

// 运行时装载（#276 任务 4）：宿主在响应 index.html 时注入入口图（`window.__EDITOR_BOOT__`），
// 这里读它并把插件包装进来 —— "不重新构建就装一个插件"由**宿主**驱动。
// **故意不 await**：装载要导入 client 半（网络往返），不该拖慢首帧；装好后会重投插槽、界面自动跟着变。
// 没有入口图是正常状态（没装任何插件的编辑器与以前完全一样）。
import { installPluginsFromBoot } from '../plugins/loader';
installPluginsFromBoot().catch((error) => {
  console.error('[plugins] 启动装载插件包时出错：', error);
});

// 用户覆盖层（issue #171）：本地、不入库的 editor.patch.json（`?patch=<url>` 可换地址）。
// **故意不 await**：它是可选的本地文件，读它（网络往返）不该拖慢启动；加载完会通知界面刷新。
// 读不到（404）是正常状态；文件存在但写坏了也不影响启动——错误进 getPatchState()，见 editor.plugins。
loadUserPatch().catch((error) => {
  console.error('[plugins] 加载用户 patch 时出错：', error);
});

// 字段标签的悬停提示：替代浏览器原生 title，保证提示不超出窗口（见 fieldTooltip.ts）
import { installFieldTooltip } from './objectview/utils/fieldTooltip';
installFieldTooltip();

// 创建 Vue 应用
const app = createApp(App);

// **资源系统走注入**（#278 阶段 4b）：组件用 `useEditorRS()` 取，不再各自 import 模块级单例——
// 于是"谁在用资源系统"可计量（单例普查的引用数）、也可替换（测试能塞假的）
app.provide(editorRSKey, resourceSystem);

// **资源管理器在这里创建**（#278"挪创建点"）：`EditorAsset` 原来在自己的模块顶层 `new` 自己，
// 那时"资源系统是谁"还不确定。挪到入口后，它与 `resourceSystem` 的先后关系一目了然。
// 它仍要 provide **同一个实例**（资产树 / 当前展开的文件夹都在它身上，两个实例就是两棵树）。
const assetManager = new EditorAsset(resourceSystem);

app.provide(assetManagerKey, assetManager);

// **菜单装配也走注入**（#278 路线 B 第一批）：创建从 `CommonConfig.ts` 的模块顶层挪到这里。
// `MenuConfig` 依赖另外三个单例、却**没被它们依赖**——是依赖环的外沿，先拆它最稳。
//（它同时要 `assetManager` 与 `resourceSystem`，所以放在这两者就绪之后。）
app.provide(menusKey, new MenuConfig(assetManager, resourceSystem));

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
