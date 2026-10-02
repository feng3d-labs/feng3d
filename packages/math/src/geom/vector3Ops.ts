import { mathUtil } from '@feng3d/polyfill';
import { Mathf } from '../MathF';
import type { Vector3Like } from './Vector3';

/**
 * 把 `Vector3Like` 也**从本模块导出**，供其它 `*Ops` 文件 type-only 取用。
 *
 * 它原先只 type-only 进本文件、不对外导出，导致 `quaternionOps.ts` 与 `segment3Ops.ts`
 * 各写一次 `import type { Vector3Like } from './vector3Ops'` 都报 TS2459
 * （而 vitest 全绿，因为 esbuild 会剥掉类型——方案 §10.1 的 P8）。阶段 C 会把
 * `Vector3Like` 的定义搬到本文件，那时这行 re-export 正好就是定义处。
 */
export type { Vector3Like };

/**
 * 可写回的三维向量目标（纯函数的 `out` 参数用；class 实例与普通字面量都满足）。
 */
export interface WritableVector3Like
{
    x: number;
    y: number;
    z: number;
}

/**
 * 与 `Vector3.kEpsilon` 同值（后者现在直接引用本常量，单一来源）。
 */
export const VEC3_EPSILON = 0.00001;

/**
 * 与 `Vector3.kEpsilonNormalSqrt` 同值（后者现在直接引用本常量，单一来源）。
 */
export const VEC3_EPSILON_NORMAL_SQRT = 1e-15;

/**
 * (0,0,0)——与 `Vector3.zero` / `Vector3.ZERO` 同值。
 *
 * 冻结后 `Object.isExtensible` 不通过，响应式系统不会对它建代理（AGENTS §8.7）。
 */
export const VEC3_ZERO: Vector3Like = Object.freeze({ x: 0, y: 0, z: 0 });

/**
 * (1,1,1)——与 `Vector3.one` / `Vector3.ONE` 同值。
 */
export const VEC3_ONE: Vector3Like = Object.freeze({ x: 1, y: 1, z: 1 });

/**
 * (1,0,0)——与 `Vector3.X_AXIS` / `Vector3.right` 同值。
 */
export const VEC3_X_AXIS: Vector3Like = Object.freeze({ x: 1, y: 0, z: 0 });

/**
 * (0,1,0)——与 `Vector3.Y_AXIS` / `Vector3.up` 同值。
 */
export const VEC3_Y_AXIS: Vector3Like = Object.freeze({ x: 0, y: 1, z: 0 });

/**
 * (0,0,1)——与 `Vector3.Z_AXIS` / `Vector3.back` 同值。
 */
export const VEC3_Z_AXIS: Vector3Like = Object.freeze({ x: 0, y: 0, z: 1 });

/**
 * (0,1,0)——与 `Vector3.up` 同值。
 *
 * 与 `VEC3_Y_AXIS` 同值但**不是同一个对象**：class 上的 `Vector3.Y_AXIS` 与 `Vector3.up`
 * 本就是两套独立常量，这里如实保留，迁移时一一对应。阶段 C 后若确认无消费方区分二者，可只留一套。
 */
export const VEC3_UP: Vector3Like = Object.freeze({ x: 0, y: 1, z: 0 });

/**
 * (0,-1,0)——与 `Vector3.down` 同值。
 */
export const VEC3_DOWN: Vector3Like = Object.freeze({ x: 0, y: -1, z: 0 });

/**
 * (1,0,0)——与 `Vector3.right` 同值（与 `VEC3_X_AXIS` 同值不同对象）。
 */
export const VEC3_RIGHT: Vector3Like = Object.freeze({ x: 1, y: 0, z: 0 });

/**
 * (-1,0,0)——与 `Vector3.left` 同值。
 */
export const VEC3_LEFT: Vector3Like = Object.freeze({ x: -1, y: 0, z: 0 });

/**
 * (0,0,-1)——与 `Vector3.forward` 同值。
 */
export const VEC3_FORWARD: Vector3Like = Object.freeze({ x: 0, y: 0, z: -1 });

/**
 * (0,0,1)——与 `Vector3.back` 同值（与 `VEC3_Z_AXIS` 同值不同对象）。
 */
export const VEC3_BACK: Vector3Like = Object.freeze({ x: 0, y: 0, z: 1 });

