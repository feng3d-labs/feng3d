# 编辑器架构

> 状态：**架构文档（2026-09）**。本文是 `packages/editor` 的架构总纲；**宿主层**专项细化见
> [NODE_HOST.md](NODE_HOST.md)，插件机制见 [PLUGINS.md](PLUGINS.md)，AI 桥接协议见
> [docs/EDITOR_AI_BRIDGE.md](../../../docs/EDITOR_AI_BRIDGE.md)。
>
> 本文由需求方给出的新定义驱动：**编辑器是一个本地工具——能在本地创建项目、操作文件、编译、发布**；
> 此前"把项目存在浏览器 IndexedDB 里"的方向**降级为支持形态**，而不是主形态。
>
> 现状结论由三路子代理并行调研产出，逐条附「文件:行号」，可复核；证据边界见 §12。

---

## 1. 重新定义

### 1.1 三个形态（主次分明）

| 形态 | 是什么 | 地位 |
|---|---|---|
| **A. 本地工具** | `feng3d-editor` 命令启动 **Node 宿主进程**，内置 Web UI。创建项目、读写项目文件、编译脚本、发布产物 | **主形态**（本文与 NODE_HOST.md 的设计目标） |
| **B. 纯浏览器** | 现在这个：打开网页即用，项目存在 IndexedDB，无需安装 | **支持形态**——"零安装试用 / 演示 / 轻量编辑"入口，**不是主方向** |
| **C. 运行时预览** | 项目"跑起来"的样子（`run.html` + 项目数据），不含编辑器 UI | 主形态的**产物**，也是发布的目标形态 |

**A 产出 C**；B 是 A 的能力子集（无真文件系统、无编译、无发布）。
B 存在的前提是"能力可降级"（决策 D7），而不是"两套架构"。

### 1.2 与仓库战略的关系

这是既有规划里一个**待办评估的落地**，不是另起炉灶：

- [POSITIONING.md](../../../docs/POSITIONING.md) §4：`数据即应用 × 编辑器 × AI 生成/修改`
  是"唯一能形成不可替代性的方向"；§6 把「编辑器收回」列为**优先级 3、护城河**。
- 同文档 §5 已把「**云编辑器与托管服务**」列为**非目标**（那是 PlayCanvas 的商业形态）。
- [ARCHITECTURE_V2.md](../../../docs/ARCHITECTURE_V2.md) §4 **P4** 的任务是「editor 收回评估
  （能否编译 → 依赖差异 → 收回或明确冻结）」。

**本定义就是那个评估的结论：收回，按"本地工具"形态落地。** 方向与上述文档一致，
需要做的是把结论写回它们（§10）。

### 1.3 必须先知道的事：三条链路"看起来有、实际不通"

重定义的起点不是"改造一个能跑的编辑器"，而是**先把地基修好**。调研确认以下三条
核心链路当前是断的——它们恰好就是"本地工具"的三大功能：

| 链路 | 现状 | 证据 |
|---|---|---|
| **脚本编译** | `ScriptCompiler` 依赖全局命名空间 `ts`（TypeScript **3.0**），但仓库**没有任何地方加载**那个 6.5MB 编译器（`libs/typescriptServices.js`），且它被构建配置 `external` 排除。高置信推断：运行时抛 `ReferenceError`，**被 catch 吞掉后仍弹「编译完成！」** | `src/ScriptCompiler.ts:2,145-167`、`libs/typescriptServices.d.ts:17`、`vite.config.js:199-200` |
| **项目导入 / 导出** | `EditorRS` 的两处实现写成 `Promise.all(paths.map((p) => async () => {...}))`——`map` 返回**函数数组**，`Promise.all` 立即 resolve，**回调体永不执行** → 导出空 zip、导入什么都不写 | `src/assets/EditorRS.ts:122`、`:152`（正确写法对照 `src/ui/assets/AssetNode.ts:369`） |
| **运行预览** | `run.ts` 的 `initProject()` **整个函数体被注释掉**（TODO P1 API 迁移） | `src/run.ts:52-81` |

> **三条的现状（2026-10-02 逐条核对）**：
>
> - **脚本编译**：**失败如实报错**已修（#342，`ScriptCompiler.ts:155-166` 已区分 failure / success）；
>   而"编辑器内编译"这条链路本身按 D12 **整体替换**（编辑器改为调用项目自己的构建），属 P4/P6。
> - **项目导入 / 导出**：**已修**（#338，`map(async (p) => …)`），并有往返等价用例
>   （`test/editorRSZip.spec.ts:150`「导出后再导入到空文件系统，文件集合与内容一致」）。
> - **运行预览**：**已修**（#271）——`run.ts` 重写为"纯数据场景 → `logic(view)` → WebGPU 提交循环"，
>   **不再 `eval(project.js)`**；`run.html` 补上渲染画布；端到端
>   [`scripts/editor-run-preview.mjs`](../../../scripts/editor-run-preview.mjs)（有 GPU 7/7、无 GPU 6/6）。
>   **两处遗留**：① `resource/template/app.js` 仍是旧回调 API（下一阶段）；
>   ② 模板场景 `default.scene.json` 的相机在 `z = -10` 且 rotation 为 0（朝 -Z）——**背离原点**，
>   于是渲染得出背景色却看不到物体（截图确认）。这是**模板场景数据**的问题，不是运行形态的。

另有**类型检查根本不存在**：`ScriptCompiler.ts` 通读 199 行只有 `program.emit()`（`:167`），
没有任何 `getPreEmitDiagnostics` / 语义诊断调用；类型提示只存在于 Monaco 窗口内（Monaco 自带语言服务）。

> 这决定了 §8 分期的第一条：**P0 修链路**。在三条链路里至少修好两条之前，
> "编译 / 发布"没有可验收的对象。

---

## 2. 对标与取舍

> ⚠ **证据强度**：本节对 PlayCanvas 与 DSH 的描述基于公开资料与通用架构理解，
> **本会话无法联网核实两者源码**（所有外链抓取被 DNS 拦截，见 §12）。
> 涉及它们内部机制的表述按"待核实"对待；**本文的设计结论不依赖这些细节**。

### 2.1 PlayCanvas：学它的编辑器，不学它的形态

| 学 | 不学 |
|---|---|
| 编辑器数据模型：entity / asset / template 三类公民，层级与引用清晰 | **云托管 + 账号 + 租户**——POSITIONING §5 已列为非目标，与"本地工具"直接冲突 |
| 资产管线：资源有独立身份、导入即登记 | **引擎与 Editor 分仓、数据须经 Editor 工程格式**——POSITIONING §4 点名的 PlayCanvas 弱点 |
| 发布的产物化思路：编辑器态与运行态分离，运行态由编辑态产物化 | `playcanvas-sync` 式"本地 ↔ 云端"**双向同步**：我们是本地宿主，文件本就在本地，**不需要同步层** |

**最关键的一条**：PlayCanvas 的运行数据要经"Editor 工程格式"转换，而 feng3d 的护城河是
**编辑格式 = 运行时内存结构**。因此本项目**绝不能**引入"工程格式 → 运行时格式"的转换层
——编译与发布只做**代码与资源的产物化**。这是决策 D1。

### 2.2 DSH：学它的宿主结构

| 学 | 说明 |
|---|---|
| **Node 宿主 + cordis 插件树** | 插件装载、依赖注入、生命周期撤销 |
| **配置分层与 patch** | profile + patch 的热加载与层叠加。本仓编辑器**已有同构实现**（`PluginLayer`：内置 < 插件 < 用户，见 [PLUGINS.md](PLUGINS.md)），可平移而非重写 |
| **一条命令层，多入口复用** | AI（MCP）/ CLI / 宿主内部走同一套命令实现 |
| **client / server 分离** | 服务端是权威，Web 端是客户端；UI 崩溃不影响服务端状态 |
| **dual-half（双半）插件包** | 一份包两个入口：宿主半 + **Web 半**；Web 半**也是 cordis 插件**；UI 贡献点用 **slots 契约**登记。详见 §6.6 |
| **插件声明在 `package.json`** | DSH 用 `dsh` 字段（`bundle` / `profile` / `client` …）。与 editor 现有"清单声明"同构，比"import 即注册"更可检视 |

| 注意 | 说明 |
|---|---|
| DSH 的 Web 端组件层是 **React 18** | editor 是 Vue 3——**机制可搬，组件层不可** |
| `dsh.client.inject` **不是** cordis 服务注入 | schema 注释明确写它是"包名依赖（用于组合与工厂到达顺序）"；真正的服务注入是 client 半代码里的 `export const inject` |

---

## 3. 关键设计决策

### D1 编辑格式 = 运行格式（不可破坏）

编译与发布**只做代码与资源的产物化**，不引入"工程格式 → 运行时格式"的转换层。
**理由**：这是 POSITIONING §4 认定的护城河（战场 A）。

**现状已在这条线上但不完整**：`EditorAsset.readScene()` 对纯数据 `__type__` 走
`serialization.deserialize`，对旧 `__class__` 走 `deserializeWithAssets`
（`src/ui/assets/EditorAsset.ts:86-110`）——新旧两套并存，D1 要求把旧路径收敛掉。
**执行者**：往返等价 e2e（§9）。

### D2 场景数据的权威副本在浏览器，宿主管文件与插件

宿主持有**文件与插件**，不持有场景对象图。依据：WebGPU 渲染、响应式 computed 链、
选中/相机/撤销栈都只能在浏览器（`EditorView.ts:205-231`、`editorStore.ts:39,133-135`、
`bridge/write/writeCore.ts:76-129`）。细化论证见 [NODE_HOST.md](NODE_HOST.md) §5.1。

### D3 项目 = 磁盘目录，zip 只是交换格式

现状"项目"是 IndexedDB 里一个 **objectStore**（名字即项目名），项目名存在 localStorage
（`IndexedDBFS.ts:30,287-304`、`Editorcache.ts:11,44-53`）；新建/切换 = **改字符串 +
`window.location.reload()`**（`CommonConfig.ts:54-67,69-99`）。主形态下项目是**目录**（§5）。

**zip 格式契约可沿用**：实测 `projects/light.feng3d.zip` 共 75 条，**zip 根 == 项目工作区根**
（含 `Assets/`、`libs/`、`previews/`、`app.js`、`default.scene.json`、`index.html`、
`project.js`、`project.js.map`、`resource.json`、`tsconfig.json`）。
注意其中有 `project.js.map` → 这些示例包是**在编辑器里编译后导出的快照**。

### D4 插件 = triple-half（三端）包：编辑器 Node 端 + 编辑器 Web 端 + 游戏项目端

插件形态包含**三个部分**（需求方确定）：

| 端 | 导出入口 | 运行环境 | 贡献什么 |
|---|---|---|---|
| **编辑器 Node 端** | `"."` | 服务端进程（cordis） | 服务、文件、项目、编译、构建、发布 |
| **编辑器 Web 端** | `"./client"` | 浏览器（编辑器页面，cordis） | 编辑器 UI（插槽）、编辑期 Logic、命令 |
| **游戏项目端** | `"./runtime"` | 浏览器或目标平台（**产物内**） | 运行时 Logic / 组件行为 / 系统 |

**前两端照搬 DSH 的 dual-half 模型**（术语出自 `@deepseek-ai/dsh-cordis-client-runner` 的包描述：
"Browser half of dynamic **dual-half** plugin packages"）；**第三端是 editor 超出 DSH 的部分**——
DSH 的产物就是它自己的 UI，而 editor 的产物是**游戏项目**，产物需要独立装载插件。

| 维度 | 做法 | DSH 的对应物 / 差异 |
|---|---|---|
| 包形态 | 一份包、**三个**导出入口 | DSH 只有 `"."` + `"./client"` 两个 |
| 声明 | `package.json` 里分三块（沿用现有 `apiVersion` 契约） | DSH 是 `dsh.client` 单块：`platform` / `inject` / `immediately` / `external` |
| Web 端 | **也是 cordis 插件**：`apply(ctx)` + `inject` | 每个 client 包 `peerDependencies` 都是 cordis → 浏览器里跑第二个 cordis 实例 |
| UI 贡献点 | **slots 契约**，取代现在写死的五类 | `ui-slots` 的 `SlotMap` 模块增强；`kind: 'single' \| 'list'`；`owner` props；**"declaring is claiming"** |
| 撤销 | 插槽注册经**调用方 `ctx.effect`** | `SlotRegistry` 的 `register` **必须是原型方法**——service proxy 在调用时把 `this.ctx` 绑到调用方 context；箭头属性会冻结到服务自己的 root ctx，**静默破坏 per-plugin 卸载** |
| **游戏项目端** | 见 §6.6「第三端」——**只能依赖引擎 API，禁止依赖编辑器 API** | **DSH 无对应物** |

