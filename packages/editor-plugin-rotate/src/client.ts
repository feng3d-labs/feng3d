import { toViewComponent } from 'feng3d-editor/client';
import { ROTATE_API_VERSION, ROTATE_PLUGIN_ID } from './shared';
import type { EditorPluginManifest } from 'feng3d-editor/client';

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
export const ROTATE_PLUGIN: EditorPluginManifest = {
    id: ROTATE_PLUGIN_ID,
    name: '旋转（三端样板）',
    description: '演示插件三端形态：界面端贡献面板、游戏端注册同一个 __type__ 的行为',
    apiVersion: ROTATE_API_VERSION,
    contributes: {
        panels: [
            {
                id: 'rotate.panel',
                labelKey: 'panels.rotate',
                slot: 'panel.main',
                order: 50,
                icon: 'mdi:rotate-right',
                view: toViewComponent(() => import('./panel')),
            },
        ],
    },
};
