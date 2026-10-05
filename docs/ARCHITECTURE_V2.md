# Feng3D 架构演进规划 V2

> 状态：规划文档（2026-09）。本文档与 [FRAMEWORK_DESIGN.md](../FRAMEWORK_DESIGN.md)（目标架构）、
> [FRAMEWORK_REFACTOR_PLAN.md](archive/FRAMEWORK_REFACTOR_PLAN.md)（上一轮改造计划）的关系见 §5.1。
>
> **本规划的全部结论建立在实测数据上**：类型检查、622 单测、lint、178 条 e2e 基线、
> benchmark、git 演化史、以及三方引擎（three.js 0.185 / PlayCanvas 2.23-beta / Babylon.js 9.28）的
> 源码与官方文档核实。凡标注「实测」的均为本次验证结果，非文档转述。

---

## 1. 战略前提：选择战场，而不是全面开战

> 定位的完整表述（目标场景与用户画像、竞争优势四层分类、非目标、发展优先级）见
> **[POSITIONING.md](./POSITIONING.md)**。本章回答「为什么必须选战场」，该文档回答「选中的战场上凭什么赢」。

### 1.1 残酷的现实对比

| | Feng3D | three.js | PlayCanvas | Babylon.js |
|---|---|---|---|---|
| 维护者规模 | **1 人**（git 3529 次提交，作者单一） | 1000+ 贡献者 | 公司团队 | 微软背景团队 + Lite 团队 |
| 核心代码量 | ~2.8 万行（feng3d + webgpu） | **12.8 万行** | 大 | 极大 |
| 示例/生态 | 178 示例 | **595 示例 + 442 addons** | 编辑器商店 | Playground + 论坛 |
| 资源加载器 | **1 个**（简化 GLB） | **47 个** | 完整 | 完整 |
| 编辑器 | 收过（editor 已失修） | 与核心解耦 | **一等公民** | Inspector/NME/NRGE |

**结论：任何"全面超越三家"的规划都是不成立的。** 在特性数量、生态厚度、加载器矩阵、
物理/XR/后处理全家桶这些维度上，1 人 vs 数百人的差距无法用架构弥补。

因此本规划的第一原则是：**主动放弃全面竞争，只在三个战场上做到无可替代。**

### 1.2 三个必须赢的战场

#### 战场 A：数据即应用（Data-as-Application）

**唯一性事实**（实测）：四家中只有 feng3d 做到「编辑格式 = 运行时内存结构」——
JSON 字面量本身就是运行时数据结构，`logic()` 惰性附加行为，没有"代码构建对象图"或
"JSON → 实例化 ECS"的中间步骤。

| | 事实来源 | 序列化路径 |
|---|---|---|
| Feng3D | **JSON 即内存** | 直接写入/读出 |
| three.js | 命令式对象图 | `toJSON()` / `ObjectLoader`（白名单 switch，自定义类不可无损往返） |
| PlayCanvas | Editor JSON → 实例化 | `parsers/scene.js` / `template.js` |
| Babylon.js | 命令式对象图 | `.babylon` + `@serialize` 装饰器 |

**战场定位**：编辑器、数字孪生、可视化工具、AI 生成场景、需要"存盘即等价"的应用。

**必须做到的**：单 JSON 完整还原运行（含资源、动画、Prefab、共享引用）+ 修改数据即可热更新 +
任何数据都能被工具（Inspector）直接消费。

#### 战场 B：零浪费渲染（Zero-Waste Rendering）

**唯一性事实**（实测 + benchmark）：静态场景 **computed 求值 0/帧、实际提交 0/秒**
（5000 对象帧时间 220ms → vsync 附近，基线见 [BENCHMARK_BASELINE.md](../BENCHMARK_BASELINE.md)）。

对比三家的更新模型（源码/文档核实）：

| | 变换更新 | 静态场景每帧 |
|---|---|---|
| Feng3D | 响应式 computed 全链路惰性 | **0 求值 + 0 提交** |
| three.js | 局部脏标记，但每帧递归全树 + 投影 + 排序 | O(n) + O(n log n) |
| PlayCanvas | 脏标记 + 惰性求值（`_dirtyWorld`/`getWorldTransform`） | O(n) system 调度 |
| Babylon.js | **无通用脏标记**，每帧重算 + 手动 `freeze*()` | O(n) activeMeshes 评估 |

**战场定位**：静态或低频变化的大场景——工业监控、BIM/GIS、展示、编辑器视口。

**必须做到的**：零提交是**可验证的默认行为**，且这个能力不能被后续重构稀释。

#### 战场 C：可验证的架构纪律（Verifiable Discipline）

**唯一性事实**：四家中只有 feng3d 用自研 linter 强制架构纪律
（`eslint-plugin-feng3d` 的 `reactive-naming` / `no-reactive-export` / `no-reactive-argument` /
`effect-annotation`）。three.js / PlayCanvas / Babylon 的架构约束全靠约定与 review。

**战场定位**：长期可维护性、多人/AI 协作友好、把架构决策变成 CI 能拦住的东西。

**必须做到的**：**每条规范都有机器执行者**（§3 的核心），且规范与实现不允许出现"文档说已实现、
代码没实现"的漂移（§5）。

### 1.3 三个主动放弃的战场

| 放弃 | 理由 |
|---|---|
| 全功能游戏引擎（物理 / 寻路 / XR / 音频混音 / 后处理全家桶） | Babylon.js 的护城河，1 人无法覆盖 |
| 最大加载器/生态矩阵 | three.js 有 47 个加载器 + 442 addons；应当做**高质量少数**（glTF 完整 + 3~4 个常用格式） |
| 云编辑器 + 托管服务 | PlayCanvas 的商业产品形态，非技术问题 |

### 1.4 竞争态势与 Babylon Lite 对照

> 依据：Babylon Lite 官方架构规范（`docs/lite/architecture/00-overview.md` 等 50 篇，2026-09 核实）、
> 其 `GUIDANCE.md`，以及 three.js 0.185 源码 / PlayCanvas 2.23-beta / Babylon.js 9.28 官方文档。

#### 1.4.1 竞争态势总表

| 对手 | 能否做得更好 | 具体维度 | 状态 |
|---|---|---|---|
| **three.js** | ✅ 能 | 静态/低频场景每帧成本（实测 0 求值 + 0 提交 vs 其每帧全树遍历 + 排序）；数据序列化往返（其 `ObjectLoader` 是白名单 `switch`，自定义类不可无损往返）；架构纪律（自研 linter vs 无） | **部分已成立** |
| **PlayCanvas** | ✅ 能 | 引擎独立可用性（不绑编辑器生态）；每帧成本（每帧 system 调度）；序列化（需 Editor 导出 → 实例化） | 成立 |
| **Babylon.js** | ✅ 能 | 包体（官方自认兼容包袱重，故另起 Lite）；每帧成本（**无通用脏标记**，靠手动 `freeze*()`）；简洁性 | 成立 |
| **Babylon Lite** | ⚠️ **仅两个维度** | ① **零提交** ② **响应式 computed 全链路惰性**；其余维度全面落后 | 见 1.4.2 / 1.4.3 |
| **任何一家** | ❌ 不能 | 生态与加载器矩阵 · 全功能特性集 · 编辑器成熟度 · 企业支持 · 向后兼容承诺 | 战略性放弃（§1.3） |

#### 1.4.2 Babylon Lite 才是真正的对手

Lite 与 feng3d 的主张高度重合（WebGPU-only、纯数据 + 函数、零模块级副作用、tree-shaking），
但**有官方团队资源，且跑得更远**。以下为据其架构文档核实、**feng3d 全部没有**的能力：

| 类别 | Lite 已有 |
|---|---|
| 渲染编排 | **FrameGraph**（`src/frame-graph/`：task 排序 / RenderTask / pass / render target / RTT 纹理流） |
| 阴影 | **Cascaded Shadow Maps**（方向光级联）· ESM + PCF · Gaussian blur |
| 着色器 | **ShaderFragment 组合系统**（`shader-composer.ts` + `*/fragments/*`——这才是它的"着色器单源"方案） |
| 材质扩展 | **Material Plugin**（opt-in、自注册、"zero-impact extension seam"） |
| 实例化 | Thin Instances（per-instance matrix + color） |
| 动画 | **VAT** 顶点动画纹理 · Morph Targets（GPU texture weights）· AnimationGroup |
| 拾取 | **GPU Picking（ID pass）** + CPU ray/triangle 精确拾取 |
| 内存与坐标 | **Resource Pool**（GPU buffer/texture 池化）· **Floating Origin / Large World** · **F64 高精度矩阵** |
| 健壮性 | **Device Lost Recovery**（opt-in）· **Coded Errors**（见 1.4.4） |
| 生态 | 完整 glTF（basisu / meshopt / quantization / xmp / animation）· HDR/IBL · KTX2/DDS/USD/`.babylon` loader · Sprites · GPU 字体排版 · 音频 · Havok 物理 · Recast 导航 · Flow Graph |

**它的工程标准**（同样值得逐项对照）：

| 项 | Babylon Lite | Feng3D 现状 |
|---|---|---|
| TS 严格度 | `strict: true` + `noUncheckedIndexedAccess` | **4 项 strict 关闭** |
| 像素门禁 | **RMSE < 1.0**（0–255 标度） | 容差 0.01–**0.4**（部分用例已失去检测力） |
| 包体 | byte-exact 天花板 + CI 基线 | **无测量** |
| 文档 | 50 篇"删掉源码可据此重建"的架构规范 | 与实现并存、已漂移 |
| 模块级副作用 | **明令禁止**（含 `new Map()`） | ✅ 已进 CI 门禁：`scripts/check-module-side-effects.mjs --strict`（缓存 `new Map/WeakMap/Set/WeakSet()` + 项目自有的 `new ChainMap()`、启动型调用、`globalThis` 写入，泛型实参不影响判定；`ChainMap` 不套空参限制）+ `scripts/check-toplevel-new.mjs`（其余模块级 `new` 按存量基线冻结）；**判据为 AST**（issue #614，两条脚本共用 `scripts/r2-module-scope.mjs`，覆盖类 `static` 字段 / 块、顶层 IIFE、多行声明、模块级块 / 对象字面量 / 回调；应用入口按 `ENTRY_FILES` 清单豁免）；全仓顶层缓存已 lazy-init、`Ticker` 启动改惰性（#88）、三处 `new WeakSet()` 已 lazy-init（#606） |

**Lite 的已知限制**（官方自述，对照需公平）：无后处理（image processing 在着色器内完成）、无 LOD、**无编辑器**。

#### 1.4.3 feng3d 相对 Lite 的两个真实优势（含壁垒分析）

**① 零提交 / 按需呈现**
- 实测：静态场景 computed 求值 **0/帧**、实际提交 **0/秒**，画布保持最后呈现帧。
- Lite 据其架构文档的渲染循环描述为 `_update()` → `frameGraph.execute()` → `submit`，**每帧执行**，
  未见"数据不变则跳过提交"机制；其惰性止于矩阵传播（`world-matrix-state.ts` 的
  Version-based world matrix propagation）。
- **结构性壁垒**：Lite 每帧重建/执行 render task，要获得"零提交"须改渲染循环骨架；
  而 feng3d 的版本戳是内生机制（`View.submit` 打 `getMutationCount()` → `WebGPU.submit` 比对后直接 return）。

**② 响应式 computed 全链路惰性**
- feng3d 的依赖图覆盖资源加载、材质、几何、renderObject、pass、submit **全链**；
  Lite 是局部版本号脏标记 + 每帧循环。
- 衍生资产：计算图可观测（`computedGraphStats`）、改数据即热更新、编辑器数据流的基础。

#### 1.4.4 必须正视的两个问题

**① 目标场景上的能力差距，比特性数量差距更致命**
Lite 领先的 CSM、VAT、Resource Pool、Floating Origin、High-Precision Matrix、GPU Picking
**恰恰是"重场景"需要的**——而重场景正是本规划的战场 B。这不是"少几个特性"，
而是"在自选战场上的关键能力缺失"。

