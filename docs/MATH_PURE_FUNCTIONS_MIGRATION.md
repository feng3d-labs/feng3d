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
| [Segment3Like（原 `Segment3.ts:42`）](../packages/math/src/geom/segment3Ops.ts) | `p0: Vector3` / `p1: Vector3`（C-c 起是 `Vector3Like`） |

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
   所有数值类型的第二道机器保障（不依赖名单）。
   **C1 已交付其中「19 个目标类型」那一版**（`scripts/check-math-no-class.mjs` + `scripts/math-no-class-baseline.json`；
   进 CI 的方式见 §11.7.1——挂在 `prelint:ci` 钩子上随 `npm run lint:ci` 跑，因为改 `.github/workflows/ci.yml`
   需要 `workflow` scope 的凭据而本仓推送凭据没有）。
   判据名单**写死在脚本里**、刻意不用「所有 `export class`」：math 全树 50 个 `export class` 里有 31 个
   （28 个第二批 + `Mathf`/`Noise`/`Time`）不在本方案范围，用全量当判据会一次误伤它们（实测与破坏性验证见 §11.7.1）。
   「全量版」（含第二批）要等第二批方案定下来再说；
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
7. 「math 内禁止新增 class」门禁已进 CI（第 2 条的全仓归零由此守住）——**C1 交付的是「19 个目标类型」那一版**
   （`check-math-no-class.mjs`，走 `prelint:ci` 钩子随 `npm run lint:ci` 进 CI，见 §11.7.1；基线归零即这些类型全数去 class）。
   `packages/math/src` 内 `export class` 的**全量**白名单化要等第二批（曲线 / 形状 / 渐变）方案定下来，本方案不承诺；
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
| A2a Color3 / Color4 | ✅ 完成：`color/color3Ops.ts` 补齐到 12 个函数、新增 `color/color4Ops.ts`（17 个函数），两个 class 的方法体全部委托；新增 `test/colorOps.spec.ts` 11 个契约用例；全仓 2249 用例通过（**C1 更正**：原先写的「13 个函数」与实际不符，`05eba503b` 当时就是 12 个，见 §11.7.2） |
| A2b Quaternion | ✅ 完成：新增 `geom/quaternionOps.ts`（30 个函数），`Quaternion.ts` 方法体全部委托（含 `fromEuler` 六种旋转序）；新增 `test/geom/quaternionOps.spec.ts` 11 个契约用例 |
| A2c Matrix3x3 / A2d Matrix4x4 / A2e Vector2 / A2f Vector4 | ✅ 完成（PR #517）：四个纯函数层（21 + 63 + 33 + 33 个函数，共约 3600 行）+ 105 个契约用例；顺带修掉 Matrix4x4 `toTRS` 与 Vector4 一批公共方法的**返回类型退化** |
| A2g Segment3 / A2h Line3 | ✅ 完成（PR #513、#515）：`segment3Ops`（14 函数）+ `line3Ops`（11 函数）+ 17 个契约用例；`Line3.getPointWithZ` 的返回类型退化也是在这批修的 |
| A2i–A2l 几何类型（Box3 / Plane / Triangle3 / Euler） | ✅ 完成（PR #521）：`box3Ops` / `planeOps` / `triangle3Ops` / `eulerOps` 四个纯函数层落地，对应 class 的方法体改为委托；`Triangle3` 的跨类型方法后来挪到 A3 批（见下） |
| A2m–A2p 其余几何（Rectangle / Sphere / Frustum / Ray3） | A2m / A2n / A2o ✅ 完成：`rectangleOps`（PR #521）、`sphereOps` 与 `frustumOps`（PR #524，依赖按序推进）；**A2p（Ray3）不需要单独批次** —— `Ray3.ts` 实测只有 **9 行且类体为空**（`export class Ray3 extends Line3 {}`），**没有任何自有成员**，因此**不设 `ray3Ops.ts`、按 `Line3` 类型别名处理**（复用 `Line3Like` / `line3Ops`；`Line3` 的 class 删掉时它就变成一行 `export type Ray3 = Line3;`）。**C1 更正**：此处原先记的「`ray3Ops.ts` 尚不存在，`Ray3` 仍是原实现」把「缺函数」当成了欠账——实际缺的只是类型名决策，纯函数层（`Ray3Like` / `WritableRay3Like` / `mat4TransformRay`）早在 `matrix4x4Ops.ts` 里，详见 §11.7.8 的 N1 / §11.7.7 的 `Ray3` 行 |
| A3 跨类型函数 | ✅ 完成（PR #527、#525）：`Line3.applyMatri4x4`（→ `mat4TransformPoint3` / `mat4TransformVector3`）；`Vector3` 的 `applyMatrix4x4` / `applyQuaternion` / `crossmat` / `toVector2` / `toVector4` / `fromVector2`（→ `mat4TransformPoint3` / `quatVmult` / `mat3Set` / 新增的 `vec3ToVec2` / `vec3ToVec4` / `vec2ToVec3`）；`Vector4.applyMatrix4x4`（→ `mat4TransformVector4`）；`Triangle3` 的 `getPlane3d` / `closestPointWithPoint` / `distanceWithPoint` / `distanceSquaredWithPoint` / `static containsPoint`（→ `planeFromPoints` / 新增的 `tri3ClosestPointWithPoint` 系列 / `tri3OnWithPoint`）；`Matrix3x3` 的 `formMatrix4x4` / `toMatrix4x4`（→ `mat3FromMatrix4x4` / `mat3ToMatrix4x4`，由 #525 单独交付）。类型归属调整 **已完成**（`PlaneLike` 见 A2j、`Matrix3x3Like` 本批从 `matrix4x4Ops.ts` 的临时声明改引 `matrix3x3Ops.ts`，两处都保留 type-only 重导出；**`Vector4Like` / `WritableVector4Like` 当时仍是双定义**，B1 已收口，见 P9）。新增 `test/geom/a3CrossTypeOps.spec.ts` 21 个契约用例。<br><br>**A3 之后仍留在 class 内的成员**（**划归阶段 C**，不是欠账）：`Line3.intersectWithLine3D`、`Segment3` 的 `getLine` / `intersectionWithLine` / `intersectionWithSegment` / `closestPointWithPoint`、`Triangle3` 的 `intersectionWithLine` / `intersectionWithSegment` / `decomposeWith*`——返回值都是 `Line3 \| Segment3 \| Vector3 \| null` 这类**联合类型 + `instanceof` 判别**，或需要**装配回 class 实例**（纯函数层只产普通字面量，装回去会丢 `Vector3` 原型），纯函数化要等阶段 C 的 `__type__` 判别字段与构造器收口；`Triangle3.decomposeWithPoint` 还额外要求「顶点就是原对象」的引用语义。**`line3Ops` 自 A2h 起就已就绪，从来不是这些方法的阻塞点**（此前注释写成「依赖 Line3 尚未纯函数化」，已于本批更正）。均已在各自方法上加注释说明，**不为凑数强行翻译**。<br>**C-a 更新**：`Line3.intersectWithLine3D` / `Segment3.intersectionWithLine` / `Triangle3.intersectionWithLine` 三个已纯函数化（见 §11.9），剩下 `getLine` / `intersectionWithSegment` / `closestPointWithPoint` / `decomposeWith*` 仍留在 class 内
③ **B 后续批次的前置障碍（B1 实测，口径：`packages/feng3d/src` 内 `标识符: Vector2|3|4 / Color3|4` 形式的声明，不含 getter 返回类型）**：`feng3d` 公共 API 里**仍是 class 类型**的字段/参数标注 **99 处**，改成 `*Like` 的 **0 处**——即「放宽」这一步在 `feng3d` 侧**一次都还没做过**。被外部构造点直接赋值/传参、因而必须放宽的高频项：`Object3D.lookAt(target, upAxis?)`（11 处调用点）、`Camera.project` / `#unprojectPoint(point3d: Vector3)`（4 处）、`TransformLayout` 的 `position/size/leftTop/rightBottom/anchorMin/anchorMax/pivot`（8 处声明）、`PointGeometry.color/uv`、`SegmentGeometry.startColor`、`OutLine.color`、`Wireframe.color`、`Raycaster` 的 `localPosition/localNormal/uv`、`Uniform.ts` 的 15 处 `u_*` uniform 字段（新增 `Vec3`/`Color4` 字面量的旧渲染路径）。**放宽是纯放开**（class 实例结构上满足 `*Like`，既有调用点不受影响），所以每处都是一行声明改动，**牵连面 = 该字段/参数的调用点数**；后续批次宜**按 API 分批**（如「Object3D/Transform 家族」「Camera 家族」「Geometry/Uniform 家族」），而不是按包分批 |
| B 调用点迁移 | ✅ 完成（B1–B7 七个批次，B7 是本阶段最后一个欠账）：**B1 = terrain 首批试水**（PR #531）——先补 B 的硬前置：`index.ts` 导出 17 个 `*Ops` 模块（阶段 A 只写了函数、没从入口导出，B 原本 `import` 不到），并收口 `Vector4Like` 双定义（P9）；再迁移 `packages/terrain` 的 **10 处** class 构造（`new Vector2/3/4` 9 处 + `new Color4` 1 处）为纯数据字面量 / 纯函数。B1 **未撞上任何 feng3d 签名障碍**，因为那三处恰好都不经过 feng3d 的 class 类型收窄：`TerrainMergeMethod` 的 8 处走 `(renderObject as any).uniforms`（且该类已无调用方）、`TerrainData.size` 是 terrain 自身字段、`Color4` 传给**在 #134 之前就已放宽**的 `ImageUtilColorLike`。**B2（Object3D / Transform 家族）**——把 `Matrix4x4.lookAt`、`Object3DLogic.lookAt`、`TransformLayout` 七个字段放宽为 `Vector3Like`，并迁移仓内全部调用点到字面量（实测清单与下一批候选见 §11.1）；**B3（`Matrix4x4` 的 Vector3 参数族）**——把 `Matrix4x4` 里 **17 个纯入参**放宽为 `Vector3Like`，**out / 返回形态一律不动**（实测清单与保留清单见 §11.2）；**B4（Camera + Controller 家族）**——`project` / `getScaleByDepth` 的入参与 `CameraUniforms.u_cameraPos` 放宽为 `*Like`，`unproject` 的第 4 个 out 参数加类型重载，`LookAtController` 的 getter 用「字段留 class + setter 内部转换」保住 `Vector3` 返回类型（实测清单与保留清单见 §11.4）；**B5（Geometry / Material / Uniform 家族 + `setAxisX|Y` 补漏）**——放宽 **23 处** `@feng3d/math` 类型声明（`Uniform.ts` 10 + `Cartoon`/`OutLine`/`Wireframe` 8 + `setAxisX|Y` 2 + `u_lightPosition` 3），实测**可迁移调用点只有 1 处**，并校正了「清单 42 处里近半不是 math 类型」的口径（实测清单、保留清单与两套 `Color4` 的不可互换证据见 §11.3）；**B6（剩下的四个小家族 ⑤⑥⑦⑧）**——资产 MD5（`MD5Anim` / `MD5Mesh` 的位置类字段）、拾取（`PickingCollisionVO` 的 `uv` / `localPosition` / `localNormal`）、光照与场景（`Light.color`、`Scene.background` / `ambientColor`）、`ImageUtil.drawLine` 的端点，一律放宽为对应的 `*Like`；其中三个颜色字段**收的不是 math 的 class**而是本包的纯数据接口，故改用联合 `Like \| 原接口`（实测清单、保留清单与两处不一致见 §11.5）；**B7（`Quaternion` 参数族，B 的最后一个欠账）**——把 `Quaternion` 的 **7 处纯入参**（`fromAxisAngle` / `fromUnitVectors` / `integrate` / `integrateTo` / `rotatePoint` / `vmult` / `multiplyVector`）放宽为 `Vector3Like`，连带把 MD5 的 **6 个朝向字段**（`MD5FrameJoint.orientation` / `absoluteOrientation`、`MD5Joint.orientation` / `localOrientation` / `absoluteOrientation`）放宽为 `QuaternionLike`；out 参数一律保留，`Quaternion` 类型的入参实测无收益也一并保留（实测清单、保留清单与四处不一致见 §11.6）。**B7 合入即 B 的欠账清零** |
| C 删除 class + 引入带 `__type__` 的接口 + 门禁 + 文档同步 | 🔶 阶段 **C1 已完成**：① 新增门禁 `scripts/check-math-no-class.mjs` + 基线 `scripts/math-no-class-baseline.json`（挂在 `prelint:ci` 钩子上随 `npm run lint:ci` 进 CI——改 workflow 文件需要 `workflow` scope 凭据，见 §11.7.1）——拦住 19 个目标类型新增 `export class`，判据名单刻意写死、不用「所有 export class」（否则误伤 31 个第二批 / 不做的类）；② 产出 **19 个目标类型的完整清单 + 引用面实测 + 6 批删除顺序 + 逐类型前置条件 + 明确不在范围的 31 个类**（见 §11.7，含四次破坏性 / 反向验证）；③ 定案 **`Ray3` 按 `Line3` 类型别名处理**（无自有成员、不设 `ray3Ops.ts`，删除时机与 `Line3` 绑定）。**本批不改任何 class。** 未开始：同名接口替换、`SCAN_DIRS` 纳入 math、资源迁移、R3 豁免收回、三处既有文档同步（§12）——以及 §11.7.8 登记的其余发现（非目标批次也是目标类型的消费者、`Vector3Like` 定义位置、`Serialization` 的 `constructor` 比对等）。另有**一项已登记欠账**：编辑器模板里随包分发的 `packages/editor/resource/template/libs/feng3d.d.ts` 打包快照仍是旧声明，见 §7 C 第 10 条 |
| 第二批（Curve / Gradient 家族） | ⬜ 未开始（范围与方案待定，见 §8） |
| **C-a 零内依赖叶子（Euler / Rectangle / TriangleGeometry）** | ✅ 完成（见 **§11.9**）：① 三个 class 删除，改为**带 `readonly __type__` 的纯数据接口**（`Euler` 进 `eulerOps.ts`、`Rectangle` 进 `rectangleOps.ts`、`TriangleGeometry` 进**新建**的 `triangleGeometryOps.ts`），`*Like` / `Writable*Like` 保持不带判别字段（A / B 阶段放宽过的签名不回头加字段）；② 调用点全部迁移，实测 `new <三类型>(` 由 **119 处 → 0**（math/src 6 + math/test 104 + 外部 9——**外部 9 = feng3d 的 5 处 `.ts` + editor 的 4 处 `.vue`**，C1 的清单只扫了 `.ts`）；③ 门禁基线 `19 → 16`（`check-math-no-class.mjs --update` 后 `--check` 通过）；④ **P5 前置（C1 没排进本批）**：新建 `intersectionOps.ts` 收 `Line3.intersectWithLine3D` / `Segment3.intersectionWithLine` / `Triangle3.intersectionWithLine`（结构化判别替代 `instanceof`，class 侧委托 + 装配回实例），并抽出 `box3ToTriangles`；`instanceof` 在 math/src 由 8 处降到 4 处；⑤ **序列化侧专项验证结案**（P3 / N4）：带 `__type__` 的纯数据对象走「处理普通Object」分支，**到不了** `Serialization.ts` 的 `obj.constructor` |
| **C-b 颜色（Color3 / Color4）** | ✅ 完成（见 **§11.10**）：① 两个 class 删除，接口落在各自的 ops 文件（`color/color3Ops.ts` 的 `Color3`、`color/color4Ops.ts` 的 `Color4`，都带 `readonly __type__`），`ColorKeywords` 从 `Color3.ts` 一并搬进 `color3Ops.ts`，`index.ts` 去掉 `export * from './Color3'` / `'./Color4'`；② **调用点实测 76 处 → 0**（`new` 68 处 = math/src 25 + math/test 32 + 外部 11；另 8 处非 `new` 的调用点：`Color4Math.WHITE` 1、粒子颜色实例方法 4、editor 脚本模板 2、`Color3.prototype.toColor4` 原型补丁 1）；③ 门禁基线 `16 → 14`；④ **两套颜色体系本批不合流**（决策与理由见 §11.10.3），`Color3Like \| Color3` / `Color4Like \| Color4` 的联合过渡沿用；⑤ 覆盖率表 `math` 行按实测更新（69/78 → 67/76） |
| **C-c 几何叶子（Frustum / Sphere / Triangle3 / Segment3）** | ✅ 完成（见 **§11.11**）：① 四个 class 删除，接口落在各自的 ops 文件（`frustumOps.ts` / `sphereOps.ts` / `triangle3Ops.ts` / `segment3Ops.ts`，都带 `readonly __type__`），`index.ts` 去掉四行 `export *` 且**不新增任何 `export *`**（消费方 `import { Sphere } from '@feng3d/math'` 一字不改）；② **调用点实测**：四个类型的 `new` 由 **96 处 → 0**（math/src 14 + math/test 78 + 外部 4），另有一批**方法调用点**（`frustum.intersectsBox` × 4、`segment.getPointDistance` / `getNormalWithPoint` × 4、`segment.p0.equals` / `p1.subTo(p0).normalize()` / `p0.addTo(...)`、`triangle.getNormal()` / `rasterizeCustom()` 等），它们**不 import 类型名**、只能靠编译与实测发现（C1 台账看不见）；③ 门禁基线 `14 → 10`；④ **P5 前置**：`Segment3.intersectionWithSegment` / `Triangle3.intersectionWithSegment` / `decomposeWith*` 全部纯函数化，**math/src 的 4 处可执行 `instanceof` 全部消失**（结构化判别 `'p0' in r`，与 C-a 同款；`instanceof Vector3` 那三处随 class 删除一并消解）；⑤ `box3Ops` 收跨类型 `box3IntersectsSphere` / `box3IntersectsTriangle`（含原 `Box3.ts` 的私有 `satForAxes`）；⑥ 顺带收口 A3 的两处保留（`Segment3.getLine` → `seg3GetLine`、`closestPointWithPoint` → `seg3ClosestPointWithPoint`）；⑦ 覆盖率表按实测更新 |
| **C-d 线族（Line3 / Ray3）** | ✅ 完成（见 **§11.12**）：① `Line3` 的 class 删除，接口落在 `line3Ops.ts`（带 `readonly __type__: 'Line3'`），`index.ts` 去掉 `export * from './geom/Line3'`；`Ray3.ts` 变成一行 `export type Ray3 = Line3;`（**类型别名**，不进面板类型表），`Ray3Like` / `WritableRay3Like` 的重复定义收成对 `line3Ops` 的类型别名；② **硬前置**：`Plane.ts` 的 `declare global MixinsLine3` + `Line3.prototype.getPlane` 原型补丁整段删除，纯函数落 **`planeOps.planeFromLine3`**（与 `line3IntersectWithLine3D` 内部的私有 `planeOfLine` 合并成一处，`Math.random()` 消费顺序逐字不变）；③ **调用点实测 `new` 31 → 0**（`Line3` 20 = math/src 6 + math/test 14；`Ray3` 11 = math/src 1 + 外部 10），另有一批只能靠编译发现的方法调用点（相机 6、`Box3.rayIntersection` 形参放宽 3、`GeometryUtils` 标注 2、editor `MouseRayTestScript` 2、math 测试 11）；④ 门禁基线 `10 → 8`；⑤ `Box3.rayIntersection` 的 `position` / `direction` 放宽为 `Vector3Like`（返回类型未退化）；⑥ `gen-objectview-schema` 产物 73/398 → **74/400**（+`Line3`），编辑器产物已重生成；⑦ 覆盖率表 math 行按实测更新（63/72 → 62/71）；⑧ `Line3.spec.ts` 删除、`line3Ops.spec.ts` / `planeOps.spec.ts` / `a3CrossTypeOps.spec.ts` / `Plane.spec.ts` 相应改写 |

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
| `MD5Joint` / `MD5FrameJoint` 的 `orientation` / `localOrientation` / `absoluteOrientation` | 本批任务清单未列；放宽要连带把 `accumulateAbsolutePoses` 里的 `Quaternion.multTo` / `rotatePoint` 换掉（math 侧 `Quaternion` 的实例方法仍收 `Vector3` / `Quaternion`），留给下一批「Quaternion 参数族」一并做 → **已由 B7 处理**（见 §11.6；实测发现需要换的是 `MD5Mesh.getMD5WeightPosition`，`accumulateAbsolutePoses` 本身不用改） |
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

