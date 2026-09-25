# Feng3D 架构演进规划 V2

> 状态：规划文档（2026-09）。本文档与 [FRAMEWORK_DESIGN.md](../FRAMEWORK_DESIGN.md)（目标架构）、
> [FRAMEWORK_REFACTOR_PLAN.md](../FRAMEWORK_REFACTOR_PLAN.md)（上一轮改造计划）的关系见 §5.1。
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
| 模块级副作用 | **明令禁止**（含 `new Map()`） | `logic.ts:62-63` 等违规 |

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
│  objectview（数据→UI）        editor（收回或冻结，见 §4 P4）      │
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

### 2.2 七项架构修正（每项都有架构层解法，而非补丁）

| # | 问题（实测证据） | 架构层解法 | 借鉴来源 |
|---|---|---|---|
| 1 | **异常安全**：`noMutationCount`/`batchRun` 无 `try/finally`，一次 submit 异常 → 变更计数永久关闭 → 渲染永久冻结 | 所有作用域守卫强制 `try/finally`；异常路径纳入单测；机制级"故障恢复"而非静默降级 | 自研（P0） |
| 2 | **tree-shaking 冲突**：`registerLogic` 是 import 副作用；`logic.ts:62-63` 有模块级 `new Map()`/`new WeakMap()`；`Ticker.ts:317` 顶层自启动 | 零模块级副作用；缓存 lazy-init；可选特性一律 `() => import(...)`；显式 `registerXXX` 入口 | **Babylon Lite** |
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
| **编辑器收回** | 评估收回 `editor`（Vue+Electron，含在线版）或明确冻结；objectview 是其 Inspector 底座 | PlayCanvas（引擎/编辑器解耦但同生态） | 战场 A |
| **零 GC 抖动渲染路径** | 渲染热路径避免临时对象分配（`unblenditems.concat(blenditems)` 等），用 benchmark 的 GC 采样验证 | three.js（对象池）/ PlayCanvas（System 批量） | 战场 B |

### 2.4 明确不做

- 不引入 ECS（feng3d 的"数据 + Logic"分离已经拿到了 ECS 的模块化收益，且保住了序列化优势；
  引入 System 会破坏"数据即应用"）
- 不做 WebGL 后端（**除非**明确需要覆盖 WebGPU 不可用的浏览器；`render-api` 保留了接口设计，
  但落地优先级低于 §4 的 P2/P3）
- 不做可视化节点编辑器（着色器走 TSL 代码化路线，与 three.js 一致而非 Babylon 的 NME）

---

## 3. 规范升级：每条规范必须有机器执行者

### 3.1 现状：规范与执行者的错配（实测）

| 规范 | 当前执行者 | 问题 |
|---|---|---|
| 纯数据声明式（不用 `new`） | **无**（靠 review） | 示例与 addons 中存在命令式写法 |
| 数据/Logic 分层 | **无** | 依赖 `as unknown as`（全包 137 处） |
| 响应式四条纪律 | eslint（4 条 error 规则） | **漏检**：`toReactive`/`logic()` 产生的代理不被识别；`this.effect(` 不受检；examples 完全排除在 lint 外（实测 14 errors / 378 warnings） |
| effect 使用边界 | `effect-annotation` + EFFECT_INVENTORY.md | 37 处 `effect(` 仅 27 处有注解；`EFFECT_INVENTORY.md` 称 `WGPUBuffer` 两 effect「无生产者」，实测代码在写 `writeBuffers` |
| 依赖方向 | **仅文档** | 已被 3 处实质违反 |
| 覆盖率 >80%（AGENTS §13） | **无** | `vitest.config.ts` 无 coverage 配置 |
| 视觉回归 | Playwright 178 基线 | 容差最宽到 **0.4**（几乎失去检测力） |
| 包体 | **无** | 无测量、无天花板 |

### 3.2 升级后的规范体系

**原则：规范 = 声明 + 执行者 + 违规后果。三者缺一不算规范。**

