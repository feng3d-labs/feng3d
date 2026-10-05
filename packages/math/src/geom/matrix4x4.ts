import { MATHUTIL_PRECISION, mathUtilClamp, mathUtilEquals } from '../mathutil';
import { DEFAULT_ROTATION_ORDER } from '../enums/RotationOrder';
import { RotationOrder } from '../enums/RotationOrder';
import type { Line3Like, WritableLine3Like } from './line3';
import type { WritableMatrix3x3Like } from './matrix3x3';
import type { PlaneLike, WritablePlaneLike } from './plane';
import type { QuaternionLike } from './quaternion';
import type { Vector3Like, WritableVector3Like } from './vector3';
import type { Vector4Like, WritableVector4Like } from './vector4';
import {
    VEC3_Y_AXIS,
    vec3Add,
    vec3LengthSquared,
    vec3Normalized,
    vec3Random,
    vec3ScaleNumber,
} from './vector3';

/**
 * `Matrix4x4` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` 阶段 A2d）。
 *
 * 与 `vector3.ts` / `quaternion.ts` / `color4.ts` 同构：数据形状 + 纯函数同文件，
 * 入参只读、结果写 `out`（`out` 传自己即就地运算），class 的同名方法转发到这里。
 *
 * ## 本批（A2d）一并覆盖的跨类型函数
 *
 * 方案原定跨类型函数留到 A3，但 `Vector3` / `Quaternion` 的纯函数层已就绪，所以本批直接做掉：
 * `mat4TransformPoint3` / `mat4TransformVector3` / `mat4TransformVector4` /
 * `mat4GetRotation` / `mat4SetRotation` / `mat4GetScale` / `mat4SetScale` /
 * `mat4GetAxisX|Y|Z` / `mat4FromTRS` / `mat4ToTRS` / `mat4FromQuaternion` /
 * `mat4FromAxisRotate` / `mat4FromRotation` / `mat4AppendRotation` / `mat4MoveRight|Up|Forward` …
 * 跨类型参数一律用**结构类型**（`Vector3Like` / `WritableVector3Like` / `QuaternionLike` 等），
 * 运行时只 import `./vector3` 里的值函数；对方类型全部 **type-only import**（编译后擦除），
 * 所以运行时依赖方向是 `Matrix4x4.ts → matrix4x4.ts → vector3.ts`，不成环。
 *
 * ## 四个必须留意的点
 *
 * 1. **缺省 `out` 的初值是 `new Matrix4x4()` 的默认值**，即**单位矩阵**
 *    （`[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]`），不是全零。
 *    `mat4FromRotation`（旋转序非法时不写任何旋转分量）这类**可能不写满 16 个元素**的函数
 *    若用全零初值就会与 class 行为不一致（方案 §10.1 P6）。
 * 2. **跨分量依赖的运算先算局部变量再写 `out`**：矩阵乘 / `invert` / `prepend` / `toTRS` / `lookAt`
 *    等，`out === 入参` 时边算边写会自污染（方案 §10.1 P2）。
 * 3. **`mat4ToArray` 不改入参**：原 `toArray(transpose=true)` 是「就地转置 → 拷贝 → 再转置回来」
 *    （对 `Float32Array` 有损），纯函数层改为**按转置后的下标读取**，结果数组逐位相同、且原矩阵无损。
 * 4. **`out` 是 `{ elements: number[] }`，不是 `Float32Array`**：`WritableMatrix4x4Like` 的
 *    `elements` 声明为 `number[]`，所以 `Matrix4x4` 实例可用、`{ elements: new Float32Array(16) }` 不行。
 *    这与 `Matrix4x4.elements` 的声明类型 `NmberArray16`（`number` 元组）一致。
 */

/**
 * 16 个元素的一列主序矩阵数据（与 `Matrix4x4.elements` 同形）。
 *
 * 只读时用 `ArrayLike<number>`，因此 `number[]` 与 `Float32Array` 都能作为入参。
 */
export interface Matrix4x4Like
{
    readonly elements: ArrayLike<number>;
}

/** 可写出的矩阵目标：`Matrix4x4` 实例与 `{ elements: number[] }` 字面量都满足。 */
export interface WritableMatrix4x4Like
{
    elements: number[];
}

/**
 * `Matrix4x4` 纯数据接口（**带判别字段**，方案 §5.9 的 D1 决策）。
 *
 * `Matrix4x4Like` / `WritableMatrix4x4Like` **刻意不带** `__type__`：它们是 A / B 阶段用来放宽
 * feng3d 签名的「最小形状」，带上判别字段会成片传导给普通字面量消费方。
 *
 * ⚠️ `elements` 在这里**收窄为 `number[]`**（`Matrix4x4Like` 是更宽的 `ArrayLike<number>`）：
 * 纯数据形态的矩阵值常常要直接当 `out` 用（`mat4Invert(m, m)` / `mat4Append(m, x, m)`），
 * 而 `ArrayLike<number>` 不满足 `WritableMatrix4x4Like` 的 `number[]`（缺数组方法）。
 *
 * 阶段 C-e 起 class 已删除，本接口与 `*Like` 同址（方案 §3.1）：
 * `import { Matrix4x4 } from '@feng3d/math'` 一字不改。
 */
export interface Matrix4x4 extends Matrix4x4Like
{
    readonly __type__: 'Matrix4x4';
    readonly elements: number[];
}

/**
 * 可读出的四维向量形状（`Vector4` 实例与纯数据字面量都满足）。
 *
 * 归属是 `vector4.ts`（issue #134 B1 收口）：与 `PlaneLike` / `Matrix3x3Like` 同构处理——
 * 这里只保留 **type-only 重导出**，既有 `import { Vector4Like } from './matrix4x4'`
 * 的调用方不受影响。B1 之前本文件另有一份**同形但不同符号**的本地定义，导致
 * `index.ts` 同时 `export *` 两个纯函数模块时报 TS2308（同名导出歧义）。
 */
export type { Vector4Like, WritableVector4Like } from './vector4';

/**
 * 可读出的平面形状（`ax+by+cz+d=0`）。
 *
 * 归属是 `plane.ts`（issue #134 A2j）：`mat4TransformPlane` 只是读它的字段，
 * 这里保留 type-only 重导出，既有 `import { PlaneLike } from './matrix4x4'` 不受影响。
 */
export type { PlaneLike, WritablePlaneLike } from './plane';

/**
 * 可读出的 3x3 矩阵形状。
 *
 * 归属是 `matrix3x3.ts`（issue #134 A2c 定义、A3 收回）：`mat4ToMatrix3x3` 只是写它的 `elements`，
 * 与 `PlaneLike` 同构处理——这里保留 **type-only 重导出**，既有
 * `import { Matrix3x3Like } from './matrix4x4'` 的调用方不受影响。
 */
export type { Matrix3x3Like, WritableMatrix3x3Like } from './matrix3x3';

/**
 * 可读出的射线形状（`Ray3` 是 `Line3` 的**类型别名**，含原点与方向）。
 *
 * 阶段 C-d 起不再重复定义：本文件原先自己声明了一份与 `Line3Like` **逐字段同形**的
 * `Ray3Like` / `WritableRay3Like`（都是 `{ origin, direction }`）。现在保留名字、
 * 改为 `line3` 对应形状的**类型别名**，既有
 * `import { Ray3Like } from './matrix4x4'` 的调用方不受影响（方案 §11.7.7 的 `Ray3` 行）。
 */
export type Ray3Like = Line3Like;

/** 可写出的射线目标（`line3.WritableLine3Like` 的别名）。 */
export type WritableRay3Like = WritableLine3Like;

/** 单位矩阵的 16 个元素：与 `new Matrix4x4()` 的默认值一致（见文件头第 1 条）。 */
const IDENTITY_ELEMENTS: readonly number[] = Object.freeze([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
]);

/** 新建一个与 `new Matrix4x4()` 等值的输出目标。 */
function newOut(): WritableMatrix4x4Like
{
    return { elements: IDENTITY_ELEMENTS.slice() };
}

/**
 * `Matrix4x4.prototype.identity` 的纯函数形式：把 `out` 置为单位矩阵。
 */
export function mat4Identity(out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const e = out.elements;

    e[0] = 1; e[1] = 0; e[2] = 0; e[3] = 0;
    e[4] = 0; e[5] = 1; e[6] = 0; e[7] = 0;
    e[8] = 0; e[9] = 0; e[10] = 1; e[11] = 0;
    e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;

    return out;
}

/**
 * `Matrix4x4.prototype.copy` 与 `Matrix4x4.prototype.clone` 的纯函数形式：把 `a` 的 16 个元素复制进 `out`。
 */
export function mat4Copy(a: Matrix4x4Like, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const e = out.elements;
    const m = a.elements;

    for (let i = 0; i < 16; i++)
    {
        e[i] = m[i];
    }

    return out;
}

/**
 * `Matrix4x4.prototype.fromArray` 的纯函数形式：从数组 `index` 起读 16 位写进 `out`；
 * `transpose` 为真时写入转置后的矩阵。
 *
 * 数组长度不足 16 时抛错（错误文本与 class 逐字一致）。
 */
export function mat4FromArray(array: number[], index = 0, transpose = false, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    if (array.length - index < 16)
    {
        throw new Error('vector参数数据长度不够！');
    }

    const e = out.elements;

    for (let i = 0; i < 16; i++)
    {
        e[i] = array[index + i];
    }

    if (transpose)
    {
        // 配对交换，所以 out === a 也安全
        mat4Transpose(out, out);
    }

    return out;
}