### 11.6 B7 实测：`Quaternion` 参数族 + MD5 朝向字段（B 的最后一个欠账）

**口径**：`packages/` + `examples/` + `test/` 下的 `.ts`（排除 `node_modules/`、`dist/`、生成产物、`.d.ts`），
共 **1214** 个文件；「调用点」= `.方法名(` 的出现次数（脚本实测，含包内实现与测试）；
**同名但不同类的 API 不计**——`Matrix3x3` 也有 `vmult` / `rotatePoint` / `lerp`，已按接收者人工剔除（见本节末第 3 条）。

**放宽清单（`Quaternion` 的 7 处纯入参，`Vector3` → `Vector3Like`）**
（`Vector3` 实例在结构上满足 `Vector3Like`，既有调用点零改动）：

| API（`packages/math/src/geom/Quaternion.ts`） | 放宽的参数 | 消费方调用点 | math 内调用点 |
|---|---|---|---|
| `fromAxisAngle` | `axis` | 0 | 32 |
| `fromUnitVectors` | `u` / `v` | 0 | 4 |
| `integrate` | `angularVelocity` / `angularFactor` | 0 | 5 |
| `integrateTo` | `angularVelocity` / `angularFactor`（`target` 不动） | 0 | 1 |
| `rotatePoint` | `point` | **6**（MD5 四文件） | 10 |
| `vmult` | `v` | 0 | 14（其中 8 处是 `Matrix3x3.vmult`） |
| `multiplyVector` | `vector` | 0 | 2 |

**连带放宽（MD5 的 6 处朝向字段声明，`Quaternion` → `QuaternionLike`）**：

| 接口 | 放宽的字段 | 实测出现次数 |
|---|---|---|
| `MD5FrameJoint`（`MD5Anim.ts`） | `orientation` / `absoluteOrientation` | `orientation` 全仓 75 次（MD5 四文件 73 + `webvr_cubes.ts` 2 处非 MD5）、`absoluteOrientation` 15 次 |
| `MD5Joint`（`MD5Mesh.ts`） | `orientation` / `localOrientation` / `absoluteOrientation` | `localOrientation` 5 次 |

**本次迁移到字面量的调用点：0 处**——放宽的 7 个方法里消费方只有 `rotatePoint`（6 处），
传的全是 `Vector3` / `Quaternion` 变量或已放宽字段，**没有可改的字面量**（不为凑数而改）；
MD5 的 6 个字段本来就是解析器自身产出。

**连带适配（4 处，全是「字段放宽后实例方法消失」的必然结果）**：

| 位置 | 改法 |
|---|---|
| `MD5Mesh.getMD5WeightPosition`（生产代码 1 处） | `joint.absoluteOrientation.rotatePoint(...)` → 纯函数 `quatRotatePoint(joint.absoluteOrientation, weight.position)` + 显式构造 `Vector3`；**返回类型仍是 `Vector3`**（P8c），`blendVertexPosition` 的 `.addScaledVector` / `.divideNumber` 不受影响 |
| `MD5Anim.spec.ts` 的独立累乘实现 | 同上改 `quatRotatePoint` |
| `MD5Mesh.spec.ts` 的独立累乘实现 | `joint.localOrientation.clone()` / `.multTo(...)` → 新增 `toQuaternion()` 辅助（与既有 `toVector3()` 对称）后走 class 实例方法 |
| 两处契约用例 | 顺带把 `new Quaternion()` 换成纯字面量 `{ x, y, z, w }`，并断言**解析结果运行期仍是 `Quaternion` 实例** |

**保留清单（不放宽，理由）**：

| 保留项 | 理由 |
|---|---|
| 6 个 out 参数：`toAxisAngle(targetAxis)` / `multiplyVector(target)` / `rotatePoint(target)` / `integrateTo(target)` / `vmult(target)` / `slerpTo(out)` | 参数类型即返回类型，放宽会让返回从 `Vector3` / `Quaternion` 退化为 `Writable*Like`（P8c）；**未加类型重载**的理由同 B3——不是「重载无效」（B4 已证伪），而是「当前无调用点受益」 |
| `Quaternion` 类型的入参：`mult` / `multTo` / `slerp` / `slerpTo(qb)` / `lerp` / `copy` / `equals` | 实测**无收益**：① 消费方（MD5）在字段放宽后静态类型是 `QuaternionLike`，**没有** `multTo` 这些方法，只能改走纯函数，放宽方法签名帮不上；② `slerpTo` 放宽 `qb` 还得顺手改掉 `if (qb === out) qb = qb.clone()`（`QuaternionLike` 无 `clone()`），属「为放宽而改实现」；③ 全仓无一处给它们传纯数据字面量 |

**本批发现的四处不一致 / 可疑**：

1. **题面预判的「`accumulateAbsolutePoses` 里 `Quaternion.multTo` 调用点适配」实测不成立**：该函数的入参/返回类型是**内部中间态**
   `readonly { position: Vector3; orientation: Quaternion }[]`，而 `assembleLocalPose` 产出的就是 class 实例；
   只放宽**公共接口字段**时，实例可零包装地流进放宽后的字段（协变），于是 `multTo` / `rotatePoint` 的接收者仍是 `Quaternion`。
   B6 保留清单里「放宽要连带把 `Quaternion.multTo` / `rotatePoint` 换掉」的预判因此**在 MD5Anim 侧不成立**，
   真正需要换的是 **`MD5Mesh.getMD5WeightPosition`**（它的 `joint` 形参就是公共接口 `MD5Joint`，字段放宽后 `absoluteOrientation` 就没有 `rotatePoint` 了）。
   另一条路（中间态一并放宽、产出点显式构造实例）同样能过编译，但会让 `MD5FrameJoint.absoluteOrientation` 的
   **运行期类型**从 `Quaternion` 退化为普通字面量；本批选了**运行期零变化**的那条，并由 spec 断言守住
   （`check-strict-dirs` 的实测差异只有 3 条，全在 spec：`MD5Anim.spec.ts:218`、`MD5Mesh.spec.ts:130` / `:136`）。
2. **schema 生成器重跑**：6 个朝向字段的 `type` 文本 `Quaternion` → `QuaternionLike`，`control` 仍是 `Vector4`
   （与 B6 对 `Vector3Like` 的观察一致）——`packages/editor/src/vue-app/objectview/generated/dataTypeSchema.ts` **只此 6 行**变化。
3. **「按符号计数」在本族会大幅误报**（继 B1 的 `lookAt` 估 11 实测 30、B3 的 `transformPoint3` 估 10 实测 37 之后**第三种偏差形态**——同名不同类的干扰）：
   `.lerp(` 全仓 11 处里只有 3 处是 `Quaternion.lerp`（其余是 `Vector2` / `Vector4` 的、`mathUtil.lerp`、`MinMaxCurve` 的实现）；
   `.copy(` 全仓 **110 处里没有一处**是 `Quaternion.copy`；`.vmult(` 14 处里 8 处是 `Matrix3x3.vmult`。
4. 顺带登记（不动）：`examples/src/vr/webvr_cubes.ts` 里也有 `.orientation`（VR 姿态），与 MD5 无关，脚本统计时已人工剔除；
   `MD5Mesh.ts` 内部的 `JointDraft` / `JointTransform` 仍是 class 类型（解析中间态），**不在放宽范围**；
   `Quaternion.slerpTo` 在 `qb === out` 时把 `qb` 静默换成 clone（`QuaternionLike` 化之后这条路径的可读性更差），属既有实现，本批未动。

### 11.7 C1 产出：目标类型完整清单、引用面实测与删除顺序

> ⚠️ **本节是 C1 的快照（19 个类型都还在的时候测的）**。自 **C-a** 起 `Euler` / `Rectangle` /
> `TriangleGeometry` 三个 class 已被删除、**C-b** 起 `Color3` / `Color4` 两个也已删除，
> **C-c** 起 `Frustum` / `Sphere` / `Triangle3` / `Segment3` 四个也已删除，
> **C-d** 起 `Line3` / `Ray3` 两个也已删除（`Ray3` 是 `Line3` 的类型别名），
> 基线已收紧到 **8**；受影响的行（§11.7.2 的 `Euler` / `Rectangle` / `TriangleGeometry` /
> `Color3` / `Color4` / `Line3` / `Ray3` 七行、§11.7.6 的 C-a / C-b / C-c / C-d 四行、
> §11.7.7 的 P1 / P2 / P4 / P5 与 `Color3` / `Color4` / `Ray3` / `Line3` 特有条件行、
> §11.7.8 的 N1 / N4）已就地更新为**各批之后的状态**，
> 其余数字仍是 C1 快照。C-a 的完整产出与实测见 **§11.9**，C-b 见 **§11.10**，C-c 见 **§11.11**，
> C-d 见 **§11.12**。

> **本批（C1）不改任何 class，只交付两件事**：① 一条能拦住「math 里新增数值 / 几何 class」的门禁（已进 CI）；
> ② 19 个目标类型的完整清单、引用面实测与删除顺序。
> 下面所有数字都是**脚本实测**（剔除注释行；口径逐列写明），**不是估算**——B1 / B3 / B5 三轮都证明估数不能用于排期。

**数据口径（三步，可复现）**：① 去掉块注释与行注释；② 对 19 个目标标识符，按 `import` **来源**归类为
「`@feng3d/math` 直接导入 / `feng3d` 桶导入 / 本包自有同名 / 无 import」；③ 逐文件解析相对 `import` 求 math 内部依赖图。
`new` / `instanceof` 只在剩余**可执行代码**里计数（B1 的 42 处声明里有 17 处不是 math 类型，就是被「看名字不看来源」坑的，见 §11.3）。

#### 11.7.1 门禁：`scripts/check-math-no-class.mjs` + `scripts/math-no-class-baseline.json`

| 项 | 内容 |
|---|---|
| 判据 | `packages/math/src` 全树里，**写死在脚本中的 19 个目标类型**不得新增 `export class` |
| 为什么不用「所有 `export class`」 | math 全树实测 **50 个** `export class` = 19 个目标 + **28 个第二批**（曲线 / 形状 / 渐变 / 字体，§8）+ **3 个不进本方案**（`Mathf` / `Noise` / `Time`）。用全量当判据会**一次误伤 31 个**不该动的类，门禁第一天就是红的，且把 C 的爆炸半径从 19 扩到 50 |
| 键值 | `「相对路径::类型名」→ 出现次数`（照 `check-imperative-construction.mjs`：**不含行号**——行号随无关改动漂移会让门禁频繁误报；**保留次数**——否则同文件同类型新增第二处会被漏掉） |
| 模式 | 存量冻结 + **新增即失败**；每删掉一个目标类型跑 `node scripts/check-math-no-class.mjs --update` 收紧基线，`entries` 为空即「math 里再无数值 / 几何 class」 |
| 扫描范围 | 整个 `packages/math/src`（不是固定文件清单）——把目标类型搬进新文件、或在别的文件里再写一份，都会成为**新键**被拦下 |
| CI | **挂在根 `package.json` 的 `prelint:ci` 钩子上**（`npm run lint:ci` 会自动先跑它），而 `.github/workflows/ci.yml` 的质量门禁 job 第一步就是 `npm run lint:ci`——所以它随那一步进 CI。**为什么不直接写进 `ci.yml`**：改 workflow 文件需要 `workflow` scope 的凭据，本仓推送凭据只有 `repo` / `gist` / `read:org`，GitHub 会直接拒收（实测 `refusing to allow an OAuth App to create or update workflow ... without workflow scope`）。这不是绕路——`scripts/check-examples-imports.mjs` 挂 `prelint:examples` 是同一个原因（[CI.md](./CI.md) §2.1 末尾有记载）。等有 `workflow` scope 时，把 `- name: math 数值 / 几何类型禁止新增 class（issue #134 阶段 C1）` / `run: node scripts/check-math-no-class.mjs` 一步并列加到 R3 那步之后即可，**脚本本身无需改动** |

**明确不在范围（31 个，后来人不要扩大化）**——它们**不是**「数值 / 几何类型」，不在本方案 §8 的第一批里，
**不删、不做门禁判据、不改它们的实现**（只有它们**引用**目标类型时，才随目标类型的删除改调用点，见 §11.7.5）：

| 归类 | 类型（`packages/math/src` 里的 `export class`） |
|---|---|
| 曲线 / 贝塞尔（18） | `Bezier`、`EquationSolving`、`HighFunction`、`AnimationCurve`、`AnimationCurveVector3`、`BezierCurve`、`MinMaxCurve`、`MinMaxCurveVector3`、`ArcCurve2`、`CatmullRomCurve3`、`CubicBezierCurve2`、`CubicBezierCurve3`、`EllipseCurve2`、`LineCurve2`、`LineCurve3`、`QuadraticBezierCurve2`、`QuadraticBezierCurve3`、`SplineCurve2` |
| 形状 / 路径 / 字体（8） | `Curve`、`CurvePath`、`Font`、`Interpolations`、`Path2`、`Shape2`、`ShapePath2`、`ShapeUtils` |
| 渐变（2） | `Gradient`、`MinMaxGradient` |
| §8 明确「不进本方案」（3） | `Mathf`、`Noise`、`Time` |

（曲线 / 形状 / 渐变共 **28 个** + `Mathf`/`Noise`/`Time` **3 个** = **31 个**；19 目标 + 31 非目标 = math 全树 **50 个** `export class`。
`node scripts/check-math-no-class.mjs --stats` 会把这份边界原样打出来。）

**与 R3 门禁的分工（不要合并，两者互补）**：

| 想拦的东西 | 谁来拦 |
|---|---|
| `new Vector3()` 这类命令式构造（**class 还在时**） | **本门禁**（判据是「这个名字现在真的是 class」） |
| math 的 `Color3` / `Color4` class 被 `new` | R3（`check-imperative-construction.mjs`，收 `CLASS_PROVIDERS = ['packages/math']`） |
| 删完 class 之后的 `new Vector3()` | R3 收回 `SKIP_PACKAGES` / `CLASS_PROVIDERS` + `gen-objectview-schema.mjs` 的 `SCAN_DIRS` 纳入 math（§7 C 第 4 / 6 步，**本批不做**） |

**可失败性实测（三次破坏 + 一次反向 + 一次经 CI 钩子）**：

```
① 新建 packages/math/src/geom/_probe/Vector5.ts 内含 export class Vector3
   → exit 1：❌ packages/math 新增了数值 / 几何类型的 `export class`（issue #134 阶段 C）：1 处
             + packages/math/src/geom/_probe/Vector5.ts::Vector3  0 → 1 个
② 在已有 packages/math/src/geom/Vector4.ts 末尾再写一份 export class Vector3
   → exit 1：+ packages/math/src/geom/Vector4.ts::Vector3  0 → 1 个（次数口径生效）
③ 反向：新增一个**非目标**类型 export class Curve4Demo（第二批风格的曲线类）
   → exit 0（不误伤，边界正确）
④ 经 CI 那条路径再验一次：packages/math/src/geom/_probe.ts 里 export class Euler
   → `npm run lint:ci` 退出码 1（`prelint:ci` 钩子先跑本脚本），stderr 打出
     「+ packages/math/src/geom/_probe.ts::Euler  0 → 1 个」
```

#### 11.7.2 逐个类型的完整清单（19 个）

「math/src 引用」列 = math 包内（含 `index.ts`、**不含**定义文件自身）提及该标识符的文件数 / 处数（已剔注释）；
「外部」= `packages/`（math 之外）+ `examples/` + `test/`；`new` 列是**外部剩余**的命令式构造点（**math 包内 377 处 / math 测试 1604 处不计入本列**，见 §11.7.4）。

