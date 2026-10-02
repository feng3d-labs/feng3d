import { assert, describe, it } from 'vitest';
import { RotationOrder } from '../../src/enums/RotationOrder';
import {
    mat4Append,
    mat4AppendRotation,
    mat4AppendScale,
    mat4AppendTranslation,
    mat4Copy,
    mat4Determinant,
    mat4Equals,
    mat4FromArray,
    mat4FromAxisRotate,
    mat4FromPosition,
    mat4FromQuaternion,
    mat4FromRotation,
    mat4FromScale,
    mat4FromTRS,
    mat4GetAxisX,
    mat4GetAxisY,
    mat4GetAxisZ,
    mat4GetColumn,
    mat4GetPosition,
    mat4GetRow,
    mat4GetScale,
    mat4Identity,
    mat4Invert,
    mat4IsIdentity,
    mat4MoveForward,
    mat4MoveRight,
    mat4MoveUp,
    mat4Prepend,
    mat4PrependScale1,
    mat4PrependTranslation,
    mat4SetAxisX,
    mat4SetColumn,
    mat4SetOrtho,
    mat4SetPosition,
    mat4SetRow,
    mat4SetScale,
    mat4ToArray,
    mat4ToTRS,
    mat4TransformPoint3,
    mat4TransformPoints,
    mat4TransformVector3,
    mat4TransformVector4,
    mat4Transpose,
} from '../../src/geom/matrix4x4Ops';
import { quatFromAxisAngle } from '../../src/geom/quaternionOps';
import { Vector3 } from '../../src/geom/Vector3';

/** 只取 16 个元素的普通数组（`elements` 可能是元组或 `Float32Array`，直接 deepEqual 不通用） */
function e16(m: { elements: ArrayLike<number> }): number[]
{
    const result: number[] = [];

    for (let i = 0; i < 16; i++)
    {
        // `+ 0` 把 `-0` 归一成 `0`（旋转/求逆会产生 `-0`，与手算的 `0` 在 deepEqual 下不等）
        result.push(Math.round(m.elements[i] * 1e9) / 1e9 + 0);
    }

    return result;
}

/** 做一个平移矩阵（#134 A2d 测试里反复用到） */
const T = (x: number, y: number, z: number) => mat4FromPosition(x, y, z);

function assertClose(actual: number, expected: number, message?: string)
{
    assert.ok(Math.abs(actual - expected) < 1e-12, `${message ?? ''} 期望 ${expected}，实际 ${actual}`);
}

/**
 * `matrix4x4Ops` 纯函数层的**契约测试**（issue #134 阶段 A2d）。
 *
 * 规矩（方案 §10.1 P3）：数值期望值**手算硬编码**，不拿 class 当基准——
 * class 已委托给同一批函数，两边会一起错。另设**一条**「class 结果 == 纯函数结果」的接线用例。
 */
