# 编辑器宿主架构：Node 宿主 + Web UI

> 状态：**方案文档（2026-09）**。本文只描述目标架构与迁移分期，**不含代码改动**。
>
> 目标由需求方确定：编辑器应运行在**本地 Node 进程**中并自带 Web 部分，结构与 DSH 类似，
> 且必须支持**运行时安装第三方插件**（不改代码、不重新构建）。

---

## 1. 这份方案要推翻的一个既有结论

[PLUGINS.md](PLUGINS.md) §"为什么没有直接用 cordis" 记着一轮调研结论：**cordis 技术上可用，
但现在不该引进**；理由是"范式冲突（R2 零模块级副作用）+ 多一套上下文心智 + 真正缺的是撤销与层叠加"。

那个结论建立在一条前提上：**编辑器是纯浏览器应用**。该前提一旦换成"Node 宿主 + Web"，
三条理由全部失效或反转：

| 原理由 | 在新前提下的状态 |
|---|---|
| 范式冲突：cordis 是"运行时插件函数 + 副作用"，与纯数据清单相反 | **反转**。R2 约束的是"核心模块 import 时不得有隐式副作用"；宿主**装载插件本来就是运行时行为**，且 cordis 同样是"显式注册"。两者同向 |
| 多一套"上下文"：已有 Vue 响应式 + `@feng3d/reactivity` | **减弱**。DI 容器只落在 Node 宿主层，不下沉到浏览器 UI 层，与那两个响应式系统不同层 |
| 真正缺的不是 DI，而是撤销与层叠加；且"运行时装插件"做不了 | **反转**。"运行时装插件"正是本次的核心需求，也正是 cordis 的 loader + include 的本职 |

所以本文的立场是：**cordis 应作为宿主编排层的底座**；而编辑器已有的贡献点机制**继续负责 UI**，
两者不是替代关系。

---

## 2. 现状实测（证据均为本仓代码）

| 能力 | 现状 | 证据 |
|---|---|---|
| Node 侧入口 | **只有静态文件服务器**：把 `public/` 构建产物跑起来，零业务逻辑、零插件能力 | [../bin/serve.mjs](../bin/serve.mjs)（316 行，只依赖 `node:http/fs/path/url`） |
| 宿主 ↔ UI 通道 | **命令层已抽出**（[../bridge/relay.mjs](../bridge/relay.mjs)）：dev server 与宿主**共用同一份实现**，于是生产产物也有通道；传输仍是 HTTP 长轮询 | [../bridge/vitePlugin.mjs](../bridge/vitePlugin.mjs)（薄壳接线）+ [../bin/host/staticServer.mjs](../bin/host/staticServer.mjs)（宿主接线） |
| 通道方向 | **单向拉模型**：浏览器页面每 100ms 轮询 `/pending` 取任务，执行后 `POST /result`。浏览器无法监听端口，故只能拉 | [../src/bridge/EditorBridge.ts](../src/bridge/EditorBridge.ts) 头注释 |
| 传输选型 | 现状是 HTTP 长轮询；代码**刻意不用 WebSocket**（仓库内无 `ws` 依赖，手写 RFC 6455 不划算、HTTP 可 curl 调试）。**该取舍已被需求方推翻——目标形态用 WebSocket** | 同上；决策见 [ARCHITECTURE.md](ARCHITECTURE.md) D9 |
| 插件装载时机 | **构建期**：清单是 TS 字面量，视图是 `() => import()` loader，全部进打包产物 | [../src/plugins/types.ts](../src/plugins/types.ts) |
| 用户层表达能力 | **只能覆盖、不能新建**——JSON 给不出视图 loader 与 Logic 类 | [../src/plugins/patch.ts](../src/plugins/patch.ts) 头注释 |
| 服务容器 | **无**。`EditorData` / `editorui` / `editorRS` / `editorcache` 是模块级单例，依赖关系只体现在 import 图里 | PLUGINS.md §对照表 |
| 本地文件系统 | **不可用**：native 路径被硬编码关闭（`supportNative = false`），Node 侧实现（`NativeFSBase.js`，基于 fs-extra）存在但**不在 workspace 内、入口文件不存在**；且打开该开关必然空指针（`new NativeFS(nativeFS1)` 而 `nativeFS1 = null`） | [../src/assets/NativeRequire.ts](../src/assets/NativeRequire.ts)：4、9 行；[../src/assets/NativeFS.ts](../src/assets/NativeFS.ts)：9、263 行 |
| 项目 | **不是文件系统里的项目**：项目 = IndexedDB 的 objectStore（名字即项目名），项目名存在 localStorage；新建/切换 = 改字符串 + `window.location.reload()`。`projects/*.feng3d.zip` 是随包发布的只读示例，且 zip 导入/导出的实现有缺陷（回调永不执行） | `packages/editor/projects/*.feng3d.zip`、`package.json` 的 `files`；[../src/assets/EditorRS.ts](../src/assets/EditorRS.ts)：122、152 行 |
| **三条核心链路** | **编译 / 项目往返 / 运行预览实际都不通**——这是分期的第一条要修的东西，见 [ARCHITECTURE.md](ARCHITECTURE.md) §1.3 | `ScriptCompiler.ts:127-132`、`EditorRS.ts:122,152`、`run.ts:52-81` |
| Node 侧脚本 | 15 个 `scripts/editor-*.mjs`，但除 MCP server 外**全是开发期工具**（smoke / fuzz / e2e / check） | `scripts/` |

