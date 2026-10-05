import { mathUtil } from '@feng3d/polyfill';
import { MATHF_EPSILON, MATHF_RAD2DEG, mathfClamp, mathfClamp01, mathfMax, mathfMin, mathfSign } from '../mathf';
import type { Vector2Like, WritableVector2Like } from './vector2';
import type { WritableVector4Like } from './vector4';

/**
 * 纯函数可接受的三维向量形状（**只读**）。
 *
 * 阶段 C-f 起**定义在本文件**（原先定义在 class 文件 `Vector3.ts` 里、此处只是 type-only
 * 重导出，删 class 前必须先搬家——方案 §11.7.7 的 P4 与 §11.7.8 的 N3）。
 *
 * **阶段 C 收尾统一了 readonly 口径**：原先本接口沿用 class 时代的定义（分量可变），
 * 而其余 18 个 `*Like`（`Vector2Like` / `Vector4Like` / `QuaternionLike` / `Line3Like` …）
 * 全部是只读——同一个「纯函数入参形状」两套口径没有理由。现在统一为
 * **`XxxLike` 只读、`WritableXxxLike` 可写**：入参用前者（纯函数承诺不改入参），
 * `out` 参数用后者（方案 §3.3 / §3.4）。这也让「就地改分量」这类误用由静态类型挡住
 * （C-f 在 `Vector4Like` 上实测过这个保护，见 §11.14.6 的 C-f-3）。
 */
