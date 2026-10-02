# math 去 class 化：纯数据 + 纯函数迁移方案

> 本文是 issue #134 的完整纲领（其「第一步」已落地，见 §2.4）。目标态：`@feng3d/math` 内
> 不再有数值 / 几何 **class**，只有 `{ x, y, z }` 这类纯数据定义 + 一组纯函数；
> 终点是 §7 的**阶段 C**（删除 class 并把「禁止 class 数值类型」变成机器门禁）。
>
> 关联：[ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md)（R1 分层 / R3 纯数据声明式 / R10 覆盖率）、
> [SERIALIZATION_MIGRATION.md](./SERIALIZATION_MIGRATION.md)（**本方案推翻其 §2 的一条例外**，见 §2.3）、
> [../AGENTS.md](../AGENTS.md)（§8 响应式纪律、§11 纯数据与 Logic 分层、§15 R1–R12）。

## 1. 为什么做

### 1.1 主仓数据层早就是纯数据，math 是仅剩的例外

`Object3D` 的变换字段声明就是裸三元组，没有 `Vector3`：

```ts
// packages/feng3d/src/core/Object3D.ts:74,81,86
readonly position?: { readonly x: number; readonly y: number; readonly z: number };
readonly rotation?: { readonly x: number; readonly y: number; readonly z: number };
readonly scale?: { readonly x: number; readonly y: number; readonly z: number };
```

场景资源里也是纯数据字面量（[Container3DTest.ts:21](../examples/src/base/Container3DTest.ts)）：

```ts
position: { x: 0, y: 1, z: 10 },
```

序列化、编辑器两侧都已跟上：

| 环节 | 现状 | 证据 |
|---|---|---|
| 反序列化 | 已有「只带 `__type__`、不带 `__class__`」的纯数据分支 | [Serialization.ts:1207](../packages/serialization/src/Serialization.ts) |
| 编辑器控件 | `control: 'Vector3'` 同时匹配 class **与**结构类型 `{ readonly x; y; z }` | [dataTypeSchema.ts:287](../packages/editor/src/vue-app/objectview/generated/dataTypeSchema.ts) |
| R3 门禁 | 现有脚本**明确豁免** `@feng3d/math` 的同名 class 与 `packages/math` 包内 | [check-imperative-construction.mjs](../scripts/check-imperative-construction.mjs) |

结论：**数据层已经是「纯数据 + 行为分离」，math 的 class 现在只服务于「运算」**。
所以本方案不是引入新范式，而是把 math 里残留的范式与主仓对齐。

### 1.2 收益

1. **一致性**：数据一律是字面量，运算一律是函数，「数据驱动」不再在 math 处断链；
2. **依赖收紧（A1 已落地）**：math 不再依赖 `@feng3d/serialization`——13 个文件的 `@serialize` 与依赖声明一并移除，实测无消费方需要它（§5.6）；
3. **门禁可补强**：`Color3`/`Color4` 的 R3 豁免可以删除，并以「math 包内禁止 `export class`」补上其余数值类型——注意 R3 名单**本来就不含** `Vector3` 等（§5.9），所以豁免的收回与 `new Vector3()` 能否被拦下是两件事；
4. **可序列化 + 可 diff**：纯数据直接进 JSON，`__class__` 依赖消失，配合 S1 分支零改动往返；
5. **tree-shaking**：函数按需引入，不再为用一个 `dot` 拉进整个 1412 行的 `Vector3`（`sideEffects: false` 下 class 的静态常量初始化仍是模块级副作用面）；
6. **消歧**：`Vector3` 内部积累了 Unity 风格的大写静态版与小写实例版**两套同义 API**（§4 表格的「同义合并」列），纯函数层是收敛它们的机会。

## 2. 现状盘点

### 2.1 `src/math` 是停滞快照，不在任何门禁内（先别改错地方）

| 位置 | 状态 |
|---|---|
| [../src/math](../src/math) | 59 个文件仍被 git 追踪，最后一次提交 `282fab91e`（2026-04-06）。**不在根 `workspaces` 里**，不被 `lint`（只覆盖 `packages/` + `scripts/` + `test/`）、类型检查、构建、CI 覆盖 |
| [../packages/math](../packages/math) | 生效的 `@feng3d/math`：64 个源文件 / 14480 行 / 43 个测试文件，最后提交 `55f9a01cb`（2026-10-02） |

> **本方案的一切改动都落在 `packages/math`**。改 `src/math` 没有任何运行时效果，
> 只会让这个死快照继续膨胀——它本身值得单独处理（删除或明确标记为历史），但不属于本方案范围。

### 2.2 math 对外被当作「数据字段类型」使用的位置

这些地方把 class 当**数据字段类型**，删 class 时必须一并改，否则类型不成立：

| 位置 | 用法 |
|---|---|
| [MD5Anim.ts:73](../packages/feng3d/src/assets/MD5Anim.ts) | `readonly position: Vector3` |
| [MD5Mesh.ts:24](../packages/feng3d/src/assets/MD5Mesh.ts) | `readonly position: Vector3` |
| [Box3.ts:44](../packages/math/src/geom/Box3.ts) | `min: Vector3` / `max: Vector3` |
| [Segment3.ts:42](../packages/math/src/geom/Segment3.ts) | `p0: Vector3` / `p1: Vector3` |

### 2.3 本方案要推翻的既有决定（三处，必须同步改文档）

[SERIALIZATION_MIGRATION.md](./SERIALIZATION_MIGRATION.md) 当初有意把 math 留作例外：

| 位置 | 原文 | 本方案的处理 |
|---|---|---|
| `SERIALIZATION_MIGRATION.md` §2 | 「**构造器仅保留给数值容器**（`Vector3` / `Matrix4x4` / `Color4` 等 `@feng3d/math` 类）」 | 改为：数值容器同样纯数据化，`classUtils` 不再有任何数值类型消费者 |
| 同文 §4 S1 | 「数值容器（`Color4` / `Vector3`）仍走原有分支」 | 阶段 C 后该分支只剩「旧资源 `__class__` 回落」一个用途 |
| 同文 §6 风险表 | 「`__type__` 识别过宽，把 `Color4` 等数值容器也当 plain object」 | 风险消失：数值容器**就是** plain object，不需要更高优先级的例外分支 |

> 阶段 C 落地时，以上三处与 [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) §3.1 的 R3 行必须同一批提交更新（AGENTS §14 文档同步）。

### 2.4 已落地的先例：#134 第一步（Color3）

[color3Ops.ts](../packages/math/src/color/color3Ops.ts) 已经确立了本方案要沿用的三条规则：

1. 纯函数放**独立文件**（`color/color3Ops.ts`），**不 import 其他 math 类型**，因此不进 math 内部依赖图、不受分层约束。
   （`color3Ops.ts` 恰好零 import；`vector3Ops.ts` 需要 `mathUtil.PRECISION` / `equals` / `clamp`，
   允许 import `@feng3d/polyfill`——那是 math 的既有依赖，不引入新的分层关系；
   跨类型函数用 **type-only import** 引对方的数据接口，运行时无环）；
2. 入参用最小结构类型 `Color3Like`（`readonly`），需要写回时用 `WritableColor3Like`；
3. class 的同名方法体改成**委托调用**，行为逐字不变：

```ts
// packages/math/src/Color3.ts:114
mix(color: Color3, rate: number)
{
    // 就地混入委托给纯函数（out 传 this，行为逐字不变）
    color3Mix(this, color, rate, this);

    return this;
}
```

这条路径已被测试网锁住（[color3.spec.ts](../packages/math/test/color3.spec.ts)），是本方案「阶段 A 零调用点改动」的可行性证据。

## 3. 目标形态

### 3.1 数据定义与运算函数

数据定义、常量与纯函数**放在同一个文件**里——与既有的 `src/color/color3Ops.ts` 同构：

```ts
// packages/math/src/geom/vector3Ops.ts —— Like 类型 + 常量 + 纯函数
export interface Vector3Like          // 阶段 A 里 type-only 取自 ./Vector3，阶段 C 转为本地定义
{
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

/** 需要写回的目标形状（class 实例与普通字面量都满足） */
export interface WritableVector3Like
{
    x: number;
    y: number;
    z: number;
}

/** 原点常量：冻结后不可扩展，响应式系统不会对它建代理（AGENTS §8.7） */
export const VEC3_ZERO: Vector3Like = Object.freeze({ x: 0, y: 0, z: 0 });

export function vec3Add(a: Vector3Like, b: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x + b.x;
    out.y = a.y + b.y;
    out.z = a.z + b.z;

    return out;
}
```

> ⚠️ **不要**把数据定义单独放进 `vector3.ts`：在 Windows / macOS 这类大小写不敏感的文件系统上，
> 它与 `Vector3.ts` 是**同一个文件**，写入会直接覆盖 class（实施 A1 时踩到过，见 §10.1 的 P1）。

### 3.2 命名约定：紧凑类型前缀 + PascalCase 动作

沿用 `color3Mix` 已确立的规则（`color3` 是 `Color3` 的紧凑名）：

| 类型 | 前缀 | 示例 |
|---|---|---|
| `Vector2` / `Vector3` / `Vector4` | `vec2` / `vec3` / `vec4` | `vec3Add`、`vec4Dot` |
| `Quaternion` | `quat` | `quatSlerp`、`quatToMatrix4x4` |
| `Matrix3x3` / `Matrix4x4` | `mat3` / `mat4` | `mat4Multiply`、`mat4Invert` |
| `Color3` / `Color4` | `color3` / `color4` | `color3Mix`（已存在） |
| `Box3` / `Ray3` / `Segment3` / `Triangle3` | `box3` / `ray3` / `seg3` / `tri3` | `box3ContainsPoint` |
| `Plane` / `Frustum` / `Rectangle` / `Sphere` / `Euler` / `Line3` | `plane` / `frustum` / `rect` / `sphere` / `euler` / `line3` | `planeDistanceToPoint` |

规则：**前缀取紧凑类型名（全小写），动作取 PascalCase，前缀与动作之间不加下划线**。
`Matrix4x4` 用 `mat4` 而不是 `matrix4x4`，是本表唯一有意的缩写（`matrix4x4Multiply` 过长且难读）。

### 3.3 `out` 参数：class 的 `xxx` / `xxxTo` 方法对合并为**同一个函数**

这是本方案能压缩工作量的关键：class 上的 `add(v)`（就地改 `this`）与 `addTo(v, vout)`（写入 `vout`）
在纯函数层是**同一个函数**，只是 `out` 实参不同：

| class 调用 | 纯函数调用 |
|---|---|
| `a.add(b)` | `vec3Add(a, b, a)` |
| `a.addTo(b, out)` | `vec3Add(a, b, out)` |
| `a.addTo(b)`（缺省新建） | `vec3Add(a, b)` |

约定：

1. **纯函数一律不修改入参**（`a` / `b` 只读），结果只写 `out`；
2. `out` 缺省值为新建字面量（`{ x: 0, y: 0, z: 0 }`），所以「返回新对象」是免费的能力；
3. 因此**纯函数总数约为原方法数的一半**，`xxxTo` 系列不需要独立函数。

### 3.4 只读性与响应式

- 入参形状（`XxxLike`）字段一律 `readonly`（AGENTS §8.5）；
- 写回形状（`WritableXxxLike`）字段可写，仅用于 `out`；
- 纯函数层**不返回响应式代理**，也不接受代理参数（AGENTS §8.1/8.6）；
- 数据修改仍走 `reactive(data).field = value`，函数只负责算。

### 3.5 纯函数层不读全局状态