三端可只声明其中一部分（纯服务插件 / 纯 UI 插件 / 纯运行时插件）。
完整机制、第三端的边界约束与装载方式见 §6.6。

**两项已决策**（需求方确定）：

| 决策 | 内容 | 主要推论 |
|---|---|---|
| **runtime 端装载 = A（构建时打入）** | `build` / `publish` 时把**该项目实际启用的插件**的 runtime 端产物合并进游戏 bundle | ① 产物**自包含**、可离线跑（与"游戏端不连 WebSocket"同一条设计）；② **运行时装插件不会改变游戏端行为**——游戏端要重新构建才生效；③ 打入的插件集合由**项目启用状态**决定（`plugins/state.ts` 的开关参与构建）；④ runtime 端产物必须可 tree-shake → **不得有模块级副作用（与 R2 同向）** |
| **契约 = 三端共用编辑器 `apiVersion`** | 一个版本号，插件只声明一处 | ① 插件作者只写一处、单一契约；② **已知代价**：编辑器 API 与引擎 API 是两条演进速度不同的线，共用版本号意味着**编辑器承诺"同版本内引擎也兼容"**——引擎依赖变化时必须同步动 `EDITOR_PLUGIN_API_VERSION`（已列入 §10 纪律） |

### D5 构建由**编辑器执行**，但**构建定义在项目里**

- **项目是构建的主体**：游戏项目自带 `package.json`（依赖 `feng3d` 等）与自己的构建配置，
  编辑器**调用**项目的构建（见 D12），不替项目决定"怎么构建"。
- **编辑器提供默认模板**：`new` 项目时写入一套默认 `package.json` + `tsconfig.json` + 构建配置；
  之后**项目拥有它**，可以改——这正是 D10"脱离 editor 也能构建、能运行"的前提。
- **现状的偏差要整体废弃**：现在 `ScriptCompiler` 在**编辑器内**用浏览器 TypeScript services 编译成
  `project.js`（`tsconfig.json` 的 `outFile: "project.js"`），而该链路**实际不可用**
  （§1.3：那个 6.5 MB 编译器本体从未被加载）。它不再是被"修好"的对象，而是**被替换**的对象。
- **资源**：只做**格式内**处理（压缩、尺寸），不做语义转换（D1）。

### D6 一条命令层，三种入口共用

UI 操作、CLI 命令、AI（MCP）调用走同一套命令实现。现状 `EditorBridge` 方法表
（`src/bridge/read/*`、`src/bridge/write/*`，含 `scene.export`）已是雏形，
但它挂在**浏览器侧**且通道是 dev-only，**且没有项目级导出/构建方法**。

### D7 无宿主可降级（B 形态的存续条件）

所有宿主能力在缺失时要有明确降级路径：文件系统降级为 IndexedDB、编译降级为浏览器内
（现状不可用，见 §1.3）或明确置灰、插件降级为**内置清单**。
**这决定了 L1 通道必须"可缺席"，不能成为启动硬依赖。**

### D8 项目文件是人类可读文本，可被 Git 管理

场景与清单是 JSON（JSONC 亦可），脚本是 TS，二进制只出现在 `assets/`。
**理由**：`数据即应用 × AI 生成与修改` 要求数据可 diff、可评审、可被 AI 直接读写。

### D9 服务端 ↔ Web 端用 WebSocket 通信（需求方已决定）

编辑器明确拆成**两部分**：**服务端**（Node 宿主，权威）与 **Web 端**（浏览器 UI），
两者之间用 **WebSocket** 双向通信。协议设计见 §6.7。

**这条推翻了现状的一处刻意取舍**：现有桥接**刻意不用 WebSocket**——
`bridge/vitePlugin.mjs` 头注释写明理由：仓库内无 `ws` 依赖，手写 RFC 6455 握手与帧解析
不划算，且 HTTP 方案零依赖、可 `curl` 调试。改成 WebSocket 后这两个理由都要正面处理：
**服务端必须有一个 WebSocket 实现**（Node 不内置 WebSocket 服务端），
而**现有 15 个 `scripts/editor-*.mjs` 与 CI 的 e2e job 全部建立在 HTTP + 轮询之上**。
这是本决策的主要成本，见 §6.7「两个必须解决的问题」。

### D10 游戏项目是**一等公民**：产物必须脱离 editor 独立运行

每个由 editor 构建的游戏项目都能**在本地独立运行**（不依赖 editor 的存在）。editor 的定位因此
明确为**产物生成器**——搭建场景、修改配置、生成数据、编译脚本；**产出的项目自己就是完整可运行的东西**。

推论：
- **项目目录自包含**：引擎运行时、插件 runtime 端、编译产物、资源都在项目内。
  `resource/template/` 已是这个形态（`libs/feng3d.js` 2.29 MB + `libs/cannon.js` 390 KB）；
- 与**决策 A（构建时打入）**互相印证：产物不依赖 editor 服务，自然也不需要连回编辑器；
- 运行方式应"开箱即跑"：静态服务器或一条命令即可（`bin/serve.mjs` 的静态服务能力可直接复用）。

### D11 文件系统与代码编辑交给 **VS Code Web 端**（参考 Codespaces）

**需求方确定**：文件系统由 VS Code 的 Web 端代替，参考 GitHub Codespaces。

| 项 | 结论 |
|---|---|
| 形态 | 本地 Node 进程跑 **VS Code 服务端**（Codespaces 用同类方案；开源等价物是 `code-server` / `openvscode-server`），浏览器访问，**打开同一个项目目录** |
| editor 因此得到 | 文件树、多标签编辑、终端、Git、全局搜索、**TypeScript 类型提示**（项目里已有 `libs/feng3d.d.ts` 555 KB，VS Code 按 `tsconfig.json` 直接吃） |
| editor 因此交出 | **资源管理器面板**（`@feng3d/editor-plugin-project` 的 Assets 树）、**内嵌代码编辑器**（`packages/editor/packages/codeeditor` 的 Monaco 窗口） |
| editor 专注 | 3D 场景搭建、属性配置、产物生成、插件管理 |

**这与既有资产是吻合的，不是外来方案**：项目模板里**本来就带 `.vscode/settings.json`**
（配的正是本仓的大括号换行风格），`ScriptCompiler` 也已有 `nativeAPI.openWithVSCode` 调用点
（现因 `supportNative = false` 不可用）。"用 VS Code 编辑项目文件"一直是既定意图，
只是之前靠"native 打开外部 VS Code"，现在改为"内置 Web 端"。

**推论（含需要废弃的资产）**：

| 资产 | 处置 |
|---|---|
| `src/ui/assets/EditorAsset.ts` / `AssetNode.ts`（资源树 UI） | 定位收窄为"资源导入 / 预览 / 与场景的引用"；纯文件浏览交给 VS Code |
| `packages/editor/packages/codeeditor`（Monaco 独立窗口） | **可废弃**——VS Code 自带编辑器；该子包现状本已不可用（不在 workspace、`files` 白名单不含 `packages/`） |
| `ScriptCompiler` 的 `nativeAPI.openWithVSCode` 分支 | 语义变为"在 VS Code Web 里打开该文件" |
| `src/vue-app/views/ProjectViewAdapter.ts`（自称临时适配层） | 随之重新评估 |

**一处必须解决的冲突**：`tsconfig.json` 的 `files` 现在**由编译器回写**
（`ScriptCompiler` 把全部 `ScriptAsset` 路径拼进去再写回，`:162-163`）。而 VS Code 直接读这个文件
——于是出现"**谁拥有 `files`**"的双写问题：用户在 VS Code 里新建 `.ts`，编辑器不一定登记为 asset。
建议改为 **`include` 通配**（如 `scripts/**/*.ts`），让双方都不必维护清单。见 §11 问题 13。

→ ✅ **已落地（2026-10-05，#275）**：模板 `tsconfig.json` 已改成 `include` 通配、去掉`files`，
并顺手去掉了 `outFile: "project.js"`（那条"把脚本合并成一个文件"的旧构建形态，D12 已改"项目自己构建"）。
改由门禁 `scripts/check-editor-project-shape.mjs` **两向**守着（"改对了"与"旧形态回来了"各判一次）。

### D12 游戏项目 = 标准 npm 工程（带 `package.json`，依赖 `feng3d` 等库）

**需求方确定**：游戏项目带有 `package.json` 并依赖 `feng3d` 等库；**构建在编辑器中执行**。

**项目形态的变化**（对照现状模板）：

| 维度 | 现状（`resource/template/`） | 目标 |
|---|---|---|
| 引擎来源 | **拷贝进项目**：`libs/feng3d.js`（2.29 MB）+ `libs/feng3d.d.ts`（555 KB） | **npm 依赖**：`package.json` 的 `dependencies: { "feng3d": "^x" }` → `node_modules/` |
| 附加能力 | `libs/cannon.js`（390 KB）+ `libs/cannon-plugin.js`（33 KB）拷贝 | 同上，作为依赖声明 |
| 类型提示 | 拷贝的 `.d.ts` + `tsconfig.json` **`include` 通配**（2026-10-05 起，原来是手工列举 `files`） | 从依赖包自动解析（VS Code 直接可用，D11） |
| 编译 | `tsc` 的 `outFile: "project.js"`（ES5 全局脚本合并） | **项目自己的构建**（默认模板给出，可替换） |
| 构建执行者 | 编辑器内的 `ScriptCompiler`（浏览器里跑） | **编辑器调用项目构建**（服务端子进程），日志与进度经 WebSocket 推给界面 |
| 独立性 | 半独立（自带 libs，但构建依赖编辑器） | **完全独立**：`npm install && npm run build` 即可 —— D10 的硬要求 |

**推论**：
1. **模板体积骤降**：项目骨架不再携带 ~3.5 MB 引擎拷贝；编辑器 npm 包里那 **64 MB 资源**
   （`resource/` + `projects/*.feng3d.zip`）也随之有压缩空间。
2. **离线场景要交代**：依赖走 npm → 首次创建项目需要网络或本地 registry 缓存。这是取舍
   （换来标准工程与可管理的版本）。
3. **构建入口的约定**：编辑器**不硬编码构建工具**，约定调用项目的 `npm run build`
   （可在 `feng3d.project.json` 里覆盖）。"用什么构建"是项目自己的事。
4. **新增一个校验点**：项目 `package.json` 声明的 `feng3d` 版本，与编辑器 `apiVersion`
   隐式绑定的引擎范围**必须可校验**——否则会出现"插件校验通过、但项目里的引擎与编辑器不匹配"。
   这是"三端共用编辑器 `apiVersion`"（D4）的代价在**项目层**的延伸。见 §11 问题 15。
5. **构建日志是流**：构建可能几十秒到几分钟 → 走 §6.7 的长任务协议（`taskId` + 进度 + 日志事件）。

### D13 公网服务端 = **远程接入中继**（不是云编辑器）

**需求方确定**：需要 editor 的服务端并**挂在公网**，让用户通过公网网页操作**自己电脑上**的 editor。

