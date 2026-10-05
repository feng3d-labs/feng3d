# 物理引擎选型分析与对接决策

> 状态：决策文档（2026-10）。回答三个问题——**四大引擎各自怎么选物理引擎**、
> **feng3d 该优先对接哪款**、**历史物理引擎（cannon）怎么迁入 packages/**。
> 全部论断附可核实来源：官方文档原文（本次实测抓取）、npm 注册表、GitHub API 实测读数。

---

## 1. 结论（TL;DR）

1. **主流四家的共同趋势**：从纯 JS 物理引擎（cannon / oimo / p2）转向 **WASM 物理引擎**
   （Havok / Rapier / Jolt / Ammo / PhysX）。**cannon 在四家中已被全部弃用或移除**：
   PlayCanvas 把它归入 "largely unmaintained"、Babylon.js Physics V2 只剩 Havok、
   three.js 官方物理示例里已没有它。
2. **但 feng3d 的发布形态与 WASM 引擎冲突**：feng3d 子包是 **纯 TS 源码发布、不构建 dist**
   （AGENTS.md §14），而 Rapier / Jolt / Ammo 都需要 .wasm 资源、异步初始化与 CDN 路径——
   这不是「加个依赖」，而是引入一条新的**资源分发链**。
3. **判断：feng3d 优先对接 cannon**（把历史资产迁入 packages/），理由见 §5：
   纯 TS 可直接 import、无 WASM 资源链、引擎体积 774 KB（对比 Rapier 15 MB / Jolt 46 MB）、
   已有可用的引擎与组件层资产。
4. **但必须按「可换后端」设计**：组件层不直接调引擎，而经一个 `PhysicsBackend` seam
   （借 PlayCanvas 的做法，见 §2.1）。**下一后端候选是 Rapier**（§5.3），
   它在四家中是唯一「官方维护 JS binding + 跨平台确定性开箱即用 + 仍在活跃开发」的。
5. **形态是可选扩展包，不是引擎核心**：`docs/POSITIONING.md` §5 与
   `ARCHITECTURE_V2.md` §1.3 都把「物理」列为非目标，
   所以物理只能以**上层扩展包**形态存在（与 particlesystem / terrain / ui 同类），
   **不写进 feng3d 核心依赖、不改定位**——详见 §7。
6. **这事有现实动机，不只是"补功能"**：`packages/editor` **已经依赖** `@feng3d-plugins/cannon` 与
   `@feng3d-plugins/cannon-plugin`（`packages/editor/package.json` 第 58–59 行），
   但该插件的物理链路**目前是停用状态**——`packages/editor/src/vite-entry.ts` 的注释写明：
   "P0：暂时移除 cannon-plugin ——它嵌套依赖旧版 feng3d（node_modules/@feng3d-plugins/cannon-plugin/node_modules/feng3d@0.7.13 的 dist 构建）"。
   所以迁移的准确性质是：**把外仓依赖收回主仓、并适配当前引擎 API**（与 #709 收编 `packages/tsl` 同理）。

---

## 2. 四大引擎的物理引擎选型（实测）

### 2.1 PlayCanvas：ammo.js 为内置后端 + `PhysicsWorld` 可换后端 seam

来源：<https://developer.playcanvas.com/user-manual/physics/ammo-alternatives/>（本次抓取原文）

- **内置后端是 ammo.js**（Bullet 的 Emscripten 移植）。官方同时承认它的代价：
  "It is highly versatile and can generate high fidelity simulations.
  But it has quite high performance and memory requirements."
- **有两代集成方式**：新一代经 **`PhysicsWorld` 后端抽象层**，老一代 p2.js 集成
  是 "wraps the engine with its own script-based components"。
  官方原文：*"The engine's physics components do not call ammo.js directly. Bodies, shapes,
  joints, ray casts and contact reporting go through a backend layer, `PhysicsWorld`, and the
  built-in ammo.js backend is one implementation of it. The layer is marked alpha, so its API
  may still change, but it is the intended seam for integrating another engine."*
- **官方替代品表**（原文排序即"活跃度"排序，先活跃、后 "largely unmaintained but still usable"）：

  | 引擎 | 语言 | WASM 构建 | 2D | 3D | 跨平台确定性 | PlayCanvas 集成 |
  |---|---|---|---|---|---|---|
  | Rapier | Rust | ✔ | ✔ | ✔ | ✔ | ✔ |
  | Jolt | C++ | ✔ | | ✔ | | ✔ |
  | Box3D | C | ✔ | | ✔ | | |
  | PhysX | C++ | ✔ | | ✔ | | |
  | box2d.js | C++ | ✔ | ✔ | | ✔ | |
  | Matter.js | JavaScript | | ✔ | | | |
  | p2.js | JavaScript | | ✔ | | | Yes |
  | **cannon.js** | JavaScript | | | ✔ | | |
  | Oimo.js | JavaScript | | | ✔ | | |

- **源码结构**（子代理实测 PlayCanvas 仓库）：`src/framework/physics/{physics-world.js, ammo/, null/}`——
  `physics-world.js` 是后端接口，`ammo/` 与 `null/` 是两个实现（null 即"无物理"后端）。
- **值得 feng3d 直接借用的一条**：`PhysicsWorld` 这个 seam——组件层与后端解耦，
  换引擎不动组件。本方案的 `PhysicsBackend` 即照此设计（§6.1）。

### 2.2 Babylon.js：Physics **V2 由 Havok 独占**

来源：<https://doc.babylonjs.com/features/featuresDeepDive/physics>（SPA，正文经其文档仓库核实：
content/features/featuresDeepDive/physics/ 下 v1/ 与 v2/ 两个子目录）

- **V1**（v1/usingPhysicsEngine.md）：多引擎可选——Cannon.js / Ammo.js / Oimo.js / Energy.js。
- **V2**（v2/）：**只支持 Havok**——目录里是 usingHavok.md、rigidBodies.md、
  constraints.md、characterController.md、raycast.md、shapeCast.md、ragdolls.md、
  aggregates.md、perfTips.md，另有 **migrateFromV1.md**（从多引擎迁到 Havok 的官方指南）。
- **V2 文档原文**（v2/usingPhysicsEngine.md）："There is a plugin for the Havok Physics engine."
- **含义**：Babylon.js 用「一整代 API + 官方迁移指南」的代价，把物理收敛到 Havok（WASM）一家。
  这是四家中**最彻底的"纯 JS → WASM"转向**。

### 2.3 three.js：核心不含物理，官方示例仅 **Ammo / Jolt / Rapier**

来源：GitHub API 实测 mrdoob/three.js 仓库 examples/jsm/physics/ 目录内容

| 文件 | 大小 | 加载方式（源码实测） |
|---|---|---|
| AmmoPhysics.js | 9 214 B | cdn.jsdelivr.net/gh/kripken/ammo.js@.../builds/ammo.wasm.js |
| JoltPhysics.js | 8 583 B | cdn.jsdelivr.net/npm/`jolt-physics`@1.0.0/dist/`jolt-physics`.wasm-compat.js |
| RapierPhysics.js | 11 339 B | cdn.skypack.dev/@dimforge/rapier3d-compat@0.17.3 |

- **三家全是 WASM**，且全部**从 CDN 动态加载**（没有一家是 npm 直接 import 就能用的）。
- **cannon 已被移除**：历史上有 CannonPhysics.js，现目录里没有。
- three.js 的立场是"核心不做物理，示例给接入范式"——其**官方手册 Libraries-and-Plugins 把物理列为外部社区库**
  （列出 Oimo / enable3d / ammo / cannon-es / rapier / Jolt）。这一点与 feng3d 的扩展包思路一致。

### 2.4 Unity：内置 **PhysX**（3D）/ Box2D（2D），DOTS 用 **Unity Physics**，另可选 Havok

来源：<https://docs.unity3d.com/6000.4/Documentation/Manual/physics-integrations.html>（本次抓取原文）

原文摘录：
- *"Built-in 3D physics: Uses an integration of the **Nvidia PhysX** engine by default."*
- *"Built-in 2D physics: Uses an integration of the **Box2D** physics engine by default."*
- *"If your project uses Unity's Data-Oriented Technology Stack (DOTS), you need to install the
  **Unity Physics package**. Unity Physics is the DOTS physics engine that simulates physics in a
  data-oriented project."*
- 附加资源里另列 **Havok Physics for Unity package**。

**含义**：Unity 是"**按项目形态分两套物理**"——面向对象用 PhysX（成熟、单线程对象图），
数据导向（DOTS/ECS）用自研 Unity Physics（可 Burst/Job 化）。这条对 feng3d 的启示不是
"选哪款"，而是**物理的接入形态要匹配引擎的数据模型**：feng3d 是"纯数据 + Logic"，
物理组件的状态也应当是可序列化数据 + Logic 行为（§6.2）。

### 2.5 归纳

| 引擎 | 曾经/现在的纯 JS 选项 | 现在的主推 | 转向幅度 |
|---|---|---|---|
| PlayCanvas | p2.js → ammo.js | ammo.js（内置）+ `PhysicsWorld` seam 可换 Rapier/Jolt/... | 中：留了换后端的口 |
| Babylon.js | Cannon / Ammo / Oimo / Energy | **Havok（V2 独占）** | 大：整代 API 重写 + 官方迁移指南 |
| three.js | Cannon（曾） | **Ammo / Jolt / Rapier 示例（全 WASM）** | 中：核心始终不含物理 |
| Unity | —（一直用 PhysX） | PhysX（OO）/ Unity Physics（DOTS）/ Havok（可选） | 小：按数据模型分两套 |

**共同点**：**纯 JS 物理引擎已全面退场**，理由是性能、内存、功能完整度与跨平台确定性。
**分歧点**：换后端这件事，只有 PlayCanvas 把"seam"做成了正式架构（`PhysicsWorld`），
其余三家要么单点绑定（Babylon→Havok），要么交给用户（three.js 示例）。

---

## 3. 候选引擎客观对比（npm 注册表 + GitHub API 实测，2026-10）

### 3.1 分发与体积（npm registry 实测）

| 包 | 最新版 | 最后发布 | 解包体积 | 自带类型 | 备注 |
|---|---|---|---|---|---|
| cannon（上游） | 0.6.2 | 2022-06 | — | 无 | 已停更 |
| `cannon-es` | 0.20.0 | 2022-08 | 774 KB | 有 | upstream 的 TS 分支 |
| @dimforge/rapier3d | 0.21.0 | 2026-09-25 | **5.0 MB** | 有 | 需另配 wasm 资源 |
| @dimforge/rapier3d-compat | 0.21.0 | 2026-09-25 | **15.0 MB** | 有 | wasm 以 base64 内联，可直接 import |
| `jolt-physics` | 1.1.0 | 2026-07-11 | **46.4 MB** | 有 | 体积最大 |
| `ammojs-typed` | 1.1.0 | 2026-09-23 | 3.5 MB | 有 | Bullet 直译 API |
| `box3d.js` | 0.1.1 | 2026-08-06 | 4.0 MB | 无 | 新，未成熟 |
| oimo | 1.0.9 | 2022-06 | — | 无 | 已停更 |

> 口径说明：最后发布取 npm 的 time.modified（**不是** GitHub 最后提交）；
> 解包体积取 dist.unpackedSize（含 wasm 与 sourcemap）。

### 3.2 维护活跃度（GitHub API 实测）

| 仓库 | stars | 最后推送 | 主语言 | 状态 |
|---|---|---|---|---|
| schteppe/cannon.js | 5 004 | 2023-08-04 | JavaScript | 停更 |
| pmndrs/`cannon-es` | 2 062 | 2024-01-06 | TypeScript | 低速/停更 |
| dimforge/rapier | 5 818 | **2026-09-27** | Rust | **活跃** |
| jrouwe/JoltPhysics | **11 662** | **2026-10-04** | C++ | **最活跃** |
| kripken/ammo.js | 4 575 | 2026-09-22 | C++ | 活跃（跟随 Bullet） |
| lo-th/Oimo.js | 3 176 | 2021-07-08 | JavaScript | 停更 |

### 3.3 与 feng3d 的契合度判据

| 判据 | cannon / `cannon-es` | Rapier | Jolt | Ammo |
|---|---|---|---|---|
| **纯 TS/JS，可源码 import**（feng3d 源码发布策略） | ✔ 原生 | 否（需 wasm 资源链） | 否 | 否 |
| **无 WASM 异步初始化** | ✔ | 否 | 否 | 否 |
| 体积（对首屏） | ✔ 774 KB | 5–15 MB | 46 MB | 3.5 MB |
| 自带 TS 类型 | ✔（`cannon-es`）/ feng3d fork 是 TS 源码 | ✔ | ✔ | ✔ |
| 跨平台确定性（联机/回放） | 否 | ✔ 官方 wasm 开箱 | 需编译期 flag | 否 |
| 维护活跃度 | 否（停更） | ✔ | ✔ 最活跃 | ✔ |
| 已有 feng3d 资产 | ✔ **引擎 10 608 行 + 组件层 620 行** | 无 | 无 | 无 |
| 与"纯数据 + Logic"数据模型的距离 | 中（组件需重写为新范式） | 中 | 中 | 中 |

---

## 4. feng3d 的约束

这四条是下面判断的依据，且都是本仓的**硬约束**（有门禁执行者）：

1. **源码发布、不构建 dist**（AGENTS §14）：子包靠 main/types 直指 src/*.ts，
   消费方直接编译源码。→ **纯 TS 依赖最顺滑**；WASM 依赖要么内联 base64（体积炸），
   要么引入"运行时按路径取仓库内文件"的链路（而这条链路在发布场景下极易 404，
   仓里已为它专门做过 `scripts/check-editor-publish-files.mjs`）。
2. **包体门禁**（R9，`scripts/check-bundle-size.mjs`）：新包会被纳入包体天花板。
   → 首屏型依赖（46 MB 的 Jolt）几乎不可能过。
3. **覆盖率门禁**（R10，当前阈值 52/42/49/45）：`vitest.config.ts` 的
   coverage.include 是 packages/*/src/**/*.ts，**新包一进来就进分母**。
   → 迁入 N 行引擎代码必须同时迁入（或补写）足量测试，否则全局覆盖率直接掉穿阈值。