class 的 `Vector3.SmoothDamp` 默认读 `Time.deltaTime`（见 [Vector3.ts](../packages/math/src/geom/Vector3.ts) 的 `SmoothDamp2`）。
纯函数层**不接受隐式时间源**：`deltaTime` 一律显式传参，由调用方（Logic）从数据里取。
这既满足纯函数定义，也消除 math → Time 的隐式耦合。

## 4. Vector3 迁移映射表（示范全量，其余类型同构）

「同义合并」列指 class 里语义重复、纯函数层只保留**一个**的成员。

| class 成员 | 纯函数 | 备注 |
|---|---|---|
| `new Vector3(x, y, z)` | `{ x, y, z }` | 字面量 |
| `set(x, y, z)` | `vec3From(x, y, z, out?)` | |
| `setZero()` | `vec3SetZero(out)` | 就地语义 |
| `fromArray(arr, off)` | `vec3FromArray(arr, off, out?)` | |
| `toArray(arr, off)` | `vec3ToArray(a, arr?, off?)` | |
| `copy(v)` / `clone()` | `vec3Copy(a, out?)` | `clone()` = `vec3Copy(a)` |
| `fromVector2(v, z)` / `toVector2(v?)` | `vec2ToVec3` / `vec3ToVec2` | 跨类型函数 |
| `toVector4(v4)` | `vec3ToVec4` | 跨类型函数 |
| `add(v)` / `addTo(v, out)` | `vec3Add(a, b, out?)` | 见 §3.3 |
| `sub(a)` / `subTo(v, out)` | `vec3Sub(a, b, out?)` | |
| `multiply(v)` / `multiplyTo(v, out)` | `vec3Multiply(a, b, out?)` | 分量乘 |
| `divide(a)` / `divideTo(a, out)` | `vec3Divide(a, b, out?)` | |
| `equals(v, precision?)` | `vec3Equals(a, b, precision?)` | 返回标量，无 `out` |
| `distance(p)` / `distanceSquared(p)` | `vec3Distance(a, b)` / `vec3DistanceSquared(a, b)` | |
| `dot(a)` | `vec3Dot(a, b)` | 同义：`Vector3.Dot(a, b)` |
| `cross(a)` / `crossTo(a, out)` | `vec3Cross(a, b, out?)` | 同义：`Vector3.Cross(a, b)` |
| `length` / `magnitude` | `vec3Length(a)` | 同义三处 |
| `lengthSquared` / `sqrMagnitude` | `vec3LengthSquared(a)` | 同义三处 |
| `normalized` / `static Normalize(v)` | `vec3Normalized(a, out?)` | 带 `kEpsilon` 判断 |
| `Normalize()` | `vec3Normalize(a, out?)` | 就地语义 = `out` 传 `a` |
| `normalize(thickness?)` | `vec3NormalizeThickness(a, thickness?, out?)` | **与上面语义不同**：无 epsilon 判断、零长度置零而非置 `(1,0,0)` |
| `unit(target?)` | `vec3Unit(a, out?)` | 零长度返回 `(1,0,0)`，与 `normalized` 不同 |
| `negate()` / `negateTo(out)` | `vec3Negate(a, out?)` | |
| `inverse()` / `inverseTo(out)` | `vec3Inverse(a, out?)` | 分量取倒数 |
| `addNumber(n)` / `addNumberTo(n, out)` | `vec3AddNumber(a, n, out?)` | |
| `subNumber(n)` / `subNumberTo(n, out)` | `vec3SubNumber(a, n, out?)` | |
| `multiplyNumber(n)` / `multiplyNumberTo(n, out)` | `vec3ScaleNumber(a, n, out?)` | 同义：`scaleNumber` 系列 |
| `divideNumber(n)` / `divideNumberTo(n, out)` | `vec3DivideNumber(a, n, out?)` | |
| `scale(s)` / `scaleTo(s, out)` | `vec3Scale(a, b, out?)` | 同义：`Vector3.Scale(a, b)` |
| `scaleNumber(s)` / `scaleNumberTo(s, out)` | `vec3ScaleNumber(a, n, out?)` | 与 `multiplyNumber` 合并 |
| `addScaledVector(s, v)` / `addScaledVectorTo(s, v, out)` | `vec3AddScaled(a, s, b, out?)` | |
| `lerp(v, alphaVec)` / `lerpTo` | `vec3Lerp(a, b, alphaVec, out?)` | 分量插值 |
| `lerpNumber(v, alpha)` / `lerpNumberTo` | `vec3LerpNumber(a, b, t, out?)` | 同义：`Vector3.Lerp`（后者多一次 `Clamp01`） |
| `Vector3.LerpUnclamped(a, b, t)` | `vec3LerpNumber(a, b, t, out?)` | 无 clamp |
| `Vector3.MoveTowards(cur, tgt, d)` | `vec3MoveTowards(a, b, maxDelta, out?)` | |
| `Vector3.SmoothDamp*` | `vec3SmoothDamp(...)` | **多输出**，见 §5.2 |
| `min(v)` / `max(v)` | `vec3Min(a, b, out?)` / `vec3Max(a, b, out?)` | 同义：`Vector3.Min/Max(a, b)`（静态版返回新对象） |
| `clamp(min, max)` / `clampTo(min, max, out)` | `vec3Clamp(a, min, max, out?)` | |
| `floor()` / `ceil()` / `round()` / `roundToZero()` | `vec3Floor/Ceil/Round/RoundToZero(a, out?)` | |
| `less/lessequal/greater/greaterequal(p)` | `vec3Less/LessEqual/…(a, b)` | 返回布尔，无 `out` |
| `isZero()` / `almostZero(precision?)` | `vec3IsZero(a)` / `vec3AlmostZero(a, precision?)` | |
| `isParallel(v, precision?)` / `isAntiparallelTo(v, precision?)` | `vec3IsParallel(a, b, precision?)` / `vec3IsAntiparallel(a, b, precision?)` | |
| `reflect(normal)` | `vec3Reflect(a, normal, out?)` | 同义：`Vector3.Reflect` |
| `Vector3.Project(v, n)` / `ProjectOnPlane(v, n)` | `vec3Project(a, n, out?)` / `vec3ProjectOnPlane(a, n, out?)` | |
| `Vector3.Angle(a, b)` / `SignedAngle(a, b, axis)` | `vec3Angle(a, b)` / `vec3SignedAngle(a, b, axis)` | |
| `Vector3.ClampMagnitude(v, len)` | `vec3ClampMagnitude(a, maxLength, out?)` | |
| `crossmat(outMatrix)` | `vec3ToCrossMatrix(a, out)` | |
| `applyQuaternion(q)` | `vec3ApplyQuaternion(a, q, out?)` | 跨类型 |
| `applyMatrix4x4(m)` | `vec3ApplyMatrix4x4(a, m, out?)` | 跨类型 |
| `tangents(t1, t2)` | `vec3Tangents(a, t1, t2)` | **多输出**，见 §5.2 |
| `random(size?, double?)` | `vec3Random(size?, double?, out?)` | 同义：`static random` |
| `toString()` / `toHexString()` 类 | `vec3ToString(a)` | |
| `Vector3.ZERO/ONE/X_AXIS/…`、`zero/up/forward/…` | `VEC3_ZERO` / `VEC3_UP` / … | 冻结常量，见 §5.3 |
| `kEpsilon` / `kEpsilonNormalSqrt` | `VEC3_EPSILON` / `VEC3_EPSILON_NORMAL_SQRT` | 常量 |
| `@serialize` 装饰的 `x/y/z` | 无（由 schema 生成器从类型推导） | 见 §5.7 |

## 5. 关键约束与设计决策

### 5.1 就地语义必须靠 `out` 保留，否则是静默改语义

class 的运算绝大多数**原地修改 `this`**，调用方依赖这一点。最典型的是链式就地写：

```ts
// packages/math/src/geom/Segment3.ts:95
const newPoint: Vector3 = pout.copy(this.p0).add(this.p1.subTo(this.p0).scaleNumber(position));
```

`copy` / `add` / `subTo` / `scaleNumber` 四步都在写对象。若纯函数改成「返回新对象」，
这段代码会**编译通过但结果错误**（`pout` 不再被填值）。

**决策**：纯函数**只写 `out`**，调用点显式传 `out`（就地传自己，新建则省略）。这是阶段 B 的机械规则，也是 review 的检查点。

### 5.2 隐式多输出必须显式化

两个成员有**不止一个输出**：

| 成员 | 隐式输出 | 处理 |
|---|---|---|
| `Vector3.SmoothDamp2` | 同时改写 `target` 与 `currentVelocity` 两个入参 | 返回 `{ position, velocity }`，或 `vec3SmoothDamp(current, target, velocity, smoothTime, maxSpeed, deltaTime, outPosition?, outVelocity?)` |
| `tangents(t1, t2)` | 通过两个入参回填 | `vec3Tangents(a, t1, t2)`（两个 `out` 是必需参数，不设缺省） |

`SmoothDamp` 系列还默认读 `Time.deltaTime`，按 §3.5 改为显式传参。

### 5.3 冻结常量与响应式

class 上的轴常量是 `Object.freeze(new Vector3(...))`（见 [Vector3.ts](../packages/math/src/geom/Vector3.ts) 末尾的静态常量区）。
改成冻结字面量后语义不变，但要守两条：

1. 响应式系统「只有 `Object.isExtensible` 不通过的对象才不响应化」（AGENTS §8.7）——冻结常量**本来就不会**被代理，行为与现状一致；
2. 冻结对象在严格模式下**赋值抛 `TypeError`**。现有代码里已有把冻结常量当返回值的情形：

```ts
// packages/math/src/geom/Vector3.ts 的 Project —— 退化分支返回共享的冻结对象
static Project(vector: Vector3, onNormal: Vector3)
{
    if (sqrMag < Mathf.Epsilon) { return Vector3.zero; }
    ...
}
```

`Project` / `ProjectOnPlane`（后者返回**入参本身**）都有「返回共享对象」的行为。
迁移时逐处确认调用方是否修改返回值：**修改了就是既有缺陷**（现在就会抛错或静默失败），
应在本方案中一并定为「返回新建 `out`」并记录为行为变更。

### 5.4 热路径零分配

仓库有 `perf/100-zero-alloc` 历史分支，说明分配是关注点。
`Matrix4x4`（52KB 源文件）内部以 `elements` 就地重写，纯函数化**必须**保留 `out`/`*To` 能力，
禁止把「每个运算都新建对象」写进渲染热路径。

**决策**：`out` 参数是**契约的一部分**，不是可选优化。评审时「该函数是否可零分配」列入检查项。

### 5.5 class 互调必须整批处理（阶段 A 内部再分三步）

`Vector3 ↔ Matrix4x4 ↔ Quaternion ↔ Matrix3x3` 互相调用（`applyMatrix4x4` → `transformPoint3`、
`crossmat` → `Matrix3x3`）。**只改 Vector3 会留下两套风格**，而跨类型纯函数需要对方的数据定义，
在对方还没纯函数化时只能重复实现——所以阶段 A 内部再分三步：

| 步 | 内容 |
|---|---|
| A1 | 各类型的**自身运算**（只涉及自己 + 标量）：`vec3Add`、`vec3Cross`、`vec3Length`、`vec3Lerp` … |
| A2 | 其余类型的数据定义 + 自身运算补齐（`Quaternion` / `Matrix3x3` / `Matrix4x4` / `Color4` …） |
| A3 | **跨类型函数补齐**（`vec3ApplyMatrix4x4`、`vec3ApplyQuaternion`、`vec3ToCrossMatrix`、`vec3ToVec2/Vec4` …），class 相应方法改为委托 |

