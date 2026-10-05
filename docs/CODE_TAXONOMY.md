# Feng3D 代码三分类法与纯函数层（R13）

> 现状：✅ 分类口径已定，第 ② 类的机器门禁已落地（[check-pure-modules.mjs](../scripts/check-pure-modules.mjs) +
> [pure-modules.json](../scripts/pure-modules.json)，随根 `package.json` 的 `prelint:ci` 进 CI）。
> 🔶 第 ③ 类的**形态**正在从 class 迁移为工厂函数（issue #653），本文按**职责**而非形态定义它，
> 因此该迁移不会让本文过时。
>
> 关联：[AGENTS.md](../AGENTS.md) §2 / §3 / §8 / §11 / §15；
> [FRAMEWORK_DESIGN.md](../FRAMEWORK_DESIGN.md)（G1 数据即应用 / G2 最小计算 / G3 计算图）；
> [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) §2.1 分层蓝图 / §3.1 规范与执行者；
> [MATH_PURE_FUNCTIONS_MIGRATION.md](./MATH_PURE_FUNCTIONS_MIGRATION.md)（第 ② 类最大的落地案例）；
> [READONLY_SHAPES_MIGRATION.md](./READONLY_SHAPES_MIGRATION.md)（第 ① 类的只读口径）；
> [CI.md](./CI.md) §2.1（门禁登记）。

---

## 1. 结论：3 个主类 + 3 个附属角色

项目代码可以分成**三个主类**（数据流的三个环节）和**三个必须显式登记的附属角色**
（它们装不进主类，硬塞会制造"没有执行者"的夹缝）：

| # | 类 | 一句话职责 | 进 JSON |
|---|---|---|---|
| ① | **纯数据** | 状态的唯一载体 | ✅ **只有它** |
| ② | **纯计算函数** | 输入 → 输出，不碰任何外部世界 | — |
| ③ | **逻辑** | 把无行为的数据变成有行为的实体：派生、命令、编排 | ❌ 由数据重建 |
| ⓪ | **响应式运行时** | `reactive` / `computed` / `effect` 机制本身 | ❌ |
| ④ | **边界** | 全项目**唯一**允许副作用与可变性的地方 | ❌ |
| ⑤ | **类型层** | 只在编译期存在，运行时代码为零 | — |

三个主类正好构成一条闭环数据流：

```
        读 reactive(data)
   ③ 逻辑 ────────────────▶ ① 纯数据（状态）
      │                          ▲
      │ 调纯函数                  │ 返回新数据
      ▼                          │
   ② 纯计算函数 ─────────────────┘
      │
      │ 副作用只挂在 effect 上
      ▼
   ④ 边界（GPU / DOM / IO / 注册表）
```

**两个容易搞错的点**（本文的主要价值）：

1. **"响应式"不是第 ③ 类的定义特征**。它是第 ① 类数据的属性（§8.5 全 `readonly`、§8.3 `r_` 前缀）
   加上 **⓪ 这一层机制**。第 ③ 类的定义特征是"把无行为的数据变成有行为的实体"。
2. **分类单位是声明（declaration），不是文件**。AGENTS §4 要求纯数据接口与逻辑**合并到同一文件**
   （如 `Behaviour.ts` 同时含 `interface Behaviour` 与它的 Logic），所以"把项目所有**文件**分成三类"做不到，
   只有按语法单元分类才成立。

---

## 2. 三个主类

### ① 纯数据（Pure Data）

**定义**：可序列化、无方法、字段全 `readonly` 的值形状。

**判据（全部满足）**：

| 条件 | 说明 |
|---|---|
| 可序列化 | 只有 JSON 能表达的值；无函数、无 Symbol、无宿主对象 |
| 每字段 `readonly` | §11.1；会被响应式追踪的字段更是硬要求（§8.5） |
| 无方法 | 行为放第 ③ 类 |
| 具体子接口带 `__type__` 字面量 | §11.4；抽象基接口**不带** `__type__`、不直接构造 |
| 构造参数字段可选 | §11.5，默认值由第 ③ 类补 |
| 数组属性与数组都只读 | §11.6：`readonly T[]`，写侧另立 `WritableXxxLike` |

**形态与命名**：