| 项 | 结论 |
|---|---|
| 定位 | 项目数据、构建、算力**都在用户机器上**；公网服务端只做**接入 / 身份 / 授权 / 转发** |
| 与 POSITIONING 的关系 | [POSITIONING.md](../../../docs/POSITIONING.md) §5 把"**云编辑器与托管服务**"列为非目标，指的是"**数据与算力在云上**"（PlayCanvas 商业形态）。**本决策不违背它**，但必须**更新 §5 的表述**，否则"公网服务端"会被误读成云编辑器（见 §10） |
| 连接方向 | 用户机器在 NAT / 防火墙后，**不能被主动连入** → **本地 Node 主动建立出站长连接**（WSS）到服务端。无需公网 IP、无需端口映射 |
| 协议 | **本地那条 WebSocket 协议（§6.7）原样穿过中继**——服务端只转发帧、不解析业务语义。于是本地直连与远程接入**共用一套协议与同一份命令层** |
| 身份 | 账号 + **设备配对**（用户绑定自己的机器），授权粒度到设备；token 需要生命周期与吊销机制 |
| 加密 | 传输层 WSS；应用层建议 **E2E**——否则"公网服务端能读用户全部项目文件"是产品级风险。见 §11 问题 19 |
| 降级 | **本地直连（`127.0.0.1`）始终可用且是默认路径**（D7）；远程是叠加能力，服务端不可用不影响本地开发 |
| 多界面 | 远程时用户同样需要**文件树 / 脚本 / 终端** → VS Code Web 也得可达。见 §11 问题 18 |

**分层图因此多出最上面一层**：

```
┌─ 公网（新增，D13）────────────────────────────────────────────────┐
│  editor 服务端：接入 / 身份 / 授权 / **盲转发**（不解析业务、不存项目）│
└────────▲──────────────────────────────────────▲───────────────────┘
   出站 WSS（本地主动建连）                远程浏览器 WSS
         │                                      │
   用户本地机器                            用户远程浏览器
   （Node 宿主 + editor Web + VS Code Web）  （editor Web + VS Code Web）
```

**三条硬约束**：
1. **服务端不存项目数据、不执行构建**——它一旦开始存或算，就变成 POSITIONING §5 说的云编辑器了。
2. **连接必须由本地主动发起**（出站），这是唯一能穿透 NAT 的方向。
3. **本地直连能力不能因为远程而退化**（D7）：两者共用协议，但本地路径不依赖服务端。

---

## 4. 分层

```
┌─ L3 浏览器界面（两个并列，D11）───────────────────────────────────┐
│ ① editor Web（Vue 3 + Element Plus）：3D 场景搭建 / 属性配置 /      │
│    产物生成入口 / 插件管理 · feng3d + WebGPU · 场景数据权威副本(D2) │
│ ② VS Code Web：文件树 / 脚本编辑 / 终端 / Git / 搜索 / 类型提示     │
│    —— 直接读**同一个项目目录**，"文件系统"这一层由它负责            │
├─ L2 服务端 ↔ Web 端通道（**WebSocket**，双向，可缺席 D7）──────────┤
│  请求/响应（按 id 关联）· 事件推送 · 插件 Web 端资产分发 · 文件变更  │
├─ L1 本地 Node 进程（cordis）──────────────────────────────────────┤
│  插件树 / Service / Fiber.dispose / 事件                           │
│  ┌────────────┬─────────────┬──────────────┬──────────────────┐  │
│  │ 文件系统    │ 项目与工作区 │ 编译与发布    │ 命令层（D6）      │  │
│  │ (NodeFS)   │             │              │ UI/CLI/AI 共用    │  │
│  └────────────┴─────────────┴──────────────┴──────────────────┘  │
│  ＋ VS Code 服务端（code-server 类，D11）——与上面共享同一项目目录  │
├─ L0 已有内核（不因本架构改动）────────────────────────────────────┤
│  feng3d / filesystem / assets / objectview / serialization …      │
└───────────────────────────────────────────────────────────────────┘
```

**注意 L1 里是"两个并列的服务"**：editor 宿主与 VS Code 服务端**共享项目目录**，但**互不依赖**
——editor 不依赖 VS Code（缺它时 editor 照常工作，只是没有文件树/脚本编辑，正是 D7 的降级形态），
VS Code 也不依赖 editor（它只是打开一个普通目录）。两者的唯一契约是**磁盘上的项目文件**。

R1（依赖方向只向下）不受影响：宿主是新的**最上层**。
**新增包必须登记进 `scripts/check-layer-direction.mjs` 的分层白名单**
（`@feng3d/filesystem` 在 Layer 0）。

---

## 5. 项目结构

### 5.1 项目中已有的路径约定（由现有代码固定）

| 路径 | 依据 |
|---|---|
| `project.js` | `src/run.ts:34,43`——运行态加载的项目脚本入口。**模板 `tsconfig.json` 的 `outFile` 已去掉**（2026-10-05）：它不再是编译产物，只是模板里预置的一个静态文件 |
| `default.scene.json` | `src/run.ts:61`、`Editor.ts:102`——运行态读取 / 退出时写回 |
| `tsconfig.json` | `src/ScriptCompiler.ts:63`——脚本编译读它 |
| `resource.json` | `packages/assets/src/rs/ReadRS.ts:49`——资源树索引 |
| `Assets/` | `packages/assets/src/rs/ReadRS.ts:29`——资源根目录（**硬编码**） |
| 资源三通道 | `packages/assets/src/rs/FileAsset.ts:214-301`——主文件 / `${path}.meta` / `previews/{assetId}.png` |

**新建项目的模板文件清单**（现状内置在 `EditorRS.ts:9-22`，源文件在 `resource/template/`）：
`.vscode/settings.json`、`app.js`、`index.html`、`project.js`、`tsconfig.json`、
`default.scene.json`、`libs/*`（含 `libs/feng3d.d.ts` 555KB）。

> **`resource/template/` 就是形态 C 的雏形**：它的 `index.html:18-24` + `app.js:11-32`
> 已经实现了"独立运行"（加载并 `eval` `project.js`）——**这是发布功能的现成起点**，
> 不要从零设计。

### 5.2 目标目录布局（标注 新增 / 已有约定 / D12 变化）

```
my-project/                      # 标准 npm 工程（D12）：可脱离 editor 独立构建与运行
├── package.json            # 【D12 新增】dependencies: feng3d …；scripts: build / dev
├── tsconfig.json           # 【已有约定】类型检查配置（不再是 outFile 合并）
├── vite.config.js          # 【新增·默认模板】构建配置（可替换，编辑器不硬编码工具）
├── feng3d.project.json     # 【新增】编辑器元数据：名称 / 入口场景 / 启用插件 / 构建覆盖
├── scripts/                # 【已有约定】用户 TypeScript 脚本
├── scenes/                 # 【已有约定·可扩展】场景 JSON（default.scene.json …）
├── assets/                 # 【已有约定】资源（根目录名现状固定为 Assets）
├── plugins/                # 【新增·可选】项目级插件（三端形态）
├── node_modules/           # 【D12】依赖（不入库）
└── dist/                   # 【产物】构建输出（不入库；替代现状的 project.js）
```

**要点**：
- **`package.json` 是"项目是标准工程"的标志**（D12）：它让项目自己能 `npm install && npm run build`
  ——这正是 D10 要求的"脱离 editor 也能跑"。
- `feng3d.project.json` 是**编辑器元数据**（名字、入口场景、启用插件、构建命令覆盖），与
  `package.json` **职责不重叠**：前者给编辑器读，后者给 npm / 构建读。是否合并（把编辑器字段放进
  `package.json` 的自定义键）见 §11 问题 16。
- `node_modules/` 与 `dist/` 不入库；`feng3d.project.json` 与源码入库（D8）。
- 现状的 `libs/`（引擎拷贝）**不再需要**——由 npm 依赖取代（D12）。
- `IReadWriteFS` 里已有 `projectname` / `initproject` / `hasProject`
  （`packages/filesystem/src/IReadWriteFS.ts:13,74,79`）；迁磁盘目录形态时**这三个成员的语义要重定义**。
- 资源根目录名硬编码 `Assets`（`ReadRS.ts:29`）。是否允许改名属于资源身份问题（§11 问题 4）。
- **现状（2026-10-05，#274 P3 第一批）**：模板已含 `package.json` / `feng3d.project.json` /
  `vite.config.js` 三个文件，并由门禁 `scripts/check-editor-project-shape.mjs` **两向**守着
  （"模板里有" + "`templateurls` 列了"）。
  **`feng3d.project.json` 已经有服务读它并校验它**了（#274 P3：`bin/host/projectMeta.mjs` + `host.project.meta`；
  坏清单**指名报错**而不是静默当空项目，判据在 `scripts/check-editor-project-shape.mjs`）。
  **"新建"这一半也落地了**（#274 P3）：宿主方法 `host.project.new` 把模板整份复制进一个**空目录**，
  并把项目名写进元数据；门禁 `scripts/check-editor-workspace.mjs` 的判据是**闭环**——
  "新建 → `host.project.meta` 读通"（单独验"写了几个文件"证明不了它是个**编辑器项目**），
  外加"非空目录被拒"（不覆盖用户已有的东西）。
  **`--new` 这条命令也接上了**：先建骨架、再当项目打开（`--project` 是"打开已有的"，
  两者同时给会被拦下）。门禁另加了**接线判据**——"函数写在服务里、而 CLI 忘了接"这种情况，
  服务级判据**照样全绿**，所以接线要单独判一次。`open` / `recent` 两个命令仍待接。
  `package.json` 与 `feng3d.project.json` 属**用户所有物**——
  "升级项目"不覆盖它们（用户会自己改依赖 / 入口场景 / 构建配置）。
  **但目录布局本身还没迁**：场景仍在根目录（`default.scene.json`）、没有 `scenes/` / `scripts/` /
  `assets/` / `plugins/`，`libs/`（引擎快照）也还在——那些等 D12 的"用 npm 依赖取代 `libs/`"与后续批次。

---

## 6. 子系统

### 6.1 文件系统（NodeFS）

**现状（关键事实）**：
- `packages/filesystem` 有完整接口层：`IReadFS`（6 项）+ `IReadWriteFS`（自有 13 项），
  无路径拼接方法（拼接在包装层用 `@feng3d/path`）。
- `ReadFS` / `ReadWriteFS` 是**包装类**（逐方法转发），实例 fallback 两级链：
  `ReadFS.fs → FS.basefs`（`ReadFS.ts:13`）、`ReadRS.fs → FS.fs`（`packages/assets/src/rs/ReadRS.ts:22`）。
- **分发没有注册表/工厂，靠模块级副作用赋值**：`ReadFS.ts:96` `FS.fs = new ReadFS()`、
  `HttpFS.ts:96` `FS.basefs = new HttpFS()`——**这两处违反 R2**，而 R2 已有 CI 门禁
  （`scripts/check-module-side-effects.mjs --strict`）。**新增 NodeFS 时不要照抄。**
- `FSType` 只有三值 `http` / `native` / `indexedDB`（`FSType.ts:6-8`），**没有 node**。
- **编辑器选择 FS 的判据是硬编码 `false`**：`NativeRequire.ts:4` `supportNative = false`（全仓无赋值点）
  → 编辑器**现状永远是 IndexedDB**。选择点在 `EditorRS.ts:167-174`（**模块顶层**，R2 违规面）；
  `run.ts:19-24` 是唯一把 `FS.fs` 指向真实 `IReadWriteFS` 处（用 `as any` 绕类型）。
- `IndexedDBFS` 18 项接口全有实现、不抛错，但有 **10 处退化或类型不安全**，影响架构判断的：
  目录靠**哨兵字符串** `'!!!___directory___!!!'`（`:10`）；`getAbsolutePath` 恒等退化（`:141-144`）；
  `readdir` 可能返回 `undefined`（`:176-179`）；`copyFile` 不复制子项且**不发事件**（`:274-281`）；
  `deleteFile` 只删键不递归（`:217-222`）；纯读也用 `'readwrite'` 事务。
- `packages/filesystem` **没有任何 `.spec.ts`**（零测试）。

**目标**：新增 `NodeFS`，与 `IndexedDBFS` / `HttpFS` **并列**（不是替换）。

**阻塞问题**：
1. **接口绑定浏览器**：`IReadFS.readImage(): Promise<HTMLImageElement>`（`IReadFS.ts:33`）
   ——纯 `node:fs` 无法满足该签名。只有两条路：**(a)** 改接口（`ArrayBuffer`/`Blob`），
   或 **(b)** 浏览器代理 + 宿主 RPC。**无第三条路。**
