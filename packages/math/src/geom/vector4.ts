import { mathUtil } from '@feng3d/polyfill';
import { Mathf } from '../MathF';
import type { Vector3Like, WritableVector3Like } from './vector3Ops';

/**
 * `Vector4` 运算的**纯函数**形式（issue #134 阶段 A2f，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）。
 *
 * 与 `vector3Ops.ts` / `quaternionOps.ts` / `color4Ops.ts` 同构：入参用最小形状 `Vector4Like`
 * （class 实例与纯数据字面量都满足），只读入参、结果写 `out`（`out` 传自己即就地运算），
 * class 的同名方法转发到这里。
 *
 * ## 约定
 *
 * - **不修改入参**：结果写进 `out`（缺省时新建普通字面量）；
 * - `out` 传自己就是「就地运算」，所以 class 上的 `add(v)` 与 `addTo(v, vout)` 是**同一个函数**，
 *   只是 `out` 实参不同（方案 §3.3）；
 * - 缺省 `out` 与 `new Vector4()` 的默认值一致（四个分量都是 0）——见 `DEFAULT_OUT`；
 * - 返回类型是 `WritableVector4Like`，**不是**泛型 `T`：需要具体 class 类型的调用方
 *   （`Vector4.ts` 的每个方法）显式传 `out`（就地传 `this`，新建传 `new Vector4()`），
 *   这样委托代码里**一个类型断言都不需要**，与 `Quaternion.ts` / `Vector3.ts` 的写法一致；
 * - 跨分量依赖的函数（`vec4Lerp` / `vec4MoveTowards` / `vec4NormalizeXYZ` …）
 *   一律**先算局部变量再写 `out`**，这样 `out === a` 时不会读到已改写的分量（方案 §10.1 的 P2）；
 * - 跨类型运算中，`Vector4 ↔ Vector3`（`vec4ToVector3` / `vec4FromVector3`）已就绪并能委托；
 *   `applyMatrix4x4` 需要 `Matrix4x4` 的纯函数层（阶段 A2 后续批次），**不在本文件**，
 *   class 侧仍用原实现（方案 §5.5）；
 * - 依赖只有 `@feng3d/polyfill` 的 `mathUtil` 与 `../MathF` 的纯静态数值工具；
 *   两条类型 import 都是 **type-only**（编译后完全擦除），所以运行时依赖只有
 *   `Vector4.ts → vector4Ops.ts` 一个方向，与 `Vector3.ts → vector3Ops.ts` 同向，不会形成模块环。
 *
 * ## 文件命名（踩坑记录）
 *
 * 本文件与 `vector3Ops.ts` 同构：Like 类型 + 纯函数同文件。
 * **不能**把数据定义放成 `vector4.ts`——在 Windows / macOS 这类**大小写不敏感**的文件系统上，
 * 它与 `Vector4.ts` 是同一个文件，写入会直接覆盖 class 定义（方案 §10.1 的 P1）。
 */

/**
 * 纯函数可接受的最小四维向量形状：class 实例与纯数据字面量都满足。
 *
 * 阶段 A 的 `Vector4` 仍是 class，本接口用**本地定义**而不是 type-only 取自 `./Vector4`：
 * `Vector4.ts` 要 import 本文件（值导入），本地定义能让纯函数层在阶段 C 删 class 后零改动继续可用，
 * 也避免纯函数层反向依赖 class 文件。
 */
export interface Vector4Like
{
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
}

/**
 * 可写回的四维向量目标（纯函数的 `out` 参数用；class 实例与普通字面量都满足）。
 */
export interface WritableVector4Like
{
    x: number;
    y: number;
    z: number;
    w: number;
}

/**
 * `Vector4` 纯数据接口（**带判别字段**，方案 §5.9 的 D1 决策）。
 *
 * `Vector4Like` / `WritableVector4Like` **刻意不带** `__type__`：它们是 A / B 阶段用来放宽
 * feng3d 签名的「最小形状」，带上判别字段会成片传导给普通字面量消费方。
 *
 * 阶段 C-f 起 class 已删除，本接口与 `*Like` 同址（方案 §3.1）：
 * `import { Vector4 } from '@feng3d/math'` 一字不改。
 */
export interface Vector4 extends Vector4Like
{
    readonly __type__: 'Vector4';
}

