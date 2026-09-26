# 编辑器插件

编辑器按 **DSH 那套「一切皆插件」** 的理念组织：功能不再写死在主界面里，而是由**插件清单**声明它贡献什么，核心只认注册表。

> 这一层是 **issue #167** 的成果。后续：贡献表可检视（#168）、启用/禁用与配置（#169）、
> 清单声明替代模块级副作用（#170）、API 版本契约与用户 patch 层（#171）。

---

## 为什么不是"注册调用"而是"清单"

DSH 判断一个包是不是插件，靠的是 `package.json` 里的**声明**（`dsh.bundle.patch`），而不是
"import 它就会产生副作用"。这条与本仓 **R2（零模块级副作用）** 天然一致，而编辑器此前恰好走反面：
`registerLogic` 等注册散在模块顶层，「有哪些功能」取决于 import 图的执行顺序。

所以这里把两件事分开：

| | 位置 | 性质 |
|---|---|---|
| **清单（声明）** | `src/plugins/types.ts` 的类型 + `src/plugins/builtin.ts` 的字面量 | 纯数据，import 它**不产生任何注册** |
| **注册（执行）** | `src/plugins/registry.ts` 的 `registerPlugins`，由 `main.ts` 显式调用 | 一处显式调用，可 dump、可对账 |

单元测试里有一条专门盯这件事：`import { BUILTIN_PLUGINS }` 之后注册表必须仍是空的。

## 加一个面板：不需要改 MainLayout

改造前，加一个面板要改三处：`MainLayout.vue` 的 `allTabTypes`、四块 `TabPanel` 的具名插槽
（`#tab-xxx`，共 25 段重复）、以及各自的默认标签数组。现在只需要一份清单 + 注册：

```ts
// src/plugins/builtin.ts（或你的插件包里）
const MY_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-my-thing',
    name: '我的功能',
    contributes: {
        panels: [
            {
                id: 'myPanel',
                labelKey: 'panels.myPanel',           // i18n 键
                view: () => import('./MyPanelView.vue'),
                placement: 'project',                 // 默认落在哪块 TabPanel
                order: 0,
            },
        ],
        sceneOverlays: [
            { id: 'myOverlay', view: () => import('./MyOverlay.vue') },
        ],
    },
};
```

`registerPlugins([MY_PLUGIN])`（内置插件走 `installBuiltinPlugins()`）。

### 两个要点

- **`view` 是 loader 而不是组件**（`() => import('...')`）。这样清单保持纯数据（单元测试不必打开
  Vue 单文件组件编译）、视图按需加载（启动时不必把所有面板的视图都拉起来）。核心负责把它包成
  `defineAsyncComponent` 并 `markRaw`——后者的必要性在于标签页数组是 `ref`，不 `markRaw`
  会把组件定义变成响应式代理（Vue 警告 + 渲染变慢）。
- **`placement` 只决定默认落位**。TabPanel 的 `+` 菜单列出**全部**面板，用户可以把任意面板加到
  任意落位；`placement` 决定的是"开局长什么样"。

### 贡献点 id 冲突会被拒绝

两个插件贡献同名面板/浮层时**启动就抛错**，而不是后者静默顶掉前者——面板上只少一个、
没人知道为什么，是插件体系里最难查的一类问题。

## 现有贡献点

| 贡献点 | 字段 | 渲染位置 |
|---|---|---|
| 面板 | `panels` | `MainLayout.vue` 的四块 `TabPanel`（内容由 `TabPanel` 直接渲染 `tab.component`） |
| 场景浮层 | `sceneOverlays` | `SceneView.vue` 的画布区域之上 |

**内置插件**（跟着编辑器一起发，清单形态与外部插件完全一致）：

| 插件 | 贡献 |
|---|---|
| `@feng3d/editor-plugin-core-panels` | 层级 / 场景 / 项目 / 控制台 / 检查器 五个面板（落位与拆分与改造前一致） |
| `@feng3d/editor-plugin-particle` | 粒子播放控制器（改造前是硬编码在 `SceneView.vue` 里的一行） |

`ParticleEffectController` 从"场景视图认识粒子系统"变成"插件贡献的一个浮层"，
正是这个机制存在的意义：**内核不认识应用**。

## 相关文件

| 文件 | 作用 |
|---|---|
| `src/plugins/types.ts` | 清单类型（纯数据） |
| `src/plugins/registry.ts` | 注册表与查询（面板 / 落位 / 场景浮层） |
| `src/plugins/builtin.ts` | 内置插件清单 |
| `src/plugins/index.ts` | `installBuiltinPlugins()`（显式安装） |
| `src/vue-app/main.ts` | 启动时调用 `installBuiltinPlugins()` |
| `src/vue-app/components/TabPanel.vue` | 优先渲染 `tab.component`，退回具名插槽（兼容旧用法） |
| `test/pluginRegistry.spec.ts` | 注册表语义 + 内置清单覆盖的回归测试 |