> **进展（issue #99）**：Floating Origin / 高精度矩阵已完成**方案评估 + 可复核的量化证据**，落在
> `packages/feng3d/src/core/eyeRelative.ts` 与它的单测（6 个用例）：f32 间隔表（1e6 → 6.25e-2、1e7 → 1）、
> 眼相对后参与 f32 运算的平移量降到"物体到相机的距离"（实测 1e6 → 10，精度提升 >1e4 倍）、
> `viewProjection′ × modelMatrix′ == viewProjection × modelMatrix` 的恒等性、相机在原点时的退化。
> **接入渲染链与"抖动消失"的验收需要在有 GPU 的真机上做**（本仓 CI 无 GPU），
> 故本轮只交付纯函数与证据；接入路径写在那个文件的头部注释里。

**② Coded Errors 是"静默失效"的正解**
Lite 的错误处理是**编码错误**：默认返回错误码，`enableErrorDecoding`（常开）与 `decodeError`
（按需解码）分离，兼顾包体与可调试性。对照 feng3d 现状——`console.error` + 静默降级，
且 `logic.ts:123` / `View.ts:365` 用 `process.env.NODE_ENV` 判断 dev/prod，
**浏览器里没有 `process`，等于永远走 dev 分支**。

→ 这印证了 §2.2 #1 与 §4 P0 的判断：**错误可观测性是架构级特性，不是日志风格问题**；
同时也是 §5.2 之外、AI 协作能否成立的另一个前提（AI 无法从静默失败中学习）。

#### 1.4.5 由此导出的目标定义与 P4 取舍边界

**目标定义（收窄）**：不做"最好的 Web 3D 引擎"——该位置的评价标准（生态、特性数、示例量）
是 feng3d 注定失分的维度。改为：

> **"重场景、静态或低频变化、数据必须可存盘且可被工具消费"这一类需求下，唯一正确的选择。**

**P4 取舍边界**（对照 §1.4.2 制定，替代"看到好特性就补"的默认行为）：

| 决策 | 项 | 理由 |
|---|---|---|
| **要补** | 错误可观测性（Coded Errors 式）· Resource Pool · 高精度矩阵 / Floating Origin · glTF 完整（做深） | 直接支撑战场 A/B（重场景 + 数据即应用） |
| **要补** | 计算图 devtools · 编辑器收回 | 战场 C/A 的独有武器，Lite 明确没有编辑器 |
| **不补** | 物理 / 导航 / 音频混音 / Sprites / Flow Graph / 后处理全家桶 | Lite 与 Babylon.js 的护城河，1 人无法覆盖（§1.3） |
| **可选（有需求再做）** | CSM / VAT / GPU Picking | 客户明确要求前不动手，避免稀释唯一优势 |
| **不做** | 与 Lite 比特性数量 | 比不过，且会让定位扩散成"什么都有一点"——1 人项目唯一必输的打法 |

---

## 2. 目标架构 V2

### 2.1 分层蓝图与依赖方向铁律

```
┌─ Layer 5 工具与生态 ────────────────────────────────────────────┐
│  objectview（数据→UI）   ui（收编自外仓，见 §4 P4）  editor（已收回）│
├─ Layer 4 领域模块 ─────────────────────────────────────────────┤
│  particlesystem   terrain   addons（three.js 移植，按需 import） │
├─ Layer 3 引擎核心 ─────────────────────────────────────────────┤
│  feng3d：数据 / XLogic / computed 链 / Renderer / View.submit   │
├─ Layer 2 着色器（单源） ───────────────────────────────────────┤
│  tsl：TS 写着色器 → GLSL + WGSL                                │
├─ Layer 1 渲染抽象 ─────────────────────────────────────────────┤
│  render-api（统一 Submit / 资源接口）                           │
│    ├── webgpu（现有）      └── webgl（可选，长期）              │
├─ Layer 0 基础库（零副作用、零循环依赖） ────────────────────────┤
│  reactivity  math  event  polyfill  path  serialization  watcher│
└────────────────────────────────────────────────────────────────┘
```

**依赖方向铁律**（借鉴 PlayCanvas 的 `src/core` 不依赖 `src/framework`）：

1. **只允许上层依赖下层**，同层之间不得互相依赖
2. **执行机制**：`eslint import/no-restricted-paths`（或自研规则 `feng3d/layer-direction`），
   CI 拦截，不靠文档
3. **当前违反项**（实测）：
   - `@feng3d/math` → `@feng3d/objectview`（Layer 0 → Layer 5，**倒置**；根因是 `@oav` 装饰器）
   - `feng3d` ↔ `particlesystem` / `terrain`（Layer 3 ↔ Layer 4，**成环**）
   - `feng3d/src/index.ts` 聚合桶 `export *` 8 个子包（掩盖了真实依赖）

**上层扩展包的组件类型接入**（`registerComponentType`，2026-10-05 收尾批）：
上层包（`ui` / `particlesystem` / `terrain` 这类「源码 `import 'feng3d'`」的包）定义的组件，
原先对引擎的类型表是**隐形**的——`isRenderable` / `isRayCastable`（`component/Component.ts`）与
`matchType`（`core/Entity.ts`）只认硬编码字符串表，于是 `Scene.models`、
`getComponentsInChildren('Renderable')`、`Scene.behaviours`、`Raycaster.pick` 都扫不到它们
（UI 迁完了也渲染不出来、拾取不到）。修法按分层铁律：**引擎提供注册入口、上层包自己登记**，
`feng3d` 不硬编码任何上层包的类型名（它连这些包的依赖都没有）。用法与语义见
`packages/feng3d/src/component/Component.ts` 的 `registerComponentType`。

### 2.2 七项架构修正（每项都有架构层解法，而非补丁）

| # | 问题（实测证据） | 架构层解法 | 借鉴来源 |
|---|---|---|---|
| 1 | **异常安全**：`noMutationCount`/`batchRun` 无 `try/finally`，一次 submit 异常 → 变更计数永久关闭 → 渲染永久冻结 | 所有作用域守卫强制 `try/finally`；异常路径纳入单测；机制级"故障恢复"而非静默降级 | 自研（P0） |
| 2 | **tree-shaking 冲突**：`registerLogic` 是 import 副作用（存量）；~~`logic.ts:62-63` 模块级 `new Map()`/`new WeakMap()`~~、~~`Ticker.ts:317` 顶层自启动~~ **已修（#88，CI 门禁）** | 零模块级副作用；缓存 lazy-init；可选特性一律 `() => import(...)`；显式 `registerXXX` 入口 | **Babylon Lite** |
| 3 | **循环依赖**：`feng3d` ↔ `particlesystem`/`terrain`；`math` → `objectview` | 依赖方向铁律 + 把交叉依赖的类型/工具下沉到 Layer 0；`oav` 元数据改由对象自身声明 | **Babylon Lite**（One-Way Data Ownership）/ **PlayCanvas**（目录约束） |
| 4 | **着色器双份人工维护**：79 个 `.glsl` 作为"翻译源" + WGSL 手写内联在 7 个材质类 | **收编 `@feng3d/tsl`**（v0.2.0，320 单测全绿），实现单源生成 GLSL + WGSL | 同 three.js TSL / Babylon 自动转换链 |
| 5 | **类型安全被削弱**：`feng3d/tsconfig.json` 关闭 `strictNullChecks`/`noImplicitAny`/`strictFunctionTypes`/`noImplicitThis`；`logic()` 声明非空却返回 `null` | 先修 `logic()` 的可空语义（返回 `Logic \| null` + 调用方显式处理），再分模块开启 `strictNullChecks` | 三家均严格类型（Babylon Lite 强制 strict） |
| 6 | **资源生命周期**：refcount 未实现；仅 `WGPUTexture` 真 `destroy()`，其余只删缓存；无释放时机保证 | 显式 refcount + **deferred release**（等 `queue.submit()` 之后统一销毁） | **Babylon.js** |
| 7 | **文档漂移**：DESIGN 写目标态、PLAN 混历史与现状、`webgpu/docs/` 未同步、AGENTS 第 7 章记录了已废弃的 submodule 时代 | 现状/目标分离 + 每章 status 标签 + 脚本校验（§5） | **Babylon Lite**（GUIDANCE 不可变 + parity 强制） |

### 2.3 五项新增能力（吸取三家之长，且适配 feng3d 的战场）

| 能力 | 做法 | 借鉴来源 | 服务于 |
|---|---|---|---|
| **pass 编排声明化** | 把 `submitComputed` 里硬编码的 pass 序列改为可声明的 pass 图（不引入 FrameGraph 的完整复杂度） | Babylon.js FrameGraph | 战场 B |
| **纯函数式扩展面** | 可选特性（后处理、glTF 扩展、诊断）一律独立模块 + 动态 import + 显式注册，核心不硬编码特性分支 | Babylon Lite（`GltfFeature`/`PbrExt` 模式） | 战场 B/C |
| **计算图可观测** | `computedGraphStats` 增强为可用工具：依赖边、失效计数、上次求值耗时；dev overlay | PlayCanvas 的 Inspector + Babylon 的 Inspector | 战场 C |
| **编辑器已收回** | 代码在主仓 `packages/editor`（workspace 成员，CI 有 `editor:` / `editor-e2e:` job）；objectview 是其 Inspector 底座 | PlayCanvas（引擎/编辑器解耦但同生态） | 战场 A |
| **零 GC 抖动渲染路径** | 渲染热路径避免临时对象分配（`unblenditems.concat(blenditems)` 等），用 benchmark 的 GC 采样验证 | three.js（对象池）/ PlayCanvas（System 批量） | 战场 B |

### 2.4 明确不做

- 不引入 ECS（feng3d 的"数据 + Logic"分离已经拿到了 ECS 的模块化收益，且保住了序列化优势；
  引入 System 会破坏"数据即应用"）
- 不做 WebGL 后端（**除非**明确需要覆盖 WebGPU 不可用的浏览器；`render-api` 保留了接口设计，
  但落地优先级低于 §4 的 P2/P3）
- 不做可视化节点编辑器（着色器走 TSL 代码化路线，与 three.js 一致而非 Babylon 的 NME）

---

## 3. 规范升级：每条规范必须有机器执行者

> 规范的**正文**已落地在 [AGENTS.md](../AGENTS.md) §15（R1/R2/R3/R6 四条展开条文 + R1–R13 全表状态速查 + 当前违反项基线）；
> 本章保留完整的 R1–R13 全表与「为什么必须有执行者」的分析，**§3.1 的逐条状态是唯一权威**，
> `AGENTS.md` §15 的速查表与状态描述必须与它一致（改一处必须同步另一处）。

### 3.1 现状：规范与执行者对照（逐条实测）

> 本节按 `AGENTS.md` §15 的元规则第 2 条（规范与实现冲突时必须改文档或改代码）**逐条重测**：
> 每一行都必须能指到执行者文件，并注明它是否进了 `.github/workflows/ci.yml` 的 `quality` job
> （job 定义见 ci.yml:38，触发条件为任意分支 push / PR，见 ci.yml:17-22）。
> 标 ✅ 的行都用 `Test-Path <脚本>` + 在 ci.yml 中搜到该脚本名双向核实过，不凭印象。
> **行号在 2026-10-05 按当时的 `ci.yml` 校过一次**：ci.yml 增删步骤后行号会整体漂移，
> 抽查时以**步骤名**为准（[docs/CI.md](./CI.md) §2.1 按步骤名 + 步骤号登记同一批门禁，不依赖行号）。