/**
 * 缺省输出目标：与 `new Vector4()` 的默认值一致（x/y/z/w 都是 0）。
 *
 * 各函数用 `{ ...DEFAULT_OUT }` 展开成**新对象**——绝不把同一个字面量共享给多次调用
 * （那会让两次「缺省新建」拿到同一个对象）。
 */
const DEFAULT_OUT: WritableVector4Like = { x: 0, y: 0, z: 0, w: 0 };

/**
 * 与 `Vector4.kEpsilon` 同值（后者现在直接引用本常量，单一来源）。
 */
export const VEC4_EPSILON = 0.00001;

/**
 * (0,0,0,0)——与 `Vector4.zero` 同值。
 *
 * 冻结后 `Object.isExtensible` 不通过，响应式系统不会对它建代理（AGENTS §8.7）。
 */
export const VEC4_ZERO: Vector4Like = Object.freeze({ x: 0, y: 0, z: 0, w: 0 });

/**
 * (1,1,1,1)——与 `Vector4.one` 同值。
 */
export const VEC4_ONE: Vector4Like = Object.freeze({ x: 1, y: 1, z: 1, w: 1 });

/**
 * (Infinity,Infinity,Infinity,Infinity)——与 `Vector4.positiveInfinity` 同值。
 */
export const VEC4_POSITIVE_INFINITY: Vector4Like = Object.freeze({ x: Infinity, y: Infinity, z: Infinity, w: Infinity });

/**
 * (-Infinity,-Infinity,-Infinity,-Infinity)——与 `Vector4.negativeInfinity` 同值。
 */
export const VEC4_NEGATIVE_INFINITY: Vector4Like = Object.freeze({ x: -Infinity, y: -Infinity, z: -Infinity, w: -Infinity });

/**
 * `Vector4.set` 的纯函数形式：用四个分量填充 `out`（缺省新建）。
 *
 * `z` / `w` 的默认值 0 属于 class 的方法签名，由 class 侧填好再传进来，
 * 这里**不给默认**（与 `color4Mix` 同规矩）。
 */
export function vec4From(x: number, y: number, z: number, w: number, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = x;
    out.y = y;
    out.z = z;
    out.w = w;

    return out;
}

/**
 * `Vector4.fromArray` 的纯函数形式：从数组的 `offset` 起读四个分量写入 `out`（缺省新建）。
 *
 * 与实现逐字一致：**不做长度检查**，数组不够长时读到的是 `undefined`。
 */
export function vec4FromArray(array: ArrayLike<number>, offset = 0, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = array[offset];
    out.y = array[offset + 1];
    out.z = array[offset + 2];
    out.w = array[offset + 3];

    return out;
}

/**
 * `Vector4.copy` / `Vector4.clone` 的纯函数形式：把 `a` 的分量复制进 `out`（缺省新建）。
 */
export function vec4Copy(a: Vector4Like, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = a.x;
    out.y = a.y;
    out.z = a.z;
    out.w = a.w;

    return out;
}

/**
 * `Vector4.toArray` 的纯函数形式：把四分量写进 `array` 的 `offset` 起四位并返回该数组。
 */
export function vec4ToArray(a: Vector4Like, array: number[] = [], offset = 0): number[]
{
    array[offset] = a.x;
    array[offset + 1] = a.y;
    array[offset + 2] = a.z;
    array[offset + 3] = a.w;

    return array;
}

/**
 * `Vector4.toVector3` 的纯函数形式：把 `x/y/z` 写进 `out` 的 `Vector3` 形状（缺省新建），丢弃 `w`。
 *
 * 缺省 `out` 用 `{ x: 0, y: 0, z: 0 }` 字面量而不是 `new Vector3()`：
 * 本文件若**值导入** `Vector3`，`Vector3.ts → Vector4.ts → vector4Ops.ts → Vector3.ts`
 * 就成了模块环。class 侧 `toVector3()` 的既有语义就是「没有传入目标时新建一个 `Vector3`」，
 * 那里显式传 `new Vector3()`，本函数的缺省分支只服务于纯函数调用方。
 */
export function vec4ToVector3(a: Vector4Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x;
    out.y = a.y;
    out.z = a.z;

    return out;
}