/**
 * `Matrix4x4.prototype.toArray` 的纯函数形式：把 16 个元素写进 `array` 的 `index` 起并返回该数组。
 *
 * `transpose` 为真时写出**转置后**的元素——与本函数不同，原方法会先就地转置、写完再转置回来
 * （对 `Float32Array` 有损）；这里按转置后的下标读取，结果逐位相同且不改入参（见文件头第 3 条）。
 */
export function mat4ToArray(a: Matrix4x4Like, array: number[] | Float32Array = [], index = 0, transpose = false): number[] | Float32Array
{
    const m = a.elements;

    if (transpose)
    {
        for (let row = 0; row < 4; row++)
        {
            for (let col = 0; col < 4; col++)
            {
                array[(row * 4) + col + index] = m[(col * 4) + row];
            }
        }
    }
    else
    {
        for (let i = 0; i < 16; i++)
        {
            array[i + index] = m[i];
        }
    }

    return array;
}

/**
 * `Matrix4x4.prototype.equals` 的纯函数形式：16 个元素都按 `precision` 判等。
 */
export function mat4Equals(a: Matrix4x4Like, b: Matrix4x4Like, precision = MATHUTIL_PRECISION): boolean
{
    const e0 = a.elements;
    const e1 = b.elements;

    for (let i = 0; i < 16; ++i)
    {
        if (!mathUtilEquals(e0[i] - e1[i], 0, precision))
        {
            return false;
        }
    }

    return true;
}

/**
 * `Matrix4x4.prototype.isIdentity` 的纯函数形式：16 个元素都按 `precision` 与单位矩阵判等。
 */
export function mat4IsIdentity(a: Matrix4x4Like, precision = MATHUTIL_PRECISION): boolean
{
    const e = a.elements;

    for (let i = 0; i < 16; i++)
    {
        if (!mathUtilEquals(e[i], IDENTITY_ELEMENTS[i], precision))
        {
            return false;
        }
    }

    return true;
}

/**
 * `Matrix4x4.prototype.transpose` 的纯函数形式：行与列互换，结果写进 `out`。
 *
 * 先把入参 16 个元素取到局部变量，所以 `out === a` 安全。
 */
export function mat4Transpose(a: Matrix4x4Like, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const m = a.elements;

    const v0 = m[0]; const v1 = m[1]; const v2 = m[2]; const v3 = m[3];
    const v4 = m[4]; const v5 = m[5]; const v6 = m[6]; const v7 = m[7];
    const v8 = m[8]; const v9 = m[9]; const v10 = m[10]; const v11 = m[11];
    const v12 = m[12]; const v13 = m[13]; const v14 = m[14]; const v15 = m[15];

    const e = out.elements;

    e[0] = v0; e[1] = v4; e[2] = v8; e[3] = v12;
    e[4] = v1; e[5] = v5; e[6] = v9; e[7] = v13;
    e[8] = v2; e[9] = v6; e[10] = v10; e[11] = v14;
    e[12] = v3; e[13] = v7; e[14] = v11; e[15] = v15;

    return out;
}

/**
 * `Matrix4x4.prototype.determinant`（getter）的纯函数形式：行列式。
 */
export function mat4Determinant(a: Matrix4x4Like): number
{
    const m = a.elements;

    return (//
        (((m[0] * m[5]) - (m[4] * m[1])) * ((m[10] * m[15]) - (m[14] * m[11]))) //
        - (((m[0] * m[9]) - (m[8] * m[1])) * ((m[6] * m[15]) - (m[14] * m[7]))) //
        + (((m[0] * m[13]) - (m[12] * m[1])) * ((m[6] * m[11]) - (m[10] * m[7]))) //
        + (((m[4] * m[9]) - (m[8] * m[5])) * ((m[2] * m[15]) - (m[14] * m[3]))) //
        - (((m[4] * m[13]) - (m[12] * m[5])) * ((m[2] * m[11]) - (m[10] * m[3]))) //
        + (((m[8] * m[13]) - (m[12] * m[9])) * ((m[2] * m[7]) - (m[6] * m[3])))//
    );
}

/**
 * `Matrix4x4.prototype.invert` 的纯函数形式：求逆矩阵，结果写进 `out`。
 *
 * 行列式为 0 时**不修改 `out`** 并返回（与 class 的「无法获取逆矩阵」分支一致）。
 * 入参 16 个元素先取到局部变量，所以 `out === a`（就地求逆）安全。
 */
export function mat4Invert(a: Matrix4x4Like, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    let d = mat4Determinant(a);

    if (d === 0)
    {
        console.error('无法获取逆矩阵');

        return out;
    }
    d = 1 / d;

    const m = a.elements;

    const m11 = m[0]; const m21 = m[4];
    const m31 = m[8]; const m41 = m[12];
    const m12 = m[1]; const m22 = m[5];
    const m32 = m[9]; const m42 = m[13];
    const m13 = m[2]; const m23 = m[6];
    const m33 = m[10]; const m43 = m[14];
    const m14 = m[3]; const m24 = m[7]; const m34 = m[11]; const m44 = m[15];

    const e = out.elements;

    e[0] = d * (m22 * (m33 * m44 - m43 * m34) - m32 * (m23 * m44 - m43 * m24) + m42 * (m23 * m34 - m33 * m24));
    e[1] = -d * (m12 * (m33 * m44 - m43 * m34) - m32 * (m13 * m44 - m43 * m14) + m42 * (m13 * m34 - m33 * m14));
    e[2] = d * (m12 * (m23 * m44 - m43 * m24) - m22 * (m13 * m44 - m43 * m14) + m42 * (m13 * m24 - m23 * m14));
    e[3] = -d * (m12 * (m23 * m34 - m33 * m24) - m22 * (m13 * m34 - m33 * m14) + m32 * (m13 * m24 - m23 * m14));
    e[4] = -d * (m21 * (m33 * m44 - m43 * m34) - m31 * (m23 * m44 - m43 * m24) + m41 * (m23 * m34 - m33 * m24));
    e[5] = d * (m11 * (m33 * m44 - m43 * m34) - m31 * (m13 * m44 - m43 * m14) + m41 * (m13 * m34 - m33 * m14));
    e[6] = -d * (m11 * (m23 * m44 - m43 * m24) - m21 * (m13 * m44 - m43 * m14) + m41 * (m13 * m24 - m23 * m14));
    e[7] = d * (m11 * (m23 * m34 - m33 * m24) - m21 * (m13 * m34 - m33 * m14) + m31 * (m13 * m24 - m23 * m14));
    e[8] = d * (m21 * (m32 * m44 - m42 * m34) - m31 * (m22 * m44 - m42 * m24) + m41 * (m22 * m34 - m32 * m24));
    e[9] = -d * (m11 * (m32 * m44 - m42 * m34) - m31 * (m12 * m44 - m42 * m14) + m41 * (m12 * m34 - m32 * m14));
    e[10] = d * (m11 * (m22 * m44 - m42 * m24) - m21 * (m12 * m44 - m42 * m14) + m41 * (m12 * m24 - m22 * m14));
    e[11] = -d * (m11 * (m22 * m34 - m32 * m24) - m21 * (m12 * m34 - m32 * m14) + m31 * (m12 * m24 - m22 * m14));
    e[12] = -d * (m21 * (m32 * m43 - m42 * m33) - m31 * (m22 * m43 - m42 * m23) + m41 * (m22 * m33 - m32 * m23));
    e[13] = d * (m11 * (m32 * m43 - m42 * m33) - m31 * (m12 * m43 - m42 * m13) + m41 * (m12 * m33 - m32 * m13));
    e[14] = -d * (m11 * (m22 * m43 - m42 * m23) - m21 * (m12 * m43 - m42 * m13) + m41 * (m12 * m23 - m22 * m13));
    e[15] = d * (m11 * (m22 * m33 - m32 * m23) - m21 * (m12 * m33 - m32 * m13) + m31 * (m12 * m23 - m22 * m13));

    return out;
}

/**
 * `Matrix4x4.prototype.append` 的纯函数形式：`out = a × lhs`（左乘 `lhs`，即 class 所说的「后置」）。
 *
 * 32 个入参元素与结果 16 个分量都先进局部变量再写 `out`，
 * 因此 `out === a` 或 `out === lhs` 都安全（方案 §10.1 P2）。
 */