| # | 规范 | 执行者（新增/强化） |
|---|---|---|
| R1 | 依赖方向只向下 | `eslint import/no-restricted-paths`（分层路径映射） |
| R2 | 零模块级副作用 | 自研 `feng3d/no-module-side-effect`（禁模块级 `new Map/WeakMap/Set`、`register*()` 调用、`globalThis` 写入） |
| R3 | 纯数据声明式 | 自研 `feng3d/no-imperative-construction`（禁止 `new XxxGeometry()`/`new Color4()` 等数据类构造） |
| R4 | 响应式纪律 | 扩展现有 4 条：识别 `toReactive`/`logic()` 代理；覆盖 `this.effect(`；**examples 纳入 lint** |
| R5 | effect 必须注解 | 现有规则 + CI 校验 `EFFECT_INVENTORY.md` 与实际调用点数量一致（防止清单腐化） |
| R6 | 可空性显式 | `logic()` 返回 `Logic \| null`；新代码启用 `strictNullChecks`（存量目录白名单逐步收敛） |
| R7 | 作用域守卫异常安全 | 单测强制：每个 `noMutationCount`/`batchRun`/`batch` 调用点必须有异常路径用例 |
| R8 | 视觉回归强度 | golden 不可变；`maxDiffPixelRatio` 默认 ≤0.01，**放宽需在 PR 中说明理由并经确认** |
| R9 | 包体天花板 | 分档场景 byte-exact 上限（参考 Babylon Lite 的 `scene-config.json` 机制） |
| R10 | 覆盖率门禁 | `vitest --coverage` + 阈值（先 60%，逐季上调），**排除项必须显式列出** |
| R11 | 文档现状标签 | `FRAMEWORK_DESIGN.md` 每章顶部加 `> 现状：✅已落地 / 🔶部分 / ⬜未开始（证据：文件:行）`，脚本校验标签存在 |
| R12 | 提交规范 | 现有 Conventional Commits（已执行良好，保持） |

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
| examples 纳入 lint（R4） | — | 实测 14 errors 需清零；示例是所有用户的模板 |
| 文档现状标签（R11） | Babylon Lite（GUIDANCE） | `FRAMEWORK_DESIGN.md` 11 章全部标注现状 |
| `EFFECT_INVENTORY.md` 与实际调用点一致性校验（R5） | — | 脚本校验通过（当前已有 1 处不一致） |

### P2 — 收编 TSL：消除双份着色器维护（预计 2–4 周）

> **这是全规划中性价比最高的一步**。`@feng3d/tsl` 已有 **320 个单元测试全绿**（最后提交
> `c5612c0a`，2026-07-23），src 分层完整（`core`/`glsl`/`shader`/`types`/`variables`/`vector`/
> `math`/`control`），且已实现深度区间转换（WebGL `[-1,1]` → WebGPU `[0,1]`）。
> 它解决的是 feng3d 当前最大的架构欠账（§2.2 #4），且**不需要从零重写**。

| 任务 | 验收 |
|---|---|
| 在**当前主仓环境**下跑通 TSL 的 320 个测试 | 全绿（这是"能否收回"的判据） |
| 产出 API 差异清单（TSL 期望的 API vs 主仓现状） | 差异项分级：类型级 / 语义级 / 缺失级 |
| `packages/tsl` 收进主仓（与其它 15 个包同等待遇） | workspace 识别、`tsc` 通过、纳入 lint/测试 |
| 选 1 个材质试点（建议 `NormalMaterial`，着色器最短） | 试点材质改用 TSL 生成，e2e 像素一致 |
| 逐个材质迁移（7 个材质 + shadow/common 模块） | 每迁移一个，e2e 基线验证 + 删除对应的手写 WGSL |
| GLSL 源文件降级为"参考样本"并从构建路径移除 | 仓库不再有"必须人工保持同步的两份着色器" |

**风险**：TSL 的 API 可能因主仓一年多演进已不兼容；若差异属"缺失级"过多，
退路是**只收回 TSL 的类型系统与代码生成核心**，先服务新增材质。

### P3 — 架构加固（预计 1–2 个月）

| 任务 | 借鉴 | 验收 |
|---|---|---|
| 解开 `feng3d` ↔ `particlesystem`/`terrain` 环 | Babylon Lite（单向所有权） | `npm ls` 无环；依赖方向 lint 通过 |
| `math → objectview` 倒置修复（`oav` 元数据下沉或对象自声明） | PlayCanvas（core 不依赖上层） | Layer 0 零上层依赖 |
| 零模块级副作用改造（`logic.ts` 缓存 lazy-init、`Ticker` 自启动移出模块顶层） | Babylon Lite | `sideEffects` 可安全声明；tree-shake 测试通过 |
| 资源 refcount + deferred release | Babylon.js | `GPUDeviceStats` 的 `created == freed + 存活` 恒等式成立（当前不成立） |
| 修复 `GPUDeviceStats.totalMemory` 双计 delta | — | 显存读数正确（当前每次 `addMemory` 多计一个 delta） |
| `strictNullChecks` 分目录推进（从 `core/` 开始） | Babylon Lite | 白名单目录开启且 `tsc` 通过 |
| pass 编排声明化 | Babylon FrameGraph | 现有 5 个 renderer 的 pass 序列可从数据描述 |
| `logic()` 返回类型改为 `Logic \| null` 并修调用方 | — | 类型与运行时一致（当前声明非空、实际返回 null） |

### P4 — 差异化能力（持续）

> 取舍边界见 **§1.4.5**（对照 Babylon Lite 的能力清单制定）。
> **默认规则：不因为"Lite 有"就补，只因为"服务战场"才补。**

