# 编辑器插件

编辑器按 **DSH 那套「一切皆插件」** 的理念组织：功能不再写死在主界面里，而是由**插件清单**声明它贡献什么，核心只认注册表。

> 这一层是 **issue #167** 的成果，**#168** 补上「可检视」、**#170** 让清单声明取代模块级副作用。
> 后续：启用/禁用与配置（#169）、API 版本契约与用户 patch 层（#171）。

---

## 为什么不是"注册调用"而是"清单"

DSH 判断一个包是不是插件，靠的是 `package.json` 里的**声明**（`dsh.bundle.patch`），而不是
"import 它就会产生副作用"。这条与本仓 **R2（零模块级副作用）** 天然一致，而编辑器此前恰好走反面：
`registerLogic` / `setDefaultTypeAttributeView` 等注册散在模块顶层，「有哪些功能」取决于 import 图的执行顺序。

所以这里把三件事分开：

| | 位置 | 性质 |
|---|---|---|
| **清单（声明）** | `src/plugins/types.ts` 的类型 + `builtin*.ts` 的字面量 | 纯数据，import 它**不产生任何注册** |
| **登记（进注册表）** | `src/plugins/registry.ts` 的 `registerPlugins` | 只改注册表，不碰引擎全局状态；冲突在此拒绝 |
| **安装（改全局）** | `src/plugins/install.ts` 的 `applyPluginContributions` | 唯一一处调用 `registerLogic` / `setDefaultTypeAttributeView` |

`installBuiltinPlugins()`（`src/plugins/index.ts`）把后两步串起来，由 `vue-app/main.ts` 在挂载前
**显式调用一次**。单元测试有两条专门盯这件事：`import { BUILTIN_PLUGINS }` 之后注册表必须仍是空的；
安装之后引擎侧注册表里必须真的有那 23 个 Logic（`test/pluginInstall.spec.ts`——纯数据测试抓不到
"声明了但没人执行"这类断链）。

**门禁**：`scripts/check-editor-module-effects.mjs` 按 AST 扫 `src/**/*.ts` 的**模块顶层**语句，
出现 `registerXxx` / `setDefaultXxx` / `createXxxComponent` / `installXxx` 调用就红
（函数/类内部的不算）。唯一允许的安装点是应用入口 `vue-app/main.ts`，且该白名单会**反向校验**
（文件不存在或已无注册调用即报"过期登记"）。已进 CI 的 `editor` job。

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

两个插件贡献同名贡献点时**启动就抛错**，而不是后者静默顶掉前者——面板上只少一个、
没人知道为什么，是插件体系里最难查的一类问题。报错**点名双方**（如 `panel:scene（p1 与 p2）`），
失败时注册表保持原样（事务性：先校验再提交）。

## 现有贡献点

| 贡献点 | 字段 | 落到哪 |
|---|---|---|
| 面板 | `panels` | `MainLayout.vue` 的四块 `TabPanel`（内容由 `TabPanel` 直接渲染 `tab.component`） |
| 场景浮层 | `sceneOverlays` | `SceneView.vue` 的画布区域之上 |
| Logic | `logics` | `registerLogic`（引擎的 `__type__` → Logic 类分发表） |
| 属性面板 | `objectView` | `objectview` 单例（默认视图、类型→控件、描述表、人工配置） |

前两类放 **loader**（按需加载视图），后两类放**类 / 数据本身**（安装时就要用，且本就在 import 图里）。

**内置插件**（跟着编辑器一起发，清单形态与外部插件完全一致）：

| 插件 | 贡献 |
|---|---|
| `@feng3d/editor-plugin-core-panels` | 层级 / 场景 / 项目 / 控制台 / 检查器 五个面板（落位与拆分与改造前一致） |
| `@feng3d/editor-plugin-particle` | 粒子播放控制器（改造前是硬编码在 `SceneView.vue` 里的一行） |
| `@feng3d/editor-plugin-objectview` | 属性面板的类型→控件映射（16 条）、字段描述表、人工配置 |
| `@feng3d/editor-plugin-mrs-tool` | 变换工具（移动/旋转/缩放）与坐标轴模型，14 个 Logic |
| `@feng3d/editor-plugin-editor-objects` | 编辑器组件基类、地面网格、场景旋转工具，3 个 Logic |
| `@feng3d/editor-plugin-object-icons` | 灯光/相机图标与鼠标拾取测试脚本，5 个 Logic |
| `@feng3d/editor-plugin-navigation` | 相机导航，1 个 Logic |

贡献点 id（`editor.plugins` 与 `scripts/editor-plugins.mjs` 的输出里就是这些名字）：