export function mat4Append(a: Matrix4x4Like, lhs: Matrix4x4Like, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const m1 = a.elements;
    const m2 = lhs.elements;

    const m111 = m1[0];
    const m121 = m1[4];
    const m131 = m1[8];
    const m141 = m1[12];
    const m112 = m1[1];
    const m122 = m1[5];
    const m132 = m1[9];
    const m142 = m1[13];
    const m113 = m1[2];
    const m123 = m1[6];
    const m133 = m1[10];
    const m143 = m1[14];
    const m114 = m1[3];
    const m124 = m1[7];
    const m134 = m1[11];
    const m144 = m1[15];

    const m211 = m2[0];
    const m221 = m2[4];
    const m231 = m2[8];
    const m241 = m2[12];
    const m212 = m2[1];
    const m222 = m2[5];
    const m232 = m2[9];
    const m242 = m2[13];
    const m213 = m2[2];
    const m223 = m2[6];
    const m233 = m2[10];
    const m243 = m2[14];
    const m214 = m2[3];
    const m224 = m2[7];
    const m234 = m2[11];
    const m244 = m2[15];

    const r0 = (m111 * m211) + (m112 * m221) + (m113 * m231) + (m114 * m241);
    const r1 = (m111 * m212) + (m112 * m222) + (m113 * m232) + (m114 * m242);
    const r2 = (m111 * m213) + (m112 * m223) + (m113 * m233) + (m114 * m243);
    const r3 = (m111 * m214) + (m112 * m224) + (m113 * m234) + (m114 * m244);

    const r4 = (m121 * m211) + (m122 * m221) + (m123 * m231) + (m124 * m241);
    const r5 = (m121 * m212) + (m122 * m222) + (m123 * m232) + (m124 * m242);
    const r6 = (m121 * m213) + (m122 * m223) + (m123 * m233) + (m124 * m243);
    const r7 = (m121 * m214) + (m122 * m224) + (m123 * m234) + (m124 * m244);

    const r8 = (m131 * m211) + (m132 * m221) + (m133 * m231) + (m134 * m241);
    const r9 = (m131 * m212) + (m132 * m222) + (m133 * m232) + (m134 * m242);
    const r10 = (m131 * m213) + (m132 * m223) + (m133 * m233) + (m134 * m243);
    const r11 = (m131 * m214) + (m132 * m224) + (m133 * m234) + (m134 * m244);

    const r12 = (m141 * m211) + (m142 * m221) + (m143 * m231) + (m144 * m241);
    const r13 = (m141 * m212) + (m142 * m222) + (m143 * m232) + (m144 * m242);
    const r14 = (m141 * m213) + (m142 * m223) + (m143 * m233) + (m144 * m243);
    const r15 = (m141 * m214) + (m142 * m224) + (m143 * m234) + (m144 * m244);

    const e = out.elements;

    // 32 个入参元素与 16 个结果都先进局部变量（上面 r0..r15），最后才写 `out`：
    // 这样 `out === a` 与 `out === lhs` 两种就地别名都不会出现「读到已改写值」的自污染
    e[0] = r0; e[1] = r1; e[2] = r2; e[3] = r3;
    e[4] = r4; e[5] = r5; e[6] = r6; e[7] = r7;
    e[8] = r8; e[9] = r9; e[10] = r10; e[11] = r11;
    e[12] = r12; e[13] = r13; e[14] = r14; e[15] = r15;

    console.assert((!isNaN(e[0])) && (!isNaN(e[4])) && (!isNaN(e[8])) && (!isNaN(e[12])));

    return out;
}

/**
 * `Matrix4x4.prototype.prepend` 的纯函数形式：`out = rhs × a`。
 *
 * 原实现是 `clone(a)` → `copy(rhs)` → `append(cloneA)`，即「先用 rhs 替换、再左乘 a」；
 * 由此得 `rhs × a`（已由 `Matrix4x4.spec.ts` 的 `prependScale` 用例交叉验证）。
 * 全部先算局部变量，`out === a` 或 `out === rhs` 都安全。
 */
export function mat4Prepend(a: Matrix4x4Like, rhs: Matrix4x4Like, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    return mat4Append(rhs, a, out);
}

/**
 * `Matrix4x4.prototype.fromPosition`（实例）与 `Matrix4x4.fromPosition`（静态）的纯函数形式：平移矩阵。
 */
export function mat4FromPosition(x: number, y: number, z: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const e = out.elements;

    e[0] = 1; e[1] = 0; e[2] = 0; e[3] = 0;
    e[4] = 0; e[5] = 1; e[6] = 0; e[7] = 0;
    e[8] = 0; e[9] = 0; e[10] = 1; e[11] = 0;
    e[12] = x; e[13] = y; e[14] = z; e[15] = 1;

    return out;
}

/**
 * `Matrix4x4.prototype.fromScale`（实例）与 `Matrix4x4.fromScale`（静态）的纯函数形式：缩放矩阵。
 */
export function mat4FromScale(sx: number, sy: number, sz: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const e = out.elements;

    e[0] = sx; e[1] = 0; e[2] = 0; e[3] = 0;
    e[4] = 0; e[5] = sy; e[6] = 0; e[7] = 0;
    e[8] = 0; e[9] = 0; e[10] = sz; e[11] = 0;
    e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;

    return out;
}

/**
 * `Matrix4x4.prototype.getPosition` 的纯函数形式：取出第 13/14/15 个元素当位移（缺省新建零向量）。
 */
export function mat4GetPosition(a: Matrix4x4Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const m = a.elements;

    out.x = m[12];
    out.y = m[13];
    out.z = m[14];

    return out;
}

/**
 * `Matrix4x4.prototype.setPosition` 的纯函数形式：把位移写进第 13/14/15 个元素，结果写进 `out`。
 *
 * `out` 缺省时是单位矩阵，写完后与 `new Matrix4x4().setPosition(v)` 等值。
 */
export function mat4SetPosition(a: Matrix4x4Like, value: Vector3Like, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    mat4Copy(a, out);

    const e = out.elements;

    e[12] = value.x;
    e[13] = value.y;
    e[14] = value.z;

    return out;
}

/**
 * `Matrix4x4.prototype.getAxisX` 的纯函数形式：取元素 0/1/2 作为 X 轴（缺省新建零向量）。
 */
export function mat4GetAxisX(a: Matrix4x4Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const m = a.elements;

    out.x = m[0];
    out.y = m[1];
    out.z = m[2];

    return out;
}

/**
 * `Matrix4x4.prototype.setAxisX` 的纯函数形式：把 X 轴写进元素 0/1/2，结果写进 `out`。
 *
 * `vector` 缺省为零向量（与 class 的 `vector = new Vector3()` 一致，
 * 源码注释写的是「X轴向量」但签名给了默认值）。
 */
export function mat4SetAxisX(a: Matrix4x4Like, vector: Vector3Like = { x: 0, y: 0, z: 0 }, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    mat4Copy(a, out);

    const e = out.elements;

    e[0] = vector.x;
    e[1] = vector.y;
    e[2] = vector.z;

    return out;
}

/**
 * `Matrix4x4.prototype.getAxisY` 的纯函数形式：取元素 4/5/6 作为 Y 轴（缺省新建零向量）。
 */
export function mat4GetAxisY(a: Matrix4x4Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const m = a.elements;

    out.x = m[4];
    out.y = m[5];
    out.z = m[6];

    return out;
}

/**
 * `Matrix4x4.prototype.setAxisY` 的纯函数形式：把 Y 轴写进元素 4/5/6，结果写进 `out`。
 */
export function mat4SetAxisY(a: Matrix4x4Like, vector: Vector3Like = { x: 0, y: 0, z: 0 }, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    mat4Copy(a, out);

    const e = out.elements;

    e[4] = vector.x;
    e[5] = vector.y;
    e[6] = vector.z;

    return out;
}

/**
 * `Matrix4x4.prototype.getAxisZ` 的纯函数形式：取元素 8/9/10 作为 Z 轴（缺省新建零向量）。
 */
export function mat4GetAxisZ(a: Matrix4x4Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const m = a.elements;

    out.x = m[8];
    out.y = m[9];
    out.z = m[10];

    return out;
}

/**
 * `Matrix4x4.prototype.getScale` 与 `Matrix4x4.prototype.lossyScale` 的纯函数形式：
 * 三个基向量的长度（缺省新建零向量）。
 */
export function mat4GetScale(a: Matrix4x4Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const m = a.elements;

    out.x = Math.sqrt(vec3LengthSquared({ x: m[0], y: m[1], z: m[2] }));
    out.y = Math.sqrt(vec3LengthSquared({ x: m[4], y: m[5], z: m[6] }));
    out.z = Math.sqrt(vec3LengthSquared({ x: m[8], y: m[9], z: m[10] }));

    return out;
}

/**
 * `Matrix4x4.prototype.setScale` 的纯函数形式：按「新缩放 / 旧缩放」的比例缩放三个基向量，结果写进 `out`。
 *
 * ⚠️ 与 class 一致，旧缩放有分量为 0 时会写出 `NaN` / `Infinity`，不做保护。
 */
export function mat4SetScale(a: Matrix4x4Like, scale: Vector3Like, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    mat4Copy(a, out);

    const oldS = mat4GetScale(out);
    const e = out.elements;

    const sx = scale.x / oldS.x;
    const sy = scale.y / oldS.y;
    const sz = scale.z / oldS.z;

    e[0] *= sx;
    e[1] *= sx;
    e[2] *= sx;
    e[4] *= sy;
    e[5] *= sy;
    e[6] *= sy;
    e[8] *= sz;
    e[9] *= sz;
    e[10] *= sz;

    return out;
}

/**
 * `Matrix4x4.prototype.fromTRS` 与 `Matrix4x4.fromTRS` 的纯函数形式：
 * 由位移 / 欧拉角（弧度）/ 缩放重组矩阵，结果写进 `out`。
 *
 * 逐字保留六种旋转序的分支，以及「未知序只 `console.error`、不写旋转分量」的行为。
 * 旋转部分先算出局部变量、乘完缩放再写 `out`，所以 `out === position`（别名）也安全。
 */