| # | 类型 | 定义文件 | 行数 | 纯函数层（行 / 函数） | math/src 引用（文件/处） | math 测试（文件/处） | 外部直接消费者 | 外部桶消费者 | 外部 `new`（直接/桶） | 外部 `instanceof` |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `Vector3` | [geom/Vector3.ts](../packages/math/src/geom/Vector3.ts) | 1254 | [vector3Ops.ts](../packages/math/src/geom/vector3Ops.ts) 818 / 54 | 30 / 512 | 36 / 834 | **69** | **22** | **224 / 96** | 1 |
| 2 | `Vector2` | [geom/Vector2.ts](../packages/math/src/geom/Vector2.ts) | 1001 | [vector2Ops.ts](../packages/math/src/geom/vector2Ops.ts) 502 / 35 | 15 / 219 | 13 / 225 | 21 | 5 | 46 / 12 | 0 |
| 3 | `Matrix4x4` | [geom/Matrix4x4.ts](../packages/math/src/geom/Matrix4x4.ts) | 1029 | [matrix4x4Ops.ts](../packages/math/src/geom/matrix4x4Ops.ts) 1905 / 65 | 13 / 57 | 13 / 164 | 23 | 7 | 41 / 3 | 0 |
| 4 | `Vector4` | [geom/Vector4.ts](../packages/math/src/geom/Vector4.ts) | 625 | [vector4Ops.ts](../packages/math/src/geom/vector4Ops.ts) 535 / 30 | 5 / 98 | 8 / 123 | 7 | 1 | 6 / 9 | 1 |
| 5 | `Box3` | [geom/Box3.ts](../packages/math/src/geom/Box3.ts) | 615 | [box3Ops.ts](../packages/math/src/geom/box3Ops.ts) 692 / 30 | 5 / 31 | 5 / 124 | 6 | 3 | 5 / 0 | 0 |
| 6 | `Triangle3` | **[geom/triangle3Ops.ts](../packages/math/src/geom/triangle3Ops.ts)**（`Triangle3.ts` 已在 C-c 删除） | 587 → — | [triangle3Ops.ts](../packages/math/src/geom/triangle3Ops.ts) 664 / 24 → 700+ / 27 | 4 / 41 | 4 / 42 | 0 | 2 | 0 / 1 → 0 | 0 |
| 7 | `Quaternion` | [geom/Quaternion.ts](../packages/math/src/geom/Quaternion.ts) | 451 | [quaternionOps.ts](../packages/math/src/geom/quaternionOps.ts) 634 / 22 | 6 / 36 | 8 / 147 | 6 | 0 | 7 / 0 | 1 |
| 8 | `Rectangle` | **[geom/rectangleOps.ts](../packages/math/src/geom/rectangleOps.ts)**（`Rectangle.ts` 已在 C-a 删除） | 418 → — | [rectangleOps.ts](../packages/math/src/geom/rectangleOps.ts) 638 / 37 → 675 / 37 | 2 / 15 | 2 / 61 | 3 | 0 | **5 / 0 → 0**（另有 `editor` 的 4 处 `.vue`，C1 的 `.ts` 扫法漏掉，C-a 一并迁移） | 0 |
| 9 | `Plane` | [geom/Plane.ts](../packages/math/src/geom/Plane.ts) | 400 | [planeOps.ts](../packages/math/src/geom/planeOps.ts) 487 / 22 | 7 / 49 | 9 / 95 | 0 | 4 | 0 / 3 | 0 |
| 10 | `Matrix3x3` | [geom/Matrix3x3.ts](../packages/math/src/geom/Matrix3x3.ts) | 392 | [matrix3x3Ops.ts](../packages/math/src/geom/matrix3x3Ops.ts) 719 / 23 | 4 / 18 | 3 / 62 | 2 | 0 | 1 / 0 | 0 |
| 11 | `Segment3` | **[geom/segment3Ops.ts](../packages/math/src/geom/segment3Ops.ts)**（`Segment3.ts` 已在 C-c 删除） | 286 → — | [segment3Ops.ts](../packages/math/src/geom/segment3Ops.ts) 235 / 14 → 290+ / 16 | 4 / 32 | 4 / 31 | **1**（editor 的 [NavigationProcess.ts](../packages/editor/src/navigation/NavigationProcess.ts)，C1 台账记成 0 见 §11.11） | 1 | 0 / 1 → 0 | 0 |
| 12 | `Color4` | **[color/color4Ops.ts](../packages/math/src/color/color4Ops.ts)**（`Color4.ts` 已在 C-b 删除） | 285 → — | [color/color4Ops.ts](../packages/math/src/color/color4Ops.ts) 269 / 17 → 287 / 17 | 6 / 36 | 5 / 39 | 5 | 18 ★ | **9 / 0 → 0** | 0 |
| 13 | `TriangleGeometry` | **[geom/triangleGeometryOps.ts](../packages/math/src/geom/triangleGeometryOps.ts)**（`TriangleGeometry.ts` 已在 C-a 删除；本批**新建**该 ops 文件） | 285 → — | [triangleGeometryOps.ts](../packages/math/src/geom/triangleGeometryOps.ts) 360 / 13 | 2 / 5 | 1 / 8 | 0 | 0 | 0 / 0 | 0 |
| 14 | `Line3` | **[geom/line3Ops.ts](../packages/math/src/geom/line3Ops.ts)**（`Line3.ts` 已在 C-d 删除） | 257 → — | [line3Ops.ts](../packages/math/src/geom/line3Ops.ts) 173 / 11 → 194 / 11（+`planeOps.planeFromLine3`） | 7 / 34 | 7 / 43 | 0 | 0 | 0 / 0 | 0 |
| 15 | `Color3` | **[color/color3Ops.ts](../packages/math/src/color/color3Ops.ts)**（`Color3.ts` 已在 C-b 删除；`ColorKeywords` 一并搬到这里） | 243 → — | [color/color3Ops.ts](../packages/math/src/color/color3Ops.ts) 190 / 12 → 256 / 12 | 5 / 30 | 3 / 28 | **0** | 1 ★ | **0 / 0 → 0** | 0 |
| 16 | `Sphere` | **[geom/sphereOps.ts](../packages/math/src/geom/sphereOps.ts)**（`Sphere.ts` 已在 C-c 删除） | 228 → — | [sphereOps.ts](../packages/math/src/geom/sphereOps.ts) 272 / 15 → 295+ / 16 | 5 / 15 | 5 / 66 | 0 | 0 | 0 / 0 | 0 |
| 17 | `Euler` | **[geom/eulerOps.ts](../packages/math/src/geom/eulerOps.ts)**（`Euler.ts` 已在 C-a 删除） | 208 → — | [eulerOps.ts](../packages/math/src/geom/eulerOps.ts) 320 / 11 → 346 / 11 | 3 / 5 | 4 / 54 | 0 | 0 | 0 / 0 | 0 |
| 18 | `Frustum` | **[geom/frustumOps.ts](../packages/math/src/geom/frustumOps.ts)**（`Frustum.ts` 已在 C-c 删除） | 113 → — | [frustumOps.ts](../packages/math/src/geom/frustumOps.ts) 167 / 6 → 185 / 6 | 2 / 4 | 2 / 17 | 4（另加 3 个只有**方法调用点**、不 import 类型名的文件，见 §11.11） | 0 | 4 / 0 → 0 | 0 |
| 19 | `Ray3` | **[geom/Ray3.ts](../packages/math/src/geom/Ray3.ts)**（C-d 起是**一行 `export type Ray3 = Line3;`**） | 9 → 1 行别名 | **不需要 `ray3Ops.ts`**：**按 `Line3` 类型别名处理**（复用 `Line3Like` / `WritableLine3Like` 与 `line3Ops` 的纯函数；见 §11.7.8 的 N1 与 §11.12） | 3 / 6 | 0 / 0 | **10** | **15** | **10 / 0 → 0** | 0 |

★ `Color3` / `Color4` 的「桶消费者」**不是 math class 的消费者**：`feng3d/src/index.ts` 有
`export type { Color3 } from './core/Color3'` / `export type { Color4 } from './core/Color4'`（第 30 / 31 行），
**显式具名导出优先于** 第 112 行的 `export * from '@feng3d/math'`，所以 `import { Color4 } from 'feng3d'` 拿到的是
feng3d 自己的**纯数据接口**（`__type__` 必填、分量可选），不是 math 的 class。实测：这 18 + 1 个「桶消费者」里
**真实 `new Color3(` / `new Color4(` 是 0 处**（原先按名字匹配数出来的 2 处全在注释里，见 §11.3 的口径校正）。

> 「纯函数层」列是**当前**值（本批实测）。§11 进度表里各批次行记的是**当时**的函数数，两者**不必相同**——
> A3 与后续批次又往 `matrix3x3Ops` / `matrix4x4Ops` / `vector2Ops` / `vector4Ops` 里补过跨类型函数
> （如 `mat3FromMatrix4x4` / `mat3ToMatrix4x4` 让 `matrix3x3Ops` 从 21 涨到 23）。**排期请用本节的值。**

#### 11.7.3 三条口径提醒（名字匹配会骗人）

1. **`Color3` / `Color4` 是全仓仅有的两套体系**：math 里是 class + `Color3Like`（`r/g/b` 必填、**无** `__type__`）；
   feng3d `core/` 里是同名纯数据 interface（`__type__` **必填**、分量**可选**）——**双向都不可赋值**（§11.3 已实测）。
   所以下表给 `Color3` / `Color4` 的外部消费者时，**只统计真正 `import ... from '@feng3d/math'` 的文件**。
   结论：**`Color3` 的 math 消费者是 0**；`Color4` 只有 3 个文件 / 9 处 `new`
   （[createTexture.ts](../packages/feng3d/src/textures/createTexture.ts) 6、
   [Particle.ts](../packages/particlesystem/src/Particle.ts) 2、
   [ParticlesAdditive.shader.ts](../packages/particlesystem/src/ParticlesAdditive.shader.ts) 1），
   另有 [PointGeometry.ts](../packages/feng3d/src/geometry/PointGeometry.ts) / [SegmentGeometry.ts](../packages/feng3d/src/geometry/SegmentGeometry.ts)
   以 `Color4 as Color4Math` 别名引类型（0 处 `new`）。
2. **`Vector2/3/4`、`Quaternion`、`Matrix*`、`Box3`、`Ray3` 等的桶消费者是「隐藏引用」的主要来源**：
   `feng3d/src/index.ts:112` 的 `export * from '@feng3d/math'` 把 math 的 class 一路漏给所有
   `import { Vector3 } from 'feng3d'` 的文件——实测 `Vector3` 有 **22 个**这样的文件 / **96 处** `new`，
   占了它外部构造点的 **30%**。**只看 `from '@feng3d/math'` 会系统性低估引用面**（B1 早已记下这一点）。
3. **按名字 grep 的假阳性**：`Sphere` 的 16 个「外部命中」全是字符串字面量（`name: 'sphere'`、
   `'Sphere.gameobject.json'`）或 three.js 风格的命名；`Plane` 的 15 个里 12 个同理，另 3 个是
   `@feng3d/addons` 自己的 `plane(u, v)` 参数曲面函数（[ParametricFunctions.ts:55](../packages/addons/src/geometries/ParametricFunctions.ts)），
   还有 `packages/editor/**/libs/cannon.d.ts` 里 cannon-es 的 `Plane`。**这些一个都不该改**。

#### 11.7.4 外部引用面汇总（本批实测）

| 口径 | 实测 |
|---|---|
| 全仓 `new <19 个目标类型>(`（剔注释后的可执行代码） | **2478 处** = math/src 377 + math/test 1604 + **外部 497** |
| 外部 497 处的来源拆分 | **358 处**经 `@feng3d/math` 直接导入、**125 处**经 `feng3d` 桶、**14 处**是**别的同名 class**（`packages/polyfill/test/ObjectUtils.spec.ts` 自己声明的 `Vector2`/`Vector3` 8 处 + `packages/objectview/examples/src/example/models.ts` 的 `Vector3` 6 处，**与 math 无关**） |
| 外部引用 math 的文件（去重） | **138 个** = 直接消费者 93 + 桶消费者 45 |
| `from '@feng3d/math'` 的 import 语句 | 112 处 / 109 个文件（不含 math 自身） |
| 同上的「导入名字」总数 | 244 个 |
| 全仓 `instanceof <目标类型>`（可执行代码） | **11 处** = 外部 3 + math/src 8（math/test 另有 5 处可执行断言；另有 4 处是同名断言但**在块注释里**——`vector4Ops.spec.ts:425/435/444/451` 的那一段 `it` 整体被注释掉了，按名字 grep 会数成 9 处） |
| `Map` / `Set` / `WeakMap<目标类型>` | **0 处** |
| `getInstanceByName('<数值类型>')` | **0 处**（§5.6 要求「阶段 C 之前跑一次全仓 grep 复核」，**本批已完成**，结论：无数值类型消费者） |

> 上表在**本分支 rebase 到含 B6 / B7 的 master 之后重测过**：外部 `new` 由 492 变为 **497**
> （B6 让 `MD5Anim` / `MD5Mesh` 的 `BoundsDraft.min|max` 重建显式 `new Vector3(x, y, z)` 并加了 3 个契约用例文件；
> B7 放宽 `Quaternion` 参数族后迁移 / 新增用例净 -3），`Quaternion` 的 class 也因此从 426 行涨到 **451 行**；
> `from '@feng3d/math'` 导入的名字数 +18。**math 侧（377）与 `*Ops` 规模、依赖图未变**；
> 两处差异的原因与整改都在 §11.5（B6）/ §11.6（B7）。**这些数字是快照**——B 的每个批次都会动它，
> 阶段 C 每次动目标类型前重跑一次即可（脚本清单见 §11.8）。

> ⚠️ **与 B1 记的「319 / 464」口径不一致**：本节按**可复现的三种口径**分别实测为
> 「import 语句 112 处」「导入名字 244 个」「直接引用 math 的文件 93 个」，
> **都无法复出 319 / 464**。B1 那句写的是「直接 `import from '@feng3d/math'` 319 处，含桶则 464 处」，
> 未记口径（可能是标识符出现次数或含注释计数）。**排期请用本节的分列口径**——
> 单个数字的「引用面」在本仓历史上一直是误算源头（B3 的 `transformPoint3` 估 10 实测 37、B5 估 11 实测 1）。

#### 11.7.5 目标类型之间的依赖关系（删谁之前要改谁）

**正向**（该类型的源码 `import` 了哪些目标类型的 **class 值**；type-only 导入不计）：

| 类型 | 依赖的目标类 |
|---|---|
| `Vector3` | `Vector2`、`Vector4`、`Quaternion`、`Matrix3x3`、`Matrix4x4` |
| `Vector2` | `Vector3` |
| `Vector4` | `Vector3` |
| `Quaternion` | `Vector3`、`Matrix4x4` |
| `Matrix3x3` | `Vector3`、`Quaternion` |
| `Matrix4x4` | `Vector3`、`Vector4`、`Quaternion`、`Matrix3x3`、`Plane`、`Ray3` |
| `Color3` / `Color4` | `Vector3` / `Vector4` |
| `Box3` | `Vector3`、`Matrix4x4`、`Plane`、`Sphere`、`Triangle3` |
| `Euler` | `Vector3`、`Quaternion`、`Matrix4x4` |
| `Frustum` | `Vector3`、`Matrix4x4`、`Plane`、`Sphere` |
| `Line3` | `Vector3` |
| `Plane` | `Vector3`、`Line3` |
| `Ray3` | `Line3` |
| `Rectangle` | `Vector2` |
| `Segment3` | `Vector3` |
| `Sphere` | `Vector3`、`Matrix4x4`、`Box3`、`Plane` |
| `Triangle3` | `Vector3`、`Plane`、`Segment3` |
| `TriangleGeometry` | `Vector3`、`Line3`、`Segment3`、`Triangle3` |

**关键事实：不存在「一次一个」的拓扑删除序。** 按「当前无人依赖就先删」迭代，第 1 轮只有
`Euler`、`Rectangle`、`TriangleGeometry`、`Color3`、`Color4`、`Frustum` 6 个可删；
剩下 13 个构成**强连通团**（`Vector2 ↔ Vector3`、`Sphere ↔ Box3 ↔ Plane`、`Quaternion ↔ Matrix3x3 ↔ Matrix4x4` …），
必须**同批改完**，或先把引用方放宽为 `*Like` 打破边。

**非目标文件也是目标类型的消费者（最容易被忽略的一块）**：§8 只说了「不动那 31 个 class」，
但删目标类型时**必须改它们**（只是改调用点，不把它们的 class 去化）：

| 目标类型 | 必须同批改的**非目标** math 文件 |
|---|---|
| `Vector3` | `curve/AnimationCurveVector3.ts`、`curve/MinMaxCurveVector3.ts`、`shape/core/Curve.ts`、`shape/curves/CatmullRomCurve3.ts`、`CubicBezierCurve3.ts`、`LineCurve3.ts`、`QuadraticBezierCurve3.ts`（7 个） |
| `Vector2` | `MathF.ts`（`LineIntersection` / `LineSegmentIntersection` 的 5 个参数是 `Vector2`）、`shape/core/CurvePath.ts`、`Path2.ts`、`Shape2.ts`、`ShapePath2.ts`、`shape/curves/CubicBezierCurve2.ts`、`EllipseCurve2.ts`、`LineCurve2.ts`、`QuadraticBezierCurve2.ts`、`SplineCurve2.ts`、`shape/ShapeUtils.ts`（11 个） |
| `Color4` | `gradient/Gradient.ts`、`gradient/MinMaxGradient.ts`、`shape/core/ShapePath2.ts`（3 个） |
| `Color3` | `gradient/GradientColorKey.ts`（1 个） |

#### 11.7.6 删除顺序建议（6 批）

排序依据：① 反向依赖数（删它要改几个文件）② 外部引用面大小 ③ 特殊耦合（`Color3/Color4` 的双体系、`Ray3` 的「按 `Line3` 别名」决策、
`Vector3Like` 的定义位置、`instanceof` 判别点、class 内残留的联合类型成员）。
**每批的规则**：凡引用本批类型的文件——无论它自己同批是否被删——都在本批改成 `*Like` 或新的纯数据接口。