4. **零模块级副作用**（R2，`scripts/check-module-side-effects.mjs` --strict +
   `scripts/check-toplevel-new.mjs`）：cannon 源码里有**模块级 const tmp = new Vector3() 临时对象**
   （如 `BroadphaseCollisionPairsR`），两条门禁都会拦下——**迁移必须把它们改为惰性初始化**。

---

## 5. 判断：feng3d 优先对接哪款

### 5.1 短期（本次）：**cannon**

判断依据（按权重）：

1. **唯一与"源码发布"零摩擦的选项**（§4.1）——纯 TS，import 即用，无资源链、无异步握手。
2. **已有资产，且编辑器已在用**：
   - npm 上的 `@feng3d-plugins/cannon@0.7.0` 与 `@feng3d-plugins/cannon-plugin@0.7.0`
     （其 `origin` 字段自述 fork 自 `schteppe/cannon.js` 0.6.2）；
   - `packages/editor` 已声明这两个依赖（`package.json` 第 58–59 行）、`vite.config.js` 把它们
     列进 externals（第 196–197 / 278–279 / 383 行）、模板 `resource/template/index.html` 用
     `<script src="libs/cannon.js">` 直接加载 UMD 产物；
   - 但**运行时链路是断的**：`vite-entry.ts` 已把 cannon-plugin 的挂载注释掉，理由是它嵌套依赖
     旧版 feng3d 的 dist 构建（详见 §1.6、§6.5）。
   → 所以这不是"从零写"，而是**收回 + 适配**。