export function mat4FromTRS(
    position: Vector3Like,
    rotation: Vector3Like,
    scale: Vector3Like,
    order: RotationOrder = DEFAULT_ROTATION_ORDER,
    out: WritableMatrix4x4Like = newOut(),
): WritableMatrix4x4Like
{
    const px = position.x;
    const py = position.y;
    const pz = position.z;
    const rx = rotation.x;
    const ry = rotation.y;
    const rz = rotation.z;
    const sx = scale.x;
    const sy = scale.y;
    const sz = scale.z;

    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const cosZ = Math.cos(rz);
    const sinZ = Math.sin(rz);

    // 旋转部分的 3x3（列主序下标 0/1/2、4/5/6、8/9/10）
    let r00 = 1; let r10 = 0; let r20 = 0;
    let r01 = 0; let r11 = 1; let r21 = 0;
    let r02 = 0; let r12 = 0; let r22 = 1;

    if (order === RotationOrder.XYZ)
    {
        const ae = cosX * cosZ;
        const af = cosX * sinZ;
        const be = sinX * cosZ;
        const bf = sinX * sinZ;

        r00 = cosY * cosZ;
        r01 = -cosY * sinZ;
        r02 = sinY;

        r10 = af + (be * sinY);
        r11 = ae - (bf * sinY);
        r12 = -sinX * cosY;

        r20 = bf - (ae * sinY);
        r21 = be + (af * sinY);
        r22 = cosX * cosY;
    }
    else if (order === RotationOrder.YXZ)
    {
        const ce = cosY * cosZ;
        const cf = cosY * sinZ;
        const de = sinY * cosZ;
        const df = sinY * sinZ;

        r00 = ce + (df * sinX);
        r01 = (de * sinX) - cf;
        r02 = cosX * sinY;

        r10 = cosX * sinZ;
        r11 = cosX * cosZ;
        r12 = -sinX;

        r20 = (cf * sinX) - de;
        r21 = df + (ce * sinX);
        r22 = cosX * cosY;
    }
    else if (order === RotationOrder.ZXY)
    {
        const ce = cosY * cosZ;
        const cf = cosY * sinZ;
        const de = sinY * cosZ;
        const df = sinY * sinZ;

        r00 = ce - (df * sinX);
        r01 = -cosX * sinZ;
        r02 = de + (cf * sinX);

        r10 = cf + (de * sinX);
        r11 = cosX * cosZ;
        r12 = df - (ce * sinX);

        r20 = -cosX * sinY;
        r21 = sinX;
        r22 = cosX * cosY;
    }
    else if (order === RotationOrder.ZYX)
    {
        const ae = cosX * cosZ;
        const af = cosX * sinZ;
        const be = sinX * cosZ;
        const bf = sinX * sinZ;

        r00 = cosY * cosZ;
        r01 = (be * sinY) - af;
        r02 = (ae * sinY) + bf;

        r10 = cosY * sinZ;
        r11 = (bf * sinY) + ae;
        r12 = (af * sinY) - be;

        r20 = -sinY;
        r21 = sinX * cosY;
        r22 = cosX * cosY;
    }
    else if (order === RotationOrder.YZX)
    {
        const ac = cosX * cosY;
        const ad = cosX * sinY;
        const bc = sinX * cosY;
        const bd = sinX * sinY;

        r00 = cosY * cosZ;
        r01 = bd - (ac * sinZ);
        r02 = (bc * sinZ) + ad;

        r10 = sinZ;
        r11 = cosX * cosZ;
        r12 = -sinX * cosZ;

        r20 = -sinY * cosZ;
        r21 = (ad * sinZ) + bc;
        r22 = ac - (bd * sinZ);
    }
    else if (order === RotationOrder.XZY)
    {
        const ac = cosX * cosY;
        const ad = cosX * sinY;
        const bc = sinX * cosY;
        const bd = sinX * sinY;

        r00 = cosY * cosZ;
        r01 = -sinZ;
        r02 = sinY * cosZ;

        r10 = (ac * sinZ) + bd;
        r11 = cosX * cosZ;
        r12 = (ad * sinZ) - bc;

        r20 = (bc * sinZ) - ad;
        r21 = sinX * cosZ;
        r22 = (bd * sinZ) + ac;
    }
    else
    {
        console.error(`初始化矩阵时错误旋转顺序 ${order}`);
    }

    // 按缩放缩放前三列（对应原实现最后的 10 次乘法）
    r00 *= sx; r10 *= sx; r20 *= sx;
    r01 *= sy; r11 *= sy; r21 *= sy;
    r02 *= sz; r12 *= sz; r22 *= sz;

    const e = out.elements;

    e[0] = r00; e[1] = r10; e[2] = r20; e[3] = 0;
    e[4] = r01; e[5] = r11; e[6] = r21; e[7] = 0;
    e[8] = r02; e[9] = r12; e[10] = r22; e[11] = 0;
    e[12] = px; e[13] = py; e[14] = pz; e[15] = 1;

    return out;
}

/**
 * `Matrix4x4.prototype.fromRotation` 与 `Matrix4x4.fromRotation` 的纯函数形式：
 * 由欧拉角（弧度）构造旋转矩阵（位移为零、缩放为 1）。
 */
export function mat4FromRotation(rx: number, ry: number, rz: number, order: RotationOrder = DEFAULT_ROTATION_ORDER, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    return mat4FromTRS({ x: 0, y: 0, z: 0 }, { x: rx, y: ry, z: rz }, { x: 1, y: 1, z: 1 }, order, out);
}

/**
 * `Matrix4x4.prototype.fromAxisRotate` 与 `Matrix4x4.fromAxisRotate` 的纯函数形式：
 * 绕 `axis`（内部先归一化）旋转 `angle` 弧度的矩阵。
 *
 * **归一化在局部副本上做**，不修改入参（原 class 方法是 `axis.clone().normalize()`）。
 */
export function mat4FromAxisRotate(axis: Vector3Like, angle: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const n = vec3Normalized(axis);

    const q = angle;

    const sinq = Math.sin(q);
    const cosq = Math.cos(q);
    const lcosq = 1 - cosq;

    const nx = n.x;
    const ny = n.y;
    const nz = n.z;

    const v0 = (nx * nx * lcosq) + cosq;
    const v1 = (nx * ny * lcosq) + (nz * sinq);
    const v2 = (nx * nz * lcosq) - (ny * sinq);
    const v4 = (nx * ny * lcosq) - (nz * sinq);
    const v5 = (ny * ny * lcosq) + cosq;
    const v6 = (ny * nz * lcosq) + (nx * sinq);
    const v8 = (nx * nz * lcosq) + (ny * sinq);
    const v9 = (ny * nz * lcosq) - (nx * sinq);
    const v10 = (nz * nz * lcosq) + cosq;

    const e = out.elements;

    e[0] = v0; e[1] = v1; e[2] = v2; e[3] = 0;
    e[4] = v4; e[5] = v5; e[6] = v6; e[7] = 0;
    e[8] = v8; e[9] = v9; e[10] = v10; e[11] = 0;
    e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;

    return out;
}

/**
 * `Quaternion.prototype.toMatrix`、`Matrix4x4.prototype.fromQuaternion` 与 `Matrix4x4.fromQuaternion`
 * 的纯函数形式：四元数转 4x4 旋转矩阵，结果写进 `target`。
 *
 * 与 `Quaternion.toMatrix` 逐字一致（元素 3/7/11/12/13/14 写 0，元素 15 写 1）。
 * **不默认 `target`**：调用方必须提供目标（class 侧传 `this`，纯函数用法传新建字面量）。
 */
export function quatToMatrix4x4(q: QuaternionLike, target: WritableMatrix4x4Like): WritableMatrix4x4Like
{
    const elements = target.elements;
    const { x, y, z, w } = q;
    //
    const xy2 = 2 * x * y;
    const xz2 = 2 * x * z;
    const xw2 = 2 * x * w;
    const yz2 = 2 * y * z;
    const yw2 = 2 * y * w;
    const zw2 = 2 * z * w;
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const ww = w * w;

    elements[0] = xx - yy - zz + ww;
    elements[4] = xy2 - zw2;
    elements[8] = xz2 + yw2;
    elements[12] = 0;
    elements[1] = xy2 + zw2;
    elements[5] = -xx + yy - zz + ww;
    elements[9] = yz2 - xw2;
    elements[13] = 0;
    elements[2] = xz2 - yw2;
    elements[6] = yz2 + xw2;
    elements[10] = -xx - yy + zz + ww;
    elements[14] = 0;
    elements[3] = 0;
    elements[7] = 0;
    elements[11] = 0;
    elements[15] = 1;

    return target;
}

/**
 * `Matrix4x4.prototype.fromQuaternion` 与 `Matrix4x4.fromQuaternion` 的纯函数形式（缺省新建）。
 */
export function mat4FromQuaternion(q: QuaternionLike, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    return quatToMatrix4x4(q, out);
}

/**
 * `Matrix4x4.prototype.toTRS` 的纯函数形式：把矩阵分解为位移 / 欧拉角（弧度）/ 缩放。
 *
 * 六个旋转序分支逐字保留（含 `Math.abs(...) < 0.9999999` 的退化分支）。
 *
 * @returns `[position, rotation, scale]`——与 class 的返回值一致。
 *
 * ⚠️ 与 class 一致，旋转序非法时 `rotation` **不被写入**（保持调用前的值）。
 * ⚠️ `position` / `rotation` / `scale` 必须是三个**不同**的对象（实现会前写后读，别名会互相污染）。
 */