| 贡献点 | id | 来源 | 落位 |
|---|---|---|---|
| 面板 | `hierarchy` | `@feng3d/editor-plugin-core-panels` | `hierarchy` |
| 面板 | `scene` | `@feng3d/editor-plugin-core-panels` | `main` |
| 面板 | `project` | `@feng3d/editor-plugin-core-panels` | `project` |
| 面板 | `console` | `@feng3d/editor-plugin-core-panels` | `project` |
| 面板 | `inspector` | `@feng3d/editor-plugin-core-panels` | `bottom` |
| 场景浮层 | `particleEffectController` | `@feng3d/editor-plugin-particle` | — |

属性面板的「类型 → 控件」（16 条，全在 `@feng3d/editor-plugin-objectview`）：
`Boolean` → `OAVBoolean`、`String` → `OAVString`、`number` → `OAVNumber`、
`Vector2` → `OAVVector2`、`Vector3` → `OAVVector3`、`Vector4` → `OAVVector4`、
`Array` → `OAVArray`、`Enum` → `OAVEnum`、`Components` → `OAVComponentList`、
`Function` → `OAVFunction`、`Color3` → `OAVColorPicker`、`Color4` → `OAVColorPicker`、
`Texture2D` → `OAVTexture2D`、`MinMaxGradient` → `OAVMinMaxGradient`、
`MinMaxCurve` → `OAVMinMaxCurve`、`MinMaxCurveVector3` → `OAVMinMaxCurveVector3`。

Logic 贡献点（`__type__`，改造前是 23 处散在各文件顶层的 `registerLogic`）：

| 插件 | `__type__` |
|---|---|
| `@feng3d/editor-plugin-mrs-tool` | `MRSTool`、`MTool`、`RTool`、`STool`、`MToolModel`、`RToolModel`、`SToolModel`、`SectorObject3D`、`CoordinateAxis`、`CoordinateCube`、`CoordinatePlane`、`CoordinateRotationAxis`、`CoordinateRotationFreeAxis`、`CoordinateScaleCube` |
| `@feng3d/editor-plugin-editor-objects` | `EditorComponent`、`GroundGrid`、`SceneRotateTool` |
| `@feng3d/editor-plugin-object-icons` | `SpotLightIcon`、`PointLightIcon`、`DirectionLightIcon`、`CameraIcon`、`MouseRayTestScript` |
| `@feng3d/editor-plugin-navigation` | `Navigation` |

> 上面这几张表由 `test/pluginTable.spec.ts` 盯着：文档里漏登记或写错 id，CI 就会红。

`ParticleEffectController` 从"场景视图认识粒子系统"变成"插件贡献的一个浮层"，
正是这个机制存在的意义：**内核不认识应用**。

## 怎么查「这个东西是哪来的」

```bash
node scripts/editor-plugins.mjs           # 表格：插件 / 面板（按落位）/ 浮层 / Logic / 属性控件，都带来源
node scripts/editor-plugins.mjs --json    # 原始 JSON（喂给别的工具）
node scripts/editor-plugins.mjs --check   # 只校验：每个贡献点都有来源、id 唯一、落位已知
node scripts/editor-plugins.mjs --open --check   # 自己用 Playwright 开页面（CI 跑的是这条）
```

前提是编辑器 dev server 在跑，且**页面已打开**（桥接是页面轮询模型，没有页面就全部超时）；
CI 上没人替你开页面，所以加了 `--open`。`--check` 不打印表格、只判自洽性，有问题退 1。

**谁在盯着这张表**，三层，缺一层都会漏：

| 层 | 执行者 | 能抓住什么 | 抓不住什么 |
|---|---|---|---|
| 纯逻辑 | `test/pluginTable.spec.ts`（离线） | 排序口径、来源标注、id 冲突策略、文档与代码是否同步 | 注册是否真被接线 |
| 接线 | `editor-mcp-check.mjs`（离线，CI `editor` job） | 桥接方法 ↔ MCP 工具 ↔ 文档方法表三者对齐 | 表里的内容对不对 |
| 运行时 | `scripts/editor-plugins.mjs --open --check`（CI `editor-e2e` job） | 真实浏览器里取到的表自洽：贡献点都有来源、来源都在插件列表里、id 唯一、落位已知 | — |

第三层不是冗余：前两层跑在纯函数与源码上，**注册表接线断了、面板没进布局、来源插件丢了**
它们一个都发现不了——那正是这张表存在的理由。

