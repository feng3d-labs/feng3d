import type { Matrix3x3Elements } from '../../src/geom/matrix3x3Ops';
import {
    mat3Copy,
    mat3Equals,
    mat3FromArray,
    mat3FromMatrix4x4,
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
    mat3ToMatrix4x4,
    mat3ToArray,
    mat3ToString,
    mat3Transpose,
    mat3Vmult,
} from '../../src/geom/matrix3x3Ops';
import { mat4Identity } from '../../src/geom/matrix4x4Ops';
import { quatFromEuler, quatRotatePoint, quatSet } from '../../src/geom/quaternionOps';

import { vec3Equals, vec3ScaleNumber } from '../../src/geom/vector3Ops';

import { assert, describe, it } from 'vitest';
const { equal, deepEqual } = assert;

/**
 * issue #134 阶段 C-e：`Matrix3x3` / `Matrix4x4` / `Quaternion` 的 class 已删除，
 * 本文件由 class 行为用例改写为**同义纯函数用例**，断言逐条保留
 * （`new Matrix3x3(e)` → `mat3Set(e)`、`m.clone()` → `mat3Copy(m)`、
 * `m.equals(n)` → `mat3Equals(m, n)`、`m.vmult(v)` → `mat3Vmult(m, v)` …）。
 * 结果向量用**纯数据字面量**当 `out`，断言走 `vec3*` 纯函数——阶段 C-f 删掉 `Vector3` 的 class 后
 * `new Vector3()` 已不可用（真跑会 `TypeError: not a constructor`），本批据此更正了旧说明。
 */