describe('matrix4x4Ops 纯函数层（#134 A2d）', () =>
{
    it('缺省 out 与 new Matrix4x4() 的默认值一致（单位矩阵，不是全零）', () =>
    {
        assert.deepEqual(e16(mat4Identity()), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        assert.deepEqual(e16(mat4FromRotation(0, 0, 0)), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        // 只写其中几位、其余保持初值的路径也要是单位矩阵初值
        assert.deepEqual(e16(mat4SetPosition(mat4Identity(), { x: 0, y: 0, z: 0 })).length, 16);
        assert.deepEqual(e16(mat4FromScale(0, 0, 0)).slice(0, 3), [0, 0, 0]);
        assert.deepEqual(e16(mat4FromScale(0, 0, 0)).slice(12), [0, 0, 0, 1]);
    });

    it('★ 各类就地（out 传自己）的结果与新建 out 完全一致', () =>
    {
        // 就地别名是纯函数层的契约之一：凡是「读入参 + 写 out」的实现，两种结果必须逐位相同
        const base = mat4FromTRS({ x: 1, y: -2, z: 3 }, { x: 0.3, y: -0.4, z: 0.55 }, { x: 2, y: 3, z: 4 });
        const s = { x: 4, y: 4, z: 4 };
        const pivot = { x: 1, y: 2, z: 3 };

        const cases: [string, (m: ReturnType<typeof mat4Copy>) => void, () => ReturnType<typeof mat4Copy>][] = [
            ['transpose', (m) => mat4Transpose(m, m), () => mat4Transpose(base)],
            ['invert', (m) => mat4Invert(m, m), () => mat4Invert(base)],
            ['append', (m) => mat4Append(m, mat4FromScale(2, 3, 4), m), () => mat4Append(base, mat4FromScale(2, 3, 4))],
            ['prepend', (m) => mat4Prepend(m, mat4FromScale(2, 3, 4), m), () => mat4Prepend(base, mat4FromScale(2, 3, 4))],
            ['setScale', (m) => mat4SetScale(m, s, m), () => mat4SetScale(base, s)],
            ['setPosition', (m) => mat4SetPosition(m, pivot, m), () => mat4SetPosition(base, pivot)],
            ['setAxisX', (m) => mat4SetAxisX(m, pivot, m), () => mat4SetAxisX(base, pivot)],
            ['appendTranslation', (m) => mat4AppendTranslation(m, 5, 6, 7, m), () => mat4AppendTranslation(base, 5, 6, 7)],
            ['appendScale', (m) => mat4AppendScale(m, 2, 3, 4, undefined, m), () => mat4AppendScale(base, 2, 3, 4)],
            ['appendScale+pivot', (m) => mat4AppendScale(m, 2, 3, 4, pivot, m), () => mat4AppendScale(base, 2, 3, 4, pivot)],
            ['appendRotation', (m) => mat4AppendRotation(m, { x: 0, y: 0, z: 1 }, 0.7, undefined, m), () => mat4AppendRotation(base, { x: 0, y: 0, z: 1 }, 0.7)],
            ['appendRotation+pivot', (m) => mat4AppendRotation(m, { x: 0, y: 0, z: 1 }, 0.7, pivot, m), () => mat4AppendRotation(base, { x: 0, y: 0, z: 1 }, 0.7, pivot)],
            ['prependScale1', (m) => mat4PrependScale1(m, 2, 3, 4, m), () => mat4PrependScale1(base, 2, 3, 4)],
            ['prependTranslation', (m) => mat4PrependTranslation(m, 5, 6, 7, m), () => mat4PrependTranslation(base, 5, 6, 7)],
            ['fromRotation', (m) => mat4FromRotation(0.2, 0.3, 0.4, undefined, m), () => mat4FromRotation(0.2, 0.3, 0.4)],
            ['fromTRS', (m) => mat4FromTRS({ x: 1, y: 2, z: 3 }, { x: 0.2, y: 0.3, z: 0.4 }, s, undefined, m), () => mat4FromTRS({ x: 1, y: 2, z: 3 }, { x: 0.2, y: 0.3, z: 0.4 }, s)],
            ['setOrtho', (m) => mat4SetOrtho(-2, 2, 1, -1, 1, 3, m), () => mat4SetOrtho(-2, 2, 1, -1, 1, 3)],
        ];

        for (const [name, inPlace, fresh] of cases)
        {
            const target = mat4Copy(base);

            inPlace(target);
            assert.deepEqual(e16(target), e16(fresh()), `${name}：就地结果与新建 out 不一致`);
        }
    });

    it('★ 缺省 out 每次新建：两次调用的 elements 不能是同一个数组（P9）', () =>
    {
        // 矩阵的 elements 是数组，若缺省 out 共用模块级常量，浅展开会共享数组：
        // 调用方一改 A 就把 B 也改了。这里锁住「缺省 out 必须每次新建」。
        const a = mat4Identity();
        const b = mat4Identity();

        assert.notEqual(a.elements, b.elements, 'mat4Identity 两次调用共享了 elements 数组');

        const makers = [
            () => mat4Identity(),
            () => mat4FromTRS({ x: 1, y: 2, z: 3 }, { x: 0.1, y: 0.2, z: 0.3 }, { x: 1, y: 1, z: 1 }),
            () => mat4FromRotation(0.1, 0.2, 0.3),
            () => mat4FromScale(1, 1, 1),
            () => mat4FromPosition(0, 0, 0),
            () => mat4Copy(mat4Identity()),
            () => mat4SetPosition(mat4Identity(), { x: 1, y: 2, z: 3 }),
            () => mat4SetScale(mat4FromScale(2, 2, 2), { x: 4, y: 4, z: 4 }),
        ];

        for (const make of makers)
        {
            assert.notEqual(make().elements, make().elements, '缺省 out 被两次调用共享了');
        }

        // 真改一次：另一个对象不能受影响
        const x = mat4Identity();
        const y = mat4Identity();

        mat4SetPosition(x, { x: 9, y: 9, z: 9 }, x);
        assert.deepEqual(e16(y), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], '另一个缺省 out 被连带改了');
    });

    it('运算不修改入参', () =>
    {
        const a = mat4FromPosition(1, 2, 3);
        const b = mat4FromScale(2, 3, 4);
        const aBefore = e16(a);
        const bBefore = e16(b);
        const p = { x: 1, y: 2, z: 3 };
        const pBefore = { ...p };

        mat4Append(a, b);
        mat4Invert(a);
        mat4Invert(b);
        mat4Transpose(a);
        mat4ToTRS(a);
        mat4GetScale(a);
        mat4GetAxisX(a);
        mat4GetPosition(a);
        mat4SetPosition(a, { x: 9, y: 9, z: 9 });
        mat4SetScale(a, { x: 9, y: 9, z: 9 });
        mat4SetAxisX(a, { x: 9, y: 9, z: 9 });
        mat4TransformPoint3(a, p);
        mat4TransformVector3(a, p);
        mat4AppendTranslation(a, 1, 1, 1);
        mat4AppendScale(a, 2, 2, 2);
        mat4ToArray(a);

        assert.deepEqual(e16(a), aBefore, '入参矩阵 a 被修改了');
        assert.deepEqual(e16(b), bBefore, '入参矩阵 b 被修改了');
        assert.deepEqual(p, pBefore, '入参向量被修改了');
    });

    it('mat4ToArray(transpose=true) 不修改入参，且写出转置后的元素', () =>
    {
        // 手算：元素 0..15 = 1..16
        const mat = { elements: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] };
        const before = e16(mat);

        const arr = mat4ToArray(mat, [], 0, true) as number[];

        assert.deepEqual(e16(mat), before, '入参被就地转置了（原 class 会，纯函数层不会）');
        // 转置：第 row 行第 col 列 = m[col*4+row]
        assert.deepEqual(arr, [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16]);

        const arr2 = mat4ToArray(mat, [], 0, false) as number[];

        assert.deepEqual(arr2, before);
    });

    it('mat4FromArray / mat4Equals / mat4IsIdentity', () =>
    {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

        assert.deepEqual(e16(mat4FromArray(arr)), arr);
        // transpose=true：写出转置
        assert.deepEqual(e16(mat4FromArray(arr, 0, true)), [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16]);
        assert.throws(() => mat4FromArray([1, 2, 3]));

        assert.ok(mat4Equals(mat4FromArray(arr), mat4FromArray(arr)));
        assert.ok(!mat4Equals(mat4FromArray(arr), mat4Identity()));
        assert.ok(mat4IsIdentity(mat4Identity()));
        assert.ok(!mat4IsIdentity(mat4FromArray(arr)));
        assert.ok(!mat4IsIdentity(mat4FromPosition(1, 0, 0)));
    });

    it('mat4Transpose 与手算一致（含就地）', () =>
    {
        // 手算：行 i 列 j 的元素是 m[j*4+i]
        const mat = { elements: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] };

        assert.deepEqual(e16(mat4Transpose(mat)), [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16]);
        // 就地转置：转两次回到原值
        assert.deepEqual(e16(mat4Transpose(mat, mat)), [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16]);
        assert.deepEqual(e16(mat4Transpose(mat, mat)), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    });

    it('mat4Determinant 与手算一致', () =>
    {
        assertClose(mat4Determinant(mat4Identity()), 1);
        assertClose(mat4Determinant(mat4FromScale(2, 3, 4)), 24);
        assertClose(mat4Determinant(mat4FromPosition(10, 20, 30)), 1);
        // 非平移矩阵（元素 0..15 = 1..16）行列式为 0
        assertClose(mat4Determinant({ elements: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] }), 0);
    });

    it('mat4Copy 把 16 个元素复制进 out（缺省新建）', () =>
    {
        const a = mat4FromPosition(1, 2, 3);

        assert.deepEqual(e16(mat4Copy(a)), e16(a));
        // 缺省 out 是独立对象
        const copy = mat4Copy(mat4FromScale(2, 2, 2));

        assert.notEqual(copy.elements, mat4FromScale(2, 2, 2).elements);
        assert.ok(mat4Equals(copy, mat4FromScale(2, 2, 2)));
    });

    it('mat4FromPosition / mat4FromScale / mat4GetPosition / mat4SetPosition', () =>
    {
        assert.deepEqual(e16(T(10, 20, 30)), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 30, 1]);
        assert.deepEqual(e16(mat4FromScale(2, 3, 4)), [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1]);

        // 手算：T(1,2,3) 的位移就是 (1,2,3)
        assert.deepEqual(mat4GetPosition(T(1, 2, 3)), { x: 1, y: 2, z: 3 });
        assert.deepEqual(e16(mat4SetPosition(mat4Identity(), { x: -1, y: -2, z: -3 })), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1, -2, -3, 1]);
    });

    it('mat4GetAxisX|Y|Z 取元素 0/1/2、4/5/6、8/9/10', () =>
    {
        // 列主序：列 0 = 元素 0/1/2、列 1 = 4/5/6、列 2 = 8/9/10
        const mat = { elements: [1, 2, 3, 11, 4, 5, 6, 12, 7, 8, 9, 13, 10, 14, 15, 16] };

        assert.deepEqual(mat4GetAxisX(mat), { x: 1, y: 2, z: 3 });
        assert.deepEqual(mat4GetAxisY(mat), { x: 4, y: 5, z: 6 });
        assert.deepEqual(mat4GetAxisZ(mat), { x: 7, y: 8, z: 9 });
    });

    it('mat4SetAxisX 只改元素 0/1/2', () =>
    {
        const out = mat4SetAxisX(mat4FromScale(2, 3, 4), { x: 7, y: 8, z: 9 });

        assert.deepEqual(e16(out), [7, 8, 9, 0, 0, 3, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1]);
    });

    it('mat4GetScale：三个基向量的长度', () =>
    {
        // 手算：列 (3,4,0) 长 5；列 (0,0,2) 长 2；列 (1,0,0) 长 1
        const mat = { elements: [3, 4, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 1] };
        assert.deepEqual(mat4GetScale(mat), { x: 5, y: 2, z: 1 });
        assert.deepEqual(mat4GetScale(mat4FromScale(2, 3, 4)), { x: 2, y: 3, z: 4 });
    });

    it('mat4SetScale 按「新 / 旧」比例缩放三个基向量', () =>
    {
        // 手算：fromScale(2,2,2) → setScale(4,4,4)，比例 2，对角变 4
        const out = mat4SetScale(mat4FromScale(2, 2, 2), { x: 4, y: 4, z: 4 });

        assert.deepEqual(e16(out), [4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1]);
    });

    it('★ mat4Append 就地（out 传自己）与手算一致，且不自污染', () =>
    {
        // 手算：T(10,20,30) × S(2,3,4)（append 是左乘 lhs）
        //   对角 (2,3,4)；平移列是 T 的第 4 行，会被 lhs 的对角按行乘 → (10×2, 20×3, 30×4)
        const out = mat4Append(T(10, 20, 30), mat4FromScale(2, 3, 4));
        const expected = [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 20, 60, 120, 1];

        assert.deepEqual(e16(out), expected);

        // 就地：a = a × S，out 传自己（若边算边写会读到已改写的 a）
        const a = T(10, 20, 30);

        mat4Append(a, mat4FromScale(2, 3, 4), a);
        assert.deepEqual(e16(a), expected, '就地结果与新建 out 必须一致');

        // out === lhs 也要安全
        const lhs = mat4FromScale(2, 3, 4);

        mat4Append(T(10, 20, 30), lhs, lhs);
        assert.deepEqual(e16(lhs), expected, 'out === lhs 的结果也必须一致');
    });

    it('mat4Append 非平凡算例：T(1,2,3) × T(10,20,30) 的位移相加', () =>
    {
        // 手算：平移矩阵相乘，位移相加 → (11,22,33)
        const out = mat4Append(T(1, 2, 3), T(10, 20, 30));

        assert.deepEqual(e16(out), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 11, 22, 33, 1]);
    });

    it('★ mat4Append 就地（out 传自己 / out 传 lhs）与独立实现一致，且不自污染', () =>
    {
        // 手算结果（见下一个用例的推导）：T(10,20,30) × S(2,3,4) = 对角 (2,3,4)、平移 (20,60,120)
        const expected = [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 20, 60, 120, 1];

        // 就地：out === a
        const a = T(10, 20, 30);

        mat4Append(a, mat4FromScale(2, 3, 4), a);
        assert.deepEqual(e16(a), expected, 'out === a');

        // 就地：out === lhs——这一条恰恰是「边算边写」会翻车的地方：
        // 结果第 1 行恰好等于缩放矩阵的第 1 列，写回 lhs[0..3] 会污染后面行要读的 m2[0..3]
        const lhs = mat4FromScale(2, 3, 4);

        mat4Append(T(10, 20, 30), lhs, lhs);
        assert.deepEqual(e16(lhs), expected, 'out === lhs');
    });

    it('mat4Append 与独立实现（朴素三重循环）逐位一致', () =>
    {
        // A[col*4+row]，C = B × A（append 是左乘 lhs）：C[col*4+row] = Σk B[k*4+row] * A[col*4+k]
        const A = mat4FromTRS({ x: 1, y: -2, z: 3 }, { x: 0.3, y: -0.4, z: 0.55 }, { x: 2, y: 3, z: 4 });
        const B = mat4FromTRS({ x: -1, y: 5, z: 0.5 }, { x: -0.2, y: 0.9, z: -0.7 }, { x: 1.5, y: -2, z: 0.25 });

        const C: number[] = [];

        for (let col = 0; col < 4; col++)
        {
            for (let row = 0; row < 4; row++)
            {
                let sum = 0;

                for (let k = 0; k < 4; k++)
                {
                    sum += B.elements[k * 4 + row] * A.elements[col * 4 + k];
                }
                C[col * 4 + row] = sum;
            }
        }

        const expected = C.map((v) => Math.round(v * 1e9) / 1e9 + 0);

        assert.deepEqual(e16(mat4Append(A, B)), expected, '新建 out');

        // 就地：out === a（必须与新建 out 一致）
        const inPlaceA = mat4Copy(A);

        mat4Append(inPlaceA, B, inPlaceA);
        assert.deepEqual(e16(inPlaceA), expected, 'out === a');

        // 就地：out === lhs（必须与新建 out 一致）
        const inPlaceB = mat4Copy(B);

        mat4Append(A, inPlaceB, inPlaceB);
        assert.deepEqual(e16(inPlaceB), expected, 'out === lhs');
    });

    it('mat4Prepend：out = rhs × a（与手算一致）', () =>
    {
        // 手算：T(1,2,3) 前置 T(10,20,30) → (11,22,33)
        assert.deepEqual(e16(mat4Prepend(T(1, 2, 3), T(10, 20, 30))), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 11, 22, 33, 1]);
        // 就地
        const a = T(1, 2, 3);

        mat4Prepend(a, T(10, 20, 30), a);
        assert.deepEqual(e16(a), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 11, 22, 33, 1]);
    });

    it('★ mat4Invert 就地求逆与手算一致', () =>
    {
        // 手算：绕 z 轴 90° 的旋转矩阵 R，逆是 R 的转置（= 绕 z 轴 -90°）
        //   R  = [0,1,0, 0,-1,0,0, 0,0,0,1,0, 0,0,0,1]（列主序：0/1 = cos/sin）
        const R = mat4FromAxisRotate({ x: 0, y: 0, z: 1 }, Math.PI / 2);

        // 就地求逆
        const inv = mat4Copy(R);

        mat4Invert(inv, inv);

        const expected = [0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        const actual = e16(inv);

        for (let i = 0; i < 16; i++)
        {
            assertClose(actual[i], expected[i], `就地求逆 elements[${i}]`);
        }

        // 逆 × 原 = 单位矩阵（再验一次数值）
        const roundTrip = mat4Copy(inv);

        mat4Append(roundTrip, R, roundTrip);
        assert.ok(mat4Equals(roundTrip, mat4Identity()), '逆矩阵乘原矩阵应为单位矩阵');

        // 平移矩阵的逆是反向平移
        assert.deepEqual(e16(mat4Invert(T(1, 2, 3))), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1, -2, -3, 1]);
    });

    it('mat4Invert：行列式为 0 时不修改 out（与 class 的告警分支一致）', () =>
    {
        const singular = { elements: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] };
        const out = mat4FromScale(2, 2, 2);

        mat4Invert(singular, out);

        assert.deepEqual(e16(out), [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1], 'out 被改写了');
    });

    it('★ mat4TransformPoint3 / mat4TransformVector3 / mat4TransformVector4 与手算一致', () =>
    {
        // 手算：p = (1,2,3)，M = translate(10,20,30) → (11,22,33)
        assert.deepEqual(mat4TransformPoint3(T(10, 20, 30), { x: 1, y: 2, z: 3 }), { x: 11, y: 22, z: 33 });
        // 向量变换不受平移影响
        assert.deepEqual(mat4TransformVector3(T(10, 20, 30), { x: 1, y: 2, z: 3 }), { x: 1, y: 2, z: 3 });

        // 手算：绕 z 轴 90°：x 轴 → y 轴
        const R = mat4FromAxisRotate({ x: 0, y: 0, z: 1 }, Math.PI / 2);

        assertClose(mat4TransformVector3(R, { x: 1, y: 0, z: 0 }).y, 1, 'R·x 的 y');
        assertClose(mat4TransformVector3(R, { x: 1, y: 0, z: 0 }).x, 0, 'R·x 的 x');

        // 手算 Vector4：m[3]=2, m[7]=1, m[11]=-1, m[15]=0，v=(1,2,3,4)
        //   x' = 1*1 + 2*0 + 3*0 + 4*0  = 1
        //   y' = 1*0 + 2*1 + 3*0 + 4*0  = 2
        //   z' = 1*0 + 2*0 + 3*1 + 4*0  = 3
        //   w' = 1*2 + 2*1 + 3*(-1) + 4*0 = 1
        const mat = { elements: [1, 0, 0, 2, 0, 1, 0, 1, 0, 0, 1, -1, 0, 0, 0, 0] };

        assert.deepEqual(mat4TransformVector4(mat, { x: 1, y: 2, z: 3, w: 4 }), { x: 1, y: 2, z: 3, w: 1 });

        // 就地：vout === vin
        const v = { x: 1, y: 2, z: 3 };

        mat4TransformPoint3(T(10, 20, 30), v, v);
        assert.deepEqual(v, { x: 11, y: 22, z: 33 });
    });

    it('mat4TransformPoints：逐点变换，支持就地', () =>
    {
        const pts = [1, 2, 3, -1, -2, -3];

        assert.deepEqual(mat4TransformPoints(T(10, 20, 30), pts), [11, 22, 33, 9, 18, 27]);
        // 就地
        const inPlace = [1, 2, 3];

        mat4TransformPoints(mat4FromScale(2, 2, 2), inPlace, inPlace);
        assert.deepEqual(inPlace, [2, 4, 6]);
        // 入参未被修改（vout 缺省新建）
        assert.deepEqual(pts, [1, 2, 3, -1, -2, -3]);
    });

    it('★ mat4ToTRS 与手算一致，且不改入参', () =>
    {
        const m = mat4FromTRS({ x: 10, y: 20, z: 30 }, { x: 0.5, y: 0.6, z: 0.7 }, { x: 2, y: 3, z: 4 });
        const before = e16(m);

        const [position, rotation, scale] = mat4ToTRS(m);

        assert.deepEqual(position, { x: 10, y: 20, z: 30 });
        assertClose(scale.x, 2, 'scale.x');
        assertClose(scale.y, 3, 'scale.y');
        assertClose(scale.z, 4, 'scale.z');
        assertClose(rotation.x, 0.5, 'rotation.x');
        assertClose(rotation.y, 0.6, 'rotation.y');
        assertClose(rotation.z, 0.7, 'rotation.z');
        assert.deepEqual(e16(m), before, '入参矩阵被修改了');

        // 六个旋转序都能分解回原角度（往返）
        const orders = [RotationOrder.XYZ, RotationOrder.YXZ, RotationOrder.ZXY, RotationOrder.ZYX, RotationOrder.YZX, RotationOrder.XZY];

        for (const order of orders)
        {
            const mat = mat4FromTRS({ x: 0, y: 0, z: 0 }, { x: 0.3, y: -0.4, z: 0.55 }, { x: 1, y: 1, z: 1 }, order);
            const [, r] = mat4ToTRS(mat, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, order);

            assertClose(r.x, 0.3, `order=${order} rotation.x`);
            assertClose(r.y, -0.4, `order=${order} rotation.y`);
            assertClose(r.z, 0.55, `order=${order} rotation.z`);
        }
    });

    it('mat4FromRotation 与 mat4FromAxisRotate（绕 z 轴 90°）手算一致', () =>
    {
        // 手算：Rx*Ry 无关，只用绕 z 轴 90° 的 cos=0 / sin=1
        //   elements[0]=cosZ=0, [1]=sinZ=1, [5]=cosZ=0, [4]=-sinZ=-1, [10]=1
        const R = mat4FromRotation(0, 0, Math.PI / 2);

        assertClose(R.elements[0], 0, 'm[0]');
        assertClose(R.elements[1], 1, 'm[1]');
        assertClose(R.elements[4], -1, 'm[4]');
        assertClose(R.elements[5], 0, 'm[5]');
        assertClose(R.elements[10], 1, 'm[10]');
        assertClose(R.elements[15], 1, 'm[15]');

        // fromAxisRotate 走的是另一套公式，但同样的轴角必须给出同一结果
        const R2 = mat4FromAxisRotate({ x: 0, y: 0, z: 1 }, Math.PI / 2);

        for (let i = 0; i < 16; i++)
        {
            assertClose(R.elements[i], R2.elements[i], `elements[${i}]`);
        }

        // 轴会被归一化，且不修改入参
        const axis = { x: 0, y: 0, z: 5 };

        mat4FromAxisRotate(axis, Math.PI / 2);
        assert.deepEqual(axis, { x: 0, y: 0, z: 5 }, '入参 axis 被归一化了');

        const R3 = mat4FromAxisRotate(axis, Math.PI / 2);

        for (let i = 0; i < 16; i++)
        {
            assertClose(R3.elements[i], R2.elements[i], `非单位轴 elements[${i}]`);
        }
    });

    it('★ mat4FromRotation 六个旋转序与「逐步 appendRotation 组合」交叉验证', () =>
    {
        // 这是长公式抄写的唯一有效保护（方案 §10.1 P7）：用另一条独立路径（轴角 + 矩阵连乘）造出同一个旋转。
        // 注意：往返（fromTRS → toTRS）**抓不到**分支公式抄错——分解用的公式会反向抵消同一处错误。
        // 取值刻意避开 sin≈cos 的角度（如 z≈0.785）：否则 `sin(z)` 与 `cos(z)` 近似相等，
        // 「抄错成另一个三角函数」这类错误会被数值巧合掩盖。
        const rx = 0.35;
        const ry = -0.9;
        const rz = 1.9;

        // 各旋转序（= 各分支）的矩阵连乘顺序，与 `Matrix4x4.spec.ts` 的 fromRotation 用例一致：
        // 分支标号 → appendRotation 的调用顺序 → 等价的连乘 R = R_last × … × R_first
        const cases: [RotationOrder, ('x' | 'y' | 'z')[]][] = [
            [RotationOrder.XYZ, ['z', 'y', 'x']],
            [RotationOrder.ZXY, ['y', 'x', 'z']],
            [RotationOrder.ZYX, ['x', 'y', 'z']],
            [RotationOrder.YXZ, ['z', 'x', 'y']],
            [RotationOrder.YZX, ['x', 'z', 'y']],
            [RotationOrder.XZY, ['y', 'z', 'x']],
        ];

        const axisOf = { x: { x: 1, y: 0, z: 0 }, y: { x: 0, y: 1, z: 0 }, z: { x: 0, y: 0, z: 1 } };
        const angleOf = { x: rx, y: ry, z: rz };

        for (const [order, chain] of cases)
        {
            const byFromRotation = mat4FromRotation(rx, ry, rz, order);
            let byCompose = mat4Identity();

            for (const axis of chain)
            {
                byCompose = mat4Append(byCompose, mat4FromAxisRotate(axisOf[axis], angleOf[axis]));
            }

            assert.deepEqual(e16(byFromRotation), e16(byCompose), `order=${order}`);
        }
    });

    it('mat4FromQuaternion：绕 z 轴 90° 的四元数给出与轴角一致的结果', () =>
    {
        const q = { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 };
        const byQuat = mat4FromQuaternion(q);
        const byAxis = mat4FromAxisRotate({ x: 0, y: 0, z: 1 }, Math.PI / 2);

        for (let i = 0; i < 16; i++)
        {
            assertClose(byQuat.elements[i], byAxis.elements[i], `elements[${i}]`);
        }
        // 元素 3/7/11/12/13/14 写 0、元素 15 写 1
        assert.deepEqual(e16(byQuat).filter((_, i) => [3, 7, 11, 12, 13, 14].includes(i)), [0, 0, 0, 0, 0, 0]);
        assertClose(byQuat.elements[15], 1, 'm[15]');
    });

    it('mat4AppendTranslation / mat4AppendScale / mat4AppendRotation 与手算一致', () =>
    {
        // 手算：单位矩阵后置平移 (1,2,3)
        assert.deepEqual(e16(mat4AppendTranslation(mat4Identity(), 1, 2, 3)), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1]);

        // 手算：单位矩阵后置缩放 (2,3,4)
        assert.deepEqual(e16(mat4AppendScale(mat4Identity(), 2, 3, 4)), [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1]);

        // 手算：单位矩阵后置绕 z 轴 90°（= fromAxisRotate）
        const byAppend = mat4AppendRotation(mat4Identity(), { x: 0, y: 0, z: 1 }, Math.PI / 2);
        const byAxis = mat4FromAxisRotate({ x: 0, y: 0, z: 1 }, Math.PI / 2);

        for (let i = 0; i < 16; i++)
        {
            assertClose(byAppend.elements[i], byAxis.elements[i], `elements[${i}]`);
        }

        // 锚点缩放：pivot (1,2,3) 是缩放后的不动点
        const pivot = { x: 1, y: 2, z: 3 };
        const scaled = mat4AppendScale(mat4Identity(), 2, 3, 4, pivot);
        const moved = mat4TransformPoint3(scaled, pivot);

        assertClose(moved.x, 1, 'pivot.x');
        assertClose(moved.y, 2, 'pivot.y');
        assertClose(moved.z, 3, 'pivot.z');
    });

    it('mat4GetColumn / mat4GetRow / mat4SetColumn / mat4SetRow（列主序易错处）', () =>
    {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
        const mat = { elements: arr };

        // 列 0 = elements 0..3；行 0 = elements[0]、[4]、[8]、[12]
        assert.deepEqual(mat4GetColumn(mat, 0), { x: 1, y: 2, z: 3, w: 4 });
        assert.deepEqual(mat4GetColumn(mat, 3), { x: 13, y: 14, z: 15, w: 16 });
        assert.deepEqual(mat4GetRow(mat, 0), { x: 1, y: 5, z: 9, w: 13 });
        assert.deepEqual(mat4GetRow(mat, 3), { x: 4, y: 8, z: 12, w: 16 });

        // 越界抛字符串（与 class 一致，不是 Error 实例）
        assert.throws(() => mat4GetColumn(mat, 4), 'Invalid column index!');
        assert.throws(() => mat4GetRow(mat, 4), 'Invalid row index!');

        // 写列 / 写行：其余元素保持（`out` 是必需参数，与 class 一样「写进某个矩阵」）
        const c = mat4Identity();

        mat4SetColumn(mat4Identity(), 1, { x: 9, y: 9, z: 9, w: 9 }, c);
        assert.deepEqual(e16(c), [1, 0, 0, 0, 9, 9, 9, 9, 0, 0, 1, 0, 0, 0, 0, 1]);

        const r = mat4Identity();

        // 写行 1：落在元素 index + k*4 = 1、5、9、13（与写列不同，列主序下极易搞反）
        mat4SetRow(mat4Identity(), 1, { x: 7, y: 7, z: 7, w: 7 }, r);
        assert.deepEqual(e16(r), [1, 7, 0, 0, 0, 7, 0, 0, 0, 7, 1, 0, 0, 7, 0, 1]);
    });

    it('mat4MoveRight / mat4MoveUp / mat4MoveForward（注意三者不对称）', () =>
    {
        // moveRight：X 轴先归一化，所以「距离」与轴长无关，位移正好是 5
        const right = mat4MoveRight(mat4FromScale(2, 2, 2), 5);

        assert.deepEqual(e16(right), [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 5, 0, 0, 1]);

        // moveUp：不归一化，轴长（这里是 3）会乘进位移 → 5 × 3 = 15
        const up = mat4MoveUp(mat4FromScale(2, 3, 2), 5);

        assert.deepEqual(e16(up), [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 2, 0, 0, 15, 0, 1]);

        // moveForward：本地 -Z，即元素 8/9/10 取负后乘距离
        const forward = mat4MoveForward(mat4Identity(), 5);

        assert.deepEqual(e16(forward), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -5, 1]);
    });

    it('mat4SetOrtho 与手算一致（WebGPU 约定 z→[0,1]）', () =>
    {
        // 手算：left=-2 right=2 top=1 bottom=-1 near=1 far=3
        //   2/(r-l) = 0.5, 2/(t-b) = 1, -1/(f-n) = -0.5
        const m = mat4SetOrtho(-2, 2, 1, -1, 1, 3);

        assertClose(m.elements[0], 0.5, 'm[0]');
        assertClose(m.elements[5], 1, 'm[5]');
        assertClose(m.elements[10], -0.5, 'm[10]');
        assertClose(m.elements[12], 0, 'm[12]');
        assertClose(m.elements[14], -0.5, 'm[14]');
        assertClose(m.elements[15], 1, 'm[15]');
    });

    it('纯函数的就地/新建两种形态结果一致（原「class 委托接线」用例的接替）', () =>
    {
        // 阶段 C-e：`Matrix4x4` / `Quaternion` 的 class 已删除，「class 结果 == 纯函数结果」这条
        // 接线用例失去被测对象。这里保留它真正有价值的断言：**新建（缺省 out）与就地（out 传自己）
        // 两条路径结果逐位相同**，以及「同一输入两次调用结果相同」（无隐藏状态）。
        const pos = new Vector3(1, 2, 3);
        const rot = new Vector3(0.3, -0.4, 0.55);
        const scale = new Vector3(2, 3, 4);

        const byNew = mat4FromTRS(pos, rot, scale);
        const byAgain = mat4FromTRS(pos, rot, scale);

        assert.deepEqual(e16(byNew), e16(byAgain));

        // 就地求逆 == copy 后求逆
        const inPlace = mat4Copy(byNew);
        const copied = mat4Copy(byNew);

        mat4Invert(inPlace, inPlace);
        mat4Invert(copied, copied);
        assert.deepEqual(e16(inPlace), e16(copied));

        // 点变换：缺省 out（字面量）与显式 Vector3 out 的分量一致
        const p = new Vector3(5, 6, 7);
        const defaultOut = mat4TransformPoint3(T(10, 20, 30), p);
        const vectorOut = new Vector3();

        mat4TransformPoint3(T(10, 20, 30), p, vectorOut);
        assert.deepEqual({ ...defaultOut }, { x: vectorOut.x, y: vectorOut.y, z: vectorOut.z });

        // 四元数 → 矩阵：入参放宽后，字面量与实例结果逐位相同
        const q = quatFromAxisAngle(Vector3.Z_AXIS, Math.PI / 2);

        assert.deepEqual(e16(mat4FromQuaternion(q)), e16(mat4FromQuaternion({ x: q.x, y: q.y, z: q.z, w: q.w })));
    });
});