/**
 * (Infinity,Infinity,Infinity)——与 `Vector3.positiveInfinity` 同值。
 */
export const VEC3_POSITIVE_INFINITY: Vector3Like = Object.freeze({ x: Infinity, y: Infinity, z: Infinity });

/**
 * (-Infinity,-Infinity,-Infinity)——与 `Vector3.negativeInfinity` 同值。
 */
export const VEC3_NEGATIVE_INFINITY: Vector3Like = Object.freeze({ x: -Infinity, y: -Infinity, z: -Infinity });

/**
 * `Vector3` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` 阶段 A1）。
 *
 * ## 约定
 *
 * - **不修改入参**：结果写进 `out`（缺省时新建普通字面量）；
 * - `out` 传自己就是「就地运算」，所以 class 上的 `add(v)` 与 `addTo(v, vout)` 是**同一个函数**，
 *   只是 `out` 实参不同（方案 §3.3）；
 * - 跨类型运算（矩阵 / 四元数 / Vector2 / Vector4 / Matrix3x3）**不在本文件**，见方案 §5.5 的 A3 步；
 * - 依赖只有 `@feng3d/polyfill` 的 `mathUtil` 与 `../MathF` 的纯静态数值工具。
 *   `Vector3Like` 用 **type-only import** 取自 `./Vector3`（编译后完全擦除），
 *   所以运行时依赖只有 `Vector3.ts → vector3Ops.ts` 一个方向，不会形成模块环；
 *   本文件**不 import 任何 math 数据类**（值导入那才会成环）。
 *
 * ## 文件命名（踩坑记录）
 *
 * 本文件与 `Color3` 的 `src/color/color3Ops.ts` 同构：Like 类型 + 常量 + 纯函数同文件。
 * **不能**把数据定义放成 `vector3.ts`——在 Windows / macOS 这类**大小写不敏感**的文件系统上，
 * 它与 `Vector3.ts` 是同一个文件，写入会直接覆盖 class 定义（实施本方案时确实踩到过，靠 git 恢复）。
 */

/**
 * `Vector3.set` 的纯函数形式：用三个分量填充 `out`（缺省新建）。
 */
export function vec3From(x: number, y: number, z: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = x;
    out.y = y;
    out.z = z;

    return out;
}

/**
 * `Vector3.setZero` 的纯函数形式：把 `out` 的所有分量置零。
 */
export function vec3SetZero(out: WritableVector3Like): WritableVector3Like
{
    out.x = out.y = out.z = 0;

    return out;
}

/**
 * `Vector3.fromArray` 的纯函数形式：从数组的 `offset` 起读三个分量写入 `out`（缺省新建）。
 */
export function vec3FromArray(array: ArrayLike<number>, offset = 0, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = array[offset];
    out.y = array[offset + 1];
    out.z = array[offset + 2];

    return out;
}

/**
 * `Vector3.toArray` 的纯函数形式：把分量写进 `array` 的 `offset` 起三位并返回该数组。
 */
export function vec3ToArray(a: Vector3Like, array: number[] = [], offset = 0): number[]
{
    array[offset] = a.x;
    array[offset + 1] = a.y;
    array[offset + 2] = a.z;

    return array;
}

/**
 * `Vector3.copy` / `Vector3.clone` 的纯函数形式：把 `a` 的分量复制进 `out`（缺省新建）。
 */
export function vec3Copy(a: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x;
    out.y = a.y;
    out.z = a.z;

    return out;
}

/**
 * `Vector3.equals` 的纯函数形式：逐分量按 `precision` 判等。
 */
export function vec3Equals(a: Vector3Like, b: Vector3Like, precision = mathUtil.PRECISION): boolean
{
    if (!mathUtil.equals(a.x - b.x, 0, precision))
    {
        return false;
    }
    if (!mathUtil.equals(a.y - b.y, 0, precision))
    {
        return false;
    }
    if (!mathUtil.equals(a.z - b.z, 0, precision))
    {
        return false;
    }

    return true;
}

/**
 * `Vector3.isZero` 的纯函数形式：三个分量是否都严格等于 0。
 */
export function vec3IsZero(a: Vector3Like): boolean
{
    return a.x === 0 && a.y === 0 && a.z === 0;
}

