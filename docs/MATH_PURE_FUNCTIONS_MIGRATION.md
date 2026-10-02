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
（容差 0.5），而每个阶段新增的契约测试都会抬高 `math` 的覆盖率，从而触发它（A2b 就因为 75.3 → 75.8 差了 0.6 而红过一次）。
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
| **P8** | **测试全绿 ≠ 类型通过** | `quaternionOps.ts` 写了 `import type { Vector3Like } from './vector3Ops'`，而该类型并未从那里导出：vitest（esbuild 剥类型）**全绿**，`tsc` 才报 TS2459 | 「测试 + 覆盖率 + 类型 + lint」四项**都必须跑**：`npm run types:packages` 不能省（A2b 正是它拦下的），eslint 也拦不住这类错 |

## 11. 进度

| 阶段 | 状态 |
|---|---|
| 规划（本文） | ✅ 完成 |
| #134 第一步（Color3 纯函数层） | ✅ 完成：`color/color3Ops.ts`（`color3ToInt` / `color3Mix` / `color3Scale`），class 方法委托，行为逐字不变 |
| **移除 `@feng3d/serialization` 依赖** | ✅ 完成：13 个文件的 `@serialize` 与对应 import 全删、`package.json` 去掉该依赖；移除后全仓 2238 用例仍全绿（证据与推论见 §5.6） |
| A1 Vector3 自身运算 | ✅ 完成：新增 `geom/vector3Ops.ts`（`WritableVector3Like` + 常量 + 纯函数，751 行），`Vector3.ts` 的实例/静态方法体改为委托（1412 行 → 约 1255 行）；新增 `test/geom/vector3Ops.spec.ts` 10 个契约用例（含可失败性验证）；math 既有 43 个 spec **一行未改**全绿 |
| A1 有意保留、未委托的方法 | ⬜ 待 A3/阶段 C：`Project` / `ProjectOnPlane` / `ClampMagnitude` / `MoveTowards`（退化分支返回**共享对象**，见 §5.3）、`Min` / `Max`（`Mathf.Min` 是 `a<b?a:b`，与 `Math.min` 的 NaN 语义不同）、`SmoothDamp*`（多输出且读 `Time.deltaTime`，见 §5.2）——均已在源码注释标注 |
| A1 跨类型方法 | ⬜ 待 A3：`applyMatrix4x4` / `applyQuaternion` / `crossmat` / `toVector2` / `toVector4` / `fromVector2` 仍留在 class 内用原实现 |
| A2a Color3 / Color4 | ✅ 完成：`color/color3Ops.ts` 补齐到 13 个函数、新增 `color/color4Ops.ts`（17 个函数），两个 class 的方法体全部委托；新增 `test/colorOps.spec.ts` 11 个契约用例；全仓 2249 用例通过 |
| A2b Quaternion | ✅ 完成：新增 `geom/quaternionOps.ts`（30 个函数），`Quaternion.ts` 方法体全部委托（含 `fromEuler` 六种旋转序）；新增 `test/geom/quaternionOps.spec.ts` 11 个契约用例 |
| A2c Matrix3x3 / A2d Matrix4x4 / A2e Vector2 / A2f Vector4 | ✅ 完成（PR #517）：四个纯函数层（21 + 63 + 33 + 33 个函数，共约 3600 行）+ 105 个契约用例；顺带修掉 Matrix4x4 `toTRS` 与 Vector4 一批公共方法的**返回类型退化** |
| A2g Segment3 / A2h Line3 | ✅ 完成（PR #513、#515）：`segment3Ops`（14 函数）+ `line3Ops`（11 函数）+ 17 个契约用例；`Line3.getPointWithZ` 的返回类型退化也是在这批修的 |
| A2i–A2l 几何类型（Box3 / Plane / Triangle3 / Euler） | 🔶 进行中（四个并行 worktree） |
| A2m–A2p 其余几何（Rectangle / Sphere / Frustum / Ray3） | ⬜ 未开始（Sphere 依赖 Box3+Plane、Frustum 依赖 Plane+Sphere+Box3，按序推进） |
| A3 跨类型函数 | ⬜ 未开始 |
| B 调用点迁移 | ⬜ 未开始 |
| C 删除 class + 引入带 `__type__` 的接口 + 门禁 + 文档同步 | ⬜ 未开始 |
| 第二批（Curve / Gradient 家族） | ⬜ 未开始（范围与方案待定，见 §8） |

## 12. 需要同步的既有文档

| 文档 | 改动 | 时机 |
|---|---|---|
| [SERIALIZATION_MIGRATION.md](./SERIALIZATION_MIGRATION.md) | §2「构造器仅保留给数值容器」、§4 S1「数值容器仍走原有分支」、§6 风险表对应行 | 阶段 C 同批 |
| [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) | §3.1 R3 行的「排除 `@feng3d/math` 的同名 class 与 `packages/math` 包内」 | 阶段 C 同批 |
| [../AGENTS.md](../AGENTS.md) | §15 R3 执行者描述里的同一句豁免 | 阶段 C 同批 |
| 本文 | §11 进度表随每阶段更新 | 每阶段 |