2. 接入点共 14 处：`FSType.ts` 加 `node`、新增 `NodeFS.ts` 并在 `index.ts` 导出、
   `EditorRS.ts:167-174` 选择分支、`NativeRequire.ts:4` 判据、`run.ts:19-24` node 分支、
   **分层白名单登记**、`packages/filesystem` 补测试。
3. 现状 native 路径**是坏的**：`NativeFS.ts:263` `new NativeFS(nativeFS1)` 而 `:9` `nativeFS1 = null`
   → 一旦 `supportNative = true`，所有读操作空指针。**不能作为迁移起点。**

**可复用**：`packages/editor/packages/native/NativeFSBase.js`（已是 `fs-extra` 的 Node 实现，
接口与 `NativeRequire.ts:44-93` 一一对应）；`src/assets/NativeFS.ts` 的
"项目名+相对路径 → 绝对路径"适配器（`:101-109`，除 `readImage` 用 `new Image()` 外可整体搬）。

### 6.2 项目与工作区

**现状**：
- **没有 Project/Workspace 数据结构**。项目 = IndexedDB 的 objectStore（名字即项目名）；
  项目名是 localStorage 键 `feng3d-editor` 里的字符串（`Editorcache.ts:11,44-53`；缺省 `'newproject'`）。
- 新建/切换 = 改字符串 + `window.location.reload()`。导入/导出 = 整包 zip（**实现有缺陷**，§1.3）。
- 唯一形如项目状态的 pinia store（`vue-app/stores/projectStore.ts`）**是死代码**（全仓无引用）。
- 随包发布的只读示例项目：`packages/editor/projects/*.feng3d.zip`（5 个），被 `package.json` 的
  `files` 收录 → 编辑器 npm 包含 **64MB 资源**（`vite.config.js:192` 注释）。
  项目外置到磁盘后包体压力会缓解。

**目标**：`feng3d.project.json` + 工作区模型；`new` / `open` / `recent` 三个命令。
`initproject` / `hasProject` 从"改虚拟项目名"改为"**校验/初始化磁盘目录**"。

### 6.3 资源系统（EditorRS）

**现状**：`editorRS = new EditorRS()`（`EditorRS.ts:179`）是个**混合体**：
- **项目工作区半**：`initproject` / `createproject` / `upgradeProject` / `clearProject` /
  导出 zip / `importProject`（`:32-164`）；
- **资产系统半**：继承 `ReadWriteRS`，`init()` 读 `resource.json` 反序列化全部资源
  （`packages/assets/src/rs/ReadRS.ts:64-90`），落盘经 `rs.fs` 三条通道。
- 初始化时机：`Editor.ts:52` → `editorAsset.initproject()` → `editorRS.init()`。
- **注意**：`src/feng3d/`（场景层 24 个文件）**没有任何一个** import
  `editorRS` / `editorAsset` / `editorcache`——那是被动的场景/工具/视图层。

**目标**：**这个混合体是本次重定义的主要拆分点**——工作区半归宿主（§6.2），资产半留浏览器。
拆分边界需单独评估（§11 开放问题 5）。

### 6.4 脚本编译

**现状**：
- `src/ScriptCompiler.ts`（199 行，单例在**模块顶层** `:199`，经 `index.ts:54` 的 `export *` 级联
  ——R2 违规面）。流程：读工作区 `tsconfig.json` + 全部 `ScriptAsset`（`:60-83`）
  → 全局 `ts` 编译（`createProgram` → `reorderSourceFiles` 依赖拓扑排序 → `emit`，`:145-167`）
  → `editorRS.fs.writeString` 落盘（`:119-122`）→ `runProjectScript()` 执行。
- **编译实际不可用**（§1.3）：6.5MB 编译器本体未被加载且被构建排除；**且失败后仍弹"编译完成"**
  （`:127-132` 只 `console.log`，无条件 `ElMessage('编译完成！')`）。
- **类型检查不存在**（无 diagnostics 调用）。
- 自定义 `CompilerHost` 是**内存 + 扁平模型**：`readFile(){return ''}`（`:192`）、
  `fileExists` 只看内存表（`:188-191`）——**不做模块解析**，靠 `outFile` 合并成单文件。
- 依赖拓扑排序算法在 `packages/editor/packages/typescript/src/typescriptSorting.ts`（753 行，
  纯 TS API 逻辑、**无 DOM**）——**可复用，但要改 ESM 并校正 TS 3.0 内部 API**。

**目标（按 D5 / D12 修订）**：**"编辑器的编译器"这一角色整体取消**——`ScriptCompiler`
不是要修好、而是要**删除**的组件（§1.3 已证其不可用：编译器本体从未加载、失败仍报成功）。
编辑器改为**调用项目自己的构建**；自身只在 `new` 项目时提供默认模板（`tsconfig.json` +
构建配置），并提供"构建"命令的 UI 与日志展示。

**可复用性**：`typescriptSorting.ts`（753 行依赖排序）只在**旧式全局脚本合并**（`outFile`）
下才有意义；若默认模板改用现代构建（vite / rollup），它大概率**不再需要**——见 §11 问题 17。
类型检查随之回到项目自己的构建链（`tsc --noEmit` 或构建器的类型插件）。

### 6.5 构建与发布

**现状**：
- **项目级构建/发布不存在**。只有"编辑器自身的构建"：`vite build` 双入口
  （`index.html` / `run.html`，`vite.config.js:174-177`），产物落 `public/` 交给 `bin/serve.mjs`。
- 形态 C 的**可用起点是 `resource/template/`**（`index.html` + `app.js` 已实现独立运行）。
- **npm 发布版是残的**：`package.json` 的 `files` 白名单（`:35-44`）=
  `bin/public/src/projects/resource/favicon.ico/index.html/run.html`，
  **不含 `libs/`（Monaco + 6.5MB TS 编译器）与 `packages/`（codeeditor）**。
  而源码仍会 `window.open('packages/codeeditor/codeeditor.html')`（`ScriptCompiler.ts:43`）
  → 发布版打开脚本必然 404 回落。
- `bin/serve.mjs` 是零依赖静态服务器（316 行，无业务逻辑）。

**目标（按 D5 / D12）**：
- **构建定义在项目里**：项目自带 `package.json` 的 `scripts.build` 与构建配置；编辑器
  **不硬编码构建工具**，约定调用项目的 `npm run build`（可在 `feng3d.project.json` 覆盖）。
- **编辑器负责**：触发、把**日志与进度流式推给界面**（§6.7 长任务协议）、构建失败时**如实报错**
  ——现状的反面教材正是"编译失败仍弹编译完成"（§1.3）。
- **`publish`** 在此之上产出可分发形态：按**决策 A** 把项目启用的插件 runtime 端打入产物（D4）。
- **`resource/template/` 的角色变化**：从"随包分发的项目骨架（含引擎拷贝）"变为
  **`new` 项目时的模板源**——D12 后模板不再携带 `libs/`，改为写出 `package.json`（依赖 `feng3d`）。

**前置**：**先修 `run.ts` 与 `resource/template/app.js`**——运行形态跑不起来，
"构建/发布"就没有可验证的目标。这是 §8 分期里优先级最高的一项（P0）。

### 6.6 插件系统（triple-half + slots；前两端照搬 DSH）

**现状（editor）**：
- **Web 半已成型**：清单 / 注册表 / 启用禁用 / 层叠加 / 版本契约齐备
  （`src/plugins/*`，见 [PLUGINS.md](PLUGINS.md)）。
- **宿主半不存在**；插件只在构建期装载。
- 贡献点是**写死的五类**（`panels` / `sceneOverlays` / `logics` / `objectView` / `bridgeMethods`，
  `types.ts:129-145`）——加一类贡献点要改核心类型。
- patch **只能覆盖、不能新建**（JSON 给不出视图 loader 与 Logic 类）。

**DSH 的做法**（本地包实测：`@deepseek-ai/*` 0.1.5-rc.3，就在 npx 缓存的 `node_modules` 里，可直接复核）：

| 环节 | 机制 | 证据 |
|---|---|---|
| 声明 | `package.json` 的 `dsh` 字段，**一个包可声明多个角色**：`bundle.patch` / `profile.bundles` / **`client`** / `configTrees` / `sessionFormatMigration` | `dsh-package-manifest/lib/types/types.d.ts:7-52` |
| client 声明字段 | `platform`（Web 消费者选 `web`）、`inject`（**包名依赖，非 cordis 服务注入**）、`immediately`（phase-one 注册屏障）、`external`（超出基线的精确模块请求） | 同上 `:39-52` |
| 双入口 | `"."` 宿主半 + `"./client"` Web 半；`files` 只发 `lib/index.js` + `lib/client.js` + 类型 | `dsh-client-ui-sidebar/package.json:16-27,61-65` |
| Web 半的形态 | **cordis 插件**：`apply(ctx: ClientContext)` + `export const inject: string[]` | `dsh-client-ui-sidebar/lib/types/client/index.d.ts:1-17` |
| UI 贡献点 | `SlotMap` 模块增强：`kind: 'single' \| 'list'`、`scope`、`owner` props 接口；注释写明 **declaring is claiming** | `dsh-client-ui-sidebar/lib/types/client/contract/slots.d.ts:14-75` |
| 插槽服务 | `SlotRegistry extends Service`（cordis 服务）：`SlotCore` 管注册语义 / 声明账本 / 加载期校验 / **卸载级联**；本层管活应用——`slots/changed` 事件桥、**经调用方 `ctx.effect`** 的注册与声明注入、渲染器 `install()` / `renderSlot('root')`、store 实例轴 | `dsh-client-ui-renderer/lib/types/client/registry.d.ts:1-100` |
| 依赖插槽 | `inject(key, callback)`：等插槽声明出现再装 effect，**属调用方 fiber**，插件卸载会取消等待并移除贡献 | 同上 `:85-100` |
| 兜底与观测 | `onEntryError`（条目渲染崩溃监督，带 `abdicated`）、`snapshot()`（JSON 安全声明树）、`subscribe` / `getVersion`（uSES 配对） | 同上 `:155-203` |
| 装载 | 宿主把**入口图**注入 `window.__DSH_BOOT__`（`entries` / `batches` / `rev`）；浏览器侧 `dsh-client-modules` 是 **lazy-CJS 模块表**，被 **vendored cordis Loader 通过 `internal` 契约**消费（`EntryTree.import → internal.import`）——fiber 生命周期 / inject 等待 / 更新刷新全在 cordis 侧，它只管"代码怎么到达" | `dsh-client-modules/package.json:3`、`lib/types/client/manifest.d.ts:1-30,208-246` |
| HMR | `invalidate(id, rev)` + `prefetch`（`immediately` 标记 phase-one 预取） | 同上 `:208-246` |
| UI 自身分层 | `ui-renderer` / `ui-layout`（三栏 AppFrame + **client 侧 `ctx.layout` 服务**）/ `ui-slots` / `ui-primitives` / `ui-theme` / `client-store`（`ObservableSnapshot`） | 各包 `package.json` 的 `description` |
| 自举 | **插件管理界面本身也是插件**：`dsh-client-ui-settings-plugins`、`dsh-client-ui-settings-plugin-inventory` | 包名清单（55 个包带 `client` 声明） |

**一个值得照搬的实用语义**：`root` 是 `single` 插槽，**不要往里注册**——第二个条目不会并排，
而是**遮蔽**已发布的那个，且动态注册的条目优先级更低因而"赢"，结果是页面只渲染你的组件、
frame 声明的所有座位全消失。要浮层请注册到 `shell.overlay`（`list` 插槽：可加、点击穿透）。

**目标（editor）**：
- 宿主半由 cordis 承载；Web 半按上表模型装载（`__DSH_BOOT__` 式入口图 + 浏览器模块表）。
- 贡献点从"五类写死"演进为 **slots 契约**——但必须与现有 `EditorPluginManifest` 做兼容设计：
  清单 / 层叠加 / 启用禁用是已验证资产，**平移而非重写**。
- patch 的"只能覆盖、不能新建"限制随之解除（宿主能真的 `import()` 插件包）。
- 组件层保持 **Vue 3**——DSH 是 React，**只搬机制不搬组件**。

#### 第三端：游戏项目端（DSH 无对应物）