/**
 * `Vector3.almostZero` 的纯函数形式：三个分量的绝对值是否都不超过 `precision`。
 */
export function vec3AlmostZero(a: Vector3Like, precision = mathUtil.PRECISION): boolean
{
    if (Math.abs(a.x) > precision
        || Math.abs(a.y) > precision
        || Math.abs(a.z) > precision)
    {
        return false;
    }

    return true;
}

/** `Vector3.add` / `Vector3.addTo` 的纯函数形式：分量相加，结果写进 `out`。 */
export function vec3Add(a: Vector3Like, b: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x + b.x;
    out.y = a.y + b.y;
    out.z = a.z + b.z;

    return out;
}

/** `Vector3.sub` / `Vector3.subTo` 的纯函数形式：分量相减，结果写进 `out`。 */
export function vec3Sub(a: Vector3Like, b: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x - b.x;
    out.y = a.y - b.y;
    out.z = a.z - b.z;

    return out;
}

/** `Vector3.multiply` / `Vector3.multiplyTo` 的纯函数形式：分量相乘，结果写进 `out`。 */
export function vec3Multiply(a: Vector3Like, b: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x * b.x;
    out.y = a.y * b.y;
    out.z = a.z * b.z;

    return out;
}

/**
 * `Vector3.scale` / `Vector3.scaleTo` / `Vector3.Scale` 的纯函数形式。
 *
 * 与 `vec3Multiply` **同义**（实现只有一份，这里是转发入口）。
 */
export function vec3Scale(a: Vector3Like, b: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    return vec3Multiply(a, b, out);
}

/** `Vector3.divide` / `Vector3.divideTo` 的纯函数形式：分量相除，结果写进 `out`。 */
export function vec3Divide(a: Vector3Like, b: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x / b.x;
    out.y = a.y / b.y;
    out.z = a.z / b.z;

    return out;
}

/** `Vector3.negate` / `Vector3.negateTo` 的纯函数形式：取负，结果写进 `out`。 */
export function vec3Negate(a: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = -a.x;
    out.y = -a.y;
    out.z = -a.z;

    return out;
}

/** `Vector3.inverse` / `Vector3.inverseTo` 的纯函数形式：分量取倒数，结果写进 `out`。 */
export function vec3Inverse(a: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = 1 / a.x;
    out.y = 1 / a.y;
    out.z = 1 / a.z;

    return out;
}

/** `Vector3.addNumber` / `Vector3.addNumberTo` 的纯函数形式：各分量加标量 `n`。 */
export function vec3AddNumber(a: Vector3Like, n: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x + n;
    out.y = a.y + n;
    out.z = a.z + n;

    return out;
}

/** `Vector3.subNumber` / `Vector3.subNumberTo` 的纯函数形式：各分量减标量 `n`。 */
export function vec3SubNumber(a: Vector3Like, n: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x - n;
    out.y = a.y - n;
    out.z = a.z - n;

    return out;
}

/**
 * `Vector3.scaleNumber` / `Vector3.scaleNumberTo` / `Vector3.multiplyNumber` / `Vector3.multiplyNumberTo`
 * 的纯函数形式：各分量乘标量 `n`。
 */
export function vec3ScaleNumber(a: Vector3Like, n: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x * n;
    out.y = a.y * n;
    out.z = a.z * n;

    return out;
}

/** `Vector3.divideNumber` / `Vector3.divideNumberTo` 的纯函数形式：各分量除标量 `n`。 */
export function vec3DivideNumber(a: Vector3Like, n: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x / n;
    out.y = a.y / n;
    out.z = a.z / n;

    return out;
}

/**
 * `Vector3.addScaledVector` / `Vector3.addScaledVectorTo` 的纯函数形式：`out = a + b * scalar`。
 */
export function vec3AddScaled(a: Vector3Like, scalar: number, b: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x + (scalar * b.x);
    out.y = a.y + (scalar * b.y);
    out.z = a.z + (scalar * b.z);

    return out;
}

/** `Vector3.dot` / `Vector3.Dot` 的纯函数形式：点乘。 */
export function vec3Dot(a: Vector3Like, b: Vector3Like): number
{
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
}

