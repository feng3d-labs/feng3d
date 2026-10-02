import { RotateLogic } from './runtime';
import { ROTATE_API_VERSION, ROTATE_PLUGIN_ID, ROTATE_TYPE } from './shared';
import type { EditorPluginManifest, PanelViewLoader } from 'feng3d-editor/client';

/**
 * 界面端（Web 半）—— 包入口 `"./client"`。
 *
 * 这一端给编辑器用：声明"我贡献什么界面"（这里是往 `panel.main` 座位加一个标签页）。
 *
 * ## 为什么清单是纯数据、视图是 loader
 *
 * 清单保持纯数据（`view` 是 `() => import(...)`，不是组件本身）：
 * 单元测试不必编译 Vue 单文件组件，编辑器启动也不必把所有面板的视图都拉起来。
 * 这与 `feng3d-editor/client` 的 `PanelViewLoader` 契约一致。
 *
 * 界面端**允许**依赖 Vue（它就是画界面的）；`./runtime` 端则禁止——
 * 两端边界不同，见 `scripts/check-runtime-half-deps.mjs`。
 */

/**
 * 本插件的清单（界面端装载器读它）。
 *
 * `slot` 用**座位名**（正式写法）：`'panel.main'` 是主标签区；
 * 落位缩写 `placement: 'main'` 是等价糖，新插件不必再用。
 */
/**
 * 面板视图的 loader（**纯动态导入**，不依赖编辑器的运行期 API）。
 *
 * 为什么不用 `toViewComponent()` 包装：那个函数来自 `feng3d-editor/client`，用了它这个
 * client 半就**必须**在运行期解析到编辑器包——而插件包是**独立打包**的（第三方构建），
 * 浏览器原生 ESM 解析不了裸包名（#276 阶段 4/收尾阶段的实测教训）。
 * 契约本身只要"返回模块的 Promise"（`PanelViewLoader`），所以直接写 loader 最省事：
 * 类型走 `import type`（打包时被擦除），运行期只依赖 `./panel`。
 */
export const rotatePanelView: PanelViewLoader = () => import('./panel');

export const ROTATE_PLUGIN: EditorPluginManifest = {
    id: ROTATE_PLUGIN_ID,
    name: '旋转（三端样板）',
    description: '演示插件三端形态：界面端贡献面板、游戏端注册同一个 __type__ 的行为',
    apiVersion: ROTATE_API_VERSION,
    contributes: {
        // **同一个 `__type__` 在两端各注册一次**（#276 验收③"两端都有行为"）：
        // 这一份给编辑器（它读清单），`./runtime` 那一份给游戏端（构建期打入产物）。
        // 编辑格式 = 运行格式——场景里存下来的 `{ __type__: 'Rotate' }` 两边都能跑。
        logics: [{ name: ROTATE_TYPE, logic: RotateLogic }],
        panels: [
            {
                id: 'rotate.panel',
                labelKey: 'panels.rotate',
                slot: 'panel.main',
                order: 50,
                icon: 'mdi:rotate-right',
                view: rotatePanelView,
            },
        ],
    },
};

/**
 * 装载器读的清单（**client 半的约定导出名**，见 `packages/editor/src/plugins/loader/loader.ts`）。
 *
 * 运行时装载按 `import('<包名>/client')` 取模块，读这里的 `manifest`（也接受默认导出）。
 * 保留 `ROTATE_PLUGIN` 这个具名导出是为了让"谁在贡献什么"在源码里一眼可读。
 */
export const manifest = ROTATE_PLUGIN;