| 规范 | 当前执行者 | 进 CI | 问题 / 缺口 |
|---|---|---|---|
| **R1** 依赖方向只向下 | ✅ `scripts/check-layer-direction.mjs`（包级依赖 + 存量基线）+ `scripts/check-layer-deps.mjs`（地基白名单 / 无环） | ✅ ci.yml:107 / ci.yml:89 | 倒置（#87）与成环（#86）均已修；**仍有** `feng3d/src/index.ts` 聚合桶 `export *` 掩盖真实依赖 |
| **R2** 零模块级副作用 | ✅ 四层：自研规则 `feng3d/no-module-side-effect`（`eslint.config.js:107` 源码 error，测试 off）+ `scripts/check-module-side-effects.mjs --strict`（缓存创建 / 启动型调用 / `globalThis` 写入，新增即失败）+ `scripts/check-toplevel-new.mjs`（**其余**模块级 `new`——`export const x = new X()` 声明形式，按「文件::构造器」存量冻结在 `scripts/toplevel-new-baseline.json`（现 **94** 个组合；#614 的空参缓存欠账清掉 7 个键、#624 批次清掉 terrain 的 1 个键、ChainMap 批再清掉 29 个键），新增即失败）+ `scripts/check-tree-shaking.mjs`（产物级）；前两条共用 **AST 判据层** `scripts/r2-module-scope.mjs`（#614） | ✅ ci.yml:76 / ci.yml:131 / ci.yml:81；lint 由 ci.yml:57（`npm run lint:ci --max-warnings 0`）覆盖 顶层 `registerLogic` / `setAssetTypeClass` 注册（65 处）属注册模型改造，`check-module-side-effects` **只统计不拦**。**判据已从行级换成 AST（#614）**：行级判据实测漏 **62 处**（158 处「import 期真执行」只看见 96 处，**#614 立项时口径**；当前读数是漏 **24 处**，见 docs/CI.md §2.1 的「再复测」），现覆盖类 `static` 字段 / 块、顶层 IIFE、多行声明、模块级块 / 对象字面量 / 回调。**判据自身的三层回归保护（#652）**：`test/r2ModuleScope.spec.ts`（46 条判据用例，含"带括号 IIFE 必须算模块级"）+ 两条脚本内的合成样例自检（各 13 / 12 条，启动即跑、失败即 exit 1）+ 三份缓存容器名单的集合一致性断言。**应用入口按 `ENTRY_FILES` 清单整类豁免**，清单 `scripts/r2-module-scope.mjs` 里集中一份、两条脚本共用（原先只有一条有 `ENTRY_FILE`、另一条没有——25 个示例入口 `new GUI(...)` 键因此默默进基线）；清单只含 3 个**应用**入口，**单个示例页不豁免**；代价是入口页的真副作用有意放行（实测 `vue-app/main.ts:93` 的模块级 `setTimeout`），风险边界与收紧路径见 docs/CI.md §2.1。**两条脚本的边界（#606）**：前者只认**缓存形态**（空参 / 只有泛型实参的 `new Map/WeakMap/Set/WeakSet()`，外加**项目自有**的 `new ChainMap()`——后者不套空参限制），后者兜**声明形式的其它构造**；重叠处有意重复报告（去重比漏网好）。基线里的模块级单例（`event/src/GlobalEmitter.ts::EventEmitter`、`shortcut/src/WindowEventProxy.ts::EventProxy` 等）是**已冻结的存量**，属注册模型 / 单例模型改造，不在本批——**本次复核结论**：两处是「身份敏感」的对象单例（`EventEmitter` 的构造会写进三个 `static` 注册表，事件路由依赖对象身份），改动是公开 API 变更、约 198 处调用点；且只改这两行**并不能让模块变 R2 干净**（`EventEmitter` 自身还有三个模块级 `static ... = new Map()`——#614 欠账批已把这三张表 lazy-init，但 `new EventEmitter()` 这个构造调用仍在模块顶层），理由与建议见 [docs/CI.md](./CI.md) §2.1 |
| **R3** 纯数据声明式（不用 `new`） | ✅ `scripts/check-imperative-construction.mjs`（#353） | ✅ ci.yml:141（**基线 `entries` 已为空——0 处存量、新增即失败**；issue #134 阶段 C 收尾时按实测从 13 处收紧到 1 处，R3 收尾清零） | **阶段 C 收尾已收回两处 math 豁免**（`packages/math` 整包跳过 + `@feng3d/math` 同名 class 白名单）——math 的 19 个数值 / 几何 class 已全部删除，豁免是死代码。最后 1 处 `packages/webgpu/examples/src/webgpu/cornell/index.ts::Scene` 是**同名假阳性**、不是真违规：那一行是 `import Scene from './scene'`，指向示例同目录 `scene.ts` 的 `export default class Scene`（constructor 里构建顶点 / 索引 / quad 数据，无 `__type__`），按判据改成 `{ __type__: 'Scene' }` 会让示例直接崩掉；门禁判据「名字有导入 + 名字在纯数据类名单里」**不看导入来源**，故用重命名 `Scene` → `CornellScene` 消除同名歧义，判据与严格性未动。旧基线里 `examples/src` 的 12 处在 HEAD 上早已不存在（基线比现实松）。门禁只统计**可执行代码**：`addons` 与 `editor` 可执行代码 0 处——#353 正文统计的 36 处把注释里的旧写法示例也算进去了。另：纯数据类名单来自 `gen-objectview-schema.mjs` 的产物（现 **84** 个——issue #134 收尾批把 `Gradient` / `MinMaxGradient` 迁为纯数据接口后由 82 增至 84；同批 `objectview.getObjectInfo` 的控件类型改为**优先按 `__type__` 判别**，否则装饰器类字段上的纯数据字面量会因 `constructor.name === 'Object'` 丢掉专用控件），该生成器新增了「math 的每个带 `__type__` 的导出 interface 都必须在产物里」的断言。**已知局限**：判据不看导入来源，任何「本地类型与纯数据类同名」的位置都会被误报，更精确的判据（要求名字来自 `@feng3d/*` 或 schema 产物里的模块）需单开 issue |
| **R4** 响应式四条纪律 | 🔶 eslint 4 条 error 规则（`reactive-naming` / `no-reactive-export` / `no-reactive-argument` / `effect-annotation`，见 `eslint.config.js:103-106`） | ✅ 随 lint 进 CI（ci.yml:57） | ⚠️ **仍是真缺口**：规则只有 5 条（第 5 条是 `no-module-side-effect`），**没有**识别 `toReactive` / `logic()` 产生代理的规则；`this.effect(` 不受检。examples 已纳入 lint（#77），#249 收尾后为 **0 errors / 0 warnings** |
| **R5** effect 必须注解 | ✅ 自研规则 `feng3d/effect-annotation` + `EFFECT_INVENTORY.md` + `scripts/check-effect-inventory.mjs` | ✅ ci.yml:70 | 实测（本次运行）：**55 处 `effect(` 调用点、32 个文件**，与清单一致（`check-effect-inventory.mjs` 按文件比对数量，不一致即失败）。旧清单曾停在 30 处、且错称 `WGPUBuffer` 两 effect「无生产者」，已由 #79 重盘 |
| **R6** 可空性显式 | ✅ 三层：`scripts/check-strict-dirs.mjs`（feng3d / editor 独立 strict 配置）+ `scripts/check-strict-packages.mjs`（`scripts/strict-packages.json` 双向校验）+ `npm run types:packages` | ✅ ci.yml:99 / ci.yml:103 / ci.yml:121 | **23/23 个包已开** `strictNullChecks`（`ui` 为收尾批第 21 个、`tsl` 为 #709 收编批第 22 个、`editor-plugin-rotate` 为 #276 阶段 3 新增的第 23 个）；**存量**：① `feng3d` / `editor` 的 `tsconfig.json` 自身仍关 4 项（走独立配置）；② `logic()` 声明非空却返回 `null` 未动 |
| **R7** 作用域守卫异常安全 | 🔶 **机制已有、无执行者**：`batchRun`（`packages/reactivity/src/batch.ts:59-75`）与 `noMutationCount`（`packages/reactivity/src/Reactivity.ts:46-62`）**均已 `try/finally`**；回归用例 `packages/reactivity/test/effect.spec.ts:965`、`computed.spec.ts:941`。但**没有任何机器检查**要求「每个调用点必须有异常路径用例」 | ❌ 无 | ⚠️ 原条文写的 API（`noMutationCount` / `batchRun` / `batch`）**都还在**——issue #359 说「全仓 0 处」不成立。实测生产调用点共 **11 个**：`noMutationCount` 1 个（`packages/webgpu/src/internal/runSubmit.ts:11`）、`batchRun` 10 个（`feng3d/src/controllers/{OrbitControls.ts:269,284, LookAtController.ts:84, FPSController.ts:247}`、`feng3d/src/core/TransformLayout.ts:158`、`reactivity/src/{effect.ts:91, property.ts:152, ref.ts:107, arrayInstrumentations.ts:801}`）；`batch` 是 `reactivity` 包内部函数（`batch.ts:14`，调用点 `computed.ts:205`、`effect.ts:98`），**不在公开导出面**（`reactivity/src/index.ts` 只导出 `batchRun`）。**异常路径用例只覆盖了 API 自身（2 个 spec），没有覆盖上述调用点**——这条要么补执行者，要么降级为「建议」 |
| **R8** 视觉回归强度 | 🔶 容差**集中配置、真实存在**：全局默认 `playwright.config.ts:46` `maxDiffPixelRatio: 0.01`（1%）；示例级覆盖清单 `e2e/examples.config.ts`（接口字段 26-28 行，放宽项 26 处，见下） | ❌ **examples 视觉回归未进 CI**：ci.yml 的 e2e 只跑 `npm run test:e2e:editor`（ci.yml:261，`playwright.editor.config.ts` 里**没有** `maxDiffPixelRatio`）；`npm run test:e2e`（根 `playwright.config.ts`）在两个 workflow 里都搜不到 | 容差不是"不见了"，也不是集中改名——`maxDiffPixelRatio` 在根配置里。**放宽项 26 处**（`webgl_particles_*` 等无法完全定格的示例），其中**最宽 2 处为 0.4**：`e2e/examples.config.ts:184`（`webgl_particles_smoke`）、`:212`（`webgl_texture_noise_canvas`）。缺口：「放宽需在 PR 中说明理由并经确认」**没有机器执行者**，放宽项也没有 issue 编号可追溯（字段注释只说"仅用于无法完全定格的示例"） |
| **R9** 包体天花板 | ✅ `scripts/check-bundle-size.mjs` + `scripts/bundle-size-baseline.json`（3 档引用面 × raw/gzip，容忍 `tolerance: 0.02`） | ✅ ci.yml:156 | 实测基线（2026-10-05 按本机实测重定）：minimal 517 raw / 205 gzip；core 346212 / 93671；full 500536 / 141902。**旧基线虚高、门禁已失效**（core 记 611454，而 master 实测仅 286415，高 113%；minimal 记 31868 而实测 517）——本轮按实测重定，同时把「TSL 收编后 core 档 +20.9%（286415 → 346212 raw，gzip +16.0%）」这笔支出显式固化进天花板（#711 试点批）。判据仍是「改代码，而不是跑一次 `--update` 就绿了」 |
| **R10** 覆盖率门禁 | ✅ `vitest.config.ts:34-74`（`coverage.thresholds`）+ `npm run test:coverage`（= `vitest run --coverage` **加** `scripts/check-coverage-inflation.mjs`，issue #645 方案 C；根因修复见 `scripts/vitest-v8-coverage-provider.mjs`，issue #667） | ✅ ci.yml:112 | 当前阈值 **statements 52 / branches 42 / functions 49 / lines 52**（2026-10-05 修复 issue #667 的读数虚高后本机复测为 54.69 / 44.56 / 51.56 / 54.65——虚高消失让全局限整体下降约 1.1～2.6 个点，阈值按新基线向下留约 2.5 个百分点重定，取"实测基线向下留余量"的**防下降**口径，见 #74 / #356 / #134）。排除项已显式列出：`vitest.config.ts:38`（`**/*.spec.ts`、`**/*.d.ts`）。**读数可信度缺口已根治（issue #667）**：内置 v8 provider 跨 worker 合并 V8 coverage 时会丢函数条目，把"被间接 `import` 却从未执行"的文件整份算成 100%；改用自定义 provider（合并 key 从「根 range」换成「函数名 + 根 range」）后 8/13 个虚高文件落回真实值，基线从 13 个 / 448 条语句收紧到 5 个 / 44 条语句，详见 `docs/CI.md` §1.3 与 §2.1 |
| **R11** 文档现状标签 | ✅ `scripts/check-doc-status-labels.mjs`（#78） | ✅ ci.yml:85 | 实测（本次运行）：`FRAMEWORK_DESIGN.md` **10 章全部带标签**（10 处） |
| **R12** 提交规范 | ✅ 约定式提交（`AGENTS.md` §12）+ PR 评审 | ❌ 无机器门禁 | 一直执行良好，保持；不设门禁是**有意**的（提交信息语义无法机器判定） |
| **R13** 纯函数层（不依赖响应式） | ✅ `scripts/check-pure-modules.mjs` + `scripts/pure-modules.json`（清单反向校验：登记项必须存在且含 `.ts`；命中禁用依赖即失败） | ✅ `prelint:ci`（随 ci.yml 的 `npm run lint:ci` 步骤） | 初版清单 **2 项 / 64 个 `.ts`**（`packages/math` 整包 + `feng3d/src/core/eyeRelative.ts`）。**已知局限**：清单漏登记无法自动发现（「该不该是纯函数」没有客观状态可推断），只能靠 code review；随机 / 时间函数与 `console.error` **不在判据内**（math 的有意现状）。口径见 [docs/CODE_TAXONOMY.md](./CODE_TAXONOMY.md) |