| 批次 | 类型 | 为什么排这里 | 本批必须同批改的引用方 |
|---|---|---|---|
| **C-a 零内依赖叶子**（3 个）✅ **已完成** | `Euler`、`TriangleGeometry`、`Rectangle` | 三者在 math 内**除 `index.ts` 外无人引用**（反向依赖 = 0）；`Euler` / `TriangleGeometry` 外部引用 **0** | 实际改动：`math/src/index.ts`（3 行）；`feng3d` 的 [Mouse3DManager.ts](../packages/feng3d/src/core/Mouse3DManager.ts)、[MouseRenderer.ts](../packages/feng3d/src/render/renderer/MouseRenderer.ts)、[ImageUtil.ts](../packages/feng3d/src/utils/ImageUtil.ts)（**外部 5 处 `new` 全在这里**，另外两文件只有类型标注）；`TriangleGeometry` 新建了 `triangleGeometryOps.ts`。⚠️ **实际范围比 C1 预计的大**：`TriangleGeometry` 的相交族踩到 §11.7.7 的特有条件（P5），必须先做掉 `Line3.intersectWithLine3D` / `Segment3.intersectionWithLine` / `Triangle3.intersectionWithLine` 的纯函数化（新建 `intersectionOps.ts` + 三处 class 委托）与 `Box3.toTriangles`，**详见 §11.9** |
| **C-b 颜色**（2 个）✅ **已完成**（见 §11.10） | `Color3`、`Color4` | 与主链零耦合；外部几乎免费（`Color3` 消费者 **0**、`Color4` 3 文件 / 9 处 `new`） | 实际改动：math 内 4 个非目标文件（`gradient/Gradient.ts`、`gradient/GradientColorKey.ts`、`gradient/MinMaxGradient.ts`、`shape/core/ShapePath2.ts`）；`createTexture.ts`（6 处 `new Color4().fromUnit24` → `color4FromUnit24`）、`SegmentGeometry.ts`（2 处 `new Color4Math()`）、`PointGeometry.ts`（`Color4Math.WHITE`）、`Particle.ts`（2 处字段）、`ParticlesAdditive.shader.ts`（1 处）、`ParticleMainModule` 等三个模块的 4 处实例方法（`.copy` / `.multiply` → `color4Copy` / `color4Multiply`）；editor 的脚本模板 2 处 `new feng3d.Color4()` |
| **C-c 几何叶子**（4 个）✅ **已完成**（见 §11.11） | `Frustum`、`Sphere`、`Triangle3`、`Segment3` | 反向依赖只剩「本批内部 + 已在 C-a 删掉的 `TriangleGeometry`」 | 实际改动：`math` 的 `Box3.ts`（引 `Sphere` / `Triangle3` → 两处跨类型方法改委托纯函数，**satForAxes 一并迁走**）；`feng3d` 的 [Camera.ts](../packages/feng3d/src/cameras/Camera.ts) / `OrthographicCamera.ts` / `PerspectiveCamera.ts`（`frustum` computed 改 `{ __type__: 'Frustum', ...frustumFromMatrix(...) }`）、[ShadowRenderer.ts](../packages/feng3d/src/render/renderer/ShadowRenderer.ts)、**外加 C1 台账没列的 3 个方法调用点文件**：[Scene.ts](../packages/feng3d/src/scene/Scene.ts)、[ScenePickCache.ts](../packages/feng3d/src/scene/ScenePickCache.ts)、[SceneUtil.ts](../packages/feng3d/src/scene/SceneUtil.ts)（`frustum.intersectsBox(...)` → `frustumIntersectsBox(frustum, ...)`）；`editor` 的 [NavigationProcess.ts](../packages/editor/src/navigation/NavigationProcess.ts)、[Recastnavigation.ts](../packages/editor/src/recastnavigation/Recastnavigation.ts) |
| **C-d 线族**（2 个）✅ **已完成**（见 §11.12） | `Ray3`、`Line3` | 独立的继承链（`Ray3 extends Line3`，类体为空）；反向依赖只剩 `Matrix4x4` / `Plane`。**`Ray3` 的删除时机与 `Line3` 绑定**：`Line3` 的 class 一删，`Ray3.ts` 就变成一行 `export type Ray3 = Line3;`（**无自有成员，不需要独立纯函数层**，见 §11.7.8 的 N1） | 实际改动：`Matrix4x4.ts`（`transformRay` 的缺省 out 改字面量 + 显式返回类型；`Ray3Like` / `WritableRay3Like` 的重复定义收成 `line3Ops` 的类型别名）、`Plane.ts`（**`MixinsLine3` + `Line3.prototype.getPlane` 补丁整段删除**，纯函数落 `planeOps.planeFromLine3`；两处 `new Line3()` 与形参放宽）；`Box3.rayIntersection` 形参放宽为 `Vector3Like`；`feng3d` 的 [PerspectiveCamera.ts](../packages/feng3d/src/cameras/PerspectiveCamera.ts) / [OrthographicCamera.ts](../packages/feng3d/src/cameras/OrthographicCamera.ts)（各 2 处缺省 out + 3 处实例方法换纯函数）、[Renderable.ts](../packages/feng3d/src/core/Renderable.ts)、[Raycaster.spec.ts](../packages/feng3d/src/pick/Raycaster.spec.ts)（5 处）、[GeometryUtils.ts](../packages/feng3d/src/geometry/GeometryUtils.ts)；editor 的 [MouseRayTestScript.ts](../packages/editor/src/scripts/MouseRayTestScript.ts)。**实测 `new` 31 → 0**，另有一批只能靠编译发现的方法调用点（§11.12.3） |
| **C-e 盒 / 平面 / 旋转 / 矩阵**（5 个） | `Box3`、`Plane`、`Matrix3x3`、`Matrix4x4`、`Quaternion` | 这一团**互相强连通**（`Box3↔Sphere` 已在 C-c、`Matrix4x4↔Matrix3x3↔Quaternion` 必须同批）；外部面 30 + 9 + 4 + 5 + 2 个文件 | `Vector3.ts` / `Vector4.ts`（`*Like` 放宽即可，class 留着）；`Vector4` 引用方在 C-f；`Matrix4x4` 的 30 个外部文件（23 直接 + 7 桶）是本批工作量主体 |
| **C-f 向量**（3 个） | `Vector4`、`Vector2`、**`Vector3`（必然最后）** | `Vector3` 是 math 内部的**根依赖**（15 个目标文件 + 7 个非目标 class 引它）+ 外部 91 个文件 / 320 处 `new`（69 直接 + 22 桶），量级超过其余 18 个之和；`Vector2` 也被 11 个**非目标**文件引用，且与 `Vector3` **互引** | **`Vector3.ts` 的硬前置**：`Vector3Like` / `WritableVector3Like` **现在定义在 class 文件 `Vector3.ts` 里**（[vector3Ops.ts:15](../packages/math/src/geom/vector3Ops.ts) 只是 type-only 重导出，注释已写明「阶段 C 会把定义搬到本文件」），被 20+ 文件引用——**必须先搬进 `vector3Ops.ts` 再删 class**。这是**唯一**有这个问题的类型：其余 16 个的 `*Like` 都已在各自的 `*Ops.ts` 里，`Ray3Like` 在 `matrix4x4Ops.ts` |

#### 11.7.7 每个类型删除前必须先确认的前置条件

**通用清单（19 个都要过）**：

| # | 前置条件 | 怎么确认 | 当前实测 |
|---|---|---|---|
| P1 | **外部调用点是否已全部改用纯函数 / 字面量** | `node scripts/check-imperative-construction.mjs --list` + 本节 §11.7.2 的「外部 `new`」列；目标值全为 0（math 自有的同名 class 除外） | ❌ 外部还剩 **483 处**（358 直接 + 125 桶）；`math/test` 另有 1604 处、`math/src` 377 处。**这是 C1 快照**——C-a 92 → 0、C-b 76 → 0、C-c 96 → 0、**C-d 31 → 0**（都只统计本批删的那几个类型；全仓剩余量随每批下降） |
| P2 | **是否有 `instanceof` 判别** | 全仓 `instanceof <目标类型>`（剔注释） | 外部 **3 处**：`PropertyClip.ts:53`（`Quaternion`）、`:58`（`Vector3`）、`NURBSCurve.ts:98`（`Vector4`）；math/src **8 处 → 4 处**（C-a 删掉 4 处）**→ 0 处**（C-c 删掉剩下 4 处：`Segment3.ts` 的 `Segment3` 与 `Triangle3.ts` 的三处 `Vector3`——后三者随 class 删除一并消解）；math/test **5 处**（另有 4 处同在 `vector4Ops.spec.ts` 但**整段 `it` 被块注释掉了**，别当成 9 处）。**C-a 已实测：删掉的 4 处全部换成结构化判别**（`intersectionOps.ts` 的 `'origin' in r` / `'p0' in r`，与 `planeOps` 同款），class 侧再把字面量装配回实例，所以 `instanceof` 的语义没有丢；**C-c 实测：剩下 4 处全部随 class 消失**（`Segment3.intersectionWithSegment` 改用 `'p0' in r` 落在 `intersectionOps.ts`，`Triangle3` 那三处 `instanceof Vector3` 改成 `!'p0' in r`）；**C-d 实测：`Line3` / `Ray3` 在 math/src 本来就没有 `instanceof`，全仓唯一一处 `instanceof Line3`（`planeOps.spec.ts`）随用例改写去掉，全仓可执行代码仍是 3 处外部 + math/test 5 处，一个都没新增** |
| P3 | **是否有依赖对象身份 / 原型的调用点** | 全仓 `Map/Set/WeakMap<目标类型>`、`getInstanceByName('<数值类型>')`、`.constructor` 比对 | `Map/Set/WeakMap` **0 处** ✅；`getInstanceByName` **0 处** ✅（§5.6 的复核要求本批已完成）；**`obj.constructor` 比对已由 C-a 专项验证**：[Serialization.ts:720](../packages/serialization/src/Serialization.ts) / `:919` / `:949` / `:1058` 只作用于**非普通对象**（判据是 `ObjectUtils.isObject` = `constructor.name === 'Object'`），带 `__type__` 的纯数据对象走排在它前面的「处理普通Object」分支，**根本到不了** `new ctor()`——实测用例见 `packages/serialization/test/SerializationRoundTrip.spec.ts` 的「★ 纯数据 math 字段不走 `obj.constructor` 分支」（`toStrictEqual` 断言往返等价 + 断言 `Object` 构造函数上没有被挂默认实例）。结论：**class → 带 `__type__` 的纯数据接口不改变序列化行为** |
| P4 | **`*Like` / 可写形状的定义位置对不对** | 每个类型的 `XxxLike` 必须在**自己的 `xxxOps.ts`** 里，不能在 class 文件里 | ⚠️ **`Vector3Like` / `WritableVector3Like` 在 `Vector3.ts`（class 文件）里**，必须搬到 `vector3Ops.ts`；其余 16 个 ✅；`Ray3Like` 在 `matrix4x4Ops.ts`（可接受）。**C-a 三个类型 ✅**：`EulerLike` / `WritableEulerLike` + `Euler` 在 `eulerOps.ts`；`RectangleLike` / `WritableRectangleLike` / `IRectangle` + `Rectangle` 在 `rectangleOps.ts`；`TriangleGeometryLike` / `WritableTriangleGeometryLike` + `TriangleGeometry` 在 `triangleGeometryOps.ts`（class 文件已删除）。**C-b ✅**：`Color3` / `Color4` 与它们的 `*Like` 都在 `color/color{3,4}Ops.ts`。**C-c ✅**：`Frustum` / `Sphere` / `Triangle3` / `Segment3` 四个带判别字段的接口分别落在 `frustumOps.ts` / `sphereOps.ts` / `triangle3Ops.ts` / `segment3Ops.ts`，与各自的 `*Like` / `Writable*Like` 同址。**C-d ✅**：`Line3` 落在 `line3Ops.ts`（与 `Line3Like` 同址）；`Ray3Like` / `WritableRay3Like` 原在 `matrix4x4Ops.ts` 的重复定义收成对 `line3Ops` 的**类型别名**（`export type Ray3Like = Line3Like`）——它们是 C1 登记的**唯一一处「`*Like` 不在自己 ops 文件里」**（`Vector3Like` 是唯一的另一处，属 C-f） |
| P5 | **class 内还有没有「联合类型 + `instanceof`」残留成员**（A3 明确划归阶段 C，不是欠账） | 见 §11 进度表 A3 行 | **C-a 已做掉 3 个（含它们的传递依赖）**：`Line3.intersectWithLine3D`、`Segment3.intersectionWithLine`、`Triangle3.intersectionWithLine` 已纯函数化到新的 [intersectionOps.ts](../packages/math/src/geom/intersectionOps.ts)，class 侧改为委托 + 装配回实例（判别改用 `'origin' in r` / `'p0' in r`）；连带 `Box3.toTriangles` → `box3ToTriangles`。**C-c 已把剩下的全部做掉**（class 也一并删除）：`Segment3` 的 `getLine`（→ `seg3GetLine`）/ `intersectionWithSegment`（→ `seg3IntersectionWithSegment`）/ `closestPointWithPoint`（→ `seg3ClosestPointWithPoint`）、`Triangle3` 的 `intersectionWithSegment`（→ `tri3IntersectionWithSegment`）/ `decomposeWith*`（→ `tri3DecomposeWithPoint` / `tri3DecomposeWithPoints` 留在 `triangle3Ops.ts`，`tri3DecomposeWithSegment` / `tri3DecomposeWithLine` 落在 `intersectionOps.ts`）。**「顶点就是原对象」的引用语义在纯数据形态下自然满足**（`{ p0, p1, p2 }` 直接装配引用），§11.7.7 担心的死结不存在。**C-d ✅**：`Line3.prototype.getPlane`（`Plane.ts` 末尾的 `MixinsLine3` 原型补丁）搬成 `planeOps.planeFromLine3`，`declare global` 里的 `MixinsLine3` 一并消失（见 §11.12.2）；`intersectWithLine3D` / `applyMatri4x4` 在 C-a / A3 已纯函数化 |
| P6 | **`gen-objectview-schema.mjs` 的 `SCAN_DIRS` 是否已纳入 `packages/math/src/` 且 schema 重生成、diff 已核对** | `node scripts/gen-objectview-schema.mjs --check` | ⬜ 未做（D1 选「声明」的连锁工作，§5.9 / §7 C 第 4 步） |
| P7 | **既有场景资源的 `position` / `rotation` / `scale` 是否已补 `__type__: 'Vector3'`** | `test/resourceFormatGuard.spec.ts` | ⬜ 未做（§7 C 第 5 步 / M12） |
| P8 | **`*Ops` 的契约测试是否够锁住行为**（class 删了之后测试只剩纯函数） | 各 `test/**/*Ops.spec.ts` 是否覆盖该类型的公共方法集合 | 部分：`vector3Ops` 54 个函数只有 10 个用例（A1）、`matrix4x4Ops` 65 个函数靠 A2c/A2d 的 105 个批量用例覆盖；**C 之前要按「函数数 vs 用例数」过一遍，否则删 class 会同时删掉等价网**（§5.8） |
| P9 | **`packages/editor/resource/template/libs/feng3d.d.ts` 那份 555 KB 打包快照** | §7 C 第 10 条的欠账 | ⬜ 未决（补生成脚本 + 门禁，或废弃该快照） |

**逐类型特有条件**：