A1 / A2 期间，跨类型方法**暂留在 class 内用原实现**，并加注释标注「A3 补齐委托」；
这样每一步都能独立跑通、独立验收，不留悬空引用。

### 5.6 序列化与 class 注册

- **`@feng3d/serialization` 依赖已移除（A1 落地）**：13 个文件里的 `@serialize` 装饰器与对应 import 全部删除，
  `packages/math/package.json` 的 `dependencies` 不再含 `@feng3d/serialization`。
  实测移除后全仓 2238 个用例仍全绿——**没有消费方依赖 math class 的 `@serialize` 元数据**：
  主仓数据本身是纯数据字面量（`{ __type__: 'Color4', … }`），反序列化走
  [Serialization.ts:1207](../packages/serialization/src/Serialization.ts) 的纯数据分支，
  根本不读装饰器注册的成员表。这条实测把「math 已无序列化语义」从判断变成了证据；
- 反序列化：数值类型是 pure data container，走上述分支即可，**不需要改序列化代码**；
- `@decoratorRegisterClass()` / `__class__`：需确认删除后没有 `getInstanceByName('Vector3')` 消费者。
  目前实测到的 `'Vector3'` 字符串**全部是编辑器控件名**（`control: 'Vector3'`），不是反序列化键；
- 阶段 C 之前要跑一次全仓 grep 复核（`getInstanceByName('Vector` / `'Quaternion'` / `'Color4'` / `'Matrix4x4'`）。

### 5.7 字段描述改由 schema 生成器接手

class 上的 `@serialize` 装饰器在纯数据形态下不存在。字段描述由
[gen-objectview-schema.mjs](../scripts/gen-objectview-schema.mjs) 从**使用处的类型**推导——
这正是 `Object3D.position` 现在的路径：编辑器 schema 里它的 `type` 是内联结构字符串
`{ readonly x: number; readonly y: number; readonly z: number; }`，`control` 由**形状**推成 `'Vector3'`。

**math 类型自身不需要进那张名单**（生成器也不扫描 math，见 §5.9），
所以阶段 C 的这一步只是**核对**：重新生成 `dataTypeSchema` 后 diff 应当为空或极小；
若出现 diff，说明有地方显式依赖了 math 的 class 类型名，那就是漏网调用点。

### 5.8 测试是最大的调用点来源，先当等价网、后当迁移对象

`packages/math/test` 有 **43 个 spec**，大量直接构造 class 实例。

- **阶段 A**：测试**一行不改**——它们正是「class 委托纯函数后行为逐字不变」的等价证据；
- **阶段 B**：测试随调用点一起迁移到纯函数，并**新增**纯函数自身的用例（覆盖率门禁 R10 不能降）；
- 阶段 C 删除 class 时，测试里不应再出现 `new Vector3(`。

### 5.9 R3 名单不含 math：门禁必须另立（实测，修正直觉）

R3 门禁的纯数据类名单取自 [gen-objectview-schema.mjs](../scripts/gen-objectview-schema.mjs) 的产物（[dataTypeSchema.ts](../packages/editor/src/vue-app/objectview/generated/dataTypeSchema.ts) 的顶层键），而该生成器：

- 扫描范围是 `SCAN_DIRS = ['/packages/feng3d/src/', '/packages/particlesystem/src/', '/packages/terrain/src/']`——**不含 math**；
- 判据是接口自己声明 `readonly __type__: '<字面量>'`。

实测那 **66 个类型**里只有 `Color3` / `Color4` 出现（因为 `feng3d` 里有同名纯数据 interface，见脚本头部「两类必须排除的合法 `new`」），
`Vector2` / `Vector3` / `Vector4` / `Quaternion` / `Matrix4x4` / `Box3` … **一个都不在名单里**。

由此得到三条决定阶段 C 做法的结论：

1. `check-imperative-construction.mjs` 里的两处 math 豁免——`SKIP_PACKAGES = new Set(['packages/math'])`
   与 `CLASS_PROVIDERS = ['packages/math']`——**只为 `Color3`/`Color4` 这两个同名类型而存在**；
2. 因此**删掉 math 的 class 并不会让 `new Vector3()` 变成违规**，它从来没进过名单。
   「收回豁免」是 `Color3`/`Color4` 的事，不能当作 `Vector3` 的门禁；
3. 要真正拦住 `new Vector3(`，必须**另立一条门禁**：`packages/math/src` 内除白名单外不得出现 `export class`。

**决策点 D1：纯数据化的 `Vector3` 要不要声明 `readonly __type__: 'Vector3'`？——已定为「声明」**

| 选项 | 后果 |
|---|---|
| 不声明 | 与 `Object3D.position` 现状一致（场景 JSON 里就是 `{ x, y, z }`，无类型标记，JSON 不膨胀）；编辑器控件靠**形状推导**照旧工作（生成器里已有「`x`+`y`+`z` 齐备 → `'Vector3'`」的映射）。代价：不进 66 类名单，门禁只能另立。**未采纳** |
| **声明（已采纳）** | 自动进 66 类名单、R3 天然覆盖、面板有独立类型条目、数据可判别可挂载。代价：每个坐标多一个判别字段，且既有场景资源里 `position` / `rotation` / `scale` 都不带标记，需要一次资源迁移 |

采纳「声明」带来三件连锁工作，都在阶段 C 一并做：

1. **引入时机**：class 还在时**不能**导出同名接口，所以带 `__type__` 的 `Vector3` 在**阶段 C 与 class 同名替换**——
   在 `vector3Ops.ts` 里 `export interface Vector3 extends Vector3Like { readonly __type__: 'Vector3' }`，
   删除 class 后由 `index.ts` 原位置导出（消费方的 `import { Vector3 }` 不变）。
   阶段 A/B 只用**无 `__type__`** 的 `Vector3Like`：class 实例在结构上满足它，这是「零调用点改动」的前提；
2. **生成器扫描范围**：`gen-objectview-schema.mjs` 的 `SCAN_DIRS` 需纳入 `packages/math/src/`，
   否则 `Vector3` 进不了那张 66 类名单、编辑器面板不会有独立条目，R3 也就覆盖不到它（M11）；
3. **资源迁移**：`Object3D.position/rotation/scale` 等字段的 JSON 要补 `__type__: 'Vector3'`，
   用 `migrate-scene-json.mjs` 同类的脚本一次性转换，并由 `test/resourceFormatGuard.spec.ts` 守住（M12）。

> 阶段 C 待验证项（不要默认可行）：带 `__type__` 的字段混进数据后，
> ① `serialize` 是否会为它写出 `__type__`（取决于序列化器对字段类型的判断）；
> ② `Object.keys(position)` 多出的判别键是否影响既有遍历逻辑；
> ③ 编辑器面板把 `position` 显示为可展开的 `Vector3` 条目后，交互是否符合预期。

## 6. 差距清单

| # | 差距 | 归属 |
|---|---|---|
| M1 | 数值类型无纯函数层（仅 Color3 有 3 个函数） | `packages/math/src/**/*Ops.ts`（新建） |
| M2 | 数据定义与行为同文件（`Vector3.ts` 改造前 1412 行、A1 后约 1255 行；其余第一批类型未动） | `packages/math/src/geom` |
| M3 | `XxxLike` 类型不齐全、字段 readOnly 语义未统一（`Vector3Like` 现在字段可写） | `packages/math/src/**` |
| M4 | 全仓构造点未迁移（约 596 处 `new Vector3(` 等） | 8 个包 + `examples` |
| M5 | 全仓方法调用点未迁移（Vector3 系列约 700 处） | 同上 |
| M6 | `Vector3` 作为数据字段类型（MD5Anim/MD5Mesh/Box3/Segment3 等） | `feng3d` + `math` |
| M7 | R3 名单**不含** `Vector3` 等 math 数值类型（实测 66 类里只有 `Color3`/`Color4`），「收回豁免」拦不住 `new Vector3()`，需另立 math class 门禁 | [check-imperative-construction.mjs](../scripts/check-imperative-construction.mjs)（`SKIP_PACKAGES` / `CLASS_PROVIDERS`）+ 新增门禁 |
| M8 | 既有文档把 math 定为永久例外（三处） | [SERIALIZATION_MIGRATION.md](./SERIALIZATION_MIGRATION.md) + [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) |
| M9 | `SmoothDamp` 隐式读 `Time.deltaTime`、隐式多输出 | `packages/math/src/geom` |
| M10 | 冻结常量被当返回值共享（`Project` / `ProjectOnPlane`） | `packages/math/src/geom/Vector3.ts` |
| M11 | 生成器的 `SCAN_DIRS` 不含 `packages/math/src/`，`Vector3` 等进不了 66 类名单（D1 选「声明」后必须扩） | [gen-objectview-schema.mjs](../scripts/gen-objectview-schema.mjs) |
| M12 | 既有场景资源的 `position`/`rotation`/`scale` 不带 `__type__`，D1 选「声明」后需一次性迁移 | `examples/resources` + 各包 `resource/`，守 `test/resourceFormatGuard.spec.ts` |

## 7. 分阶段计划

每步都要求：`npx vitest run` 全绿 + `npm run types:packages` 无新增错误 + 该步自带实测证据。

**还要同步 `docs/CI.md` §1.3 的分包覆盖率表**：`node scripts/coverage-by-package.mjs --check` 会校验它与实测一致
（**行**覆盖率容差 0.5；**文件数列逐包精确比对、无容差**——该列原先不在 `--check` 范围内，
math 从 `67/76` 漂到 `70/79` 都没有门禁发现，issue #134 A3 收尾批已把它补进 `--check`），
而每个阶段新增的契约测试都会抬高 `math` 的覆盖率，从而触发它（A2b 就因为 75.3 → 75.8 差了 0.6 而红过一次）。
**在 worktree 里跑覆盖率必须加 `--config vitest.worktree.config.ts`**——worktree 的 `node_modules` 常是指向主工作区的
junction，包名导入会被解析到主工作区源码，而 `coverage.include` 是相对本 worktree 的 glob，那些覆盖数据会被直接丢弃、
读数系统性偏低（该配置仓库已提供，见 `docs/CI.md` §1.3 下方的提示）。

### A. 纯函数层（零调用点改动，行为逐字不变）

按 §5.5 的三步推进，每步独立验收。

**A1（已开工：Vector3）**

1. 新建 `packages/math/src/geom/vector3Ops.ts`：`WritableVector3Like`、冻结常量（`VEC3_ZERO` 等）与
   Vector3 自身运算的纯函数；`Vector3Like` 阶段 A 由 class 文件以 type-only 提供，阶段 C 转为本地定义。
   **不带 `__type__`**——带 `__type__` 的 `Vector3` 接口在阶段 C 同名替换 class（§5.9）；
2. `Vector3.ts` 的对应方法体改为委托，**签名、返回值、就地语义全部不变**（照 `Color3.mix` 的做法）；
3. 跨类型方法（`applyMatrix4x4` / `applyQuaternion` / `crossmat` / `toVector2` / `toVector4`）暂留原实现，
   注释标注「A3 补齐委托」。

**A2**：Quaternion / Matrix3x3 / Matrix4x4 / Color4 等重复 A1 的动作。
**A3**：补齐跨类型函数，class 相应方法改为委托。

**验收（每步）**：43 个既有 spec **一行不改**全绿；`npx vitest run --coverage` 不低于 `vitest.config.ts` 的阈值（R10）；
对每个新函数至少有 1 个直接调用的用例（阶段 A 就补，避免覆盖率掉）。