describe('Matrix3x3', () =>
{
    it('identity', () =>
    {
        const m = mat3Identity();

        mat3Identity(m);

        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            {
                equal(mat3GetElement(m, r, c), (r === c) ? 1 : 0, `cellule ( row : ${r} column : ${c} )  should be ${c === r ? '1' : '0'}`);
            }
        }
    });

    it('vmult', () =>
    {
        const v = { x: 2, y: 3, z: 7 };
        const m = mat3Identity();

        /*
          set the matrix to
          | 1 2 3 |
          | 4 5 6 |
          | 7 8 9 |
        */
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            { mat3SetElement(m, r, c, 1 + r * 3 + c); }
        }
        const t = mat3Vmult(m, v, { x: 0, y: 0, z: 0 });

        assert.ok(t.x === 29 && t.y === 65 && t.z === 101, `Expected (29,65,101), got (${t.toString()}), while multiplying m=${mat3ToString(m)} with ${v.toString()}`);
    });

    it('mmult', () =>
    {
        const m1 = mat3Identity();
        const m2 = mat3Identity();

        /* set the matrix to
            | 1 2 3 |
            | 4 5 6 |
            | 7 8 9 |
        */
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            { mat3SetElement(m1, r, c, 1 + r * 3 + c); }
        }

        /* set the matrix to
         | 5 2 4 |
         | 4 5 1 |
         | 1 8 0 |
        */
        mat3SetElement(m2, 0, 0, 5);
        mat3SetElement(m2, 0, 1, 2);
        mat3SetElement(m2, 0, 2, 4);
        mat3SetElement(m2, 1, 0, 4);
        mat3SetElement(m2, 1, 1, 5);
        mat3SetElement(m2, 1, 2, 1);
        mat3SetElement(m2, 2, 0, 1);
        mat3SetElement(m2, 2, 1, 8);
        mat3SetElement(m2, 2, 2, 0);

        const m3 = mat3Multiply(m1, m2);

        assert.ok(mat3GetElement(m3, 0, 0) === 16
            && mat3GetElement(m3, 0, 1) === 36
            && mat3GetElement(m3, 0, 2) === 6
            && mat3GetElement(m3, 1, 0) === 46
            && mat3GetElement(m3, 1, 1) === 81
            && mat3GetElement(m3, 1, 2) === 21
            && mat3GetElement(m3, 2, 0) === 76
            && mat3GetElement(m3, 2, 1) === 126
            && mat3GetElement(m3, 2, 2) === 36, 'calculating multiplication with another matrix');
    });

    it('solve', () =>
    {
        const m = mat3Identity();
        const v = { x: 2, y: 3, z: 7 };

        /* set the matrix to
        | 5 2 4 |
        | 4 5 1 |
        | 1 8 0 |
        */
        mat3SetElement(m, 0, 0, 5);
        mat3SetElement(m, 0, 1, 2);
        mat3SetElement(m, 0, 2, 4);
        mat3SetElement(m, 1, 0, 4);
        mat3SetElement(m, 1, 1, 5);
        mat3SetElement(m, 1, 2, 1);
        mat3SetElement(m, 2, 0, 1);
        mat3SetElement(m, 2, 1, 8);
        mat3SetElement(m, 2, 2, 0);

        const t = mat3Solve(m, v, { x: 0, y: 0, z: 0 });

        const vv = mat3Vmult(m, t, { x: 0, y: 0, z: 0 });

        assert.ok(vec3Equals(vv, v, 0.00001), 'solving Ax = b');

        const m1 = mat3Identity();

        /* set the matrix to
         | 1 2 3 |
         | 4 5 6 |
         | 7 8 9 |
         */
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            {
                mat3SetElement(m1, r, c, 1 + r * 3 + c);
            }
        }

        let error = false;

        try
        {
            mat3Solve(m1, v);
        }
        catch
        {
            error = true;
        }

        assert.ok(error, 'should rise an error if the system has no solutions');
    });

    it('reverse', () =>
    {
        const m = mat3Identity();

        /* set the matrix to
        | 5 2 4 |
        | 4 5 1 |
        | 1 8 0 |
        */
        mat3SetElement(m, 0, 0, 5);
        mat3SetElement(m, 0, 1, 2);
        mat3SetElement(m, 0, 2, 4);
        mat3SetElement(m, 1, 0, 4);
        mat3SetElement(m, 1, 1, 5);
        mat3SetElement(m, 1, 2, 1);
        mat3SetElement(m, 2, 0, 1);
        mat3SetElement(m, 2, 1, 8);
        mat3SetElement(m, 2, 2, 0);

        const m2 = mat3Reverse(m);

        const m3 = mat3Multiply(m2, m);

        let success = true;
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            {
                success = success && (Math.abs(mat3GetElement(m3, r, c) - (c === r ? 1 : 0)) < 0.00001);
            }
        }

        assert.ok(success, 'inversing');

        const m1 = mat3Identity();

        /* set the matrix to
        | 1 2 3 |
        | 4 5 6 |
        | 7 8 9 |
        */
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            {
                mat3SetElement(m1, r, c, 1 + r * 3 + c);
            }
        }

        let error = false;

        try
        {
            mat3Reverse(m1);
        }
        catch
        {
            error = true;
        }

        assert.ok(error, 'should rise an error if the matrix is not inersible');
    });

    it('transpose', () =>
    {
        const M = mat3Set([1, 2, 3,
            4, 5, 6,
            7, 8, 9]);
        const Mt = mat3Transpose(M);
        deepEqual(Mt.elements, [1, 4, 7,
            2, 5, 8,
            3, 6, 9]);
    });

    it('scale', () =>
    {
        const M = mat3Set([1, 1, 1,
            1, 1, 1,
            1, 1, 1]);
        const Mt = mat3Scale(M, { x: 1, y: 2, z: 3 });
        deepEqual(Mt.elements, [1, 2, 3,
            1, 2, 3,
            1, 2, 3]);
    });

    it('setRotationFromQuaternion', () =>
    {
        const M = mat3Identity();
        let q = quatSet();
        const original = { x: 1, y: 2, z: 3 };

        // Test zero rotation
        mat3SetRotationFromQuaternion(q, M);
        const v = mat3Vmult(M, original, { x: 0, y: 0, z: 0 });
        assert.ok(vec3Equals(v, original));

        // Test rotation along x axis
        q = quatFromEuler(0.222, 0.123, 1.234);
        mat3SetRotationFromQuaternion(q, M);
        const Mv = mat3Vmult(M, original, { x: 0, y: 0, z: 0 });
        const qv = quatRotatePoint(q, original, { x: 0, y: 0, z: 0 });

        assert.ok(vec3Equals(Mv, qv));
    });

    // ---- 以下为向 Matrix4x4 对齐的 API（issue #127）----

    it('fromArray / toArray 往返', () =>
    {
        const source = mat3Set([
            1, 2, 3,
            4, 5, 6,
            7, 8, 9,
        ]);
        const array = mat3ToArray(source);

        assert.ok(mat3Equals(mat3FromArray(array), source));

        // 带偏移
        assert.ok(mat3Equals(mat3FromArray([0, 0].concat(array), 2), source));

        // 长度不足要报错，而不是静默填充半个矩阵
        assert.throws(() => mat3FromArray([1, 2, 3]), /数组长度不足/);
    });

    it('clone 是深拷贝', () =>
    {
        let q = quatSet();
        q = quatFromEuler(0.1, 0.2, 0.3);
        const M = mat3Identity();
        mat3SetRotationFromQuaternion(q, M);

        const copy = mat3Copy(M);

        assert.ok(mat3Equals(copy, M));
        assert.notStrictEqual(copy.elements, M.elements);

        copy.elements[0] += 1;
        assert.ok(!mat3Equals(copy, M));
    });

    it('equals 按精度比较', () =>
    {
        const M = mat3Identity();
        const N = mat3Copy(M);

        assert.ok(mat3Equals(M, N));

        N.elements[4] += 1e-9;
        assert.ok(mat3Equals(M, N));
        assert.ok(!mat3Equals(M, N, 1e-12));
    });

    it('invert 与 reverse 等价，且 M × M⁻¹ = I', () =>
    {
        let q = quatSet();
        q = quatFromEuler(0.3, -0.4, 0.5);
        const M = mat3Identity();
        mat3SetRotationFromQuaternion(q, M);

        const byInvert = mat3Copy(M);
        mat3Reverse(byInvert, byInvert);

        const byReverse = mat3Copy(M);
        mat3Reverse(byReverse, byReverse);

        assert.ok(mat3Equals(byInvert, byReverse));

        // `mat3Multiply(a, b)` 的结果是 a × b（**a 在左**）。旧注释写成「target = m × this」是
        // 方案 §10.1 P8e 登记的反向说明（原 class 的 JSDoc 也写反），本批按实现更正。
        const identity = mat3Multiply(byInvert, M);
        assert.ok(mat3Equals(identity, mat3Identity()));
    });

    it('transformVector3 与 vmult 等价', () =>
    {
        let q = quatSet();
        q = quatFromEuler(0.2, 0.3, -0.1);
        const M = mat3Identity();
        mat3SetRotationFromQuaternion(q, M);

        const v = { x: 1, y: -2, z: 3 };

        assert.ok(vec3Equals(mat3Vmult(M, v, { x: 0, y: 0, z: 0 }), mat3Vmult(M, v, { x: 0, y: 0, z: 0 })));
    });

    it('getScale 提取列长（旋转不改变缩放）', () =>
    {
        let q = quatSet();
        q = quatFromEuler(0.4, 0.5, 0.6);
        const M = mat3Identity();
        mat3SetRotationFromQuaternion(q, M);

        // 行主序下右乘对角缩放 = 第 j 列乘以 scale[j]
        const scale = [2, 3, 4];
        for (let i = 0; i < 3; i++)
        {
            for (let j = 0; j < 3; j++)
            {
                M.elements[i * 3 + j] *= scale[j];
            }
        }

        const extracted = mat3GetScale(M, { x: 0, y: 0, z: 0 });

        assert.ok(vec3Equals(extracted, { x: 2, y: 3, z: 4 }, 1e-6));
    });

    // ───────────────────────── 以下为补充的缺口方法用例 ─────────────────────────

    describe('set / setZero / setTrace / getTrace / smult / copy / transpose', () =>
    {
        /** 九个元素互不相同，便于逐元素核对 */
        const elements9 = (): Matrix3x3Elements => [1, 2, 3, 4, 5, 6, 7, 8, 9];

        it('constructor / set 直接持有传入数组（不拷贝）', () =>
        {
            const arr = elements9();
            const m = mat3Set(arr);

            equal(m.elements, arr, '构造函数直接持有传入数组');

            const arr2 = elements9();
            mat3Set(arr2, m);
            equal(m.elements, arr2, 'set 直接替换 elements 引用');
            deepEqual([...m.elements], arr2);
        });

        it('setZero 把所有元素置零并返回自身', () =>
        {
            const m = mat3Set(elements9());

            equal(mat3SetZero(m), m);
            deepEqual([...m.elements], [0, 0, 0, 0, 0, 0, 0, 0, 0]);
        });

        it('setTrace / getTrace 只碰对角元素，且往返一致', () =>
        {
            const m = mat3Set(elements9());
            const offDiagonalIndexes = [1, 2, 3, 5, 6, 7];
            const offDiagonal = offDiagonalIndexes.map((i) => m.elements[i]);

            equal(mat3SetTrace({ x: 10, y: 20, z: 30 }, m), m);
            equal(mat3GetElement(m, 0, 0), 10);
            equal(mat3GetElement(m, 1, 1), 20);
            equal(mat3GetElement(m, 2, 2), 30);
            deepEqual(offDiagonalIndexes.map((i) => m.elements[i]), offDiagonal, '非对角元素不变');

            const target = { x: 0, y: 0, z: 0 };
            equal(mat3GetTrace(m, target), target, 'getTrace 返回传入的目标向量');
            deepEqual([target.x, target.y, target.z], [10, 20, 30]);
            // 不传参时新建目标
            const traced = mat3GetTrace(m, { x: 0, y: 0, z: 0 });

            deepEqual([traced.x, traced.y, traced.z], [10, 20, 30]);
        });

        it('smult 逐元素缩放：s = 0 等价于 setZero，且与 vmult 线性相容', () =>
        {
            const m = mat3Set(elements9());
            mat3ScaleNumber(m, 2, m);
            deepEqual([...m.elements], elements9().map((e) => e * 2));

            mat3ScaleNumber(m, 0, m);
            deepEqual([...m.elements], [0, 0, 0, 0, 0, 0, 0, 0, 0]);

            // (sM)v = s(Mv)（注意：smult 就地修改且没有返回值）
            const a = mat3Set(elements9());
            const v = { x: 1, y: -2, z: 3 };
            const scaledMatrix = mat3Copy(a);
            mat3ScaleNumber(scaledMatrix, 2.5, scaledMatrix);
            const scaled = mat3Vmult(scaledMatrix, v, { x: 0, y: 0, z: 0 });
            const original = mat3Vmult(a, v, { x: 0, y: 0, z: 0 });

            assert.ok(vec3Equals(scaled, vec3ScaleNumber(original, 2.5), 1e-10));
        });

        it('copy 就地写入全部九个元素并返回自身（按值拷贝）', () =>
        {
            const source = mat3Set(elements9());
            const target = mat3Identity();
            const targetElements = target.elements;

            equal(mat3Copy(source, target), target);
            equal(target.elements, targetElements, 'copy 复用已有的 elements 数组');
            deepEqual([...target.elements], elements9());

            // 改源不影响目标
            source.elements[0] = 99;
            equal(target.elements[0], 1);
        });

        it('transpose 就地转置并返回自身，两次转置还原', () =>
        {
            const m = mat3Set(elements9());

            equal(mat3Transpose(m, m), m);
            deepEqual([...m.elements], [1, 4, 7, 2, 5, 8, 3, 6, 9]);
            deepEqual([...mat3Transpose(m, m).elements], elements9(), '两次转置还原');

            // 对称矩阵转置后不变
            const symmetric = mat3Set([1, 2, 3, 2, 4, 5, 3, 5, 6]);
            deepEqual([...mat3Transpose(symmetric, symmetric).elements], [1, 2, 3, 2, 4, 5, 3, 5, 6]);
        });

        it('transposeTo 不修改自身，结果与 transpose 一致', () =>
        {
            const source = mat3Set(elements9());
            const before = [...source.elements];
            const target = mat3Identity();

            equal(mat3Transpose(source, target), target);
            deepEqual([...source.elements], before, 'transposeTo 不改动自身');
            deepEqual([...target.elements], [...mat3Transpose(mat3Copy(source)).elements]);
        });

        it('转置保持对角元素，非对角元素成对交换', () =>
        {
            const m = mat3Set([2, 1, 3, 0, 4, 5, 1, 0, 6]);
            const diagonal = [m.elements[0], m.elements[4], m.elements[8]];

            mat3Transpose(m, m);
            deepEqual([m.elements[0], m.elements[4], m.elements[8]], diagonal, '对角线不变');
            equal(m.elements[1], 0);
            equal(m.elements[3], 1);
            equal(m.elements[2], 1);
            equal(m.elements[6], 3);
        });

        it('toMatrix4x4 / formMatrix4x4 互逆（回归 #497）', () =>
        {
            const source = mat3Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            const m4 = mat4Identity();

            equal(mat3ToMatrix4x4(source, m4), m4);

            // 3×3 里没有平移 / 透视信息 ⇒ 4×4 的这两部分保持单位
            equal(m4.elements[3], 0);
            equal(m4.elements[7], 0);
            equal(m4.elements[11], 0);
            equal(m4.elements[12], 0);
            equal(m4.elements[13], 0);
            equal(m4.elements[14], 0);
            equal(m4.elements[15], 1);

            // 往返还原
            const back = mat3Identity();
            equal(mat3FromMatrix4x4(m4, back), back);
            deepEqual([...back.elements], [...source.elements]);

            // 任意 3×3 都还原（含非对称、且第 3 列非零）
            const another = mat3Set([2, -1, 0.5, 3, 4, -2, 0, 1, 7]);
            const m4b = mat4Identity();
            mat3ToMatrix4x4(another, m4b);
            const back2 = mat3Identity();
            mat3FromMatrix4x4(m4b, back2);
            deepEqual([...back2.elements], [...another.elements]);
        });
    });
});