| 任务 | 服务于 | 决策依据 |
|---|---|---|
| editor 收回评估（能否编译 → 依赖差异 → 收回或明确冻结） | 战场 A | Lite 明确无编辑器，是差异化点 |
| 计算图 devtools（依赖边 + 失效计数 + 求值耗时 + dev overlay） | 战场 C | Lite 无可观测层 |
| **错误可观测性（Coded Errors 式）**：错误码 + 按需解码，替换 `console.error` 静默降级 | 战场 C | §1.4.4 ② |
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
| `FRAMEWORK_DESIGN.md` | **保留为目标架构唯一权威**；每章加「现状」标签（R11）；新增内容以本规划 §2 为准 |
| `FRAMEWORK_REFACTOR_PLAN.md` | **归档为历史**（`docs/archive/`），其中的遗留项迁入本规划 §4；不再作为执行依据 |
| `AGENTS.md` | 更新：第 7 章 submodule 说明改为「历史：23 包联邦 → 已退回单仓（`18ef3a29`）」；§11.5 与实现对齐；新增 R1/R2/R3/R6 |
| `BENCHMARK_BASELINE.md` | 保留；新增包体/GC 维度（P1） |
| `EFFECT_INVENTORY.md` | 保留；增加 CI 一致性校验（R5） |
| `docs/ARCHITECTURE_V2.md`（本文） | 战略与实施路径的权威来源 |
| `docs/POSITIONING.md` | **战略层**：定位声明、目标场景、竞争优势四层分类、非目标、发展优先级（与本文 §1 互补，改动需双向保持一致） |
| `docs/archive/`（新建） | 存放历史计划、失联仓库快照、旧决策记录 |

### 5.2 防止再次漂移的三条机制

本次分析发现的**所有**文档问题，根因是同一个：**主仓演进速度 > 外围（文档/配套仓库）跟进速度**。
历史已经发生过两次：`tsl`/`editor` 因 API 漂移失联；文档记录了已废弃的架构。

1. **现状标签 + 脚本校验**（R11）：DESIGN 每章必须标 `✅/🔶/⬜` 且附证据，CI 校验标签存在
2. **配套仓库版本契约**：若 `tsl`/`editor` 决定长期留在外仓，主仓打 tag 时必须跑一次
   「配套仓库针对该版本 `tsc` 是否通过」的检查——否则失联会重演
3. **决策记录**：架构级决策（如"不做 WebGL 后端"、"不引入 ECS"）必须写入文档并注明日期与理由，
   避免被后续轮次无意推翻（`FRAMEWORK_REFACTOR_PLAN.md` 中"声明式动画曾落地后回退"就是缺少记录的案例）

---

## 6. 量化目标（对标四家，含 Babylon Lite）

| 指标 | Feng3D 现状 | 目标 | 对标 |
|---|---|---|---|
| 静态场景每帧 | **0 computed 求值 + 0 提交** | 保持（回归即阻塞） | 四家最优（Lite 每帧执行 frame graph + submit） |
| 视觉回归强度 | 容差 1%–40% | 主集 ≤1%，放宽项受控 | Babylon Lite（RMSE < 1.0 / MAD 0.05） |
| 着色器源 | **2 份手工** | **1 份（TSL 生成）** | three.js TSL / Babylon 转换链 / Lite ShaderFragment |
| 类型严格度 | 4 项 strict 关闭 | `strictNullChecks` 覆盖 `core/` 起 | Babylon Lite（strict + noUncheckedIndexedAccess） |
| 测试覆盖率 | 无门禁（622 用例） | ≥60% → 80% | three.js（有覆盖率检查） |
| 包体 | 无测量 | 有基线 + byte 天花板 | Babylon Lite |
| 资源释放 | 仅 1 类真 destroy | `created == freed + 存活` 成立 | Babylon（deferred release） |
| **错误可观测性** | `console.error` + 静默降级（浏览器下 `NODE_ENV` 判断失效） | 编码错误 + 按需解码 | **Babylon Lite（Coded Errors）** |
| **模块级副作用** | 存在（`logic.ts:62-63` 等） | 0 违规（lint 强制） | **Babylon Lite（明令禁止）** |
| **重场景能力** | 缺 CSM / VAT / Resource Pool / 大坐标 | 按客户需求定向补（§1.4.5） | Babylon Lite 已有（诚实差距） |
| 依赖方向 | 3 处违反 | 0 违规（CI 强制） | PlayCanvas（目录约束） |
| 编辑器 | 失修 | 可用或明确冻结 | PlayCanvas |
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
2. **P1 的 examples 纳入 lint**（实测 14 errors / 378 warnings，示例是用户模板）
3. **P2 的第一步：在当前主仓环境跑通 TSL 的 320 个测试**（只读验证，判断收回成本）

---

## 附录 A：本规划依据的关键实测数据

| 项 | 数据 |
|---|---|
| 类型检查 | `feng3d` / `webgpu` / `examples` 三处 tsconfig 全部通过 |
| 单元测试 | 66 文件 / 622 用例通过，5.08s |
| Lint | `packages/**/*.ts`：0 errors / 17 warnings；`examples/src`（强制）：**14 errors / 378 warnings** |
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