export function mat4ToTRS(
    a: Matrix4x4Like,
    position: WritableVector3Like = { x: 0, y: 0, z: 0 },
    rotation: WritableVector3Like = { x: 0, y: 0, z: 0 },
    scale: WritableVector3Like = { x: 0, y: 0, z: 0 },
    order: RotationOrder = DEFAULT_ROTATION_ORDER,
): [WritableVector3Like, WritableVector3Like, WritableVector3Like]
{
    const clamp = mathUtilClamp;
    //
    const m = a.elements;
    let m11 = m[0];
    let m12 = m[4];
    let m13 = m[8];
    let m21 = m[1];
    let m22 = m[5];
    let m23 = m[9];
    let m31 = m[2];
    let m32 = m[6];
    let m33 = m[10];
    //

    position.x = m[12];
    position.y = m[13];
    position.z = m[14];
    //
    scale.x = Math.sqrt((m11 * m11) + (m21 * m21) + (m31 * m31));
    m11 /= scale.x;
    m21 /= scale.x;
    m31 /= scale.x;
    scale.y = Math.sqrt((m12 * m12) + (m22 * m22) + (m32 * m32));
    m12 /= scale.y;
    m22 /= scale.y;
    m32 /= scale.y;
    scale.z = Math.sqrt((m13 * m13) + (m23 * m23) + (m33 * m33));
    m13 /= scale.z;
    m23 /= scale.z;
    m33 /= scale.z;
    //
    if (order === RotationOrder.XYZ)
    {
        rotation.y = Math.asin(clamp(m13, -1, 1));
        if (Math.abs(m13) < 0.9999999)
        {
            rotation.x = Math.atan2(-m23, m33);
            rotation.z = Math.atan2(-m12, m11);
        }
        else
        {
            rotation.x = Math.atan2(m32, m22);
            rotation.z = 0;
        }
    }
    else if (order === RotationOrder.YXZ)
    {
        rotation.x = Math.asin(-clamp(m23, -1, 1));
        if (Math.abs(m23) < 0.9999999)
        {
            rotation.y = Math.atan2(m13, m33);
            rotation.z = Math.atan2(m21, m22);
        }
        else
        {
            rotation.y = Math.atan2(-m31, m11);
            rotation.z = 0;
        }
    }
    else if (order === RotationOrder.ZXY)
    {
        rotation.x = Math.asin(clamp(m32, -1, 1));
        if (Math.abs(m32) < 0.9999999)
        {
            rotation.y = Math.atan2(-m31, m33);
            rotation.z = Math.atan2(-m12, m22);
        }
        else
        {
            rotation.y = 0;
            rotation.z = Math.atan2(m21, m11);
        }
    }
    else if (order === RotationOrder.ZYX)
    {
        rotation.y = Math.asin(-clamp(m31, -1, 1));
        if (Math.abs(m31) < 0.9999999)
        {
            rotation.x = Math.atan2(m32, m33);
            rotation.z = Math.atan2(m21, m11);
        }
        else
        {
            rotation.x = 0;
            rotation.z = Math.atan2(-m12, m22);
        }
    }
    else if (order === RotationOrder.YZX)
    {
        rotation.z = Math.asin(clamp(m21, -1, 1));
        if (Math.abs(m21) < 0.9999999)
        {
            rotation.x = Math.atan2(-m23, m22);
            rotation.y = Math.atan2(-m31, m11);
        }
        else
        {
            rotation.x = 0;
            rotation.y = Math.atan2(m13, m33);
        }
    }
    else if (order === RotationOrder.XZY)
    {
        rotation.z = Math.asin(-clamp(m12, -1, 1));
        if (Math.abs(m12) < 0.9999999)
        {
            rotation.x = Math.atan2(m32, m22);
            rotation.y = Math.atan2(m13, m11);
        }
        else
        {
            rotation.x = Math.atan2(-m23, m33);
            rotation.y = 0;
        }
    }
    else
    {
        console.error(`初始化矩阵时错误旋转顺序 ${order}`);
    }

    return [position, rotation, scale];
}

/**
 * `Matrix4x4.prototype.getRotation` 的纯函数形式：只取欧拉角（缺省新建零向量）。
 *
 * 内部用独立临时对象调 `mat4ToTRS`——与 class 一样规避 `position`/`scale` 对 `rotation` 的别名污染。
 */
export function mat4GetRotation(a: Matrix4x4Like, rotation: WritableVector3Like = { x: 0, y: 0, z: 0 }, order: RotationOrder = DEFAULT_ROTATION_ORDER): WritableVector3Like
{
    mat4ToTRS(a, { x: 0, y: 0, z: 0 }, rotation, { x: 0, y: 0, z: 0 }, order);

    return rotation;
}

/**
 * `Matrix4x4.prototype.setRotation` 的纯函数形式：替换欧拉角（位移与缩放保持不变），结果写进 `out`。
 *
 * ★ **行为修复（#134 后续清理批，原为「逐字保留」的既有缺陷）**：原实现（含 class）
 * 用调用方给的 `order` **分解**、却写死 `DEFAULT_ROTATION_ORDER` **重组**——
 * `order` 不是默认序时被静默丢弃：`setRotation(m, r, XZY)` 之后读回的欧拉角与 `r` 不符（有损）。
 * 本批改为把同一个 `order` 传给 `mat4FromTRS`，分解与重组一致。
 *
 * 修复依据：全仓三个调用点（`packages/feng3d/src/core/Object3D.ts`、
 * `packages/editor/src/feng3d/EditorView.ts`、`packages/editor/src/feng3d/Feng3dScreenShotRenderer.ts`）
 * **都不传 `order`**（走默认序），默认序下新旧实现逐位相同，没有调用方依赖旧行为。
 */
export function mat4SetRotation(a: Matrix4x4Like, rotation: Vector3Like, order: RotationOrder = DEFAULT_ROTATION_ORDER, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const p = { x: 0, y: 0, z: 0 };
    const r = { x: 0, y: 0, z: 0 };
    const s = { x: 0, y: 0, z: 0 };

    mat4ToTRS(a, p, r, s, order);
    r.x = rotation.x;
    r.y = rotation.y;
    r.z = rotation.z;

    return mat4FromTRS(p, r, s, order, out);
}

/**
 * `Matrix4x4.prototype.appendRotation` 的纯函数形式：后置一个绕 `axis` 的增量旋转。
 *
 * `pivotPoint` 给出时，先平移 `-pivot`、旋转、再平移回 `pivot`（pivot 为不动点）。
 */
export function mat4AppendRotation(a: Matrix4x4Like, axis: Vector3Like, angle: number, pivotPoint?: Vector3Like, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const rotationMat = mat4FromAxisRotate(axis, angle);

    // 全程在临时矩阵上做多步合成，最后一次性写回 `out`：
    // 这样 `out` 与 `a` 是同一个对象时，中间步骤不会就地改写入参
    const temp = mat4Copy(a);

    if (pivotPoint)
    {
        mat4AppendTranslation(temp, -pivotPoint.x, -pivotPoint.y, -pivotPoint.z, temp);
    }

    mat4Append(temp, rotationMat, temp);

    if (pivotPoint)
    {
        mat4AppendTranslation(temp, pivotPoint.x, pivotPoint.y, pivotPoint.z, temp);
    }

    return mat4Copy(temp, out);
}

/**
 * `Matrix4x4.prototype.appendScale` 的纯函数形式：后置一个增量缩放（沿 x/y/z 轴改变尺寸）。
 *
 * 逐字保留「直接改写 elements」的快速实现（缩放矩阵是对角阵，左乘它等价于按行乘常数，
 * 见源码注释 issue #126）。`pivotPoint` 给出时以该点为中心缩放（pivot 是不动点）。
 */
export function mat4AppendScale(a: Matrix4x4Like, sx: number, sy: number, sz: number, pivotPoint?: Vector3Like, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    // 同 mat4AppendRotation：先在临时矩阵上完成多步合成，最后写回 `out`（`out === a` 安全）
    const temp = mat4Copy(a);

    if (pivotPoint)
    {
        mat4AppendTranslation(temp, -pivotPoint.x, -pivotPoint.y, -pivotPoint.z, temp);
    }

    const m = temp.elements;

    // elements 为列主序；`append` 是左乘（this = lhs × this），左乘 diag(sx,sy,sz,1)
    // 等价于「第 i 行整体乘 s_i」（i = 0,1,2），第 3 行不变
    m[0] *= sx; m[4] *= sx; m[8] *= sx; m[12] *= sx;
    m[1] *= sy; m[5] *= sy; m[9] *= sy; m[13] *= sy;
    m[2] *= sz; m[6] *= sz; m[10] *= sz; m[14] *= sz;

    if (pivotPoint)
    {
        mat4AppendTranslation(temp, pivotPoint.x, pivotPoint.y, pivotPoint.z, temp);
    }

    return mat4Copy(temp, out);
}

/**
 * `Matrix4x4.prototype.appendTranslation` 的纯函数形式：后置一个增量平移。
 *
 * 与 class 逐字一致：`m[i] += t * m[3|7|11|15]`（不是简单地把平移加到 12/13/14）。
 */
export function mat4AppendTranslation(a: Matrix4x4Like, x: number, y: number, z: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    mat4Copy(a, out);

    const m = out.elements;

    m[0] += x * m[3];
    m[4] += x * m[7];
    m[8] += x * m[11];
    m[12] += x * m[15];
    m[1] += y * m[3];
    m[5] += y * m[7];
    m[9] += y * m[11];
    m[13] += y * m[15];
    m[2] += z * m[3];
    m[6] += z * m[7];
    m[10] += z * m[11];
    m[14] += z * m[15];

    return out;
}

/**
 * `Matrix4x4.prototype.prependRotation` 的纯函数形式：前置一个增量旋转（结果的旋转部分在其它变换之前）。
 *
 * ⚠️ 与 class 一致，`pivotPoint` **不参与运算**（原方法签名的 `_pivotPoint` 被忽略，本函数不设该参数）。
 */