| 类型 | 特有条件 |
|---|---|
| `Color3` / `Color4` | ⚠️ **C 的最大设计决策——C-b 已定案（决策见 §11.10.3）：本批不合流，保持两套 + 联合类型过渡。** math 的 `Color3Like`（`r/g/b` 必填、无 `__type__`）与 feng3d 的 `core/Color3`（`__type__` 必填、分量可选）**双向不可赋值**。合流（让 math 的纯数据接口也变成「`__type__` 必填 + 分量可选」）会牵连仓内 300+ 处 `{ __type__: 'Color4', r, g, b, a }` 字面量与 `packages/feng3d` 的 reactive 数据模型，而阶段 C 的目标是「math 不再有数值 / 几何 class」，不是「统一全仓所有类型体系」；B6 已用 `Color3Like \| Color3` / `Color4Like \| Color4` 的联合做过渡（schema 生成器对联合取**第一个对象分支**判形状，所以 `control` 不变、编辑器面板行为不变），C-b 沿用。两套永久并存的代价是 `PointGeometry` / `SegmentGeometry` 的 `Color4Math` 别名要一直留着——C-b 已把这两个别名**删掉**（改用纯函数 + `core/Color4` 字面量）。若将来要合流，属独立议题，应在 C 收尾后单开 |
| `Ray3` | **已落地（C-d）**：按 `Line3` 类型别名处理，不设 `ray3Ops.ts`。`Ray3.ts` 现在就是一行 `export type Ray3 = Line3;`（外加文件头说明），直接复用 `Line3Like` / `WritableLine3Like` 与 `line3Ops` 的纯函数；`Ray3Like` / `WritableRay3Like` 收成 `line3Ops` 的类型别名。**三条连带**：① 判别字段是 `'Line3'`（`Ray3` 没有自有成员，方案 §11.12.1 的 C-d-1 记了代价与可逆性）；② 25 个外部文件的类型标注（`raycaster.ray: Ray3` / `camera.getRay3D(): Ray3`）**一行未改**——`Ray3` 名字仍在、仍可 `import`；③ 实测改了 **11 处 `new Ray3(`（`Raycaster.spec.ts` 5 + 两个相机的 `getRay3D`/`#unprojectRay` 4 + `Renderable.ts` 1 + `Matrix4x4.transformRay` 的缺省 out 1）+ 一批方法调用点**（§11.12.3）。<br>**B4 的保留项不是遗漏**：B4 保留清单里 `getRay3D(...)` 的 `ray3D` 参数是 `Ray3` 类型（未放宽），那是 B 阶段的**正常保留**——它在等这次别名决策，不是漏做。**C-d 起该参数保持 `Ray3`**（别名之后它等于 `Line3`，放宽成 `Line3Like` 反而会让「返回同一实例」的语义含糊） |
| `TriangleGeometry` | **不是数值类型，是容器类**（`triangles: Triangle3[]` 可变字段 + `fromBox` / `getPoints` / `isClosed` / `intersectionWith*` 等算法）。纯数据形态要带 `readonly triangles: readonly Triangle3Like[]`，且 `fromBox` 这类「工厂 + 就地填充」的写法要拆成「纯函数返新容器」+ 显式 `out`；**没有 `*Ops.ts`，本批要新建** |
| `Vector3` | ① `Vector3Like` 定义要先搬家（P4）；② 外部 91 文件 / 320 处 `new`（C 的最大工作量）；③ §5.3 的「冻结常量被当返回值共享」（`Project` / `ProjectOnPlane`）要在这一步定夺；④ §10.1 P8c 的「返回类型退化」风险最高（它是被链式调用最多的类型）；⑤ §5.2 的多输出（`SmoothDamp` / `tangents`）要显式化 |
| `Vector2` | `MathF.ts`（**非目标**，纯静态函数集合）的 `LineIntersection` / `LineSegmentIntersection` 拿 `Vector2` 当参数与 `result` 输出桶——删 class 前要么把它们放宽为 `Vector2Like` / `WritableVector2Like`，要么明确 `Mathf` 跟着改；另有 8 个 shape 文件同样是消费者 |
| `Line3` / `Plane` / `Segment3` / `Triangle3` / `TriangleGeometry` | 它们的 `intersectWith*` / `intersectionWith*` 系列**返回值就是这些类型的联合 + `instanceof`**（见 P2 / P5）——**这些成员必须先完成纯函数化，才谈得上删 class**，否则会出现「纯函数只产字面量、装回 class 实例会丢原型」的死结（§11 进度表 A3 行已写明这个理由）。**C-a 已完成 `TriangleGeometry` 与三个 `intersectionWithLine`；C-c 已完成 `Segment3` / `Triangle3` 的全部剩余成员并把两个 class 删掉；C-d 已完成 `Line3` 并把它的 `getPlane` 原型补丁搬进 `planeOps`**（`Plane` 留给 C-e） |
| `Matrix4x4` | 65 个纯函数 + 52 KB 源文件；外部 30 个文件；`toTRS` / `getPosition` 这类 **out 形态**的返回类型是被 P8c 咬过最多的地方（editor 三个工具类）；另 `Matrix4x4.ts` 引 `Ray3` / `Plane`，跨 C-d / C-e 两批 |
| `Euler` | math 内部反向依赖 0、外部 0 —— **最干净的删除对象**，但 `math/test` 有 43 处 `new Euler(`（`Quaternion.fromEuler` 的六种旋转序用例），要一并迁移 |
| `Quaternion` | `math/test` 有 **122 处** `new Quaternion(`（B7 放宽参数族后又加了一批用例），是测试迁移量第 2 大的类型（第 1 是 `Vector3` 的 **682 处**） |

#### 11.7.8 本批发现的异常 / 留待 C 后续决策

| # | 发现 | 影响 |
|---|---|---|
| N1 | **`packages/math/src/geom/Ray3.ts` 是空类体（`export class Ray3 extends Line3 {}`）——✅ C-d 已落地：`Ray3.ts` 现在是一行 `export type Ray3 = Line3;`** | §11 进度表原先把它记成「A2p 未开始、缺 `ray3Ops.ts`」，那是**伪前提**：`Ray3` 没有任何自有成员，真正的纯函数层（`Ray3Like` / `mat4TransformRay`）早在 `matrix4x4Ops.ts` 里、且与 `Line3Like` 逐字段同形。C-d 按 B7 / C1 的建议落地：`Ray3` 是 `Line3` 的类型别名，**不需要为它单列一个批次**（§11.7.6 的 C-d、§11.7.7 的 `Ray3` 行、§11.12）；`Ray3Like` / `WritableRay3Like` 的重复定义同步收口（改成对 `line3Ops` 的类型别名） |
| N2 | **非目标批次（shape / curve / gradient + `MathF`）是目标类型的消费者**：`Vector2` 被 11 个、`Vector3` 被 7 个、`Color4` 被 3 个、`Color3` 被 1 个非目标文件引用 | §8 的「第二批后续单独方案」给了「不动那些 class」的错觉；实际上**阶段 C 必然要改这 22 个文件的调用点**（不把它们的 class 去化）。排期时这部分工作量一直没被计入 |
| N3 | **`Vector3Like` / `WritableVector3Like` 定义在 class 文件 `Vector3.ts` 里** | 删 `Vector3.ts` 的**硬前置**（P4）。方案 §7 A1 已预告「阶段 C 转为本地定义」，但 §11 进度表没把它列为 C 的待办——容易漏 |
| N4 | `Serialization.ts` 的 4 处 `obj.constructor` 比对（`:720` / `:919` / `:949` / `:1058`） | **✅ C-a 已结案（序列化侧实测）**：这 4 处只对**非普通对象**生效（前面的「处理普通Object」处理器先用 `ObjectUtils.isObject` = `constructor.name === 'Object'` 把纯数据对象接走），所以 class → 带 `__type__` 的纯数据接口**不会**走到 `new ctor()`；专项用例 `packages/serialization/test/SerializationRoundTrip.spec.ts`（`toStrictEqual` 往返 + `Object` 上无默认实例缓存）。§5.6 只覆盖反序列化侧的缺口已补齐（见 P3） |
| N5 | B1 的「319 / 464」口径不可复现（本节三种口径分别是 112 / 244 / 93） | 数字本身不影响 C 的做法，但**排期依据应换成 §11.7.2 的分列口径** |
| N6 | math 全树 `export class` 是 **50 个**，其中 **31 个**不在本方案判据内（28 第二批 + 3 不进本方案），比任务描述里的「约 30 个曲线类」多 1 个（口径差在 `Mathf` / `Noise` / `Time`） | 门禁的判据边界必须显式（本批按此实现）；`--stats` 会把边界打出来，防止后人误改成「所有 export class」 |
| N7 | `packages/math/src` 里有含 U+2028 类字符的文件（`node` 的 `split('\n')` 与 PowerShell `Get-Content` 的行数差 78 行） | 只影响**行数统计口径**（本节的表用 node 口径）。若后续脚本用「行号」做键，会与编辑器显示不一致——这也是本门禁**刻意不记行号**的又一理由 |

### 11.8 引用面的临时分析脚本（可复现）

本节所有数字由 5 个一次性脚本产出（**未入库**，`tmp/` 下即用即弃，因为它们是「某一次快照」的度量而不是长期门禁）：
`analyze-refs3.mjs`（按 import 来源分类的引用面）、`final-data.mjs`（行数 / `*Ops` 规模）、
`new-ledger.mjs`（`new` 剩余量台账）、`topo.mjs`（正向 / 反向依赖与拓扑层）、`count-imports.mjs` / `count-imports2.mjs`（import 口径）。
**长期门禁只有两个脚本**：`scripts/check-math-no-class.mjs`（本批新增）与既有的 R3 脚本。

### 11.9 C-a 产出：Euler / Rectangle / TriangleGeometry 三个 class 已删除（19 → 16）

> 本批（C-a）是**第一次真正删 class**，对应 §11.7.6 的第 1 批。下面所有数字都是本批脚本实测
> （剔注释；`tmp/ledger.mjs`，未入库），不是估数。

#### 11.9.1 三个类型的最终形态

| 类型 | class 文件 | 纯数据接口（带判别字段） | `*Like` / 可写形状 | 纯函数层 |
|---|---|---|---|---|
| `Euler` | `geom/Euler.ts` **已删** | `Euler extends EulerLike { readonly __type__: 'Euler' }`（在 `eulerOps.ts`） | `EulerLike` / `WritableEulerLike`（**不带**判别字段，原样保留） | `eulerOps.ts` 11 个函数（未改语义） |
| `Rectangle` | `geom/Rectangle.ts` **已删** | `Rectangle extends RectangleLike { readonly __type__: 'Rectangle' }`（在 `rectangleOps.ts`） | `RectangleLike` / `WritableRectangleLike` + 兼容别名 `IRectangle`（原由 `index.ts` 导出，**保留以免包入口收窄**） | `rectangleOps.ts` 37 个函数（未改语义） |
| `TriangleGeometry` | `geom/TriangleGeometry.ts` **已删** | `TriangleGeometry extends TriangleGeometryLike { readonly __type__: 'TriangleGeometry' }`（在**新建**的 `triangleGeometryOps.ts`） | `TriangleGeometryLike` / `WritableTriangleGeometryLike`（新建） | `triangleGeometryOps.ts` **13 个函数**（原 class 的 `copy` / `clone` 合并成一个 `triGeomCopy`、`static fromBox` 与实例 `fromBox` 合并成一个 `triGeomFromBox`，其余逐一对应；其中两个原本就 `throw \`未实现\``） |

**判别字段的取舍（写给 C-b…C-f 的同一决策）**：接口**要求** `readonly __type__: '<字面量>'`（D1 决策），
但**纯函数的缺省 `out` 不带判别字段**（返回的是「算出来的值」而不是「被声明的数据」）。
若连 `out` 也要求判别字段，A / B 阶段放宽过的 `Writable*Like` 消费方（普通字面量）会成片编译不过——
把 `__type__` 塞进 `Writable*Like` 就会传导到 `XxxLike`，而 `XxxLike` 正是 B1–B7 用来放宽 feng3d 签名的那一层。
代价是**生产者与消费者之间有一个已知的不对称**：`rect2Intersection(a, b)` 的返回类型是 `WritableRectangleLike`，
想把它塞进 `Rectangle` 类型的字段需要显式补判别字段（或就地写进已有的带标记对象）。
本批按「最小改动 + 不动 ops 语义」落地；`Vector3` 那一批（C-f）若发现这个不对称会大面积咬人，
建议届时统一决策（候选：给「产生新对象」的函数加**类型重载**——缺省 `out` 那条返回带标记的接口，传了 `out` 那条返回 `Writable*Like`）。

#### 11.9.2 调用点迁移（实测）

| 类型 | `new <类型>(` 删除前 | 删除后 | 分布（删除前） |
|---|---|---|---|
| `Euler` | **44** | 0 | math/src 1 + math/test 43 |
| `TriangleGeometry` | **7** | 0 | math/src 2 + math/test 5 |
| `Rectangle` | **68** | 0 | 外部 **9**（`feng3d` 的 `ImageUtil.ts` 5 处 `.ts` + `editor` 的 3 个 `.vue` 4 处）+ math/src 3 + math/test 56 |
| 合计 | **119** | **0** | — |

外部改动（`Rectangle` 是唯一有外部调用点的）：`packages/feng3d/src/utils/ImageUtil.ts`
（3 行 `new Rectangle(...)` + 1 行 `intersection(...)` → `rect2Intersection`，`fillRect` / `drawCurve` /
`drawBetweenTwoCurves` 的参数放宽为 `RectangleLike`）、`Mouse3DManager.ts`（`viewport: Lazy<RectangleLike>`，
`bound.contains(x, y)` → `rect2Contains(bound, x, y)`）、`MouseRenderer.ts`（`draw(_viewRect: RectangleLike)`）；
`packages/editor` 的三个 `.vue`：`GradientEditor.vue`（`inflate` / `containsPoint` → `rect2Inflate` /
`rect2ContainsPoint`）、`MinMaxCurveEditor.vue`（`.left/.right/.top/.bottom` → `rect2Get*`，`ref` 类型改
`RectangleLike`）、`ProjectView.vue`（字面量）。
⚠️ **C1 的「外部 5 处」只统计了 `.ts`**——`editor` 的 4 处 `.vue` 是构建（`vite build`）时才暴露出来的
（`"Rectangle" is not exported by "feng3d/src/index.ts"`），**后续每一批的引用面实测都必须把 `.vue` / `.js` 算进来**。
`Euler` / `TriangleGeometry` 的**外部调用点为 0**（与 C1 实测一致），全部改动落在 `packages/math` 内。

#### 11.9.3 P5 前置：C1 没排进 C-a，但删 `TriangleGeometry` 绕不过去

§11.7.6 把 `TriangleGeometry` 排进 C-a 的依据是「反向依赖 = 0」，但 §11.7.7 的 P5 + 逐类型特有条件同时写着
「`intersectionWith*` 这些成员**必须先完成纯函数化，才谈得上删 class**」。实测确认了后者：
`TriangleGeometry.intersectionWithLine/Segment` 依赖 `Triangle3.intersectionWithLine` →
`Segment3.intersectionWithLine` → `Line3.intersectWithLine3D`，这三个都还是 **class 内 `instanceof` 分支的成员**，
而它们的入参在纯数据世界里是 `Triangle3Like` / `Segment3Like`（没有方法可调）。于是本批把它们一并做掉：

- **新文件 `geom/intersectionOps.ts`**（3 个函数 + 3 个结果类型）：`line3IntersectWithLine3D` /
  `seg3IntersectionWithLine` / `tri3IntersectionWithLine`。判别改用**结构化字段**（`'origin' in r` = 直线、
  `'p0' in r` = 线段、否则是点），与 `planeOps.planeIntersectWithLine3` 的既有做法同款；
- **为什么不放进 `line3Ops.ts`（重要，给 C-c / C-d 参考）**：`line3IntersectWithLine3D` 需要「过一条直线的平面」
  （`planeFromNormalAndPoint` + `planeIntersectWithLine3`），而 `planeOps` 本来就 `import` 了 `line3Ops`
  ——放进 `line3Ops.ts` 会造出 ops 层的**第一个模块环**。放进 `intersectionOps.ts` 后依赖单向
  （`intersectionOps → {planeOps, line3Ops, segment3Ops, triangle3Ops}`），`check-layer-deps` 的白名单与
  「ops 层无环」的约定都不破；
- **class 侧只做「委托 + 装配回实例」**：`Line3.intersectWithLine3D` / `Segment3.intersectionWithLine` /
  `Triangle3.intersectionWithLine` 现在调用上面的纯函数，再把字面量装回 `this.clone()` / `new Vector3(...)` /
  `new Segment3(toVector3(...), toVector3(...))`。这样 §11.7.7 担心的「纯函数只产字面量、装回 class 会丢原型」
  不会发生：**class 消费方拿到的仍是实例**（`intersectionWithSegment` / `decomposeWith*` 的 `instanceof` 分支照旧工作），
  纯函数消费方拿到字面量。三个方法各有既有 spec 覆盖（`Line3.spec.ts` / `Segment3.spec.ts` / `Triangle3.spec.ts`），
  委托后**一行未改仍全绿**，这就是行为等价的证据；
- **顺带抽出 `box3ToTriangles`**（`Box3.toTriangles` 里那句「跨类型：待 Triangle3 的 ops 落地后改为委托」的 TODO
  本批兑现），`triGeomFromBox` 直接用它；
- 副作用：math/src 的 `instanceof <目标类型>` 由 **8 处降到 4 处**（删掉 `Segment3.ts:190`、`Triangle3.ts:275`、
  `Triangle3.ts:292`、`TriangleGeometry.ts:200`），`*Ops` 层仍无模块环。

#### 11.9.4 序列化侧专项验证（P3 / N4 结案）

C1 登记「`Serialization.ts` 的 4 处 `obj.constructor` 只验证过反序列化侧，序列化侧没测过」。本批补测并结案：

- **机制**：序列化处理器里「处理普通Object」（`priority: 0`，**排在 `constructor` 处理器之前**）的判据是
  `ObjectUtils.isObject(spv)` = `spv.constructor.name === 'Object'`——带 `__type__` 的纯数据字面量正好命中它，
  于是走「逐字段递归复制」，**根本到不了** `if (ObjectUtils.objectIsEmpty(tpv) || targetObj.constructor !== sourceObj.constructor)`
  那条路，也就不会执行 `ctor.inst = new ctor()`（对 `Object` 而言那是 `{}`，且会挂在全局 `Object` 构造函数上）；
- **用例**：`packages/serialization/test/SerializationRoundTrip.spec.ts` 的「★ 纯数据 math 字段不走 `obj.constructor` 分支」——
  用一个含 `position`（带 `__type__` 的 Vector3 形状）、`rotation`（不带判别字段）、`Rectangle`、`Euler` 字面量的
  纯数据对象做 `serialize` → `JSON.stringify/parse` → `deserialize` 往返，断言 `toStrictEqual`（比 `toEqual` 严，
  能抓出 `__class__: undefined` 这类隐藏键）**且** `Object.inst` 始终是 `undefined`；
- **推论**：阶段 C 把数值 / 几何 class 换成「带 `__type__` 的纯数据接口」**不改变序列化行为**——
  只要数据是字面量，走的就是另一条分支。这条结论对 C-b…C-f 同样成立，不必再逐个类型补测。
- **同类深拷贝路径一并核过**（方案 P3 要求的「`ObjectUtils.clone` 之类」）：`ObjectUtils` 上**没有**任何
  clone / 深拷贝 API（实测只有 `isBaseType` / `isObject` / `getPropertyValue` 等 7 个判断与取值方法），
  全仓也没有 `ObjectUtils.clone` 调用点；真正的深拷贝只有两处——`serialization.clone`（= serialize +
  deserialize，即上面的往返）与 [Prefab.ts:92](../packages/feng3d/src/core/Prefab.ts) 的 `structuredClone`
  （对象字段缺省时逐字段克隆）。后者对**纯数据本来就正确**，对 class 实例反而会**丢原型**（`structuredClone`
  不复制原型链）——阶段 C 的方向是修掉这类隐患，不是引入。

#### 11.9.5 本批发现 / 留给 C 后续的调整