3. **体积**：774 KB 级，与 WebGPU 引擎自身的量级相容。
4. **它虽已退场，但"退场原因"在 feng3d 的定位下不成立**：
   cannon 退场是因为**游戏引擎**需要高性能/确定性/大世界；
   而 feng3d 的定位是「数据即应用」的渲染内核（POSITIONING §1），
   物理是**可选配置能力**而非每帧核心——"1 人资源下不该补物理全家桶"这条依然成立（§7）。

### 5.2 明确不选的

- **上游 cannon（0.6.2）**：停更且**无 TS 类型**；要用纯 JS 路线就用 `cannon-es`。
- **Jolt**：46 MB 包体 + 预构建包未开 `CROSS_PLATFORM_DETERMINISTIC`（官方文档原话，
  见 PlayCanvas 页的 Determinism 段）；与源码发布形态冲突最严重。
- **Ammo**：3.5 MB 但 API 是 Bullet 直译（冗长、无 TS 风格），Babylon V1 已弃它。

### 5.3 中期（预留）：**Rapier**

- 四家中唯一：**官方维护 JS binding** + **跨平台确定性开箱即用** + **仍在活跃开发**
  （three.js 与 PlayCanvas 的官方示例都已把它列为首选之一）。
- 前提是先解决"WASM 资源怎么随源码发布"——这是独立议题，**本阶段不开工**，
  只要求组件层经 `PhysicsBackend` seam 调用（§6.1），将来换后端不动组件。

