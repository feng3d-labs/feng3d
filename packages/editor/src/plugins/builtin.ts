import type { EditorPluginManifest } from './types';
import { LOGIC_PLUGINS } from './builtinLogics';
import { OBJECT_VIEW_PLUGIN } from './builtinObjectView';
import { PANEL_PLUGINS } from './builtinPanels';

/**
 * 内置插件清单。
 *
 * 「内置」的含义只是**跟着编辑器一起发**，清单形态与外部插件完全一致——
 * 启用/禁用（issue #169）与版本契约（#171）对内置与外装一视同仁。
 *
 * 视图一律用 `() => import('...')` 动态导入：清单纯数据、视图按需加载
 * （编辑器启动时不必把所有面板的视图都拉起来）。
 *
 * 面板部分在 `builtinPanels.ts`（一个面板一个插件，issue #180）。
 */

/**
 * 粒子效果：场景视图上的播放控制器。
 *
 * 改造前它是**硬编码在 `SceneView.vue` 模板里**的一行 `<ParticleEffectController />`——
 * 这正是"内核认识应用"的典型：场景视图不该知道粒子系统的存在。
 * 现在它是这个插件贡献的一个场景浮层（控制器自身在没有粒子系统时不渲染任何东西）。
 */
export const PARTICLE_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-particle',
    name: '粒子效果',
    description: '粒子系统的场景内播放控制（暂停 / 停止 / 速度 / 时间）',
    apiVersion: '^1.0.0',
    contributes: {
        sceneOverlays: [
            {
                id: 'particleEffectController',
                view: () => import('../vue-app/components/ParticleEffectController.vue'),
                order: 0,
            },
        ],
    },
};

/**
 * 随编辑器一起发布的内置插件。
 *
 * 五类贡献点（面板 / 浮层 / 属性控件映射 / Logic / 桥接方法）都在这里汇总——
 * 一处就能看全编辑器装了什么（运行时的同一份数据由 `editor.plugins` dump，见 issue #168）。
 */
export const BUILTIN_PLUGINS: readonly EditorPluginManifest[] = [
    ...PANEL_PLUGINS,
    PARTICLE_PLUGIN,
    OBJECT_VIEW_PLUGIN,
    ...LOGIC_PLUGINS,
];
