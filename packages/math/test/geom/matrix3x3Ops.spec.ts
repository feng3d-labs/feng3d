import { assert, describe, expect, it } from 'vitest';
import { quatSet } from '../../src/geom/quaternionOps';
import type { Matrix3x3Elements } from '../../src/geom/matrix3x3Ops';
import {
    mat3Copy,
    mat3Equals,
    mat3FromArray,
    mat3GetElement,
    mat3GetScale,
    mat3GetTrace,
    mat3Identity,
    mat3Multiply,
    mat3Reverse,
    mat3Scale,
    mat3ScaleNumber,
    mat3Set,
    mat3SetElement,
    mat3SetRotationFromQuaternion,
    mat3SetTrace,
    mat3SetZero,
    mat3Solve,
    mat3ToArray,
    mat3ToString,
    mat3Transpose,
    mat3Vmult,
} from '../../src/geom/matrix3x3Ops';

const { equal, deepEqual, ok } = assert;

// ───────────────────────── 测试数据（期望值全部手算后硬编码） ─────────────────────────

/** A = ((1,2,3),(4,5,6),(7,8,9))（行主序：每三个元素一行） */
const A9: Matrix3x3Elements = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** B = ((5,2,4),(4,5,1),(1,8,0))，det(B) = 70 */
const B9: Matrix3x3Elements = [5, 2, 4, 4, 5, 1, 1, 8, 0];

/** 手算 A × B = ((16,36,6),(46,81,21),(76,126,36)) */
const A_MUL_B9: Matrix3x3Elements = [16, 36, 6, 46, 81, 21, 76, 126, 36];

/** 手算 B × A = ((41,52,63),(31,41,51),(33,42,51))——与 A × B 不同，用来锁参数顺序 */
const B_MUL_A9: Matrix3x3Elements = [41, 52, 63, 31, 41, 51, 33, 42, 51];

/** 手算 70 × B⁻¹ = ((-8,32,-18),(1,-4,11),(27,-38,17))（伴随矩阵转置，已逐项验算 B × B⁻¹ = I） */
const B_INV_X70: Matrix3x3Elements = [-8, 32, -18, 1, -4, 11, 27, -38, 17];

const IDENTITY9: Matrix3x3Elements = [1, 0, 0, 0, 1, 0, 0, 0, 1];

// ───────────────────────────────── 辅助函数 ─────────────────────────────────

/** 复制九个元素（保证类型是九元组，不用 `as` 断言） */
function copy9(e: Matrix3x3Elements): Matrix3x3Elements
{
    return [e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]];
}

/** 纯数据矩阵字面量 */
function m3(elements: Matrix3x3Elements): { elements: Matrix3x3Elements }
{
    return { elements };
}

/**
 * 取九个元素。
 *
 * **不要**直接展开 class 实例断言：`Matrix3x3` 是普通 class 但不保证没有其他自有属性，
 * 而纯函数返回的是干净字面量，展开比较会假失败（同 `Vector3` 的 `__class__`，方案 §10.1 P4）。
 */
function el(m: { readonly elements: ArrayLike<number> }): number[]
{
    return Array.from(m.elements);
}

/** 只取 xyz（纯函数返回的向量字面量） */
function xyz(v: { x: number; y: number; z: number }): { x: number; y: number; z: number }
{
    return { x: v.x, y: v.y, z: v.z };
}

function assertClose(actual: number, expected: number, message?: string)
{
    ok(Math.abs(actual - expected) < 1e-12, `${message ?? ''} 期望 ${expected}，实际 ${actual}`);
}

function assertElementsClose(actual: ArrayLike<number>, expected: number[], message?: string)
{
    for (let i = 0; i < expected.length; i++)
    {
        assertClose(actual[i], expected[i], `${message ?? ''}[${i}]`);
    }
}

/**
 * `matrix3x3Ops` 纯函数层的**契约测试**（issue #134 阶段 A2c）。
 *
 * ## 为什么期望值一律硬编码
 *
 * class 的方法已经**委托给本文件要测的这些函数**，所以「拿 class 当正确性基准」是无效的：
 * 两边会一起错（方案 §10.1 P3，A1 实测踩过）。因此这里分两类用例：
 *
 * - **数值类**：期望值手算后硬编码（矩阵乘法、求逆、解方程、轴缩放、四元数转矩阵……）；
 * - **接线类**：单独一条，只对比 class 与纯函数的返回值，用来发现委托时的参数顺序 / `out` 传错。
 */