---

## 6. 迁移方案（cannon）

> **路线已于评审时选定**：走 **§6.4——引擎改用 npm `cannon-es` 依赖，只把组件层重写迁入**，
> 而非 §6.1/§6.2 的「完整迁入 feng3d 的 cannon fork」。理由见 §6.4 与 §7 的定位约束。
> 下面 §6.1–§6.3 保留为「完整迁入」方案的记录（供对照与回溯）；**§6.5 编辑器侧适配仍然适用**。

### 6.1 包结构与分层

| 包 | 内容 | 依赖 |
|---|---|---|
| `packages/cannon` | cannon 引擎本体（body/shape/world/solver/collision/constraints）+ **包内私有可变数学层** | `@feng3d/event` |
| `packages/cannon-plugin` | feng3d 组件适配层（`PhysicsWorld` / `Rigidbody` / *Collider） | feng3d + `@feng3d/cannon` |

**为什么引擎本体自带可变数学层，而不是依赖 `@feng3d/math`**：

- `@feng3d/math` 已在 issue #134 阶段 C **完成纯函数化（19 个数值/几何 class 全部删除）**，
  Vector3 现在是只读接口 { readonly x, y, z, __type__ } + 模块级 vec3* 纯函数；
- 而 cannon 深度依赖**可变 in-place API**：实测 new Vector3 **421 处**、new Quaternion 20 处、
  new Box3 23 处，方法调用 subTo 144 / addTo 109 / set 86 / dot 78 / vmult 73 /
  scaleNumberTo 65 / normalize 38 / clone 28 / crossTo 26 …
