import { mathUtil } from '@feng3d/polyfill';
import { Mathf } from '../MathF';
import type { Vector3Like } from './Vector3';

/**
 * 二维向量运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` 阶段 A2e）。
 *
 * ## 约定（方案 §3.3）
 *
 * - **不修改入参**：结果写进 `out`（缺省时新建普通字面量）；
 * - `out` 传自己就是「就地运算」，所以 class 上的 `add(v)` 与 `addTo(v, vout)` 是**同一个函数**，
 *   只是 `out` 实参不同；
 * - **跨分量依赖的运算先算进局部变量再写 `out`**（方案 §10.1 的 P2）：
 *   本文件里 `vec2Perpendicular` 就是这一类（`out` 与入参同一对象时会自污染）；
 * - 依赖只有 `@feng3d/polyfill` 的 `mathUtil` 与 `../MathF` 的纯静态数值工具；
 *   跨类型的 `Vector3Like` 用 **type-only import**（编译后完全擦除），
 *   所以运行时依赖只有 `Vector2.ts → vector2Ops.ts` 一个方向，不会形成模块环。
 *
 * ## 缺省 `out` 的初值（方案 §10.1 的 P6）
 *
 * `new Vector2()` 的默认分量是 `(0, 0)`，所以缺省 `out` 取 `{ x: 0, y: 0 }`，两者一致。
 * 另：本文件所有写 `out` 的函数**都会写全 x / y 两个分量**（`vec2ClampMagnitude` 的不夹取分支也显式拷贝入参），
 * 因此不存在 Color4 那种「某个分量被漏写、缺省初值必须与构造默认对齐」的隐患。
 *
 * ## 文件命名（踩坑记录 P1）
 *
 * 与 `color3Ops.ts` / `vector3Ops.ts` 同构：Like 类型 + 常量 + 纯函数同文件。
 * **不能**把数据定义放成 `vector2.ts`——在 Windows / macOS 这类**大小写不敏感**的文件系统上，
 * 它与 `Vector2.ts` 是同一个文件，写入会直接覆盖 class 定义。
 */

/** 纯函数可接受的二维向量形状（只读）：class 实例与纯数据字面量都满足。 */
export interface Vector2Like
{
    readonly x: number;
    readonly y: number;
}

/** 可写出的二维向量目标（纯函数的 `out` 参数用；class 实例与普通字面量都满足）。 */
export interface WritableVector2Like
{
    x: number;
    y: number;
}

/** 与 `Vector2.kEpsilon` 同值（后者现在直接引用本常量，单一来源）。 */
export const VEC2_EPSILON = 0.00001;

/** 与 `Vector2.kEpsilonNormalSqrt` 同值（后者现在直接引用本常量，单一来源）。 */
export const VEC2_EPSILON_NORMAL_SQRT = 1e-15;

/**
 * (0,0)——与 `Vector2.zero` 同值。
 *
 * 冻结后 `Object.isExtensible` 不通过，响应式系统不会对它建代理（AGENTS §8.7）。
 */
export const VEC2_ZERO: Vector2Like = Object.freeze({ x: 0, y: 0 });

/** (1,1)——与 `Vector2.one` 同值。 */
export const VEC2_ONE: Vector2Like = Object.freeze({ x: 1, y: 1 });

/** (0,1)——与 `Vector2.up` 同值。 */
export const VEC2_UP: Vector2Like = Object.freeze({ x: 0, y: 1 });

/** (0,-1)——与 `Vector2.down` 同值。 */
export const VEC2_DOWN: Vector2Like = Object.freeze({ x: 0, y: -1 });

/** (-1,0)——与 `Vector2.left` 同值。 */
export const VEC2_LEFT: Vector2Like = Object.freeze({ x: -1, y: 0 });

/** (1,0)——与 `Vector2.right` 同值。 */
export const VEC2_RIGHT: Vector2Like = Object.freeze({ x: 1, y: 0 });

/** (Infinity,Infinity)——与 `Vector2.positiveInfinity` 同值。 */
export const VEC2_POSITIVE_INFINITY: Vector2Like = Object.freeze({ x: Infinity, y: Infinity });

/** (-Infinity,-Infinity)——与 `Vector2.negativeInfinity` 同值。 */
export const VEC2_NEGATIVE_INFINITY: Vector2Like = Object.freeze({ x: -Infinity, y: -Infinity });

/**
 * `Vector2.set` 的纯函数形式：用两个分量填充 `out`（缺省新建）。
 */