| # | 发现 | 对 C 后续的影响 |
|---|---|---|
| C-a-1 | **C1 的 C-a 排序把「反向依赖 = 0」当成了唯一条件**，漏了 §11.7.7 自己写的 P5 前置：`TriangleGeometry` 的相交族必须先纯函数化 | 本批已把 `intersectionOps.ts` 建好，**C-c / C-d 可以直接复用**：把「联合类型 + `instanceof`」的成员纯函数化时不必再解一遍「放哪个文件、怎么判别」；`Segment3` / `Triangle3` / `Line3` 的剩余成员（`getLine` / `intersectionWithSegment` / `closestPointWithPoint` / `decomposeWith*`）仍是它们各自批次的前置 |
| C-a-2 | **`TriangleGeometry.classifySegment` 的「相交于点」分支本来就是 `throw \`未实现\``**（实测：任何真正与几何体相交的线段都会抛，`-1` / `1` 只在不相交时给出） | 这是既有缺陷、不是本批引入；本批逐字保留并在用例里写清。**若 C 后续想修，属于行为变更，得单独一批 + 文档** |
| C-a-3 | 纯函数缺省 `out` 不带判别字段（见 §11.9.1 末段） | `Vector3`（C-f）量级最大，建议在 C-e/C-f 之前统一决策；`Color3` / `Color4`（C-b）会立刻撞到同一问题（feng3d 的 `Color4` 字段要求 `__type__`） |
| C-a-4 | 新导出（`intersectionOps.ts` 的 3 个函数、`box3ToTriangles`、`triGeom*` 13 个、`Euler` / `Rectangle` / `TriangleGeometry` 三个接口）会顶到**包体门禁 R9** 的 `full` 档（它度量的是导出面本身） | 每加导出先跑 `npx tsc -p packages/math` + `npm run types:packages` + `node scripts/check-bundle-size.mjs`，需要时 `--update` 基线（这是「导出面扩大」的合理增长，P9 已有同类先例） |
| C-a-5 | 删除三个 class 后，`packages/editor/resource/template/libs/feng3d.d.ts` 这份 **555 KB 打包快照**里的旧声明更加过时（它仍写着 `declare class Euler` / `Rectangle` / `TriangleGeometry`） | **仍是 §7 C 第 10 条的欠账**（P9），本批按「不扩大范围」原则未动；建议 C 结束前一次性处理（补生成脚本 + 门禁，或废弃该快照） |
| C-a-6 | **C1 的引用面实测只扫 `.ts`，漏掉了 `editor` 的 4 处 `.vue` 调用点**（`GradientEditor.vue` / `MinMaxCurveEditor.vue` / `ProjectView.vue`）——它们直到 `vite build` 才报 `"Rectangle" is not exported by "feng3d/src/index.ts"` | 后续每一批的「外部调用点」统计**必须把 `.vue`（以及 `.js` / `.mjs`）算进来**：`packages/editor` 的界面代码大量用 `import { X } from 'feng3d'` 的**值导入**，按 `.ts` 扫会系统性低报；`npm run build:packages` 这一步（CI 里有）是这类漏网的最后一道网 |

### 11.10 C-b 产出：Color3 / Color4 两个 class 已删除（16 → 14）

> 本批（C-b）是**第二次真正删 class**，对应 §11.7.6 的第 2 批。下面所有数字都是本批脚本实测
> （剔注释；`tmp/cb-ledger.mjs`，未入库），不是估数。

#### 11.10.1 两个类型的最终形态

| 类型 | class 文件 | 纯数据接口（带判别字段） | `*Like` / 可写形状 | 纯函数层 |
|---|---|---|---|---|
| `Color3` | `Color3.ts` **已删** | `Color3 extends Color3Like { readonly __type__: 'Color3' }`（在 `color/color3Ops.ts`） | `Color3Like` / `WritableColor3Like`（**不带**判别字段，原样保留） | `color3Ops.ts` 12 个函数（未改语义）+ `ColorKeywords`（从 `Color3.ts` 搬来） |
| `Color4` | `Color4.ts` **已删** | `Color4 extends Color4Like { readonly __type__: 'Color4' }`（在 `color/color4Ops.ts`） | `Color4Like` / `WritableColor4Like`（**不带**判别字段，原样保留） | `color4Ops.ts` 17 个函数（未改语义） |

**纯函数层一行未改语义**：本批只加两个接口 + 把 `ColorKeywords` 搬了个文件 + 加文档。
判别字段的取舍与 C-a 完全相同（接口要求 `readonly __type__`、纯函数缺省 `out` 不带），
理由不再复述（§11.9.1 末段）；**需要判别字段的装配点显式写** `{ __type__: 'Color3', ...color3FromUnit(v) }`
（`Gradient.fromColors` / `Gradient.getColor` / `Gradient.getValue` / `MinMaxGradient.getValue` /
`ShapePath2.color` / `Particle.color` / `ParticlesAdditiveUniforms._TintColor` 都照此写）。

原 class 其余成员的落法：

| 原 class 成员 | C-b 的落法 |
|---|---|
| `static WHITE` / `BLACK` | **不再提供常量**。math 侧仓内消费点为 **0**（唯一用到的是 `PointGeometry` 的 `Color4Math.WHITE`，已改成 `{ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }`）；编辑器早在 #134 之前就有自己的 `COLOR3_BLACK` / `COLOR3_WHITE` / `COLOR4_BLACK` / `COLOR4_WHITE`（`packages/editor/src/utils/colorUtils.ts`） |
| `static fromUnit` / `fromUnit24` / `fromColor3` / `ToHex` | 各自的纯函数版（`color3FromUnit` / `color4FromUnit` / `color4FromUnit24` / `color4FromColor3` / `color3ToHex`）——**A2a 就已完成**，本批只是删掉薄壳 |
| `static fromColor4`（`Color3`） | `color4ToColor3`（在 `color4Ops.ts`，语义相同：只取 r/g/b），断言搬进 `test/color4.spec.ts` |
| 实例方法（`setTo` / `fromUnit` / `fromUnit24` / `fromColor3` / `toInt` / `toHexString` / `toRGBA` / `mix` / `mixTo` / `scale` / `scaleTo` / `multiply` / `multiplyTo` / `multiplyNumber` / `equals` / `copy` / `clone` / `toVector3` / `toColor3` / `toVector4` / `toArray` / `toString` / `random`） | 同名纯函数：`out` 传自己 = 原「就地改并返回 `this`」，传别的 / 缺省 = 原「`xxxTo`」（方案 §3.3） |
| `Color3.prototype.toColor4`（在 `Color4.ts` 里的**原型补丁** + `MixinsColor3` 全局接口） | **随 class 一起删除**：它只在 `Color3` 是 class 时才有意义。实测全仓 `.toColor4(` 调用点 **0**（编辑器里的 `toColor4` 是同名的另一回事——`packages/editor/src/bridge/write/writePure.ts` 的纯函数），`MixinsColor3` 也只在这两个 math 文件里出现过 |
| `toVector3` / `toVector4` 的返回值 | **不再是 `Vector3` / `Vector4` 实例**，而是 `WritableVector3Like` / `WritableVector4Like`（纯函数层的最小形状）。`Vector3` 的 class 要到 C-f 才删，真需要实例的消费方自己 `new Vector3(...)` 写回——本批无这样的消费方（原 `Color3.toVector3()` 的调用点全在 math 自己的 spec 里，断言已改为字面量比对） |

#### 11.10.2 调用点迁移（实测）

`new <颜色>(` 台账（`new Color3(` / `new Color4(` / `new Color4Math(`，剔注释）：

| 位置 | 删除前 | 删除后 | 分布 |
|---|---|---|---|
| math/src（两个 class 文件**自身**） | **16** | 0 | `Color3.ts` 7 + `Color4.ts` 9（含原型补丁里的 `new Color4()`） |
| math/src（其余文件） | **9** | 0 | `gradient/Gradient.ts` 5 + `gradient/MinMaxGradient.ts` 3 + `shape/core/ShapePath2.ts` 1 |
| math/test | **32** | 0 | `color3.spec.ts` 13 + `color4.spec.ts` 13 + `minMaxGradient.spec.ts` 5 + `colorOps.spec.ts` 1 |
| 外部（`packages` / `examples`） | **11** | 0 | `feng3d/src/textures/createTexture.ts` 6 + `feng3d/src/geometry/SegmentGeometry.ts` **2（写的是别名 `new Color4Math()`）** + `particlesystem/src/Particle.ts` 2 + `particlesystem/src/ParticlesAdditive.shader.ts` 1 |
| **合计** | **68** | **0** | — |

另有 **11 处「非裸 `new`」的调用点**（前一张表的正则扫不到，必须逐个看 diff）：

| 原写法 | 新写法 | 位置 |
|---|---|---|
| `Color4Math.WHITE` | `{ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }` | `packages/feng3d/src/geometry/PointGeometry.ts` |
| `particle.startColor.copy(src)` | `color4Copy(src, particle.startColor)` | `packages/particlesystem/src/modules/ParticleMainModule.ts` |
| `particle.color.copy(particle.startColor)` | `color4Copy(particle.startColor, particle.color)` | 同上 |
| `particle.color.multiply(c)` | `color4Multiply(particle.color, c, particle.color)` | `ParticleColorOverLifetimeModule.ts` / `ParticleColorBySpeedModule.ts` 各 1 |
| `v.mixTo(nv, rate)` | `color3Mix(v, nv, rate)` 写进带判别字段的新对象 | `packages/math/src/gradient/Gradient.ts`（`getColor` 的插值分支，1 处） |
| `colorMin.mixTo(colorMax, rate)` / `min.mixTo(max, rate)` | `color4Mix(...)` 写进带判别字段的新对象 | `packages/math/src/gradient/MinMaxGradient.ts`（2 处） |
| `new feng3d.Color4()` ×2（**脚本模板字符串里的生成代码**） | `{ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }` | `packages/editor/src/ui/assets/AssetFileTemplates.ts` |
| `Color3.prototype.toColor4 = …` | 删除 | `packages/math/src/Color4.ts` |

**test 侧的改写方式**（照 C-a 的做法）：`test/color3.spec.ts`（26 用例）与 `test/color4.spec.ts`（30 用例）
整文件由「class 行为用例」改写为「纯函数用例」，断言**逐条保留**（`new Color3(r,g,b)` → `color3SetTo(r,g,b)`、
`c.mixTo(o, rate, out)` → `color3Mix(c, o, rate, out)`、`Color3.ToHex(i)` → `color3ToHex(i)`）；
两处「class 委托接线」用例随 class 删除（委托方已不存在，手算用例就是等价网），
`test/colorOps.spec.ts` 的原接线用例位置改成「带判别字段的数据与裸字面量走同一份实现」的契约；
`gradient.spec.ts` / `minMaxGradient.spec.ts` 的 `toBeInstanceOf(Color3/Color4)` 改成 `__type__` 判别断言
（`getValue()` 仍恒返回带 `__type__: 'Color4'` 的对象，`getColor()` 恒返回带 `__type__: 'Color3'` 的对象）。

**只改真正从 `@feng3d/math` 导入的类型**（硬规则 2）：本批刻意**没动** `packages/feng3d/src/core/Color3.ts` /
`Color4.ts`（另一套纯数据接口，`__type__` 必填 + 分量可选），也没动 `Scene.background` / `Light.color` /
`Uniform.ts` 那些已经是 `Color4Like | Color4` / `Color3Like | Color3` 的联合签名——它们与本批零冲突。

#### 11.10.3 两套颜色体系：本批的决策与落地（§11.7.7 特有条件那条的结论）

**决策：本批不合流，保持两套 + 用联合类型过渡。** 理由与代价：

1. feng3d 的 `core/Color3` / `core/Color4` 是 **reactive 驱动**的纯数据接口，分量**可选**是**有意的**
   （支持 `{ __type__: 'Color4' }` 这样的部分声明，渲染端按 `?? 1` 补默认值）；
2. 合流（把 math 侧也改成「`__type__` 必填 + 分量可选」）会牵连仓内 **300+ 处**
   `{ __type__: 'Color4', r, g, b, a }` 字面量与 feng3d 的数据模型，而阶段 C 的目标是
   「**math 不再有数值 / 几何 class**」，不是「统一全仓所有类型体系」；
3. B6 已用 `Color3Like | Color3` / `Color4Like | Color4` 的联合做过渡，且实测 schema 生成器对联合
   **取第一个对象分支**判形状 ⇒ `control` 不变、编辑器面板行为不变（§11.5），沿用即可。

**落地效果（顺带收益）**：`Gradient` / `MinMaxGradient` / `ShapePath2` 这些**非目标 class** 的颜色字段
现在也是**带 `__type__` 的纯数据**（此前是 math class 实例、没有 `__type__`）。编辑器侧因此不再需要
「class 版没有 `__type__`」那套特判：`isColor3()` / `isColor4()` 对它们**从 false 变成 true**，
而 `colorAlpha()` / `colorToHexString()` / `cloneColor()` 的取值路径只按 `isColor4` 分支，
颜色键不带 alpha ⇒ hex 仍是 6 位，**行为不变**（三个 `.vue` 组件与 `colorUtils.ts` 的注释已同步更新）。
两处 `Color4Math` 别名（`PointGeometry` / `SegmentGeometry`）本批**已删掉**——
若将来真要与 core 合流，改动面反而只剩「让 math 的分量可选」这一处。

#### 11.10.4 前置条件逐条核对（§11.7.7）

| # | 前置条件 | C-b 的核对结果 |
|---|---|---|
| P1 | 外部调用点是否已全部改用纯函数 / 字面量 | ✅ 实测 `new Color3(` / `new Color4(` / `new Color4Math(` **68 → 0**（见 §11.10.2）；`node scripts/check-imperative-construction.mjs --list` 只剩 1 处与本批无关的 `packages/webgpu/examples/src/webgpu/cornell/index.ts::Scene` |
| P2 | 是否有 `instanceof` 判别 | ✅ 全仓可执行代码 **0 处**（只剩 2 处注释提到旧写法）。`Color3` / `Color4` 没有「联合类型 + `instanceof`」成员，这条对本批不适用 |
| P3 | 是否有依赖对象身份 / 原型的调用点 | ✅ `Map` / `Set` / `WeakMap<Color3\|Color4>` **0 处**、`getInstanceByName('Color…')` **0 处**（本批复核）；`Serialization.ts` 的 4 处 `.constructor` 已由 **C-a 结案**（纯数据对象走排在前面的「处理普通Object」分支，到不了 `new ctor()`），本批**复用结论、未重测**；唯一的原型依赖 `Color3.prototype.toColor4`（+ `MixinsColor3`）随 class 删除，实测 `.toColor4(` 调用点 0 |
| P4 | `*Like` / 可写形状的定义位置对不对 | ✅ `Color3Like` / `WritableColor3Like` 一直在 `color/color3Ops.ts`、`Color4Like` / `WritableColor4Like` 一直在 `color/color4Ops.ts`；本批把两个**带判别字段的接口**也落在同一文件，`index.ts` 的 `export * from './color/color*Ops'` 保持不变（消费方 `import { Color3 } from '@feng3d/math'` 一字不改） |
| P5 | class 内还有没有「联合类型 + `instanceof`」残留成员 | ✅ 不适用（两个颜色 class 没有这类成员） |
| P6 | `gen-objectview-schema.mjs` 的 `SCAN_DIRS` 纳入 math | ⬜ **本批未做**（仍不含 math）——那是 D1「声明」决策的连锁工作（§7 C 第 4 步）。本批实测 `--check` 通过且**逐字未变**（69 类 / 390 字段），说明没有任何地方依赖 math 的颜色 class 名 |
| P7 | 既有资源的 `position` / `rotation` / `scale` 补 `__type__` | ⬜ 未做（§7 C 第 5 步 / M12）；`test/resourceFormatGuard.spec.ts` 本批全绿 |
| P8 | `*Ops` 的契约测试是否够锁住行为 | ✅ 实测行覆盖率 `color3Ops.ts` **95.65%**（44/46）、`color4Ops.ts` **94.93%**（75/79），两者**函数覆盖率 100%**；class 删除后 spec 整文件改写（见 §11.10.2），全仓 2631 用例全绿、覆盖率门禁 4 项均高于阈值 |
| P9 | 编辑器模板里的 555 KB `feng3d.d.ts` 快照 | ⬜ 仍未决（同 C-a 的登记，§7 C 第 10 条）；本批按「不扩大范围」未动。它现在更过时了（仍写着 `declare class Color3` / `Color4`） |

#### 11.10.5 本批发现 / 留给 C 后续的调整

