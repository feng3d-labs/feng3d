import type { EditorPluginManifest } from './types';

/**
 * 内置插件清单：**主界面面板**（一个面板一个插件，issue #180）。
 *
 * ## 为什么拆开
 *
 * 拆分前五个面板挤在一个 `@feng3d/editor-plugin-core-panels` 里，于是 #169 的启用/禁用
 * 在最需要它的地方反而不成立：想关掉控制台，就得连层级树一起关掉。
 * 而"面板"恰恰是最直观的**功能单位**——一个插件应当对应一个用户可以独立取舍的功能。
 *
 * ## 落位与顺序保持拆分前不变
 *
 * | 面板 | 落位 | order |
 * |---|---|---|
 * | 层级 | `hierarchy`（左栏独占） | 0 |
 * | 场景 | `main`（右栏上方） | 0 |
 * | 资源管理器 | `project`（下方左） | 0 |
 * | 控制台 | `project`（下方右） | 1 |
 * | 属性面板 | `bottom`（右下） | 0 |
 *
 * `project` 落位上有两个面板，靠 `order` 定先后（资源管理器 0、控制台 1）——
 * 换插件不改变顺序，因为顺序是 `order` 决定的，不是插件登记顺序。
 *
 * ## 名字与视图
 *
 * 视图一律 `() => import('...')`（清单纯数据、视图按需加载）。
 * 面板的**显示名**（`labelKey`）仍由 i18n 决定，这里的 `name` 只是插件在设置面板里的名字。
 */

/** 层级面板：场景对象的树 */
export const HIERARCHY_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-hierarchy',
    name: '层级面板',
    description: '场景对象的层级树：选择 / 拖拽 / 右键菜单',
    apiVersion: '^1.0.0',
    contributes: {
        panels: [
            {
                id: 'hierarchy',
                labelKey: 'panels.hierarchy',
                view: () => import('../vue-app/views/HierarchyView.vue'),
                placement: 'hierarchy',
                order: 0,
            },
        ],
    },
};

/** 场景面板：3D 视口本身（工具栏、相机、浮层都托管在它里面） */
export const SCENE_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-scene',
    name: '场景面板',
    description: '3D 视口：渲染、相机导航工具栏、拖拽与拾取',
    apiVersion: '^1.0.0',
    contributes: {
        panels: [
            {
                id: 'scene',
                labelKey: 'panels.scene',
                view: () => import('../vue-app/views/SceneView.vue'),
                placement: 'main',
                order: 0,
            },
        ],
    },
};

/** 资源管理器：项目资源树与资源操作 */
export const PROJECT_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-project',
    name: '资源管理器',
    description: '项目资源树（Assets）：资源浏览 / 新建 / 导入导出',
    apiVersion: '^1.0.0',
    contributes: {
        panels: [
            {
                id: 'project',
                labelKey: 'panels.project',
                view: () => import('../vue-app/views/ProjectView.vue'),
                placement: 'project',
                order: 0,
            },
        ],
    },
};

/** 控制台：编辑器日志缓冲 */
export const CONSOLE_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-console',
    name: '控制台',
    description: '编辑器日志（与 AI 桥接的 log.tail 读的是同一份缓冲）',
    apiVersion: '^1.0.0',
    contributes: {
        panels: [
            {
                id: 'console',
                labelKey: 'panels.console',
                view: () => import('../vue-app/views/ConsoleView.vue'),
                placement: 'project',
                order: 1,
            },
        ],
    },
};

/** 属性面板（检查器）：选中对象的属性编辑 */
export const INSPECTOR_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-inspector',
    name: '属性面板',
    description: '检查器：选中对象的属性编辑（字段清单来自属性控件映射插件）',
    apiVersion: '^1.0.0',
    contributes: {
        panels: [
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

/** 全部面板插件（顺序即设置面板里的展示顺序，不影响布局——布局由 placement / order 决定） */
export const PANEL_PLUGINS: readonly EditorPluginManifest[] = [
    HIERARCHY_PLUGIN,
    SCENE_PLUGIN,
    PROJECT_PLUGIN,
    CONSOLE_PLUGIN,
    INSPECTOR_PLUGIN,
];