**一句话**：`bin/serve.mjs` 现在只是"让 npm 安装版能跑起来"的包装，不是宿主；
要长成宿主，下面 §3–§6 的东西基本都要新建。

---

## 3. 目标分层

```
┌─ L2 浏览器界面（两个并列，见 [ARCHITECTURE.md](ARCHITECTURE.md) D11）─┐
│ ① editor Web：Vue 3 + Element Plus                                 │
│  · 贡献点机制（面板 / 场景浮层 / 属性控件 / 桥接方法）——保留        │
│  · feng3d 引擎 + WebGPU 渲染（**只能在这里**）                     │
│  · 场景数据的权威副本（见 §5.1）                                   │
│ ② VS Code Web：文件树 / 脚本编辑 / 终端 / Git —— 直接读项目目录     │
├─ L1 宿主 ↔ UI 通道 ──────────────────────────────────────────────┤
│  · 服务调用（UI → 宿主）· 事件推送（宿主 → UI）                    │
│  · 插件 UI 资产分发（宿主 → 浏览器，运行时）                        │
│  · 取代现状：dev-only 的中间件 + 页面轮询                          │
├─ L0 Node 宿主（本地进程）─────────────────────────────────────────┤
│  cordis：插件树 / Service / inject / Fiber.dispose / Events        │
│  · 文件系统 · 项目工作区 · 插件目录与装载 · 配置（层叠加）          │
│  · AI 桥接的服务端半（MCP / CLI 的落地处）                          │
└───────────────────────────────────────────────────────────────────┘
```

### 3.1 与既有规划的关系（要更新一处**结论**，不是推翻规划）

既有规划对 editor 的态度是"**待评估**"，而不是"已冻结"：

| 文档 | 现有表述 |
|---|---|
| [POSITIONING.md](../../../docs/POSITIONING.md) §4 / §6 | 把「编辑器收回（objectview + editor）」列为**优先级 3、护城河**——"唯一能形成组合护城河的一环"；§5 同时把"**云编辑器与托管服务**"列为**非目标** |
| [ARCHITECTURE_V2.md](../../../docs/ARCHITECTURE_V2.md) §2.1 / §6 | Layer 5 标「收回或冻结」；量化目标写「可用或明确冻结」；§4 **P4** 的任务名是「**editor 收回评估**（能否编译 → 依赖差异 → 收回或明确冻结）」 |

也就是说，"要不要收回 editor"在规划里是**一个待办评估**（P4），不是已下的冻结结论。
需求方给出的新定义（本地工具 + 运行时插件）**正是那个评估的结论**：方向是**收回并大力发展**。

所以这里要做的不是"推翻规划"，而是**把结论写回规划文档**：把 §4 P4 的待办改成结论、
把 §6 的"可用或明确冻结"改成"可用"。否则会出现"规划说待评估、代码已在大改"的漂移，
而本仓 §15 的元规则不允许这种并存。