| # | 发现 | 对 C 后续的影响 |
|---|---|---|
| C-b-1 | **C1 的「`SegmentGeometry` 用 `Color4 as Color4Math` 引类型、0 处 `new`」不准确**：实测该文件 base 上有 **2 处 `new Color4Math()`**，只是**别名**让按名字的脚本（C1 的台账与 R3 门禁都是按名字判）**完全看不见** | 「按名字」的统计与门禁对 `X as Y` 别名天然失明。C-d 的 `Ray3` 别名化（`export type Ray3 = Line3`）与后续任何 `as` 别名都属同一风险面：**别名消费方要单独 grep**（`git grep "new <别名>("`），不能只信正名的台账 |
| C-b-2 | 颜色的**静态成员没有纯函数对应物**（`WHITE` / `BLACK`），删 class = 删名字 | math 侧消费点实测为 0，故本批**不补常量**（补了会顶到包体门禁 R9 的 `full` 档，收益为 0）。编辑器有自己的 `COLOR3_*` / `COLOR4_*`；后续若有用例需要，按 §5.3 的「冻结常量」写法补 `COLOR3_WHITE` 之类即可 |
| C-b-3 | **R3 的两处 math 豁免（`SKIP_PACKAGES` / `CLASS_PROVIDERS`）现在什么都不豁免了**：`classNamesOf('packages/math')` 不再含 `Color3` / `Color4`，而 `packages/math` 的 `SKIP_PACKAGES` 整包跳过是本方案唯一的目标类型所在包——**这是它们存在的全部理由**（§5.9 结论 1） | 本批按任务要求**没动这两处豁免**。C 收尾（所有 class 删完）时应一并收回，并**同批**改 §12 的那四处文档（`SERIALIZATION_MIGRATION.md` 三处 + `ARCHITECTURE_V2.md` §3.1 的 R3 行 + `AGENTS.md` §15 的 R3 行）。收回前它们只是「无效果的豁免」，不影响门禁正确性（实测 R3 当前命中 1 处与本批无关的存量） |
| C-b-4 | **`_TintColor` 这类 uniform 颜色的运行期分支变了**：math class 实例走 `WGPUBufferBinding` 的 `value.toArray()` 分支；现在是带 `__type__` 的纯数据，走 `isColor4Data(value) → logic(value).value.value`（`packages/webgpu/src/caches/WGPUBufferBinding.ts` 的两条分支）——**数值结果相同**（`[r, g, b, a]`），且新分支是响应式的 | 后续把颜色字段从 class 改成纯数据时，**若该值会进 uniform 上传路径**，必须确认它带 `__type__`（否则会掉进 `new Cls(value)` 得到空数组 ⇒ uniform 全 0）。这是「纯数据接口必须带判别字段」在渲染侧的第二重理由 |
| C-b-5 | 删除两个 class 后，两份**编辑器随包分发的打包快照**更过时：`packages/editor/resource/template/libs/feng3d.d.ts`（555 KB，仍写 `declare class Color3` / `Color4`）与 `packages/editor/public/resource/template/libs/*` | 仍是 §7 C 第 10 条的欠账（P9），建议 C 结束前一次性处理（补生成脚本 + 门禁，或废弃快照） |
| C-b-6 | 仓库**根目录** `src/**` 那份停滞快照（§2.1）里仍有 **74 处**（72 行）`new Color3/Color4`（`src/math/Color3.ts` 7 + `Color4.ts` 9 + 其余 58） | 它**不在任何门禁 / 构建 / 测试范围内**（不是 workspace 成员、不在 `packages/*` 也不在 `examples/`），本批**未动**。若长期保留，建议在 §2.1 再补一句「不要照抄 `src/math`」 |
| C-b-7 | `scripts/toplevel-new-baseline.json` 里 `packages/math/src/Color4.ts::Color4` 已变成「存量清理项」（脚本提示可 `--update`）；R3 基线里也有 12 条同类陈旧项 | 两者都**不是本批引入**（脚本对「减少」只提示、不失败），本批按「最小改动」未动基线。C 收尾时可一并收紧 |

### 11.11 C-c 产出：Frustum / Sphere / Triangle3 / Segment3 四个 class 已删除（14 → 10）

> 本批（C-c）是**第三次真正删 class**，对应 §11.7.6 的第 3 批。下面所有数字都是本批脚本实测
> （剔注释；`tmp/cc-ledger.mjs` / `tmp/cc-imports.mjs`，未入库），不是估数。

#### 11.11.1 四个类型的最终形态

| 类型 | class 文件 | 纯数据接口（带判别字段） | `*Like` / 可写形状 | 纯函数层 |
|---|---|---|---|---|
| `Frustum` | `geom/Frustum.ts` **已删** | `Frustum extends FrustumLike { readonly __type__: 'Frustum' }`（在 `frustumOps.ts`） | `FrustumLike` / `WritableFrustumLike`（**不带**判别字段，原样保留） | `frustumOps.ts` 6 个函数（未改语义） |
| `Sphere` | `geom/Sphere.ts` **已删** | `Sphere extends SphereLike { readonly __type__: 'Sphere' }`（在 `sphereOps.ts`） | `SphereLike` / `WritableSphereLike`（原样保留） | `sphereOps.ts` 15 → **16** 个函数（新增 `sphereIntersectsBox`） |
| `Triangle3` | `geom/Triangle3.ts` **已删** | `Triangle3 extends Triangle3Like { readonly __type__: 'Triangle3' }`（在 `triangle3Ops.ts`） | `Triangle3Like` / `WritableTriangle3Like`（原样保留） | `triangle3Ops.ts` 24 → **27** 个（新增 `tri3ContainsPoint` / `tri3DecomposeWithPoint` / `tri3DecomposeWithPoints`）；`intersectionOps.ts` +3（`tri3IntersectionWithSegment` / `tri3DecomposeWithSegment` / `tri3DecomposeWithLine`） |
| `Segment3` | `geom/Segment3.ts` **已删** | `Segment3 extends Segment3Like { readonly __type__: 'Segment3' }`（在 `segment3Ops.ts`） | `Segment3Like` / `WritableSegment3Like`（原样保留） | `segment3Ops.ts` 14 → **16** 个（新增 `seg3GetLine` / `seg3ClosestPointWithPoint`）；`intersectionOps.ts` +1（`seg3IntersectionWithSegment`） |

`index.ts` 只删掉四行 `export * from './geom/{Frustum,Sphere,Triangle3,Segment3}'`，**不新增任何导出**——
四个接口与各自的 `*Like` 同址，而 `index.ts` 本来就 `export * from './geom/xxxOps'`，
所以 `import { Sphere } from '@feng3d/math'` 一字不改。

#### 11.11.2 P5 前置：4 处 `instanceof` 怎么纯函数化

批前 math/src 剩下 4 处可执行 `instanceof`，全部落在本批要删的类型上：

| 位置 | 原判别 | 纯函数化后的落点与判别 |
|---|---|---|
| `Segment3.ts` `intersectionWithSegment` | `r instanceof Segment3` | `intersectionOps.ts` 的 `seg3IntersectionWithSegment`，判别 `'p0' in r` |
| `Triangle3.ts` `intersectionWithSegment` | `r instanceof Vector3` | `intersectionOps.ts` 的 `tri3IntersectionWithSegment`，判别 `!'p0' in r` |
| `Triangle3.ts` `decomposeWithSegment` | `r instanceof Vector3` | `intersectionOps.ts` 的 `tri3DecomposeWithSegment`，判别 `!'p0' in r` |
| `Triangle3.ts` `decomposeWithLine` | `r instanceof Vector3` | `intersectionOps.ts` 的 `tri3DecomposeWithLine`，判别 `!'p0' in r` |

**落位原则照 C-a**：需要 `planeOps` / 跨类型的联合运算一律进 `intersectionOps.ts`（它已 `import`
`planeOps` / `line3Ops` / `segment3Ops` / `triangle3Ops`，谁都不反向依赖它）；纯三角形运算留
`triangle3Ops.ts`（`tri3DecomposeWithPoint` / `tri3DecomposeWithPoints`），纯线段运算留
`segment3Ops.ts`（`seg3GetLine` / `seg3ClosestPointWithPoint`）。**ops 层仍无模块环**，
`check-layer-deps` 白名单未动。

§11.7.7 记的两个「死结」在纯数据形态下**自然消解**，两条都不需要特殊处理：

1. **「装回 class 实例会丢原型」不存在了**——class 已删除，`{ p0, p1, p2 }` 就是目标形态；
2. **`decomposeWithPoint` 的「顶点就是原对象」引用语义**由字面量装配天然满足
   （`{ p0: a.p0, p1: p, p2: a.p2 }` 与原 `Triangle3.fromPoints` 的引用赋值逐字同义），
   所以 `decomposeWith*` 这次一并纯函数化了，没有沿用 A3 的「不强行动」决定。

#### 11.11.3 调用点迁移（实测）

`new <四个类型>(` 台账（剔注释；含 `.vue` / `.js` / `.mjs`；**先单独 grep 过
`import { X as Y }` 形式的别名**，本批四个类型**没有别名消费方**）：

| 类型 | 删除前 | math/src（class 文件自身） | math/src（其余文件） | math/test | 外部 |
|---|---|---|---|---|---|
| `Frustum` | **15** | 1 | — | 12（`Frustum.spec` 10 + `frustumOps.spec` 2） | 2（`ShadowRenderer.ts`） |
| `Sphere` | **53** | 3 | — | 50（`sphere.spec` 22 + `Frustum.spec` 20 + `Box3.spec` 5 + `sphereOps.spec` 2 + `frustumOps.spec` 1） | 0 |
| `Triangle3` | **15** | 4 | 1（`Box3.ts`） | 9（`triangle3Ops.spec` 5 + `Box3.spec` 3 + `a3CrossTypeOps.spec` 1） | 1（`NavigationProcess.ts`） |
| `Segment3` | **13** | 3 | 2（`Triangle3.ts` 里装配回实例的两处） | 7（`Segment3.spec` 6 + `segment3Ops.spec` 1） | 1（`NavigationProcess.ts`） |
| **合计** | **96** | **11** | **3** | **78** | **4** |

（删除后这四个类型的 `new` 全仓可执行代码为 **0**。）

> ⚠️ **这一列远不是本批的真正工作量。** 四个类型还有一批**方法调用点**，它们**不 import 类型名**，
> 所以按 `import` 来源做的台账（C1 与本批的 `cc-imports.mjs`）**完全看不见**：
>
> | 调用点 | 处数 | 位置 |
> |---|---|---|
> | `frustum.intersectsBox(bounds)`（frustum 来自 `camera.frustum` getter） | **4** | `feng3d` 的 `Scene.ts` / `ScenePickCache.ts` / `SceneUtil.ts` / `ShadowRenderer.ts` |
> | `frustum.fromMatrix(vp)` → `frustumFromMatrix(vp)` | 4 | 两个相机（computed 里）+ `ShadowRenderer` 2 |
> | `segment.getPointDistance(p)` / `getNormalWithPoint(p)` | 4 | `editor` 的 `NavigationProcess.ts` |
> | `segment.p0.equals(p)` × 8 / `p1.subTo(p0).normalize()` / `p0.addTo(...)` / `direction.clone().normalize(n)` | **11** | 同上（`Segment3.p0` 变成 `Vector3Like` 后，这些 `Vector3` 实例方法全部消失） |
> | `triangle.getNormal()` / `rasterizeCustom()` / `closestPointWithPoint()` / `getPlane3d()` / `static containsPoint()` / `decomposeWith*` | 6+ | `Recastnavigation.ts`、`NavigationProcess.ts`、`Box3.spec.ts`、`a3CrossTypeOps.spec.ts` |
>
> **结论（写给 C-d…C-f）**：删 class 的「调用点数」必须用**编译**当尺子
> （`check-strict-dirs.mjs` + `types:packages` + `build:packages`），
> 按名字 / 按 import 的 grep 只能列出「构造点」，方法调用点会系统性漏掉。
> 本批 15 处编辑错误**全部**是先编译暴露、再逐个改的（`check-strict-dirs` 两轮从 15 → 2 → 0）。

#### 11.11.4 前置条件逐条核对（§11.7.7）

| # | 前置条件 | C-c 的核对结果 |
|---|---|---|
| P1 | 外部调用点是否已全部改用纯函数 / 字面量 | ✅ 实测四个类型的 `new` **58 → 0**（见 §11.11.3）；`node scripts/check-imperative-construction.mjs` 的输出与本批无关（仍只有 1 处 `packages/webgpu/examples` 的存量） |
| P2 | 是否有 `instanceof` 判别 | ✅ **math/src 由 4 处降到 0 处**（4 处全在本批要删的类型上，见 §11.11.2）；全仓可执行代码里剩下的只有 3 处**外部**（`Quaternion` / `Vector3` / `Vector4`，属 C-e / C-f）与 math/test 的 5 处 |
| P3 | 是否有依赖对象身份 / 原型的调用点 | ✅ `Map` / `Set` / `WeakMap<这四个类型>` **0 处**、`getInstanceByName('<这四个类型>')` **0 处**（本批复核）；`Serialization.ts` 的 4 处 `.constructor` **复用 C-a 的结案结论、未重测**（纯数据字面量走排在前面的「处理普通Object」分支，到不了 `new ctor()`）。本批**唯一**的原型依赖是 `Box3.toTriangles` 里「装配回 `Triangle3` 实例」，随 class 删除一并去掉（改为直接产出纯数据） |
| P4 | `*Like` / 可写形状的定义位置对不对 | ✅ 八个 `*Like` / `Writable*Like` 一直就在各自的 ops 文件里（`Segment3` 在 `segment3Ops.ts`、`Triangle3` 在 `triangle3Ops.ts`、`Sphere` 在 `sphereOps.ts`、`Frustum` 在 `frustumOps.ts`），本批把四个**带判别字段的接口**也落在同一文件 |
| P5 | class 内还有没有「联合类型 + `instanceof`」残留成员 | ✅ **本批清空**（见 §11.11.2）：`intersectionWithSegment` / `decomposeWith*` / `getLine` / `closestPointWithPoint` 全部纯函数化 |
| P6 | `gen-objectview-schema.mjs` 的 `SCAN_DIRS` 纳入 math | ⬜ **本批仍未做**（`SCAN_DIRS` 仍是 feng3d + particlesystem + terrain）。但**产物确实变了**：`--check` 报 69 类 / 390 字段 → **73 类 / 398 字段**，多出来的正是本批四个接口。原因是 **`feng3d/src/index.ts` 的 `export * from '@feng3d/math'`**——生成器遍历的是「模块的导出符号」，`symbol.declarations[0]` 落在 math 文件里也会被收（C-a 的 `66 → 69` 就是同一条路径，见 §11.7.3 的条 2「桶消费者是隐藏引用的主要来源」与 commit `c7cb3483b` 的说明）。**所以 P6 的连锁工作已被这条路径部分满足，扫描范围本身仍应显式登记**——留给 C 收尾决策 |
| P7 | 既有资源的 `position` / `rotation` / `scale` 补 `__type__` | ⬜ 未做（§7 C 第 5 步 / M12）；`test/resourceFormatGuard.spec.ts` 本批全绿 |
| P8 | `*Ops` 的契约测试是否够锁住行为 | ✅ 四个类型的 spec 全部**整文件改写**（`Frustum.spec.ts` 8、`frustumOps.spec.ts` 7、`sphere.spec.ts` 20、`sphereOps.spec.ts` 9、`Segment3.spec.ts` 5、`segment3Ops.spec.ts` 11、`Triangle3.spec.ts` 14、`triangle3Ops.spec.ts` 22、`a3CrossTypeOps.spec.ts` 24、`Box3.spec.ts` 全绿），断言逐条保留并新增新函数的确定性用例（`seg3GetLine` / `seg3ClosestPointWithPoint` / `tri3ContainsPoint` / `tri3DecomposeWithPoint(s)` / `sphereIntersectsBox` / `tri3IntersectionWithSegment` 的退化分支） |
| P9 | 编辑器模板里的 555 KB `feng3d.d.ts` 快照 | ⬜ 仍未决（同 C-a / C-b 的登记，§7 C 第 10 条）；本批按「不扩大范围」未动。它现在更过时了（仍写着 `declare class Frustum` / `Sphere` / `Triangle3` / `Segment3`） |

#### 11.11.5 本批发现 / 留给 C 后续的调整

| # | 发现 | 对 C 后续的影响 |
|---|---|---|
| C-c-1 | **C1 台账的「外部引用面」系统性漏掉「方法调用点」**：`Sphere` 记「外部 0」是对的（确实没有外部 `new` 与外部方法调用），但 `Frustum` 记「外部 4 个文件」实际是 **7 个**——`Scene.ts` / `ScenePickCache.ts` / `SceneUtil.ts` 只调 `frustum.intersectsBox(...)`，从不 import `Frustum`；`Segment3` 记「外部 0」实际有 editor 的 `NavigationProcess.ts`（1 处 `new` + 6 处方法/字段） | **C-d / C-e / C-f 的排期请用 `check-strict-dirs` + `types:packages` 的报错数当工作量**，别再用 import 台账；`Ray3` 那批尤其要注意：C1 说它「25 个外部文件全是类型标注、可以一行不改」，但**方法调用**（`ray.origin` 之外的 `line3*` 方法、`Raycaster` 内的实际使用）只会在删 `Line3` 时暴露 |
| C-c-2 | **`instanceof Vector3` 是「联合类型 + 判别」里最隐蔽的一类**：`Triangle3` 的三处判别写的是 `instanceof Vector3`，所以「按四个待删类型名 grep `instanceof`」**一处都扫不到**，而它们恰恰是删 `Triangle3` 的前置。本批是靠通读 class 正文 + 编译发现的 | C-d 的 `Line3` 同样要留意：`Line3` 的方法里可能判别 `Vector3`（`planeOps` 的 `PlaneLine3Intersection` 已在用 `'origin' in r` 这类结构判别，务必先 grep **所有** `instanceof` 再按类型名筛 |
| C-c-3 | **删 class 会连带改「跨类型方法」的落点**：`Box3` 本批不删，但它的 `intersectsSphere` / `intersectsTriangle` / `toTriangles` 三处都要改（前两处的实现与私有 `satForAxes` 一并迁进 `box3Ops.ts`）。`box3IntersectsSphere` 只用 `box3DistanceSquaredToPoint`，所以**不需要** `box3Ops → sphereOps` 的价值 import（反方向 `sphereOps → box3Ops` 自 A2n 起就存在，`Sphere.intersectsBox` 因此可以安心委托）；`box3Ops → sphereOps` 只有 type-only，**ops 层没有新增环** | C-e 删 `Box3` 时，`box3Ops.ts` 里会多出 3 个「本来属于别的类型」的函数——它们的位置是对的（都是 Box3 的运算），不要为「对称」把它们搬到 `sphereOps` / `triangle3Ops`（那会造环） |
| C-c-4 | **`schema` 生成器的「桶导出」路径已被两批验证**（C-a 的 66 → 69、本批的 69 → 73）：只要 math 的接口带 `readonly __type__` 且经 `feng3d/src/index.ts` 的 `export *` 可达，它就会进面板的类型表。**好处**是 D1 想要的「math 类型进名单」自动达成；**代价**是 `SCAN_DIRS` 至今没写 math，**新增 math 接口会静默改变编辑器产物**（`--check` 会红，逼你重跑，算是有网） | C-e / C-f 删 `Box3` / `Plane` / `Vector3` 等时，**每批都跑一次 `gen-objectview-schema.mjs --check`**；`Vector3` 那批会一次性把 Vector2/3/4、Matrix*、Quaternion 等全部拉进面板（数量级变化），届时应与 P6 / P7（资源补 `__type__`）**同批**决策，并明确 `SCAN_DIRS` 是否补 math |
| C-c-5 | **`Box3.toTriangles` 的返回类型从 `Triangle3[]` 放宽为 `WritableTriangle3Like[]`**：这是「装配回 class」被删掉后的必然结果，属方案 §11.9.1 末段记的「生产者 / 消费者不对称」的又一例。本批 0 个生产消费方（只有 spec），所以**没有咬人**；但 `Vector3`（C-f）量级最大，建议在 C-e/C-f 之前按 C-a 的候选（给「产生新对象」的函数加类型重载）统一决策 | C-e / C-f 之前定夺 |
| C-c-6 | **纯函数缺省 `out` 缺判别字段的老问题本批又出现两次**，解法都是「显式补标记」或「先写 out 再返回」：`frustumFromMatrix(vp)` 的返回值缺 `__type__`，相机的 computed 写成 `{ __type__: 'Frustum', ...frustumFromMatrix(vp) }`；`tri3GetNormal` / `seg3GetNormalWithPoint` 返回最小形状，落进 `Vector3` 字段时改成 `const n = new Vector3(); tri3GetNormal(t, n);`（**P8c 的「先写 out 再 return out」**） | 与 C-b 的 `_TintColor` 是同一族问题；C-d…C-f 遇到 `XxxLike` 与 `Xxx` 互转时优先用这两种解法 |
| C-c-7 | R3 的两处 math 豁免（`SKIP_PACKAGES` / `CLASS_PROVIDERS`）在本批之后**仍什么都不豁免**（`classNamesOf('packages/math')` 已不含本批四个类型） | 按任务要求**未动**；C 收尾（所有 class 删完）时与 §12 的四处文档一并收回 |
| C-c-8 | 仓库**根目录** `src/**` 那份停滞快照（§2.1）里仍有 `Frustum` / `Sphere` / `Triangle3` / `Segment3` 的 class 与 `new` | 它**不在任何门禁 / 构建 / 测试范围内**，本批**未动**（同 C-b-6） |