- 物理求解器**本来就需要原地运算与临时变量复用**（性能敏感），这属于"算法内部状态"，
  不是需要序列化/响应式的场景数据；
- 强行改用 `@feng3d/math` 纯函数 = 1500+ 处改写 + 物理正确性回归风险，**不划算**。

> 这条与 R3「纯数据声明式」不冲突：R3 判据取自 `scripts/gen-objectview-schema.mjs` 的 84 个
> **纯数据类名单**，物理内部向量不在其中；`scripts/check-math-no-class.mjs` 的扫描范围
> 也只有 packages/math/src。**但包内私有可变数学层必须写清理由**（本表就是理由）。

### 6.2 组件层适配（纯数据 + Logic 闭包工厂，issue #674 新范式）

原组件层是"class + 装饰器 + new"（@RegisterComponent / @oav / @serialize），
与新范式完全不兼容，**必须重写**（不是搬文件）：

| 原形态 | 新形态 |
|---|---|
| `@RegisterComponent() class BoxCollider extends Collider` | `interface BoxCollider { readonly __type__: 'BoxCollider'; readonly width?: number; ... }` + `boxColliderLogic(data)` 工厂（闭包对象字面量） |
| @oav() @serialize width = 1 | 纯数据接口 readonly width?: number，默认值由工厂补（§11.5） |
| init() { this._shape = new Box(...) } | Logic 内闭包惰性构造，经 `PhysicsBackend` 建 shape |
| update() { r.x = body.position.x } | Logic update(interval)，写 reactive(data)（§11.3） |
| `PhysicsWorld`.world = new World() | Logic 闭包持有 World，step 由 update 驱动 |
| functionwrap.extendFunction(Object3D, 'createPrimitive', ...) | **删除**（旧 monkey-patch 机制已不存在） |