桥接方法 `editor.plugins` 给的是同一份数据（AI 可直接调）。返回里有一条 `overridePolicy`：
**如实报告当前同名贡献点怎么处理**——现在是 `reject`（注册时直接拒绝），分层覆盖由
[#171](https://github.com/feng3d-labs/feng3d/issues/171) 引入。有它，调用方才知道
「看到的顺序是不是覆盖后的结果」，而不是靠猜。

## 为什么没有直接用 cordis（以及什么时候该用）

DSH 的插件底座是 **cordis**（`@deepseek-ai/cordis`，上游 `cordis` 的分叉）。既然编辑器也要"一切皆插件"，
自然会问：直接用它的框架行不行？**调研结论：技术上完全可以，但现在不该用**——先借机制，等某个触发条件出现再引进。

### 实测事实（2026-09）

| 项 | 结果 |
|---|---|
| 核心包体 | `@deepseek-ai/cordis` 4.0.4，**打成浏览器 ESM 只有 27.2 KB**（minified，含 Context / Service / Events / plugin / dispose） |
| 依赖 | 仅 `@standard-schema/spec` + `@deepseek-ai/cosmokit` |
| 浏览器兼容 | 产物里 `node:fs` / `node:path` / `process.` 引用 **各 0 处**；DSH 自己的 client 侧（`dsh-client-ui-cordis` / `dsh-cordis-client-runner`）就在浏览器里跑它 |
| 类型 | 自带完整 `.d.ts` |
| 来源 | `@deepseek-ai/cordis` 由 DSH 团队公开发布（MIT，仓库 `deepseek-ai/deepseek-harness`）；**上游** `cordis` 由作者 shigma 维护（MIT，`cordiverse/cordis`），最新仍是 `4.0.0-rc.10` —— DSH 把 RC 分叉成了自己的 4.0.x 稳定线 |

### 它有而我们现在没有的（对照 issue）

| cordis | 编辑器现状 | 对应 |
|---|---|---|
| `Service` + `inject`：**显式依赖注入**，依赖未就绪就不启动 | `EditorData` / `editorui` / `editorRS` / `editorcache` 是模块级单例，谁依赖谁只体现在 import 图里 | 无（新问题） |
| `Fiber.dispose()`：效果 / 监听 / 服务**随所属 fiber 一起撤销** | 基本没有"关掉一个功能"的能力——面板、快捷键、监听、定时器挂上就不下来 | **#169** |
| loader + include：配置树 + **层叠加/覆盖** | 无（`#171` 的 patch 层正是想做这个） | **#169 / #171** |
| schemastery：配置 **schema 校验** | 无 | **#169** |

### 为什么现在不引

1. **范式冲突**：上一轮刚把方向定成「纯数据清单（声明） + 显式注册（执行）」，对齐 **R2 零模块级副作用**；
   而 cordis 的核心是「运行时插件函数 + Context 容器 + 可撤销副作用」。现在引入会把方向反着拉。
2. **多一套"上下文"概念**：编辑器里已经有 Vue 的响应式、feng3d 自己的 `@feng3d/reactivity`，
   再加一个 DI 容器，是第三种"东西从哪来"的心智模型。
3. **我们真正缺的不是 DI，而是撤销语义与层叠加**——这两件事可以只借机制，落到 #169 / #171。

### 该借的四个机制（落到 #169 / #171）

- **`inject` 式的显式依赖声明** → 清单里加 `requires`，注册时校验「依赖未满足就拒绝启动」，
  而不是运行到一半某个字段是 `undefined`；
- **`Fiber.dispose()` 的撤销语义** → #169「关掉插件要关干净」；
- **loader/include 的层叠加** → #171 的用户 patch 层；
- **schemastery 式的配置校验** → #169 的插件配置。

### 什么时候该真引进（触发条件）

出现**任一条**，就值得回头把 cordis 作为**服务层**（不含 UI 贡献点）的底座：

1. #169 做完后，"撤销"要自己维护**三类以上**资源的注册表（监听 / 定时器 / 缓存 / 桥接方法 / 快捷键）——
   那时 cordis 的 Fiber 比自己写划算；
2. 需要**运行时插件树 + 配置文件**装插件（不改代码就能装/配）——这正是 loader + include 的领域；
3. 出现插件**互相依赖、启动顺序敏感**的真实需求。

> 注意无论选哪条路，都要付一份"依赖契约"成本（绑 DSH 的分叉，还是绑仍在 RC 的上游）——
> 这正是 **#171** 要解决的问题，所以引进前先把契约定下来。

### 阶段性验证记录

- `tmp/cordis-spike/entry.mjs` + esbuild 打成浏览器产物：**27.2 KB**，零 node 引用（本文件的表格数据即出自该次测量）

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
