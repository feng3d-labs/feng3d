# 插件三端形态：前置决策稿（#276）

> 状态：**已采纳（2026-10-02）**。三条挡在 P5 前面的未决策项**按本文建议落定**：
> ① 绑 `@deepseek-ai/cordis` 4.0.4（§2）；② slots **只接管"渲染位置"**（§3.3 的切分）；
> ③ 数据层三端边界走"清单声明 + 构建时过滤"（§4.2 候选 B）；模块格式先 **M1** 打通、
> 把模块表留成一层接口，M2 作为替换实现（§3.5）。
> 本文只落**决策与实测**，**不含产品代码**——实现从 §3.7 的 **S1** 起步。
> 三条的出处：① [ARCHITECTURE.md](ARCHITECTURE.md) §11 问题 1；② 同 §11 问题 11（§6.6 重写后浮现）；
> ③ [issue #267](https://github.com/feng3d-labs/feng3d/issues/267) 决策 7——三者都写着"阻塞 P5/[#276](https://github.com/feng3d-labs/feng3d/issues/276)"。
>
> 上游文档：[ARCHITECTURE.md](ARCHITECTURE.md) §6.6（三端机制对照）、[NODE_HOST.md](NODE_HOST.md) §5.2–5.3
> （入口图 / 模块表）、[PLUGINS.md](PLUGINS.md)（现状贡献点机制）。
> 可复现的实测脚本：[@../spikes/README.md](../spikes/README.md)。

---

## 0. 结论（已采纳 2026-10-02）

| # | 前置 | 建议 | 依据 |
|---|---|---|---|
| 1 | **绑哪条 cordis 线** | **B：`@deepseek-ai/cordis` 4.0.4**，并**只在本仓的宿主层与 Web runner 引用**（业务代码不直接 import cordis 类型） | 本地实跑：撤销语义与 `inject` 等待全部通过（§2.1）；浏览器核心产物 27,590 B、零 Node 依赖（§2.2）；DSH 侧 55+ 个包在用同一套 loader/slots，照搬时能对着**真实实现**读 |
| 2 | **slots 与五类贡献点的兼容路径** | **只把"渲染位置"这一维交给 slots**：`panels` / `sceneOverlays` 投影成插槽；`logics` / `objectView` / `bridgeMethods` **不进 slots**（它们是引擎注册表与协议方法表，不是渲染插槽）。清单仍是权威数据，slots 是它的投影 | 五类里只有两类是"界面位置"；混着迁会把层叠加（已验证资产）塞进 DSH 没有层语义的 slots 里（§3.3） |
| 3 | **数据层三端边界**（决策 7） | **候选 B**：插件清单声明"哪些类型/组件只属编辑器"，构建时据此过滤；不恢复引擎侧的 `hideFlags` | `HideFlags.DontSaveInBuild` 已成孤儿导出（`packages/feng3d/src/core/HideFlags.ts:29`，全仓 0 消费方，5 处注释记着"无替代"）；过滤规则是**数据**，与清单同构且可机器检查（§4） |

**三条都不是"实现细节"**：它们各自决定一处**公开形状**（依赖来源 / 插槽契约 / 构建过滤），
后改的代价是"插件作者已经写好的东西要改"——这正是它们被列为"开工前"而非"开工后"的原因。

---

## 1. #276 的任务清单：哪些是前置、哪些是后续

issue #276 的 7 条任务，按依赖重排（**前置未定则后面的做了要返工**）：

| #276 的任务 | 依赖 | 本文档是否已解决 |
|---|---|---|
| `package.json` 三入口与三块声明；三端共用 `apiVersion` | cordis 选型（前置 1） | 🔶 选型**建议已给、待拍板**（§2）；**三端共用 `apiVersion` 属已决策**（§6.6 第三端），本文只补纪律 |
| 贡献点从五类写死演进为 **slots 契约** | 兼容路径（前置 2） | 🔶 路径**已给、待拍板**（§3），含分步迁移 |
| 插槽注册经调用方 `ctx.effect`（卸载级联） | 同上 | ✅ 机制基础已实跑验证（§2.1：撤销后监听与定时器确实不再触发） |
| 装载：`__DSH_BOOT__` 式入口图 + 浏览器 lazy 模块表 + loader `internal` 契约 | 宿主（#272/#273）与本文机制选择 | 🔶 **机制照搬 DSH**，但编辑器是 Vite/ESM（不是 lazy-CJS）：模块格式二选一见 §3.5，**判据已给，选型待拍** |
| runtime 端边界（只依赖引擎 API） | 决策 7（前置 3） | 🔶 边界已明确（§4.4），过滤机制给候选待拍 |
| 与 `EditorPluginManifest` / `PluginLayer` / `apiVersion.ts` 兼容迁移 | — | ✅ 明确"**平移而非重写**"（§3.4），守门资产是 8 个 spec / 103 条用例 |
| patch「只能覆盖、不能新建」的解除 | 宿主能 `import()` 插件包 | ✅ 语义澄清（§3.6）：**解除发生在"插件装载"，不在 patch** |

**结论**：本文档给出方案，**待需求方拍板即可开工**——#276 剩下的都是"有路径"的工作；
真正还缺的两件是宿主（#272/#273）与模块格式选型（§3.5），后者的判据本文已给。

---

## 2. 前置一：绑哪条 cordis 线

### 2.1 本地实测（可复现）

`node packages/editor/spikes/cordis-dispose.mjs`（[脚本](../spikes/cordis-dispose.mjs)）：

```
node v22.23.2 / cordis 4.0.4
--- 时间线 ---
  装 late 之后已启动数=0（应为 0：依赖未就绪不启动）
  装 ticker 之后已启动数=0
  late 启动（counter 就绪=true）
  装 Counter 之后已启动数=1（应为 1：等待者到齐后启动）
ticks：活跃期 timer=3 event=1；撤销瞬间 timer=3 event=1；再等 40ms + 再发事件后 timer=3 event=1
--- 断言 ---
 PASS  inject：依赖未就绪时不启动等待者
 PASS  inject：等待者启动时依赖已就绪
 PASS  活跃期：定时器在跑
 PASS  活跃期：事件监听在跑
 PASS  撤销后：定时器停止
 PASS  撤销后：监听已移除（再发事件不涨）
```

**这条实测直接对应 #276 的验收①**（"装/卸纯服务插件：撤销后监听与定时器确实不再触发"）：
`ctx.effect(() => { …; return () => cleanup() })` + `fiber.dispose()` 确实把定时器与监听一起收走，
`inject` 也确实挡住了"依赖未就绪就启动"（现状 `revertPluginContributions` 只覆盖 Logic 一类，
定时器 / 监听 / 快捷键**无撤销通道**，见 [NODE_HOST.md](NODE_HOST.md) §4）。

### 2.2 浏览器产物实测（可复现）

`node packages/editor/spikes/cordis-bundle.mjs`（[脚本](../spikes/cordis-bundle.mjs)）：

```
esbuild 0.25.12 / cordis 入口 …\@deepseek-ai\cordis\lib\index.js
产物字节数：27590（26.9 KB，esm + browser + minify）
node: 说明符 0 处 / process. 0 处 / require( 0 处
顶层 import：（无）
结论：可在浏览器直接加载（无 Node 依赖）
```

与 [PLUGINS.md](PLUGINS.md) 记的 27.2 KB **同源**——那是 **KiB 口径**（27,814 B = 27.2 KiB），
本次 27,590 B 的差异来自 esbuild 版本与入口不同。**Web 半也是 cordis 插件**（§6.6 / D4）
这条前提成立，且产物体积可接受（编辑器自己的体积瓶颈在 `resource/` 的 64MB 资源，不是这 27 KB）。

但要看清**这条体积覆盖了什么**：产物里 `EntryTree` / `Loader` / `Schema` 出现 0 次——
**27.8 KB 只是 cordis 核心**，不含 loader / include / schemastery（原因见 §2.4）。

### 2.3 两条线的对比与建议

| 维度 | A：上游 `cordis` | B：`@deepseek-ai/cordis` |
|---|---|---|
| 版本线（`npm view` 实测） | **latest `4.0.0-rc.10`，仍未发稳定版**；beta.5 2025-06-01 → beta.6 2026-03-24（中间约 9.7 个月空档）→ rc.0 2026-03-28 → rc.10 2026-09-08 | **4.0.4**（2026-09-22）；4.0.1-rc.1 起 6 个版本，43 天内 4 个稳定版——稳定，但**也在快跑** |
| 维护者 | 单人（shigma） | DeepSeek 团队（DSH 分叉稳定线） |
| 依赖与体积 | 2 个直接依赖（同 B）；unpacked 69,579 B / 13 files；**浏览器打包体积未实测**（本机无副本） | 2 个直接依赖（其一 `@standard-schema/spec` 是 **0 B 纯类型包**）；unpacked 239,620 B / 32 files，lib 入口 60,361 B；**浏览器核心实测 27,590 B** |
| 浏览器可用性 | exports 无 browser 条件（两线都是），靠产物本身无 Node 依赖；**未实测** | ✅ 核心 / cosmokit / schemastery / timer / group **零 `node:` 引用**（实测，§2.2） |
| **与 DSH 生态的一致性** | 🔶 包名空间不同（`@cordisjs/*`）；DSH 的 slots / vendored Loader / 55+ 个 client 包都建在 B 线上，跨线照搬要逐个核对 | ✅ 与 DSH 现役依赖**完全同频**（`dsh-cordis-*` / `dsh-client-ui-*` 的 peer 都是 `~4.0.4`）；照搬时可对着真实实现读（§6.6 的证据列全是这些包） |
| 两线关系 | 上游 include **1.1.0** > fork 的 1.0.9；上游 timer **1.1.3** < fork 的 1.1.6 → **两条线各自演进**，已出现版本倒挂 | 同左（分叉基线约 rc.8 属推断，实际 diff **未核实**） |
| 混装风险 | 两线 module id 不同（`cordis` vs `@deepseek-ai/cordis`），插件靠 `declare module` 增强 `Context`/`Events`/`Fiber` → **"运行时可能通（品牌全用 `Symbol.for('cordis.*')`，`Context.is()` 明确跨副本可用）、类型一定不通"**（类型层推断，未实测） | 同左 |
| 镜像可用性 | ✅ `registry.npmjs.org` 与 `registry.npmmirror.com` 都能查到（实测） | ✅ 同左 |

**建议 B**，理由是上表"与 DSH 生态的一致性"那一行——本仓 P5 的核心动作是
"**照搬 DSH 的 slots 与装载机制，不自研**"，绑 A 线等于"照着一套实现的文档、在另一套实现上复刻"，
把最大的收益（有真实实现可对照）换成了"更干净的依赖来源"。

**但这份建议附两条硬约束**（否则 B 的收益会被它的代价吃掉）：

1. **收敛引用点**：cordis 的类型与 API**只允许出现在宿主层（Node 端）与 Web 端的 runner 里**，
   业务代码（面板 / 浮层 / Logic / 桥接方法）**只依赖本仓自己的接口**。理由：换线的成本与
   "有多少文件 `import` 了 cordis"成正比；`EditorPluginManifest` 这类清单类型**必须与 cordis 无关**
   （现状已是纯数据，保持）。
2. **精确锁版 + 升级检查单**：`.npmrc` 已是 `save-exact`，落成依赖时写 `4.0.4`（不带 `^`）；
   升级时**必须重跑** `packages/editor/spikes/` 下两个脚本（它们断言的正是我们依赖的语义）。

> 已知代价（写进 §10 纪律）：绑 DSH 分叉意味着**我们的升级节奏受别人控制**。
> 缓解不是"以后再说"，而是上面第 1 条——把引用点收敛到能被一次替换的两处。

### 2.4 一条与选型**无关**的硬事实：loader / include 是 Node-only

实测各包对 Node 内建模块的引用（`node:` / `process.` 出现次数）——
可复现：`node packages/editor/spikes/cordis-runtime-surface.mjs`
（[脚本](../spikes/cordis-runtime-surface.mjs)；扫描范围是各包的运行时目录 `lib/`）：

| 包 | `node:` | `process.` | 实际 import |
|---|---|---|---|
| cordis（核心） | 0 | 0 | 仅 `@deepseek-ai/cosmokit` |
| cosmokit / schemastery / timer / group | 0 | 0 | 仅 cordis / cosmokit |
| **cordis-plugin-loader** | 1 | 4 | `node:module` |
| **cordis-plugin-include** | 4 | 0 | `node:fs/promises`、`node:path`、`node:timers/promises`、`node:url`、`js-yaml` |

三条推论（**都影响 P5 的工程量，且不因选 A 或 B 而改变**）：

1. **"Web 半也是 cordis 插件"仍然成立**，但 **Web 端的装载不能用 `loader` 包**。
   DSH 自己正是这么做的：浏览器侧不用 loader，而是 **vendored Loader + `internal` 契约**
   （§6.6）——`EntryTree.import` 在 `ctx.loader.internal` 存在时走
   `internal.import(name, baseUrl, {})`，把"代码怎么到达"整个交给模块表。
   → 本仓照搬时：`loader` / `include` **只进 Node 宿主**；浏览器侧要自己做
   "入口图 + 模块表 + 装载器"三件（§3.5 的 M1/M2 就是这三件的两种落法）。
2. 所以 **§3.5 的模块表不是"要不要做"的选择题**：无论选 A 还是 B，浏览器端都得自建装载。
   这条成本**与选型无关**，本文档把它单列，是为了不让它被误当成"选 B 的额外代价"。
3. **schemastery（配置 schema 校验）与 timer 在浏览器侧可用**——插件的配置校验与
   `ctx.timer` 可以放在 Web 端，不必绕道宿主。

> 顺带一条口径更正：[PLUGINS.md](PLUGINS.md) 的"27.2 KB"是 **KiB**（27,814 B），
> 且**只覆盖核心**。旧记录把它记成"cordis 进浏览器要多大"，容易被读成"全套只要 27 KB"。

---

## 3. 前置二：slots 与"五类写死"的兼容路径

### 3.1 现状资产（**这是要平移的东西，不是要重写的**）

| 资产 | 位置 | 规模 |
|---|---|---|
| 清单类型（纯数据，五类贡献点） | [../src/plugins/types.ts](../src/plugins/types.ts) | 438 行 |
| 注册表 / 查询 / 同层冲突拒绝（事务性） | [../src/plugins/registry.ts](../src/plugins/registry.ts) | 433 行 |
| 层叠加（内置 < 插件 < 用户，含 `overriddenBy`） | [../src/plugins/layers.ts](../src/plugins/layers.ts) | 126 行 |
| 启用/禁用 + 持久化 + 按已安装状态对账 | [../src/plugins/state.ts](../src/plugins/state.ts)、[enable.ts](../src/plugins/enable.ts) | 265 + 121 行 |
| 引擎侧注册边界（Logic / objectview） | [../src/plugins/install.ts](../src/plugins/install.ts) | 98 行 |
| API 版本契约 + 用户 patch 层 | [../src/plugins/apiVersion.ts](../src/plugins/apiVersion.ts)、[patch.ts](../src/plugins/patch.ts) | 199 + 385 行 |
| **守门用例** | [../test/plugin\*.spec.ts](../test/) | **8 个 spec / 103 条用例 / 1337 行** |
| UI 刷新桥（插件状态 → Vue 重算） | [../src/vue-app/composables/usePluginVersion.ts](../src/vue-app/composables/usePluginVersion.ts) | 50 行 |

### 3.2 DSH 的 slots 契约（机制要点，证据来自本机真实实现）

| 机制 | 形状 | 证据（`@deepseek-ai/*`，位于 `~/.dsh/profiles/node_modules`） |
|---|---|---|
| 插槽声明 | 对 `SlotMap` 做**模块增强**，一个座位一行：`'sidebar.brand.mark': { kind: 'single'; scope: 'root'; owner: SidebarBrandMarkOwnerProps }`。`owner` 是**宿主（声明方）提供给占用者的 props 接口**——"这个座位会交给你什么"；渲染侧再用 `PropsRenderSlots<'a' \| 'b' \| …>` 把已声明座位的渲染份额组合进组件 props。注释写明 **declaring is claiming**（声明一个座位＝认领它的渲染责任） | `dsh-client-ui-sidebar/lib/types/client/contract/slots.d.ts:15-82,158` |
| 插槽服务 | `SlotRegistry extends Service`（cordis 服务）；`SlotCore` 管注册语义 / 声明账本 / 加载期校验 / **卸载级联** | `dsh-client-ui-renderer/lib/types/client/registry.d.ts:1-100` |
| 注册时点 | **经调用方 `ctx.effect`**：注册与声明注入都挂在**调用方的 fiber** 上 | 同上 |
| 依赖插槽 | `inject(key, callback)`：等插槽声明出现再装 effect；插件卸载 → 取消等待 + 移除贡献 | 同上 `:85-100` |
| 观测 | `slots/changed` 事件桥、`snapshot()`（JSON 安全声明树）、`onEntryError`（含 `abdicated`） | 同上 `:155-203` |
| 渲染 | 渲染器 `install()` / `renderSlot('root')`；`root` 是 `single` 插槽，**不要往里注册**（会遮蔽 frame 的座位） | [ARCHITECTURE.md](ARCHITECTURE.md) §6.6 |
| 组件层 | DSH 是 React，**本仓只搬机制、不搬组件**（保持 Vue 3） | 同上「目标（editor）」 |

### 3.3 兼容路径：**把"种类"留在清单，把"位置"交给 slots**

现状把两件不同的事揉在一个字段里：

- **贡献点的种类**（`panels` / `logics` / `bridgeMethods` …）＝"插件能给编辑器什么"——
  这是**数据契约**，需要可 dump、可层叠加、可 patch、可做 API 版本契约；
- **界面位置**（`placement: 'hierarchy' | 'main' | 'project' | 'bottom'`）＝"这个东西落在界面的哪一格"——
  这是**渲染契约**，正是 slots 的领域（而 DSH 的 slots **没有"层"的概念**）。

五类里只有两类属于后者：

| 贡献点 | 是不是"渲染位置" | 迁移后 |
|---|---|---|
| `panels` | ✅ | 投影到 `list` 插槽；位置支持**两种写法**：`slot`（座位名，正式，如 `panel.hierarchy`）与 `placement`（落位缩写，糖）——**S3 已落地** |
| `sceneOverlays` | ✅ | 投影到 `scene.overlay`（`list`，对应 §6.6 记的"要浮层请注册到 `shell.overlay`"那一类） |
| `logics` | ❌ | 保持：写的是**引擎全局注册表**（`registerLogic`），与"界面哪一格"无关 |
| `objectView` | ❌ | 保持：写的是 `objectview` 的默认值与"类型 → 控件"映射 |
| `bridgeMethods` | ❌ | 保持：写的是**协议方法表**（AI 桥接），每次请求现算 |

**这条切分就是问题 11 的答案**：不是把五类塞进 slots，而是**只把"位置"那一维交给 slots**；
新增一类**界面位置**（工具栏 / 状态栏 / 右键菜单）＝ **新增插槽名 + `SlotMap` 模块增强**，
不必再改 `PluginContributions` 的字段——这正是 issue 里"加一类贡献点要改核心类型"的痛点所在。

### 3.4 层叠加与"现算"怎么和 slots 共存（关键实现约束）

DSH 的 slots 没有层语义，而本仓的层叠加（内置 < 插件 < 用户 + `overriddenBy`）是**已验证资产**。
两者共存的办法是**明确谁是权威、谁是投影**：

```
清单（权威数据：五类贡献点 + 层 + 启用状态 + patch 覆盖）
        │  pickByLayer / getEnabledPlugins（保持不变）
        ▼
投影（唯一的新增动作）：把赢家注册进插槽
        │  ctx.effect(() => { slots.register(name, entry); return () => slots.unregister(name, entry) })
        ▼
SlotRegistry（活应用：slots/changed → Vue 重算 → renderSlot）
```

四条推论：

1. **层归并仍在清单侧做**，投影**只注册赢家**——`overriddenBy` / `overridePolicy: 'layered'` /
   贡献表 dump 全部保持不变（`pluginLayers.spec.ts` / `pluginTable.spec.ts` 不动）。
2. **投影的注册必须裹在 `ctx.effect` 里**（照搬 DSH）：插件被关掉时，是被**回收 fiber** 而不是
   "重新查一遍发现它不在结果里"。这不只是实现风格——#276 验收①要的"撤销后监听与定时器不再触发"
   只有前者能保证（现状的"查询现算"对渲染够用，对**插件自己的定时器/监听完全无效**）。
   > 对应 DSH 的一条坑，**原因写得很明确**：`SlotRegistry.register` **必须是原型方法**——
   > cordis 的 service 代理是在**调用时**把 `this.ctx` 绑到**调用方**的 context，卸载级联正是靠
   > 这一点进到调用方的 fiber；写成实例箭头属性会把 `this` 冻在服务自己的 root ctx 上，
   > **静默**破坏 per-plugin 卸载。
   > 证据：`dsh-client-ui-renderer/lib/types/client/registry.d.ts:68-85`。
3. **`MainLayout.vue` 从"查数据"改为"渲染插槽"**：四个 `TabPanel` 对应四个 `panel.*` 插槽，
   面板集合不再由 `rebuildTabs()` 手工重建（那是现存 4 个 `ref` + `sameTabIds` + 订阅的由来，
   见 [../src/vue-app/layouts/MainLayout.vue](../src/vue-app/layouts/MainLayout.vue)）——
   插槽的 `slots/changed` 直接驱动渲染。
4. **`usePluginVersion` 的定位下降**：它桥的是"普通函数查询 → Vue 响应式"。插槽化之后，
   渲染路径上的刷新由 `slots/changed` 负责；`usePluginVersion` 仍服务**非渲染**消费者
   （如设置面板列插件、桥接方法表的 dump）。

### 3.5 装载机制：编辑器版"入口图 + 模块表"（**模块格式待拍**）

DSH 的真实链路（[NODE_HOST.md](NODE_HOST.md) §5.3 的机制说明，本节补上实测到的字段级细节）：

| 环节 | 实测事实 |
|---|---|
| **声明** | `package.json` 的 `dsh` 只有三个角色键 `bundle` / `profile` / `client`；**宿主半不声明**——它就是包根（`main` / `exports["."]`）。`dsh.client` 必填 `platform`（Web 消费者选 `web`），可选 `inject`（**包名依赖，不是 cordis 服务注入**）、`immediately`（phase-one 预取）、`external`（超出基座的确切模块请求）。`id` 就是**包名**；`<pkg>/client` 与裸 id 经归一进同一条目 |
| **入口图** | `window.__DSH_BOOT__ = { rev, entries[], batches[] }`：`entries` 每行是一个包的浏览器半（`id`/`url`/`rev`/`inject?`/`immediately?`/`external?`）；`batches` 是分阶段调度（`phase` 只有 `bootstrap` 与 `application`）；`rev` 是对 `{entries, batches}` 的**短散列一致性锚** |
| **注入时机** | **响应期注入**：宿主侧把 `__DSH_BOOT__` 作为一行塞进 `webserver/index-inject` 表，由 `renderIndex()` 在返回 HTML 时按序渲染（`<` 转义成 `\u003c`）。**构建产物 `index.html` 里没有它** |
| **lazy 模块表** | `__ModuleLoader__.load({ id, factory })` **只注册不执行**：模块体副作用（含 CSS 注入）全在 factory 内，物化时才跑并记忆化。脚本早到时装的是 `mode:"queue"` 门面（`load` 只入队），shell 起来后切成 `mode:"live"` 并重放队列。**CSS 归属**靠 `claimStyles` 在物化时认领未打标的 `<style>`（HMR 回收依据）；`require` 成环直接 throw |
| **Loader 消费点** | 唯一：`EntryTree.import` —— `ctx.loader.internal` 存在时走 `internal.import(name, baseUrl, {})`，否则 Node 原生 `import()`。**fiber 生命周期 / inject 等待 / update-refresh 全在 cordis 侧**，模块表只管"代码怎么到达" |
| **HMR** | 宿主按 500ms `stat` 轮询每个条目的 `client.js`，元数据一变就经 SSE 推 `{type:'rebuilt', id, rev}`；浏览器侧 `entries.reload(id, rev)` → `invalidate(id, rev)`：递增该条目的 generation、把 URL 换成带新 `rev` 的**单资源**地址、删掉该条目的 factory 与缓存。**bootstrap 批不可替换**（要求整页刷新） |
| **共享依赖** | `external` = "超出**冻结基座表**（`staticModules`）的确切模块请求"。基座在 shell 启动时冻结传入（React / react-dom / cordis / client-store / ui-slots…）；命中基座键则不加图边，命中某个动态条目则强制它排在消费者之前。**漏配会报 "build-time externals drift"** |

**编辑器是 Vite / ESM，不是 lazy-CJS**，这带来三处**没有现成缝**的地方（照搬时必须自己补）：

1. **没有响应期注入阶段**：`vite build` 出的 `index.html` 是静态的，宿主改写它要么走
   "index.html 占位 + 服务端替换"，要么由宿主自己渲染 HTML（与 P2 的通道一起定）。
2. **没有按条目失效与样式回收**：Vite HMR 是"图内 ESM 热替换"，不做"按包失效 + 收回样式 +
   重建条目"。要可卸载插件，就得自带 **factory 闭包 + 缓存 + 样式归属标记**三件套。
3. **没有可替换的模块解析缝**：Vite 的依赖图在构建期固定，运行期要"基座表 + 白名单解析"，
   必须在宿主侧提供一个 `import(specifier)` 缝并让所有动态加载走它。

模块格式因此有两种落法：

| 选项 | 做法 | 优点 | 代价 |
|---|---|---|---|
| **M1：ESM `import()` 直连** | 宿主把插件 client 半的 URL 交给浏览器，`await import(/* @vite-ignore */ url)` | 实现最薄、与 Vite 原生一致、调试即普通模块 | 共享依赖靠 **importmap** 兜（Vue / feng3d 必须指向已有实例，否则打进第二份）；CSS 注入是模块体副作用 → **与 R2 冲突**（产物要可 tree-shake 的位置不能有模块级副作用） |
| **M2：自建工厂表**（DSH 式，但用 ESM 工厂） | 插件 client 半打成"注册工厂"的 bundle，`window.__EDITOR_BOOT__` 的 entries 指向它（带 `rev`）；工厂内 `register({ id, setup })`，**物化时才跑**；宿主提供的 `import` 缝供装载器解析基座/白名单 | 一个插件一个 URL + `rev`，**HMR 与共享依赖都可控**；模块体副作用（含样式）收进工厂闭包（R2 干净）；卸载时能按插件收回样式 | 要自建**三件套**：工厂表 + 缓存 + 样式归属标记；外加**冻结基座表**与响应期注入（照搬 `dsh-client-modules` 的结构，但它只覆盖"核心 + 模块表"，loader 那层要自己写，见 §2.4） |

**判据（给拍板用）**：若 P5 的第一版只求"运行时装面板插件免重新构建"，
**M1 够用且最省**；若要 **HMR + 严格共享依赖 + R2 不退化**（issue 验收②是"免重新构建"，
不是"HMR"），则 **M2**。建议 **先 M1 打通、把模块表抽象留成一层接口，M2 作为替换实现**——
但这条要在 P5 开工时定，因为它决定 `package.json` 里 client 半的**产物形状**。

> **两件仍未定**（[NODE_HOST.md](NODE_HOST.md) §5.3 自己列的）：**模块格式**（本节判据已给全）
> 与**共享依赖的声明方式**。后者的落法本文建议照 DSH 定型：宿主维护一张**冻结基座表**
> （Vue / element-plus / `feng3d` / `@feng3d/reactivity`——必须是"同一实例"的那几个），
> 插件的 `client` 声明里用 `external` 列出"超出基座的确切请求"；表里命中即不重复打包，
> **漏配要有硬报错**（DSH 的 "externals drift" 就是这条）。它与 P2 的通道协议一起定最省
> ——本质是"宿主告诉浏览器去哪儿取 Vue / feng3d"。

### 3.6 澄清一条语义：patch 的"只能覆盖、不能新建"在哪儿被解除

现状 [patch.ts:225](../src/plugins/patch.ts) 明确拒绝新建贡献点，理由是"JSON 给不出视图 loader"。
这条**不该在 patch 层解除**——patch 是**用户的表现层覆盖**（改名 / 挪位置 / 关插件），
它天生给不出代码。真正解除它的是**宿主能 `import()` 插件包**：新建 = 装一个**真插件包**
（三端包），而不是往 JSON 里塞一个没有实现的面板。

所以 #276 那条任务的措辞建议改成：**"patch 层不再需要假装能新建"**——插件装载上位后，
"装一个新面板"的路径是插件安装（宿主 + `__EDITOR_BOOT__` 入口图），patch 继续只管表现。
这样两层的职责不会互相污染。

### 3.7 分步迁移（每步都能单独合并、CI 保持绿）

| 步 | 动作 | 守门 |
|---|---|---|
| **S1** ✅ **已完成（2026-10-02）** | `src/plugins/slots/`：`SlotMap`（座位声明）+ `SLOT_KINDS`（运行期座位表，与类型**双向**锁住）、`EffectHost`/`EffectScope`（`ctx.effect` + `fiber.dispose` 的最小等价）、`SlotRegistry`（`declare` / `register` / `inject` / `entries` / `onChanged` / `snapshot`） | 新增 [../test/slots.spec.ts](../test/slots.spec.ts) **22 条**；**不接入界面**；editor 全量 **287 条全绿**；`check-strict-dirs` 0 错误；`check-editor-module-effects` 与 `check-module-side-effects --strict` 通过 |
| **S2a** ✅ **已完成（2026-10-02）** | `src/plugins/slots/projection.ts`：落位 → 座位映射（`Record<PanelPlacement, SlotName>`，新增落位时编译不过）、`declarePanelSlots` / `declareSceneOverlaySlot`（**由渲染方调用**）、**快照式** `projectContributions`（返回撤销函数 + 事务性回滚） | 新增 [../test/slotProjection.spec.ts](../test/slotProjection.spec.ts) **8 条**；editor 全量 **295 条全绿**；`check-strict-dirs` 0 错误 |
| **S2b** ✅ **已完成（2026-10-02）** | 界面改为**读插槽**：`MainLayout.vue`（四个 `panel.*` 座位）、`SceneView.vue`（`scene.overlay`）；新增 `plugins/slots/install.ts`（声明座位 + 投影 + 订阅插件状态）+ `vue-app/composables/useSlots.ts`（Vue 侧版本号桥接）；`SlotRegistry.batch` 让重投成为**一次原子变化** | 新增 [../test/slotInstall.spec.ts](../test/slotInstall.spec.ts) **4 条**；editor 全量 **301 条全绿**；**真页面验收已固化为 [../../../scripts/editor-slots.mjs](../../../scripts/editor-slots.mjs)**（`--open`，已进 CI 的 `editor-e2e` job）：11/11 通过——关掉「层级」插件后界面标签从 5 个变 4 个、恢复后回来 |
| **S3** ✅ **已完成（2026-10-02）** | 面板位置支持**两种写法**：`slot`（座位名，正式）与 `placement`（落位缩写，**糖**），类型上用联合表达"至少给一个"，两个都给以 `slot` 为准；映射与解析收进 [../src/plugins/panelSlot.ts](../src/plugins/panelSlot.ts)（`registry` 排序与投影共用，避免 registry ↔ projection 循环）；patch 校验同时认两种；桥接 dump 同时给出 `slot` 与 `placement` | 新增 [../test/panelSlot.spec.ts](../test/panelSlot.spec.ts) **4 条** + 投影等价性 1 条 + patch 的 `slot` 校验 1 条；editor 全量 **307 条全绿**；`check-strict-dirs` / `check-editor-types` 0 错误；lint 0 |
| **S4a** ✅ **已完成（2026-10-02）** | **Web 端 cordis 化**：引入与 DSH **相同**的 `@deepseek-ai/cordis` 4.0.4；`SlotRegistry extends Service`（服务名 `slots`）、`register` / `inject` 改用真实 `ctx.effect`（**显式收调用方 ctx**）、删掉自研的 `EffectHost` / `EffectScope`；`install.ts` 用 cordis 根 `Context` 引导 | editor 全量 **313 条**；`spikes/cordis-service.mjs` **6/6**；真页面 `editor-slots.mjs --open` **12/12**；`vite build` 通过（产物含 cordis，main chunk **+28 kB**）；`check-strict-dirs` / `check-editor-types` 0 错误；lint 0 |
| **阶段 5** ✅ **已完成（2026-10-02）** | **宿主产出入口图 + 页面自行装载**（#276 任务 4 的宿主半）：宿主新 Service `PluginPackages` 读 `editor.plugins.json`（`--plugins` 可换）→ 产出入口图 → 静态服务在响应 HTML 时注入 `window.__EDITOR_BOOT__`（**没有插件就不注入**）；Web 端 `plugins/loader/boot.ts` 读它并装载。**一条硬判据**：`clientUrl` 必须是能解析的地址（裸包名被拒——浏览器原生 ESM 解析不了，阶段 4 实测的坑在此钉死） | 单测 **6 条**（注入形状不合法当没有、坏条目只报错）；注入验收 [scripts/check-editor-boot.mjs](../../../scripts/check-editor-boot.mjs) **10/10**；**端到端** [scripts/editor-plugin-host-load.mjs](../../../scripts/editor-plugin-host-load.mjs) **6/6**——真构建产物 + esbuild 打的真插件包 → 界面出现 `panels.rotate`、内置面板一个不少、零 pageerror |
| **S4b** ⬜ 待做 | **宿主侧 cordis 插件树**（#272 的 P2/P3）：宿主服务（fs / 项目工作区 / 配置）与"装/卸纯服务插件"的回归用例 | 入口图这一截已在**阶段 5** 落地；剩下的宿主服务与宿主半装载属 #272 后续分期 |
| **阶段 6** ✅ **已完成（2026-10-02）** | **runtime 端产物通道**（[#277](https://github.com/feng3d-labs/feng3d/issues/277) 任务 1+2 的最小一截，补上验收③的产物侧）：按"项目启用了哪些插件"生成产物入口 → esbuild 打成一个**自包含** ESM 产物 → 在**无编辑器环境**跑它；**tree-shake 断言**（未启用插件的 runtime 端不进产物，带方法自证）；**产物级**再判一次"不含编辑器 API" | [scripts/check-runtime-artifact.mjs](../../../scripts/check-runtime-artifact.mjs) **11/11**；样板包 client 半补上 `logics` 贡献（编辑器侧也注册同一个 `__type__`）；[../test/pluginBothHalves.spec.ts](../test/pluginBothHalves.spec.ts) **2 条** |
| **S5** | runtime 端（第三端）+ 构建时打入（#277） | 决策 7 的过滤规则 + tree-shake 校验（已有 `check-tree-shaking.mjs` 思路） |
| **阶段 3** ✅ **已完成（2026-10-02）** | **三端入口与样板包**：`feng3d-editor` 加两个入口——`"."`（宿主侧共享面：版本核对 + 包声明校验 + 清单类型）与 `"./client"`（界面侧公开面：插槽契约 + 清单形状 + API 版本）；新增样板插件包 [`@feng3d/editor-plugin-rotate`](../../editor-plugin-rotate/README.md)，**三端齐全**（`"."` / `"./client"` / `"./runtime"`）+ `feng3dEditor` 三块声明；`check-runtime-half-deps.mjs` 从"只有合成样例"升级为**真扫一个包** | 新包 **16 条**测试（三端各一组 + 声明自洽的反向守门）；`check-layer-direction`（登记 **Layer 6 编辑器插件**）/ `check-strict-packages`（20/20）/ runtime 依赖门禁全绿；editor lint 0、类型 0 |
| **阶段 4** ✅ **已完成（2026-10-02）** | **运行时装载器**（[`src/plugins/loader/`](../src/plugins/loader/)）：**模块表**（可替换的 `import()` 缝，为 M1/M2 与宿主分发留位）+ 装载/卸载 + **入口图**契约（`PluginEntryGraph`）。装载一个包 = 导入 `"./client"` → 核三件事（清单 id 一致 / `apiVersion` 兼容 / 条目确有 client 端）→ 登记清单 → **重投插槽**；卸载 = 先撤引擎侧贡献、再移清单、清用户开关、重投。**"装载失败是数据"**（返回 problems，不抛错、不留半成品） | editor 全量 **323 条**（装载器 **10 条**，装载对象是**真样板包**不是 mock）；**真页面** [`scripts/editor-plugin-load.mjs`](../../../scripts/editor-plugin-load.mjs) **9/9**——界面标签 `5 → 6`（多出 `panels.rotate`）、卸载后回到 5、零 pageerror；`registry` 补 `unregisterPlugins`；editor lint/类型 0 |

**阶段 4 撞到的一个真实约束（值得记下来）**：**浏览器原生 ESM 不解析裸包名**。
`import('@feng3d/editor-plugin-rotate/client')` 在页面里报
`Failed to resolve module specifier`——构建期的静态分析能解析它，运行期不能。
所以入口图给出的说明符必须是**目标环境能解析的**：dev 下是 vite 的 `/@id/<裸说明符>`，
生产下是构建产物 URL。**这正是"模块表"这一层存在的理由**，也正是 §3.5 里
M1「`import()` 直连 + 基座表」中"**基座表**"要干的事：把包名映射成 URL。
（单测里裸包名能解析——vitest 走的是 vite 的解析器，所以**只测单测会漏掉这条**，
真页面那条 e2e 才是它的守门人。）

**三端入口的现状**（阶段 3 之后）：

| 端 | 声明位置 | 现在的实现 | 还缺什么 |
|---|---|---|---|
| 宿主（Node） | 插件包 `exports["."]` | `feng3d-editor` 的宿主侧公开面（`src/host/`）+ 样板包的 cordis 插件半 | **宿主进程**（#272）：谁去 `import()` 插件包、谁维护 cordis 树 |
| 界面（Web） | 插件包 `exports["./client"]` | `feng3d-editor/client` 契约 + 插件清单（面板走 `slot` 座位名） | 运行时装载（插件包现在仍是构建期进来的）——同 #272/#273 |
| 游戏端（runtime） | 插件包 `exports["./runtime"]` | 样板包注册同一个 `__type__` 的 Logic，边界由门禁守 | **构建期打入产物**（#277）：谁的启用状态决定打进什么 |

**一个刻意的选择**：`feng3d-editor` **自己**不声明 `"./runtime"`。runtime 端属于**插件包**
（它是"被产物带走的那一半"），而编辑器的 runtime 端没有语义；况且 runtime 依赖门禁的判据之一是
"不得用相对路径穿越回 `packages/editor/**`"——把 `./runtime` 挂在编辑器包上会被自己的门禁拦下
（这是**对的**：那条规则的用意正是"runtime 半不许回头依赖编辑器"）。

**S1–S3 不依赖宿主**，可以**在 #272/#273 之前开工**——这是本文档最有价值的结论之一：
slots 化（Web 端）与宿主（Node 端 + 通道）是两条能并行的线，只共用"顺带定下来的机制"。
**S4a 已证明这条成立**：cordis 在浏览器里跑起来了（Web 端 cordis 化不需要宿主）。

#### S4a 落地时撞到的三条 cordis 硬约束（后续步骤必须遵守）

都在真库上实测过（证据：`packages/editor/spikes/cordis-service.mjs`）：

| # | 约束 | 后果 / 应对 |
|---|---|---|
| 1 | **cordis Service 的状态不能用 `#` 私有字段** | 服务代理会让 `this` 变成 Proxy（`ctx.slots` 与"先取到变量再调用"拿到的都是代理），而 JS 私有字段无法透过 Proxy 访问：`TypeError: Cannot read private member … from an object whose class did not declare it`。→ `SlotRegistry` 用 TS `private`（运行期是普通属性）。**这是本包唯一一处偏离根 `AGENTS.md` §3「私有状态用 #field」的地方，属技术限制** |
| 2 | **`register` / `inject` 显式接收调用方 `ctx`** | DSH 靠服务代理隐式把 `this.ctx` 绑到调用方，但那与约束 1 互斥。显式传参同样拿到"调用方 fiber 卸载 = 注册消失"（已实测），且更好追"是谁注册的" |
| 3 | **插件访问服务要先声明 `inject: ['slots']`** | 不声明会报 `cannot get property "slots" without inject`。→ 为阶段 3/4 的插件清单设计提供依据：插件的依赖声明要能映射到 cordis 的 `inject`（清单目前**没有**这个字段） |

**一条能力边界（如实记录，不假装能检测）**：调用方 fiber **已卸载之后**再 `register`，
cordis **不报错**（实测：`ctx.effect` 照常返回 disposer），于是那条注册会变成**孤儿**——
不会被任何 fiber 自动回收。cordis 也没给出可靠判据（`fiber.id` 释放前后都是 `undefined`、
`fiber.state` 前后都是 `ACTIVE`）。所以契约是：**调用方必须在自己的 fiber 卸载前撤销注册**，
或持有返回的 `release`；装载器（`install.ts`）用的正是"核心自己的、活着的 context"，主路径不受影响。
（S1 的自研 `EffectScope` 曾有 `disposed` 标志能挡住这种误用——换成 cordis 后失去了这个能力，
这是"用真库"换来的一致性所付的代价。）

#### S1–S2b 落地时定下的五个要点（后续步骤要吃住）

1. **"声明即认领"在编辑器里的落法**：座位由**渲染它的那一方** `declare`
   （S2 起是 `MainLayout.vue` / `SceneView.vue`）。注册到未声明的座位直接报错，报错里列出当前已声明的座位
   ——这就是 DSH `SlotCore` 那条"加载期校验"的等价物。
2. **类型表与运行期座位表由编译器双向锁住**：座位名的类型面在 `SlotMap`（模块增强），
   运行期要 `kind` 才能做 `single` / `list` 校验，于是有 `SLOT_KINDS`——它的类型写成
   `Record<SlotName, …>`，**少一个键编译不过、多一个键触发字面量的多余属性检查**，不会漂移。
3. **与 DSH 的一处有意差异**：`single` 座位上的第二个注册，DSH 是**遮蔽**（动态注册者优先级更低因而"赢"，
   结果是页面只剩它、框架全部座位消失），本仓改为**直接报错并点名占用者与来源**。依据是本仓已确立的
   同层冲突纪律（`registry.ts` 的 `findSameLayerConflicts`、`pluginInstall.spec.ts` 的
   「重复的类型名在注册时被拒绝（后注册静默顶掉先注册更难查）」）——而层归并已经在清单侧做完，
   插槽层再出现重复就是 bug，不是配置。落地见
   [../src/plugins/slots/registry.ts](../src/plugins/slots/registry.ts) 的类注释与用例
   「single：第二个占用者被拒绝，报错点名已占用者与来源」。
4. **投影必须是"快照式"的（S2a 踩到的坑）**：`register` 的幂等只保证"同 id 不重复添加"，
   **不会**移除"上次投影有、这次没了"的贡献点（插件被禁用 / 卸载 / 被更高层覆盖都会这样）。
   所以 `projectContributions` **返回撤销函数**，装载器重投前先撤销；并且中途失败要**回滚**
   本次已注册的（事务性，同 `registerPlugins` 的纪律）。用例：
   「禁用插件后重新投影，它的占用不再出现在插槽里（投影是快照：先撤销再重投）」
   与「投影失败时事务性回滚」。
5. **重投必须是"一次原子变化"（S2b 踩到的坑；对抗性审查后又补了一层）**：投影是**先撤后加**，
   逐个通知的话渲染方会先看到"座位上一个占用都没有"、再看到新集合——标签区闪空，某些渲染方还会在
   空集合上出错。`SlotRegistry.batch()` 把一次投影合并成**每个座位一次**通知。
   **但这还不够**：`projectContributions` 的批只覆盖"注册"那一段，**"撤销"那一段在它外面**
   （`install.ts` 的 `reproject` 先调 `unproject()` 再调投影）——撤销会逐条通知，界面照样先看到空集合。
   实测后果：**关掉只贡献浮层的粒子插件也会把四个标签区清空重建**，用户手工调整过的标签布局丢失
   （`MainLayout.vue` 的 `sameTabIds` 守卫被"先空后满"骗过去）。现在 `reproject` 把"撤销 + 重投"
   整体放进同一个 `batch`。守门用例：
   「重投是**一次原子变化**：面板座位只通知一次，且看到的永远是完整集合（M1 回归）」与
   「关掉只贡献浮层的插件时，**最终非空**的座位在通知期间不会读到 0」。
   > **教训**：说"某操作是原子的"时，必须指名**哪一段代码**在批里——批的边界差一行就等于没有。
   > 当时文档、`MainLayout` 的注释、被引用的用例三处都写着"重投是原子的"，
   > 而没有一条用例测过 `unproject(); project()` **这对组合**（只测了单次投影）。
6. **占用载荷要带齐渲染所需的信息**：最初只放视图 loader，结果标签页拿不到 `labelKey` / `icon`
   ——渲染方除了读插槽还得回头查清单，"插槽是唯一数据来源"就成了空话。现在载荷是**贡献点本体**。
   见 [../src/plugins/slots/types.ts](../src/plugins/slots/types.ts) 的 `SlotEntry` 说明。
7. **联合类型配 `Partial` / `Omit` 会静默丢字段（S3 踩到的坑）**：`PanelContribution` 是
   "`slot` 与 `placement` 至少给一个"的联合类型，而 `Partial<T>` / `Omit<T, K>` 对联合**不分发**
   ——`Partial<PanelContribution>` 的 `keyof` 只取两个分支的**公共**键，`slot` / `placement`
   会从类型里悄悄消失（patch 里写 `slot` 就会被当成多余字段）。所以 patch 的输入类型
   `PartialPanel` 是**手写**的，并在合并处显式断言（注释说明为什么）。若将来别处要对
   `PanelContribution` 做映射类型，先想清楚这一点。
8. **patch 覆盖位置时，判据必须是"patch 给了哪个字段"（对抗性审查发现的坑）**：
   `resolvePanelSlot` 是 `slot ?? placement`（**slot 永远赢**），而 patch 走的是浅合并——
   下层面板写 `slot`、用户在 patch 里写 `placement` 时**两个字段都在** → `slot` 赢 → **位置没动**，
   而 `applied: true`、`overriddenContributions` 有条目、控制台还打"已生效"（用户看到成功、实际没生效）。
   修法：看 patch 的**原始输入**（`entry`）给了哪一种位置，把继承来的另一种删掉。
   > **教训（第一版就修错了）**：写成"合并结果里有 `slot` 就删 `placement`"是错的——合并结果里
   > 两个字段都在，那样删掉的是 **patch 自己写的那个**，行为与不修一样。新加的回归用例
   > 「patch 用 placement 覆盖一个写了 slot 的面板：位置真的变（M2 回归）」当场把它抓了出来。
   > 这也是"先写用例再相信修复"的价值：这条 bug 单看代码很像已经修好了。

**真页面验收（S2b 的实际验证方式）**：已固化成脚本 **`node scripts/editor-slots.mjs --open`**
（进了 CI 的 `editor-e2e` job）。它验的就是这条链的**最后一段**：界面标签 = 五个内置面板、
关掉「层级」插件后**标签真的少一个**、恢复后回来、关掉浮层插件不影响面板标签、全程 pageerror 0
（本机实测 11/11）。本地跑需要 dev server：`npm run dev --workspace feng3d-editor`。

> 为什么不只靠单测：单测覆盖"状态变化 → 重投插槽"与"投影把谁摆上座位"，
> **中间那段 `slots/changed → MainLayout 重建标签` 只有真跑一遍才知道**——
> 注册表接错、界面还在读旧查询、订阅没建立，纯函数测试一个都发现不了。

---

## 4. 前置三：数据层三端边界（#267 决策 7）

### 4.1 事实：旧表达已丢失，现在是隐式约定

| 事实 | 证据 |
|---|---|
| `HideFlags` 枚举**仍导出**，含 `DontSaveInBuild = 16` | `packages/feng3d/src/core/HideFlags.ts:29` |
| 但 `Object3D` / `Component` **已无 `hideFlags` 字段** → 枚举成为**孤儿导出**（全仓 0 消费方） | `packages/editor/src/navigation/Navigation.ts:61-62`、`hierarchy/Hierarchy.ts:387-388`、`feng3d/mrsTool/MRSTool.ts:167`、四个 Icon 脚本（`CameraIcon.ts:205` 等）各有注释记"无替代" |
| 编辑器层对象靠**名字**隐式区分 | `packages/editor/src/feng3d/EditorView.ts:104`（`name: 'editorViewRoot'`）；桥接侧只把游戏场景树暴露给 AI（`bridge/read/readCore.ts:41,73`） |

也就是说：**"哪些东西不进产物"这件事，现在只能靠"它挂在 `editorViewRoot` 下"来猜**。
插件一旦自己往场景里加编辑器专用对象（gizmo、导航可视化、地面网格），这条约定就管不住它。

### 4.2 候选做法

| 候选 | 做法 | 优点 | 代价 |
|---|---|---|---|
| **A：恢复引擎侧字段** | 在纯数据接口上恢复 `hideFlags`（含 `DontSaveInBuild`），构建时按标志过滤 | 表达力最强、旧 API 语义回归 | **动引擎核心**（纯数据接口 + 序列化 + 全部 Logic），且"构建"是编辑器的概念，渗进引擎违背 R1 的分层意图 |
| **B：插件清单声明（建议）** | 插件在清单里声明"哪些 `__type__` / 组件只属编辑器"；构建时按这份**数据**过滤，编辑器照常显示 | 与清单同构（可 dump / 可检查 / 可层叠加）；不动引擎；**过滤规则本身是数据**，与 D1（编辑格式 = 运行格式）一致 | 需要一处"构建过滤器"+ 门禁（新规则必须有执行者，对齐 §15 元规则）；跨插件类型冲突要定义优先级 |
| **C：维持隐式约定 + 剪子树** | 构建时整棵剪掉 `editorViewRoot` 子树 | 零新增概念、立刻可用 | 插件无法声明自己的编辑器专用对象；`editorViewRoot` 一旦有产物需要的子树就会被误剪 |

**建议 B**，并把 C 作为 B 的**兜底**（未声明的一律按"进产物"处理，避免"默认丢弃"这种危险默认）。

### 4.3 与 D1 的关系（别只当打包问题）

[ARCHITECTURE.md](ARCHITECTURE.md) §6.6 已指出：**过滤规则也是数据的一部分**（D1 编辑格式 = 运行格式）。
落到本文档就是：B 的声明字段必须进 `EditorPluginManifest`（而不是散在构建脚本里），
否则"同一场景在编辑器与产物里表现不一致"会变成又一处要靠人记的约定。

### 4.4 runtime 端的硬边界（已明确，不需要拍板）

- runtime 端**只能依赖引擎 API（feng3d）**，**禁止依赖编辑器 API**（§6.6「边界约束（硬性）」）；
- 装载走**决策 A（构建时打入）**，只打**该项目实际启用的**插件的 runtime 端（已决策）；
- 因此 runtime 端产物**必须可 tree-shake** → 不得有模块级副作用（与 R2 同向）。

**已落地的执行者**：[`scripts/check-runtime-half-deps.mjs`](../../../scripts/check-runtime-half-deps.mjs)
（已进 CI）——扫每个声明了 `"./runtime"` 的包，递归它的相对 import 闭包，命中
`feng3d-editor` / `@feng3d/editor*` / `vue` / `element-plus` 即失败；**相对路径穿越到
`packages/editor/**`** 也算失败（`../../editor/src/...` 绕过了包名检查，但同样把编辑器拖进产物）。

它**自带合成样例自检**（8 条：允许引擎 API、禁掉编辑器 API / Vue / Element Plus、两个相对路径样例）：
现在仓库里还一个 `./runtime` 都没有，没有自检的话这就会是个"永远绿"的门禁——
而门禁最怕永远绿（等真写出第三端时，才发现扫描器一直坏着）。

---

## 5. 对 #276 验收项的落点

| #276 验收 | 现在能不能验 | 落点 |
|---|---|---|
| ① 装/卸纯服务插件：撤销后监听与定时器不再触发 | ✅ **机制已验三层**：真 cordis 的 `inject` 等待与 `fiber.dispose()`（§2.1，6/6）+ cordis **服务**与子 fiber 卸载级联（`spikes/cordis-service.mjs`，6/6）+ 插槽层回归用例（`slots.spec.ts` 第 3 组，**跑在真 `Context` 上**） | ✅ **真实插件包装载路径已通**（阶段 5：宿主装载端到端）——宿主半的"装/卸纯服务插件"用例可以在它之上补 |
| ② 运行时装面板插件**免重新构建**即出现在界面 | ✅ **端到端达成**：宿主读插件配置 → 产出入口图 → 注入页面（`window.__EDITOR_BOOT__`）→ 页面启动自行装载 → 登记清单 → 重投插槽 → 界面出现它的面板。证据 [scripts/editor-plugin-host-load.mjs](../../../scripts/editor-plugin-host-load.mjs) **6/6**：真构建产物 + esbuild 打的真插件包 + 零 pageerror | 弱化项：共享依赖（Vue / 引擎）目前由插件自己带着；基座表 / importmap 属 #273 后续 |
| ③ 插件引入的新 `__type__` **两端都有行为**（同场景两边一致） | ✅ **两端都有实证**：编辑器侧——装载样板包后 `logic({ __type__: 'Rotate' })` 拿到行为（[../test/pluginBothHalves.spec.ts](../test/pluginBothHalves.spec.ts) **2 条**，走真实装载路径）；游戏端——构建期把 `./runtime` 打进产物、在**无编辑器环境**跑 `logic().update(1) === 90`（[../../../scripts/check-runtime-artifact.mjs](../../../scripts/check-runtime-artifact.mjs) **11/11**，含"未启用插件不进产物"与 5 条"产物不含编辑器标记"） | 弱化项：真实 `build` / `publish` 命令接到项目构建流程属 [#277](https://github.com/feng3d-labs/feng3d/issues/277) 的其余任务 |

#### 与 issue 原文的两处**有意差异**（如实记着，别当成"已经照做"）

| #276 原文 | 实际实现 | 为什么 |
|---|---|---|
| 任务 4「cordis Loader 的 `internal` 契约」 | **自建装载器**（[../src/plugins/loader/](../src/plugins/loader/)：模块表 + 入口图 + 装载/卸载） | `cordis-plugin-loader` / `cordis-plugin-include` 是 **Node-only**（§2.4 实测：依赖 `node:url` 等），浏览器端用不了——"浏览器端装载必须自建"这条**与 cordis 选型无关**，是平台事实 |
| 任务 7「解除 patch『只能覆盖、不能新建』」 | 解除路径是**运行时装载**，不是"让 patch 能新建" | patch 是用户**覆盖层**（层叠加），语义就是"改已有的"；"新增功能"走装载（装一个插件包）。把"新建"塞进 patch 会让层语义与装载语义混成一团 |

---

## 6. 仍未决策 / 未核实（不要当成已定）

| 项 | 状态 | 谁定 |
|---|---|---|
| **插件安全模型**（插件能跑任意 Node 代码：仅本机 / 签名 / 沙箱） | ⬜ 未决策，§11 问题 8 **阻塞 P5** | 需求方 |
| **editor Web 与 VS Code Web 的界面关系** | ⬜ 未决策，§11 问题 14 **阻塞 P2/P5** | 需求方（#267 决策 3） |
| **模块格式 M1 / M2**（§3.5） | ✅ **已采纳 2026-10-02**：先 M1（ESM `import()` 直连）打通，模块表留成一层接口，M2 作为替换实现 | —（P5 开工时按 §3.5 判据复核） |
| **共享依赖 external 的声明方式** | 🔶 落法已给（§3.5：冻结基座表 + `external` 声明 + 漏配硬报错），实现并入 P2 | 需求方 + #273 |
| **两线 API 的实际差异**（fork 4.0.4 vs 上游 rc.8~rc.10） | ⬜ **未核实**（本机无上游副本、未安装；GitHub / unpkg / npmjs 均不可达）。已知的是**版本已倒挂**（§2.3）：上游 include 1.1.0 > fork 1.0.9、上游 timer 1.1.3 < fork 1.1.6 | 选 B 后不混装即无此问题；若将来重新评估选型，得先做一次 diff |
| **A 线的浏览器打包体积** | ⬜ 未实测（本机无副本；exports 无 browser 条件，两条线**都是**这样，浏览器可用性靠产物本身） | 仅在重新评估选型时需要 |
| `@deepseek-ai/cordis-plugin-hmr` | ⬜ 本机是**悬空链接**（指向已不存在的 npx 缓存目录），版本与 API 未核实 | 真要用 HMR 前先装一次确认（§3.5 的 M2 会用到它） |
| `packages/editor/packages/` 三个子包归属 | ⬜ 未决策（§11 问题 9） | 需求方 |

---

## 7. 依据

- [ARCHITECTURE.md](ARCHITECTURE.md)：§6.6（三端机制对照，含 DSH 包行号证据）、§10（P5 行）、§11（问题 1/8/9/11/14）
- [NODE_HOST.md](NODE_HOST.md)：§4（cordis 接管范围）、§5.2（三端入口）、§5.3（入口图 / 模块表）
- [PLUGINS.md](PLUGINS.md)：cordis 结论反转、实测事实表
- [#267 开工前决策清单](https://github.com/feng3d-labs/feng3d/issues/267)（决策 7 / 决策 1 的出处）、
  [#276 插件三端形态](https://github.com/feng3d-labs/feng3d/issues/276)、
  [#272 宿主骨架](https://github.com/feng3d-labs/feng3d/issues/272)、
  [#273 WebSocket 通信层](https://github.com/feng3d-labs/feng3d/issues/273)、
  [#277 构建发布](https://github.com/feng3d-labs/feng3d/issues/277)
- 实测脚本：[@../spikes/README.md](../spikes/README.md)