> 另有一条**方向一致性**值得记下：POSITIONING.md §5 已把"云编辑器与托管服务"列为非目标
> （理由：那是 PlayCanvas 的商业形态，非技术问题）。**本地工具形态与之天然一致**——
> 这也解释了为什么不该照搬 PlayCanvas 的云端部署形态（见 [ARCHITECTURE.md](ARCHITECTURE.md) §2）。

R1（依赖方向只向下）不受影响：宿主层是新的**最上层**，只允许它依赖下层内核，内核不得反向依赖它。

---

## 4. cordis 接管范围

| 职责 | 归属 | 说明 |
|---|---|---|
| 插件树与装载顺序 | **cordis** | loader / include；`inject` 表达依赖，依赖未就绪不启动 |
| 插件生命周期与撤销 | **cordis** | `Fiber.dispose()`：插件的服务、监听、定时器随所属 fiber 一起撤销。**这是现在最缺的**——现状只有 Logic 一类能撤（`revertPluginContributions`），插件自建的定时器 / 监听 / 快捷键无撤销通道 |
| 宿主服务（fs / 项目 / 配置 / 桥接） | **cordis `Service`** | 取代模块级单例；服务取代 `EditorData` 这类全局对象是主要重构量 |
| 插件配置 | **cordis**（schemastery 式 schema） | 现状清单里**没有** `config` 字段 |
| 配置层叠加与用户覆盖 | **cordis loader + 沿用现有层语义** | 现有 `PluginLayer`（内置 < 插件 < 用户）与 DSH 的 profile/patch 语义同构，可平移 |
| **UI 贡献点**（面板 / 浮层 / 属性控件） | **cordis 之上的 slots 层（照搬 DSH）** | cordis **核心**确实没有渲染层；但 DSH 在它之上建了完整的 Web 端 UI 贡献点层——Web 半**也是 cordis 插件**、UI 用 `SlotMap` **插槽契约**登记、撤销走调用方 `ctx.effect`。**不该自研**，见 [ARCHITECTURE.md](ARCHITECTURE.md) §6.6 |
| 场景内的 Logic（`__type__` → 类） | **自研，但改由宿主注册** | 现在是构建期清单；运行时装插件时改由宿主下发并注册 |
| 场景数据与渲染 | **浏览器**（见 §5.1） | cordis 不参与 |

**结论**：cordis 接管"服务端的编排与服务"，**并在 Web 端同样作为插件容器**（三端形态的前两端，
照搬 DSH 的 dual-half：一份包两个入口、Web 端也是 cordis 插件）；渲染（WebGPU）与场景数据仍完全在
Web 端，**游戏项目端在产物内运行**。这是**分工**，不是替换——但 UI 贡献点机制**要照搬 DSH，而不是自研**。

---

## 5. 关键设计决策

### 5.1 场景数据的权威副本留在浏览器

Node 宿主**不**接管场景数据。理由：

1. feng3d 的战场是"数据即应用"（ARCHITECTURE_V2 §1.2 战场 A）——JSON 即内存、`logic()` 惰性附加行为、
   响应式 computed 全链路惰性。把数据搬到 Node 再同步回浏览器，等于在两个进程间重建这套链路。
2. 渲染（WebGPU）只能在浏览器，数据跟着渲染走，省掉"每帧/每次编辑同步"的一致性成本。
3. 现状的全部场景操作代码（`src/bridge/read/*`、`write/*`，含撤销栈）都在浏览器侧，迁走的收益不明。

宿主持有的是**文件与插件**，不是场景对象图。宿主要读场景时走 §5.4 的服务调用。

### 5.2 一个插件 = triple-half（三端）包

插件形态包含**三个部分**（需求方确定）：**编辑器 Node 端** + **编辑器 Web 端** + **游戏项目端**。

| 端 | 导出入口 | 内容 | 落地 |
|---|---|---|---|
| 编辑器 Node 端 | `"."` | cordis 插件：服务、文件访问、命令、构建/导出任务 | 服务端进程内 `import()` |
| 编辑器 Web 端 | `"./client"` | **也是一个 cordis 插件**：面板 / 浮层 / 属性控件视图、编辑期 Logic | 浏览器内由模块表装载并激活 |
| **游戏项目端** | `"./runtime"` | 运行时 Logic / 组件行为 / 系统——让产物认识插件引入的类型 | **产物内**（构建时打入或运行时加载，见 [ARCHITECTURE.md](ARCHITECTURE.md) §6.6 第三端） |