export function mat4PrependRotation(a: Matrix4x4Like, axis: Vector3Like, angle: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    return mat4Prepend(a, mat4FromAxisRotate(axis, angle), out);
}

/**
 * `Matrix4x4.prototype.prependScale` 的纯函数形式：前置一个增量缩放（构造缩放矩阵后 `prepend`）。
 */
export function mat4PrependScale(a: Matrix4x4Like, xScale: number, yScale: number, zScale: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    return mat4Prepend(a, mat4FromScale(xScale, yScale, zScale), out);
}

/**
 * `Matrix4x4.prototype.prependScale1` 的纯函数形式：直接改写 elements 的快速前置缩放。
 *
 * 与 `mat4PrependScale` 的差异：这是**就地改写**（按行乘常数），不是左乘缩放矩阵。
 */
export function mat4PrependScale1(a: Matrix4x4Like, xScale: number, yScale: number, zScale: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    mat4Copy(a, out);

    const m = out.elements;

    m[0] *= xScale;
    m[1] *= xScale;
    m[2] *= xScale;
    m[4] *= yScale;
    m[5] *= yScale;
    m[6] *= yScale;
    m[8] *= zScale;
    m[9] *= zScale;
    m[10] *= zScale;

    return out;
}

/**
 * `Matrix4x4.prototype.prependTranslation` 的纯函数形式：前置一个增量平移。
 */
export function mat4PrependTranslation(a: Matrix4x4Like, x: number, y: number, z: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    return mat4Prepend(a, mat4FromPosition(x, y, z), out);
}

/**
 * `Matrix4x4.prototype.moveRight` 的纯函数形式：沿 X 轴方向移动。
 *
 * ⚠️ **与 class 逐字一致，包含其不对称之处**：先 `vec3Normalized`（零长度置零），
 * 再 `× distance`——即位移是 `distance × 单位化后的 X 轴`；
 * 而 `mat4MoveUp` / `mat4MoveForward` **不归一化**（位移会被轴长/缩放放大）。
 */
export function mat4MoveRight(a: Matrix4x4Like, distance: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const direction = mat4GetAxisX(a);

    vec3Normalized(direction, direction);
    vec3ScaleNumber(direction, distance, direction);

    const position = mat4GetPosition(a);

    vec3Add(position, direction, position);

    return mat4SetPosition(a, position, out);
}

/**
 * `Matrix4x4.prototype.moveUp` 的纯函数形式：沿 Y 轴方向移动（`Y 轴向量 × distance`，不归一化）。
 */
export function mat4MoveUp(a: Matrix4x4Like, distance: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const direction = mat4GetAxisY(a);

    vec3ScaleNumber(direction, distance, direction);

    const position = mat4GetPosition(a);

    vec3Add(position, direction, position);

    return mat4SetPosition(a, position, out);
}

/**
 * `Matrix4x4.prototype.moveForward` 的纯函数形式：沿本地 -Z（前方向）移动。
 *
 * ⚠️ 与 `mat4MoveUp` 一样**不归一化**：轴长直接进入位移。
 */
export function mat4MoveForward(a: Matrix4x4Like, distance: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    // 相机/物体 forward 方向为本地 -Z（与 three.js 投影矩阵 m[11]=-1 约定一致）
    const direction = mat4GetAxisZ(a);

    direction.x = -direction.x; direction.y = -direction.y; direction.z = -direction.z;

    vec3ScaleNumber(direction, distance, direction);

    const position = mat4GetPosition(a);

    vec3Add(position, direction, position);

    return mat4SetPosition(a, position, out);
}

/**
 * `Matrix4x4.prototype.transformPoint3` 的纯函数形式：点变换（含平移分量）。
 */
export function mat4TransformPoint3(a: Matrix4x4Like, vin: Vector3Like, vout: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const m = a.elements;
    const m0 = m[0];
    const m1 = m[1];
    const m2 = m[2];
    const m4 = m[4];
    const m5 = m[5];
    const m6 = m[6];
    const m8 = m[8];
    const m9 = m[9];
    const m10 = m[10];
    const m12 = m[12];
    const m13 = m[13];
    const m14 = m[14];

    const x = vin.x;
    const y = vin.y;
    const z = vin.z;

    // 三个分量先算局部变量：`vout === vin` 的就地变换才安全
    const rx = x * m0 + y * m4 + z * m8 + m12;
    const ry = x * m1 + y * m5 + z * m9 + m13;
    const rz = x * m2 + y * m6 + z * m10 + m14;

    vout.x = rx;
    vout.y = ry;
    vout.z = rz;

    return vout;
}

/**
 * `Matrix4x4.prototype.transformVector3` 的纯函数形式：向量变换（忽略平移分量）。
 */
export function mat4TransformVector3(a: Matrix4x4Like, vin: Vector3Like, vout: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const m = a.elements;
    const m0 = m[0];
    const m1 = m[1];
    const m2 = m[2];
    const m4 = m[4];
    const m5 = m[5];
    const m6 = m[6];
    const m8 = m[8];
    const m9 = m[9];
    const m10 = m[10];

    const x = vin.x;
    const y = vin.y;
    const z = vin.z;

    const rx = x * m0 + y * m4 + z * m8;
    const ry = x * m1 + y * m5 + z * m9;
    const rz = x * m2 + y * m6 + z * m10;

    vout.x = rx;
    vout.y = ry;
    vout.z = rz;

    return vout;
}

/**
 * `Matrix4x4.prototype.transformVector4` 的纯函数形式：四维向量变换。
 */
export function mat4TransformVector4(a: Matrix4x4Like, vin: Vector4Like, vout: WritableVector4Like = { x: 0, y: 0, z: 0, w: 0 }): WritableVector4Like
{
    const m = a.elements;
    const m0 = m[0];
    const m1 = m[1];
    const m2 = m[2];
    const m3 = m[3];
    const m4 = m[4];
    const m5 = m[5];
    const m6 = m[6];
    const m7 = m[7];
    const m8 = m[8];
    const m9 = m[9];
    const m10 = m[10];
    const m11 = m[11];
    const m12 = m[12];
    const m13 = m[13];
    const m14 = m[14];
    const m15 = m[15];

    const x = vin.x;
    const y = vin.y;
    const z = vin.z;
    const w = vin.w;

    const rx = x * m0 + y * m4 + z * m8 + w * m12;
    const ry = x * m1 + y * m5 + z * m9 + w * m13;
    const rz = x * m2 + y * m6 + z * m10 + w * m14;
    const rw = x * m3 + y * m7 + z * m11 + w * m15;

    vout.x = rx;
    vout.y = ry;
    vout.z = rz;
    vout.w = rw;

    return vout;
}

/**
 * `Matrix4x4.prototype.transformPoints` 的纯函数形式：批量点变换（每 3 个元素一个点）。
 *
 * `vout === vin`（就地变换）安全：每个点只读自己的三个分量、写回同一下标。
 * ⚠️ 与 class 一致，`vout` 缺省时是空数组，只按 `vin.length` 往后写（不预分配）。
 */
export function mat4TransformPoints(a: Matrix4x4Like, vin: number[], vout: number[] = []): number[]
{
    const m = a.elements;
    const m0 = m[0];
    const m1 = m[1];
    const m2 = m[2];
    const m4 = m[4];
    const m5 = m[5];
    const m6 = m[6];
    const m8 = m[8];
    const m9 = m[9];
    const m10 = m[10];
    const m12 = m[12];
    const m13 = m[13];
    const m14 = m[14];

    for (let i = 0; i < vin.length; i += 3)
    {
        const x = vin[i];
        const y = vin[i + 1];
        const z = vin[i + 2];

        vout[i] = x * m0 + y * m4 + z * m8 + m12;
        vout[i + 1] = x * m1 + y * m5 + z * m9 + m13;
        vout[i + 2] = x * m2 + y * m6 + z * m10 + m14;
    }

    return vout;
}

/**
 * `Matrix4x4.prototype.transformRotation` 的纯函数形式：变换欧拉旋转角（弧度）。
 *
 * 逐字保留原实现的 `Math.round(...)` / `v % 2` 分支与 `toRound` 归位。
 */
export function mat4TransformRotation(a: Matrix4x4Like, vin: Vector3Like, vout: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    // 转换旋转
    const rotationMatrix = mat4FromRotation(vin.x, vin.y, vin.z);

    mat4Append(rotationMatrix, a, rotationMatrix);
    const newrotation = mat4ToTRS(rotationMatrix)[1];
    let rx = newrotation.x; let ry = newrotation.y; let
        rz = newrotation.z;
    const v = Math.round((rx - vin.x) / Math.PI);

    if (v % 2 !== 0)
    {
        rx += Math.PI;
        ry = Math.PI - ry;
        rz += Math.PI;
    }
    //
    const toRound = (from: number, to: number, c = Math.PI * 2) =>
        Math.round((to - from) / c) * c + from;

    rx = toRound(rx, vin.x);
    ry = toRound(ry, vin.y);
    rz = toRound(rz, vin.z);
    //
    vout.x = rx;
    vout.y = ry;
    vout.z = rz;

    return vout;
}

/**
 * `Matrix4x4.prototype.transformRay` 的纯函数形式：变换射线（原点按点变换、方向按向量变换）。
 *
 * 两个 `out` 由调用方提供（与 class 一样，缺省值是新建的 `Ray3`，这里不设缺省，强制显式传）。
 */
export function mat4TransformRay(a: Matrix4x4Like, inRay: Ray3Like, outRay: WritableRay3Like): WritableRay3Like
{
    mat4TransformPoint3(a, inRay.origin, outRay.origin);
    mat4TransformVector3(a, inRay.direction, outRay.direction);

    return outRay;
}

