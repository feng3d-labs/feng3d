import { mathUtil } from '@feng3d/polyfill';
import type { QuaternionLike } from './quaternion';
import type { Matrix4x4Like, WritableMatrix4x4Like } from './matrix4x4';
import { vec3ToString } from './vector3';
import type { Vector3Like, WritableVector3Like } from './vector3';

/**
 * `Matrix3x3` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` 阶段 A2c）。
 *
 * ## 约定
 *
 * - **不修改入参**：结果写进 `out`（缺省时新建普通字面量）；
 * - `out` 传自己就是「就地运算」，所以 class 上的 `transpose()` 与 `transposeTo(target)` 是**同一个函数**，
 *   只是 `out` 实参不同（方案 §3.3）；`reverse()` / `reverseTo()` 稍特殊，见 `mat3Reverse` 的说明；
 * - 跨类型运算里**对方 ops 已就绪的部分也在本文件**：`mat3Vmult` / `mat3Solve` / `mat3GetTrace` /
 *   `mat3SetTrace` / `mat3Scale` / `mat3GetScale`（Vector3，A1 已就绪）、
 *   `mat3SetRotationFromQuaternion`（Quaternion，A2b 已就绪）、
 *   `mat3FromMatrix4x4` / `mat3ToMatrix4x4`（Matrix4x4，A3 已就绪）。
 * - 依赖：`@feng3d/polyfill` 的 `mathUtil`（`mat3Equals` 的缺省精度）、`./vector3` 的 `vec3ToString`
 *   与向量写入形状、`./quaternion` 的 `QuaternionLike`（type-only）、`./Vector3` 的 `Vector3Like`
 *   （type-only）。这些都是**已经纯函数化的模块**，方向是
 *   `matrix3x3.ts → {vector3, quaternion, matrix4x4}`，**不 import 任何 math 数据 class**，
 *   不会形成模块环。
 *
 * ## 阶段 C-e：`Matrix3x3` class 已删除
 *
 * 原 class 的成员**全部**落到纯函数层（A2c / A3 起就已就绪，本批只是把 class 摘掉）。
 * 接口 `Matrix3x3` 落在本文件（方案 §3.1），消费方
 * `import { Matrix3x3 } from '@feng3d/math'` 一字不改。
 *
 * ## 数据形状
 *
 * `Matrix3x3` 的数据表示不是平铺字段，而是**九个元素的元组** `elements`
 * （行主序存放：`elements[3 * row + column]`，即 `elements[0..2]` 是第一行，见 `mat3GetElement`），
 * 所以 `Like` 类型带的是 `elements` 而不是九个平铺字段。
 */

/** 九个矩阵元素的元组（与 `Matrix3x3.elements` 同形；存放顺序见 `mat3GetElement`）。 */
export type Matrix3x3Elements = [
    number, number, number,
    number, number, number,
    number, number, number,
];

/** 纯函数可接受的最小 3x3 矩阵形状：class 实例与纯数据字面量都满足。 */
export interface Matrix3x3Like
{
    readonly elements: ArrayLike<number>;
}

/** 需要写回的目标形状（`out` 参数用；class 实例与普通字面量都满足）。 */
export interface WritableMatrix3x3Like
{
    elements: Matrix3x3Elements;
}

/**
 * `Matrix3x3` 纯数据接口（**带判别字段**，方案 §5.9 的 D1 决策）。
 *
 * `Matrix3x3Like` / `WritableMatrix3x3Like` **刻意不带** `__type__`：它们是 A / B 阶段用来放宽
 * feng3d 签名的「最小形状」，带上判别字段会成片传导给普通字面量消费方。
 *
 * ⚠️ `elements` 在这里**收窄为 `Matrix3x3Elements`**（`Matrix3x3Like` 是更宽的 `ArrayLike<number>`）：
 * 与 `Matrix4x4` 同理——纯数据矩阵值常常要直接当 `out` 用，而 `ArrayLike<number>`
 * 不满足 `WritableMatrix3x3Like`。
 *
 * 阶段 C-e 起 class 已删除，本接口与 `*Like` 同址（方案 §3.1）：
 * `import { Matrix3x3 } from '@feng3d/math'` 一字不改。
 */