| 用途 | 命名 | 例子 |
|---|---|---|
| 具体数据接口（带判别字段） | `Xxx` | [Vector3](../packages/math/src/geom/vector3.ts)、`CubeGeometry` |
| 只读的"最小形状" | `XxxLike` | `Vector3Like`、`FrustumLike` |
| 可写目标（只用于 `out` / 装配） | `WritableXxxLike` | [WritableVector3Like](../packages/math/src/geom/vector3.ts) |

**两个正式的例外**，都是"显式登记"而不是默认允许：

- **宿主锚点**（Host Anchors）：canvas 等无法序列化的叶子，允许作为数据里的叶子存在，
  以引用（元素 id）替代序列化——[FRAMEWORK_DESIGN.md §3.3](../FRAMEWORK_DESIGN.md)。锚点集合**封闭**，不做常规扩展手段。
- **常量 / 默认值 / 枚举**：不是"结构"而是"值"，同属本类，但不参与 `__type__` 分发、不被响应式追踪。

**明确的排除项**（"readonly 接口"≠"纯数据接口"，硬套会天天误报）：
`packages/webgpu` 的 WebGPU 描述符（§10：不要靠删 `readonly` 修，用 `TypeConvert.ts` 转换）、
`packages/addons` 的 GLTF / OBJ 解析中间类型、`packages/editor` 的 UI 类型。
它们在 [READONLY_SHAPES_MIGRATION.md §2.2](./READONLY_SHAPES_MIGRATION.md) 里被明确列为"只统计、不失败"。

**可机器执行的判据**：

| 判据 | 执行者 |
|---|---|
| 数组属性与数组都只读 | `scripts/check-readonly-array-fields.mjs`（§11.6 / issue #605，进 CI） |
| 不许 `new` 纯数据类 | `scripts/check-imperative-construction.mjs`（R3，基线已归零、新增即失败） |
| 字段 `readonly` 本身 | `tsc`（strict 已全包开启，R6） |

---

### ② 纯计算函数（Pure Functions）

**定义**：输入 → 输出，过程不修改输入、不触碰任何外部世界。

**判据（四条）**：

| 条件 | 说明 |
|---|---|
| **引用透明** | 同输入必同输出，与调用次数、顺序、时机无关 |
| **零副作用** | 不写 `console`*、不写 `globalThis`、不碰 GPU / DOM / IO |
| **入参只读且不改传递闭包** | TS 的 `readonly` 是浅层的，`a.b.c = x` 不会被类型挡住 |
| **模块不知道代理存在**（核心，见下） | 入参必须是干净的纯数据 |

**核心判据：模块不得依赖响应式运行时**

"输入必须是干净的纯数据"如果只写成函数签名约定，机器挡不住，因为：

1. 类型系统**区分不了**原始对象与 `reactive()` 代理——两者是同一种 `readonly` 形状；
2. reactivity **不提供**反制手段（§8.7 明确不支持 `markRaw` / `readonly` / `shallowReadonly`），运行时除了 `toRaw` 无从"洗代理"；
3. **`toRaw()` 本身来自 reactivity**——纯函数模块一旦 import 它，就等于承认"入参可能是代理"，
   那已经是第 ③ 类的活。

所以这条约束的正确落点是**模块边界**，而不是每个函数签名：

> **第 ② 类模块连 `toRaw()` 都不调用——它根本不知道"代理"这个概念存在。**
> 清洗动作（`toRaw`）由调用方在第 ③ 类的边界完成。

```ts
// ✗ 反例：纯函数模块里知道代理存在
import { toRaw } from '@feng3d/reactivity';
export function vec3Length(v: Vector3Like): number
{
    const raw = toRaw(v as object) as Vector3Like;   // ← 这一行就是违规信号
    return Math.sqrt(raw.x * raw.x + raw.y * raw.y + raw.z * raw.z);
}

// ✓ 纯函数层：零 reactivity 依赖，直接算
export function vec3Length(v: Vector3Like): number
{
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

// ✓ 第 ③ 类逻辑：清洗在边界完成
const r_object3D = reactive(object3D);
const s_radius = computed(() =>
{
    const raw = toRaw(r_object3D);        // 代理 → 原始对象只发生在这一侧
    return vec3Length(raw.position!);
});
```