/**
 * `Vector4.fromVector3` 的纯函数形式：取 `vector3` 的 `x/y/z`，`w` 用给定值。
 *
 * 与实现逐字一致：`vector3` 是 `Vector3Like`（只读 `x/y/z`），不要求有 `w`。
 */
export function vec4FromVector3(vector3: Vector3Like, w: number, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = vector3.x;
    out.y = vector3.y;
    out.z = vector3.z;
    out.w = w;

    return out;
}

/**
 * `Vector4.add` / `Vector4.addTo` 的纯函数形式：逐分量相加。
 */
export function vec4Add(a: Vector4Like, b: Vector4Like, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = a.x + b.x;
    out.y = a.y + b.y;
    out.z = a.z + b.z;
    out.w = a.w + b.w;

    return out;
}

/**
 * `Vector4.sub` / `Vector4.subTo` 的纯函数形式：逐分量相减。
 */
export function vec4Sub(a: Vector4Like, b: Vector4Like, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = a.x - b.x;
    out.y = a.y - b.y;
    out.z = a.z - b.z;
    out.w = a.w - b.w;

    return out;
}

/**
 * `Vector4.multiply` / `Vector4.multiplyTo` 的纯函数形式：逐分量相乘。
 */
export function vec4Multiply(a: Vector4Like, b: Vector4Like, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = a.x * b.x;
    out.y = a.y * b.y;
    out.z = a.z * b.z;
    out.w = a.w * b.w;

    return out;
}

/**
 * `Vector4.div` / `Vector4.divTo` 的纯函数形式：逐分量相除。
 */
export function vec4Divide(a: Vector4Like, b: Vector4Like, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = a.x / b.x;
    out.y = a.y / b.y;
    out.z = a.z / b.z;
    out.w = a.w / b.w;

    return out;
}

/**
 * `Vector4.negate` / `Vector4.negateTo` 的纯函数形式：逐分量取负。
 */
export function vec4Negate(a: Vector4Like, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = -a.x;
    out.y = -a.y;
    out.z = -a.z;
    out.w = -a.w;

    return out;
}

/**
 * `Vector4.scale` / `Vector4.scaleTo` / `Vector4.scaleNumber` 的纯函数形式：逐分量乘同一标量。
 */
export function vec4ScaleNumber(a: Vector4Like, s: number, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = a.x * s;
    out.y = a.y * s;
    out.z = a.z * s;
    out.w = a.w * s;

    return out;
}

/**
 * `Vector4.lerp` 的纯函数形式：逐分量向 `b` 插值 `alpha`（**不夹取** `alpha`）。
 *
 * 先算四个局部变量再写 `out`，`out === a` 时不会读到已改写的分量。
 */
export function vec4Lerp(a: Vector4Like, b: Vector4Like, alpha: number, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    const x = a.x + (b.x - a.x) * alpha;
    const y = a.y + (b.y - a.y) * alpha;
    const z = a.z + (b.z - a.z) * alpha;
    const w = a.w + (b.w - a.w) * alpha;

    out.x = x;
    out.y = y;
    out.z = z;
    out.w = w;

    return out;
}

/**
 * `Vector4.Lerp`（静态）的纯函数形式：逐分量插值，`t` 先经 `Mathf.Clamp01` 夹取。
 */
export function vec4LerpClamped(a: Vector4Like, b: Vector4Like, t: number, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    return vec4Lerp(a, b, Mathf.Clamp01(t), out);
}

/**
 * `Vector4.LerpUnclamped`（静态）的纯函数形式：逐分量插值，**不夹取** `t`。
 */
export function vec4LerpNumber(a: Vector4Like, b: Vector4Like, t: number, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    // 与 class 的实现同源：`Vector4.lerp` 就是不夹取的逐分量插值
    return vec4Lerp(a, b, t, out);
}