### B. 调用点迁移（分包分批提交）

1. `new Vector3(x, y, z)` → `{ x, y, z }`；`new Vector3()` → `{ x: 0, y: 0, z: 0 }`（或复用冻结常量）；
2. `a.add(b)` → `vec3Add(a, b, a)`；`a.addTo(b)` → `vec3Add(a, b)`；类型标注 `Vector3` → `Vector3Like`；
3. 顺序建议：`math` 包内 → `feng3d` → `particlesystem` / `addons` / `terrain` / `objectview` → `editor` → `examples`；
4. 每批用 `git grep -c 'new Vector3('` 之类做**剩余量台账**，写进提交信息。

**验收**：该批次的包内 `new Vector3(` 归零；测试与类型检查全绿（**不新增 `as any` / `@ts-expect-error` 掩盖**）。

### C. 删除 class + 引入带 `__type__` 的接口 + 收回豁免 + 加门禁

1. 在 `<type>.ts` 引入带判别字段的纯数据接口（D1 已定为「声明」，见 §5.9）：
   `export interface Vector3 extends Vector3Like { readonly __type__: 'Vector3' }`；
   删除 class 后由 `index.ts` 原位置导出，消费方的 `import { Vector3 }` 不变；
2. 删除第一批类型的 class 与 `@decoratorRegisterClass()` / `@serialize`；
3. 复核 `getInstanceByName` 无数值类型消费者（§5.6）；
4. 把 `packages/math/src/` 纳入 `gen-objectview-schema.mjs` 的 `SCAN_DIRS` 并重新生成
   `dataTypeSchema`、核对 diff（M11）——**只有这一步之后 math 类型才进 66 类名单**；
5. 资源迁移：给既有场景资源的 `position` / `rotation` / `scale` 补 `__type__: 'Vector3'`（M12），
   由 `test/resourceFormatGuard.spec.ts` 守住；同时验证 §5.9 的三个待验证项
   （序列化是否写出、`Object.keys` 多键的遍历影响、面板交互）；
6. 删除 `check-imperative-construction.mjs` 的两处 math 豁免（`SKIP_PACKAGES` / `CLASS_PROVIDERS`）——
   它们只为 `Color3`/`Color4` 这两个同名类型存在；**单独做这一步不会拦住 `new Vector3()`**（§5.9），
   要等第 4 步纳入名单后 R3 才真正覆盖 `Vector3`；
7. 新增门禁：`packages/math/src` 内除白名单外**不得出现 `export class`**——这是 `Color3`/`Color4` 之外
   所有数值类型的第二道机器保障（不依赖名单）；
8. 按脚本提示重跑基线 `--update`（`imperative-construction-baseline.json` 的 `note` 已写明键值口径）；
9. 同一批提交更新三处既有文档（M8）。
10. **（B3 登记，欠账）编辑器模板里的打包快照 `packages/editor/resource/template/libs/feng3d.d.ts`（约 555 KB / 20414 行）
    仍是旧声明**：`lookAt(target: Vector3, upAxis?: Vector3)`、`TransformLayout` 的 `position` / `size` /
    `leftTop` / `rightBottom` / `anchorMin` / `anchorMax` / `pivot` 七字段仍是 `get position(): Vector3`。
    它是随编辑器项目模板分发的**整包类型快照**（同目录还有 `libs/feng3d.js` 2.29 MB），由
    `EditorRS.ts` 拷贝进用户项目；模板项目里 `template/app.js` 第一行是 `/// <reference path="libs/feng3d.d.ts" />`，
    且 `template/tsconfig.json` 的 `files` 直接列了它，VS Code 按此提供类型提示；
    **既无生成脚本、也无一致性门禁**（全仓只有上述 4 个消费点，`grep` 不到任何脚本引用它），A→C 各阶段的签名变更都不会自动传导。
    更新方式是**整体重新打包**（需要一份能产出该 d.ts 的构建流程），不是逐行改。
    在阶段 C 收口时必须一并决定：要么补一条生成脚本 + 门禁（推荐），要么明确废弃该快照改为 npm 依赖。

**验收**：`packages/math/src` 内 `export class` 数量 = 白名单数；`new Vector3(` 全仓为 0；
`npm run ci` 全绿；`node scripts/check-imperative-construction.mjs` 通过。

## 8. 范围边界：本方案覆盖到哪

**第一批（阶段 A–C 覆盖）**：`Vector2/3/4`、`Quaternion`、`Matrix3x3/4x4`、`Color3/Color4`、
`Box3`、`Ray3`、`Segment3`、`Plane`、`Frustum`、`Triangle3`、`Rectangle`、`Sphere`、`Line3`、`Euler`。

**第二批（后续单独方案）**：带**继承与多态**的算法类——`Curve` / `CurvePath` / `ShapePath2` / `Shape2` /
`Font` / 各样条曲线 / `Gradient` 家族 / `MinMaxCurve` / `AnimationCurve` / `BezierCurve`。
它们在纯函数形态下需要「tagged union + 分发」或保留继承，**改造性质与数值类型不同**，不并入第一批，
否则阶段 C 的爆炸半径不可控。

**不进本方案**：

| 类型 | 理由 |
|---|---|
| [MathF.ts](../packages/math/src/MathF.ts) | 已是纯静态函数集合，无数据字段，改不改都不影响「数据驱动」 |
| [Time.ts](../packages/math/src/Time.ts) | 运行时状态（`deltaTime` 等），不是数值类型；它恰是 §3.5 要消除的隐式依赖来源 |
| `Noise` / `buildLineGeometry` / `ShapeUtils` | 无实例状态或已是函数式，按需在 B 阶段顺带确认 |

## 9. 整体验收标准

1. `packages/math/src` 内不再有第一批类型的 class；每个类型只有「数据定义（含带 `__type__` 的接口）+ 纯函数」。
   `index.ts` 导出的 `Vector3` 等名字**从 class 变成纯数据接口**，消费方的 `import` 语句无需改动；
2. 全仓 `new Vector3(` / `new Quaternion(` / `new Matrix4x4(` 等构造点归零；
3. 43 个既有 spec 与新增纯函数用例全绿，覆盖率不低于门禁阈值；
4. `Serialization` 对数值类型的往返测试覆盖（含 `{ __type__: 'Vector3', x, y, z }` 与 `{ __type__: 'Color4', … }` 两种形态）；
5. 既有场景资源已迁移（`position` / `rotation` / `scale` 带上 `__type__: 'Vector3'`），
   `test/resourceFormatGuard.spec.ts` 通过，编辑器面板对 `Vector3` 字段的读写正常；
6. `gen-objectview-schema.mjs` 的 `SCAN_DIRS` 已含 `packages/math/src/`，66 类名单包含第一批数值类型；
7. `packages/math/src` 内 `export class` 仅剩白名单，「math 内禁止新增 class」门禁已进 CI（第 2 条的全仓归零由此守住）；
   `Color3`/`Color4` 的 R3 豁免已删且 `npm run ci` 全绿；
8. 三处既有文档（M8）已同步，`node scripts/check-docs-links.mjs` 通过。

## 10. 风险与回退

| 风险 | 缓解 |
|---|---|
| 纯函数误用「返回新对象」语义，静默改变就地写行为（§5.1） | 阶段 A 保留 class 委托，等价性靠 43 个既有 spec 锁住；阶段 B 每批 review 检查 `out` 实参 |
| 分配上升拖慢渲染热路径（§5.4） | `out` 为契约；用 `BENCHMARK_BASELINE.md` 的口径做前后对比，异常则回退该批 |
| 跨类型函数悬空（§5.5） | 同批交付，不留半成品 |
| 冻结常量被共享后抛错（§5.3） | 迁移前逐处核查，把「返回新建」的行为变更写进提交信息 |
| 首批范围蔓延到 Curve/Gradient，导致长期半成品 | §8 明确划界；`src/math` 那个改到一半就停摆 6 个月的死快照就是前车之鉴 |
| 一次性提交过大，回归难以定位 | 严格 A→B→C，B 阶段按包分批，每批独立验收 |

**回退**：阶段 A 与 B 都是**增量**的——class 一直在，随时可停；只有阶段 C 不可逆，
所以 C 之前必须满足「B 阶段全仓构造点归零 + `npm run ci` 全绿 + 覆盖率不降」三个前置条件。

### 10.1 实施踩坑记录（A1 实测，写给后续同类改造）