**为什么必需**：feng3d 是"编辑格式 = 运行格式"（D1）——场景 JSON 里的 `__type__` 需要
**两端都注册对应 Logic**。而现在 editor 的 `logics` 贡献点只注册到**编辑器**的引擎注册表
（`src/plugins/install.ts` 的 `registerLogic`）；导出的项目跑起来时缺了同样的注册，
`logic()` 就返回 `null`、该组件没有行为。**所以只要插件引入了新类型，第三端就不是可选项。**

**现状基线**：`packages/editor/resource/template/` 已经是项目端的完整形态：

| 文件 | 大小 | 说明 |
|---|---|---|
| `libs/feng3d.js` | 2.29 MB | **项目端自带一份完整引擎** |
| `libs/feng3d.d.ts` | 555 KB | 项目脚本的类型支持 |
| `libs/cannon.js` / `cannon-plugin.js` | 390 KB / 33 KB | 物理能力（运行时用） |
| `app.js` | 1488 B | 运行入口：`View` + `rs.init` + 加载 `project.js` + 读 `default.scene.json` |
| `project.js` | **0 B** | 用户脚本的编译产物（起始为空，由编译填充） |
| `default.scene.json` / `default.scene.legacy.json` | 2407 B / 1563 B | **新旧两套场景格式并存** |

**注意**：`app.js` 用的是**旧 API**（`feng3d.rs.init(cb)` 回调风格、`readString(path, (err, content) => …)`、
`view.scene`），与当前 feng3d 范式不符——**它与 `run.ts` 的 `initProject()` 一样需要重写**（§1.3、§8 P0）。

**边界约束（硬性）**：runtime 端**只能依赖引擎 API（feng3d），禁止依赖编辑器 API**，
否则游戏产物会拖进整个编辑器。这与 DSH 对 client 半"不能 import node 模块"是同类约束。

**装载方式：已决策为 A（构建时打入）**——`build` / `publish` 时把**该项目实际启用的插件**的
runtime 端产物合并进游戏 bundle（未启用的不参与）。推论：

- 产物**自包含**、可离线运行——与"游戏端不连 WebSocket"是同一条设计（见下文「两条通道」）；
- **运行时装插件不改变游戏端行为**：游戏端要重新构建才生效。这是 A 的已知取舍，选它换来的是
  离线可跑与可 tree-shake；
- 打入哪些插件由**项目启用状态**决定 → `src/plugins/state.ts` 的开关必须参与构建流程；
- runtime 端产物**必须可 tree-shake** → 不得有模块级副作用（正好与 R2 同向；可复用
  `scripts/check-tree-shaking.mjs` 的产物断言思路）。

被否决的 **B**（运行时按清单 `import()`）：换插件不必重建，但要处理版本、可用性与加载失败，
且产物不再自包含。

**契约：已决策为三端共用编辑器 `apiVersion`**（插件只声明一处）。已知代价：编辑器 API 与
引擎 API 是两条演进速度不同的线，共用版本号等于**编辑器承诺"同版本内引擎也兼容"**——
因此引擎依赖发生变化时必须**同步动 `EDITOR_PLUGIN_API_VERSION`**（已列入 §10 纪律）。

#### 三端之间的**两条**通道（不要混为一条）

| 通道 | 连接 | 形态 |
|---|---|---|
| **实时通道** | 编辑器 Node 端 ↔ 编辑器 Web 端 | **WebSocket**（D9）：调用、进度、事件、取消 |
| **产物通道** | 编辑器 → 游戏项目端 | **文件级契约**（构建产物）。游戏端**不连** WebSocket——它离线运行，只读产物 |

**这条区分很重要**：三端不等于"三个 WebSocket 客户端"。游戏端是**产物**，与编辑器之间是
"构建时写入、运行时读取"的文件契约；把游戏端也接进实时通道，会让产物依赖编辑器的存在。

#### 实例：寻路插件的三端切分

以"寻路插件"为例，三端各自的职责与**现状对照**：

| 端 | 该做什么 | 现状 |
|---|---|---|
| **Node 端** | 烘焙导航网格（重计算）、写出产物文件 | **不存在**。算法在 Web 端，但**是纯算法**：`Recastnavigation.ts`（288 行，体素法）只依赖 `Box3`/`Vector3`/`Triangle3`/`mathUtil`；`NavigationProcess.ts`（774 行，三角形法）自述"纯算法，非组件"；`ThreeBSP.ts`（14.5 KB，CSG 布尔法）。**三者都可直接搬到 Node** |
| **Web 端** | 参数面板 + 触发烘焙 + 进度显示 + 结果预览 | **部分存在**：`Navigation` 组件的属性面板已暴露 `NavigationAgent` 的 `radius` / `height` / `stepHeight` / `maxSlope`；**缺**触发、进度与取消 |
| **游戏端** | 加载导航网格数据、寻路查询、Agent 移动 | **不存在**（编辑器插件不贡献 runtime 端） |

数据流：

```
Web 端（设参数）── WebSocket call ──▶ Node 端（烘焙，长任务）
                                         │ 写出
                                         ▼
                              assets/navmesh/*（项目内产物文件）
                                         │ 构建时打入
                                         ▼
                              游戏端（加载数据 + 寻路查询）
Web 端 ◀── WebSocket event（进度 / 完成）── Node 端
```

**长任务必须有协议**（烘焙可能几十秒）：`call` 返回 `taskId` → `event` 推 `{ taskId, progress, stage }`
→ 支持**取消** → 完成后写文件并发事件让 Web 端刷新资源树。这也说明 D9 选 WebSocket
（而不是"一次 HTTP 往返"）在这里是**必需**的：进度推送没有拉模型的位置。

**三个可直接落地的观察**：
1. `NavigationProcess.ts` 自述"编辑器内部当前**没有消费方**"——它是现成的搬 Node 候选。
2. 该插件的两份算法（体素法 / 三角形法 + CSG）**都在编辑器侧**，说明现在"生成"是在编辑器里算的；
   按三端它应该移到 Node 端（可多进程、不卡 UI、能直接写文件）。
3. `Navigation.ts:61-62` 记载旧字段 `HideFlags.DontSaveInBuild`（**构建时不保存**）迁移后**无替代**
   ——旧设计在**数据层**就有三端边界的表达，迁移时丢了。见下。

#### 数据层的三端边界（别只把它当打包问题）

三端不只是"代码怎么打包"，还是"**数据怎么过滤**"。场景 JSON 里存在编辑器专用的对象
（地面网格、gizmo、导航可视化…），它们**不该进产物**。现状是靠"编辑器对象挂在 `editorViewRoot` 下"
隐式区分（AI 桥接文档里记过：路径式 id 只覆盖游戏场景，编辑器层对象寻址不到）。

`HideFlags.DontSaveInBuild` 的丢失说明这套显式表达曾经存在。三端架构需要把它补回来，候选做法：
插件在清单里声明"哪些组件 / Logic 只属于编辑器、不进产物"，构建时据此过滤。
**这条需要与 D1（编辑格式 = 运行格式）一起设计**——过滤规则也是数据的一部分。