/**
 * `Matrix4x4.prototype.toMatrix3x3` 的纯函数形式：取 4x4 的相关元素填充 3x3。
 *
 * ⚠️ 与 class 逐字一致：写入的是 `[m0, m1, 0, m4, m5, 0, m12, m13, 1]`
 * （即 3x3 的第三行来自 4x4 的**位移**，而不是第三列——这看着像原实现的 bug，但行为不变）。
 */
export function mat4ToMatrix3x3(a: Matrix4x4Like, out: WritableMatrix3x3Like): WritableMatrix3x3Like
{
    const outdata = out.elements;
    const indata = a.elements;

    outdata[0] = indata[0];
    outdata[1] = indata[1];
    outdata[2] = 0;

    outdata[3] = indata[4];
    outdata[4] = indata[5];
    outdata[5] = 0;

    outdata[6] = indata[12];
    outdata[7] = indata[13];
    outdata[8] = 1;

    return out;
}

/**
 * `Matrix4x4.prototype.GetColumn` 的纯函数形式：取第 `index` 列（0–3）。
 *
 * 越界时与 class 一致地 `throw 'Invalid column index!'`（抛字符串，不是 `Error`）。
 */
export function mat4GetColumn(a: Matrix4x4Like, index: number, out: WritableVector4Like = { x: 0, y: 0, z: 0, w: 0 }): WritableVector4Like
{
    const m = a.elements;
    const m00 = m[0]; const m10 = m[1]; const m20 = m[2]; const m30 = m[3];
    const m01 = m[4]; const m11 = m[5]; const m21 = m[6]; const m31 = m[7];
    const m02 = m[8]; const m12 = m[9]; const m22 = m[10]; const m32 = m[11];
    const m03 = m[12]; const m13 = m[13]; const m23 = m[14]; const m33 = m[15];

    switch (index)
    {
        case 0: return setVector4(out, m00, m10, m20, m30);
        case 1: return setVector4(out, m01, m11, m21, m31);
        case 2: return setVector4(out, m02, m12, m22, m32);
        case 3: return setVector4(out, m03, m13, m23, m33);
        default:
            throw 'Invalid column index!';
    }
}

/**
 * `Matrix4x4.prototype.GetRow` 的纯函数形式：取第 `index` 行（0–3）。
 *
 * 越界时与 class 一致地 `` throw `Invalid row index!` ``（抛字符串，不是 `Error`）。
 */
export function mat4GetRow(a: Matrix4x4Like, index: number, out: WritableVector4Like = { x: 0, y: 0, z: 0, w: 0 }): WritableVector4Like
{
    const m = a.elements;
    const m00 = m[0]; const m10 = m[1]; const m20 = m[2]; const m30 = m[3];
    const m01 = m[4]; const m11 = m[5]; const m21 = m[6]; const m31 = m[7];
    const m02 = m[8]; const m12 = m[9]; const m22 = m[10]; const m32 = m[11];
    const m03 = m[12]; const m13 = m[13]; const m23 = m[14]; const m33 = m[15];

    switch (index)
    {
        case 0: return setVector4(out, m00, m01, m02, m03);
        case 1: return setVector4(out, m10, m11, m12, m13);
        case 2: return setVector4(out, m20, m21, m22, m23);
        case 3: return setVector4(out, m30, m31, m32, m33);
        default:
            throw `Invalid row index!`;
    }
}

/** 局部辅助：把四个分量写进 `out` 并返回。 */
function setVector4(out: WritableVector4Like, x: number, y: number, z: number, w: number): WritableVector4Like
{
    out.x = x;
    out.y = y;
    out.z = z;
    out.w = w;

    return out;
}

/**
 * `Matrix4x4.prototype.SetColumn` 的纯函数形式：写第 `index` 列。
 *
 * 与 class 一致**无返回值**（原方法只写不返回）。
 */
export function mat4SetColumn(a: Matrix4x4Like, index: number, column: Vector4Like, out: WritableMatrix4x4Like): void
{
    mat4Copy(a, out);

    const e = out.elements;

    e[0 + index * 4] = column.x;
    e[1 + index * 4] = column.y;
    e[2 + index * 4] = column.z;
    e[3 + index * 4] = column.w;
}

/**
 * `Matrix4x4.prototype.SetRow` 的纯函数形式：写第 `index` 行。
 *
 * 与 class 一致**无返回值**（原方法只写不返回）。
 */
export function mat4SetRow(a: Matrix4x4Like, index: number, row: Vector4Like, out: WritableMatrix4x4Like): void
{
    mat4Copy(a, out);

    const e = out.elements;

    e[index + 0 * 4] = row.x;
    e[index + 1 * 4] = row.y;
    e[index + 2 * 4] = row.z;
    e[index + 3 * 4] = row.w;
}

/**
 * `Matrix4x4.prototype.MultiplyPoint` 的纯函数形式：点变换并做透视除法。
 */
export function mat4MultiplyPoint(a: Matrix4x4Like, point: Vector3Like, res: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const m = a.elements;
    const m00 = m[0]; const m10 = m[1]; const m20 = m[2]; const m30 = m[3];
    const m01 = m[4]; const m11 = m[5]; const m21 = m[6]; const m31 = m[7];
    const m02 = m[8]; const m12 = m[9]; const m22 = m[10]; const m32 = m[11];
    const m03 = m[12]; const m13 = m[13]; const m23 = m[14]; const m33 = m[15];

    const px = point.x;
    const py = point.y;
    const pz = point.z;

    let x = m00 * px + m01 * py + m02 * pz + m03;
    let y = m10 * px + m11 * py + m12 * pz + m13;
    let z = m20 * px + m21 * py + m22 * pz + m23;
    let w = m30 * px + m31 * py + m32 * pz + m33;

    w = 1 / w;
    x *= w;
    y *= w;
    z *= w;

    res.x = x;
    res.y = y;
    res.z = z;

    return res;
}

/**
 * `Matrix4x4.prototype.MultiplyPoint3x4` 的纯函数形式：点变换、不做透视除法。
 */
export function mat4MultiplyPoint3x4(a: Matrix4x4Like, point: Vector3Like, res: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const m = a.elements;
    const m00 = m[0]; const m10 = m[1]; const m20 = m[2];
    const m01 = m[4]; const m11 = m[5]; const m21 = m[6];
    const m02 = m[8]; const m12 = m[9]; const m22 = m[10];
    const m03 = m[12]; const m13 = m[13]; const m23 = m[14];

    const px = point.x;
    const py = point.y;
    const pz = point.z;

    const x = m00 * px + m01 * py + m02 * pz + m03;
    const y = m10 * px + m11 * py + m12 * pz + m13;
    const z = m20 * px + m21 * py + m22 * pz + m23;

    res.x = x;
    res.y = y;
    res.z = z;

    return res;
}

/**
 * `Matrix4x4.prototype.MultiplyVector` 的纯函数形式：方向变换（忽略平移）。
 */
export function mat4MultiplyVector(a: Matrix4x4Like, vector: Vector3Like, res: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const m = a.elements;
    const m00 = m[0]; const m10 = m[1]; const m20 = m[2];
    const m01 = m[4]; const m11 = m[5]; const m21 = m[6];
    const m02 = m[8]; const m12 = m[9]; const m22 = m[10];

    const vx = vector.x;
    const vy = vector.y;
    const vz = vector.z;

    const x = m00 * vx + m01 * vy + m02 * vz;
    const y = m10 * vx + m11 * vy + m12 * vz;
    const z = m20 * vx + m21 * vy + m22 * vz;

    res.x = x;
    res.y = y;
    res.z = z;

    return res;
}

/**
 * `Matrix4x4.prototype.TransformPlane` 的纯函数形式：用本矩阵的**逆转置**变换平面。
 *
 * 与 class 逐字一致：先求逆，再按 `m00*a + m10*b + m20*c + m30*d` 的形式改写 a/b/c/d。
 */
export function mat4TransformPlane(a: Matrix4x4Like, plane: PlaneLike, result: WritablePlaneLike = { a: 0, b: 0, c: 0, d: 0 }): WritablePlaneLike
{
    const it = mat4Invert(a).elements;
    const m00 = it[0]; const m10 = it[1]; const m20 = it[2]; const m30 = it[3];
    const m01 = it[4]; const m11 = it[5]; const m21 = it[6]; const m31 = it[7];
    const m02 = it[8]; const m12 = it[9]; const m22 = it[10]; const m32 = it[11];
    const m03 = it[12]; const m13 = it[13]; const m23 = it[14]; const m33 = it[15];

    const pa = plane.a;
    const pb = plane.b;
    const pc = plane.c;
    const pd = plane.d;

    // note: a transpose is part of this transformation
    const ra = m00 * pa + m10 * pb + m20 * pc + m30 * pd;
    const rb = m01 * pa + m11 * pb + m21 * pc + m31 * pd;
    const rc = m02 * pa + m12 * pb + m22 * pc + m32 * pd;
    const rd = m03 * pa + m13 * pb + m23 * pc + m33 * pd;

    result.a = ra;
    result.b = rb;
    result.c = rc;
    result.d = rd;

    return result;
}

/**
 * `Matrix4x4.prototype.getMaxScaleOnAxis` 的纯函数形式：三个基向量长度的最大值。
 */