**前两端照搬 DSH 的 dual-half 模型**（术语出自 `dsh-cordis-client-runner` 的包描述：
"Browser half of dynamic **dual-half** plugin packages"）；**第三端是 editor 超出 DSH 的部分**
——DSH 的产物是它自己的 UI，editor 的产物是**游戏项目**。

声明放在 `package.json` 分三块（DSH 是 `dsh.client` 单块：`platform` / `inject` / `immediately` / `external`）。
三端可只声明一部分。**runtime 端只能依赖引擎 API，禁止依赖编辑器 API**——否则产物会拖进整个编辑器。
完整机制对照见 [ARCHITECTURE.md](ARCHITECTURE.md) §6.6。

### 5.3 运行时 UI 装载：照搬 DSH 的入口图 + 浏览器模块表

这是"运行时装 UI 插件"的机制，**不需要重新构建编辑器**。DSH 的做法（本地包实测）：

1. **服务端组合入口图**（扫描各包的 `dsh.client` 声明），注入为 `window.__DSH_BOOT__`：
   `entries`（`id` / `url` / `rev` / `inject` / `immediately` / `external`）+ `batches`（分阶段脚本）+ `rev`（一致性锚）。
2. **浏览器侧是 lazy 模块表**（`dsh-client-modules`）：插件 bundle 执行时只**注册工厂**
   （`window.__ModuleLoader__.load({ id, factory })`），模块体副作用（含 CSS 注入）都在工厂闭包内，
   **materialization 时才跑**；先到的脚本进队列，模块系统建好后切 live。
3. **由 vendored cordis Loader 消费**：Loader 经 `internal` 契约调用模块表的 `import`
   （`EntryTree.import → internal.import`）——**fiber 生命周期 / inject 等待 / 更新刷新全在 cordis 侧**，
   模块表只管"代码怎么到达"。
4. **HMR**：`invalidate(id, rev)` 之后重取带 revision 的单资源端点。

editor 侧仍需定两件事：
- **共享依赖 external**：Vue、feng3d 必须指向 Web 端已有实例（否则打进第二份 Vue）。DSH 用
  `dsh.client.external` 显式声明"超出基线的模块请求"，可对应。
- **模块格式**：DSH 用 lazy-CJS 表（工厂 + `require`）；editor 是 Vite/ESM，要决定沿用 ESM
  `import()`，还是同样做工厂表（后者更便于 HMR 与外部依赖控制）。

> ✅ **已按本节实现并验证（2026-10-02，#276 阶段 5）**：宿主读插件配置产出**入口图**、注入页面
> （`window.__EDITOR_BOOT__`）、页面自行装载——端到端证据
> [scripts/editor-plugin-host-load.mjs](../../../scripts/editor-plugin-host-load.mjs) **6/6**
> （真构建产物 + esbuild 打的真插件包，界面出现插件面板、零 pageerror）。
> 与本节的两点差异：实现走的是 **ESM `import()` 直连**（决策稿 §3.5 的 **M1**），
> **lazy-CJS 工厂表**（本节第 2 步）与 HMR 尚未实现（M2，属后续）；
> **共享依赖**（Vue / 引擎）目前由插件自己带着，**基座表 / importmap 未做**。

### 5.4 通信层：服务端 ↔ Web 端走 WebSocket（已决策）

需求方已定：编辑器分**服务端**与 **Web 端**两部分，之间用 **WebSocket** 双向通信
（完整决策与协议设计见 [ARCHITECTURE.md](ARCHITECTURE.md) 的决策 D9 与 §6.7）。
本节只列它对本方案的影响。

