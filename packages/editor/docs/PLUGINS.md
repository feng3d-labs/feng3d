# 编辑器插件

编辑器按 **DSH 那套「一切皆插件」** 的理念组织：功能不再写死在主界面里，而是由**插件清单**声明它贡献什么，核心只认注册表。

> 这一层是 **issue #167** 的成果，**#168** 补上「可检视」、**#170** 让清单声明取代模块级副作用、
> **#169** 加上启用/禁用与配置、**#171** 补上 API 版本契约与**用户覆盖层**。

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
| 桥接方法 | `bridgeMethods` | AI 桥接的方法表（每次请求现算，见 `bridge/EditorBridge.ts`） |

面板与浮层放 **loader**（按需加载视图），其余三类放**类 / 数据 / 处理器本身**（安装或请求时就要用，且本就在 import 图里）。

**内置插件**（跟着编辑器一起发，清单形态与外部插件完全一致）：

| 插件 | 贡献 |
|---|---|
| `@feng3d/editor-plugin-core-panels` | 层级 / 场景 / 项目 / 控制台 / 检查器 五个面板（落位与拆分与改造前一致） |
| `@feng3d/editor-plugin-particle` | 粒子播放控制器（改造前是硬编码在 `SceneView.vue` 里的一行） |
| `@feng3d/editor-plugin-objectview` | 属性面板的类型→控件映射（16 条）、字段描述表、人工配置（**必需插件，不可关**） |
| `@feng3d/editor-plugin-mrs-tool` | 变换工具（移动/旋转/缩放）与坐标轴模型，14 个 Logic；桥接方法 `editor.setTool` |
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

## 启用 / 禁用（issue #169）

关掉一个插件，它的贡献点要**到处都消失**：面板（界面上 + 贡献表里）、场景浮层、Logic
（引擎分发表里真注销）、属性控件、桥接方法（调用报「未知方法」）。

### 开关状态从哪来（不维护手写列表）

DSH 的关键一条是**按已安装状态对账**，而不是维护一份手写的启用列表——手写列表必然漂移。
这里改成**推导**：

```
enabled = required ? true
        : 用户开关（若显式设过）
        : 清单的 defaultEnabled（省略即 true）
```

用户开关**只记"用户改过的"**（localStorage，`feng3d-editor-plugins`），没改过的插件永远跟着清单走
——所以插件升级后改了默认状态能自动生效，而不是被一份陈旧列表钉住。

**对账**：启动时丢掉指向"当前没装的插件"的开关项，并把它记下来
（`getDroppedSwitches()`）。静默丢弃会让"我明明关过它"变成悬案，所以**丢了什么要能查**。

三层分工（各自单独可测）：

| 层 | 文件 | 职责 |
|---|---|---|
| 状态 | `src/plugins/state.ts` | 推导、持久化、对账 |
| 贡献点 | `src/plugins/install.ts` | 安装 / 卸载（`applyPluginContributions` / `revertPluginContributions`） |
| 编排 | `src/plugins/enable.ts` | 把上面两层串成"改一个开关"，并保证幂等 |

### 关掉之后还剩什么（如实说明）

- **面板 / 浮层 / 桥接方法**是每次现算的，状态一改立刻消失（桥接的方法表也一样，
  所以关掉变换工具插件后 `editor.setTool` 就调不通了）。
- **Logic**：`unregisterLogic` 会把类型从引擎分发表里摘掉，但**已经创建的实例不回收**
  （它们被场景对象持有）。所以关掉插件影响的是**之后新建**的对象，已存在的对象继续用它原来的 Logic。
- **属性面板配置不可撤**：它写进的是 `objectview` 单例的默认值，撤掉等于把面板变成
  "没有控件映射"的半死状态。所以那个插件标 `required: true`（**不许关**），
  而不是让卸载路径假装能卸干净。设置面板里它的开关是灰的。

### 怎么用

- **界面**：设置 → 插件（列出**全部**插件，含被禁用的，每个带 id 与说明；
  用户设过的会显示「恢复默认」）
- **AI / CLI**：`editor.setPlugin { id, enabled }`（只改编辑器状态、不碰场景数据，不需要写通道）
- **看当前状态**：`editor.plugins` 的 `plugins[]` 里每个都有
  `enabled` / `required` / `defaultEnabled` / `userSwitch`——`enabled: false` 时能分辨是
  「用户关的」还是「清单默认关的」

关掉插件后**标签页布局会按当前启用集合重建**（效果等同于刷新页面）：这比停在一个
引用了已消失面板的布局上更容易猜。

## 层叠加与用户覆盖层（issue #171）

### 层序：内置 < 插件 < 用户

贡献点带**层**。同一个 id 出现在多层时**上层赢**，而且**必须留下痕迹**——`overriddenBy`
里列出被它盖住的下层来源。没有这个痕迹，"看到的是哪一层的值"就又变成靠猜了。

**同一层**里出现重复 id 仍然是**错误**（两个平级插件在抢同一个位置，谁赢都说不清），
登记时直接拒绝并点名双方与层：`panel:scene（plugin 层的 p1 与 p2）`。

贡献表的 `overridePolicy` 因此是 `layered`（不是 `reject`）：同级仍拒绝，跨层是有意的覆盖。

### API 版本契约

插件**必须**声明所依赖的编辑器插件 API 版本，编辑器在登记时核对：

| 写法 | 含义 |
|---|---|
| `^1.2.3` | 主版本相同，且当前版本 ≥ `1.2.3` |
| `~1.2.3` | 主版本与次版本都相同，且 ≥ `1.2.3` |
| `1.2.3` | **完全相同** |