### 3.2 升级后的规范体系

**原则：规范 = 声明 + 执行者 + 违规后果。三者缺一不算规范。**

| # | 规范 | 执行者（现状，逐条见 §3.1） |
|---|---|---|
| R1 | 依赖方向只向下 | ✅ `scripts/check-layer-direction.mjs`（完整分层按包级依赖检查，存量 5 条向上依赖冻结在基线、新增即失败，#75）+ `scripts/check-layer-deps.mjs`（地基白名单 / 无环，#86 #87）；`eslint import/no-restricted-paths` 因 `eslint-plugin-import` 在本仓装不上（ERESOLVE）改用等效脚本 |
| R2 | 零模块级副作用 | ✅ 四层：自研 `feng3d/no-module-side-effect`（**AST 判据**：禁模块级 `new Map/WeakMap/Set/WeakSet/ChainMap()`、启动型调用、`globalThis` 写入；源码 error。**仍跳过类字段初始化器与 IIFE 体**——这两类形态实际由 CI 脚本拦；`WeakSet` 原先只在脚本侧名单里、规则层是**漏了**，issue #652 已补齐并由机器断言守住）+ `scripts/check-module-side-effects.mjs --strict`（ci.yml:76）+ `scripts/check-toplevel-new.mjs`（其余模块级 `new` 的存量基线，ci.yml:131）+ `scripts/check-tree-shaking.mjs`（产物级验收，ci.yml:81）。**两条脚本的判据是同一份 AST 实现**（`scripts/r2-module-scope.mjs`，issue #614 抽出）：原先的「行首无空白 = 模块顶层」行级判据实测漏掉 **62 处** import 期真会执行的 `new`（类 `static` 字段 / 块 42 处、顶层 IIFE、多行声明、模块级块 / 对象字面量 / 回调）——**这是 #614 立项时的口径，当前读数是漏 24 处**（见 docs/CI.md §2.1 的「再复测」），现已覆盖；判据自身有三层回归保护（issue #652：判据层单测 46 条 + 两条脚本内合成样例自检 + 名单一致性断言），见 docs/CI.md §2.1.2。**应用入口按路径整类豁免**（清单 `ENTRY_FILES`，两条脚本共用，只含 3 个应用入口——单个示例页不豁免，其 25 个 `new GUI(...)` 键继续冻结在基线），代价（入口页真副作用一起放行，实测一处）与风险边界见 docs/CI.md §2.1.1。两条都**不写死存量数字**（以各自输出为准，#606）；规则与脚本的覆盖差异见 docs/CI.md §2.1.1 的「已知局限」 |
| R3 | 纯数据声明式 | ✅ `scripts/check-imperative-construction.mjs`（**基线 `entries` 已为空**——0 处存量、新增即失败，#353）。~~自研 `feng3d/no-imperative-construction`~~：该规则从未存在过（#353 实测只有 5 条规则），改用等效脚本——名单取自 `gen-objectview-schema.mjs` 的产物（**89** 个纯数据类，issue #134 收尾批把 `Gradient` / `MinMaxGradient` 迁为纯数据接口后 82 → 84，这两个名字因此也进 R3 名单、`new Gradient()` 从此被拦；曲线族批（`AnimationCurve` / `AnimationCurveVector3` / `MinMaxCurve` / `MinMaxCurveVector3`）再 +4 到 89）。**两处 math 豁免已在 issue #134 阶段 C 收尾收回**（原「排除 `@feng3d/math` 的同名 class 与 `packages/math` 包内」——math 的 19 个数值 / 几何 class 已全部删除，豁免无对象）；R3 收尾把最后 1 处（cornell 示例的本地 class 与纯数据 `Scene` 同名、判据不看导入来源而误报）用重命名消除，基线清零 |
| R4 | 响应式纪律 | 🔶 **部分落地、仍是真缺口**：现有 4 条规则**没有**识别 `toReactive`/`logic()` 产生代理的能力，`this.effect(` 不受检。到位判据 = 新增规则后 `toReactive`/`logic()` 代理被识别且 `this.effect(` 受检，并且该规则进 `lint:ci` |
| R5 | effect 必须注解 | ✅ 自研规则 `feng3d/effect-annotation` + `scripts/check-effect-inventory.mjs` 校验 `EFFECT_INVENTORY.md` 与实际调用点按文件计数一致（ci.yml:70；实测 55 处 / 32 文件，#79） |
| R6 | 可空性显式 | ✅ 三层：`scripts/check-strict-dirs.mjs`（feng3d / editor 独立 `tsconfig.strict.json`）+ `scripts/check-strict-packages.mjs`（`scripts/strict-packages.json` 双向校验，漏登记与误关闭都失败，#282）+ `npm run types:packages`。**23/23 个包已开 `strictNullChecks`**；"开到哪一步"以脚本输出为准，本表不写死数字 |
| R7 | 作用域守卫异常安全 | 🔶 **机制已就位、覆盖不全、无执行者**：`batchRun`（`packages/reactivity/src/batch.ts:59-75`）与 `noMutationCount`（`packages/reactivity/src/Reactivity.ts:46-62`）**均已 `try/finally`**，并有 API 级异常回归（`packages/reactivity/test/effect.spec.ts:965`、`computed.spec.ts:941`）。但实测 11 个生产调用点（`noMutationCount` 1 个：`packages/webgpu/src/internal/runSubmit.ts:11`；`batchRun` 10 个）**没有逐个的异常路径用例**，也没有任何机器检查要求这么做。**要么补执行者，要么把"每个调用点必须有异常路径用例"降级为建议** |
| R8 | 视觉回归强度 | 🔶 容差已集中配置：全局默认 `playwright.config.ts:46` `maxDiffPixelRatio: 0.01`，示例级放宽在 `e2e/examples.config.ts`（**26 处**放宽，最宽 **0.4** 两处：`:184` `webgl_particles_smoke`、`:212` `webgl_texture_noise_canvas`）。**缺口**：① examples 视觉回归**未进 CI**（ci.yml 的 e2e 只跑 `playwright.editor.config.ts`）；② "放宽需在 PR 中说明理由并经确认"无执行者，放宽项无可追溯编号 |
| R9 | 包体天花板 | ✅ `scripts/check-bundle-size.mjs` + `scripts/bundle-size-baseline.json`（3 档引用面 × raw/gzip，`tolerance: 0.02`，超出即失败，#73；ci.yml:156） |
| R10 | 覆盖率门禁 | ✅ `vitest.config.ts:34-74` `coverage.thresholds`（当前 **52 / 42 / 49 / 52**，2026-10-05 修复 issue #667 的读数虚高后按新基线复测重定）+ `npm run test:coverage`（ci.yml:112）。阈值是"防下降"口径而非"达标线"（#74 / #356），**排除项已显式列出**（`vitest.config.ts:38`） |
| R11 | 文档现状标签 | ✅ **已落地**（issue #78）：`FRAMEWORK_DESIGN.md` 10 章全部带 `> 现状：✅/🔶/⬜（证据）`；`scripts/check-doc-status-labels.mjs` 进 CI 门禁（ci.yml:85） |
| R12 | 提交规范 | ✅ 约定式提交（`AGENTS.md` §12）+ PR 评审；**不设机器门禁**（提交信息语义无法机器判定，属有意为之） |
| R13 | 纯函数层 | ✅ `scripts/check-pure-modules.mjs` + `scripts/pure-modules.json`（挂在 `prelint:ci` 上随 `lint:ci` 进 CI）——登记为纯函数的模块（初版 `packages/math` + `feng3d/src/core/eyeRelative.ts`，2 项 / 64 个 `.ts`）不得 import `@feng3d/reactivity` 与上层包；分类与已知局限见 [docs/CODE_TAXONOMY.md](./CODE_TAXONOMY.md) |

### 3.3 规范的三条元规则

1. **新规范必须先有执行者**，否则只能写进"建议"而非"规范"
2. **规范与实现冲突时，先改文档或先改代码，不允许长期并存**（当前 `AGENTS.md` §11.5 与
   `Object3D.ts:138-144` 的实际做法冲突即是反例）
3. **每条规范标注引入日期与对应的执行者版本**，避免"规范存在但没人执行"的腐化

---

## 4. 实施路径

> 原则：**护栏先行**（先立标尺再动架构）、**每阶段独立可验收可提交**、**每步先补测试再改行为**。
> 阶段间允许并行，但 P0 必须最先完成。

### P0 — 止血（预计 1–2 天）

**目标**：消灭"静默失效"路径。这三条是当前唯一会让引擎**悄悄停止工作**或**悄悄改坏代码**的路径。

| 任务 | 验收 |
|---|---|
| `noMutationCount` / `batchRun` 加 `try/finally` | 新增异常路径单测：抛异常后计数仍可增长、`_batchDepth` 归零、渲染不冻结 |
| `no-reactive-argument` fixer 改为替换 `arg.object` | fixer 单测：`fn(r_x.y)` → `fn(x.y)`（保留 `.y`）；当前实现会产出 `fn(x)` |
| `logic()` 未注册不缓存 `null` | 单测：先 `logic()` 后 `registerLogic()` 应能拿到实例 |
| `View.submit` 的降级路径增加可观测计数 | 暴露"降级次数"，日志可查（为 R7 铺路） |

### P1 — 护栏先行（预计 1–2 周）

**目标**：建立"可测量的下限"，此后所有架构改动都有安全网。对标三家最有价值的基建。

| 任务 | 借鉴 | 验收 |
|---|---|---|
| 视觉回归阈值收敛 + golden 不可变化 | Babylon Lite（MAD 门禁） | 主集 `maxDiffPixelRatio` ≤0.01；放宽项单独列出并在 CI 中提示 |
| 包体测量与天花板 | Babylon Lite（byte-exact） | 3 档规模场景的 gzip/raw 字节基线入库，CI 超出即失败 |
| 覆盖率门禁 | three.js（`test-e2e-cov`） | `vitest --coverage` 接入，整体 ≥60%，`serialization` 从 0 起步 |
| 依赖方向 lint（R1） | PlayCanvas（目录约束） | CI 拦截 `math → objectview` 等违规 |
| 零副作用 lint（R2） | Babylon Lite | 存量违规列入白名单文件，新违规即失败 |
| examples 纳入 lint（R4） | ✅ **已落地**（#77，收尾 #249） | `npm run lint:examples`（CI 步骤，与 `lint:ci` 一致带 `--max-warnings 0`）：errors **0** / warnings **0**。收尾时实测基线为 **67 条** `@typescript-eslint/no-unused-vars`（#77 立项时统计 382 条，前序工作已清理大部分），已全部清零 |
| 文档现状标签（R11） | ✅ **已落地**（#78） | `FRAMEWORK_DESIGN.md` 10 章全部标注现状，CI 校验标签存在 |
| `EFFECT_INVENTORY.md` 与实际调用点一致性校验（R5） | ✅ **已落地**（#79） | `node scripts/check-effect-inventory.mjs` 进质量门禁；清单已重盘为 54 处 / 31 文件，不一致即失败 |

### P2 — 收编 TSL：消除双份着色器维护（预计 2–4 周）

> **这是全规划中性价比最高的一步**。`@feng3d/tsl` 已有 **320 个单元测试全绿**（最后提交
> `c5612c0a`，2026-07-23），src 分层完整（`core`/`glsl`/`shader`/`types`/`variables`/`vector`/
> `math`/`control`），且已实现深度区间转换（WebGL `[-1,1]` → WebGPU `[0,1]`）。
> 它解决的是 feng3d 当前最大的架构欠账（§2.2 #4），且**不需要从零重写**。