> ✅ **已落地（#273 第二阶段，2026-10-02）**：通道由**服务端**提供
> （`bin/host/bridgeSocket.mjs`，挂在宿主 http server 的**同一端口**，路径 `<桥接前缀>/ws`），
> 与 HTTP 通道**共用同一份命令层**（`relay.bridge`：`call` / `takePending` / `claim` /
> `submitResult` / `waitForResult` / `subscribe`）。上面三个硬限制的现状：
>
> - **服务端提供通道** ✅（不再依赖 `apply: 'serve'`）
> - **双向推送** ✅（有任务就**推**给页面，不再每秒轮询；`/ping` 也能看到 WS 页面）
> - **请求/响应按 `id` 关联** ✅（WS 调用方发 `call`，结果按 `reqId` 推回）
> - 代价 1（引入 `ws`）已付：`ws` 进了 `packages/editor` 的 **`dependencies`**（宿主运行时要它）
> - 代价 2（HTTP 兼容）**按建议做到了**：两条通道并存，15 个 `editor-*.mjs` **零改动**
>
> 机器判据 [`scripts/check-bridge-socket.mjs`](../../../scripts/check-bridge-socket.mjs) **18/18**——
> 含两条最容易写错的：「**推送即派发**」（推出去就从待执行取走，否则同一任务会经 HTTP 轮询再跑一遍，
> 写操作尤其致命）与「**HTTP 调用 → WS 页面响应**」（跨通道证明只有一份命令层）。
> ✅ **Web 端已接入（#273 第三阶段）**：页面优先连 WS（`src/bridge/bridgeSocket.ts`），
> **WS 在线时不再轮询**、断开自动退回轮询（最坏情况就是回到原来的行为）；
> **dev 与生产都提供通道**——dev 由 `bridge/vitePlugin.mjs` 挂在同一个 http server 上
>（此前 dev 只有 HTTP，于是"页面被推送"只在生产成立，而开发者天天用的是 dev）。
>
> 端到端 [`scripts/editor-bridge-ws-page.mjs`](../../../scripts/editor-bridge-ws-page.mjs) **5/5**：
> `/ping` 报出 `transport: websocket`（页面自己说连上不算，服务端记到才算）、
> **HTTP 发起的调用由 WS 页面执行并把结果回传**、退路（不经 WS）照旧可用。
>
> 踩过的坑记一笔：dev 下 vite 的 HMR 走的是**同一个** http server 的 `upgrade` 事件，
> 挂 WS 时对"不是本通道的 upgrade"**不能** `socket.destroy()`——那会掐死 HMR，页面直接加载不出来。

现状三个硬限制必须在 L1 解决：

| 现状限制 | 目标 |
|---|---|
| `apply: 'serve'` —— 生产产物没有通道 | 通道由**服务端**提供，dev 与生产一致 |
| 只有拉模型（Web 端轮询任务） | **双向**：服务端 → Web 端事件推送（服务变化、插件装载/卸载、文件变化） |
| 调用方需长轮询取结果 | 请求/响应语义（按 `id` 关联，一次往返拿结果） |

**两个必须面对的代价**（详见 ARCHITECTURE.md §6.7）：

1. **服务端没有现成的 WebSocket 实现**——Node 不内置 WebSocket 服务端（Node 22+ 的全局
   `WebSocket` 是**客户端**）。而现状 `bridge/vitePlugin.mjs` 头注释明确写了"**刻意不用
   WebSocket**"（无 `ws` 依赖、手写 RFC 6455 不划算、HTTP 可 curl 调试）。改决策后需引入
   `ws` 或等价实现。
2. **现有 HTTP 工具链要兼容**——CLI / MCP / 全部 e2e 脚本（15 个 `scripts/editor-*.mjs`）
   都建立在 HTTP + 轮询之上。建议 P2 走"服务端**同时**提供 WebSocket 与 HTTP、共享同一命令层"，
   **保证 CI 与这些脚本零改动**；全量迁移留待后续评估。

**另外（安全）**：WebSocket 握手**不受浏览器同源策略约束**，任意网页都能连本地端口。
在"能读写项目文件 + 能执行插件代码"的场景下，必须校验 `Origin`（或一次性 token）、
绑定 `127.0.0.1`、校验 `Host` 头。**这条不能后置。**

### 5.5 契约：把 `apiVersion` 与 cordis 依赖声明合并成一套

现状 `apiVersion.ts` 已实现版本契约（`^` / `~` / 精确，不兼容当场抛错，且清单必须声明）。
引入 cordis 后会出现两套"依赖"概念，**必须合并成一套**，否则插件作者要写两处：