/**
 * `Vector3.cross` / `Vector3.crossTo` / `Vector3.Cross` 的纯函数形式：叉乘，结果写进 `out`。
 *
 * **三个分量先全部算进局部变量再写 `out`**——每个分量都跨分量读入参，
 * 若边算边写、且 `out` 与 `a` 是同一个对象（`cross(a)` 的就地用法），
 * 第二个分量就会读到已经被改写的 `a.x`（实测踩到：Triangle3 的用例成片失败）。
 * 原 `cross()` 用 `set(x, y, z)` 一次性传参，天然规避了这点。
 */
export function vec3Cross(a: Vector3Like, b: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const x = (a.y * b.z) - (a.z * b.y);
    const y = (a.z * b.x) - (a.x * b.z);
    const z = (a.x * b.y) - (a.y * b.x);

    out.x = x;
    out.y = y;
    out.z = z;

    return out;
}

/** `Vector3.length` / `Vector3.magnitude` / `Vector3.Magnitude` 的纯函数形式：向量长度。 */
export function vec3Length(a: Vector3Like): number
{
    return Math.sqrt(vec3LengthSquared(a));
}

/** `Vector3.lengthSquared` / `Vector3.sqrMagnitude` / `Vector3.SqrMagnitude` 的纯函数形式：长度平方。 */
export function vec3LengthSquared(a: Vector3Like): number
{
    return (a.x * a.x) + (a.y * a.y) + (a.z * a.z);
}

/** `Vector3.distance` / `Vector3.Distance` 的纯函数形式：两点距离。 */
export function vec3Distance(a: Vector3Like, b: Vector3Like): number
{
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;

    return Math.sqrt((dx * dx) + (dy * dy) + (dz * dz));
}

/** `Vector3.distanceSquared` 的纯函数形式：两点距离平方。 */
export function vec3DistanceSquared(a: Vector3Like, b: Vector3Like): number
{
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;

    return (dx * dx) + (dy * dy) + (dz * dz);
}

/**
 * `Vector3.normalize` 的纯函数形式：按 `thickness` 缩放为指定长度，结果写进 `out`。
 *
 * 注意与 `vec3Normalized` 的差异（**两者语义不同，不能互替**）：
 * 这里用「长度平方 > 0」判定，零向量置零；`vec3Normalized` 用 `VEC3_EPSILON` 判定。
 */
export function vec3NormalizeThickness(a: Vector3Like, thickness = 1, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    let length = vec3LengthSquared(a);

    if (length > 0)
    {
        length = Math.sqrt(length);
        const invLength = thickness / length;

        out.x = a.x * invLength;
        out.y = a.y * invLength;
        out.z = a.z * invLength;
    }
    else
    {
        out.x = 0;
        out.y = 0;
        out.z = 0;
    }

    return out;
}

/**
 * `Vector3.Normalize` / `Vector3.normalized` 的纯函数形式：单位化，结果写进 `out`。
 *
 * 长度不大于 `VEC3_EPSILON` 时置零。
 */
export function vec3Normalized(a: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const mag = vec3Length(a);

    if (mag > VEC3_EPSILON)
    {
        out.x = a.x / mag;
        out.y = a.y / mag;
        out.z = a.z / mag;
    }
    else
    {
        out.x = 0;
        out.y = 0;
        out.z = 0;
    }

    return out;
}

/**
 * `Vector3.unit` 的纯函数形式：单位化，结果写进 `out`。
 *
 * 与 `vec3Normalized` 的差异：**零向量时返回 `(1,0,0)`** 而不是零向量。
 */
export function vec3Unit(a: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const x = a.x;
    const y = a.y;
    const z = a.z;
    let ninv = (x * x) + (y * y) + (z * z);

    if (ninv > 0.0)
    {
        ninv = Math.sqrt(ninv);

        ninv = 1.0 / ninv;
        out.x = x * ninv;
        out.y = y * ninv;
        out.z = z * ninv;
    }
    else
    {
        out.x = 1;
        out.y = 0;
        out.z = 0;
    }

    return out;
}

/**
 * `Vector3.lerp` / `Vector3.lerpTo` 的纯函数形式：按**分量**插值系数 `alpha` 插值。
 */
export function vec3Lerp(a: Vector3Like, b: Vector3Like, alpha: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x + ((b.x - a.x) * alpha.x);
    out.y = a.y + ((b.y - a.y) * alpha.y);
    out.z = a.z + ((b.z - a.z) * alpha.z);

    return out;
}