export interface Matrix3x3 extends Matrix3x3Like
{
    readonly __type__: 'Matrix3x3';
    readonly elements: Matrix3x3Elements;
}

/**
 * 缺省 `out`：初值与 `new Matrix3x3()` 一致（单位矩阵，方案 §10.1 P6）。
 *
 * **必须每次新建**：`elements` 是数组，若像 `quaternion` 那样用一个模块级 `DEFAULT_OUT`
 * 常量加 `{ ...DEFAULT_OUT }` 展开，两次缺省调用会写进**同一个数组**
 * （展开只复制字段、不复制数组）。
 */
function defaultOut(): WritableMatrix3x3Like
{
    return { elements: [1, 0, 0, 0, 1, 0, 0, 0, 1] };
}

/**
 * `Matrix3x3.set` 的纯函数形式：把 `elements` **直接作为** `out` 的元素数组（与 class 一致，不拷贝）。
 *
 * ⚠️ 与 `mat3Copy` 的区别：本函数不复制九个数字，调用后 `out.elements` 与入参**共享同一个数组**
 * （`new Matrix3x3(elements)` 也是这个语义）。
 */
export function mat3Set(elements: Matrix3x3Elements, out: WritableMatrix3x3Like = defaultOut()): WritableMatrix3x3Like
{
    out.elements = elements;

    return out;
}

/**
 * `Matrix3x3.identity` 的纯函数形式：置为单位矩阵（九个元素全写，`out` 的初值无关）。
 */
export function mat3Identity(out: WritableMatrix3x3Like = defaultOut()): WritableMatrix3x3Like
{
    const e = out.elements;

    e[0] = 1;
    e[1] = 0;
    e[2] = 0;

    e[3] = 0;
    e[4] = 1;
    e[5] = 0;

    e[6] = 0;
    e[7] = 0;
    e[8] = 1;

    return out;
}

/**
 * `Matrix3x3.setZero` 的纯函数形式：九个元素全部置零。
 */
export function mat3SetZero(out: WritableMatrix3x3Like = defaultOut()): WritableMatrix3x3Like
{
    const e = out.elements;

    e[0] = 0;
    e[1] = 0;
    e[2] = 0;
    e[3] = 0;
    e[4] = 0;
    e[5] = 0;
    e[6] = 0;
    e[7] = 0;
    e[8] = 0;

    return out;
}

/**
 * `Matrix3x3.setTrace` 的纯函数形式：用 `vec3` 设置矩阵的对角元素（只写三个，其余不动）。
 *
 * 只写三个元素，所以缺省 `out` 取单位矩阵（与 `new Matrix3x3()` 一致，方案 §10.1 P6）。
 */
export function mat3SetTrace(vec3: Vector3Like, out: WritableMatrix3x3Like = defaultOut()): WritableMatrix3x3Like
{
    const e = out.elements;

    e[0] = vec3.x;
    e[4] = vec3.y;
    e[8] = vec3.z;

    return out;
}

/**
 * `Matrix3x3.getTrace` 的纯函数形式：取对角元素写进 `out`（缺省新建向量字面量）。
 */
export function mat3GetTrace(a: Matrix3x3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const e = a.elements;

    out.x = e[0];
    out.y = e[4];
    out.z = e[8];

    return out;
}

/**
 * `Matrix3x3.vmult` / `Matrix3x3.transformVector3` 的纯函数形式：矩阵乘向量（结果写进向量）。
 *
 * 三个分量先取到局部变量，所以 `out` 与 `v` 同一对象也安全。
 */
export function mat3Vmult(a: Matrix3x3Like, v: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const e = a.elements;
    const x = v.x;
    const y = v.y;
    const z = v.z;

    out.x = e[0] * x + e[1] * y + e[2] * z;
    out.y = e[3] * x + e[4] * y + e[5] * z;
    out.z = e[6] * x + e[7] * y + e[8] * z;

    return out;
}

/**
 * `Matrix3x3.smult` 的纯函数形式：矩阵标量乘法（逐元素乘 `s`）。
 *
 * 与 class 一致按**元素数组的长度**遍历（`elements` 是九元组时就是九个）；
 * 每个元素只读自己那一格，所以 `out === a` 就地乘也安全。
 */