| # | 坑 | 表现 | 处理与防复发 |
|---|---|---|---|
| **P1** | **大小写不敏感文件系统上 `vector3.ts` 与 `Vector3.ts` 是同一个文件** | 把「数据定义」写进 `vector3.ts` 时**静默覆盖**了 1412 行的 class `Vector3.ts`（Windows / macOS 都中招；`git status` 只显示一个 modified，不细看会以为正常） | 数据定义与纯函数合并进 `vector3Ops.ts`（与 `color3Ops.ts` 同构），靠 git 恢复。**不要再为任一类型新增「仅大小写不同」的文件** |
| **P2** | **就地写入时跨分量读入参会自污染** | `vec3Cross` 写成 `out.x=…; out.y=…（读 a.x）; out.z=…`，`out === a` 时第二、三个分量读到已改写的 `a.x`。Triangle3 用例成片失败（6/14），错值 `(-3,30,-135)`、正确为 `(-3,6,-3)` | 三个分量**先算进局部变量再写 `out`**。原 `cross()` 用 `set(x,y,z)` 一次性传参天然规避，改造时极易丢掉。**凡结果跨分量依赖的函数一律先算后写**（`vec3Dot` / `vec3Reflect` / `vec3Unit` 已复核无此问题） |
| **P3** | **拿 class 当正确性基准是无效测试** | 回归用例以 `new Vector3(1,2,3).cross(b)` 为期望值，而 class 已委托给同一个 `vec3Cross`——把实现改坏后该用例**照样通过** | 数值类用例期望值**手算硬编码**；另设一条「class 结果 == 纯函数结果」的**接线**用例，分工明确。可失败性用「改坏 → 变红 → 恢复」验证过 |
| **P4** | **`Vector3` 的 `__class__` 类字段是可枚举实例属性** | `{ ...vector3Instance }` 会多出 `__class__: undefined` 键，与 `{ x, y, z }` 字面量 `deepEqual` 必然不等（3 个用例假失败） | 断言统一走只取 xyz 的辅助函数；阶段 C 删 class 后该字段自然消失 |
| **P5** | 测试用 `Math.random` 的**固定序列**（seed 12345）造数据 | 任何改变 `Math.random` **调用次数或顺序**的改动都会让后续数据整体错位，表现为「莫名其妙一批用例失败」 | 委托改造不新增/减少随机调用；先用 `git stash` 在 HEAD 上跑同一组用例，区分「真回归」与「本来就 flaky」 |
| **P6** | **缺省 `out` 的初值必须与 class 构造默认一致** | `Color4` 构造默认 `a = 1`，而「操作型」函数习惯用全零初值。`random(false)` 这类**不写 `a`** 的函数，若缺省 out 用 `a: 0`，`color4Random(false)` 就与 `new Color4().random(false)`（`a` 保持 1）行为不一致 | ops 的缺省 out 显式对齐构造默认（`color4Ops.ts` 抽了 `DEFAULT_OUT = { r: 0, g: 0, b: 0, a: 1 }`）。**凡「可能不写某个分量」的函数，都要检查这一条** |
| **P7** | **手工翻译长分支极易漏改一个变量** | `quatFromEuler` 的 XZY 分支被我写成 `(sinX * sinY * sinZ)`，原文是 `(sinX * sinY * cosZ)`——六个分支、每个四行，肉眼很难发现。表现：**只有 `order=5` 的用例失败**（其余五个全过），差值 0.07 | 被 `Quaternion.spec.ts` 里那条**拿 `Matrix4x4.fromRotation` 做独立对比**的用例抓住。**这类「用另一个独立实现交叉验证」的测试是长公式抄写的唯一有效保护**——纯手算期望值根本写不出来 |
| **P8b** | **矩阵类缺省 `out` 的数组共享陷阱** | 矩阵用 `elements` 数组承载数据，若照抄 `quaternionOps` 的「模块级常量 + 展开」写法，浅展开**不复制数组**，两次缺省调用会共用同一个 `elements`（改一个影响另一个） | 矩阵的缺省 out 一律用 `defaultOut()` / `newOut()` **每次 slice 新建**（Matrix3x3 与 Matrix4x4 都这么处理），并加「两次缺省调用的 elements 不是同一数组」的用例 |
| **P8c** | **公共方法的返回类型退化**（本阶段咬人最多的一条） | 方法体写成 `return xxxOps(...)`（直接返回 ops 结果）时，推断出的返回类型就是 ops 的 `WritableXxxLike`，消费侧链式调用全断：Line3 让 `feng3d` 相机的 `#unprojectRay` 编译不过（TS2740/TS2345 × 4）、Matrix4x4 的 `toTRS` 让 `editor` 三个工具类报错（× 3）、Vector4 一批方法让相机报错（× 5）。**`tsc -p packages/math` 完全查不出来**（它只看 math 自己），只有 `check-strict-dirs` 连带检查 `feng3d` / `editor` 消费方时才现形。**B2 实测出第二种形态：读写同类型的字段**——setter 入参一旦放宽，同名 getter 的返回类型只能跟着退化（字段类型即 getter 返回类型），不存在「只放宽入参」的中间态；`LookAtController.upAxis` / `lookAtPosition` 正是卡在这里（实测见 §11.1，对策：整条链放宽，或原样保留；**B4 给出了第三种**——字段留 class 类型 + getter 显式标注 `Vector3` + setter 收 `Vector3Like` 后内部转换，见 §11.4） | 公共方法一律「**先写 `out` 再 `return out`**」+ 关键方法**显式标注返回类型**；静态工厂先 `new Xxx()` 再写入（否则返回纯字面量还会在**运行期**炸：`Matrix4x4.fromPosition(...)` 曾让 `Box3.applyMatrix` 报 `transformPoint3 is not a function`）。**每批提交前必须跑 `node scripts/check-strict-dirs.mjs`** |
| **P8d** | **`check-strict-dirs` 在 junction worktree 里会失真** | worktree 的 `node_modules` 若整体是指向主工作区的 junction，`@feng3d/math` 会被解析到**主工作区**，同一份 `feng3d` 被两个路径解析成两份类型，于是报出 91 条「同名类型来自两个声明」的幽灵错误，且**改前改后都是 91 条**，真正的新错误被完全盖住 | 要么给 worktree 装**真实** `node_modules`（`npm install`，本仓约 13–35 秒），要么临时把 `node_modules/feng3d` 与 `node_modules/@feng3d/math` 两个 junction 指向本 worktree（跑完改回）。**P8c 的修复必须在这种可信环境里验证** |
| **P8e** | **`Matrix3x3.mmult` 的 JSDoc 与实现相反** | 注释写「m 要从左边乘」、`Matrix3x3.spec.ts` 也写「target = m × this」，**实算是 `this × m`**（手算 (0,0)=16 对、反序 41 错）。同类既有可疑点还有：`Matrix4x4.append` 实算是 `this × lhs`；`moveRight` 与 `moveUp` / `moveForward` 语义不对称（前者先归一化、后者受缩放放大）；`setRotation` 重组时写死默认旋转序、丢弃调用方的 `order`；`Vector2.polar` 把弧度乘了 `RAD2DEG`；`reverse()` / `solve()` 失败时抛的是**字符串**而不是 `Error`；奇异性判断漏 `-Infinity` | 本阶段**逐字保留原行为**，只在 class / ops 两处标注「与 JSDoc 相反」或「可疑，原样保留」；**JSDoc 与 spec 注释、以及这些既有 bug 的修复，留给阶段 C 统一决策**（都不是本阶段引入的） |
| **P9** | **纯函数层写完了、但没从包入口导出**（B1 实测，B 的第一个拦路虎） | 阶段 A 的 17 个 `*Ops.ts` **一个都没进** `math/src/index.ts`，外部消费方 `import { vec3DivideNumber } from '@feng3d/math'` 报 TS2305，vitest 则是运行期 `vec3DivideNumber is not a function`——B 的「调用点迁移」在补导出之前根本无法开始，而 §7 的分阶段计划完全没写这一步 | B1 在 `index.ts` 按字母序补 17 行 `export *`（紧跟同名 class 之后），并新增 `test/opsEntry.spec.ts` 4 个入口契约用例守住「可达」。补导出又暴露第二层问题：`matrix4x4Ops.ts` 与 `vector4Ops.ts` **各自定义了一份** `Vector4Like` / `WritableVector4Like`（同形、不同符号），两个 `export *` 同时生效即 **TS2308**（PlaneLike / Matrix3x3Like 是同符号重导出，所以不报）；已按它们的既有做法改成 type-only 重导出。补导出还会**顶到包体门禁**（R9）：`full` 档（入口就是 `import * as feng3d from 'feng3d'`，度量的是**导出面**本身）gzip 从 184586 B 涨到 187572 B；而 `minimal` / `core` 两档在加导出**前后逐字节相同**（31868/9133、611454/152948），证明 tree-shaking 未被破坏、**无关场景零增长**——所以这是「导出面扩大」的合理增长，不是设计缺陷，已 `--update` 基线（叠加了本次改动前旧基线就已落后的 +1.3%，见 PR 说明）。**新增导出一律先跑 `npx tsc -p packages/math` + `npm run types:packages` + `node scripts/check-bundle-size.mjs`** |
| **P8** | **测试全绿 ≠ 类型通过** | `quaternionOps.ts` 写了 `import type { Vector3Like } from './vector3Ops'`，而该类型并未从那里导出：vitest（esbuild 剥类型）**全绿**，`tsc` 才报 TS2459 | 「测试 + 覆盖率 + 类型 + lint」四项**都必须跑**：`npm run types:packages` 不能省（A2b 正是它拦下的），eslint 也拦不住这类错 |

## 11. 进度