注册：`registerLogic('BoxCollider', boxColliderLogic)` +
`registerComponentType('BoxCollider', { baseTypes: ['Collider'] })`。

### 6.3 需要处理的门禁适配面（实测）

| 门禁 | 适配面 |
|---|---|
| R2 check-module-side-effects / check-toplevel-new | cannon 有模块级 const tmp = new Vector3() 临时对象 → 全部改惰性初始化 |
| R6 `strictNullChecks` | 全部包已开启；**新包必须直接开 `strictNullChecks`** 并修完（cannon 源码未按 strict 写） |
| R10 覆盖率 | 迁移上游 QUnit 测试（cannon/tests/src/ 22 个文件）为 vitest，并实测全局阈值影响 |
| R1 分层 | 登记到 check-layer-deps.mjs / check-layer-direction.mjs 的对应层 |
| R9 包体 | 实测并把新包纳入基线 |
| R11 文档 | 本文件与相关文档同步 |

### 6.4 备选（更省，但放弃 feng3d 的 fork 定制）

引擎改用 npm 的 **`cannon-es`**（774 KB、自带 .d.ts），只把组件层重写迁入（约 800 行）。
**代价**：需要把 cannon 源码里 subTo/addTo/vmult/... 这套 feng3d 风格 API
改回 `cannon-es` 的 vadd/vsub/vmul/...（1500+ 处），且放弃 fork 的定制（EventEmitter 集成等）。
**收益**：不在仓里维护 10 608 行引擎代码。
> 这条留作对照项：若评审认为"1 人资源不该维护一份物理引擎源码"，应走这条而非 6.1。

### 6.5 编辑器侧适配（收回依赖后必须同步）

| 位置 | 现状 | 迁移后 |
|---|---|---|
| `packages/editor/package.json` | 依赖 `@feng3d-plugins/cannon` / `-plugin`（`*`） | 改依赖主仓包（`@feng3d/cannon` / `@feng3d/cannon-plugin`） |
| `packages/editor/vite.config.js` | externals 列外仓包名（3 处） | 改列主仓包名 |
| `packages/editor/src/vite-entry.ts` | cannon-plugin 挂载被注释（P0 停用） | 恢复挂载（新 API 兼容后） |
| `packages/editor/resource/template/index.html` | `<script src="libs/cannon.js">` 加载 UMD | 视形态决定：源码发布后不再需要 UMD |
| `resource/template/libs/cannon*.{js,d.ts}` | v0.6.0 的 UMD 产物与手抄 d.ts | 迁移后删除或改为生成 |
| `resource/template/default.scene.legacy.json` | 含 `"__class__": "PhysicsWorld"` | 旧格式场景，另行决定去留 |


---

## 7. 与 POSITIONING / ARCHITECTURE_V2 的关系（**需要战略确认**）

本仓当前战略层文档**明确把物理列为非目标**：

- `POSITIONING.md` §5「非目标」：
  > 实时游戏引擎（物理 / 寻路 / 音频混音 / 动画状态机 / 后处理全家桶）——
  > 每帧都在变，"零提交"无意义；且是 Babylon.js 的护城河
- `POSITIONING.md` §7：
  > **最大风险是扩散**：若开始补物理、导航、后处理全家桶，就会变成"什么都有一点"
- `ARCHITECTURE_V2.md` §1.3 / §3.1：
  > **不补**：物理 / 导航 / 音频混音 / Sprites / Flow Graph / 后处理全家桶

**本方案的立场（不擅自改定位）**：

- 物理以**可选上层扩展包**接入（`@feng3d/cannon` / `@feng3d/cannon-plugin`），
  与已存在的 particlesystem / terrain / ui 同一形态：**上层单向依赖 feng3d，
  feng3d 不依赖它**（R1 既有约定）。