export function mat4GetMaxScaleOnAxis(a: Matrix4x4Like): number
{
    const m = a.elements;
    const scaleXSq = m[0] * m[0] + m[1] * m[1] + m[2] * m[2];
    const scaleYSq = m[4] * m[4] + m[5] * m[5] + m[6] * m[6];
    const scaleZSq = m[8] * m[8] + m[9] * m[9] + m[10] * m[10];

    return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
}

/**
 * `Matrix4x4.prototype.random` 的纯函数形式：随机位移 + 随机欧拉角 + 随机缩放组成的矩阵。
 *
 * 随机数调用顺序与 class 一致（`vec3Random` 依次用于位移、旋转、缩放，各 3 次 `Math.random`）。
 */
export function mat4Random(out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const position = vec3Random();
    const rotation = vec3Random();
    const scale = vec3Random();

    return mat4FromTRS(position, rotation, scale, DEFAULT_ROTATION_ORDER, out);
}

/**
 * `Matrix4x4.prototype.lookAt` 的纯函数形式：右手系（three.js 约定）看向 `target`，本地 -Z 指向目标。
 *
 * `upAxis` 缺省用 `VEC3_Y_AXIS`（与 class 的 `Vector3.Y_AXIS` 同值）。
 * 全部中间量先算局部变量再写 `out`，所以 `out === a` 安全。
 */
export function mat4LookAt(a: Matrix4x4Like, target: Vector3Like, upAxis: Vector3Like = VEC3_Y_AXIS, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    // 获取位移，缩放，在变换过程位移与缩放不变
    const position = { x: 0, y: 0, z: 0 };
    const scale = { x: 0, y: 0, z: 0 };

    mat4ToTRS(a, position, { x: 0, y: 0, z: 0 }, scale);

    // 右手系 lookAt（three.js 约定）：z 轴 = eye - target，相机看向 -Z
    const zAxis = { x: position.x - target.x, y: position.y - target.y, z: position.z - target.z };

    vec3Normalized(zAxis, zAxis);

    const xAxis = {
        x: upAxis.y * zAxis.z - upAxis.z * zAxis.y,
        y: upAxis.z * zAxis.x - upAxis.x * zAxis.z,
        z: upAxis.x * zAxis.y - upAxis.y * zAxis.x,
    };

    vec3Normalized(xAxis, xAxis);

    if (vec3LengthSquared(xAxis) < 0.005)
    {
        xAxis.x = upAxis.y;
        xAxis.y = upAxis.x;
        xAxis.z = 0;
        vec3Normalized(xAxis, xAxis);
    }

    const yAxis = {
        x: zAxis.y * xAxis.z - zAxis.z * xAxis.y,
        y: zAxis.z * xAxis.x - zAxis.x * xAxis.z,
        z: zAxis.x * xAxis.y - zAxis.y * xAxis.x,
    };

    const e = out.elements;

    e[0] = scale.x * xAxis.x;
    e[1] = scale.x * xAxis.y;
    e[2] = scale.x * xAxis.z;
    e[3] = 0;

    e[4] = scale.y * yAxis.x;
    e[5] = scale.y * yAxis.y;
    e[6] = scale.y * yAxis.z;
    e[7] = 0;

    e[8] = scale.z * zAxis.x;
    e[9] = scale.z * zAxis.y;
    e[10] = scale.z * zAxis.z;
    e[11] = 0;

    e[12] = position.x;
    e[13] = position.y;
    e[14] = position.z;
    e[15] = 1;

    return out;
}

/**
 * `Matrix4x4.prototype.setOrtho` 的纯函数形式：正交投影矩阵（WebGPU 约定，z→[0,1]）。
 */
export function mat4SetOrtho(left: number, right: number, top: number, bottom: number, near: number, far: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const e = out.elements;

    // WebGPU 约定（z→[0,1]，相机看 -Z）：与 three.js Matrix4.makeOrthographic(WebGPUCoordinateSystem) 一致
    e[0] = 2 / (right - left); e[4] = 0; /**/ e[8] = 0; /**/ e[12] = -(right + left) / (right - left);//
    e[1] = 0; /**/ e[5] = 2 / (top - bottom); e[9] = 0;/**/ e[13] = -(top + bottom) / (top - bottom);//
    e[2] = 0; /**/ e[6] = 0; /**/ e[10] = -1 / (far - near); e[14] = -near / (far - near);//
    e[3] = 0; /**/ e[7] = 0; /**/ e[11] = 0; /**/ e[15] = 1;//

    return out;
}

/**
 * `Matrix4x4.prototype.setPerspectiveFromFOV` 的纯函数形式：按垂直视角构造透视矩阵。
 *
 * `fov` 是**角度**（内部 `fov * Math.PI / 360`）。
 */
export function mat4SetPerspectiveFromFOV(fov: number, aspect: number, near: number, far: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const e = out.elements;

    const tanfov2 = Math.tan(fov * Math.PI / 360);

    // WebGPU 约定（z→[0,1]，相机看 -Z，m[11]=-1）：与 three.js Matrix4.makePerspective(WebGPUCoordinateSystem) 一致
    e[0] = 1 / (aspect * tanfov2); e[4] = 0; /**/ e[8] = 0; /**/ e[12] = 0;//
    e[1] = 0; /**/ e[5] = 1 / tanfov2; e[9] = 0;/**/ e[13] = 0;//
    e[2] = 0; /**/ e[6] = 0; /**/ e[10] = -far / (far - near); e[14] = -far * near / (far - near);//
    e[3] = 0; /**/ e[7] = 0; /**/ e[11] = -1; /**/ e[15] = 0;//

    return out;
}

/**
 * `Matrix4x4.prototype.setPerspective`（六个视锥边界版）的纯函数形式：透视投影矩阵。
 */
export function mat4SetPerspective(left: number, right: number, top: number, bottom: number, near: number, far: number, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const e = out.elements;

    // WebGPU 约定（z→[0,1]，相机看 -Z，m[11]=-1）
    e[0] = 2 * near / (right - left); e[4] = 0; /**/ e[8] = 0; /**/ e[12] = 0;//
    e[1] = 0; /**/ e[5] = 2 * near / (top - bottom); e[9] = 0;/**/ e[13] = 0;//
    e[2] = 0; /**/ e[6] = 0; /**/ e[10] = -far / (far - near); e[14] = -far * near / (far - near);//
    e[3] = 0; /**/ e[7] = 0; /**/ e[11] = -1; /**/ e[15] = 0;//

    return out;
}

/**
 * `Matrix4x4.Scale`（静态，由向量构造缩放矩阵）的纯函数形式。
 *
 * 名字里的 `FromVector` 是为与 `mat4FromScale(sx, sy, sz)` 区分（三个标量 vs 一个向量）。
 */
export function mat4FromVectorScale(vector: Vector3Like, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const e = out.elements;

    e[0] = vector.x; e[1] = 0; e[2] = 0; e[3] = 0;
    e[4] = 0; e[5] = vector.y; e[6] = 0; e[7] = 0;
    e[8] = 0; e[9] = 0; e[10] = vector.z; e[11] = 0;
    e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;

    return out;
}

/**
 * `Matrix4x4.Translate`（静态，由向量构造平移矩阵）的纯函数形式。
 */
export function mat4FromVectorPosition(vector: Vector3Like, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    const e = out.elements;

    e[0] = 1; e[1] = 0; e[2] = 0; e[3] = 0;
    e[4] = 0; e[5] = 1; e[6] = 0; e[7] = 0;
    e[8] = 0; e[9] = 0; e[10] = 1; e[11] = 0;
    e[12] = vector.x; e[13] = vector.y; e[14] = vector.z; e[15] = 1;

    return out;
}

/**
 * `Matrix4x4.Rotate`（静态，由四元数构造旋转矩阵，假定已归一化）的纯函数形式。
 *
 * ⚠️ 与 `quatToMatrix4x4` **不是同一个实现**（这一条按行主序写、元素顺序与符号都不同），
 * 两者都保留、不互相替换——`Quaternion.toMatrix` 与 `Matrix4x4.Rotate` 在 class 里本来就是两份。
 */
export function mat4FromQuaternionRotate(q: QuaternionLike, out: WritableMatrix4x4Like = newOut()): WritableMatrix4x4Like
{
    // Precalculate coordinate products
    const x = q.x * 2.0;
    const y = q.y * 2.0;
    const z = q.z * 2.0;
    const xx = q.x * x;
    const yy = q.y * y;
    const zz = q.z * z;
    const xy = q.x * y;
    const xz = q.x * z;
    const yz = q.y * z;
    const wx = q.w * x;
    const wy = q.w * y;
    const wz = q.w * z;

    const e = out.elements;

    // Calculate 3x3 matrix from orthonormal basis
    e[0] = 1.0 - (yy + zz); e[1] = xy + wz; e[2] = xz - wy; e[3] = 0.0;
    e[4] = xy - wz; e[5] = 1.0 - (xx + zz); e[6] = yz + wx; e[7] = 0.0;
    e[8] = xz + wy; e[9] = yz - wx; e[10] = 1.0 - (xx + yy); e[11] = 0.0;
    e[12] = 0.0; e[13] = 0.0; e[14] = 0.0; e[15] = 1.0;

    return out;
}

/**
 * `Matrix4x4.prototype.toString` 的纯函数形式（输出文本与实现逐字一致）。
 */
export function mat4ToString(a: Matrix4x4Like): string
{
    const m = a.elements;

    return `Matrix4x4 [${[
        m[0], m[1], m[2], m[3],
        m[4], m[5], m[6], m[7],
        m[8], m[9], m[10], m[11],
        m[12], m[13], m[14], m[15],
    ].toString()}]`;
}