export function vec2From(x: number, y: number, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = x;
    out.y = y;

    return out;
}

/**
 * `Vector2.copy` / `Vector2.clone` 的纯函数形式：把 `a` 的分量复制进 `out`（缺省新建）。
 */
export function vec2Copy(a: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = a.x;
    out.y = a.y;

    return out;
}

/**
 * `Vector2.toArray` 的纯函数形式：把分量写进 `array` 的 `offset` 起两位并返回该数组。
 */
export function vec2ToArray(a: Vector2Like, array: number[] = [], offset = 0): number[]
{
    array[offset] = a.x;
    array[offset + 1] = a.y;

    return array;
}

/**
 * `Vector2.equals` 的纯函数形式：逐分量按 `precision` 判等。
 */
export function vec2Equals(a: Vector2Like, b: Vector2Like, precision = mathUtil.PRECISION): boolean
{
    if (!mathUtil.equals(a.x - b.x, 0, precision))
    {
        return false;
    }
    if (!mathUtil.equals(a.y - b.y, 0, precision))
    {
        return false;
    }

    return true;
}

/** `Vector2.add` / `Vector2.addTo` 的纯函数形式：分量相加，结果写进 `out`。 */
export function vec2Add(a: Vector2Like, b: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = a.x + b.x;
    out.y = a.y + b.y;

    return out;
}

/** `Vector2.sub` / `Vector2.subTo` 的纯函数形式：分量相减，结果写进 `out`。 */
export function vec2Sub(a: Vector2Like, b: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = a.x - b.x;
    out.y = a.y - b.y;

    return out;
}

/** `Vector2.multiply` / `Vector2.multiplyTo` 的纯函数形式：分量相乘，结果写进 `out`。 */
export function vec2Multiply(a: Vector2Like, b: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = a.x * b.x;
    out.y = a.y * b.y;

    return out;
}

/**
 * `Vector2.scale` / `Vector2.scaleTo` / `Vector2.Scale` 的纯函数形式。
 *
 * 与 `vec2Multiply` **同义**（实现只有一份，这里是转发入口）。
 */
export function vec2Scale(a: Vector2Like, b: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    return vec2Multiply(a, b, out);
}

/** `Vector2.divide` / `Vector2.divideTo` 的纯函数形式：分量相除，结果写进 `out`。 */
export function vec2Divide(a: Vector2Like, b: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = a.x / b.x;
    out.y = a.y / b.y;

    return out;
}

/** `Vector2.negate` 的纯函数形式：取负，结果写进 `out`。 */
export function vec2Negate(a: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = -a.x;
    out.y = -a.y;

    return out;
}

/** `Vector2.reciprocal` / `Vector2.reciprocalTo` 的纯函数形式：分量取倒数，结果写进 `out`。 */
export function vec2Reciprocal(a: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = 1 / a.x;
    out.y = 1 / a.y;

    return out;
}

/** `Vector2.scaleNumber` / `Vector2.scaleNumberTo` 的纯函数形式：各分量乘标量 `s`。 */
export function vec2ScaleNumber(a: Vector2Like, s: number, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = a.x * s;
    out.y = a.y * s;

    return out;
}

/** `Vector2.offset` 的纯函数形式：各分量加对应偏移量，结果写进 `out`。 */
export function vec2Offset(a: Vector2Like, dx: number, dy: number, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = a.x + dx;
    out.y = a.y + dy;

    return out;
}

/**
 * `Vector2.lerp` / `Vector2.lerpTo` 的纯函数形式：按**分量**插值系数 `alpha` 插值。
 */
export function vec2Lerp(a: Vector2Like, b: Vector2Like, alpha: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = a.x + ((b.x - a.x) * alpha.x);
    out.y = a.y + ((b.y - a.y) * alpha.y);

    return out;
}

/**
 * `Vector2.lerpNumber` / `Vector2.lerpNumberTo` / `Vector2.LerpUnclamped` 的纯函数形式：
 * 按标量 `t` 插值，**不夹取** `t`。
 */
export function vec2LerpNumber(a: Vector2Like, b: Vector2Like, t: number, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = a.x + ((b.x - a.x) * t);
    out.y = a.y + ((b.y - a.y) * t);

    return out;
}