| 任务 | 状态 | 验收 |
|---|---|---|
| 在**当前主仓环境**下跑通 TSL 的 320 个测试 | ✅ 已达成（#709） | 320 个用例在主仓 vitest 5.0.2 下全绿 |
| 产出 API 差异清单（TSL 期望的 API vs 主仓现状） | ✅ 已达成（#709）：差异只有 3 类，**无「缺失级」** | 差异项分级：类型级 / 语义级 / 缺失级 |
| `packages/tsl` 收进主仓（与其它 21 个包同等待遇） | ✅ 已达成（#709）：workspace 成员（第 22 个包）；R1 分层（Layer 0）与 R6 strict 清单已登记；lint 0 问题；320 用例随根 `vitest run`；纳入 `types:packages` / `build:packages` / `release:dry-run`（公共包 20 → 21） | workspace 识别、`tsc` 通过、纳入 lint/测试 |
| 选 1 个材质试点（建议 `NormalMaterial`，着色器最短） | ✅ 已达成（#711 试点批） | 试点材质改用 TSL 生成，**渲染像素级一致**（见下方实测结论） |
| 逐个材质迁移（7 个材质 + shadow/common 模块） | 🔶 进行中（#711）：`NormalMaterial` / `ColorMaterial` / `SegmentMaterial` / `PointMaterial` 已迁完并验证像素一致 | 每迁移一个，e2e 基线验证 + 删除对应的手写 WGSL |
| GLSL 源文件降级为"参考样本"并从构建路径移除 | ⬜ 未开始（#713） | 仓库不再有"必须人工保持同步的两份着色器" |
| TSL 能力扩展：compute / storage buffer / 原子操作（examples 迁移前置） | ⬜ 未开始（#710） | examples 里 12 个 compute 着色器可用 TSL 编写 |
| `packages/webgpu/examples` 的 71 个 `.wgsl` 全部 TSL 化 | ⬜ 未开始（#712） | 仓内手写 WGSL 归零 |