> ✅ **已决策（2026-10-02）**（[#267](https://github.com/feng3d-labs/feng3d/issues/267) 决策 7）：
> 走"**插件清单声明 + 构建时过滤**"——插件声明哪些类型 / 组件只属编辑器，构建时据此过滤；
> 兜底明确为"**未声明＝进产物**"（"默认丢弃"是危险默认）。不恢复引擎侧的 `hideFlags`。
> 事实基础（`HideFlags.DontSaveInBuild` 已成孤儿导出、5 处代码注释记着"无替代"、编辑器层对象靠
> `editorViewRoot` 名字隐式区分）与三个候选（恢复引擎字段 / 插件清单声明 / 维持隐式约定）的取舍，
> 见 [PLUGIN_TRIPLE_HALF.md](PLUGIN_TRIPLE_HALF.md) §4。落地时需补一条可执行门禁
> （扫 runtime 端依赖闭包，出现编辑器 API 即失败），对齐 §15 的元规则。

### 6.7 命令层与通信（服务端 ↔ Web 端 WebSocket）

**职责**：一套命令，供 Web 端 / CLI / AI 共用（D6）；服务端与 Web 端之间走 WebSocket（D9）。

**现状**：
- 命令表已存在：`EditorBridge` 方法表（`src/bridge/read/*`、`bridge/write/*`，含 `scene.export`），
  但它**挂在浏览器侧**，宿主没有命令层。
- 通道是 **dev-only**（`bridge/vitePlugin.mjs` 的 `apply: 'serve'`）且为**单向拉模型**
  （Web 端每 100ms 轮询 `/pending`）。**没有项目级导出/构建方法**。
- MCP server 是 `scripts/editor-mcp-server.mjs`，由 DSH 经 `cordis.patch.yml` 装配。

**目标结构**（三件事分离，这是本节的关键）：

```
  Web 端（浏览器）──────── WebSocket ────────┐
                                             │
  CLI / MCP / DSH ────── HTTP（或 WebSocket）┼──▶ 命令层（服务端）
                                             │       │
                                             │       ▼
                                             └──  服务：文件系统 / 项目 / 编译 / 发布 / 插件
```

**命令层只有一份**，与传输无关；`session` 概念取代现状的"页面轮询"。

> **游戏项目端不在此图内**：它是**产物**，与编辑器之间走**文件级契约**（构建产物），
> 不连 WebSocket。详见 §6.6「三端之间的两条通道」。

#### 协议设计（草案，P2 落地前需定稿）

| 项 | 设计 |
|---|---|
| 握手 | Web 端连上后发 `hello`（`clientId` / 编辑器 API 版本 / 能力位）；服务端回 `welcome`（服务端版本 / 可用命令数）。**版本不兼容时服务端应拒绝并说明**（沿用 `apiVersion.ts` 的契约风格） |
| 信封 | `{ id?, type, ... }`；`type ∈ { hello, welcome, call, result, event, task, error }` |
| 请求 / 响应 | Web 端发 `{ id, type: 'call', method, params }`，服务端回 `{ id, type: 'result', ok, result \| error }`。**按 `id` 关联**，取代现状的长轮询 |
| **长任务** | `call` 立即返回 `taskId` → 服务端用 `event` 推进度（`{ taskId, progress, stage }`）→ 支持取消。寻路烘焙这类几十秒的任务靠它（§6.6 实例）——**这正是 WebSocket 相对"一次 HTTP 往返"的必要性所在** |
| 事件推送 | 服务端发 `{ type: 'event', event, payload }`（无 `id`）：文件变更、插件装载/卸载、编译进度、服务状态。这是**新增能力**——现状是纯拉模型，宿主无法主动通知 |
| 多客户端 | 每个 WebSocket 连接天然唯一 → 现状那个"同名多开、请求可能落在任意页面"的坑（`vitePlugin.mjs` 用来源端口区分）**自动消失**。需要明确：**多开时命令发给谁**（建议默认广播事件、命令定向到当前活动页面） |
| 重连 | 编辑器状态在浏览器（D2），服务端无会话状态 → 断线重连只需重放 `hello`，不丢数据。**重连期间的操作要排队还是失败，需明确** |
| 订阅 | 事件是否默认全推、还是按 `subscribe` 白名单——影响大项目下的流量 |

**分工（重要，不要误解为"一切都走 WebSocket"）**：WebSocket 承载**控制与事件**
（命令调用 / 结果 / 状态推送）；**静态资产仍走 HTTP**——插件 UI 的 ESM 文件、资源预览图、
项目文件下载等（大文件、可缓存、要用浏览器原生 `import()`）。
这是有意的分工，不是两套架构：两者由**同一个服务端**提供、共享**同一份命令层**。

#### 两个必须解决的问题

**① 服务端的 WebSocket 实现从哪来。** Node **不内置 WebSocket 服务端**
（`node:http` 只到 HTTP/1.1 升级握手；Node 22+ 的全局 `WebSocket` 是**客户端**）。
选项：

| 选项 | 评价 |
|---|---|
| 引入 `ws` | Node 生态最成熟、无原生依赖、纯 JS。**建议**。注意根 `.npmrc` 是 `save-exact` + `save-dev` |
| 手写 RFC 6455 握手 + 帧解析 | 现状注释认为"收益不抵风险"；改决策后要重新评估，但仍不划算 |
| 用 Vite dev server 的 HMR 通道 | **仅 dev**，生产形态没有——与本架构"dev/生产一致"的目标冲突，排除 |

**② 现有 HTTP 工具链怎么迁移。** 现状**全部**验收工具建立在 HTTP + 轮询之上：
`scripts/editor-bridge-base.mjs`、`editor-bridge-cli.mjs`、`editor-bridge-smoke.mjs`（98KB）、
`editor-bridge-fuzz.mjs`、`editor-bridge-scenario.mjs`、`editor-e2e-scene.mjs`、
`editor-bridge-stress.mjs`、`editor-plugins.mjs`、`editor-bridge-page.mjs`、
`editor-mcp-server.mjs`，以及 CI 的 `editor` / `editor-e2e` job。

| 迁移策略 | 内容 | 代价 |
|---|---|---|
| **A（建议）** | 服务端**同时**提供 WebSocket（给 Web 端，D9）与 HTTP（给 CLI/MCP/脚本），两者共享同一命令层 | 两套传输的维护成本；但 **P2 期间 CI 与 15 个脚本零改动** |
| B | 全量迁 WebSocket，同步改上述脚本（Node 22+ 有内置 `WebSocket` 客户端可用） | 一次性大改 + CI 同步；收益是只剩一套传输 |

建议 **P2 走 A**（先让架构成立且不弄红 CI），把"收敛到 B"留给 P6/P7 评估。

#### 安全（必须在 P2 就解决，不能后置）

**WebSocket 握手不受浏览器同源策略约束**——任意网页都能向 `ws://127.0.0.1:<port>` 发起连接。
在"本地工具 + 能读写项目文件 + 能执行插件代码"的场景下，这意味着**恶意网页可能操作本地文件**。
最低要求：

1. **校验 `Origin` 头**，只接受编辑器自身的源；
2. 或**一次性 token**：服务端启动时生成，注入 Web 端页面，握手首条消息校验；
3. **绑定 `127.0.0.1`**，绝不 `0.0.0.0`；
4. 校验 `Host` 头，防 DNS rebinding。

> 现状的 HTTP 桥接同样暴露本地端口，但它的攻击面是"显式调用"；WebSocket 是长连接 +
> 事件推送，**一旦被连上就是持续通道**，因此这条不能只当作后续优化项。

### 6.8 UI 层

**现状**：Vue 3 + Element Plus（`src/vue-app/`，121 个文件），旧 UI 层（`src/ui/`）并行存在。
**与宿主化相关的耦合**：`src/vite-entry.ts:18-23` 把 editor 与 feng3d 挂到 `window`，
并在 `:41-88` **覆盖 `ClassUtils.getDefinitionByName`**，找不到类时回退到 `window.feng3d`
命名空间——这是反序列化"按类名找类"的机制。宿主侧若需反序列化，需要等价且不依赖 `window`
的类注册表（§11 开放问题 6）。

**目标（按 D11 重新界定职责）**：editor Web **不再做文件管理**——文件树、脚本编辑、终端、Git、
全局搜索交给 **VS Code Web**；editor Web 专注 **3D 场景、属性配置、产物生成入口、插件管理**。
受影响的面板：资源管理器（`@feng3d/editor-plugin-project`）定位收窄为"资源导入 / 预览 / 引用"，
内嵌代码编辑器（`packages/editor/packages/codeeditor`）**可废弃**。

**仍需保留的能力**：面板 / 浮层的来源从构建期清单变为可运行时注册（slots 契约，§6.6）。

**待定**：editor Web 与 VS Code Web 的**界面关系**——两个并列页面 / 一方嵌入另一方 /
把 editor 的场景视图做成 VS Code 的自定义编辑器（Custom Editor API）。见 §11 问题 14。

### 6.9 设置与配置

**现状**：**已成型**——`editor.patch.json` 用户覆盖层 + 插件开关（localStorage
`feng3d-editor-plugins`）+ 内置/插件/用户三层叠加（见 [PLUGINS.md](PLUGINS.md)）。
浏览器侧 localStorage 另有 5 个键（主题 2、语言 1、桥接写开关 1、缓存 1）。

**目标**：与 DSH 的 profile/patch 语义对齐；**项目级配置**（进 `feng3d.project.json`）
与**用户级配置**（全局）分开，并明确优先级。

### 6.10 编辑器自带子包（`packages/editor/packages/`）

| 子包 | 是什么 | 状态 |
|---|---|---|
| `native/` | `NativeFSBase.js`（96 行，`fs-extra` 的 Node FS 实现）+ package.json | ✅ **已删除**（2026-10-05，决策 §11-9）：那条"页面直连 Node fs"的路已由 **HostFS（经宿主）**取代，且它本来就走不通（`nativeFS1 = null`）。同批删掉了 `src/assets/NativeFS.ts` / `NativeRequire.ts` 与 `supportNative` 判据 |
| `typescript/` | `typescriptServices.ts`（40 行旧 TS 补丁）+ `typescriptSorting.ts`（753 行依赖排序）+ `dist/index.js` | ✅ **已删除**（2026-10-05，§11-9/10）：全仓 0 引用；决策 4 = vite、构建走项目自己的 `npm run build`，这段自研排序随之结案 |
| `codeeditor/` | `codeeditor.html` + `codeeditor.js`（Monaco 独立窗口） | **全浏览器**（`window.opener`、AMD、DOM）；`private: true`；**D11 后可废弃**（VS Code 自带编辑器，见 §6.8） |
| `editor/` | — | **空目录**（只有一个 0 字节 `.verify-color`），无 package.json、无入口 |

**它们都不在根 workspaces 内**：根 `package.json` 声明的是 `packages/*`（不递归），
且 `packages/editor/package.json` **没有 `workspaces` 字段**
——与 [AGENTS.md](../AGENTS.md) 的声称不一致。后果：**既不参与安装，也不参与发布**。

---

## 7. 现状债务清单（重定义的起点）

| # | 项 | 证据 |
|---|---|---|
| 1 | ~~**脚本编译实际不可用**（编译器本体未加载 + 失败仍报成功）~~ ✅ **已结案（2026-10-05，#275）** | 曾：`ScriptCompiler.ts:127-132`、`vite.config.js:199-200`。现：编辑器内的编译器**整体删除**（决策 4 = vite、构建交给宿主跑项目脚本），"失败如实"由宿主侧 `check-editor-project-build.mjs` 守着 |
| 2 | ~~**类型检查不存在**~~ ✅ **同批结案** | 曾：`ScriptCompiler.ts:167`（只有 `emit`）。编辑器不再承担编译/类型检查 |
| 3 | **zip 导入/导出回调永不执行** | `EditorRS.ts:122`、`:152` |
| 4 | ~~**运行预览被整体注释**~~ ✅ **已修（#271）** | 曾：`src/run.ts:52-81`；现：重写为"纯数据场景 → `logic(view)` → WebGPU 提交循环" |
| 5 | ~~native 能力被**硬编码关闭**~~ ✅ **已删除（2026-10-05，#274）** | 曾：`NativeRequire.ts:4,9`、`NativeFS.ts:9` |
| 6 | ~~打开 native 开关**必然空指针**~~ ✅ **同批消失** | 曾：`NativeFS.ts:263` + `:9`（整条 native 路径已删） |
| 7 | ~~Node 侧 FS 实现**写好未接入**，且入口文件不存在~~ ✅ **已删除** | 曾：`packages/native/NativeFSBase.js`、其 `package.json`（该子包已删） |
| 8 | ~~npm 发布版**缺 libs/ 与 packages**，而代码仍指向它们~~ ✅ **已修（#277）** | 曾：`files` 不含 `packages/`，而 `ScriptCompiler.ts` 会 `window.open('packages/codeeditor/codeeditor.html')` → **发布版必 404**。现：白名单加上 `packages`，并补了执行者 `scripts/check-editor-publish-files.mjs`（`release:dry-run` 看不到这类路径）。按 D11，codeeditor 的职责最终交给 VS Code Web，届时这条引用会被删 |
| 9 | 死代码 store | `projectStore.ts`、`uiStore.ts`（全文件无引用） |
| 10 | 布局持久化**不存在** | `Editorcache.ts:21` `viewLayout` 只有声明 |
| 11 | 传统 UI 模块系统残留 | `Modules.ts:15,24` 只有 `console.warn` |
| 12 | ~~旧网络客户端残留（硬编码 6502 端口、用户名写死）~~ ✅ **已删除（2026-10-05，#280）** | 曾：`src/net/client.ts`（仅被 `src/index.ts` re-export、无调用点）。多人协作（P9）**尚未立项**——一致性模型的候选与代价见 §11 问题 23（**待拍板**）；真要实现时重新写，不复活这段。**这段"不复活"由门禁 `scripts/check-editor-dead-code.mjs` 守着**（在此之前它只是一句文档纪律） |
| 13 | 菜单未实现项 | `CommonConfig.ts:36-52`（新建/打开场景）、`:310-350`（对象菜单为空）、`:414-421` |
| 14 | 旧类残留（TextureCube / Texture2D 已移除） | `EditorAsset.ts:243-249,461-465`、`OAVPick.vue:95,109` |
| 15 | 临时适配层自称 | `ProjectViewAdapter.ts:1-36`「⚠️ 临时适配层」 |
| 16 | **两份同名 FS 源码** | `src/filesystem/` 与 `packages/filesystem/src/`（**未确认**，见 §11） |

**处置原则**：#1–#4 是主形态的**必经路径**（修好或明确删除）；#5–#8 决定"本地工具"能否成立；
#9–#15 是清理项，在对应分期顺手删；#16 必须先查清再动。

---

## 8. 分期

原则与 ARCHITECTURE_V2 §4 一致：**护栏先行、每期独立可验收**。

> **GitHub 追踪**：本表已建为里程碑 [#8 editor v2](https://github.com/feng3d-labs/feng3d/milestone/8)；
> P0–P10 对应 issue **#271–#281**，开工前决策清单 **#267**，文档同步 **#268**，总纲 **#266**。
> 相关历史 issue：**#97**（编辑器收回评估——本方案即其结论）、**#41**（本地服务器需求原型）、
> #33（vscode-3dviewer）、#37（项目内托管）、#38（第三方库）。

| 期 | 目标 | 关键交付 | 验收（可机器验证） |
|---|---|---|---|
| **P0 修链路** ✅ **三条均已成立（2026-10-02）** | 让"编译 / 项目往返 / 运行"三件事至少两件成立 | 修 `EditorRS.ts:122,152` 的 zip 缺陷；重写 `run.ts` 的 `initProject()`；编译给出**真错误**而非假成功 | zip 导出→导入**往返等价**；示例项目能被 `run.html` 加载并渲染（e2e 断言像素非空）；编译失败时**不再**报"编译完成" |
| **P1 契约与骨架** | 定 cordis 线；宿主进程骨架 | `bin/serve.mjs` 长成宿主；宿主门禁 | 宿主能起停、报版本；门禁进 CI |
| **P2 通信层** | WebSocket 双向（D9）、dev 与生产一致、可缺席（D7）、**安全校验** | 服务端 WebSocket 实现 + 命令层；迁移策略 A（HTTP 并存） | ① Web 端与 CLI 同时可用；② **现有 `editor-bridge-smoke.mjs` 与全部 e2e 脚本不改也能跑**；③ 跨源 `Origin` 被拒（负例测试） |
| **P3 文件系统与项目** | 目录即项目；NodeFS；**接入 VS Code Web**（D11） | `FSType.node`、`NodeFS`、`feng3d.project.json`、`new`/`open`；VS Code 服务端与项目目录打通 | ① 项目读写往返测试；② `new` 出的骨架能被 `run.html` 加载；③ **VS Code Web 打开同一目录**能看到文件树、脚本有 `feng3d.d.ts` 类型提示 |
| **P4 编译** | TS → `project.js` 搬到宿主 | 编译服务 + 类型检查 | 编译产物与预期**行为等价**；类型错误可报 |
| **P5 插件（三端）** | 三端形态：Node 端 + Web 端 + **游戏项目端**；运行时装 | cordis 插件树 + Web 端入口图与模块表 + runtime 端装载 | ① 装/卸纯服务插件（撤销后监听真不再触发）；② 运行时装面板插件**免重新构建**；③ 插件引入的新 `__type__` **在编辑器与运行产物两端都有行为**（同一场景两边表现一致） |
| **P6 发布** | `build` / `publish` | 产物化 + 打包；**按项目启用状态把插件 runtime 端打入产物**（决策 A）；重写 `resource/template/app.js` 的旧 API；修 npm `files` 白名单 | ① 发布产物在**无编辑器**环境运行通过；② **tree-shake 校验**：未启用插件的 runtime 端不被打进产物；③ D1 往返等价门禁；④ `npm pack` 内容校验（见根 §16） |
| **P7 单例迁服务** | `EditorData` / `editorui` / `editorRS` / `editorcache` 迁服务 | 实测后**目标修正**（它们不是同一类东西）：`editorData` → **Pinia**（它已经是过渡层）、`editorui` → **删**（兼容空壳，**已完成**）、`editorcache` → 先消模块级 `new`、只有 `editorRS` 是真迁移 | 每步：该单例引用面**归零** + CI 全绿；台账用 `node scripts/editor-singleton-survey.mjs` 查（顺序与爆炸半径见 [MIGRATE_SINGLETONS.md](MIGRATE_SINGLETONS.md)） |
| **P8 远程接入** | 公网中继（D13）：本地主动出站、设备配对、盲转发 | 公网服务端 + 本地 tunnel 客户端 + 身份/配对 | ① 从公网浏览器操作本机 editor 成功；② **服务端侧看不到项目内容**（E2E 断言）；③ **关掉服务端，本地直连照常可用**（D7 不退化） |

**顺序理由**：P0 最先——三条核心链路不通，后续每期的验收都无从下手；
P2 先于 P3–P6（通道是宿主与 UI 的接口）；P4 先于 P6（发布依赖编译）；
P3 的接口梳理（`readImage` 签名）必须先于 P4/P5 的宿主服务。

---

## 9. 门禁与验收（每条规范必须有机器执行者）

| 规范 | 执行者（计划） |
|---|---|
| D1 编辑格式 = 运行格式 | e2e：项目源文件 → 运行加载 → 导出 → 再加载，**往返等价**（可复用 `scripts/editor-e2e-scene.mjs` 的往返断言思路） |
| D3 项目 = 目录 | 单测：`new` 出的骨架通过项目校验；坏清单给出**指名道姓**的报错 |
| D5 编译在宿主 | 等价性测试 + **失败必须报错**（"假成功"是本次发现的真实缺陷） |
| D7 可降级 | 无宿主环境启动测试：编辑器可用，宿主相关 UI 明确置灰而非报错 |
| **R2（零模块级副作用）** | 已有 `scripts/check-editor-module-effects.mjs`——**宿主入口要登记进白名单**（脚本会反向校验条目是否过期）。另需清理：`packages/filesystem` 的 `ReadFS.ts:96` / `HttpFS.ts:96`、editor 的 `EditorRS.ts:167-174`、`ScriptCompiler.ts:199`、`Editorcache.ts:64`、`Hierarchy.ts:456` |
| 插件贡献表自洽 | 已有 `scripts/editor-plugins.mjs --check`，扩展覆盖"宿主半"贡献点 |
| `packages/filesystem` 无测试 | 新增 `NodeFS` 必须带 spec（仓规 §13）；现状该包**零 `.spec.ts`** |
| 发布字段改动 | 改子包 `files`/`main`/`module`/`types`/`bin` 后跑 `npm run release:dry-run -- --force`（根 §16）——**本条能直接拦下 #8** |
| **D9 通信安全** | ✅ **已结案（2026-10-05）**：跨源 `Origin` / `Origin: null` / 非本机 `Host`（**DNS rebinding**）/ 端口不符的**负例已进 CI**（`scripts/check-bridge-security.mjs`，随 `gates:host`；判据本身另有 **12 条**纯函数单测（实测）），**HTTP 与 WebSocket 握手共用同一份判据**（`bridge/security.mjs`——握手不受同源策略约束，这一条尤其关键）。**一次性 token 也已落地（2026-10-05，#273 P2 第二步）**：服务端启动生成、注入页面（dev 走 vite 的 `transformIndexHtml`、生产走宿主的 `bootScript`，**同一份脚本格式**），页面拿它领任务并连 WS。范围是**页面侧端点**（`GET /pending`、`POST /result`、WS 握手）——调用方端点（`/call`、`GET /result?id=`、`/ping`）**刻意不要求** token：CLI / MCP / 15 个 e2e 脚本因此**零改动**，而浏览器里的攻击者到不了它们（跨源被 `Origin` 挡、响应被 CORS 挡住读不到）。**协议版本校验也已落地（2026-10-05，#273 P2 第三步）**：页面在 `hello` 里声明 `bridge/protocol.mjs` 的版本（页面与服务端 import **同一个常量**），不符**当场拒**并说清两边各是什么；服务端随即关连接，页面侧**停止重连**并报出来——否则它会拿旧版本无限重试，日志里只剩"连上又断开"，看不出真正的原因。**本条已全部结案**：四条措施（`Origin` / `Host` / 绑定 `127.0.0.1` / 一次性 token + 协议版本）都有 CI 执行者。长连接一旦被连上就是持续通道，所以这一条必须一直在 CI 里 |
| **D9 协议契约** | Web 端 `hello` 声明的编辑器 API 版本与服务端不符时必须被拒（沿用 `apiVersion.ts` 的测试风格） |

---

## 10. 必须同步修改的文档

| 文档 | 改什么 |
|---|---|
| [ARCHITECTURE_V2.md](../../../docs/ARCHITECTURE_V2.md) §4 P4 / §6 | P4 的「editor 收回**评估**」→ 写回结论；§6 的「可用或明确冻结」→「可用」 |
| [POSITIONING.md](../../../docs/POSITIONING.md) §5 / §6 | §6：「编辑器收回」推进为**进行中**，补"本地工具"形态定义；**§5：「云编辑器与托管服务」的表述需收窄**——D13 的公网服务端只做接入中继（数据与算力仍在本地），不属于 §5 所排除的那种云编辑器 |
| [PLUGINS.md](PLUGINS.md) | §"为什么没有直接用 cordis" 的结论随 P1 反转（已在 [NODE_HOST.md](NODE_HOST.md) §1 记录） |
| [PLUGINS.md](PLUGINS.md) 的 API 版本章节 | 现有纪律是"改动清单形状必须动 `EDITOR_PLUGIN_API_VERSION`"；**再补一条**：**引擎（feng3d）依赖变化时同样必须动**——这是"三端共用编辑器版本号"的代价（§6.6 契约） |
| [AGENTS.md](../AGENTS.md) | ① 子包工作区声称与实际不一致（§6.10）；② §15 需明确 R2 的**适用边界**（核心包不得模块级副作用；宿主运行时装载属显式行为） |
| 根 [AGENTS.md](../../../AGENTS.md) §7 | "editor 独立在外仓、与主仓 API 失联"一段需按实际情况核对更新 |

---

## 11. 开放问题（需决策）

1. **绑哪条 cordis 线**：上游 `cordiverse/cordis`（RC）还是 `@deepseek-ai/cordis`（DSH 分叉稳定线）。~~**阻塞 P1**~~
   → ✅ **已决策（2026-10-02）：绑 `@deepseek-ai/cordis` 4.0.4**（本地实测：撤销语义与 `inject` 等待全通过、
   浏览器核心 27,590 B 零 Node 依赖、与 DSH 现役依赖同频）。附两条硬约束：**cordis 的类型与 API 只允许出现在
   宿主层与 Web runner**（业务代码只依赖本仓自己的接口）、**精确锁版 + 升级重跑 spike**。
   **另有一条与选型无关的硬事实**：`loader` / `include` 是 Node-only，浏览器端装载无论如何要自建。
   见 [PLUGIN_TRIPLE_HALF.md](PLUGIN_TRIPLE_HALF.md) §2。
2. ~~**通道传输**~~ **已决策：WebSocket**（D9，需求方 2026-09）。仍待定的是两件实现问题：
   ① 服务端用 `ws` 还是等价实现；② 迁移策略走 **A**（HTTP 并存，保 CI）还是 **B**（全量迁）。
   见 §6.7。~~**阻塞 P2**~~
   → ✅ **两件实现问题也已落地**：服务端用 **`ws@8.22.0`**（`packages/editor/package.json`）；
   迁移走**策略 A（HTTP 并存）**——`check-bridge-socket.mjs` **23/23** 里含 `legacy@http` 退路。
3. **`IReadFS` 接口梳理**：`readImage(): HTMLImageElement` 等浏览器耦合签名怎么改（改接口 vs 代理层）；
   `projectname` / `initproject` / `hasProject` 在磁盘目录形态下的语义。**阻塞 P3**。
   （**实现现状**：`HostFS` 用 base64 + `data:` 绕过 `readImage`，接口**未改**；这仍是待办，但不阻塞已落地的部分。）
4. **资源身份**：继续按路径引用（现状），还是引入显式 asset id（PlayCanvas 式）？
   影响版本管理、重命名、发布时的引用重写。~~**没有结论前不要动。**~~
   → ✅ **已决策（2026-10-05，需求方）：引入显式 asset id**。代价是既有资源与序列化格式要迁移
   （重命名 / 移动安全、发布引用重写更稳是收益）。它同时解锁 **#274** 的项目目录形态与 **#278** 的拆分边界。
5. **`editorRS` 拆分边界**：工作区半（归宿主）与资产半（留浏览器）怎么切；
   `@feng3d/assets` 对浏览器 API 的依赖程度尚未评估。~~**阻塞 P3/P7**~~
   → 🔶 **决策 4 已定**，边界可据此划：工序是「先定 asset id 的表示与序列化 → 再切工作区半 / 资产半」。
   **实测读数已归零（2026-10-05）**：`editorRS` 消费面 **45 → 0**——创建点挪到入口
   （`main.ts` 里 `new EditorAsset(resourceSystem)`）+ 全链注入（见 [MIGRATE_SINGLETONS.md](MIGRATE_SINGLETONS.md)
   §3 第 5 步与 #278）。**剩下的"切工作区半 / 资产半"仍按上面的工序走**：先定 asset id 的表示与序列化（决策 4）。
6. **`window` 耦合**：`vite-entry.ts:41-88` 的全局类查找，如何在宿主侧不依赖 `window` 地成立。**阻塞 P4**。
7. ~~**`src/filesystem/` 与 `packages/filesystem/src/` 两份同名源码**的关系（后者是否影响构建）——**未确认，动 P3 前必须查清**。~~
   → ✅ **已查清（2026-10-05）：这个问题不再成立**。`packages/editor/src/filesystem/` **已不存在**，
   且 `packages/editor` 全树（`.ts` / `.vue` / `.mjs` / `.json` / `.html`，唯一命中是一个无关的
   `libs/jquery.d.ts` 类型注释）**零** `filesystem` 引用——editor 侧那份没有留下任何东西，
   只剩独立的引擎包 `packages/filesystem`，**不影响 editor 的构建**。
8. **插件安全模型**：插件能执行任意 Node 代码。信任模型（仅本机用户 / 签名 / 沙箱）？~~**阻塞 P5**~~
   → ✅ **已决策（2026-10-05，需求方）：沙箱——能力声明 + 按需授权**（插件在清单里声明它需要的能力，
   如"读项目目录 / 执行子进程 / 访问网络"，宿主按声明授权，用户可见可拒）。
   推论与代价：① 这是本表里**工程量最大**的一项——插件的三端（宿主 / 界面 / runtime）都要走能力门，
   宿主侧尤其（`PluginTree` 装载时要构造受限上下文，而不是直接 `import()` 后任其调用）；
   ② 它与 **#267 决策 7 的方案 B**（清单声明 + 构建时过滤）是**同一套思路的延伸**：能力也进清单、也是数据；
   ③ 在沙箱落地前，**不要对外分发第三方插件**（当前信任模型等价于"仅本机"，文档必须如实警告）。
   落地分期与门禁另开阶段（P5 已收口的 #276 不受影响）。
9. **`packages/editor/packages/` 三个子包的归属**：`native`/`typescript`/`codeeditor` 是收进
   workspace（成为正式包）还是就地删除重写？现状**既不参与安装也不参与发布**，
   而 `typescript` 无 package.json、`editor` 是空目录。~~**阻塞 P3/P4**~~
   → ✅ **已决策（2026-10-05，需求方）：`native` 与 `typescript` 删除**
   （`native` 那条"页面直连 Node fs"的路已被 **HostFS（经宿主）** 取代；`typescript` 713 行、全仓 0 引用）。
   `codeeditor`（Monaco 独立窗口）随 **D11** 的 VS Code Web 接入再定（可废弃）。
10. **TS 3.0 → 6.0.3 的跃迁**：`typescriptSorting.ts` 依赖 TS 3.0 内部 API
    （`hasModifier` / `ModifierFlags.Ambient`）——是保留这段自研排序，还是改用标准 TS 能力？~~**阻塞 P4**~~
    → ✅ **随之结案（2026-10-05）**：`packages/typescript` 整体删除，这段自研排序一并清掉
    （构建统一走项目自己的 `npm run build`，见决策 13 的补充）。
11. **贡献点从"五类写死"迁到 slots 契约的兼容路径**（§6.6 重写后浮现的首要设计问题）：
    现有 `EditorPluginManifest` 的五类贡献点（`panels` / `sceneOverlays` / `logics` / `objectView` /
    `bridgeMethods`）+ `PluginLayer` 层叠加是已验证资产，如何与 slots（声明即认领、`single`/`list`、
    `owner` props 契约）共存或迁移？~~**阻塞 P5**~~
    → ✅ **已决策（2026-10-02）：只把"渲染位置"这一维交给 slots**（`panels` / `sceneOverlays` 投影成插槽；
    `logics` / `objectView` / `bridgeMethods` 留在清单——它们是引擎注册表与协议方法表，不是渲染插槽）。
    清单仍是权威数据、slots 是它的投影，层叠加继续在清单侧做、只注册赢家；注册经调用方 `ctx.effect`
    以获得真实的卸载级联。迁移分 S1–S5 五步，**S1–S3 不依赖宿主（#272/#273）**，可与 P1/P2 并行。
    见 [PLUGIN_TRIPLE_HALF.md](PLUGIN_TRIPLE_HALF.md) §3。
12. ~~**游戏项目端（runtime 半）的装载方式与契约**~~ **已决策**（需求方）：装载走 **A（构建时打入）**、
    契约**三端共用编辑器 `apiVersion`**。推论与已知代价见 §6.6 第三端与 D4 的「两项已决策」。
13. **`tsconfig.json` 的 `files` 归属冲突**（D11 引出）：现在由 `ScriptCompiler` **回写**（把全部
    `ScriptAsset` 拼进去，`:162-163`），而 VS Code 也直接读同一个文件。建议改为 **`include` 通配**
    （如 `scripts/**/*.ts`），让双方都不必维护清单——需确认编译链对该改动的兼容性。~~**阻塞 P3/P4**~~
    → ✅ **已决策（2026-10-05，需求方）：改 `include` 通配**，并且**构建 / 运行统一走项目自己的
    `package.json` scripts**（原话：「可以使用通配符，但是需要 vscode 与编译器都将使用项目中的
    package.json 中的 build 等脚本构建运行等」）。即：编辑器**不再回写** tsconfig，VS Code 与编译器
    都用 `npm run <script>`——"谁在构建"只有一个答案（宿主转发项目脚本）。
14. **editor Web 与 VS Code Web 的界面关系**（D11 引出）：两个并列页面 / 一方嵌入另一方 /
    把 3D 场景视图做成 VS Code 自定义编辑器（Custom Editor API）。三者在工程量、可维护性、
    以及"脱离 editor 也能独立运行"（D10）的满足程度上都不同。~~**阻塞 P2/P5**~~
    → ✅ **已决策（2026-10-05，需求方）：两个并列页面**（editor Web 专注 3D 场景与属性配置、
    产物生成入口与插件管理；VS Code Web 管文件树 / 脚本编辑 / 终端 / Git / 全局搜索）。
15. **项目声明的引擎版本与编辑器 `apiVersion` 的兼容校验**（D12 引出）：项目 `package.json`
    会有 `feng3d: ^x.y.z`，而插件只声明编辑器 `apiVersion`（D4 已决策三端共用）。编辑器在打开 /
    构建项目时**必须能发现"项目里的引擎与编辑器不匹配"**，否则插件兼容性校验会给出假阳性。
    ~~**阻塞 P3/P4**~~
    → ✅ **已决策（2026-10-05，需求方）：做校验**——不兼容**报错**，不静默。
16. **`feng3d.project.json` 与 `package.json` 是否合并**（D12 引出）：前者是编辑器元数据、
    后者给 npm / 构建读。合并（用自定义键）能少一个文件，但会把编辑器概念渗进标准工程文件。
    ~~**阻塞 P3**~~
    → ✅ **已决策（2026-10-05，需求方）：不合并**，保持独立文件（标准工程文件保持干净）。
17. **默认构建模板的选型**（D5 / D12 引出）：vite / rollup / 其他？它决定
    `typescriptSorting.ts` 是否还需要、历史产物名 `project.js` 是否保留、以及三端产物如何组织。
    ~~**阻塞 P4/P6**~~
    → ✅ **已决策（2026-10-05，需求方）：vite**（与编辑器自身构建一致）。
    推论：`typescriptSorting.ts` 随之删除（见问题 10）；#275 的 `ScriptCompiler` 删除、
    #277 的「publish 前先跑项目构建」也都据此解锁。
18. **VS Code Web 的远程可达**（D13 引出）：与 editor 中继**共用同一条隧道**（统一入口、体验一致，
    但要把 VS Code 的协议也纳入转发范围），还是用 VS Code 官方 tunnel（`code tunnel`，省事但
    用户要维护两套入口）？~~**阻塞 P8**~~
    → ✅ **已决策（2026-10-05，需求方）：共用同一条隧道**（一个设备配对管两端，与问题 14 的
    "两个并列页面"契合）。
19. **E2E 加密的边界**（D13 引出）：editor 的 WebSocket 协议可以做到端到端加密、服务端盲转发；
    但 VS Code Web 的协议能否同样盲转发，还是必须让服务端可见？这决定"**服务端能看到多少**"。
    ~~**阻塞 P8**~~
    → ✅ **已决策（2026-10-05，需求方）：盲转发**（服务端只转发密文、**不可见项目内容**）。
    推论：密钥分发与设备配对必须做对（见问题 20），且 #279 的验收②「服务端侧看不到项目内容」
    是拿这条判的。
20. **身份与设备配对机制**（D13 引出）：账号体系、配对流程（扫码 / 配对码）、token 生命周期与吊销、
    以及"一台机器多用户 / 一个用户多机器"的授权模型。~~**阻塞 P8**~~
    → ✅ **已决策（2026-10-05，需求方）：设备配对码**——本地主机显示**一次性配对码**，远程输入后
    换**长期凭据**（可吊销）。多机 / 多用户的授权模型随实现细化。

21. **AI 端（第四端）的工具贡献契约**（#281 任务 5 引出）：AI 看到的工具表要不要也插件化？
    现状是"**能力插件化、暴露面手写**"——方法能由插件贡献（`contributes.bridgeMethods`），
    但 MCP 工具表硬编码在 `scripts/editor-mcp-server.mjs`，插件加方法后必须回本仓手改脚本。
    → ✅ **已决策（2026-10-05，需求方）：两步走**——先 **A**（清单加 `contributes.aiTools`，
    让插件今天就能自带 AI 工具 + 三条门禁），再 **B**（描述 / `inputSchema` 搬进方法注册、
    `tools/list` 动态生成 + 静态兜底）。**第四端是贡献点维度的扩展，插件包不新增入口**（triple-half 形态不变）。
    契约草案、代价与迁移路径见 [docs/EDITOR_AI_BRIDGE.md §15](../../../docs/EDITOR_AI_BRIDGE.md)。

23. **多人协作的"一致性模型"**（#280 P9；**待拍板**）：
    §7 的债务表第 12 项原先写着"多人协作（P9）的形态**已定**：CRDT + 跑在本地宿主（§11）"
    ——**那是一句没有依据的断言**：§11 里从来没有这一条（2026-10-05 的 milestone 盘点发现，
    本批把它改回"尚未立项"并把真正要定的事落到这里）。

    要定的是用哪种一致性模型：

    | 候选 | 适合 | 代价 |
    |---|---|---|
    | **CRDT**（Yjs / Automerge 一类） | 离线可用、无中心、天然合并 | 场景文档的体积与 GC；而引擎侧现在是"整棵 `Object3D` 树 + 序列化快照"，要能表达**可合并的增量**才有意义 |
    | **OT / 中心服务器** | 文本协同成熟 | 要一个权威服务端（与 D10「编辑器只是工具」的形态张力大）；断线体验差 |
    | **不做通用模型**（"谁在改谁加锁"） | 工程量最小 | 只防撞车、不做合并——但可能**足够**覆盖真实用法（一个人改场景、另一个人改脚本） |

    两个与它**绑定**的问题：① **身份**（§11 问题 20 的设备配对码是候选基础）；
    ② **跑在哪**（D10 说"本地工具"——那协作要么经本地宿主转发、要么直连，前者与 #279 的公网桥接是同一套基础设施）。

    **建议**：milestone 8 里**没有别的项卡在它前面**，所以先不动、把它当独立决策更划算。

22. **"哪些组件 / Logic 只属编辑器、不进产物"的声明与过滤机制**（决策 7 剩余半）：
    `HideFlags.DontSaveInBuild` 迁移后无替代，插件一旦自己往场景加 gizmo / 导航可视化就管不住。
    → ✅ **已决策（2026-10-05，需求方）：方案 B**——插件在**清单里声明**哪些 `__type__` / 组件
    只属编辑器，构建时按这份**数据**过滤（不动引擎，与 D1「编辑格式 = 运行格式」同构）。
    见 [PLUGIN_TRIPLE_HALF.md](PLUGIN_TRIPLE_HALF.md) §4.2。

---

## 12. 证据边界

- 本文所有**本仓结论**均附文件路径与行号，可复核。现状部分由三路子代理并行调研产出
  （文件系统与存储抽象、脚本编译与发布链路、编辑器状态与项目概念），已全部回收。
- **PlayCanvas：未验证**。源码与内部机制无法核实——本会话所有外链抓取（`github.com` /
  `raw.githubusercontent.com` / `registry.npmjs.org` / `cdn.jsdelivr.net` / `deepwiki.com`）
  均被 DNS 拦截，解析到非公网地址。§2 中关于 PlayCanvas 的结论按"待核实"对待；
  **本设计的判断依据是本仓现状与 POSITIONING 的战略约束，不依赖它。**
- **DSH：有本地实物证据**。§2.2 与 §6.6 的机制描述来自本机 npx 缓存里的发布包
  （`@deepseek-ai/*` 0.1.5-rc.3，路径 `...\_npx\1e7f6d9597241db0\node_modules\`），
  每条均附「包内文件:行号」，可直接复核。**唯一无法验证的是这些机制的设计意图与演进历史**
  ——只能从类型注释与包描述推断。
- **未确认项**（调研明确标记，未做推测）：
  ① 运行时 `ts` 是否真的未定义（**高置信推断**，未在浏览器实测；
  依据：产物中无 `versionMajorMinor`、编译器被 external 排除）；
  ② 生产/npm 形态下 `codeeditor.html` 是否 404（**推断**）；
  ③ zip 空包缺陷在点击路径上的实际表现（代码逻辑明确，未运行验证）；
  ④ `packages/editor/packages/editor/` 空目录的来历；
  ⑤ TS 6.0.3 是否已内置 `getClassExtendsHeritageElement`；
  ⑥ `src/filesystem/` 与 `packages/filesystem/src/` 双份源码的关系；
  ⑦ `packages/assets` 对浏览器 API 的依赖程度（决定 §11 问题 5）；
  ⑧ native 被移出的确切原因与提交。