/**
 * `Vector2.Lerp` 的纯函数形式：按标量 `t` 插值，`t` 先用 `mathUtil.clamp` 夹取到 `[0, 1]`。
 *
 * 这里必须用 `mathUtil.clamp` 而**不是** `Mathf.Clamp01`：两者对 `NaN` 的行为不同
 * （`mathUtil.clamp(NaN, 0, 1)` 返回 `1`，`Mathf.Clamp01(NaN)` 返回 `NaN`），
 * 而 `Vector2.Lerp` 的原实现用的就是 `mathUtil.clamp`。
 */
export function vec2LerpClamped(a: Vector2Like, b: Vector2Like, t: number, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    t = mathUtil.clamp(t, 0, 1);

    out.x = a.x + ((b.x - a.x) * t);
    out.y = a.y + ((b.y - a.y) * t);

    return out;
}

/**
 * `Vector2.clamp` / `Vector2.clampTo` 的纯函数形式：逐分量夹取到 `[min, max]`。
 */
export function vec2Clamp(a: Vector2Like, min: Vector2Like, max: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = mathUtil.clamp(a.x, min.x, max.x);
    out.y = mathUtil.clamp(a.y, min.y, max.y);

    return out;
}

/**
 * `Vector2.min` 的纯函数形式：逐分量取较小值（`Math.min` 语义）。
 *
 * **`Vector2.Min`（静态）不走这里**：它用 `Mathf.Min`（`a < b ? a : b`），
 * 与 `Math.min` 的 `NaN` 语义不同（见 `Vector2.ts` 的注释）。
 */
export function vec2Min(a: Vector2Like, b: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = Math.min(a.x, b.x);
    out.y = Math.min(a.y, b.y);

    return out;
}

/**
 * `Vector2.max` 的纯函数形式：逐分量取较大值（`Math.max` 语义）。
 *
 * **`Vector2.Max`（静态）不走这里**：理由同上（`Mathf.Max` 与 `Math.max` 的 `NaN` 语义不同）。
 */
export function vec2Max(a: Vector2Like, b: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = Math.max(a.x, b.x);
    out.y = Math.max(a.y, b.y);

    return out;
}

/** `Vector2.round` 的纯函数形式：逐分量四舍五入。 */
export function vec2Round(a: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = Math.round(a.x);
    out.y = Math.round(a.y);

    return out;
}

/** `Vector2.length` / `Vector2.magnitude` 的纯函数形式：向量长度。 */
export function vec2Length(a: Vector2Like): number
{
    return Math.sqrt(vec2LengthSquared(a));
}

/** `Vector2.lengthSquared` / `Vector2.sqrMagnitude` 的纯函数形式：长度平方。 */
export function vec2LengthSquared(a: Vector2Like): number
{
    return (a.x * a.x) + (a.y * a.y);
}

/** `Vector2.distance` / `Vector2.Distance` 的纯函数形式：两点距离。 */
export function vec2Distance(a: Vector2Like, b: Vector2Like): number
{
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt((dx * dx) + (dy * dy));
}

/**
 * `Vector2.distanceSquared` 的纯函数形式：两点距离平方。
 *
 * 入参 `b` 的类型是 `Vector3Like`——原方法签名就是 `distanceSquared(p: Vector3)`（只用 x / y），
 * 这里如实保留，用 **type-only import** 引三维向量的形状（运行时无依赖）。
 */
export function vec2DistanceSquared(a: Vector2Like, b: Vector3Like): number
{
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return (dx * dx) + (dy * dy);
}

/**
 * `Vector2.dot` / `Vector2.Dot` 的纯函数形式：点乘。
 */
export function vec2Dot(a: Vector2Like, b: Vector2Like): number
{
    return (a.x * b.x) + (a.y * b.y);
}

/**
 * `Vector2.cross` 的纯函数形式：二维叉积（**标量**，等于两向量构成的平行四边形面积，带符号）。
 */
export function vec2Cross(a: Vector2Like, b: Vector2Like): number
{
    return (a.x * b.y) - (a.y * b.x);
}

/**
 * `Vector2.normalize` / `Vector2.normalized` 的纯函数形式：单位化，结果写进 `out`。
 *
 * 长度不大于 `VEC2_EPSILON` 时置零。
 */
export function vec2Normalize(a: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    const length = vec2Length(a);

    if (length > VEC2_EPSILON)
    {
        out.x = a.x / length;
        out.y = a.y / length;
    }
    else
    {
        out.x = 0;
        out.y = 0;
    }

    return out;
}

/**
 * `Vector2.Angle` 的纯函数形式：两向量夹角（度）。
 */