export function mat3ScaleNumber(a: Matrix3x3Like, s: number, out: WritableMatrix3x3Like = defaultOut()): WritableMatrix3x3Like
{
    const ae = a.elements;
    const oe = out.elements;

    for (let i = 0; i < ae.length; i++)
    {
        oe[i] = ae[i] * s;
    }

    return out;
}

/**
 * `Matrix3x3.mmult` 的纯函数形式：矩阵乘法，结果 = `a × b`（`a` 在左）。
 *
 * class 的 `mmult(m)` 计算的是 `this × m`（尽管它的 JSDoc 写成「m 要从左边乘」），
 * 所以委托时是 `mat3Multiply(this, m, target)`——顺序不能颠倒。
 *
 * 九个元素先算进**局部标量**再写 `out`（不建临时数组，热路径零分配），
 * 所以 `out` 与 `a` / `b` 同一对象（就地相乘）也安全；
 * 原 class 实现边算边写，`out` 与入参同一对象时会被自污染（方案 §10.1 P2）。
 */
export function mat3Multiply(a: Matrix3x3Like, b: Matrix3x3Like, out: WritableMatrix3x3Like = defaultOut()): WritableMatrix3x3Like
{
    const ae = a.elements;
    const be = b.elements;

    // 先把两个矩阵的十八个元素读进局部变量：out 可能就是 a 或 b
    const a0 = ae[0]; const a1 = ae[1]; const a2 = ae[2];
    const a3 = ae[3]; const a4 = ae[4]; const a5 = ae[5];
    const a6 = ae[6]; const a7 = ae[7]; const a8 = ae[8];
    const b0 = be[0]; const b1 = be[1]; const b2 = be[2];
    const b3 = be[3]; const b4 = be[4]; const b5 = be[5];
    const b6 = be[6]; const b7 = be[7]; const b8 = be[8];

    // 结果（行主序：每三个一行）；每项的求和顺序与 class 的 k = 0,1,2 一致
    const r00 = (a0 * b0) + (a1 * b3) + (a2 * b6);
    const r01 = (a0 * b1) + (a1 * b4) + (a2 * b7);
    const r02 = (a0 * b2) + (a1 * b5) + (a2 * b8);
    const r10 = (a3 * b0) + (a4 * b3) + (a5 * b6);
    const r11 = (a3 * b1) + (a4 * b4) + (a5 * b7);
    const r12 = (a3 * b2) + (a4 * b5) + (a5 * b8);
    const r20 = (a6 * b0) + (a7 * b3) + (a8 * b6);
    const r21 = (a6 * b1) + (a7 * b4) + (a8 * b7);
    const r22 = (a6 * b2) + (a7 * b5) + (a8 * b8);
    const e = out.elements;

    e[0] = r00;
    e[1] = r01;
    e[2] = r02;
    e[3] = r10;
    e[4] = r11;
    e[5] = r12;
    e[6] = r20;
    e[7] = r21;
    e[8] = r22;

    return out;
}

/**
 * `Matrix3x3.scale` 的纯函数形式：缩放矩阵的每一列（`out[3i+k] = v[k] * a[3i+k]`）。
 *
 * 每个元素只读自己那一格，所以 `out === a` 就地缩放也安全。
 */
export function mat3Scale(a: Matrix3x3Like, v: Vector3Like, out: WritableMatrix3x3Like = defaultOut()): WritableMatrix3x3Like
{
    const e = a.elements;
    const oe = out.elements;

    for (let i = 0; i !== 3; i++)
    {
        oe[3 * i + 0] = v.x * e[3 * i + 0];
        oe[3 * i + 1] = v.y * e[3 * i + 1];
        oe[3 * i + 2] = v.z * e[3 * i + 2];
    }

    return out;
}