export interface Vector3Like
{
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

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
 * `Vector3` 纯数据接口（**带判别字段**，方案 §5.9 的 D1 决策）。
 *
 * `Vector3Like` / `WritableVector3Like` **刻意不带** `__type__`：它们是 A / B 阶段用来放宽
 * feng3d 签名的「最小形状」，带上判别字段会成片传导给普通字面量消费方。
 *
 * 阶段 C-f 起 class 已删除，本接口与 `*Like` 同址（方案 §3.1）：
 * `import { Vector3 } from '@feng3d/math'` 一字不改。
 */
export interface Vector3 extends Vector3Like
{
    readonly __type__: 'Vector3';
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
 * - 跨类型运算（矩阵 / 四元数 / Vector2 / Vector4 / Matrix3x3）**不都在本文件**：
 *   `applyMatrix4x4` / `applyQuaternion` / `crossmat` 的纯函数形式分别是
 *   `mat4TransformPoint3`（`matrix4x4.ts`）、`quatVmult`（`quaternion.ts`）、
 *   `mat3Set`（`matrix3x3.ts`）——它们是**对方类型的 ops**，A3 起 class 直接委托过去；
 *   只有 `Vector2` / `Vector4` 面向的三个转换函数（`vec2ToVec3` / `vec3ToVec2` / `vec3ToVec4`）
 *   落在本文件，且只用 **type-only import** 取对方的数据形状，不引入新的运行时依赖（方案 §5.5）；
 * - 依赖只有 `@feng3d/polyfill` 的 `mathUtil` 与 `../MathF` 的纯静态数值工具。
 *   `Vector3Like` / `WritableVector3Like` / `Vector3` 三个形状**就定义在本文件**
 *   （阶段 C-f 从 class 文件 `Vector3.ts` 搬来）；
 *   本文件**不 import 任何 math 数据类**（值导入那才会成环），
 *   也**不读任何全局状态**（原 class 的 `SmoothDamp*` 隐式读 `Time.deltaTime`，
 *   纯函数形式改由调用方显式传 `deltaTime`——方案 §3.5）。
 *
 * ## 文件命名（踩坑记录）
 *
 * 本文件与 `Color3` 的 `src/color/color3.ts` 同构：Like 类型 + 常量 + 纯函数同文件。
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
 * `Vector3.Lerp` 的纯函数形式：按标量 `t` 插值，`t` 先经 `mathfClamp01` 夹取。
 */
export function vec3LerpClamped(a: Vector3Like, b: Vector3Like, t: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    t = mathfClamp01(t);

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
 * `Vector3.min` 的纯函数形式：逐分量取较小值（`Math.min` 语义，与 `Vector3.Min` 的 `mathfMin` 不同，见下）。
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

    const dot = mathfClamp(vec3Dot(a, b) / denominator, -1, 1);

    return Math.acos(dot) * MATHF_RAD2DEG;
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
    const sign = mathfSign((axis.x * crossX) + (axis.y * crossY) + (axis.z * crossZ));

    return unsignedAngle * sign;
}

// ---------------------------------------------------------------------------
// A3 跨类型转换（Vector3 ↔ Vector2 / Vector4）
//
// 三个函数都**只写目标需要的分量**，与 class 原实现逐字对应：
// `fromVector2` 写 x/y/z（z 由调用方给值）、`toVector2` 写 x/y、
// `toVector4` 只写 x/y/z 而**保留 out.w 原值**（原实现同样不碰 w）。
// 对方形状一律 type-only import，所以本文件仍不产生跨类型的运行时依赖。
// ---------------------------------------------------------------------------

/**
 * `Vector3.fromVector2`（静态与实例同义）的纯函数形式：`x/y` 取自二维向量，`z` 由调用方给值。
 *
 * `z` **不给默认值**：class 方法签名上的 `z = 0` 由 `Vector3.ts` 侧补齐再传进来
 * （与 `vec4From` 同规矩，缺省值只属于 class 的公开签名）。
 */
export function vec2ToVec3(vector: Vector2Like, z: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = vector.x;
    out.y = vector.y;
    out.z = z;

    return out;
}

/**
 * `Vector3.toVector2` 的纯函数形式：取 `x/y` 写进 `out`（缺省新建普通字面量）。
 */
export function vec3ToVec2(a: Vector3Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    out.x = a.x;
    out.y = a.y;

    return out;
}

/**
 * `Vector3.toVector4` 的纯函数形式：取 `x/y/z` 写进 `out`。
 *
 * ★ 与 `vec4FromVector3` 的区别：本函数**不写 `w`**——原 `Vector3.toVector4(vector4)` 就只赋
 * `vector4.x/y/z`，`w` 保持调用方原有值。缺省 `out` 取 `w: 0`（与 `new Vector4()` 一致，方案 §10.1 P6）。
 */
export function vec3ToVec4(a: Vector3Like, out: WritableVector4Like = { x: 0, y: 0, z: 0, w: 0 }): WritableVector4Like
{
    out.x = a.x;
    out.y = a.y;
    out.z = a.z;

    return out;
}

// ---------------------------------------------------------------------------
// 阶段 C-f 补齐：原 class 里「方法体不是一行转发」的成员，删 class 前必须有对应纯函数，
// 否则删 class 会把能力一起删掉（C-e 的 `Quaternion.random` / `Box3.random` 教训）。
// ---------------------------------------------------------------------------

/**
 * `Vector3.MoveTowards`（静态）的纯函数形式：从 `current` 朝 `target` 移动至多 `maxDistanceDelta`。
 *
 * 两条**逐字保留**的既有行为（与 `vec4MoveTowards` 同款，不要顺手「修正」）：
 *
 * 1. 退化分支（已在目标上，或 `maxDistanceDelta >= 0` 且距离不超过步长）**返回 `target` 本身**，
 *    即把一个入参当返回值共享出去（方案 §5.3 的同型问题）；
 * 2. `maxDistanceDelta < 0` 时不走上面的「到达」分支，即使距离为 0 也会继续算下去（`0/0 * 负数` 得 `NaN`）。
 *
 * 因为退化分支返回的是**只读形状**的 `target`，返回类型放宽为 `Vector3Like | WritableVector3Like`。
 */
export function vec3MoveTowards(current: Vector3Like, target: Vector3Like, maxDistanceDelta: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): Vector3Like | WritableVector3Like
{
    const toVectorX = target.x - current.x;
    const toVectorY = target.y - current.y;
    const toVectorZ = target.z - current.z;

    const sqdist = (toVectorX * toVectorX) + (toVectorY * toVectorY) + (toVectorZ * toVectorZ);

    if (sqdist === 0 || (maxDistanceDelta >= 0 && sqdist <= maxDistanceDelta * maxDistanceDelta))
    {
        return target;
    }

    const dist = Math.sqrt(sqdist);

    out.x = current.x + toVectorX / dist * maxDistanceDelta;
    out.y = current.y + toVectorY / dist * maxDistanceDelta;
    out.z = current.z + toVectorZ / dist * maxDistanceDelta;

    return out;
}

/**
 * `Vector3.SmoothDamp` / `SmoothDamp1` / `SmoothDamp2`（三个静态重载）合并后的纯函数形式。
 *
 * 三个 class 方法只差默认实参（`SmoothDamp1` 的 `maxSpeed = Infinity`、
 * `SmoothDamp2` 的 `deltaTime = Time.deltaTime`），所以纯函数层只要一个**参数齐全**的版本。
 *
 * ## 三条必须逐字保留的既有行为
 *
 * 1. **`deltaTime` 显式传入**：原 `SmoothDamp` / `SmoothDamp1` / `SmoothDamp2` 会隐式读
 *    全局 `Time.deltaTime`，纯函数层不读全局状态（方案 §3.5）；
 * 2. **`target` 与 `currentVelocity` 都是「入参兼输出」**：原方法会把 `target` 当临时变量改写
 *    （`target.x = current.x - changeX`），也会回写 `currentVelocity`。这是 §5.2 的「隐式多输出」，
 *    在纯函数层用**可写形参**显式化——签名即契约，行为逐字不变；
 * 3. `originalTo` 是 `target` 的**别名**，`target` 被改写后 `originalTo` 读到的也是新值
 *    （`origMinusCurrent` 因此退化成 `-change`）。这是既有实现的实际语义，不是笔误，逐字保留。
 *
 * `out` 是返回值（`new Vector3(...)` 的等价物），缺省新建普通字面量。
 */
export function vec3SmoothDamp(
    current: Vector3Like,
    target: WritableVector3Like,
    currentVelocity: WritableVector3Like,
    smoothTime: number,
    maxSpeed: number,
    deltaTime: number,
    out: WritableVector3Like = { x: 0, y: 0, z: 0 },
): WritableVector3Like
{
    let outputX = 0;
    let outputY = 0;
    let outputZ = 0;

    // Based on Game Programming Gems 4 Chapter 1.10
    smoothTime = mathfMax(0.0001, smoothTime);
    const omega = 2 / smoothTime;

    const x = omega * deltaTime;
    const exp = 1 / (1 + x + (0.48 * x * x) + (0.235 * x * x * x));

    let changeX = current.x - target.x;
    let changeY = current.y - target.y;
    let changeZ = current.z - target.z;
    const originalTo = target;

    // Clamp maximum speed
    const maxChange = maxSpeed * smoothTime;

    const maxChangeSq = maxChange * maxChange;
    const sqrmag = (changeX * changeX) + (changeY * changeY) + (changeZ * changeZ);

    if (sqrmag > maxChangeSq)
    {
        const mag = Math.sqrt(sqrmag);

        changeX = changeX / mag * maxChange;
        changeY = changeY / mag * maxChange;
        changeZ = changeZ / mag * maxChange;
    }

    target.x = current.x - changeX;
    target.y = current.y - changeY;
    target.z = current.z - changeZ;

    const tempX = (currentVelocity.x + omega * changeX) * deltaTime;
    const tempY = (currentVelocity.y + omega * changeY) * deltaTime;
    const tempZ = (currentVelocity.z + omega * changeZ) * deltaTime;

    currentVelocity.x = (currentVelocity.x - omega * tempX) * exp;
    currentVelocity.y = (currentVelocity.y - omega * tempY) * exp;
    currentVelocity.z = (currentVelocity.z - omega * tempZ) * exp;

    outputX = target.x + (changeX + tempX) * exp;
    outputY = target.y + (changeY + tempY) * exp;
    outputZ = target.z + (changeZ + tempZ) * exp;

    // Prevent overshooting
    const origMinusCurrentX = originalTo.x - current.x;
    const origMinusCurrentY = originalTo.y - current.y;
    const origMinusCurrentZ = originalTo.z - current.z;
    const outMinusOrigX = outputX - originalTo.x;
    const outMinusOrigY = outputY - originalTo.y;
    const outMinusOrigZ = outputZ - originalTo.z;

    if ((origMinusCurrentX * outMinusOrigX) + (origMinusCurrentY * outMinusOrigY) + (origMinusCurrentZ * outMinusOrigZ) > 0)
    {
        outputX = originalTo.x;
        outputY = originalTo.y;
        outputZ = originalTo.z;

        currentVelocity.x = (outputX - originalTo.x) / deltaTime;
        currentVelocity.y = (outputY - originalTo.y) / deltaTime;
        currentVelocity.z = (outputZ - originalTo.z) / deltaTime;
    }

    out.x = outputX;
    out.y = outputY;
    out.z = outputZ;

    return out;
}

/**
 * `Vector3.Project`（静态）的纯函数形式：把 `vector` 投影到 `onNormal` 上。
 *
 * ★ **行为变更（方案 §5.3 的定案）**：原实现在退化分支（`|onNormal|² < MATHF_EPSILON`）
 * **返回共享的冻结常量 `Vector3.zero`**，纯函数层改为**把 `out` 写零并返回 `out`**。
 * 取值语义完全一致（都是 `(0,0,0)`），差别只在身份：拿返回值去写会抛 `TypeError`
 * 这个既有缺陷一并没有了。全仓可执行调用点只有在 `math/test`。
 */
export function vec3Project(vector: Vector3Like, onNormal: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const sqrMag = vec3Dot(onNormal, onNormal);

    if (sqrMag < MATHF_EPSILON)
    {
        out.x = 0;
        out.y = 0;
        out.z = 0;

        return out;
    }
    const dot = vec3Dot(vector, onNormal);

    out.x = onNormal.x * dot / sqrMag;
    out.y = onNormal.y * dot / sqrMag;
    out.z = onNormal.z * dot / sqrMag;

    return out;
}

/**
 * `Vector3.ProjectOnPlane`（静态）的纯函数形式：把 `vector` 投影到「以 `planeNormal` 为法线的平面」上。
 *
 * ★ **行为变更（方案 §5.3 的定案）**：原实现在退化分支（`|planeNormal|² < MATHF_EPSILON`）
 * **直接返回入参 `vector` 本身**，纯函数层改为**把 `vector` 的取值拷进 `out` 并返回 `out`**。
 * 取值语义一致，身份语义从「共享入参」变成「新建」。
 */
export function vec3ProjectOnPlane(vector: Vector3Like, planeNormal: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const sqrMag = vec3Dot(planeNormal, planeNormal);

    if (sqrMag < MATHF_EPSILON)
    {
        return vec3Copy(vector, out);
    }
    const dot = vec3Dot(vector, planeNormal);

    out.x = vector.x - planeNormal.x * dot / sqrMag;
    out.y = vector.y - planeNormal.y * dot / sqrMag;
    out.z = vector.z - planeNormal.z * dot / sqrMag;

    return out;
}

/**
 * `Vector3.ClampMagnitude`（静态）的纯函数形式：模长超过 `maxLength` 时缩到该长度，否则原样拷贝。
 *
 * ★ **行为变更（方案 §5.3 的同型定案）**：原实现在「未超长」分支**返回入参 `vector` 本身**，
 * 纯函数层改为**拷贝进 `out` 并返回 `out`**（与 `vec2ClampMagnitude` 的既有约定一致）。
 */
export function vec3ClampMagnitude(vector: Vector3Like, maxLength: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const sqrmag = vec3LengthSquared(vector);

    if (sqrmag > maxLength * maxLength)
    {
        const mag = Math.sqrt(sqrmag);

        // 这三个中间变量强制中间结果为 float 精度（照抄原实现的说明）
        const normalizedX = vector.x / mag;
        const normalizedY = vector.y / mag;
        const normalizedZ = vector.z / mag;

        out.x = normalizedX * maxLength;
        out.y = normalizedY * maxLength;
        out.z = normalizedZ * maxLength;

        return out;
    }

    return vec3Copy(vector, out);
}

/**
 * `Vector3.Min`（**静态**）的纯函数形式：逐分量取较小值（`mathfMin`，即 `a < b ? a : b`）。
 *
 * **与 `vec3Min` 不是同一个函数**（`Vector3` 里就是这么分的）：`vec3Min` 对应实例方法
 * `min()`，用的是 `Math.min`。两者的 `NaN` 语义不同——`mathfMin(NaN, 5) === 5`，
 * 而 `Math.min(NaN, 5) === NaN`。既有不一致，逐字保留（方案 §10.1 的 P8e）。
 */
export function vec3MinMathf(lhs: Vector3Like, rhs: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = mathfMin(lhs.x, rhs.x);
    out.y = mathfMin(lhs.y, rhs.y);
    out.z = mathfMin(lhs.z, rhs.z);

    return out;
}

/**
 * `Vector3.Max`（**静态**）的纯函数形式：逐分量取较大值（`mathfMax`，理由见 `vec3MinMathf`）。
 */
export function vec3MaxMathf(lhs: Vector3Like, rhs: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = mathfMax(lhs.x, rhs.x);
    out.y = mathfMax(lhs.y, rhs.y);
    out.z = mathfMax(lhs.z, rhs.z);

    return out;
}