不兼容就**当场抛错**，并指出**要什么、现在是什么**（例如
「`^2.0.0` 要求主版本 2 且不低于 2.0.0，当前编辑器 API 版本是 1.0.0」）。
刻意不支持 `>=` / `||` / `*` 这些范围表达式：编辑器侧的 API 只在主版本内保持兼容，
一条窄而说得清的规则比半套 semver 好——后者会让"到底算不算兼容"变成玄学。

不声明视为不兼容（契约不能是可选的：允许省略等于给"忘了声明"开后门，那会在运行期才炸）。
当前版本常量在 `src/plugins/apiVersion.ts` 的 `EDITOR_PLUGIN_API_VERSION`；
**改动清单形状（增删改贡献点字段/语义）时必须动它**——那是唯一能告诉外部插件"我变了"的机制。

### 用户覆盖层：`editor.patch.json`（本地、不入库）

最上面那一层来自一个本地 JSON 文件，**刻意不入库**（见根 `.gitignore`）。
模板是 `packages/editor/editor.patch.example.json`，复制成下面任一个位置：

| 位置 | 什么时候用 |
|---|---|
| `packages/editor/editor.patch.json` | 开发（dev server 根目录） |
| `packages/editor/public/editor.patch.json` | 产物（与 index.html 同级） |

```jsonc
{
  "apiVersion": "^1.0.0",          // 必填：patch 也是编辑器 API 的消费者，同一套契约
  "name": "我的本地覆盖",           // 可选：这一层的显示名
  "plugins": {
    "@feng3d/editor-plugin-mrs-tool": { "enabled": false },
    "@feng3d/editor-plugin-particle": { "name": "粒子（我改了名）" }
  },
  "contributes": {
    "panels": [
      { "id": "hierarchy", "placement": "project", "order": -1 }
    ]
  }
}
```

- **只能覆盖，不能新建**：JSON 给不出视图 loader / Logic 类，一个"新面板"没有东西可渲染。
  引用不存在的 id 会被当作**错误**指出（静默忽略会让人以为 patch 生效了）。
- **只写要改的字段**，其余**继承下层**（`hierarchy` 只改了落位，视图与标签键照旧）。
- **坏 patch 不会拖垮编辑器**：校验不通过时**一个字段都不应用**，原因进 `getPluginState()`
  （`editor.plugins` 的 `userPatch`），控制台一条 error。用户手写的本地文件写错一个字符就白屏，
  是没法接受的。
- **"没有文件"不是错误**：静态服务器的 404、以及 dev server 的 SPA 回退（200 + `text/html`）
  都按"没有 patch"处理。实测踩过：不认后者会报一句「不是合法 JSON：Unexpected token '<'」，
  而用户其实只是没有这个文件——把"没有"误报成"写坏了"，比不报还糟。
- **地址可换**：`?patch=<url>`（例如指向一份放在别处的临时 patch），来源会报成 `url`。
- **优先级**：`required` → 设置面板里的开关 → patch 的设定 → 清单默认。
  设置面板压过 patch 是有意的：patch 是用户早先写下的配置，面板上的开关是他刚刚点的。

`editor.plugins` 里能查到这一切：`userPatch`（有没有 / 从哪读 / 生不生效 / 覆盖了什么）、
每个插件的 `layer` / `patchName` / `patchEnabled`、每个贡献点的 `layer` / `overriddenBy`。
命令行同样的信息在 `node scripts/editor-plugins.mjs` 的输出里。

## 怎么查「这个东西是哪来的」

```bash
node scripts/editor-plugins.mjs           # 表格：插件（层 + 开关 + 改名）/ 面板 / 浮层 / Logic / 属性控件 / 桥接方法 / 用户覆盖层
node scripts/editor-plugins.mjs --json    # 原始 JSON（喂给别的工具）
node scripts/editor-plugins.mjs --check   # 只校验：来源/唯一性/落位/层与覆盖关系/禁用插件不留痕/用户 patch 是否生效
node scripts/editor-plugins.mjs --open --check   # 自己用 Playwright 开页面（CI 跑的是这条）
```

前提是编辑器 dev server 在跑，且**页面已打开**（桥接是页面轮询模型，没有页面就全部超时）；
CI 上没人替你开页面，所以加了 `--open`。`--check` 不打印表格、只判自洽性，有问题退 1
（用户 patch 写坏了也退 1——那说明用户以为改上了，其实没有）。

**谁在盯着这张表**，四层，缺一层都会漏：

| 层 | 执行者 | 能抓住什么 | 抓不住什么 |
|---|---|---|---|
| 纯逻辑 | `pluginTable.spec.ts` / `pluginApiVersion.spec.ts` / `pluginLayers.spec.ts` / `pluginPatch.spec.ts`（离线） | 排序口径、来源与层、覆盖链、版本契约、patch 校验与事务性、文档与代码是否同步 | 注册是否真被接线 |
| 状态与装卸 | `pluginEnable.spec.ts`（离线） | 推导/持久化/对账、禁用后贡献点消失、Logic 真被注销 | 界面是否跟着变 |
| 接线 | `editor-mcp-check.mjs`（离线，CI `editor` job） | 桥接方法 ↔ MCP 工具 ↔ 文档方法表三者对齐 | 表里的内容对不对 |
| 运行时 | `scripts/editor-plugins.mjs --open --check`（CI `editor-e2e` job） | 真浏览器里的表自洽 + 禁用插件不留痕 + 用户 patch 生效 | — |

后两层不是冗余：纯逻辑测试跑在纯函数上，**注册表接线断了、面板没进布局、界面没刷新**
它们一个都发现不了——那正是这个机制需要被实际跑一遍的理由。

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