### 11.12 C-d 产出：`Line3` / `Ray3` 两个 class 已删除（10 → 8）

> 本批（C-d）是**第四次真正删 class**，对应 §11.7.6 的第 4 批（线族）。下面所有数字都是本批脚本实测
> （剔注释；`tmp/cd-ledger.mjs` / `tmp/cd-new-ledger.mjs`，未入库），不是估数。

#### 11.12.1 两个类型的最终形态

| 类型 | class 文件 | 纯数据接口（带判别字段） | `*Like` / 可写形状 | 纯函数层 |
|---|---|---|---|---|
| `Line3` | `geom/Line3.ts` **已删** | `Line3 extends Line3Like { readonly __type__: 'Line3' }`（在 `line3Ops.ts`） | `Line3Like` / `WritableLine3Like`（**不带**判别字段，原样保留） | `line3Ops.ts` 11 个函数（未改语义）+ `intersectionOps.line3IntersectWithLine3D`（C-a 已就绪）+ `planeOps.planeFromLine3`（**本批新增**） |
| `Ray3` | `geom/Ray3.ts` **保留为一行** `export type Ray3 = Line3;` | 同上（**类型别名**，没有独立接口） | 复用 `Line3Like` / `WritableLine3Like` | 复用 `line3Ops` + `matrix4x4Ops.mat4TransformRay`（本批把 `Ray3Like` / `WritableRay3Like` 收成 `line3Ops` 的**类型别名**） |

`index.ts` 只删掉一行 `export * from './geom/Line3'`；`./geom/Ray3` 那一行**保留**
（`Ray3.ts` 仍是一个真实文件，内容只有类型别名与说明）。
`import { Line3 } from '@feng3d/math'` / `import { Ray3 } from 'feng3d'` 一字不改。

**`Ray3` 别名化的连带后果（有意接受，写在 `Ray3.ts` 的文件头）**：别名 ⇒ 射线与直线是同一个类型，
射线的判别字段是 `'Line3'` 而不是 `'Ray3'`（`{ __type__: 'Line3', origin, direction }`）。
原 class 形态本来也没有 `__type__: 'Ray3'` 这种标记，仓内 `Ray3` 的全部用法都是类型标注 + 属性读取，
没有任何按 `'Ray3'` 字面量分派的地方 ⇒ 运行时行为零影响（见 C-d-1 的条件与代价）。
`gen-objectview-schema.mjs` 也因此**不会**为 `Ray3` 生成面板条目（它只认 `interface` 声明，
别名声明被跳过，见 `gen-objectview-schema.mjs:278`），只有 `Line3` 进了面板类型表（P6）。

#### 11.12.2 P5 前置：`Line3.prototype.getPlane` 原型补丁的处理

`Plane.ts` 末尾的 `declare global { interface MixinsLine3 { getPlane(...) } }` + `Line3.prototype.getPlane = ...`
是 C1 专门标出来的**跨文件原型补丁**（§11.7.7 的 P5 家族，任务描述里的「硬前置 1」）。本批处理：

| 原形态 | 纯函数落点 | 为什么落在这里 |
|---|---|---|
| `Line3.prototype.getPlane(plane = new Plane())`（法线 `random() × direction`、过 `origin`） | **`planeOps.planeFromLine3(line, out = defaultOut())`** | 它**产出平面**，与 `planeFromPoints` / `planeFromNormalAndPoint` 同族；`planeOps` 本来就 value-import `line3Ops`，放进 `line3Ops.ts` 会造出 ops 层**模块环**（§3.1 要求 ops 层无环） |
| `Line3.intersectWithLine3D` 内部那句「过 `a` 作平面」 | `intersectionOps.line3IntersectWithLine3D` 里原先的**私有** `planeOfLine` 改为调用 `planeFromLine3`（私有函数删除） | 两处是**同一份计算**（C-a 的注释已写明），合并后 `Math.random()` 的消费次数与顺序逐字不变（§10.1 的 P5） |

`declare global` 块与 `Line3.prototype.getPlane = ...` 整段删除，**global 里不再有 `MixinsLine3`**
（`Quaternion` / `Matrix4x4` 的同名补丁仍留，属 C-e / C-f）。
原先 `Line3.spec.ts` 的 `getPlane` 用例**搬家并加强**：`planeOps.spec.ts` 新增 `planeFromLine3` 用例
（过 origin、过 origin + direction、法线与 direction 垂直三条断言），原文件连同另两条用例一起删除。

#### 11.12.3 调用点迁移（实测）

`new <两个类型>(` 台账（剔注释；含 `.vue`；**先单独 grep 过 `import { X as Y }` 别名 —— 两个类型都没有别名消费方**）：

| 类型 | 删除前 | math/src | math/test | 外部 |
|---|---|---|---|---|
| `Line3` | **20** | 6（`Line3.ts` 自身 4 + `Plane.ts` 2） | 14（`planeOps.spec` 5 + `Line3.spec` 4 + `a3CrossTypeOps.spec` 3 + `Plane.spec` 2） | 0 |
| `Ray3` | **11** | 1（`Matrix4x4.ts` 的 `transformRay` 缺省 out） | 0 | **10**（`Raycaster.spec.ts` 5 + 两个相机各 2 + `Renderable.ts` 1） |
| **合计** | **31** | **7** | **14** | **10** |

（删除后两个类型的 `new` 全仓可执行代码为 **0**——`Ray3Like` / `WritableRay3Like` 的重复定义也一并收口。）

> ⚠️ **这一列同样远不是本批的真正工作量**（§11.11.5 的 C-c-1 又复现了一次）。除 `new` 外还有一批
> **方法调用点 / 类型收窄点**，它们不 import 类型名，只能靠编译与通读发现：
>
> | 调用点 | 处数 | 位置 | 修法 |
> |---|---|---|---|
> | `ray.fromPosAndDir(...)` / `ray.getPointWithZ(0)` / `.applyMatri4x4(mat)` | 6 | `PerspectiveCamera` / `OrthographicCamera` 各 3 | 换纯函数 `line3FromPosAndDir` / `line3GetPointWithZ` / `mat4TransformRay`（`out` 传同一个 ray，就地语义不变，**返回类型仍显式标注 `Ray3`**） |
> | `bounds.rayIntersection(ray.origin, ray.direction, ...)` | 3 | `Raycaster.ts` / `Renderable.ts` / editor 的 `SceneView.vue` | `Box3.rayIntersection` 的 `position` / `direction` 放宽为 `Vector3Like`（纯放开） |
> | `const rayPosition: Vector3 = ray.origin` | 2 | `GeometryUtils.ts` | 标注改 `Vector3Like`（只读 `x/y/z`） |
> | `mouseRay3D.origin.clone()` / `.direction.clone()` | 2 | editor 的 `MouseRayTestScript.ts` | 换 `mat4TransformPoint3` / `mat4TransformVector3` + 全新 out 字面量（**`origin` 不再是 `Vector3` 实例**，`.clone()` 运行期也没了） |
> | math 测试里的实例方法 | 11 | `a3CrossTypeOps.spec`（3 × `applyMatri4x4`）、`planeOps.spec`（`parallelWithLine3D` 1 + `intersectWithLine3` 3 + `instanceof Line3` 1）、`Plane.spec`（`line.onWithPoint` / `line.equals`）、`line3Ops.spec`（2 条只对 class 成立的用例） | 改纯函数 / 字面量；`Line3.spec.ts` 整体删除（三条用例的等价断言分别落在 `line3Ops.spec` / `intersectionOps.spec` / `planeOps.spec`） |
>
> **一个具体的漏网例子**：`Raycaster.spec.ts` 有 5 处 `new Ray3(`，其中两处（`new Vector3(0,0,-10), new Vector3(0,0,1)`）
> 的上下文**逐字相同**（同一个 `for (const object of far)` 断言），逐处替换只吃到一处，剩下那处
> **是编译抓出来的**（`TS2693: 'Ray3' only refers to a type, but is being used as a value here`）——
> 与 C-c 的结论一致：**删 class 的调用点数必须用编译当尺子**（`check-strict-dirs` 一轮从 7 → 0）。

#### 11.12.4 前置条件逐条核对（§11.7.7）

| # | 前置条件 | C-d 的核对结果 |
|---|---|---|
| P1 | 外部调用点是否已全部改用纯函数 / 字面量 | ✅ 实测两个类型的 `new` **31 → 0**（§11.12.3）；`node scripts/check-imperative-construction.mjs` 仍只有 1 处与 `packages/webgpu/examples` 有关的存量 |
| P2 | 是否有 `instanceof` 判别 | ✅ 两个类型在 math/src **本来就没有** `instanceof`（C1 台账如此）；全仓唯一一处 `instanceof Line3` 在 `planeOps.spec.ts`，随用例改写换成「不是 `Vector3`」+ 判别字段断言；本批**没有新增** `instanceof`。全仓剩余仍是 3 处**外部**（`Quaternion` / `Vector3` / `Vector4`，属 C-e / C-f）与 math/test 的 5 处 |
| P3 | 是否有依赖对象身份 / 原型的调用点 | ✅ 本批复核：`Map` / `Set` / `WeakMap<Line3\|Ray3>` **0 处**、`getInstanceByName('Line3'\|'Ray3')` **0 处**；`Serialization.ts` 的 4 处 `.constructor` **复用 C-a 的结案结论、未重测**（纯数据字面量走排在前面的「处理普通Object」分支）。**本批唯一**的原型依赖是 `Line3.prototype.getPlane`（`Plane.ts` 末尾的补丁），随 class 删除一并去掉 |
| P4 | `*Like` / 可写形状的定义位置对不对 | ✅ `Line3Like` / `WritableLine3Like` 一直在 `line3Ops.ts`；`Ray3Like` / `WritableRay3Like` 原在 `matrix4x4Ops.ts`（与 `Line3Like` **逐字段同形**的重复定义），本批收成对 `line3Ops` 的**类型别名**（名字保留、消费方零改动）；`Line3` 接口落在 `line3Ops.ts` |
| P5 | class 内还有没有「联合类型 + `instanceof`」残留成员 | ✅ **本批清空**（§11.12.2）：`getPlane` 原型补丁 → `planeFromLine3`；`intersectWithLine3D` / `applyMatri4x4` 在 C-a / A3 已纯函数化，本批只是把 class 摘掉。**`declare global` 里的 `MixinsLine3` 一并消失** |
| P6 | `gen-objectview-schema.mjs` 的 `SCAN_DIRS` 是否已纳入 math | ⬜ **本批仍未做**（`SCAN_DIRS` 仍是 feng3d + particlesystem + terrain）。产物按实测变了：`--check` 报 **73 类 / 398 字段 → 74 类 / 400 字段**（+1 类 = `Line3`，+2 字段 = `origin` / `direction`）——又是 `feng3d/src/index.ts` 的 `export * from '@feng3d/math'` 那条桶导出路径（C-c-4）。**`Ray3` 没有进表**：生成器只认 `interface` 声明，`export type Ray3 = Line3` 被跳过 |
| P7 | 既有资源的 `position` / `rotation` / `scale` 补 `__type__` | ⬜ 未做（同 C-a / C-b / C-c 的登记）；`test/resourceFormatGuard.spec.ts` 全绿 |
| P8 | `*Ops` 的契约测试是否够锁住行为 | ✅ `line3Ops.spec.ts` 8 个用例（删掉 2 条**只对 class 成立**的用例：静态工厂的 origin 引用身份、class 委托接线；新增 1 条「装配成 `Line3` 接口要显式补 `__type__`」，并顺手锁住「`Ray3` 也是 `Line3` ⇒ 判别字段同为 `'Line3'`」）；`planeOps.spec.ts` 新增 `planeFromLine3` 用例；`a3CrossTypeOps.spec.ts` 的 `applyMatri4x4` 三条用例改写成 `mat4TransformRay`（期望值仍是手算）；`Line3.spec.ts` 删除 |
| P9 | 编辑器模板里的 555 KB `feng3d.d.ts` 快照 | ⬜ 仍未决（同 C-a / C-b / C-c 的登记）；它现在更过时了（仍写着 `declare class Line3` 与 `Line3.prototype.getPlane`）。**本批按「不扩大范围」未动**，也未动 `packages/editor/resource/threejs/three.js`（three.js 自带 `Line3`，与本仓无关） |

#### 11.12.5 本批发现 / 留给 C 后续的调整

| # | 发现 | 对 C 后续的影响 |
|---|---|---|
| C-d-1 | **`__type__` 的「别名传染」**：`Ray3 = Line3` 让射线的判别字段变成 `'Line3'`（§11.12.1）。仓内没有任何按 `'Ray3'` 分派的地方，所以本批零代价；但**若将来射线要独立序列化 / 进编辑器面板**，必须把 `Ray3` 从别名改成 `interface Ray3 extends Line3Like { readonly __type__: 'Ray3' }`（§11.7.7 允许的「与之同形的接口」形态），改了就要同步所有装配点 | C 收尾决策：现在是「别名」；这是**可逆的**——只影响 `Ray3.ts` 一个文件与 10 个装配点 |
| C-d-2 | **`Box3.rayIntersection` 的形参不得不放宽**（`Vector3` → `Vector3Like`，3 个消费方）：这是「class 删除 ⇒ 字段类型变 `*Like` ⇒ 拿着字段去调仍收 class 的方法」这条链的必然结果，与 C-c 放宽 `Box3.intersectsSphere` 同款。**C-e 删 `Box3` 时这类放宽会成片出现**，且**返回类型不能跟着退化**（P8c） | C-e 排期：`Box3` / `Plane` / `Matrix4x4` 的「入参放宽 + 返回类型保住」是本批之后的主要工作量 |
| C-d-3 | **`check-toplevel-new.mjs` 的基线有小幅陈旧**：本批删掉 `Plane.ts` 末尾的 `Line3.prototype.getPlane = function (plane = new Plane())`（行首无空白 ⇒ 被那条门禁记成 `packages/math/src/geom/Plane.ts::Plane`），加上 C-b 删 `Color4.ts` 留下的 `Color4.ts::Color4`，`--check` 现在报「2 处存量已被清理」。门禁**不失败**（只提示），本批按 C-a / C-b / C-c 的惯例没有收紧该基线 | C 收尾（所有 class 删完）时与 R3 豁免、`SCAN_DIRS`、文档四处一起收口 |
| C-d-4 | **`examples/` 里引用 `Ray3` 的 11 个文件一行未改**（全是类型标注 + `ray.origin.y` 这类属性读取），实测 `npm run lint:examples` 全绿 | 印证 §11.7.6 的 C-d 判断：「别名化之后这些标注可以一行不改」 |
| C-d-5 | **「生成器只认 `interface`」这条口径本批第一次被正向利用**：别名声明被跳过 ⇒ `Ray3` 不进面板，避免「同一个形状两个面板条目」 | C-f 删 `Vector3` 时要注意：`*Like` 不是 `interface` 声明、进不了表，但 `Vector3` 接口会一次性把大量类型拉进面板（C-c-4 记的量级变化） |
| C-d-6 | **`math` 的分包覆盖率文件数** 63/72 → **62/71**（删掉 `Line3.ts` 一个源文件；行覆盖率 83.6 / 语句 83.5 未动、分支 76.1 → 75.9），`docs/CI.md` §1.3 已按实测更新 | C-e / C-f 每批都要重跑 `coverage-by-package.mjs --check` |

## 12. 需要同步的既有文档

| 文档 | 改动 | 时机 |
|---|---|---|
| [SERIALIZATION_MIGRATION.md](./SERIALIZATION_MIGRATION.md) | §2「构造器仅保留给数值容器」、§4 S1「数值容器仍走原有分支」、§6 风险表对应行 | 阶段 C 同批 |
| [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) | §3.1 R3 行的「排除 `@feng3d/math` 的同名 class 与 `packages/math` 包内」 | 阶段 C 同批 |
| [../AGENTS.md](../AGENTS.md) | §15 R3 执行者描述里的同一句豁免 | 阶段 C 同批 |
| 本文 | §11 进度表随每阶段更新 | 每阶段 |