/**
 * `Matrix3x3.solve` 的纯函数形式：解 `Ax = b`（高斯消去），结果写进 `out`（缺省新建）。
 *
 * - 无解时抛 **`Error`**（消息文本与 class 逐字一致，含三处 `toString` 的文本格式）；
 * - 三个分量的写回顺序与 class 相同（`z → y → x`：后写的分量读前面刚写出的结果），
 *   所以 `out.x/y/z` 的中间状态也一致。
 *
 * ★ **行为修复（#134 后续清理批，原为「逐字保留」的既有缺陷）**：
 *
 * 1. 原来 `throw` 的是**字符串**而不是 `Error`——调用方拿不到堆栈，`e instanceof Error` /
 *    `e.message` 一类标准处理全部失效。本批改成 `new Error(...)`，**消息文本一字不改**；
 * 2. 奇异性判据原来漏了 `-Infinity`（只判了 `isNaN` 与 `+Infinity`），`-Infinity` 结果会被
 *    当成正常解返回。本批统一按 `!Number.isFinite(...)` 判定（等价于 `NaN | ±Infinity`）。
 *
 * 修复依据：全仓可执行消费方只有 math 自己的用例（`packages/` + `examples/` + `test/` 实测，
 * 含 `.vue`），且它们只断言「抛了错 / 错误信息含 `Could not solve equation!`」——不依赖
 * 「抛的是字符串」这一点。
 */
export function mat3Solve(a: Matrix3x3Like, b: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    // Construct equations
    const nr = 3; // num rows
    const nc = 4; // num cols
    const eqns: number[] = [];

    let i: number;
    for (i = 0; i < nr * nc; i++)
    {
        eqns.push(0);
    }
    let j: number;

    for (i = 0; i < 3; i++)
    {
        for (j = 0; j < 3; j++)
        {
            eqns[i + nc * j] = a.elements[i + 3 * j];
        }
    }
    eqns[3 + 4 * 0] = b.x;
    eqns[3 + 4 * 1] = b.y;
    eqns[3 + 4 * 2] = b.z;

    // 计算矩阵的右上三角型——高斯消去法
    let n = 3; const k = n; let
        np: number;
    const kp = 4; // num rows
    let p: number;

    do
    {
        i = k - n;
        if (eqns[i + nc * i] === 0)
        {
            // the pivot is null, swap lines
            for (j = i + 1; j < k; j++)
            {
                if (eqns[i + nc * j] !== 0)
                {
                    np = kp;
                    do
                    { // do ligne( i ) = ligne( i ) + ligne( k )
                        p = kp - np;
                        eqns[p + nc * i] += eqns[p + nc * j];
                    } while (--np);
                    break;
                }
            }
        }
        if (eqns[i + nc * i] !== 0)
        {
            for (j = i + 1; j < k; j++)
            {
                const multiplier = eqns[i + nc * j] / eqns[i + nc * i];

                np = kp;
                do
                { // do ligne( k ) = ligne( k ) - multiplier * ligne( i )
                    p = kp - np;
                    eqns[p + nc * j] = p <= i ? 0 : eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
                } while (--np);
            }
        }
    } while (--n);

    // Get the solution
    out.z = eqns[2 * nc + 3] / eqns[2 * nc + 2];
    out.y = (eqns[Number(nc) + 3] - eqns[Number(nc) + 2] * out.z) / eqns[Number(nc) + 1];
    out.x = (eqns[0 * nc + 3] - eqns[0 * nc + 2] * out.z - eqns[0 * nc + 1] * out.y) / eqns[0 * nc + 0];

    if (!Number.isFinite(out.x) || !Number.isFinite(out.y) || !Number.isFinite(out.z))
    {
        throw new Error(`Could not solve equation! Got x=[${vec3ToString(out)}], b=[${vec3ToString(b)}], A=[${mat3ToString(a)}]`);
    }

    return out;
}

/**
 * `Matrix3x3.getElement` 的纯函数形式：取 `row` 行 `column` 列的元素。
 *
 * 元素数组是**行主序**：`elements[3 * row + column]`（下标 0..2 是第一行）。
 */
export function mat3GetElement(a: Matrix3x3Like, row: number, column: number): number
{
    return a.elements[column + 3 * row];
}

/**
 * `Matrix3x3.setElement` 的纯函数形式：设 `row` 行 `column` 列的元素。
 *
 * 只写一个元素，所以缺省 `out` 取单位矩阵（与 `new Matrix3x3()` 一致，方案 §10.1 P6）。
 */