describe('matrix3x3Ops 纯函数层（#134 阶段 A2c）', () =>
{
    it('运算不修改入参，结果只写 out', () =>
    {
        const a = m3(copy9(A9));
        const b = m3(copy9(B9));
        const out = mat3Identity();
        const v = { x: 2, y: 3, z: 7 };
        const vout = { x: 1, y: 1, z: 1 };

        mat3Multiply(a, b, out);
        mat3Transpose(a, out);
        mat3Reverse(b, out);
        mat3ScaleNumber(a, 2, out);
        mat3Scale(a, v, out);
        mat3SetTrace(v, out);
        mat3SetZero(out);
        mat3Identity(out);
        mat3FromArray(Array.from(A9), 0, out);
        mat3SetRotationFromQuaternion({ x: 0, y: 0, z: 0, w: 1 }, out);

        // 结果是向量的几个：入参向量也不能被改
        mat3Vmult(a, v, vout);
        mat3GetTrace(a, vout);
        mat3GetScale(a, vout);
        mat3Solve(m3(copy9(B9)), v, vout);

        deepEqual(el(a), copy9(A9), '入参矩阵 a 被修改了');
        deepEqual(el(b), copy9(B9), '入参矩阵 b 被修改了');
        deepEqual(v, { x: 2, y: 3, z: 7 }, '入参向量 v 被修改了');
    });

    it('★ 缺省 out 每次新建（不能共享同一个 elements 数组）', () =>
    {
        // 若像 quaternionOps 那样用 `{ ...DEFAULT_OUT }` 展开一个模块级常量，
        // 两次缺省调用会拿到同一个 elements 数组，下面的写入会互相污染。
        const first = mat3Identity();
        const second = mat3Identity();

        ok(first.elements !== second.elements, '两次缺省调用共享了同一个 elements 数组');

        first.elements[0] = 99;
        equal(second.elements[0], 1, '两次缺省调用共享了同一个 elements 数组');

        // 缺省初值 = new Matrix3x3() 的初值（方案 §10.1 P6）
        deepEqual(el(mat3Identity()), el(mat3Identity()));
    });

    it('★ 可能不写全部元素的函数：mat3SetTrace 的缺省 out 取单位矩阵初值', () =>
    {
        // 只写对角三个元素，非对角必须保持 `new Matrix3x3()` 的初值 0
        deepEqual(el(mat3SetTrace({ x: 10, y: 20, z: 30 })), [10, 0, 0, 0, 20, 0, 0, 0, 30]);
    });

    it('★ 就地相乘（out 与 a / b 同一对象）不自污染', () =>
    {
        // 写成「边算边写」时，out === a 会得到错值（方案 §10.1 P2）
        const a = m3(copy9(A9));
        mat3Multiply(a, m3(copy9(B9)), a);
        deepEqual(el(a), A_MUL_B9);

        const b = m3(copy9(B9));
        mat3Multiply(m3(copy9(A9)), b, b);
        deepEqual(el(b), A_MUL_B9);

        // 同一对象同时是 a 与 b：A × A = ((30,36,42),(66,81,96),(102,126,150))
        const self = m3(copy9(A9));
        mat3Multiply(self, self, self);
        deepEqual(el(self), [30, 36, 42, 66, 81, 96, 102, 126, 150]);
    });

    it('矩阵乘法锁住参数顺序：A × B 与 B × A 不同', () =>
    {
        deepEqual(el(mat3Multiply(m3(copy9(A9)), m3(copy9(B9)))), A_MUL_B9);
        deepEqual(el(mat3Multiply(m3(copy9(B9)), m3(copy9(A9)))), B_MUL_A9);
    });

    it('★ 就地转置（out === a）不自污染，两次转置还原', () =>
    {
        const a = m3(copy9(A9));

        mat3Transpose(a, a);
        deepEqual(el(a), [1, 4, 7, 2, 5, 8, 3, 6, 9]);

        mat3Transpose(a, a);
        deepEqual(el(a), copy9(A9));
    });

    it('★ 就地求逆（out === a）不自污染，且 A × A⁻¹ = I', () =>
    {
        const b = m3(copy9(B9));

        mat3Reverse(b, b);
        assertElementsClose(b.elements, B_INV_X70.map((v) => v / 70), 'B⁻¹');

        // 手算的逆矩阵乘积必须是单位矩阵
        const identity = mat3Multiply(b, m3(copy9(B9)));

        assertElementsClose(identity.elements, [1, 0, 0, 0, 1, 0, 0, 0, 1], 'B⁻¹ × B');
    });

    it('求逆失败抛 Error（#134 后续清理批：原来是抛字符串）', () =>
    {
        // ((1,2,3),(4,5,6),(7,8,9)) 行列式为 0
        let error: unknown;

        try
        {
            mat3Reverse(m3(copy9(A9)));
        }
        catch (e)
        {
            error = e;
        }

        ok(error instanceof Error && error.message.includes('Could not reverse!'), `应抛 Error，实际：${String(error)}`);
    });

    it('解 Ax = b：手算 x = (-46/70, 67/70, 59/70)', () =>
    {
        // 5x + 2y + 4z = 2
        // 4x + 5y +  z = 3
        //  x + 8y      = 7
        const x = mat3Solve(m3(copy9(B9)), { x: 2, y: 3, z: 7 });

        assertElementsClose([x.x, x.y, x.z], [-46 / 70, 67 / 70, 59 / 70]);
    });

    it('解方程无解时抛 Error（原来是抛字符串），成功时不写坏入参', () =>
    {
        const b = { x: 2, y: 3, z: 7 };
        let error: unknown;

        try
        {
            mat3Solve(m3(copy9(A9)), b);
        }
        catch (e)
        {
            error = e;
        }

        ok(error instanceof Error && error.message.includes('Could not solve equation!'), `应抛 Error，实际：${String(error)}`);
        deepEqual(b, { x: 2, y: 3, z: 7 });
    });

    it('★ 奇异性判据覆盖 -Infinity（#134 后续清理批修的漏判）', () =>
    {
        // 旧判据是 `isNaN(x) || x === Infinity`——**漏了 -Infinity**。
        // 本用例的解是 (-Infinity, 2, 0.6667…)（x 既不是 NaN 也不是 +Infinity），
        // 旧实现会静默返回这个「解」；新判据 `!Number.isFinite` 抛 Error。
        // 用例由随机搜索（40 万个 3×3 整数矩阵）实测得到，不是构造出来的例子。
        const singular = m3([0, 1, 2, 0, 1, 0, 0, 2, -3]);
        const out = { x: 0, y: 0, z: 0 };

        expect(() => mat3Solve(singular, { x: 0, y: 2, z: 2 }, out)).toThrow(Error);
        ok(out.x === -Infinity, `该矩阵的解 x 应是 -Infinity（旧判据正是漏在这里），实际：${out.x}`);
    });

    it('矩阵乘向量：手算 (29, 65, 101)', () =>
    {
        // (1,2,3)·(2,3,7) = 2+6+21 = 29；(4,5,6)·(2,3,7) = 8+15+42 = 65；(7,8,9)·(2,3,7) = 14+24+63 = 101
        deepEqual(xyz(mat3Vmult(m3(copy9(A9)), { x: 2, y: 3, z: 7 })), { x: 29, y: 65, z: 101 });
    });

    it('标量乘与逐列缩放的手算结果', () =>
    {
        deepEqual(el(mat3ScaleNumber(m3(copy9(A9)), 2)), [2, 4, 6, 8, 10, 12, 14, 16, 18]);

        // 每列分别乘 (1,2,3)：全 1 矩阵得到每行 (1,2,3)
        const ones = m3([1, 1, 1, 1, 1, 1, 1, 1, 1]);
        deepEqual(el(mat3Scale(ones, { x: 1, y: 2, z: 3 })), [1, 2, 3, 1, 2, 3, 1, 2, 3]);
    });

    it('对角元素读写与 getScale 的手算结果', () =>
    {
        // getElement(0,0)/getElement(1,1)/getElement(2,2) = elements[0]/[4]/[8]
        deepEqual(xyz(mat3GetTrace(m3(copy9(A9)))), { x: 1, y: 5, z: 9 });

        // 只改对角：((10,2,3),(4,20,6),(7,8,30))
        deepEqual(el(mat3SetTrace({ x: 10, y: 20, z: 30 }, m3(copy9(A9)))), [10, 2, 3, 4, 20, 6, 7, 8, 30]);

        // 第 0/1/2 列分别是 (1,4,7)、(2,5,8)、(3,6,9) ⇒ (√66, √93, √126)
        const scale = mat3GetScale(m3(copy9(A9)));

        assertClose(scale.x, Math.sqrt(66), 'x');
        assertClose(scale.y, Math.sqrt(93), 'y');
        assertClose(scale.z, Math.sqrt(126), 'z');
    });

    it('从四元数构造旋转矩阵：单位四元数 → 单位矩阵，绕 z 轴 90° → ((0,-1,0),(1,0,0),(0,0,1))', () =>
    {
        deepEqual(el(mat3SetRotationFromQuaternion({ x: 0, y: 0, z: 0, w: 1 })), copy9(IDENTITY9));

        const half = Math.SQRT1_2; // cos45° = sin45°
        const rotated = mat3SetRotationFromQuaternion({ x: 0, y: 0, z: half, w: half });

        assertElementsClose(rotated.elements, [0, -1, 0, 1, 0, 0, 0, 0, 1], '绕 z 轴 90°');

        // 交叉验证：该矩阵把 (1,0,0) 送到 (0,1,0)
        // （用容差比较：zz = (√2/2)·(√2) = 1.0000000000000002，浮点误差会传到 vmult）
        const mapped = mat3Vmult(rotated, { x: 1, y: 0, z: 0 });

        assertClose(mapped.x, 0, 'x');
        assertClose(mapped.y, 1, 'y');
        assertClose(mapped.z, 0, 'z');
    });

    it('getElement / setElement 的行列映射', () =>
    {
        // getElement(row, column) = elements[column + 3 * row]
        equal(mat3GetElement(m3(copy9(A9)), 1, 2), 6);
        equal(mat3GetElement(m3(copy9(A9)), 2, 0), 7);

        const out = m3(copy9(IDENTITY9));

        mat3SetElement(out, 2, 1, 42);
        // (row=2, column=1) → elements[1 + 3 * 2] = elements[7]
        deepEqual(el(out), [1, 0, 0, 0, 1, 0, 0, 42, 1]);
        equal(mat3GetElement(out, 2, 1), 42);
    });

    it('set 直接持有传入数组，copy 按值复制且复用 out 的数组', () =>
    {
        const source = copy9(A9);
        const out = m3(copy9(IDENTITY9));

        mat3Set(source, out);
        ok(out.elements === source, 'set 应直接持有传入数组（与 class 一致）');

        // copy：按值写入，target.elements 引用不变、随后改源不影响目标
        const target = mat3Identity();
        const targetElements = target.elements;

        mat3Copy(m3(copy9(A9)), target);
        ok(target.elements === targetElements, 'copy 应复用目标已有的 elements 数组');
        deepEqual(el(target), copy9(A9));

        source[0] = 99;
        equal(mat3GetElement(target, 0, 0), 1);
    });

    it('toArray / fromArray 往返与边界', () =>
    {
        deepEqual(mat3ToArray(m3(copy9(A9))), copy9(A9));
        deepEqual(mat3ToArray(m3(copy9(A9)), [0, 0], 2), [0, 0].concat(copy9(A9)));
        deepEqual(el(mat3FromArray([0, 0].concat(copy9(A9)), 2)), copy9(A9));

        assert.throws(() => mat3FromArray([1, 2, 3]), /数组长度不足/);
    });

    it('equals 按精度比较，toString 与 class 原格式一致', () =>
    {
        const a = m3(copy9(A9));
        const b = m3(copy9(A9));

        ok(mat3Equals(a, b));

        const nudged = m3(copy9(A9));

        nudged.elements[4] += 1e-9;
        ok(mat3Equals(a, nudged), '默认精度内应相等');
        ok(!mat3Equals(a, nudged, 1e-12), '1e-12 精度下应不等');

        equal(mat3ToString(m3(copy9(IDENTITY9))), '1,0,0,0,1,0,0,0,1,');
    });

    it('纯函数的自洽性：新建（缺省 out）与就地（out 传自己）结果一致（原「class 委托接线」用例的接替）', () =>
    {
        // 阶段 C-e：`Matrix3x3` / `Quaternion` 的 class 已删除，「class 结果 == 纯函数结果」失去
        // 被测对象。这里保留它真正有价值的断言：**同一运算的两条路径（新建 / 就地）逐位相同**。
        const A = m3(copy9(A9));
        const B = m3(copy9(B9));

        // 就地转置 vs 新建转置
        const transposeInPlace = m3(copy9(A9));

        mat3Transpose(transposeInPlace, transposeInPlace);
        deepEqual(el(transposeInPlace), el(mat3Transpose(A)));

        // 就地乘 vs 新建乘
        const mulInPlace = m3(copy9(A9));

        mat3Multiply(mulInPlace, B, mulInPlace);
        deepEqual(el(mulInPlace), el(mat3Multiply(A, B)));

        // 就地求逆 vs 新建求逆
        const reverseInPlace = m3(copy9(B9));

        mat3Reverse(reverseInPlace, reverseInPlace);
        deepEqual(el(reverseInPlace), el(mat3Reverse(B)));

        // 就地标量缩放 vs 纯函数结果
        const smulted = m3(copy9(A9));

        mat3ScaleNumber(smulted, 2.5, smulted);
        deepEqual(el(smulted), el(mat3ScaleNumber(A, 2.5)));

        // 就地 setTrace vs 纯函数结果
        const traced = m3(copy9(A9));

        mat3SetTrace({ x: 10, y: 20, z: 30 }, traced);
        deepEqual(el(traced), el(mat3SetTrace({ x: 10, y: 20, z: 30 }, A)));

        // 就地 setRotationFromQuaternion vs 纯函数结果（零旋转）
        const rotatedInPlace = m3(copy9(A9));

        mat3SetRotationFromQuaternion(quatSet(), rotatedInPlace);
        deepEqual(el(rotatedInPlace), el(mat3SetRotationFromQuaternion(quatSet(), A)));
    });
});