| 阶段 | 状态 |
|---|---|
| 规划（本文） | ✅ 完成 |
| #134 第一步（Color3 纯函数层） | ✅ 完成：`color/color3Ops.ts`（`color3ToInt` / `color3Mix` / `color3Scale`），class 方法委托，行为逐字不变 |
| **移除 `@feng3d/serialization` 依赖** | ✅ 完成：13 个文件的 `@serialize` 与对应 import 全删、`package.json` 去掉该依赖；移除后全仓 2238 用例仍全绿（证据与推论见 §5.6） |
| A1 Vector3 自身运算 | ✅ 完成：新增 `geom/vector3Ops.ts`（`WritableVector3Like` + 常量 + 纯函数，751 行），`Vector3.ts` 的实例/静态方法体改为委托（1412 行 → 约 1255 行）；新增 `test/geom/vector3Ops.spec.ts` 10 个契约用例（含可失败性验证）；math 既有 43 个 spec **一行未改**全绿 |
| A1 有意保留、未委托的方法 | ⬜ 待**阶段 B / 阶段 C**（与 A3 的跨类型改造无关）：`Project` / `ProjectOnPlane` / `ClampMagnitude` / `MoveTowards`（退化分支返回**共享对象**，见 §5.3）、`Min` / `Max`（`Mathf.Min` 是 `a<b?a:b`，与 `Math.min` 的 NaN 语义不同）、`SmoothDamp*`（多输出且隐式读 `Time.deltaTime`，见 §5.2 / §3.5）——这几条都要**改调用签名**，只能在阶段 B 迁移调用点、阶段 C 收口时一并处理 |
| A1 跨类型方法 | ✅ 完成（A3 批）：`applyMatrix4x4` / `applyQuaternion` / `crossmat` / `toVector2` / `toVector4` / `fromVector2` 六个方法已全部委托，详见下面 A3 行 |
| A2a Color3 / Color4 | ✅ 完成：`color/color3Ops.ts` 补齐到 13 个函数、新增 `color/color4Ops.ts`（17 个函数），两个 class 的方法体全部委托；新增 `test/colorOps.spec.ts` 11 个契约用例；全仓 2249 用例通过 |
| A2b Quaternion | ✅ 完成：新增 `geom/quaternionOps.ts`（30 个函数），`Quaternion.ts` 方法体全部委托（含 `fromEuler` 六种旋转序）；新增 `test/geom/quaternionOps.spec.ts` 11 个契约用例 |
| A2c Matrix3x3 / A2d Matrix4x4 / A2e Vector2 / A2f Vector4 | ✅ 完成（PR #517）：四个纯函数层（21 + 63 + 33 + 33 个函数，共约 3600 行）+ 105 个契约用例；顺带修掉 Matrix4x4 `toTRS` 与 Vector4 一批公共方法的**返回类型退化** |
| A2g Segment3 / A2h Line3 | ✅ 完成（PR #513、#515）：`segment3Ops`（14 函数）+ `line3Ops`（11 函数）+ 17 个契约用例；`Line3.getPointWithZ` 的返回类型退化也是在这批修的 |
| A2i–A2l 几何类型（Box3 / Plane / Triangle3 / Euler） | ✅ 完成（PR #521）：`box3Ops` / `planeOps` / `triangle3Ops` / `eulerOps` 四个纯函数层落地，对应 class 的方法体改为委托；`Triangle3` 的跨类型方法后来挪到 A3 批（见下） |
| A2m–A2p 其余几何（Rectangle / Sphere / Frustum / Ray3） | A2m / A2n / A2o ✅ 完成：`rectangleOps`（PR #521）、`sphereOps` 与 `frustumOps`（PR #524，依赖按序推进）；**A2p（Ray3）⬜ 未开始**——`packages/math/src/geom/ray3Ops.ts` 尚不存在，`Ray3` 仍是原实现 |
| A3 跨类型函数 | ✅ 完成（PR #527、#525）：`Line3.applyMatri4x4`（→ `mat4TransformPoint3` / `mat4TransformVector3`）；`Vector3` 的 `applyMatrix4x4` / `applyQuaternion` / `crossmat` / `toVector2` / `toVector4` / `fromVector2`（→ `mat4TransformPoint3` / `quatVmult` / `mat3Set` / 新增的 `vec3ToVec2` / `vec3ToVec4` / `vec2ToVec3`）；`Vector4.applyMatrix4x4`（→ `mat4TransformVector4`）；`Triangle3` 的 `getPlane3d` / `closestPointWithPoint` / `distanceWithPoint` / `distanceSquaredWithPoint` / `static containsPoint`（→ `planeFromPoints` / 新增的 `tri3ClosestPointWithPoint` 系列 / `tri3OnWithPoint`）；`Matrix3x3` 的 `formMatrix4x4` / `toMatrix4x4`（→ `mat3FromMatrix4x4` / `mat3ToMatrix4x4`，由 #525 单独交付）。类型归属调整 **已完成**（`PlaneLike` 见 A2j、`Matrix3x3Like` 本批从 `matrix4x4Ops.ts` 的临时声明改引 `matrix3x3Ops.ts`，两处都保留 type-only 重导出；**`Vector4Like` / `WritableVector4Like` 当时仍是双定义**，B1 已收口，见 P9）。新增 `test/geom/a3CrossTypeOps.spec.ts` 21 个契约用例。<br><br>**A3 之后仍留在 class 内的成员**（**划归阶段 C**，不是欠账）：`Line3.intersectWithLine3D`、`Segment3` 的 `getLine` / `intersectionWithLine` / `intersectionWithSegment` / `closestPointWithPoint`、`Triangle3` 的 `intersectionWithLine` / `intersectionWithSegment` / `decomposeWith*`——返回值都是 `Line3 \| Segment3 \| Vector3 \| null` 这类**联合类型 + `instanceof` 判别**，或需要**装配回 class 实例**（纯函数层只产普通字面量，装回去会丢 `Vector3` 原型），纯函数化要等阶段 C 的 `__type__` 判别字段与构造器收口；`Triangle3.decomposeWithPoint` 还额外要求「顶点就是原对象」的引用语义。**`line3Ops` 自 A2h 起就已就绪，从来不是这些方法的阻塞点**（此前注释写成「依赖 Line3 尚未纯函数化」，已于本批更正）。均已在各自方法上加注释说明，**不为凑数强行翻译**
③ **B 后续批次的前置障碍（B1 实测，口径：`packages/feng3d/src` 内 `标识符: Vector2|3|4 / Color3|4` 形式的声明，不含 getter 返回类型）**：`feng3d` 公共 API 里**仍是 class 类型**的字段/参数标注 **99 处**，改成 `*Like` 的 **0 处**——即「放宽」这一步在 `feng3d` 侧**一次都还没做过**。被外部构造点直接赋值/传参、因而必须放宽的高频项：`Object3D.lookAt(target, upAxis?)`（11 处调用点）、`Camera.project` / `#unprojectPoint(point3d: Vector3)`（4 处）、`TransformLayout` 的 `position/size/leftTop/rightBottom/anchorMin/anchorMax/pivot`（8 处声明）、`PointGeometry.color/uv`、`SegmentGeometry.startColor`、`OutLine.color`、`Wireframe.color`、`Raycaster` 的 `localPosition/localNormal/uv`、`Uniform.ts` 的 15 处 `u_*` uniform 字段（新增 `Vec3`/`Color4` 字面量的旧渲染路径）。**放宽是纯放开**（class 实例结构上满足 `*Like`，既有调用点不受影响），所以每处都是一行声明改动，**牵连面 = 该字段/参数的调用点数**；后续批次宜**按 API 分批**（如「Object3D/Transform 家族」「Camera 家族」「Geometry/Uniform 家族」），而不是按包分批 |
| B 调用点迁移 | 🔶 进行中：**B1 = terrain 首批试水**（PR #531）——先补 B 的硬前置：`index.ts` 导出 17 个 `*Ops` 模块（阶段 A 只写了函数、没从入口导出，B 原本 `import` 不到），并收口 `Vector4Like` 双定义（P9）；再迁移 `packages/terrain` 的 **10 处** class 构造（`new Vector2/3/4` 9 处 + `new Color4` 1 处）为纯数据字面量 / 纯函数。B1 **未撞上任何 feng3d 签名障碍**，因为那三处恰好都不经过 feng3d 的 class 类型收窄：`TerrainMergeMethod` 的 8 处走 `(renderObject as any).uniforms`（且该类已无调用方）、`TerrainData.size` 是 terrain 自身字段、`Color4` 传给**在 #134 之前就已放宽**的 `ImageUtilColorLike`。**B2（Object3D / Transform 家族）**——把 `Matrix4x4.lookAt`、`Object3DLogic.lookAt`、`TransformLayout` 七个字段放宽为 `Vector3Like`，并迁移仓内全部调用点到字面量（实测清单与下一批候选见 §11.1）；**B3（`Matrix4x4` 的 Vector3 参数族）**——把 `Matrix4x4` 里 **17 个纯入参**放宽为 `Vector3Like`，**out / 返回形态一律不动**（实测清单与保留清单见 §11.2）；**B4（Camera + Controller 家族）**——`project` / `getScaleByDepth` 的入参与 `CameraUniforms.u_cameraPos` 放宽为 `*Like`，`unproject` 的第 4 个 out 参数加类型重载，`LookAtController` 的 getter 用「字段留 class + setter 内部转换」保住 `Vector3` 返回类型（实测清单与保留清单见 §11.4）；**B5（Geometry / Material / Uniform 家族 + `setAxisX|Y` 补漏）**——放宽 **23 处** `@feng3d/math` 类型声明（`Uniform.ts` 10 + `Cartoon`/`OutLine`/`Wireframe` 8 + `setAxisX|Y` 2 + `u_lightPosition` 3），实测**可迁移调用点只有 1 处**，并校正了「清单 42 处里近半不是 math 类型」的口径（实测清单、保留清单与两套 `Color4` 的不可互换证据见 §11.3）；**B6（剩下的四个小家族 ⑤⑥⑦⑧）**——资产 MD5（`MD5Anim` / `MD5Mesh` 的位置类字段）、拾取（`PickingCollisionVO` 的 `uv` / `localPosition` / `localNormal`）、光照与场景（`Light.color`、`Scene.background` / `ambientColor`）、`ImageUtil.drawLine` 的端点，一律放宽为对应的 `*Like`；其中三个颜色字段**收的不是 math 的 class**而是本包的纯数据接口，故改用联合 `Like \| 原接口`（实测清单、保留清单与两处不一致见 §11.5） |
| C 删除 class + 引入带 `__type__` 的接口 + 门禁 + 文档同步 | ⬜ 未开始（**已登记一项欠账**：编辑器模板里随包分发的 `packages/editor/resource/template/libs/feng3d.d.ts` 打包快照仍是旧声明，见 §7 C 第 10 条） |
| 第二批（Curve / Gradient 家族） | ⬜ 未开始（范围与方案待定，见 §8） |

### 11.1 B2 实测：Object3D / Transform 家族

B2 放宽的三个签名（**纯放开**：class 实例在结构上满足 `Vector3Like`，既有调用点零改动）：

| API | 放宽内容 | 牵连调用点 |
|---|---|---|
| `Matrix4x4.lookAt` | `target` / `upAxis` 参数 | 纯函数层目标 `mat4LookAt` 早已收 `Vector3Like`，只需改 class 签名 |
| `Object3DLogic.lookAt` | `target` / `upAxis` 参数 | **30 处**（`examples/` 25、`packages/feng3d` 3、`packages/editor` 2），已全部改字面量 |
| `TransformLayout` | `position` / `size` / `leftTop` / `rightBottom` / `anchorMin` / `anchorMax` / `pivot` 七个纯数据字段 | 数据侧无外部构造点；Logic 内 4 处 `.clone()` 改显式浅拷贝（`Vector3Like` 没有类方法） |

**同家族仍收 `Vector3` 的成员**（下一批候选，按收益排序）：

1. **`Matrix4x4` 的参数族**：`fromTRS` / `setPosition` / `setRotation` / `setScale` / `setAxisX|Y` / `fromAxisRotate` / `appendRotation` / `prependRotation`（`pivotPoint`）。收益可直接量化——`Object3D` 内部就有 4 处 `new Vector3(p.x, p.y, p.z)` 这类**被迫包装**（数据层本就是 `{ x, y, z }`），`packages/editor` 的 `MRSToolTarget` / `EditorView` / `Feng3dScreenShotRenderer` 另有约 8 处同型代码。这是「按家族分批」最有价值的一批。→ **B3 已处理其中 17 个纯入参**（实测见 §11.2）；`setAxisX|Y` 不在那批清单内，由 **B5 补上**（见 §11.3）。**注**：这里原先写的 `setAxisX|Y|Z` 有误——`Matrix4x4` **没有 `setAxisZ`**（实测 `packages/math/src` 与编辑器随包分发的 `feng3d.d.ts` 快照里都只有 X/Y 两个），B5 已一并更正
2. **`LookAtController.upAxis` / `lookAtPosition`**：setter 可放宽，但字段类型一改，getter 返回类型就从 `Vector3` 退化为 `Vector3Like`（撞 P8c），且仓内无外部调用点——**B2 当时保留原样**；**B4 用第三条路解决了**（字段留 `Vector3` + setter 收 `Vector3Like` 后内部转换，见 §11.4）。
3. 其余要么是 private（`LookAtController._lookAtTransform`、`FPSController.#stopDirectionVelocity`）、要么是方法内局部变量，放宽没有对外收益。

**返回值一律不放宽**：`Object3DLogic.worldPosition`、`Matrix4x4.getPosition()` / `getAxisX|Y|Z()` 等返回 `Vector3`，放宽会让消费方的类方法调用（`.normalize()` / `.addTo()`）编译不过——这是 P8c 的反向退化。

### 11.2 B3 实测：`Matrix4x4` 的 Vector3 参数族

**放宽清单（17 个纯入参，全部只读；`Vector3` 实例在结构上满足 `Vector3Like`，既有调用点零改动）**。
「消费方调用点」= `packages/`（不含 math 自身）+ `examples/` + `test/` 内该 API 的调用处，由脚本跨行解析实参得出；
右列是 math 包内（`packages/math/test`）的同名调用点数，供后续批次参考——**同名但不同类的 API 不计**
（如 Web Audio 的 `listener.setPosition(x, y, z)`、`panner.setPosition(...)`，本可误报 2 处，已人工剔除）。

| API | 放宽的参数（`Vector3` → `Vector3Like`） | 消费方调用点 | math 内调用点 |
|---|---|---|---|
| `static fromTRS` / `fromTRS` | `position` / `rotation` / `scale` | 5 | 19 |
| `setPosition` | `value` | 3 | 4 |
| `setRotation` | `rotation` | 3 | 2 |
| `setScale` | `scale` | 0 | 3 |
| `static fromAxisRotate` / `fromAxisRotate` | `axis` | 0 | 8 |
| `appendRotation` | `axis` / `pivotPoint` | 12 | 20 |
| `appendScale` | `pivotPoint` | 0 | 7 |
| `prependRotation` | `axis` / `_pivotPoint` | 0 | 2 |
| `transformPoint3` | `vin` | 37 | 18 |
| `transformVector3` | `vin` | 31 | 8 |
| `transformRotation` | `vin` | 0 | 1 |
| `MultiplyPoint` / `MultiplyPoint3x4` / `MultiplyVector` | `point` / `vector` | 0 | 各 3 |
| `static Scale` / `static Translate` | `vector` | 0 | 0 |

**本次迁移到字面量的调用点**：19 个（26 个 `new Vector3(...)` 构造点）——`Object3D.ts` 2（`fromTRS` 三参 + `setRotation`）、
`EditorView.ts` 2、`Feng3dScreenShotRenderer.ts` 2、`mrsTool/MTool.ts` 4、`mrsTool/STool.ts` 4、`navigation/Navigation.ts` 1、
`core/eyeRelative.spec.ts` 3、`core/Object3D.spec.ts` 1；另有 math 包内 `Matrix4x4.spec.ts` 2 处（`transformPoint3` 的 `vin`、`appendScale` 的 `pivotPoint`）。
其余调用点传的本就是 `Vector3` 变量或已被放宽的纯函数返回值，**没有可改的字面量**（不为凑数而改）。
注意 issue 正文的粗测（`transformVector3` 12 / `transformPoint3` 10）与实测（31 / 37）差距很大——**粗测不可靠，以脚本实测为准**。