这条不是新增约束，而是 **R1 在 Layer 0 上的推论**：`@feng3d/math` 与 `@feng3d/reactivity`
同属 Layer 0，而 R1 的铁律是"同层之间不得互相依赖"。

**入参 / 出参的读写信封**（math 的既定口径）：

- **入参**一律 `XxxLike`（只读形状）；
- **`out` 参数**允许 `WritableXxxLike`——它是**输出**不是输入，且函数承诺不读它；
- **返回值**必须是原始对象（新建的），不得返回代理、也不得返回内部可变结构的引用。

**与 `computed` 的分界**（最常归错的一处）：
`computed` 的 getter 可以是纯的，但 `computed` **节点本身**有身份、缓存、依赖与版本号——
它是响应式图里的节点，属于第 ③ 类。判别口诀：**读了响应式代理 / 建立了依赖的，就不是第 ② 类**。

**引用透明的两个显式例外**（现状，有意保留）：

- **随机 / 时间函数**：math 有意保留 `Math.random()`（见 `plane.ts` / `euler.ts` / `matrix4x4.ts`
  的 `*Random`，为与旧 class 行为逐字一致），属"非确定性纯函数"；
- **诊断输出**：`console.error`（如 `matrix4x4.ts` 的"无法获取逆矩阵"）是 math 存量，
  与旧实现的报错路径逐字一致。

两者都**不在 R13 判据内**——R13 只拦"依赖响应式与上层包"，不拦随机与诊断。

**可机器执行的判据**：

| 判据 | 执行者 |
|---|---|
| 不依赖 `@feng3d/reactivity` 与上层包 | `scripts/check-pure-modules.mjs`（**R13**，进 CI；清单 `scripts/pure-modules.json`） |
| 入参只读 / `out` 可写 | `tsc`（`XxxLike` vs `WritableXxxLike`） |
| 传参前清洗代理 | R4 规则 `feng3d/no-reactive-argument` + §8.6（**责任在调用方**） |

---

### ③ 逻辑（Logic）

**定义**：把无行为的数据变成有行为的实体——派生（computed）、命令（方法）、编排（谁在何时读谁）。
**按职责定义，不绑形态**。

> **形态现状**：以 class 为主（实测 **98 个 `export class XxxLogic`**），当前正在迁移为工厂函数
> （issue #653 / PR #656 让 `registerLogic` 只接受工厂函数）。无论 class 还是函数，
> 判据都是下面几条职责，因此本文不随迁移改口径。

**判据**：

| 判据 | 说明 |
|---|---|
| **唯一入口** | 只能经 `logic(data)` 获取，WeakMap 按原始对象缓存；注册用 `registerLogic` |
| **对外只读** | 字段一律 `readonly` getter / computed，不暴露 setter 与可写字段（§11.2） |
| **写数据经代理** | 改的是 `reactive(data).field = v`，不是 Logic 实例（§11.3） |
| **副作用有边界** | effect 只允许按白名单使用，且必须有注解（R5） |
| **不序列化** | Logic 实例、computed 缓存都不进 JSON（[FRAMEWORK_DESIGN.md §3.5](../FRAMEWORK_DESIGN.md)） |

**两个物种，约束不同，不要混写**：

| 物种 | 是什么 | 例子 | 约束 |
|---|---|---|---|
| **Entity-Logic** | 与某个数据 1:1，`logic(data)` 取得，注册在 `LogicMap` | 98 个 `XxxLogic` | AGENTS §11 全套 |
| **System / Service** | 跨对象、无对应数据、生命周期由 View 驱动 | `Renderer`、`View.submit`、`submitComputed`、`LookAtController` | 允许持有状态与更多 effect，是"编排器"而非"数据的行为" |

**可机器执行的判据**：

| 判据 | 执行者 |
|---|---|
| 响应式纪律（命名 / 不导出 / 不传参 / effect 注解） | R4 四条 eslint 规则（随 `lint:ci`） |
| effect 使用点与清单一致 | R5 `scripts/check-effect-inventory.mjs`（进 CI） |
| 可空性显式（`logic()` 可返回 `null`） | R6 `check-strict-dirs.mjs` + `check-strict-packages.mjs` |

---