- 对**编辑器宿主 API** 的版本依赖 → 沿用现有 `apiVersion` 语义（已验证、有测试）；
- 对**其它插件/服务**的依赖 → cordis 的 `inject`。

二者语义不同（版本兼容 vs 服务就绪），可以并存，但要在**同一份清单**里声明、由同一处校验。

---

## 6. 迁移分期

每期都要有**可机器验证的验收**（本仓 §15 元规则：无执行者的不算规范）。

| 期 | 目标 | 验收 |
|---|---|---|
| **P0 契约与骨架** ✅ **已完成（2026-10-02，#272）** | 定 cordis 线（§8，已决策：与 DSH **同库** `@deepseek-ai/cordis` 4.0.4）；宿主进程骨架落在 `bin/serve.mjs` —— cordis `Context` + `HostInfo` / `StaticServer` 两个 `Service`，**生命周期交给 context**（`SIGTERM`/`SIGINT` → `ctx.fiber.dispose()` → 监听自动关闭）；宿主门禁 [scripts/check-editor-host.mjs](../../../scripts/check-editor-host.mjs)（入口登记 + 反向校验 / 依赖方向 R1 / 服务级能起能停 / 进程级能报版本与起停） | ✅ 宿主**能起、能停、能报版本**（门禁 **21/21** + 8 条合成自检）；门禁脚本已入库——**但"进 CI"这一句仍欠**：gh 凭据缺 `workflow` scope，接线补丁待打（同 #276 的欠账） |
| **P1 通道** 🔶 **第一阶段已完成（2026-10-02，#273）** | **命令层抽出**：[`bridge/relay.mjs`](../bridge/relay.mjs) 承载全部协议逻辑（队列 / 长轮询 / 在线页面跟踪 / 五种路由），`vitePlugin.mjs` 变薄壳、宿主 `staticServer` 也接同一份中继 → **dev 与生产一致** + **协议一字不改**。**WebSocket 双向通道属后续阶段**（届时同时提供 WS 与 HTTP、共享命令层） | ✅ 现有工具链**零改动可跑**：`editor-slots.mjs` **12/12**、`editor-plugins.mjs --check` **11/11**（vite 侧未坏）；宿主侧协议验收 [scripts/check-bridge-relay.mjs](../../../scripts/check-bridge-relay.mjs) **14/14**（完整往返 / 长轮询唤醒 / 定向投递 / 错误路径 / 静态资源不被吃掉） |
| **P2 宿主服务** | fs / 项目工作区 / 配置做成 cordis `Service`；项目从只读 zip 改为可写工作区 | 服务可单独单测；项目读写往返测试 |
| **P3 插件装载（宿主半）** 🔶 **入口图这一截已完成（2026-10-02，#276 阶段 5）** | 宿主 `PluginPackages` Service 读插件配置 → 入口图 → 注入页面；**剩下的**：插件目录约定 + 宿主侧 cordis 插件树 + 配置文件层叠加 | ✅ 入口图与注入有机器判据（[check-editor-boot.mjs](../../../scripts/check-editor-boot.mjs) 10/10）；装/卸**纯服务插件**的回归用例待宿主服务落地后补 |
| **P4 插件装载（Web 半）** ✅ **已完成（2026-10-02，#276 阶段 4 + 5）** | §5.3 的运行时注册：模块表 + 入口图契约 + 装载/卸载（阶段 4）；宿主产出入口图并由页面自行装载（阶段 5） | ✅ 运行时装一个面板插件，**不重新构建**即出现在界面上（[editor-plugin-host-load.mjs](../../../scripts/editor-plugin-host-load.mjs) 6/6；卸载见 [editor-plugin-load.mjs](../../../scripts/editor-plugin-load.mjs) 9/9）。`patch.ts` "只能覆盖不能新建"的限制**解除**见决策稿 §3.7 |
| **P5 单例迁服务** | `EditorData` / `editorui` / `editorRS` / `editorcache` 逐个迁为服务 | 每迁一个，CI 全绿；迁移清单可查 |