- **不写进 feng3d 核心依赖、不改引擎定位、不碰"零提交"这条结构性优势**——
  物理只在用户显式挂载 `PhysicsWorld` 组件时才产生每帧开销，静态场景仍然零提交。
- 若要正式纳入定位，须**先改 POSITIONING §5 与 ARCHITECTURE_V2 §1.3**（本方案不代劳）。

---

## 8. 风险与后续

| 风险 | 影响 | 缓解 |
|---|---|---|
| 迁入 10 608 行引擎代码成为长期维护包袱 | 与"1 人资源"矛盾 | 走 §6.4 备选；或只迁组件层 + 用 `cannon-es` |
| 覆盖率门禁被新包拖穿 | CI 红 | §6.3：先迁 QUnit 测试并实测，再决定阈值是否随基线复测 |
| cannon 已停更 | 安全/功能欠账 | 中期换 Rapier（§5.3）；seam 保证组件层不动 |
| 物理组件让静态场景不再零提交 | 违背定位的结构性优势 | 物理只在挂载时生效；文档写明"零提交"前提是未挂载物理组件 |
| 与 packages/editor/resource/template/libs/cannon*.js 旧产物重复 | 认知混乱 | 迁移后决定旧产物去留（§6.2 的 monkey-patch 已失效） |

### 后续动作

1. ✅ **阶段一（PR #724，已合并）**：本文档（分析与判断）。
2. ✅ **阶段二（本 PR）**：`packages/cannon-plugin`——按 §6.4 选定路线落地：引擎依赖 npm `cannon-es@0.20.0`，
   组件层重写为纯数据接口 + Logic 闭包工厂（PhysicsWorld / Rigidbody / Box / Sphere / Plane / Cylinder 碰撞体），
   13 个单测覆盖「缺省值 → 形状创建 → 刚体形状收集 → 步进 → 位置写回」全链路。
   **实现期发现的一个坑**（已写进代码注释）：组件 init 发生在 owner 的 logic **构造期间**，
   注册表里此刻是占位对象，读 `getLogic(owner)` 的任何成员都会得到 `undefined`——
   所以 init 里必须读 raw 数据（`object3D.position` / `object3D.components`）。
3. ⬜ **阶段三**：编辑器侧收回依赖——`packages/editor/package.json` 改指主仓包、
   `vite.config.js` 的 externals、`vite-entry.ts` 恢复 cannon-plugin 挂载、模板 `libs/cannon*.{js,d.ts}` 去留。
4. ⬜ **阶段四（可选）**：`CapsuleCollider`（需 Trimesh + CapsuleGeometry）与 `Cloth`；
   以及把 `PhysicsBackend` seam 抽成公开接口（为 Rapier 留口）。

---

## 附录：本次实测来源

| 论断 | 来源（本次实测方式） |
|---|---|
| PlayCanvas 内置 ammo.js、`PhysicsWorld` seam、替代品表 | Invoke-WebRequest 抓 developer.playcanvas.com/user-manual/physics/ammo-alternatives/ |
| Babylon.js Physics V1/V2 目录与 migrateFromV1.md | GitHub API 列 BabylonJS/Documentation 的 content/features/featuresDeepDive/physics/{v1,v2} |
| three.js 官方物理示例三家与 CDN 路径 | GitHub API 列 mrdoob/three.js 的 examples/jsm/physics + 抓 raw.githubusercontent.com 源码前 22 行 |
| Unity 内置 PhysX / Box2D / Unity Physics / Havok | 抓 docs.unity3d.com/6000.4/Documentation/Manual/physics-integrations.html |
| npm 版本、发布时间、解包体积、类型字段 | registry.npmjs.org 直查（dist-tags.latest / time.modified / versions.<v>.dist.unpackedSize） |
| GitHub stars 与最后推送时间 | api.github.com/repos/<owner>/<repo> |
| cannon 源码规模与 API 用法统计 | 克隆 gitee.com/feng3d/cannon 后本地统计（47 文件 / 10 608 行 / 421 处 new Vector3 / 方法调用频次） |
| feng3d 约束（源码发布、覆盖率 include、R2 门禁） | 本仓 AGENTS.md §14、`vitest.config.ts`、scripts/check-*.mjs |