export function vec2Angle(from: Vector2Like, to: Vector2Like): number
{
    // sqrt(a) * sqrt(b) = sqrt(a * b) —— 对实数成立（照抄原实现的说明）
    const denominator = Math.sqrt(vec2LengthSquared(from) * vec2LengthSquared(to));

    if (denominator < VEC2_EPSILON_NORMAL_SQRT)
    {
        return 0;
    }

    const dot = mathUtil.clamp(vec2Dot(from, to) / denominator, -1, 1);

    return Math.acos(dot) * mathUtil.RAD2DEG;
}

/**
 * `Vector2.SignedAngle` 的纯函数形式：有符号夹角（度），符号取两向量二维叉积的符号。
 */
export function vec2SignedAngle(from: Vector2Like, to: Vector2Like): number
{
    const unsignedAngle = vec2Angle(from, to);
    const sign = Mathf.Sign((from.x * to.y) - (from.y * to.x));

    return unsignedAngle * sign;
}

/**
 * `Vector2.Perpendicular` 的纯函数形式：把方向转 90°，结果写进 `out`。
 *
 * **两个分量先算进局部变量再写 `out`**：结果跨分量读入参（`x` 取自 `a.y`、`y` 取自 `a.x`），
 * 若边算边写且 `out` 与 `a` 是同一个对象，第二个分量就会读到已经被改写的 `a.x`
 * （与 `vec3Cross` 同类，见方案 §10.1 的 P2）。
 */
export function vec2Perpendicular(a: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    const x = -a.y;
    const y = a.x;

    out.x = x;
    out.y = y;

    return out;
}

/**
 * `Vector2.Reflect` 的纯函数形式：按法线 `inNormal` 反射，结果写进 `out`。
 *
 * 表达式的写法与顺序**逐字照抄**原静态方法（`factor * normal + direction`），
 * 不改成数学等价的 `direction - normal * factor`——浮点结果才逐位一致。
 */
export function vec2Reflect(inDirection: Vector2Like, inNormal: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    const factor = -2 * vec2Dot(inNormal, inDirection);

    out.x = (factor * inNormal.x) + inDirection.x;
    out.y = (factor * inNormal.y) + inDirection.y;

    return out;
}

/**
 * `Vector2.polar` 的纯函数形式：把极坐标 `(len, angle)` 转成笛卡尔坐标，结果写进 `out`。
 *
 * 注意：原实现把 `angle` 乘了 `mathUtil.RAD2DEG`（**角度转弧度方向反了**，
 * 见 `Vector2.polar`：`len * Math.cos(angle * mathUtil.RAD2DEG)`）。
 * 这是**既有行为**，本步只做搬运，不修（改动会静默改变所有调用方结果）。
 */
export function vec2Polar(len: number, angle: number, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = len * Math.cos(angle * mathUtil.RAD2DEG);
    out.y = len * Math.sin(angle * mathUtil.RAD2DEG);

    return out;
}

/**
 * `Vector2.random`（实例与静态同义）的纯函数形式：各分量取 `[0,1)` 的随机数，结果写进 `out`。
 *
 * 写入顺序必须是 x 再 y：`Math.random` 的调用次数与顺序是既有行为的一部分
 * （方案 §10.1 的 P5——改变它会让依赖固定随机序列的用例整体错位）。
 */
export function vec2Random(out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = Math.random();
    out.y = Math.random();

    return out;
}

/**
 * `Vector2.toString` 的纯函数形式。
 */
export function vec2ToString(a: Vector2Like): string
{
    return `(${a.x}, ${a.y})`;
}

/**
 * `Vector2.ClampMagnitude` 的纯函数形式：长度超过 `maxLength` 时缩到该长度，否则原样拷贝，结果写进 `out`。
 *
 * 原静态方法两个分支都返回**新对象**（夹取时 `new Vector2(...)`、否则 `vector.clone()`），
 * 所以 class 侧委托时用 `out` 收结果即可，身份语义（不共享入参）不变。
 */
export function vec2ClampMagnitude(a: Vector2Like, maxLength: number, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    const sqrMagnitude = vec2LengthSquared(a);

    if (sqrMagnitude > maxLength * maxLength)
    {
        const mag = Math.sqrt(sqrMagnitude);

        // 这两个中间变量强制中间结果为 float 精度（照抄原实现的说明）
        const normalizedX = a.x / mag;
        const normalizedY = a.y / mag;

        out.x = normalizedX * maxLength;
        out.y = normalizedY * maxLength;
    }
    else
    {
        out.x = a.x;
        out.y = a.y;
    }

    return out;
}