## 3. 三个附属角色

它们装不进主类，但必须显式登记——否则会变成"谁都没管"的夹缝。

### ⓪ 响应式运行时（Reactivity Runtime）

**是什么**：`reactive` / `computed` / `effect` / `ref` / `batchRun` / `track` 的**机制实现**本身
（[packages/reactivity](../packages/reactivity/src/index.ts)）。

**为什么装不进主类**：它不是业务代码，也不能要求它"纯"——`effect` 的实现天然有全局依赖图与副作用。
它是让 ① 能驱动 ③ 的**引擎**，本身不受三分类约束。

**现状标记**：`EFFECT_INVENTORY.md` 里的「**框架内部**」类目就是它
（[`reactivity/src/ReactiveObject.ts`](../EFFECT_INVENTORY.md)、`webgpu/src/ReactiveObject.ts`）。

### ④ 边界（Boundary / Bridge）

**是什么**：命令式世界 ↔ 响应式世界的**唯一桥**。项目文档里的说法是
"异步完成的写入与用户改 position 在响应式系统眼中完全等价"
（[FRAMEWORK_DESIGN.md §3.2.1](../FRAMEWORK_DESIGN.md)）。

**内容**：`TypeConvert.ts`（§10）、`toRaw` 清洗、`Writable*Like` 断言、`registerLogic` / `setAssetTypeClass`
等注册表、GPU 资源缓存与回收、asset loader / fetch、DOM 事件与定时器。

**核心规则**：

> **副作用与可变性只允许出现在这里**。
> 每一个"不得不可变 / 不得不有副作用"的位置，都必须能指认到本类并给出理由。

**现状标记**：`EFFECT_INVENTORY.md` 的「**边界**」类目（音频外设同步、DOM 指针同步、
资源就绪通知、GPU 缓冲写入等），以及 R2 的 `ENTRY_FILES` / 模块级单例冻结基线。

### ⑤ 类型层（Type Layer）

**是什么**：只在编译期存在的工具——泛型映射类型（`UnReadonly<T>`、`DeepReadonly<T>`）、
`declare module` 扩展（如 [`LogicMap`](../packages/reactivity/src/logic.ts)）、条件类型、重载签名。

**为什么装不进主类**：运行时代码为零，既不是数据也不是计算也不是逻辑。

---

## 4. 四条交叉不变量

分类只是"贴标签"，能不能守住靠的是类与类之间的**方向约束**。这四条比分类本身更值钱：

1. **唯一写入口**：改数据只能 `reactive(raw).field = v`；`readonly` 接口与 Logic 都不许开 setter（§11.2 / §11.3）。
2. **单向依赖**：① 不 import ②③；② 不 import ③；③ 可 import ①②④。对应 R1"依赖只向下"，
   且 **G3 要求"数据只向下流"**——任何模块不得改写其他模块的输出。
3. **副作用只在边界**：② 内绝不出现副作用；③ 内的副作用必须挂在 `effect` 上并进白名单（R5）。
4. **序列化等价**：① 之外的一切（Logic 实例、computed 缓存、GPU 资源）都不进 JSON；
   反过来，**任何无法进入 JSON 的运行态都必须是显式声明的锚点**，否则就是设计缺陷。

---

## 5. 判定决策树

```
这段代码在运行时会不会带来"数据之外的东西"？
（GPU / DOM / IO / 定时器 / 事件 / 全局注册）
├─ 会 ──▶ ④ 边界
│         └─ 若是"某数据的 1:1 行为"，写在它的逻辑里，但副作用隔离到 effect；否则独立成 System
└─ 不会 ─▶ 它只描述"一个值长什么样"吗？（可序列化 + 无方法 + 字段只读）
          ├─ 是 ──▶ ① 纯数据
          │         ├─ 带 __type__ 吗？带 = 具体数据接口，不带 = 最小形状 XxxLike
          │         └─ 是"值"而非"结构"吗？是 = 常量 / 默认值 / 枚举
          └─ 否 ─▶ 它读响应式代理 / 建立依赖 / 持有跨调用状态吗？
                   ├─ 不读 ──▶ ② 纯计算函数（注意 out 型变体）
                   └─ 读 ───▶ ③ 逻辑
```

---