**保留清单（不放宽，理由是 P8c）**：

| 成员 | 不放宽的参数 | 理由 |
|---|---|---|
| `getPosition` / `getRotation` / `getScale` | `value` / `rotation` / `scale` | out 形态：参数字段类型即返回类型，放宽会让 `getPosition()` 的返回从 `Vector3` 退化为 `WritableVector3Like`（P8c 字段形态），消费方 `.normalize()` / `.addTo()` 全部编译不过 |
| `toTRS` | `position` / `rotation` / `scale` | 同上，且返回值是元组 `[position, rotation, scale]`（editor 的 `MRSToolTarget` / `RTool` / `SceneRotateTool` 拿 `toTRS()[1]` 当 `Vector3` 用） |
| `getAxisX` / `getAxisY` / `getAxisZ` | `out` | 纯 out，直接返回它 |
| `transformPoint3` / `transformVector3` / `transformRotation` | `vout` | 纯 out |
| `MultiplyPoint` / `MultiplyPoint3x4` / `MultiplyVector` | `res` | 纯 out |
| `static Scale` / `static Translate` | `m` | 调用方给 class 实例、缺省新建，返回值必须带 `Matrix4x4` 原型方法 |

**未加类型重载**：这 6 类 out 参数一旦放宽，要保住不退化就得为每个成员维护两条签名，而仓内**没有任何调用点**会因此改成字面量，收益不抵复杂度。
（原先写的理由是「重载的返回类型推断仍走最后一条签名」——**该理由不成立，已更正**，见 §11.4 末条；准确的结论是「当前无调用点受益」，不是「重载无效」。）

**本批未动、但同形的候选**：`setAxisX` / `setAxisY` 的 `vector` 参数（B2 已列为候选，B3 任务清单未含）。
它与本批的 `setPosition` 完全同形——**纯入参、返回 `this`**，放宽同样不会退化，**已由 B5 一并处理**（见 §11.3）。
另注：B2 当时把候选写成 `setAxisX` / `setAxisY` / **`setAxisZ`**，但 `Matrix4x4` **没有 `setAxisZ`**（全仓实测 0 处定义，`packages/math/src` 与 `feng3d.d.ts` 快照都只有 X/Y）——该名称为笔误，B5 已更正。
另注 `prependRotation` 的 `_pivotPoint` **在实现里根本没被使用**（`mat4PrependRotation(this, axis, angle, this)` 不接收 pivot），
是「JSDoc 描述其有语义、实现忽略」的又一处可疑点，已按 P8e 惯例在本批**只放宽类型、不改行为**，留给阶段 C 决策。

### 11.3 B5 实测：Geometry / Material / Uniform 家族（含 `setAxisX|Y` 补漏）

**口径**：只放宽**真正从 `@feng3d/math` 导入**的 class 类型（`Vector2/3/4`、`Color3/4`）。仓里同名但不同源的 `Color4`
（`packages/feng3d/src/core/Color4.ts` 的**纯数据接口**）一律不动——理由见下面的「保留清单」。
调用点由脚本跨行解析统计（`packages/` + `examples/` + `test/`，不含仓库根遗留 `src/`）；**同名但不同类的 API 不计**。

**放宽清单（23 处声明，全部纯属性/纯入参，class 实例在结构上满足 `*Like`，既有调用点零改动）**：

| API | 放宽内容（→ `*Like`） | 消费方调用点 |
|---|---|---|
| `Matrix4x4.setAxisX` / `setAxisY` | `vector` 参数 | 0 / 0 |
| `PointGeometry`（`PointInfo`） | `uv?`（`Vector2Like`） | 0 |
| `OutLine` | `color`、`MixinsUniforms.u_outlineColor`（`Color4Like`） | 0 |
| `Wireframe` | `color`（`Color4Like`） | 0 |
| `Cartoon` | `outlineColor`、`diffuseSegment`、`diffuseSegmentValue`、`MixinsUniforms.u_diffuseSegment` / `u_diffuseSegmentValue`（`Vector4Like`） | 0 |
| `GlobalUniforms.u_Viewport` | `Vector2Like` | **1**（`ForwardRenderer`，已改字面量） |
| `MixinsUniforms.u_splatRepeats` / `u_lod0vec` | `Vector4Like` | 0 |
| `MixinsUniforms.u_tileOffset` | `Vector4Like[]` | 0 |
| `MixinsUniforms.u_splatMergeTextureSize` / `u_imageSize` / `u_tileSize` | `Vector2Like` | 0 |
| `MixinsUniforms.u_specular` / `u_fogColor` | `Color3Like` | 0 |
| `MixinsUniforms.u_lightPosition` | `Vector3Like` | 4（`ForwardRenderer` 2 + `ShadowRenderer` 2；实参分别是 `logic(light).position` 与 `[0,0,0]`，**没有可改的字面量**） |
| `ShadowDataUniform.u_lightPosition`（`ForwardRenderer`）/ `ShadowUniformData.u_lightPosition`（`ShadowRenderer`） | `Vector3Like \| number[]` | 同上 |

**本次迁移到字面量的调用点：1 处**——`ForwardRenderer.ts` 的
`u_Viewport: new Vector2(vp[0], vp[1])` → `u_Viewport: { x: vp[0], y: vp[1] }`。
其余调用点要么**本就没有**（表格里的 0），要么传的是已被放宽的纯函数返回值 / class 变量，**没有可改的字面量**（不为凑数而改）。
这与 B1/B3 的「估数远小于实测」相反：本批的 **42 处是「声明数」而非「调用点数」**，且其中**近半不是 `@feng3d/math` 类型**（见下），
所以可迁移的调用点极少——**估计「约 11 处」与实测「1 处」的差距同样说明估数不可用于排期**。

**保留清单（不放宽，理由是它们根本不是 `@feng3d/math` 的类型）**：

| 成员 | 保留类型 | 理由 |
|---|---|---|
| `PointGeometry.PointInfo.color` | `core/Color4` | `packages/feng3d/src/core/Color4.ts` 是**纯数据接口**（`__type__: 'Color4'` **必填** + `r/g/b/a` **可选**），与 `@feng3d/math` 的 class 无关 |
| `SegmentGeometry.Segment.startColor` / `endColor` | `core/Color4` | 同上（`Trident.ts` 的注释「四项**全必填**」即指这套字面量） |
| `StandardMaterial.uniforms` 的 `u_diffuse` / `u_specular` / `u_ambient` / `u_fogColor` | `core/Color4` | 同上（`StandardUniforms` 声明的是 feng3d 自己的纯数据接口） |
| `ColorMaterial` / `PointMaterial` / `TextureMaterial` / `SegmentMaterial` 的 `u_*` | `core/Color4` | 同上 |
| `Uniform.ts` 的 `u_sceneAmbientColor` / `u_diffuseInput` / `u_diffuse` / `u_ambient` / `u_wireframeColor` | `core/Color4` | 同上 |
| `GeometryUtils.ts` 的 `rayEntry` 局部结果结构 | `Vector2` / `Vector3` | 任务明示不动：内部实现细节，外部永远传不进字面量 |
| `Camera.u_cameraPos` / `LookAtController` 的字段 | `Vector3` | **B4 家族**（`cameras/`、`controllers/`），与本批文件不重叠，不在本批范围 |

**两套 `Color4` 为什么不能互换（本批最关键的口径校正）**：
`@feng3d/math` 的 `Color4Like` 要求 `r/g/b/a` **全部必填**且**没有** `__type__`（`color4Ops.ts:20`）；
而 feng3d 的 `core/Color4` 要求 `__type__: 'Color4'` **必填**、`r/g/b/a` **可选**（`core/Color4.ts:10`）——**双向都不可赋值**。
所以把 feng3d 的字段改成 `Color4Like` 会让仓内 **100+ 处** `{ __type__: 'Color4', r, g, b, a }` 字面量立刻编译不过；
改成 `Color4 | Color4Like` 联合，读侧 `.r` 又会退化成 `number | undefined`（P8c 的同型风险）。
**B1 的 42 处里有 17 处属于后者**（B1 自述口径是 `packages/feng3d/src` 内 `标识符: Vector2|3|4 / Color3|4` 的**正则扫描**，
不区分 import 来源）——这是本批实测与清单的最大不一致，也是硬规则「只改真正从 `@feng3d/math` 导入的类型」的直接理由。

**顺带修掉的一处文档笔误**：B2/B3 记的 `setAxisX|Y|Z` 实际只有 `setAxisX` / `setAxisY`（`setAxisZ` 不存在，见 §11.1 / §11.2 的更正）。

**生成产物同步**：放宽 `Cartoon` / `OutLine` / `Wireframe` 的字段类型后，
`packages/editor/src/vue-app/objectview/generated/dataTypeSchema.ts` 必须重跑生成器——
`type` 从 `Color4` / `Vector4` 变为 `Color4Like` / `Vector4Like`（`control` 仍是 `Color4` / `Vector4`，编辑器控件不变），
共 5 行差异（`git diff` 实测 10 行增删）。`node scripts/gen-objectview-schema.mjs --check` 会直接拦下漏同步。
### 11.4 B4 实测：Camera 家族 + Controller 家族

（**编号说明**：本节号按**合并先后**排——B5 的 PR 先合、先占了 §11.3，本节顺延为 §11.4；批次顺序上 B4 早于 B5。）

**② Camera 家族**（`packages/feng3d/src/cameras/`）——B1 家族地图里这 8 处（含 2 处私有）的实测处理：

| API | 放宽内容 | 仓内实牵连 |
|---|---|---|
| `CameraLogic.project` + 两个子类的 `project` | 入参 `Vector3` → `Vector3Like` | **2 处**：`PerspectiveCamera.spec.ts` / `OrthographicCamera.spec.ts` 各自的 `new Vector3(1, 2, -5)`，已改 `{ x, y, z }` 字面量 |
| `CameraLogic.unproject` + 两个子类的 `unproject` | 第 4 个 **out 参数**加一组重载：`Vector3` 实例仍返回 `Vector3`，普通 `{ x, y, z }` 返回 `WritableVector3Like` | **0 处**（仓内没人传第 4 个参数）；放宽是为消费方不必再 `new Vector3()` 当输出桶 |
| `CameraLogic.getScaleByDepth` + 两个子类 | 方向参数 `Vector2` → `Vector2Like` | **0 处**（`ViewportNavigation.ts:442` 只传深度；相机自身两处也只是 `getScaleByDepth(1)`） |
| `CameraUniforms.u_cameraPos` | 纯数据字段 `Vector3` → `Vector3Like` | 写入方是相机自己的 `uniforms` computed（传 `Object3DLogic.worldPosition`，结构上满足）；读取方只有 `PerspectiveCamera.spec.ts` 的 `u.u_cameraPos?.x` |

两处实现要点（都已写进代码注释）：

1. **`project` 走纯函数层，而不是 `world2local.transformPoint3(point3d)`**：`Matrix4x4.transformPoint3` 的**入参**放宽落在 B3，而**本批开工时 B3 还没合并**（那时它仍收 `Vector3` 实例，直接调会被 `Vector3Like` 撞出 TS2345）。改调 `mat4TransformPoint3(world2local, point3d, camLocal)` 之后，B4 对 B3 **没有任何排序依赖**——两个批次谁先合都编译得过，且与旧实现行为等价（同一份 `mat4TransformPoint3`，class 方法只是它的包装）。
2. **`unproject` 的 out 参数用重载，而不是直接把参数放宽**：直接放宽会让「只传 3 个参数」的调用方也拿到 `WritableVector3Like`，而 `getScaleByDepth` 里的 `lt.subTo(rb).length` 正需要 `Vector3`（P8c）。实现改成纯函数层 `line3GetPointWithZ(ray, sZ, v)` + `mat4TransformPoint3(local2world, v, v)`，与旧的 `local2world.transformPoint3(ray.getPointWithZ(sZ, v), v)` 逐步等价——两步都是「就地写回 `v` 并返回 `v`」，`mat4TransformPoint3` 的三个分量也先算局部变量再写 `vout`（`vout === vin` 安全）。