export function mat3SetElement(out: WritableMatrix3x3Like, row: number, column: number, value: number): WritableMatrix3x3Like
{
    out.elements[column + 3 * row] = value;

    return out;
}

/**
 * `Matrix3x3.copy` / `Matrix3x3.clone` 的纯函数形式：按值复制九个元素进 `out`（缺省新建）。
 *
 * 与 `mat3Set` 不同：这里**复用 `out` 已有的 `elements` 数组**（逐个赋值），
 * 与 class 的 `copy` 语义一致（`clone` 因此是深拷贝）。
 */
export function mat3Copy(a: Matrix3x3Like, out: WritableMatrix3x3Like = defaultOut()): WritableMatrix3x3Like
{
    const ae = a.elements;
    const oe = out.elements;

    for (let i = 0; i < ae.length; i++)
    {
        oe[i] = ae[i];
    }

    return out;
}

/**
 * `Matrix3x3.toString` 的纯函数形式（输出文本与实现逐字一致，含结尾的分隔符）。
 */
export function mat3ToString(a: Matrix3x3Like): string
{
    let r = '';
    const sep = ',';

    for (let i = 0; i < 9; i++)
    {
        r += a.elements[i] + sep;
    }

    return r;
}

/**
 * `Matrix3x3.reverse` / `Matrix3x3.invert` 的纯函数形式：求逆矩阵（高斯消去）。
 *
 * - 先建方程再把九个结果写进 `out`，所以 `out === a` 就地求逆也安全；
 * - 写回顺序与 class 逐字一致（`i` 从 2 递减、每行 `j` 从 2 递减），
 *   所以**求逆失败抛错时 `out` 里已写入的部分**也与原实现相同。
 *
 * ★ **行为修复（#134 后续清理批，原为「逐字保留」的既有缺陷）**：与 `mat3Solve` 同款——
 * 原来 `throw` 的是**字符串**（改成 `new Error(...)`，消息文本不变），
 * 奇异性判据原来漏 `-Infinity`（改成 `!Number.isFinite(p)`，等价于 `NaN | ±Infinity`）。
 * 理由与消费方实测见 `mat3Solve` 的说明；本函数在全仓同样只有 math 自己的用例调用。
 */
export function mat3Reverse(a: Matrix3x3Like, out: WritableMatrix3x3Like = defaultOut()): WritableMatrix3x3Like
{
    // Construct equations
    const nr = 3; // num rows
    const nc = 6; // num cols
    // 显式标注 number[]，否则空数组被推断为 never[]，后续所有下标读写都会报错
    const eqns: number[] = [];

    let i: number;
    let j: number;
    for (i = 0; i < nr * nc; i++)
    {
        eqns.push(0);
    }

    for (i = 0; i < 3; i++)
    {
        for (j = 0; j < 3; j++)
        {
            eqns[i + nc * j] = a.elements[i + 3 * j];
        }
    }
    eqns[3 + 6 * 0] = 1;
    eqns[3 + 6 * 1] = 0;
    eqns[3 + 6 * 2] = 0;
    eqns[4 + 6 * 0] = 0;
    eqns[4 + 6 * 1] = 1;
    eqns[4 + 6 * 2] = 0;
    eqns[5 + 6 * 0] = 0;
    eqns[5 + 6 * 1] = 0;
    eqns[5 + 6 * 2] = 1;

    // Compute right upper triangular version of the matrix - Gauss elimination
    let n = 3; const k = n; let
        np: number;
    const kp = nc; // num rows
    let p: number;

    do
    {
        i = k - n;
        if (eqns[i + nc * i] === 0)
        {
            // the pivot is null, swap lines
            for (j = i + 1; j < k; j++)
            {
                if (eqns[i + nc * j] !== 0)
                {
                    np = kp;
                    do
                    { // do line( i ) = line( i ) + line( k )
                        p = kp - np;
                        eqns[p + nc * i] += eqns[p + nc * j];
                    } while (--np);
                    break;
                }
            }
        }
        if (eqns[i + nc * i] !== 0)
        {
            for (j = i + 1; j < k; j++)
            {
                const multiplier = eqns[i + nc * j] / eqns[i + nc * i];

                np = kp;
                do
                { // do line( k ) = line( k ) - multiplier * line( i )
                    p = kp - np;
                    eqns[p + nc * j] = p <= i ? 0 : eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
                } while (--np);
            }
        }
    } while (--n);

    // eliminate the upper left triangle of the matrix
    i = 2;
    do
    {
        j = i - 1;
        do
        {
            const multiplier = eqns[i + nc * j] / eqns[i + nc * i];

            np = nc;
            do
            {
                p = nc - np;
                eqns[p + nc * j] = eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
            } while (--np);
        } while (j--);
    } while (--i);

    // operations on the diagonal
    i = 2;
    do
    {
        const multiplier = 1 / eqns[i + nc * i];

        np = nc;
        do
        {
            p = nc - np;
            eqns[p + nc * i] = eqns[p + nc * i] * multiplier;
        } while (--np);
    } while (i--);

    i = 2;
    do
    {
        j = 2;
        do
        {
            p = eqns[nr + j + nc * i];
            if (!Number.isFinite(p))
            {
                throw new Error(`Could not reverse! A=[${mat3ToString(a)}]`);
            }
            // 与 class 的 setElement(i, j, p) 等价：elements[column + 3 * row]
            out.elements[j + 3 * i] = p;
        } while (j--);
    } while (i--);

    return out;
}