## 6. 执行者对照（R13 的落点）

| 类 | 规范编号 | 执行者 | 进 CI |
|---|---|---|---|
| ① 纯数据 | §11.6 / R3 / R6 | `check-readonly-array-fields.mjs`、`check-imperative-construction.mjs`、`tsc` | ✅ |
| ② 纯计算函数 | **R13** | `check-pure-modules.mjs` + `scripts/pure-modules.json` | ✅（`prelint:ci`） |
| ③ 逻辑 | R4 / R5 / R6 | 4 条 eslint 规则、`check-effect-inventory.mjs`、strict 三层 | ✅ |
| ⓪ 响应式运行时 | —— | 不受三分类约束（框架内部） | — |
| ④ 边界 | R2 / §10 | `check-module-side-effects.mjs --strict`、`check-toplevel-new.mjs`、`TypeConvert.ts` 约定 | ✅ / 🔶 |
| ⑤ 类型层 | R6 | `tsc` | ✅ |

**R13 的判据**（`check-pure-modules.mjs`）：

- 清单 `scripts/pure-modules.json` 显式登记纯函数模块（包目录或单文件），每项**必须写理由**；
- 禁止的模块说明符写在清单的 `forbidden` 里（`@feng3d/reactivity` 为首）；
- 检查位置：静态 `import` / `export ... from` / `import x = require('...')` / 动态 `import('...')` / `require('...')`；
- **反向校验**：登记项必须存在、且其下至少 1 个 `.ts`——清单不会悄悄腐化；
- 命令：`node scripts/check-pure-modules.mjs`（校验）、`--stats`（打印登记项与扫描面）。

初版清单 **2 项 / 64 个 `.ts`**：

| 登记项 | 理由 |
|---|---|
| `packages/math` | Layer 0 纯数值 / 几何运算层，19 个 class 已全部去 class 化（585 个导出函数） |
| `packages/feng3d/src/core/eyeRelative.ts` | 眼相对变换纯函数（issue #99），只依赖 `@feng3d/math` |

---

## 7. 已知局限（如实写下，不假装彻底）

| 局限 | 说明 |
|---|---|
| **漏登记无法自动发现** | "一个模块该不该是纯函数"没有客观状态可推断（不像 R6 的 strict 开关写在 `tsconfig.json` 里）。新增纯函数模块必须**手工登记**，补强只能靠 code review |
| **值级污染类型系统看不见** | 代理经变量传递后，`fn(proxy)` 与 `fn(raw)` 编译结果一样。责任闭环：纯函数层靠"不 import reactivity"自证，调用方靠 §8.6 + `no-reactive-argument` 保证 |
| **高阶回调是暗门** | `sort(cmp)` / `forEach(fn)` 这类若回调内部读代理，纯函数被间接污染，静态判据查不到。约定位：纯函数层不接收回调，或要求纯回调 |
| **随机 / 时间不进判据** | `Math.random()` 等是 math 的**有意现状**（与旧 class 逐字一致），强行禁止会误伤合法的 `*Random` 工具函数 |
| **分类单位是声明不是文件** | §4 要求数据与逻辑同文件，所以门禁只能按声明判定；"文件级分类"与既有规范冲突 |

---

## 8. 与其他文档的分工

| 文档 | 回答什么 |
|---|---|
| **本文** | 代码分几类、每类的判据、类之间的方向约束、每类的执行者 |
| [AGENTS.md](../AGENTS.md) §11 | 纯数据接口与逻辑的**具体写法**（可选字段补默认、数组只读、基接口不构造……） |
| [AGENTS.md](../AGENTS.md) §15 / [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) §3.1 | R1–R13 **规范与执行者**的权威状态表 |
| [FRAMEWORK_DESIGN.md](../FRAMEWORK_DESIGN.md) | **目标架构**（G1 数据即应用 / G2 最小计算 / G3 计算图 / 单 JSON 模型） |
| [MATH_PURE_FUNCTIONS_MIGRATION.md](./MATH_PURE_FUNCTIONS_MIGRATION.md) | 第 ② 类的**最大落地案例**（math 去 class 化全流程） |
| [CI.md](./CI.md) §2.1 | 每条门禁**在 quality job 的哪一步跑、跑什么命令** |