/**
 * `Vector3.lerpNumber` / `Vector3.lerpNumberTo` / `Vector3.LerpUnclamped` 的纯函数形式：
 * 按标量 `t` 插值，**不夹取** `t`。
 */
export function vec3LerpNumber(a: Vector3Like, b: Vector3Like, t: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.x + ((b.x - a.x) * t);
    out.y = a.y + ((b.y - a.y) * t);
    out.z = a.z + ((b.z - a.z) * t);

    return out;
}

/**
 * `Vector3.Lerp` 的纯函数形式：按标量 `t` 插值，`t` 先经 `Mathf.Clamp01` 夹取。
 */
export function vec3LerpClamped(a: Vector3Like, b: Vector3Like, t: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    t = Mathf.Clamp01(t);

    out.x = a.x + ((b.x - a.x) * t);
    out.y = a.y + ((b.y - a.y) * t);
    out.z = a.z + ((b.z - a.z) * t);

    return out;
}

/**
 * `Vector3.clamp` / `Vector3.clampTo` 的纯函数形式：逐分量夹取到 `[min, max]`。
 */
export function vec3Clamp(a: Vector3Like, min: Vector3Like, max: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = mathUtil.clamp(a.x, min.x, max.x);
    out.y = mathUtil.clamp(a.y, min.y, max.y);
    out.z = mathUtil.clamp(a.z, min.z, max.z);

    return out;
}

/**
 * `Vector3.min` 的纯函数形式：逐分量取较小值（`Math.min` 语义，与 `Vector3.Min` 的 `Mathf.Min` 不同，见下）。
 */
export function vec3Min(a: Vector3Like, b: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = Math.min(a.x, b.x);
    out.y = Math.min(a.y, b.y);
    out.z = Math.min(a.z, b.z);

    return out;
}

/**
 * `Vector3.max` 的纯函数形式：逐分量取较大值（`Math.max` 语义）。
 */
export function vec3Max(a: Vector3Like, b: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = Math.max(a.x, b.x);
    out.y = Math.max(a.y, b.y);
    out.z = Math.max(a.z, b.z);

    return out;
}

/** `Vector3.floor` 的纯函数形式：逐分量向下取整。 */
export function vec3Floor(a: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = Math.floor(a.x);
    out.y = Math.floor(a.y);
    out.z = Math.floor(a.z);

    return out;
}

/** `Vector3.ceil` 的纯函数形式：逐分量向上取整。 */
export function vec3Ceil(a: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = Math.ceil(a.x);
    out.y = Math.ceil(a.y);
    out.z = Math.ceil(a.z);

    return out;
}

/** `Vector3.round` 的纯函数形式：逐分量四舍五入。 */
export function vec3Round(a: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = Math.round(a.x);
    out.y = Math.round(a.y);
    out.z = Math.round(a.z);

    return out;
}

/** `Vector3.roundToZero` 的纯函数形式：逐分量向 0 取整。 */
export function vec3RoundToZero(a: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = (a.x < 0) ? Math.ceil(a.x) : Math.floor(a.x);
    out.y = (a.y < 0) ? Math.ceil(a.y) : Math.floor(a.y);
    out.z = (a.z < 0) ? Math.ceil(a.z) : Math.floor(a.z);

    return out;
}

/**
 * `Vector3.reflect` / `Vector3.Reflect` 的纯函数形式：按法线 `normal` 反射，结果写进 `out`。
 */
export function vec3Reflect(a: Vector3Like, normal: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const factor = 2 * vec3Dot(a, normal);

    out.x = a.x - (normal.x * factor);
    out.y = a.y - (normal.y * factor);
    out.z = a.z - (normal.z * factor);

    return out;
}

/** `Vector3.less` 的纯函数形式：三个分量是否都严格小于 `b`。 */
export function vec3Less(a: Vector3Like, b: Vector3Like): boolean
{
    return a.x < b.x && a.y < b.y && a.z < b.z;
}

/** `Vector3.lessequal` 的纯函数形式：三个分量是否都小于等于 `b`。 */
export function vec3LessEqual(a: Vector3Like, b: Vector3Like): boolean
{
    return a.x <= b.x && a.y <= b.y && a.z <= b.z;
}