/**
 * `Matrix3x3.setRotationFromQuaternion` 的纯函数形式：从四元数构造旋转矩阵（九个元素全写）。
 *
 * `q` 用 `./quaternion` 的 `QuaternionLike`（type-only 引入）：class 实例与纯数据字面量都满足。
 */
export function mat3SetRotationFromQuaternion(q: QuaternionLike, out: WritableMatrix3x3Like = defaultOut()): WritableMatrix3x3Like
{
    const x = q.x; const y = q.y; const z = q.z; const w = q.w;
    const x2 = x + x; const y2 = y + y; const z2 = z + z;
    const xx = x * x2; const xy = x * y2; const xz = x * z2;
    const yy = y * y2; const yz = y * z2; const zz = z * z2;
    const wx = w * x2; const wy = w * y2; const wz = w * z2;
    const e = out.elements;

    e[3 * 0 + 0] = 1 - (yy + zz);
    e[3 * 0 + 1] = xy - wz;
    e[3 * 0 + 2] = xz + wy;

    e[3 * 1 + 0] = xy + wz;
    e[3 * 1 + 1] = 1 - (xx + zz);
    e[3 * 1 + 2] = yz - wx;

    e[3 * 2 + 0] = xz - wy;
    e[3 * 2 + 1] = yz + wx;
    e[3 * 2 + 2] = 1 - (xx + yy);

    return out;
}

/**
 * `Matrix3x3.transpose` / `Matrix3x3.transposeTo` 的纯函数形式：转置（`out[3i+j] = a[3j+i]`）。
 *
 * 九个元素先读进**局部标量**再写 `out`（不建临时数组，热路径零分配），
 * 所以 `out === a` 就地转置也安全（两次转置还原）。
 */
export function mat3Transpose(a: Matrix3x3Like, out: WritableMatrix3x3Like = defaultOut()): WritableMatrix3x3Like
{
    const ae = a.elements;
    const a0 = ae[0]; const a1 = ae[1]; const a2 = ae[2];
    const a3 = ae[3]; const a4 = ae[4]; const a5 = ae[5];
    const a6 = ae[6]; const a7 = ae[7]; const a8 = ae[8];
    const e = out.elements;

    e[0] = a0;
    e[1] = a3;
    e[2] = a6;
    e[3] = a1;
    e[4] = a4;
    e[5] = a7;
    e[6] = a2;
    e[7] = a5;
    e[8] = a8;

    return out;
}

/**
 * `Matrix3x3.toArray` 的纯函数形式：把元素写进 `array` 的 `offset` 起并返回该数组。
 */