> ✅ **试点实测结论（#711 试点批，2026-10-05）**：`NormalMaterial` 的 vertex / fragment 已改为 TSL 构建
> （`packages/feng3d/src/shaders/tsl/`），**渲染像素级一致**——改动前后同一示例（`webgl_materials_normal`）
> 的 actual 截图 **SHA256 完全相同**（`528CE449…C8CE`，本机 Chrome + WebGPU）。
> 为什么不用"与入库基线比对"当判据：本机像素基线与当前 GPU 不匹配——**未改动的**
> `webgl_materials_normalmap` 示例也差 0.09，且同一代码两次运行的截图哈希都不同；
> 所以本批用「改动前后对比」而不是「与基线对比」。
>
> 试点同时暴露并处理了两件事：
> ① **TSL 的类型签名在 strict 下不可用**：`vec3(attribute(...))` 与 `transform.u_modelMatrix.multiply(...)` 都过不了
>    `typescript`——它自己的 `test/` 从不参与 `tsc`，所以从未暴露。本批补齐了 `Struct` 的成员映射类型、
>    5 个类型构造函数（vec2/vec3/vec4/float/mat4）的 `VariableHost` 重载，并导出 `Struct` 类型。
> ② **包体门禁已失效**：基线 core 记 611454，而 master 实测仅 286415（**虚高 113%**）——
>    `+20.9%` 的增长都不会报。本批按实测重定，并把 TSL 的支出显式固化（core 286415 → 346212 raw）。
>
> ✅ **第二批（#711 材质批，2026-10-05）**：`ColorMaterial` / `SegmentMaterial` / `PointMaterial`
> 三个材质的内联 WGSL 也改为 TSL 生成，**渲染像素级一致**——`PointMaterialTest` / `SegmentMaterialTest`
> 的 actual 截图与 master **SHA256 完全相同**（`PointMaterialTest` 的 master 连跑两次也完全相同，
> 说明差异可归因、不是环境噪声）。
>
> **本批的关键实践（后续材质必读）**：TSL 里中间值必须用 `let_()` 生成 WGSL 的 `let`——
> 不要用 `var_()`，更不能只写 TS 的 `const`：
> - 只写 TS `const`：值会被**内联展开**（`clipPos` 被引用 4 次就生成 4 份重复表达式，且
>   `u_viewProjection * u_modelMatrix * vec4(...)` 被合并成一条，**改变矩阵乘法的浮点结合顺序**）；
> - `var_()`：生成 `var`（可变），GPU 编译器的优化行为与手写 `let` 不同——实测 `PointMaterial`
>   因此出现像素差异（截图字节 4845 → 4883）；
> - `let_()`：生成 `let`，与手写**逐位一致**（4845 → 4845）。
>
> 其它实测约束：TSL 的 `vec4` 没有 `(Vec2, Float, Float)` 构造，需要先合成 `vec3` 再补 `w`；
> 顶点入口的参数顺序由 body 的**引用顺序**决定（location 显式指定，不影响绑定）。
>
> ✅ **粒子批（2026-10-05）**：新增 `ParticleMaterial`（`packages/feng3d/src/materials/ParticleMaterial.ts`）
> 与粒子系统渲染对接，示例见 `examples/src/particlesystem/`（3 个页面，视觉基线已入库）。
>
> ✅ **粒子着色器 TSL 化（同批收尾）**：`packages/feng3d/src/shaders/particleMaterial.ts` 已由手写 WGSL
> 改为 **TSL 构建**——为此给 `@feng3d/tsl` 补了 **`mat3` 类型**（`packages/tsl/src/types/matrix/mat3.ts`，
> 与 `mat4` 同构：空 / 对角矩阵 / 变量宿主 / 三个列向量四种构造，以及 `multiply` / `index`），
> 公告牌矩阵与顶点旋转矩阵因此都能用 TSL 表达（旋转矩阵用 TSL 的 `func` 声明，公式与 GLSL 逐行一致）。
> 采样器改走 TSL 展开约定（`s_texture_texture` + `s_texture`，与 `TextureMaterial` 同款），
> 默认采样器**刻意不设 `mipmapFilter`**——粒子贴图不生成 mipmap，设了会每次采样告警。
> 回归保护：`particleMaterial.spec.ts` 钉住实例属性入口、`mat3x3<f32>` 声明、旋转矩阵函数与采样器展开命名。
>
> 顺带修掉一处渲染噪声：没有活跃粒子时不再提交 `instanceCount = 0` 的 draw（清空 `renderObject.draw`），
> 消除 WebGPU 的 "Draw with an instance count of 0 is unusual" 警告。
>
> ✅ **第三批（#711 纹理批，2026-10-05）**：`TextureMaterial` 改用 TSL 生成，踩到并记录一条**采样器命名约定**：
> TSL 把 `sampler2D(uniform('s_texture'))` 展开成 `s_texture_texture`（texture）+ `s_texture`（sampler），
> 数据侧（`TextureMaterial` 的 `bindingResources`）必须按同一约定给键——`s_texture_texture = textureView`、
> `s_texture = sampler`（引擎的 `WGPUBindGroupEntry` 按着色器变量名解析绑定）。
>
> ⚠️ **副作用（必须知道）**：改用展开格式后，引擎的 `adjustSamplerForTexture` **首次能拿到真实纹理**
> （手写命名下它查 `s_textureSampler_texture`、查不到，于是这条调整一直没生效）。单 mip 纹理会被自动
> 忽略 `mipmapFilter` 并把 `lodMaxClamp` 设为 0，因此该示例截图与手写版差 **5170 像素（1%）**——
> 差异全部落在纹理过滤细节上（画面本身正常：无错位、无黑块，见 PR 附图）。
> 这是**修正**（手写版把「没有 mipmap 却设了 mipmapFilter」的错误配置带进了 GPU），不是渲染回归；
> 若某处需要严格像素一致，可在数据侧按手写格式补一个 `s_textureSampler_texture` 键。
>
> ✅ **第四批（#711 阴影批，2026-10-05）**：**文件级** WGSL 迁移的第一次——`shaders/shadow.vertex.wgsl.ts`
> 改为 TSL 生成（`shaders/tsl/shadow.ts`，`ShadowRenderer` 取 `getShadowVertexShaderWGSL()`），并**删除两个 `.wgsl.ts`**：
> 被取代的 `shadow.vertex.wgsl.ts` 与**从未被引用**的 `shadow.fragment.wgsl.ts`（ShadowRenderer 用 vertex-only
> pipeline、没有 fragment；全仓 grep 只有它自己引用自己）。
>
> 仓内手写 `.wgsl.ts` 文件 **4 → 2**（余 `common.wgsl.ts` 与 `modules/skeleton.wgsl.ts`）。
>
> 验证：`webgl_shadowmap` 示例的 actual 截图与 master **SHA256 完全相同**（零容差）；`webgl_shadowmap_pointlight`
> 的 master 连跑两次也不同——该示例在 `e2e/examples.config.ts` 里本就放宽到 0.05，属噪声、不可归因。
> 另注：`away3d/DebugShadowMap` 在 e2e 里是 `fixme`（已知引擎 bug「全屏调试平面采样的阴影深度图恒为空」），
> 与本批无关。
>
> ✅ **第五批（#711 能力扩展 + 蒙皮批，2026-10-05）**：为了让蒙皮（`skeleton.wgsl.ts`）能用 TSL 表达，
> 先给 `@feng3d/tsl` 补了**三项缺失能力**（issue #710 的首批落地）：
>
> | 能力 | API | 生成的 WGSL |
> |---|---|---|
> | for 循环 | `forRange_('i', 0, 4, (i) => {...})` | `for (var i = 0; i < 4; i = i + 1) { ... }` |
> | 向量动态索引 | `v.index(i)` | `v[i]`（原先只有 swizzle 分量 `.x`，无法表达 `skinIndices[i]`） |
> | f32→i32 转换 | `int(f)` | `i32(f)`（数组索引需要整数） |
> | 单独取函数定义 | `func(...).toWGSL()` | `fn name(...) -> T { ... }` |
>
> 配套改动：新增 `core/forStack.ts`（与 `ifStack` 同构的语句容器栈），并把 `assign.ts` / `var.ts` / `if_.ts`
> 三处语句收集点改成「**for 体 > if 体 > 函数体**」；`StructDefinition.toWGSLStruct/toWGSLUniform` 与
> `func().toWGSL()` 配合，使「函数定义 + uniform 声明」能单独拼进手写着色器。
>
> **结果**：`modules/skeleton.wgsl.ts` 迁到 `shaders/tsl/skeleton.ts`（`standardVertexShader` 只换 import），
> 并删除**从未被引用**的 `common.wgsl.ts`（死代码——cornell 示例里的 `common.wgsl` 是另一个文件）。
> **`packages/feng3d/src/**/*.wgsl.ts` 由此归零**：本目标在 feng3d 侧完成，剩下的是
> `packages/webgpu/examples/**` 的 **71 个 `.wgsl`**（issue #712）与 GLSL 降级（#713）。
>
> 验证：`animator/SkinningTest` 的 actual 截图与入库基线一致（连续 3 次通过；首次运行出现过一次 3 字节抖动，
> 复跑即过），生成的 WGSL 与手写片段**逐行对应**（同样的 `for` 循环与 `[i]` 索引）。
> **教训**：先用「构建期展开」写蒙皮时截图差 8 字节——循环与展开在 GPU 上并非总是等价，
> 缺能力就该补能力，不要用等价改写绕过。
>
> ✅ **第六批（#711 天空盒批，2026-10-05）**：`SkyBox` 的内联 `skyboxWGSL` 改为 TSL 生成
> （`shaders/tsl/skybox.ts`）。本批给 TSL 补的能力（原先都没有）：
>
> | 能力 | API | 生成的 WGSL |
> |---|---|---|
> | 立方体贴图采样器 | `samplerCube(uniform(...))` + `texture(cube, vec3)` | `texture_cube<f32>` + `textureSample` |
> | 数组初始化列表 | `arrayWithValues(vec3, values)` | `array<vec3<f32>, 36>(...)` |
> | 矩阵列构造 / 列访问 | `mat4(c0, c1, c2, c3)` / `Mat4.index(i)` | `mat4x4<f32>(...)` / `m[i]` |
>
> 同时修了外部变量（模块级 `var_`）的三处缺陷：数组类型要写全 `array<T, N>`（原先取元素类型）、
> 声明处要用字面量而不是变量名（新增 `toWGSLInit()`/`toGLSLInit()` 把"声明"与"引用"分开）、
> 以及 `import { Array }` 遮蔽全局 `Array`（改用 `TSLArray` 别名）。
>
> 验证：`base/SkyBoxTest` 的 actual 截图与 **master 完全相同（SHA256 一致）**。
> 注意该示例的**入库基线与本机 GPU 不匹配**——master 自己也差 5527 像素（ratio 0.01）、
> 且 master 与 TSL 版的 actual 哈希相同，所以判据取"与 master 对比"而不是"与基线对比"。
> 采样器命名同样遵循 TSL 的展开约定（`s_skyboxTexture_texture` + `s_skyboxTexture`）。
>
> ✅ **第七批（#712 examples 共享着色器批，2026-10-05）**：开始迁 `packages/webgpu/examples` 下的 `.wgsl`。
> 本批先把 **`examples/src/shaders/` 里被多个示例共用的那批**改用 TSL（新增 `examples/src/shaders-tsl/`）：
> `black.frag` / `triangle.vert` / `basic.vert` / `instanced.vert` / `vertexPositionColor.frag` 这 5 个已接入
> 6 个示例（timestampQuery / rotatingCube / twoCubes / textRenderingMsdf / transparentCanvas / instancedCube）；
> `sampleTexture.frag` / `sampleTextureMixColor.frag` / `fullscreenTexturedQuad` 三个**纹理类**的 TSL 版已写好，
> 但接入需要同时改示例的 `bindingResources`（键名要按 TSL 的展开约定换成 `myTexture_texture` + `myTexture`），留下一批。
> 未迁的两类：`red.frag`（**多输出** fragment，TSL 尚无此能力）、`sampleExternalTexture.frag`（`texture_external`）。
>
> 顺带修了 TSL 的两处缺陷：① 函数内数组声明**丢了初始化**（`var pos: array<T, N>;` 而非 `= array<T, N>(...)`）；
> ② GLSL 与 WGSL 的数组声明语法不同（GLSL 是 `vec4 positions[3]`、WGSL 是 `array<vec4<f32>, 3>`），
> 上一批引入的写法把 GLSL 侧写成了 `vec4[3] positions`（被 `packages/tsl/test/array.spec.ts` 拦下）。
>
> **验证的边界**：examples 的 webgpu 示例在 e2e 清单里是 **0 覆盖**（`e2e/examples.config.ts` 171 条里没有 webgpu 分类），
> 所以本批用**离线断言**守住"生成结果与原手写文件逐行对应"（`test/examplesShadersTsl.spec.ts`，7 条），
> 外加人工抽查（`twoCubes` 画面正常、`vite build` 通过）。**给 examples 补画面判据是 #712 的欠账**——
> 没有它就无法宣称"保持渲染语义一致"，后续批次要先把它补上再大规模迁移。
>
> ✅ **第八批（#712 画面判据批，2026-10-05）**：给 `packages/webgpu/examples` **补上画面判据**——
> 上一批发现该目录的 40 个示例在 e2e 里 **0 覆盖**，只能靠离线断言保证"代码对应"。
>
> - 把 feng3d e2e 里的定格脚本提取为 **`e2e/freeze.ts`**（种子化 `Math.random` + 虚拟时钟 +
>   劫持 rAF 两阶段定格），两套 examples 共用；
> - 新增 `e2e/webgpuExamples.config.ts`（示例清单）、`e2e/webgpuExamples.spec.ts`（截图对比）、
>   `playwright.webgpu-examples.config.ts`（起 examples dev server，端口 3200）；
> - **基线在 master 上生成**（`--update-snapshots`），于是"跑通"就等于"与 TSL 化之前一致"。
>
> **容差是必需的，不是我偷懒**：实测这几个示例在**同一份 master 代码**上连跑三次，差异在
> **49~723 像素（ratio 0.01）**之间跳动——画面本身就不是逐位可复现的（rAF 被冻结了，但这些示例
> 仍有非 rAF 驱动的异步更新）。所以判据取 **`maxDiffPixelRatio: 0.02`**：它能拦住"着色器写错导致
> 画面大变"，但**不等于**逐像素等价；这一局限已写进配置注释。
>
> 它确实起了作用：给 #744 那批 TSL 化的 5 个示例配上该判据后，**TSL 版连续两次全部通过**，
> 而离线阶段只能证明"文本对应"。
>
> **仍未纳入 CI**（与 feng3d 的 examples 视觉回归一致，见 R8）：需要真实 GPU 与 dev server，
> 本地/按需跑即可。命令：
> ```bash
> npx playwright test --config playwright.webgpu-examples.config.ts            # 比对
> npx playwright test --config playwright.webgpu-examples.config.ts --update-snapshots   # 更新基线（须在 master 上）
> ```
>
> ✅ **第九批（#712 内联 WGSL 批，2026-10-05）**：清点并迁掉 examples 里**内联在 `.ts` 中**的手写 WGSL。
> 上一批发现 `bitonicSort/utils.ts` 内联了一份 `fullscreenTexturedQuad`，于是做了一次完整清点
> （按 `@vertex` / `@fragment` / `@compute`）：共 **6 个文件**，其中 5 个是 render（本批全部迁完）、
> 1 个是 compute（`bitonicSort/bitonicCompute.ts`，需 #710 的能力）。
> **examples 的 `.ts` 里现已无 render 内联手写 WGSL。**
>
> | 文件 | 处理 |
> |---|---|
> | `helloTriangle/index.ts` / `RenderObjectChanges/index.ts` | 新增 `shaders-tsl/helloTriangle.ts`（裸 `vec4` uniform → `vec4(uniform(...))`） |
> | `multipleCanvases/index.ts` | 新增 `shaders-tsl/multipleCanvases.ts`（struct uniform + 简单兰伯特） |
> | `RenderObjectChanges` 的运行时替换变体 | 新增 `shaders-tsl/renderObjectChangesVariant.ts`（swizzle 赋值改成整体赋值） |
> | `worker/worker.ts` / `bitonicSort/utils.ts` | 复用已有的 `getBasicVertWGSL()` / `getVertexPositionColorFragWGSL()` / `getFullscreenTexturedQuadWGSL()` |
>
> **踩到的坑（值得单列）**：`multipleCanvases` 的 vertex 与 fragment **都用同一个 `Uniforms`**。
> 我一开始把两份 TSL 输出拼成一个 `code` 给两个 stage，结果同一份 module 里出现**两份 `struct Uniforms` 定义**，
> WGSL 编译失败、画面全黑（截图判据抓到的）。根因是 **TSL 的 `fragment.toWGSL(vertexShader)` 只对齐
> binding 与 varying location，并不做跨 stage 的声明去重**；而引擎是把 vertex / fragment 的 code
> **分别**编译成两个 module 的，所以正确做法是**每个 stage 各给一份自包含的 code**。
> （feng3d 的材质不受影响：它们的 vertex 与 fragment 用的是**不同**的 uniform。）
>
> 画面判据清单扩到 **11 个示例**并全部通过。两条例外也已写明理由：`worker`（Worker 驱动，抖动 0.04~0.07，容差放宽到 0.08）
> 与 `bitonicSort`（compute 驱动，抖动 0.30~0.73，**移出清单**——当前定格机制压不住它）。
>
> ✅ **第十批（#712 多输出批，2026-10-05）**：`red.frag` 与它的两个示例（`resizeCanvas` /
> `helloTriangleMSAA`）改用 TSL。
>
> **一条澄清**：我原以为"多输出 fragment"是 TSL 缺的能力（`red.frag` 有 `color0`/`color1` 两个 `@location`），
> 查下来**它本来就支持**——正确写法是把 `fragColor` 包成 vec4 再赋值：
> ```ts
> const color0 = vec4(fragColor(0, 'color0'));
> fragment('main', () => { color0.assign(vec4(1, 0, 0, 1)); });
> ```
> 生成 `struct FragmentOut { @location(0) color0: vec4<f32>, }` 与 `output.color0 = ...`，与手写逐行对应。
> 我先写成 `fragColor(0).assign(...)` 报 "assign is not a function" —— **是用法错，不是能力缺**，
> 差点白补一个 API。教训：**动手补能力前先确认现有 API 能否表达**。
>
> 画面判据清单扩到 **13 个示例**（新增 helloTriangleMSAA / resizeCanvas）全部通过；
> `worker` 的容差从 0.08 提到 0.10（实测 0.04~0.07 但偶发越界）。
>
> ✅ **第十一批（#710 阴影/丢弃批，2026-10-05）**：为 `StandardMaterial` 片元（约 300 行：光照 + 阴影 + 雾）
> 铺路，给 TSL 补了三项能力（都先确认过"现有 API 表达不了"）：
>
> | 能力 | API | 生成的 WGSL |
> |---|---|---|
> | 片元丢弃 | `discard()` | `discard;`（挂到 for 体 > if 体 > 函数体） |
> | 比较采样器 | `samplerComparison(uniform(...))` | `texture_depth_2d` + **`sampler_comparison`** |
> | 硬件深度比较 | `textureSampleCompare(sampler, coord, depthRef)` | `textureSampleCompare(...)` |
>
> 其中比较采样器需要把 `Sampler.toWGSL()` 里硬编码的 `sampler` 抽成可覆盖的 `getWGSLSamplerType()`。
>
> 单测在 `packages/tsl/test/tslCapability.spec.ts`（3 条，含"discard 必须缩进在 if 体内"这类结构性断言）。
> **本批只补能力、没有迁移对象**——它的消费者（`StandardMaterial` 片元）留到下一批，届时用
> `StandardMaterialTest` 的 e2e 与 master 对照做验收。
>
> ✅ **第十二批（#710 结构体数组批，2026-10-05）**：`standardLightingParsWGSL` 需要
> `u_pointLights: array<PointLightData, 8>`（**结构体数组**），而 TSL 原先只支持基础类型数组——
> `array(PointLightData, 8)` 会走 `new PointLightData()` 直接崩（"elementType is not a constructor"）。
>
> 补齐三处：
>
> | 位置 | 改动 |
> |---|---|
> | `Array` | 元素是结构体时类型名取结构体名；元素实例改由「父 uniform + 访问路径」构造 |
> | `Array.index()` | 结构体元素走 `struct.ts` 注入的工厂（**避免循环依赖**），路径带上下标 |
> | `Array._clone()` | struct 成员复制数组时**不能**触发 `elementType()`（那时还没绑定 uniform） |
> | `StructDefinition.getNestedStructDefinitions()` | 数组元素是结构体时也要带上它的定义 |
>
> 生成结果与手写逐行对应（嵌套 struct 定义 + `array<PointLightData, 8>` + `lights.u_pointLights[0].position`）。
> 这条链子比较深：**"元素实例的成员访问路径"是结构体数组的关键**——结构体的成员访问器在构造时就绑死了
> 路径（`StructImpl(uniform, definition, parentPath)`），所以数组必须把 `[i]` 作为 parentPath 传进去，
> 否则生成的成员访问会漏掉下标、类型也会退化成元素结构体。
>
> ✅ **第十三批（#711 光照 pars 批，2026-10-05）**：`standardLightingParsWGSL`（约 100 行：5 个 struct +
> 3 个绑定声明 + 4 个纯函数）从 `StandardMaterial.ts` 的内联字符串迁到 `shaders/tsl/standardLightingPars.ts`。
> 它由 **`StandardMaterial` 与 terrain 的 `TerrainMaterial` 共用**，所以保持了同名导出（`export const
> standardLightingParsWGSL = getStandardLightingParsWGSL()`），调用方零改动。
>
> 本批用到的能力（前两批刚补的）：`discard`、比较采样器、`textureSampleCompare`、**结构体数组**。
>
> **三处必须对齐、且离线断言抓不到的细节**：
>
> 1. **`select` 的分支顺序**：WGSL 是 `select(f, t, cond)`，TSL 的 API 是 `select(condition, trueValue, falseValue)`。
>    手写 `select(1.0, shadow, inFrustum)` 对应 TSL 的 `select(inFrustum, shadow, 1.0)`——我一开始写反成
>    `select(inFrustum, 1.0, shadow)`，**语义完全相反**（阴影判定翻转）；
> 2. **运算顺序要照抄**：`1.0 - lightDistance / range` 不要改写成 `(lightDistance / range - 1.0) * -1.0`——
>    数学等价但浮点不等价；
> 3. **数据侧的采样器键名**：`s_shadowMap` 由「纹理」变成「比较采样器」，纹理移到 `s_shadowMap_texture`
>    （`ForwardRenderer` 同步改），否则运行期报 `没有找到纹理绑定 's_shadowMap_texture'`。
>
> 画面验证的方法值得记：`StandardMaterialTest` 的**入库基线与本机 GPU 不匹配**（master 自己就差 4193 像素），
> 所以我改为**像素级对比「TSL 版 vs master」**，并额外跑一次 master 做噪声基线——结果
> **TSL 版与 master 第二次的哈希完全相同（`27695cfd…`）**，而 master 两次之间本身就不同，
> 因此可判定「TSL 与 master 一致」。这道工序（先量噪声再判等价）在渲染迁移里是必需的。
>
> ✅ **第十四批（#711 雾片段批，2026-10-05）**：把 `standardFogMainWGSL`（约 15 行）做成 TSL 的
> **可复用 body 片段** `applyStandardFog(ctx)`——这是"body 片段"这类对象的第一块试验田。
>
> 与 pars 的本质区别：**body 片段引用调用方的局部变量**（`finalColor`）与 varying（`worldPosition`），
> 所以它的形态是**接收 TSL 表达式的普通 TS 函数**：在 shader body 内调用时，TSL 的语句收集器会把
> `if_` / `let_` 挂到**当前 body** 上；需要回写的颜色用 `var_` 传入、函数内 `assign`。
>
> 这一批暴露并修掉了 TSL 的一个**真 bug**：
>
> **`if_()` 的语句收集没有判断"当前是否在 else 体内"**——它直接 `push` 到 `statements`，
> 于是 `if (a) {...} else if (b) {...}` 里的**内层 if 被塞进了第一个 if 的 body**，
> 生成的 WGSL 结构完全错了（`if (a) { ...; if (b) {...} else {...} }`）。
> 修法是改用 `IfStatement.addStatement()`（它会按 `isElseBodyActive` 决定挂到 `elseStatements`）。
> **这个 bug 只有生成"if / else if / else"链条时才会显形**——之前的用例都没写过这种结构。
>
> 同时补了两个 WGSL 内置：`length` / `distance`（fog 需要 `distance`）。
>
> 说明：本批**只交付这个单元 + 单测**，还没有接入调用方——因为接入需要先把整个
> `standardFragmentWGSL`（约 96 行，含 `standardLightingMain`）迁成 TSL，那是下一批的事。
>
> ✅ **第十五批（#711 光照主体批，2026-10-05）**：`standardLightingMainWGSL`（约 77 行）迁成 body 片段
> `applyStandardLighting(ctx)`，按承诺**分三段逐段对照手写**（specular+ambient / 方向光+点光源 / 聚光灯+环境光+阴影+覆盖判定）。
>
> 本批又抓出**两个 TSL 的真 bug**（都是"只有本用例才会触发"的类型）：
>
> 1. **`let_` 没接 for 栈**：循环体里的 `let_` 会被挂到**循环外面**——生成的 WGSL 里
>    `let lightOffset = lights.u_pointLights[i].position - ...` 出现在 `for` 之后（`i` 根本不在作用域），
>    **编译必然失败**。我当初只给 `var_` / `assign` / `if_` 接了 for 栈，漏了 `let_`（`let_` 在
>    `variables/let.ts`，而 `var_` 在 `variables/var.ts`，文件名不同所以没被一起改到）。
> 2. **`UInt` 缺比较方法**：只有 `equals`，没有 `greaterThan`/`lessThan`——而 `count > 0u` 需要它。
>
> 另外补了 `forU32_`（运行期上界循环，上一批）、`length`/`distance`（上上批）。
>
> ⚠️ **仍未接入调用方**：`applyStandardLighting` / `applyStandardFog` 都还没有生产消费者，
> 接入需要把 `standardFragmentWGSL`（约 96 行，含 `envmapMethod`）也迁成 TSL。这是下一批的事，
> 也是我连续几批欠下的同一笔账（见 §P2 各批的说明）。
>
> ✅ **第十六批（#711 标准片段批，2026-10-05）**：`standardFragmentWGSL`（约 96 行手写字符串）迁成
> `shaders/tsl/standardFragment.ts` 的 `getStandardFragmentWGSL()`，**并接入 `StandardMaterial`**
> （删掉那 96 行手写常量）——**连续四批"单元先行"的欠账到此收掉**：pars / applyStandardLighting /
> applyStandardFog 现在都有了真实消费者。
>
> 本批的四个关键点（前三个都是"不写探针对照就发现不了"的类型）：
>
> 1. **varying 的 `@location` 必须显式指定**：TSL 的自动分配是按**使用顺序**来的，
>    而 fragment 必须与顶点着色器的 `VertexOutput` 严格对齐（0=worldPosition … 6=shadowPos），
>    否则插值数据整体错位。TSL 的 `varying(name, location)` 本来就支持，直接传即可；
> 2. **不能既拼 `pars.wgsl` 又让 TSL 生成 main**：main 的依赖会**自动**把 pars 的 struct/函数/uniform
>    都收进来，额外拼一份就得到**重复的 struct 定义**。正确做法是只输出 `main.toWGSL()`；
> 3. **采样器键名的数据侧要跟着改**：TSL 展开约定是 `s_diffuse_texture`（纹理）+ `s_diffuse`（采样器），
>    与手写的 `s_diffuse` + `s_diffuseSampler` **相反**，所以 `StandardMaterial` 的 bindingResources
>    写入改成 `result[key + '_texture']` + `result[key]`（fog/光照那批的 `s_shadowMap` 同理）；
> 4. `StandardMaterial` 不再需要 `cameraUniformsWGSL` / `globalUniformsWGSL` 两个手写常量——
>    TSL 的 `createCameraUniforms()` 与手写**逐字段一致**（已核对），由 fragment 自己声明。
>
> **画面验证**：`StandardMaterialTest` 的库内基线与本机 GPU 不匹配（master 自己就差 4193 像素），
> 且**该示例本身不确定**——master 连跑三次分别得到 22879 / 22776 / 22720 字节三张不同的图
> （两次之间差 6254 像素）。本批 TSL 版 vs master 差 6321 像素（0.686%），**与 master 自身的
> 抖动同量级**，肉眼一致，无运行期错误（WGSL 编译通过）。判定为一致。
>
> 说明：terrain 的 `TerrainMaterial` 仍在使用 `standardLightingMainWGSL` / `standardFogMainWGSL` /
> `standardLightingParsWGSL` 三个手写字符串，所以它们**保留导出**（下一步可让它也切到 TSL 单元）。
>
> ✅ **第十七批（#711 地形片段批，2026-10-05）**：`TerrainMaterial` 的 `terrainFragmentWGSL`（约 110 行手写字符串）
> 迁成 `packages/terrain/src/terrainFragment.ts` 的 `getTerrainFragmentWGSL()` 并接入。
> **feng3d 与 terrain 两侧的片元着色器至此都已 TSL 化**。
>
> 做法不是复制，而是**参数化**：把上一批的 `buildStandardFragment` 打开三个口子——
> `materialStructName`（TerrainUniforms）、`extraMaterialMembers`（u_splatRepeats）、
> `afterDiffuse`（splat 混合回调）、`withEnvMap: false`——terrain 只写自己那一段（`terrainMethod` 的三层
> splat 混合），标准数据流完全复用。
>
> 三个要点：
>
> 1. **`afterDiffuse` 必须插在 alphatest 之前**：手写数据流是 `diffuse → terrain_frag(splat) → alphatest`。
>    我第一版插到了 alphatest 之后（生成 `discard` 在 splat 之前），靠探针对照手写才发现——**又是"顺序"类错误**，
>    这类错误离线断言不写就抓不到，所以 spec 里加了回归断言；
> 2. **splat 用 `textureLod`（→ `textureSampleLevel`）**：非均匀控制流下不能 textureSample；
> 3. **数据侧键名**：terrain 的 `bindingResources` 同样改成 `key + '_texture'` + `key`（与上一批 StandardMaterial 一致）。
>
> **画面验证**：`TerrainTest` **直接通过**（与入库基线一致），日志无错误。
>
> **注意**：`standardLightingParsWGSL` / `standardLightingMainWGSL` / `standardFogMainWGSL` 三个手写字符串
> 现在**已经没有任何消费者**（feng3d 与 terrain 都用 TSL 单元了），下一批可以删除它们。
>
> ✅ **第十八批（#711 清理批，2026-10-05）**：删除 `standardLightingParsWGSL` /
> `standardLightingMainWGSL` / `standardFogMainWGSL` 三份手写片段字符串（**共约 6430 字符**）。
> 它们在 #780（StandardMaterial 接入 TSL）与 #782（terrain 接入 TSL）之后**已无任何代码消费者**，
> 删除前先用 grep 核对了引用只剩定义处与注释。
>
> 至此 `packages/feng3d/src/materials/` 里的着色器字符串只剩**顶点着色器**（`standardVertexWGSL`）
> 与其 attribute 声明。片元侧全部由 `packages/{feng3d,terrain}/src/shaders/tsl/`（或 terrain 的
> `src/terrainFragment.ts`）的 TSL 模块生成。
>
**风险**：TSL 的 API 可能因主仓一年多演进已不兼容；若差异属"缺失级"过多，
退路是**只收回 TSL 的类型系统与代码生成核心**，先服务新增材质。