/** `Vector3.greater` 的纯函数形式：三个分量是否都严格大于 `b`。 */
export function vec3Greater(a: Vector3Like, b: Vector3Like): boolean
{
    return a.x > b.x && a.y > b.y && a.z > b.z;
}

/** `Vector3.greaterequal` 的纯函数形式：三个分量是否都大于等于 `b`。 */
export function vec3GreaterEqual(a: Vector3Like, b: Vector3Like): boolean
{
    return a.x >= b.x && a.y >= b.y && a.z >= b.z;
}

/**
 * `Vector3.isParallel` 的纯函数形式：两向量是否平行（叉乘长度按 `precision` 判零）。
 */
export function vec3IsParallel(a: Vector3Like, b: Vector3Like, precision = mathUtil.PRECISION): boolean
{
    return mathUtil.equals(vec3LengthSquared(vec3Cross(a, b)), 0, precision);
}

/**
 * `Vector3.isAntiparallelTo` 的纯函数形式：`a` 取负后是否与 `b` 相等（按 `precision`）。
 */
export function vec3IsAntiparallel(a: Vector3Like, b: Vector3Like, precision = mathUtil.PRECISION): boolean
{
    return vec3Equals(vec3Negate(a), b, precision);
}

/**
 * `Vector3.tangents` 的纯函数形式：求 `a` 的两个切向量，分别写进 `t1` / `t2`。
 *
 * 两个 `out` 都是必需参数（原方法就是通过两个入参回填），没有返回值。
 */
export function vec3Tangents(a: Vector3Like, t1: WritableVector3Like, t2: WritableVector3Like): void
{
    const norm = vec3Length(a);

    if (norm > 0.0)
    {
        const n = vec3ScaleNumber(a, 1 / norm);
        const randVec = Math.abs(n.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };

        vec3Cross(n, randVec, t1);
        vec3Cross(n, t1, t2);
    }
    else
    {
        // 法线长度为 0，随便取一组
        t1.x = 1;
        t1.y = 0;
        t1.z = 0;
        t2.x = 0;
        t2.y = 1;
        t2.z = 0;
    }
}

/**
 * `Vector3.random`（实例与静态同义）的纯函数形式：随机向量，结果写进 `out`。
 *
 * @param size 尺寸
 * @param double 为 `false` 时范围 `[0,size]`，为 `true` 时 `[-size,size]`
 */
export function vec3Random(size = 1, double = false, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = Math.random();
    out.y = Math.random();
    out.z = Math.random();

    if (double)
    {
        out.x = (out.x * 2) - 1;
        out.y = (out.y * 2) - 1;
        out.z = (out.z * 2) - 1;
    }

    out.x *= size;
    out.y *= size;
    out.z *= size;

    return out;
}

/**
 * `Vector3.toString` 的纯函数形式。
 */
export function vec3ToString(a: Vector3Like): string
{
    return `<${a.x}, ${a.y}, ${a.z}>`;
}

/**
 * `Vector3.Angle` 的纯函数形式：两向量夹角（度）。
 */
export function vec3Angle(a: Vector3Like, b: Vector3Like): number
{
    // sqrt(a) * sqrt(b) = sqrt(a * b) —— 对实数成立
    const denominator = Math.sqrt(vec3LengthSquared(a) * vec3LengthSquared(b));

    if (denominator < VEC3_EPSILON_NORMAL_SQRT)
    {
        return 0;
    }

    const dot = Mathf.Clamp(vec3Dot(a, b) / denominator, -1, 1);

    return Math.acos(dot) * Mathf.Rad2Deg;
}

/**
 * `Vector3.SignedAngle` 的纯函数形式：绕 `axis` 的有符号夹角（度）。
 */
export function vec3SignedAngle(a: Vector3Like, b: Vector3Like, axis: Vector3Like): number
{
    const unsignedAngle = vec3Angle(a, b);

    const crossX = (a.y * b.z) - (a.z * b.y);
    const crossY = (a.z * b.x) - (a.x * b.z);
    const crossZ = (a.x * b.y) - (a.y * b.x);
    const sign = Mathf.Sign((axis.x * crossX) + (axis.y * crossY) + (axis.z * crossZ));

    return unsignedAngle * sign;
}