/**
 * `Vector4.MoveTowards`（静态）的纯函数形式：从 `current` 朝 `target` 移动至多 `maxDistanceDelta`。
 *
 * 两条**逐字保留**的既有行为（改造时不要顺手「修正」）：
 *
 * 1. 退化分支（已在目标上，或 `maxDistanceDelta >= 0` 且距离不超过步长）**返回 `target` 本身**，
 *    即把一个入参当返回值共享出去（`Vector3.MoveTowards` 同样如此，方案 §5.3 的同型问题）；
 * 2. `maxDistanceDelta < 0` 时不走上面的「到达」分支，即使距离为 0 也会继续算下去
 *    （`0/0 * 负数` 得到 `NaN`）。
 *
 * 因为退化分支返回的是**只读形状**的 `target`，返回类型放宽为 `Vector4Like | WritableVector4Like`；
 * class 侧的方法签名是 `Vector4`（实参与返回值都是 `Vector4`），调用处无需断言。
 */
export function vec4MoveTowards(current: Vector4Like, target: Vector4Like, maxDistanceDelta: number, out: WritableVector4Like = { ...DEFAULT_OUT }): Vector4Like | WritableVector4Like
{
    const toVectorX = target.x - current.x;
    const toVectorY = target.y - current.y;
    const toVectorZ = target.z - current.z;
    const toVectorW = target.w - current.w;

    const sqdist = (toVectorX * toVectorX + toVectorY * toVectorY + toVectorZ * toVectorZ + toVectorW * toVectorW);

    if (sqdist === 0 || (maxDistanceDelta >= 0 && sqdist <= maxDistanceDelta * maxDistanceDelta))
    {
        return target;
    }

    const dist = Math.sqrt(sqdist);

    out.x = current.x + toVectorX / dist * maxDistanceDelta;
    out.y = current.y + toVectorY / dist * maxDistanceDelta;
    out.z = current.z + toVectorZ / dist * maxDistanceDelta;
    out.w = current.w + toVectorW / dist * maxDistanceDelta;

    return out;
}

/**
 * `Vector4.equals` 的纯函数形式：逐分量按 `precision` 判等。
 */
export function vec4Equals(a: Vector4Like, b: Vector4Like, precision = mathUtil.PRECISION): boolean
{
    if (!mathUtil.equals(a.x - b.x, 0, precision))
    { return false; }
    if (!mathUtil.equals(a.y - b.y, 0, precision))
    { return false; }
    if (!mathUtil.equals(a.z - b.z, 0, precision))
    { return false; }
    if (!mathUtil.equals(a.w - b.w, 0, precision))
    { return false; }

    return true;
}

/**
 * `Vector4.Equals`（首字母大写版）的纯函数形式：**严格相等**判等。
 *
 * 注意与 `vec4Equals` **不是同一个语义**：这里没有 `precision`，用的是 `===`
 * （`NaN` 与自身不等、`-0` 与 `0` 相等）。class 上两个方法并存，纯函数层如实保留两个。
 */
export function vec4StrictEquals(a: Vector4Like, b: Vector4Like): boolean
{
    return a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w;
}

/**
 * `Vector4.dot` / `Vector4.Dot` 的纯函数形式：四分量点积。
 */
export function vec4Dot(a: Vector4Like, b: Vector4Like): number
{
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z) + (a.w * b.w);
}

/**
 * `Vector4.magnitude` / `Vector4.Magnitude` 的纯函数形式：模长。
 */
export function vec4Length(a: Vector4Like): number
{
    return Math.sqrt(vec4Dot(a, a));
}

/**
 * `Vector4.sqrMagnitude` 的纯函数形式：模长平方。
 */
export function vec4LengthSquared(a: Vector4Like): number
{
    return vec4Dot(a, a);
}

/**
 * `Vector4.Distance`（静态）的纯函数形式：两点距离。
 */
export function vec4Distance(a: Vector4Like, b: Vector4Like): number
{
    return vec4Length(vec4Sub(a, b));
}

/**
 * `Vector4.Normalize`（静态）/ `Vector4.normalized` 的纯函数形式：四分量整体归一化到 `out`（缺省新建）。
 *
 * 退化分支（模长 `<= VEC4_EPSILON`）写入 `(0,0,0,0)`——与静态版 `Vector4.zero.clone()` 一致。
 * 注意**不同于**实例版 `Vector4.Normalize()`：后者只把 `x/y/z` 归一化、**`w` 原样保留**
 * （见 `vec4NormalizeXYZ`）。
 */