export function mat3ToArray(a: Matrix3x3Like, array: number[] = [], offset = 0): number[]
{
    const ae = a.elements;

    for (let i = 0; i < ae.length; i++)
    {
        array[offset + i] = ae[i];
    }

    return array;
}

/**
 * `Matrix3x3.fromArray` 的纯函数形式：从 `array` 的 `index` 起读九个元素写进 `out`（缺省新建）。
 *
 * 长度不足时抛 `Error`（与 class 逐字一致，不静默填充半个矩阵）。
 */
export function mat3FromArray(array: ArrayLike<number>, index = 0, out: WritableMatrix3x3Like = defaultOut()): WritableMatrix3x3Like
{
    if (array.length - index < 9)
    {
        throw new Error('数组长度不足，无法填充 3x3 矩阵！');
    }

    const e = out.elements;

    for (let i = 0; i < 9; i++)
    {
        e[i] = array[index + i];
    }

    return out;
}

/**
 * `Matrix3x3.equals` 的纯函数形式：逐元素按 `precision` 判等（缺省 `mathUtil.PRECISION`）。
 */
export function mat3Equals(a: Matrix3x3Like, b: Matrix3x3Like, precision = mathUtil.PRECISION): boolean
{
    const ae = a.elements;
    const be = b.elements;

    for (let i = 0; i < 9; ++i)
    {
        if (!mathUtil.equals(ae[i] - be[i], 0, precision))
        {
            return false;
        }
    }

    return true;
}

/**
 * `Matrix3x3.getScale` 的纯函数形式：提取三个轴的缩放（第 j 列的长度）。
 */
export function mat3GetScale(a: Matrix3x3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const e = a.elements;

    out.x = Math.hypot(e[0], e[3], e[6]);
    out.y = Math.hypot(e[1], e[4], e[7]);
    out.z = Math.hypot(e[2], e[5], e[8]);

    return out;
}

/**
 * `Matrix3x3.formMatrix4x4` 的纯函数形式：取 4x4 的**左上 3×3** 写进 3×3。
 *
 * ⚠️ 与 `matrix4x4.mat4ToMatrix3x3`（对应 `Matrix4x4.toMatrix3x3`）**不是一回事**：
 * 后者写的是 `[m0, m1, 0, m4, m5, 0, m12, m13, 1]`（第三行取的是**位移**，看着像原实现的 bug），
 * 本函数取的才是真正的左上 3×3：`[m0, m1, m2, m4, m5, m6, m8, m9, m10]`。
 */
export function mat3FromMatrix4x4(a: Matrix4x4Like, out: WritableMatrix3x3Like): WritableMatrix3x3Like
{
    const arr4 = a.elements;
    const arr3 = out.elements;

    arr3[0] = arr4[0];
    arr3[1] = arr4[1];
    arr3[2] = arr4[2];

    arr3[3] = arr4[4];
    arr3[4] = arr4[5];
    arr3[5] = arr4[6];

    arr3[6] = arr4[8];
    arr3[7] = arr4[9];
    arr3[8] = arr4[10];

    return out;
}

/**
 * `Matrix3x3.toMatrix4x4` 的纯函数形式：把 3×3 的九个元素写进 4×4 的左上角，
 * 平移 / 透视部分保持单位（3×3 里没有这些信息）。
 *
 * 与 `mat3FromMatrix4x4` 严格互逆（修 #497：原实现只搬运 6 个元素、丢掉第 3 列，
 * 还把两处写进平移位置，导致往返无法还原）。
 */
export function mat3ToMatrix4x4(a: Matrix3x3Like, out: WritableMatrix4x4Like): WritableMatrix4x4Like
{
    const outdata = out.elements;
    const indata = a.elements;

    outdata[0] = indata[0];
    outdata[1] = indata[1];
    outdata[2] = indata[2];
    outdata[3] = 0;

    outdata[4] = indata[3];
    outdata[5] = indata[4];
    outdata[6] = indata[5];
    outdata[7] = 0;

    outdata[8] = indata[6];
    outdata[9] = indata[7];
    outdata[10] = indata[8];
    outdata[11] = 0;

    outdata[12] = 0;
    outdata[13] = 0;
    outdata[14] = 0;
    outdata[15] = 1;

    return out;
}