> ✅ **实测结论（#709）：这条风险没有兑现**。收编批的差异只有 3 类，且都不是"缺失级"：
> ① `strictNullChecks` 下 2 处类型错误（`error.message` 的 `unknown` 与 `Attribute` 的三参重载）；
> ② 2 处模块级 `new Set()`（R2 要求 lazy-init）；③ 全部 109 个文本文件是 **CRLF**，需按主仓规范转 LF。
> 320 个用例在**主仓 vitest 5.0.2** 下第一次跑就全绿，退路**未启用**。
> 收编的阶段拆解与后续（引擎着色器、examples 的 TSL 化）见 issue #708（总纲）与 #709–#713。

### P3 — 架构加固（预计 1–2 个月）

| 任务 | 借鉴 | 验收 |
|---|---|---|
| 解开 `feng3d` ↔ `particlesystem`/`terrain` 环 | Babylon Lite（单向所有权） | `npm ls` 无环；依赖方向 lint 通过 |
| `math → objectview` 倒置修复（`oav` 元数据下沉或对象自声明） | PlayCanvas（core 不依赖上层） | Layer 0 零上层依赖 |
| 零模块级副作用改造（`logic.ts` 缓存 lazy-init、`Ticker` 自启动移出模块顶层） | Babylon Lite | `sideEffects` 可安全声明；tree-shake 测试通过 |
| 资源 refcount + deferred release | Babylon.js | `GPUDeviceStats` 的 `created == freed + 存活` 恒等式成立（当前不成立） |
| 修复 `GPUDeviceStats.totalMemory` 双计 delta | — | 显存读数正确（当前每次 `addMemory` 多计一个 delta） |
| `strictNullChecks` 收敛（全仓 23 个包） | Babylon Lite | ✅ **已完成**：`feng3d`（#251 / #253 / #269）与 `editor`（#303 / #305）走独立 `tsconfig.strict.json` + `scripts/check-strict-dirs.mjs`；其余 21 个包直接开各自的 `tsconfig.json`（#282 / #284 / #288 / #290 / #293 / #295 / #297 / #299 / #301；`ui` 为收尾批补登记的第 19 个；`editor-plugin-rotate` 为 #276 阶段 3 新增）。进度与豁免清单在 `scripts/strict-packages.json`，由 `scripts/check-strict-packages.mjs` 双向守住（漏登记 / 误关闭都失败）。**存量**：`feng3d` / `editor` 的 `tsconfig.json` 自身仍关 4 项；`editor` 的 test/ 未纳入 |
| pass 编排声明化 | Babylon FrameGraph | 现有 5 个 renderer 的 pass 序列可从数据描述 |
| `logic()` 返回类型改为 `Logic \| null` 并修调用方 | — | 类型与运行时一致（当前声明非空、实际返回 null） |

### P4 — 差异化能力（持续）

> 取舍边界见 **§1.4.5**（对照 Babylon Lite 的能力清单制定）。
> **默认规则：不因为"Lite 有"就补，只因为"服务战场"才补。**

