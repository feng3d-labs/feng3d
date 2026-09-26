import type { EditorPluginManifest } from './types';

/**
 * 内置插件清单。
 *
 * 「内置」的含义只是**跟着编辑器一起发**，清单形态与外部插件完全一致——
 * 等 issue #169 做启用/禁用、#171 做版本契约时，"内置"与"外装"在机制上不需要任何区别。
 *
 * 视图一律用 `() => import('...')` 动态导入：清单纯数据、视图按需加载
 * （编辑器启动时不必把所有面板的视图都拉起来）。
 */

/**
 * 核心面板：层级 / 场景 / 项目 / 控制台 / 检查器。
 *
 * 落位与面板拆分原样保留改造前的 `MainLayout.vue` 默认布局
 * （层级独占左栏、场景在右侧、项目+控制台在下、检查器在右栏）。
 */
export const CORE_PANELS_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-core-panels',
    name: '核心面板',
    description: '层级 / 场景 / 项目 / 控制台 / 检查器，编辑器的主界面面板',
    contributes: {
        panels: [
            {
                id: 'hierarchy',
                labelKey: 'panels.hierarchy',
                view: () => import('../vue-app/views/HierarchyView.vue'),
                placement: 'hierarchy',
                order: 0,
            },
            {
                id: 'scene',
                labelKey: 'panels.scene',
                view: () => import('../vue-app/views/SceneView.vue'),
                placement: 'main',
                order: 0,
            },
            {
                id: 'project',
                labelKey: 'panels.project',
                view: () => import('../vue-app/views/ProjectView.vue'),
                placement: 'project',
                order: 0,
            },
            {
                id: 'console',
                labelKey: 'panels.console',
                view: () => import('../vue-app/views/ConsoleView.vue'),
                placement: 'project',
                order: 1,
            },
            {
                id: 'inspector',
                labelKey: 'panels.inspector',
                view: () => import('../vue-app/views/InspectorView.vue'),
                placement: 'bottom',
                order: 0,
            },
        ],
    },
};

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

/** 随编辑器一起发布的内置插件 */
export const BUILTIN_PLUGINS: readonly EditorPluginManifest[] = [CORE_PANELS_PLUGIN, PARTICLE_PLUGIN];