export function vec4Normalized(a: Vector4Like, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    const mag = vec4Length(a);

    if (mag > VEC4_EPSILON)
    {
        out.x = a.x / mag;
        out.y = a.y / mag;
        out.z = a.z / mag;
        out.w = a.w / mag;
    }
    else
    {
        out.x = 0;
        out.y = 0;
        out.z = 0;
        out.w = 0;
    }

    return out;
}

/**
 * `Vector4.Normalize()`（实例版）的纯函数形式：只归一化 `x/y/z`，**`w` 原样写出**。
 *
 * 这是 class 里最容易误读的一处：实例版归一化时**没有碰 `w`**
 * （`Vector4.Normalize` 静态版则连 `w` 一起除以 `mag`）。
 * 退化分支只把 `x/y/z` 置零，`w` 依旧保留。
 *
 * 先算局部变量再写 `out`，`out === a` 时不会读到已改写的 `x`。
 */
export function vec4NormalizeXYZ(a: Vector4Like, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    const mag = vec4Length(a);
    const x = mag > VEC4_EPSILON ? a.x / mag : 0;
    const y = mag > VEC4_EPSILON ? a.y / mag : 0;
    const z = mag > VEC4_EPSILON ? a.z / mag : 0;

    out.x = x;
    out.y = y;
    out.z = z;
    out.w = a.w;

    return out;
}

/**
 * `Vector4.Project`（静态）的纯函数形式：把 `a` 投影到 `b` 上。
 *
 * 与实现逐字一致：`b` 为零向量时 `scale` 为 `NaN`/`Infinity`，结果是 `NaN` 分量，
 * **没有**退化分支（`Vector3.Project` 才返回共享的 `zero`）。
 */
export function vec4Project(a: Vector4Like, b: Vector4Like, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    const scale = (vec4Dot(a, b) / vec4Dot(b, b));

    out.x = b.x * scale;
    out.y = b.y * scale;
    out.z = b.z * scale;
    out.w = b.w * scale;

    return out;
}

/**
 * `Vector4.Scale`（静态）的纯函数形式：逐分量相乘。
 *
 * 与 `vec4Multiply` 同义（class 上 `Scale` 与 `multiply` 也是同一套语义），
 * 保留两个名字只为与 class 的两套 API 一一对应。
 */
export function vec4Scale(a: Vector4Like, b: Vector4Like, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    return vec4Multiply(a, b, out);
}

/**
 * `Vector4.Min`（静态）的纯函数形式：逐分量取小。
 *
 * 用 `Mathf.Min` 而不是 `Math.min`：二者对 `NaN` 的处理不同
 * （`Vector3.Min/Max` 就是因为这条被有意留在 class 内未委托，见方案 §11 进度表），
 * 这里与 class 的实现同源，所以可以放心委托。
 */
export function vec4Min(lhs: Vector4Like, rhs: Vector4Like, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = Mathf.Min(lhs.x, rhs.x);
    out.y = Mathf.Min(lhs.y, rhs.y);
    out.z = Mathf.Min(lhs.z, rhs.z);
    out.w = Mathf.Min(lhs.w, rhs.w);

    return out;
}

/**
 * `Vector4.Max`（静态）的纯函数形式：逐分量取大（`Mathf.Max`，理由见 `vec4Min`）。
 */
export function vec4Max(lhs: Vector4Like, rhs: Vector4Like, out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = Mathf.Max(lhs.x, rhs.x);
    out.y = Mathf.Max(lhs.y, rhs.y);
    out.z = Mathf.Max(lhs.z, rhs.z);
    out.w = Mathf.Max(lhs.w, rhs.w);

    return out;
}

/**
 * `Vector4.random` 的纯函数形式：四个分量各自 `Math.random()`（都在 `[0,1)`）。
 *
 * **随机调用次数与顺序与 class 逐字一致**（x → y → z → w，各一次）：
 * 既有测试里存在依赖 `Math.random` 固定序列的用例（方案 §10.1 的 P5）。
 */
export function vec4Random(out: WritableVector4Like = { ...DEFAULT_OUT }): WritableVector4Like
{
    out.x = Math.random();
    out.y = Math.random();
    out.z = Math.random();
    out.w = Math.random();

    return out;
}

/**
 * `Vector4.toString` 的纯函数形式。
 */
export function vec4ToString(a: Vector4Like): string
{
    return `<${a.x}, ${a.y}, ${a.z}, ${a.w}>`;
}