**顺序理由**：P1 必须先于 P2/P3——没有通道，宿主装了插件也没法让 UI 知道；
P2 先于 P3——插件要访问文件系统，得先有文件系统服务。

---

## 7. 必须同步修改的既有文档与规范

| 文档 | 改什么 | 为什么 |
|---|---|---|
| [PLUGINS.md](PLUGINS.md) | §"为什么没有直接用 cordis"的结论（不该引 → 该引，且分两层） | 该节结论已因前提变化而失效 |
| [ARCHITECTURE_V2.md](../../../docs/ARCHITECTURE_V2.md) §2.1 / §4 | editor 的"收回或冻结"定位 | 把 P4 的「收回**评估**」写回结论——是更新结论，不是推翻规划（见 §3.1） |
| 根 [AGENTS.md](../../../AGENTS.md) §15 R2 | 明确 R2 的适用边界：**核心包**不得模块级副作用；宿主运行时装载属显式行为 | 避免把 cordis 误判为违反 R2 |
| 根 AGENTS.md §7 | "editor 独立在外仓、与主仓 API 失联"那段 | editor 在本仓被大改后，该表述需要重新核对 |

---

## 8. 开放问题（需决策，按优先级）

1. **绑哪条 cordis 线**：上游 `cordiverse/cordis`（据本仓记录为 `4.0.0-rc.10`，RC）还是
   `@deepseek-ai/cordis`（DSH 分叉，4.0.x 稳定线）？目标是"结构类似 DSH"，绑分叉更顺，
   代价是与 DSH 的发布节奏耦合。**这条不定，P0 无法开工。**
2. ~~**通道传输**~~ **已决策：WebSocket**（见 [ARCHITECTURE.md](ARCHITECTURE.md) D9）。
   仍待定两件实现问题：① 服务端用 `ws` 还是等价实现；② 迁移策略 A（HTTP 并存）还是 B（全量迁）。
3. **是否保留"无宿主也能用"的降级形态**：纯浏览器打开（现状）能否继续作为支持形态？
   若保留，L1 必须设计成可缺席的，插件装载则降级为内置清单。
4. **插件分发与安全**：插件能从 npm 装、能执行任意 Node 代码（文件系统、子进程）。
   信任模型是什么？（本地只信任本机用户 / 签名 / 沙箱）——这条要有明确答案再开 P3。
5. **Web 半的依赖共享方式**：`external` 到宿主实例的具体机制（import map / 全局注册）。

---

## 9. 明确不做

- **不让 cordis 碰 UI 贡献点**：面板 / 浮层 / 属性控件的注册与渲染仍走现有机制。
- **不把场景数据搬进 Node**（§5.1）。
- **不为了用 cordis 而重写现有插件清单**：`EditorPluginManifest`、层叠加（`layers.ts`）、
  版本契约（`apiVersion.ts`）是已验证资产，平移而非重写。
- **不在方案未定的情况下动代码**。

---

## 10. 证据边界

- 本文所有"现状"结论均取自本仓代码（§2 逐条给了文件）。
- **未能验证**：`cordiverse/cordis` 上游仓库原文——本次会话所有外链抓取被 DNS 拦截
  （`github.com` / `raw.githubusercontent.com` / `registry.npmjs.org` / `deepwiki.com`
  均解析到非公网地址）。关于 cordis 能力与浏览器可用性的数据来自
  [PLUGINS.md](PLUGINS.md) 记录的实测（针对 DSH 分叉 `@deepseek-ai/cordis` 4.0.4：
  浏览器 ESM 27.2 KB、`node:fs` / `node:path` / `process.` 引用各 0 处）。
- **DSH 的内部结构未读源码**：本文对"结构类似 DSH"的对应关系，依据是本仓
  [docs/EDITOR_AI_BRIDGE.md](../../../docs/EDITOR_AI_BRIDGE.md) 记录的 `cordis.patch.yml` 装配方式，
  以及 DSH 使用 cordis 作插件底座这一事实。**DSH 的 client/server 桥具体机制未核实**，
  §5.4 因此按"需要自己设计"对待。
- cordis 的具体 API 名（loader / include / schemastery 的配置格式）**未逐一核实**，
  本文只在概念层引用；P0 落地前需按选定版本核对。