| 任务 | 服务于 | 决策依据 |
|---|---|---|
| ~~editor 收回评估~~ → **已收回**（结论，见 [packages/editor/docs/ARCHITECTURE.md](../packages/editor/docs/ARCHITECTURE.md)）：代码就在 `packages/editor`，主仓追踪 **680 个文件**；是 workspace 成员（根 `package.json` 的 `packages/*`）；CI 有 `editor:` job（`npm run lint --workspace feng3d-editor` + `scripts/check-editor-types.mjs` 分类门禁：editor 自身 0 错误、主仓噪音单列）与 `editor-e2e:` job（浏览器端到端） | 战场 A | Lite 明确无编辑器，是差异化点 |
| 计算图 devtools（依赖边 + 失效计数 + 求值耗时 + dev overlay） | 战场 C | 🔶 部分落地（#95）：`dumpComputedGraph` / `computedGraphStats` 给依赖边、失效计数、上次求值耗时（`enableComputedProfiling()` 开启）；**dev overlay 未做** |
| **错误可观测性（Coded Errors 式）**：错误码 + 按需解码，替换 `console.error` 静默降级 | 战场 C | ✅ 已落地（#94）：`core/CodedError.ts`（ErrorCode / decodeError / 降级计数），关键路径 6 处已替换；reactivity 内核与构建期剥离未做 |
| glTF 完整支持（材质/纹理/动画/骨骼/Draco/KTX2）——**做深而非做多** | 战场 A | §1.3 放弃数量竞争 |
| Resource Pool（GPU buffer / texture 池化） | 战场 B | Lite 已有；重场景需要 |
| 高精度矩阵 / Floating Origin（大坐标场景） | 战场 B | Lite 已有；数字孪生/GIS 需要 |
| 零 GC 抖动渲染路径（热路径免分配） | 战场 B | three.js / PlayCanvas 的做法 |
| 多 View 支持（若编辑器需求明确） | 战场 A | — |
| ~~不补~~：物理 / 导航 / 音频混音 / Sprites / Flow Graph / 后处理全家桶 | — | §1.3 |
| ~~可选~~：CSM / VAT / GPU Picking（客户明确要求前不动手） | — | §1.4.5 |

---

## 5. 文档体系重构

### 5.1 与现有文档的关系（不推倒，做增量）

| 现有文档 | 处置 |
|---|---|
| `FRAMEWORK_DESIGN.md` | **保留为目标架构唯一权威**；✅ 每章已加「现状」标签（R11，#78，CI 校验）；新增内容以本规划 §2 为准 |
| `FRAMEWORK_REFACTOR_PLAN.md` | ✅ **已归档** → `docs/archive/FRAMEWORK_REFACTOR_PLAN.md`（2026-09），顶部已标注历史状态与归档原因；其遗留项见本规划 §4 |
| `AGENTS.md` | ✅ **已更新**：第 7 章改为「单仓多包」形态 + 23 包联邦历史说明；第 12 章 submodule 提交行修正；**新增第 15 章 R1/R2/R3/R6 规范条文与违反项基线** |
| `BENCHMARK_BASELINE.md` | 保留；新增包体/GC 维度（P1） |
| `EFFECT_INVENTORY.md` | ✅ **已重盘并加 CI 校验**（R5，issue #79）：54 处 / 31 文件，脚本与清单不一致即失败；修正 `WGPUBuffer`「无生产者」错误条目 |
| `scripts/check-tree-shaking.mjs` | ✅ **新增**（R2 验收，issue #238）：esbuild 真实打包 + 产物断言（未引用模块必须被消除），并用「显式引入 terrain」的对照产物自证检测方法有效；已进 CI |
| `packages/webgpu/README.md` | ✅ **已修**：修正错误的 `@feng3d/render-api` 导入（该包并非本仓依赖），补「架构速览」（目录结构 / 四个核心机制 / 公开 API / 真实依赖） |
| `packages/webgpu/docs/` | ✅ **已删除**（5 个文件与实现严重不符：`api.md` 所列 `context`/`format`/`createRenderPass` 等 API 均不存在、缓存类构造签名过时、引用不存在的包） |
| `docs/ARCHITECTURE_V2.md`（本文） | 战略与实施路径的权威来源 |
| `docs/POSITIONING.md` | **战略层**：定位声明、目标场景、竞争优势四层分类、非目标、发展优先级（与本文 §1 互补，改动需双向保持一致） |
| `docs/archive/` | ✅ **已建立**：存放历史计划、失联仓库快照、旧决策记录 |

### 5.2 防止再次漂移的三条机制

本次分析发现的**所有**文档问题，根因是同一个：**主仓演进速度 > 外围（文档/配套仓库）跟进速度**。
历史已经发生过两次：`tsl`/`editor` 因 API 漂移失联；文档记录了已废弃的架构。

1. **现状标签 + 脚本校验**（R11）：DESIGN 每章必须标 `✅/🔶/⬜` 且附证据，CI 校验标签存在
2. ✅ **配套仓库风险已清零**：`editor` 早已收回（`packages/editor`），`tsl` 也已收回（`packages/tsl`，
   issue #709）——「配套仓库针对主仓版本 `tsc` 是否通过」这条契约当前**没有对象**。
   该机制保留：若将来再引入外仓配套（如独立的加载器 / 工具包），打 tag 前必须重新启用这项检查
3. **决策记录**：架构级决策（如"不做 WebGL 后端"、"不引入 ECS"）必须写入文档并注明日期与理由，
   避免被后续轮次无意推翻（`FRAMEWORK_REFACTOR_PLAN.md` 中"声明式动画曾落地后回退"就是缺少记录的案例）

---

## 6. 量化目标（对标四家，含 Babylon Lite）

| 指标 | Feng3D 现状 | 目标 | 对标 |
|---|---|---|---|
| 静态场景每帧 | **0 computed 求值 + 0 提交** | 保持（回归即阻塞） | 四家最优（Lite 每帧执行 frame graph + submit） |
| 视觉回归强度 | 容差 1%–40% | 主集 ≤1%，放宽项受控 | Babylon Lite（RMSE < 1.0 / MAD 0.05） |
| 着色器源 | **2 份手工** | **1 份（TSL 生成）** | three.js TSL / Babylon 转换链 / Lite ShaderFragment |
| 类型严格度 | **23/23 个包已开 `strictNullChecks`**（21 个走各自 tsconfig，`feng3d` / `editor` 走独立 strict 配置；另 3 项 strict 仍关） | 其余 3 项 strict 选项、`feng3d` / `editor` 的 `tsconfig.json` 直接开启、editor 的 test/ 纳入 | Babylon Lite（strict + noUncheckedIndexedAccess） |
| 测试覆盖率 | ✅ **已有门禁**（`vitest.config.ts` `coverage.thresholds`：52/42/49/52，随 `npm run test:coverage` 进 CI；阈值是"防下降"口径而非达标线，见 §3.1 R10） | ≥60% → 80% | three.js（有覆盖率检查） |
| 包体 | ✅ **已有基线 + byte 天花板**（`scripts/check-bundle-size.mjs`：3 档引用面 × raw/gzip，超出 +2% 即失败；#73） | 按真实场景分档的预算表 + chunk 预算 | Babylon Lite |
| 资源释放 | 仅 1 类真 destroy | `created == freed + 存活` 成立 | Babylon（deferred release） |
| **错误可观测性** | `console.error` + 静默降级（浏览器下 `NODE_ENV` 判断失效） | 编码错误 + 按需解码 | **Babylon Lite（Coded Errors）** |
| **模块级副作用** | ✅ 0 违规（CI 门禁 `check-module-side-effects --strict`，issue #88） | 0 违规（lint 强制） | **Babylon Lite（明令禁止）** |
| **重场景能力** | 缺 CSM / VAT / Resource Pool / 大坐标 | 按客户需求定向补（§1.4.5） | Babylon Lite 已有（诚实差距） |
| 依赖方向 | 3 处违反 | 0 违规（CI 强制） | PlayCanvas（目录约束） |
| 编辑器 | 失修 | **可用**（已收回，见 §4 P4） | PlayCanvas |
| 加载器 | 1 个简化 GLB | glTF **完整**（做深） | 不做数量竞争 |

---

## 7. 风险与对策

| 风险 | 对策 |
|---|---|
| 单人维护 vs 四家资源差 | 严格守住 §1.2 三个战场；新特性必须先回答"服务哪个战场"（§1.4.5 边界表） |
| **与 Babylon Lite 正面竞争**（同赛道、资源强、能力广） | **不与它比特性数量**；只守 §1.4.3 的两个维度（零提交 + 响应式全链路惰性）；重场景缺口按客户需求定向补，不做"看到它有就补" |
| 重构速度 > 配套跟进（已发生两次） | §5.2 三条机制 |
| 响应式系统的规模上限（每对象 ~19 computed + 2 effect） | P1 建立包体/内存基线；万级对象场景纳入 benchmark；必要时引入矩阵链缓存 |
| TSL 收回后仍不兼容 | P2 设"退路"（只收核心）；试点材质先行验证 |
| 纯 WebGPU 的浏览器覆盖 | 明确作为定位而非缺陷；`render-api` 保留双后端接口设计，不急于实现 |
| 规范加太严导致开发停滞 | 存量违规走白名单文件；新代码严格，逐步收敛 |

---

## 8. 立即可执行的下一步

按性价比排序，前三项都是**小改动、高收益、可立即加回归测试**：

1. **P0 三项止血**（1–2 天，约 30 行代码 + 6 个单测）
2. ✅ **P1 的 examples 纳入 lint**（#77 落地，收尾 #249）：当前 **0 errors / 0 warnings**，已收紧为 `--max-warnings 0`（立项时实测 14 errors / 378 warnings，收尾基线 67 warnings）
3. ✅ **P2 的第一步：在当前主仓环境跑通 TSL 的 320 个测试**（#709 已达成：320 个用例在主仓
   vitest 5.0.2 下全绿，`packages/tsl` 已落仓并接完门禁；后续阶段见 §P2 表）

---

## 附录 A：本规划依据的关键实测数据

| 项 | 数据 |
|---|---|
| 类型检查 | `feng3d` / `webgpu` / `examples` 三处 tsconfig 全部通过 |
| 单元测试 | 66 文件 / 622 用例通过，5.08s |
| Lint | `packages/**/*.ts`：0 errors / 0 warnings（`--max-warnings 0`）；`examples/src`（强制）：**0 errors / 0 warnings**（#249 收尾，同为 `--max-warnings 0`） |
| E2E | 178 条基线（21 typical + 157 full），与示例清单一致 |
| Benchmark | 静态 5000 对象 220ms → vsync；computed 求值 16→0/帧；提交 4.5/s→0 |
| 代码规模 | feng3d 122 文件/17.6k 行；webgpu 136/10.7k；math 62/15.3k；reactivity 28/7.7k |
| 仓库演化 | `bb19b24f`（23 包 → submodule）→ `f80a182a`/`1b84f090`（移除部分）→ `18ef3a29`（退回单仓源码） |
| TSL | v0.2.0，320 单测全绿，含 `@vitest/coverage-v8` |

## 附录 B：四家借鉴来源索引

| 借鉴项 | 来源与依据 |
|---|---|
| 零模块级副作用 / lazy-init 缓存 | Babylon Lite `GUIDANCE.md`（明确禁止模块级 `new Map()`） |
| 单向数据所有权 / 纯状态接口 | Babylon Lite Core Pillars §4b/§4b′ |
| parity 像素门禁 / 不可变 golden | Babylon Lite 测试规范（RMSE < 1.0；中位数 MAD 0.05，禁止无审批放宽） |
| byte-exact 包体天花板 | Babylon Lite `scene-config.json` 机制 + `38-bundle-size-tooling.md` |
| ShaderFragment 组合（着色器单源） | Babylon Lite `23-shader-composition.md` |
| Material Plugin（零影响扩展缝） | Babylon Lite `26-material-plugin.md` |
| FrameGraph（任务排序 / RTT 纹理流） | Babylon Lite `28-frame-graph.md` + Babylon.js FrameGraph |
| **Coded Errors（错误码 + 按需解码）** | Babylon Lite `49-error-handling.md` |
| Device Lost Recovery | Babylon Lite `50-device-lost-recovery.md` |
| Resource Pool（GPU 资源池化） | Babylon Lite `37-resource-pool.md` |
| Floating Origin / 高精度矩阵 | Babylon Lite `35-large-world-rendering.md` / `36-high-precision-matrix.md` |
| 扩展模块 + 动态 import + 特性注册 | Babylon Lite `GltfFeature` / `PbrExt` 模式 |
| deferred release（释放时机） | Babylon.js `WebGPUBufferManager.destroyDeferredBuffers()` |
| bundle 列表交错不支持的 API | Babylon.js `WebGPUBundleList`（对照 feng3d 的空实现） |
| 目录结构表达依赖方向 | PlayCanvas `src/core` 不依赖 `src/framework` |
| Asset / Resource 显式分离 | PlayCanvas Assets 文档 |
| 覆盖率检查 / tree-shake 测试 | three.js `test-e2e-cov` / `test-treeshake` |