**③ Controller 家族**（`packages/feng3d/src/controllers/LookAtController.ts`）：

| 成员 | 改法 | 仓内实牵连 |
|---|---|---|
| `set upAxis` | 入参 `Vector3` → `Vector3Like`，setter 内 `new Vector3(x, y, z)` 转成实例 | **0 处**外部赋值 |
| `set lookAtPosition` | 同上 | **1 处**：构造函数里的 `new Vector3()` 改成 `{ x: 0, y: 0, z: 0 }` |

getter 的返回类型仍是 `Vector3`（字段类型没动，`set` 收 `Like` 是 TS 4.3 起的「读写类型不同」特性），P8c 不触发；消费方 `.length` / `.cross()` 照常可用——新增的 `LookAtController.spec.ts` 用 `.length` 同时锁住类型（退化就编译不过）与运行期（存了字面量就没有 `length`）。

**唯一行为变化**：setter 由「存引用」变成「存副本」——外部再改传入的那个向量不再影响控制器。仓内 0 处依赖该引用语义的赋值点，并有用例显式锁住新语义。

**保留清单（附理由）**：

| 成员 | 理由 |
|---|---|
| `PerspectiveCameraLogic.#unprojectPoint` / `#unprojectRay`（两个子类各一对） | 私有方法，外部 0 处；放宽 `point3d: Vector3` 没有任何对外收益（B1 家族地图里 8 处中就有 2 处是这类） |
| `LookAtController._lookAtTransform`（私有方法参数） | 私有；调用点传的都是内部 `Vector3`，外部永远传不进字面量 |
| `FPSController.#velocity`、`OrbitControls` 的局部 `let up` 等私有字段 / 局部变量 | 同上（B1 家族地图里约 1/3 是这类） |
| `PerspectiveCameraLogic.#unprojectRay` 的入参 / `getRay3D` 的 `ray3D` | 它们是 `Ray3` 而不是 `Vector` 系，不在本批放宽范围 |

**返回值一律不放宽**（同 §11.1）：`unproject` 传 `Vector3` 时仍返回 `Vector3`，传字面量时才返回字面量——靠重载而不是整体放宽来同时保住两者。

**关于 §11.2「未加类型重载」那条结论的更正**（复核后裁定）：TypeScript 的重载解析是「按实参匹配签名、返回类型取**匹配到的那一条**」，
所谓「重载的返回类型推断仍走最后一条签名」是把**实现签名**（implementation signature，不参与调用解析）的规则记串了。本批的 `Camera.unproject`
就是反例：`getScaleByDepth` 里 `lt.subTo(rb).length` 只用 3 个参数调用即可编译通过，说明它拿到的是**第一条重载**的 `Vector3`；新增用例也证明
传字面量时返回的就是那个字面量对象本身。所以 math 那 6 个 out 参数不加重量**不是**因为「重载无效」，而是「**当前无调用点受益**」——有了更好、没有也能活。

### 11.5 B6 实测：资产 MD5 / 拾取 / 光照场景 / ImageUtil（⑤⑥⑦⑧）

四类「剩余小家族」（B1 家族地图里除 Object3D/Transform、Camera、Controller、Geometry/Uniform 之外的 ⑤⑥⑦⑧）。
**调用点口径**：`packages/` + `examples/` + `test/` 下的 `.ts`（排除 `node_modules/`、`dist/`、生成产物、`.d.ts`）
里该符号**出现次数**（由 node 脚本统计，含声明文件内部实现与测试；B1 的粗估在本批同样不可靠——`Light.color`
正文未给数、实测赋值点 100+）。共 1212 个文件。

| 家族 | 放宽的声明 | 实测调用点 |
|---|---|---|
| ⑤ `MD5Anim` | `MD5FrameJoint.position` / `.absolutePosition`、`MD5Frame.bounds` 的 `min` / `max`、中间态 `BoundsDraft.min` / `max`（`Vector3` → `Vector3Like`） | `joint.position` 24、`joint.absolutePosition` 14、`bounds?.min\|max` 8、`boundsDraft.min\|max` 6、`baseJoint.position` 3 |
| ⑤ `MD5Mesh` | `MD5Joint.position` / `.localPosition` / `.absolutePosition`、`MD5Weight.position`、`MD5Vertex.position`（同上） | `joint.position`（含上表）、`joint.localPosition` 5、`weight.position` 5、`vertex.position` 9 |
| ⑥ `Raycaster` | `PickingCollisionVO.uv` / `.localPosition` / `.localNormal`（`Vector2` / `Vector3` → `Vector2Like` / `Vector3Like`） | 生产 3 处（`GeometryUtils.raycast` 的 `result.*`）、写 6 处（`Raycaster.pick` / `pickAll`）、构造 1 处（`Renderable.localRayIntersection`）、消费 6 处（`examples` 两个示例的 `hit.localPosition` / `hit.localNormal`） |
| ⑦ 光照 | `Light.color`（`Color3` → `Color3Like \| Color3`） | `color: { __type__: 'Color3'` 102 处 |
| ⑦ 场景 | `Scene.background` / `.ambientColor`（`Color4` → `Color4Like \| Color4`） | `background: { __type__: 'Color4'` 185 处、`ambientColor: ...` 117 处 |
| ⑧ `ImageUtil` | `drawLine(start, end)`（`Vector2` → `Vector2Like`） | 4 处（全在 `ImageUtil` 内部调用） |

**本次迁移到字面量的调用点：1 处**（`ImageUtil.drawImageCurve` 里的 `new Vector2(rect.x + i, …)` ×2 → `{ x, y }`）。
其余调用点**本来就是纯数据字面量**（颜色 / 背景 300+ 处，正是 B 要的形状，放宽后零改动）、
或传的是已有变量 / 需要 `Vector3` 实例的地方（`Renderable` 的 `localNormal` 是 `rayIntersection` 的 **out 实参**，
必须保留 `Vector3` 实例；`Raycaster` 两边赋的都是 `result.*`；MD5 的位置全部来自解析器自身）。

**保留清单（不放宽，理由）**：

| 保留项 | 理由 |
|---|---|
| `getMD5WeightPosition(weight, joint): Vector3`、内部 `assembleLocalPose(...): { position: Vector3; … }`、`accumulateAbsolutePoses(...)`、`blendVertexPosition(...)`、`computeJointTransforms(...)` | 返回类型即消费方 API（P8c）：`blendVertexPosition` 要拿结果用 `Vector3.addScaledVector` / `.divideNumber`；放宽后这些调用编译不过 |
| `Light.position` / `direction` / `shadowMapSize` 三个 getter | 与 B2 的 `LookAtController` 同形——字段类型即 getter 返回类型，**不存在「只放宽入参」的中间态** |
| `MD5Joint` / `MD5FrameJoint` 的 `orientation` / `localOrientation` / `absoluteOrientation` | 本批任务清单未列；放宽要连带把 `accumulateAbsolutePoses` 里的 `Quaternion.multTo` / `rotatePoint` 换掉（math 侧 `Quaternion` 的实例方法仍收 `Vector3` / `Quaternion`），留给下一批「Quaternion 参数族」一并做 |
| `GeometryUtils.raycast` 返回的内联对象类型（`localPosition: Vector3` 等） | 它是**生产方**不是调用点：`Vector3` 实例对消费方的 `Vector3Like` 字段是协变兼容，放宽只会白增一层 `Writable*Like` |
| `ImageUtil` 其余 `Vector2` 局部变量（`prepos` / `curpos` 等） | 是自增状态而非「构造点」，改成字面量需要连算法一起重写，没有收益 |

**本批发现的三处不一致 / 可疑**：

1. **`Light.color` / `Scene.background` / `ambientColor` 收的不是 `@feng3d/math` 的 class，而是本包的纯数据接口**
   （`core/Color3.ts` / `core/Color4.ts`：`__type__` 必填、`r/g/b(/a)` 可选）。因此「放宽」**不能**写成单一的 `Color3Like`
   ——`Color3Like` 的 `r/g/b` 是必填的，`{ __type__: 'Color3', r, g, b }` 字面量会因 **excess property check**
   （`__type__` 不在 `Color3Like` 里）被全部拒掉，反成**收窄**。只能用联合 `Color3Like | Color3`：math 的 class 实例
   与不带 `__type__` 的纯形状走前者，仓内 300+ 处既有字面量走后者。**既有调用点因此零改动**（B1 §11 ③ 行里
   「均匀一行放宽」的说法对这四个字段不成立）。
2. **`ForwardRenderer` 的 `u_sceneAmbientColor` 需要一处 `as Color4` 透传**：uniform 侧字段的类型归 B5
   （materials / uniform 家族），本批不动；断言保持了引用身份（响应式依赖与 wrapper 身份比较都依赖它），
   没有新建对象。B5 合并后若把 uniform 也放宽成 `Color4Like`，这处断言即可删掉。
3. **内部中间态 `BoundsDraft.min` / `max` 放宽后 `.clone()` 失效**（`Vector3Like` 没有类方法），
   `#buildResult` 已改成显式构造 `new Vector3(x, y, z)` 副本；运行期行为逐值不变（`bounds.min` 仍是 `Vector3` 实例）。
   另外 schema 生成器 `shapeOf()` 对联合类型取「第一个对象分支」判形状，所以 `Color3Like | Color3` 的
   `control` 仍是 `Color3`——重跑生成器后 18 处相关字段的 `control` **一个都没变**，只有 `type:` 文本变化。

**顺带记录（不动，仅登记）**：

- 仓库根目录的 `src/` 是**停滞快照**（方案 §2.1 已记，B3 也登记过），里面有一份同名旧实现
  （`src/core/utils/ImageUtil.ts` 的 `drawLine(start: Vector2, end: Vector2, color: Color4)`、
  `src/core/pick/Raycaster.ts` 等）。它**不在** `packages/` 门禁（lint / `types:packages` / vitest 都不覆盖），本批未动。
- 本 worktree 的 `npm install` 漏装了 `packages/editor` 声明的 `ws@8.22.0`，本地 `npm run build:packages` 因此在
  editor 的 `vite build`（加载 `vite.config.js`）处失败；`npm install --no-save ws@8.22.0` 后 19 个包全部构建通过。
  CI 走 `npm ci`，不受影响——**本地验收 `build:packages` 前先确认 `node_modules/ws` 存在**。

## 12. 需要同步的既有文档

| 文档 | 改动 | 时机 |
|---|---|---|
| [SERIALIZATION_MIGRATION.md](./SERIALIZATION_MIGRATION.md) | §2「构造器仅保留给数值容器」、§4 S1「数值容器仍走原有分支」、§6 风险表对应行 | 阶段 C 同批 |
| [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) | §3.1 R3 行的「排除 `@feng3d/math` 的同名 class 与 `packages/math` 包内」 | 阶段 C 同批 |
| [../AGENTS.md](../AGENTS.md) | §15 R3 执行者描述里的同一句豁免 | 阶段 C 同批 |
| 本文 | §11 进度表随每阶段更新 | 每阶段 |
