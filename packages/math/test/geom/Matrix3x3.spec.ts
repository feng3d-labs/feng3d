import { Matrix3x3 } from '../../src/geom/Matrix3x3';
import { Matrix4x4 } from '../../src/geom/Matrix4x4';
import { Quaternion } from '../../src/geom/Quaternion';
import { Vector3 } from '../../src/geom/Vector3';

import { assert, describe, it } from 'vitest';
const { equal, deepEqual } = assert;

describe('Matrix3x3', () =>
{
    it('identity', () =>
    {
        const m = new Matrix3x3();

        m.identity();

        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            {
                equal(m.getElement(r, c), (r === c) ? 1 : 0, `cellule ( row : ${r} column : ${c} )  should be ${c === r ? '1' : '0'}`);
            }
        }
    });

    it('vmult', () =>
    {
        const v = new Vector3(2, 3, 7);
        const m = new Matrix3x3();

        /*
          set the matrix to
          | 1 2 3 |
          | 4 5 6 |
          | 7 8 9 |
        */
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            { m.setElement(r, c, 1 + r * 3 + c); }
        }
        const t = m.vmult(v);

        assert.ok(t.x === 29 && t.y === 65 && t.z === 101, `Expected (29,65,101), got (${t.toString()}), while multiplying m=${m.toString()} with ${v.toString()}`);
    });

    it('mmult', () =>
    {
        const m1 = new Matrix3x3();
        const m2 = new Matrix3x3();

        /* set the matrix to
            | 1 2 3 |
            | 4 5 6 |
            | 7 8 9 |
        */
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            { m1.setElement(r, c, 1 + r * 3 + c); }
        }

        /* set the matrix to
         | 5 2 4 |
         | 4 5 1 |
         | 1 8 0 |
        */
        m2.setElement(0, 0, 5);
        m2.setElement(0, 1, 2);
        m2.setElement(0, 2, 4);
        m2.setElement(1, 0, 4);
        m2.setElement(1, 1, 5);
        m2.setElement(1, 2, 1);
        m2.setElement(2, 0, 1);
        m2.setElement(2, 1, 8);
        m2.setElement(2, 2, 0);

        const m3 = m1.mmult(m2);

        assert.ok(m3.getElement(0, 0) === 16
            && m3.getElement(0, 1) === 36
            && m3.getElement(0, 2) === 6
            && m3.getElement(1, 0) === 46
            && m3.getElement(1, 1) === 81
            && m3.getElement(1, 2) === 21
            && m3.getElement(2, 0) === 76
            && m3.getElement(2, 1) === 126
            && m3.getElement(2, 2) === 36, 'calculating multiplication with another matrix');
    });

    it('solve', () =>
    {
        const m = new Matrix3x3();
        const v = new Vector3(2, 3, 7);

        /* set the matrix to
        | 5 2 4 |
        | 4 5 1 |
        | 1 8 0 |
        */
        m.setElement(0, 0, 5);
        m.setElement(0, 1, 2);
        m.setElement(0, 2, 4);
        m.setElement(1, 0, 4);
        m.setElement(1, 1, 5);
        m.setElement(1, 2, 1);
        m.setElement(2, 0, 1);
        m.setElement(2, 1, 8);
        m.setElement(2, 2, 0);

        const t = m.solve(v);

        const vv = m.vmult(t);

        assert.ok(vv.equals(v, 0.00001), 'solving Ax = b');

        const m1 = new Matrix3x3();

        /* set the matrix to
         | 1 2 3 |
         | 4 5 6 |
         | 7 8 9 |
         */
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            {
                m1.setElement(r, c, 1 + r * 3 + c);
            }
        }

        let error = false;

        try
        {
            m1.solve(v);
        }
        catch
        {
            error = true;
        }

        assert.ok(error, 'should rise an error if the system has no solutions');
    });

    it('reverse', () =>
    {
        const m = new Matrix3x3();

        /* set the matrix to
        | 5 2 4 |
        | 4 5 1 |
        | 1 8 0 |
        */
        m.setElement(0, 0, 5);
        m.setElement(0, 1, 2);
        m.setElement(0, 2, 4);
        m.setElement(1, 0, 4);
        m.setElement(1, 1, 5);
        m.setElement(1, 2, 1);
        m.setElement(2, 0, 1);
        m.setElement(2, 1, 8);
        m.setElement(2, 2, 0);

        const m2 = m.reverseTo();

        const m3 = m2.mmult(m);

        let success = true;
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            {
                success = success && (Math.abs(m3.getElement(r, c) - (c === r ? 1 : 0)) < 0.00001);
            }
        }

        assert.ok(success, 'inversing');

        const m1 = new Matrix3x3();

        /* set the matrix to
        | 1 2 3 |
        | 4 5 6 |
        | 7 8 9 |
        */
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            {
                m1.setElement(r, c, 1 + r * 3 + c);
            }
        }

        let error = false;

        try
        {
            m1.reverseTo();
        }
        catch
        {
            error = true;
        }

        assert.ok(error, 'should rise an error if the matrix is not inersible');
    });

    it('transpose', () =>
    {
        const M = new Matrix3x3([1, 2, 3,
            4, 5, 6,
            7, 8, 9]);
        const Mt = M.transposeTo();
        deepEqual(Mt.elements, [1, 4, 7,
            2, 5, 8,
            3, 6, 9]);
    });

    it('scale', () =>
    {
        const M = new Matrix3x3([1, 1, 1,
            1, 1, 1,
            1, 1, 1]);
        const Mt = M.scale(new Vector3(1, 2, 3));
        deepEqual(Mt.elements, [1, 2, 3,
            1, 2, 3,
            1, 2, 3]);
    });

    it('setRotationFromQuaternion', () =>
    {
        const M = new Matrix3x3();
        const q = new Quaternion();
        const original = new Vector3(1, 2, 3);

        // Test zero rotation
        M.setRotationFromQuaternion(q);
        const v = M.vmult(original);
        assert.ok(v.equals(original));

        // Test rotation along x axis
        q.fromEuler(0.222, 0.123, 1.234);
        M.setRotationFromQuaternion(q);
        const Mv = M.vmult(original);
        const qv = q.rotatePoint(original);

        assert.ok(Mv.equals(qv));
    });

    // ---- 以下为向 Matrix4x4 对齐的 API（issue #127）----

    it('fromArray / toArray 往返', () =>
    {
        const source = new Matrix3x3([
            1, 2, 3,
            4, 5, 6,
            7, 8, 9,
        ]);
        const array = source.toArray();

        assert.ok(new Matrix3x3().fromArray(array).equals(source));

        // 带偏移
        assert.ok(new Matrix3x3().fromArray([0, 0].concat(array), 2).equals(source));

        // 长度不足要报错，而不是静默填充半个矩阵
        assert.throws(() => new Matrix3x3().fromArray([1, 2, 3]), /数组长度不足/);
    });

    it('clone 是深拷贝', () =>
    {
        const q = new Quaternion();
        q.fromEuler(0.1, 0.2, 0.3);
        const M = new Matrix3x3();
        M.setRotationFromQuaternion(q);

        const copy = M.clone();

        assert.ok(copy.equals(M));
        assert.notStrictEqual(copy.elements, M.elements);

        copy.elements[0] += 1;
        assert.ok(!copy.equals(M));
    });

    it('equals 按精度比较', () =>
    {
        const M = new Matrix3x3();
        const N = M.clone();

        assert.ok(M.equals(N));

        N.elements[4] += 1e-9;
        assert.ok(M.equals(N));
        assert.ok(!M.equals(N, 1e-12));
    });

    it('invert 与 reverse 等价，且 M × M⁻¹ = I', () =>
    {
        const q = new Quaternion();
        q.fromEuler(0.3, -0.4, 0.5);
        const M = new Matrix3x3();
        M.setRotationFromQuaternion(q);

        const byInvert = M.clone();
        byInvert.invert();

        const byReverse = M.clone();
        byReverse.reverse();

        assert.ok(byInvert.equals(byReverse));

        // mmult 的参数在左：target = m × this
        const identity = byInvert.mmult(M);
        assert.ok(identity.equals(new Matrix3x3()));
    });

    it('transformVector3 与 vmult 等价', () =>
    {
        const q = new Quaternion();
        q.fromEuler(0.2, 0.3, -0.1);
        const M = new Matrix3x3();
        M.setRotationFromQuaternion(q);

        const v = new Vector3(1, -2, 3);

        assert.ok(M.transformVector3(v).equals(M.vmult(v)));
    });

    it('getScale 提取列长（旋转不改变缩放）', () =>
    {
        const q = new Quaternion();
        q.fromEuler(0.4, 0.5, 0.6);
        const M = new Matrix3x3();
        M.setRotationFromQuaternion(q);

        // 行主序下右乘对角缩放 = 第 j 列乘以 scale[j]
        const scale = [2, 3, 4];
        for (let i = 0; i < 3; i++)
        {
            for (let j = 0; j < 3; j++)
            {
                M.elements[i * 3 + j] *= scale[j];
            }
        }

        const extracted = M.getScale();

        assert.ok(extracted.equals(new Vector3(2, 3, 4), 1e-6));
    });

    // ───────────────────────── 以下为补充的缺口方法用例 ─────────────────────────

    describe('set / setZero / setTrace / getTrace / smult / copy / transpose', () =>
    {
        /** 九个元素互不相同，便于逐元素核对 */
        const elements9 = () => [1, 2, 3, 4, 5, 6, 7, 8, 9];

        it('constructor / set 直接持有传入数组（不拷贝）', () =>
        {
            const arr = elements9();
            const m = new Matrix3x3(arr);

            equal(m.elements, arr, '构造函数直接持有传入数组');

            const arr2 = elements9();
            m.set(arr2);
            equal(m.elements, arr2, 'set 直接替换 elements 引用');
            deepEqual([...m.elements], arr2);
        });

        it('setZero 把所有元素置零并返回自身', () =>
        {
            const m = new Matrix3x3(elements9());

            equal(m.setZero(), m);
            deepEqual([...m.elements], [0, 0, 0, 0, 0, 0, 0, 0, 0]);
        });

        it('setTrace / getTrace 只碰对角元素，且往返一致', () =>
        {
            const m = new Matrix3x3(elements9());
            const offDiagonalIndexes = [1, 2, 3, 5, 6, 7];
            const offDiagonal = offDiagonalIndexes.map((i) => m.elements[i]);

            equal(m.setTrace(new Vector3(10, 20, 30)), m);
            equal(m.getElement(0, 0), 10);
            equal(m.getElement(1, 1), 20);
            equal(m.getElement(2, 2), 30);
            deepEqual(offDiagonalIndexes.map((i) => m.elements[i]), offDiagonal, '非对角元素不变');

            const target = new Vector3();
            equal(m.getTrace(target), target, 'getTrace 返回传入的目标向量');
            deepEqual([target.x, target.y, target.z], [10, 20, 30]);
            // 不传参时新建目标
            deepEqual(m.getTrace().toArray(), [10, 20, 30]);
        });

        it('smult 逐元素缩放：s = 0 等价于 setZero，且与 vmult 线性相容', () =>
        {
            const m = new Matrix3x3(elements9());
            m.smult(2);
            deepEqual([...m.elements], elements9().map((e) => e * 2));

            m.smult(0);
            deepEqual([...m.elements], [0, 0, 0, 0, 0, 0, 0, 0, 0]);

            // (sM)v = s(Mv)（注意：smult 就地修改且没有返回值）
            const a = new Matrix3x3(elements9());
            const v = new Vector3(1, -2, 3);
            const scaledMatrix = a.clone();
            scaledMatrix.smult(2.5);
            const scaled = scaledMatrix.vmult(v);
            const original = a.vmult(v);

            assert.ok(scaled.equals(original.clone().scaleNumber(2.5), 1e-10));
        });

        it('copy 就地写入全部九个元素并返回自身（按值拷贝）', () =>
        {
            const source = new Matrix3x3(elements9());
            const target = new Matrix3x3();
            const targetElements = target.elements;

            equal(target.copy(source), target);
            equal(target.elements, targetElements, 'copy 复用已有的 elements 数组');
            deepEqual([...target.elements], elements9());

            // 改源不影响目标
            source.elements[0] = 99;
            equal(target.elements[0], 1);
        });

        it('transpose 就地转置并返回自身，两次转置还原', () =>
        {
            const m = new Matrix3x3(elements9());

            equal(m.transpose(), m);
            deepEqual([...m.elements], [1, 4, 7, 2, 5, 8, 3, 6, 9]);
            deepEqual([...m.transpose().elements], elements9(), '两次转置还原');

            // 对称矩阵转置后不变
            const symmetric = new Matrix3x3([1, 2, 3, 2, 4, 5, 3, 5, 6]);
            deepEqual([...symmetric.transpose().elements], [1, 2, 3, 2, 4, 5, 3, 5, 6]);
        });

        it('transposeTo 不修改自身，结果与 transpose 一致', () =>
        {
            const source = new Matrix3x3(elements9());
            const before = [...source.elements];
            const target = new Matrix3x3();

            equal(source.transposeTo(target), target);
            deepEqual([...source.elements], before, 'transposeTo 不改动自身');
            deepEqual([...target.elements], [...source.clone().transpose().elements]);
        });

        it('转置保持对角元素，非对角元素成对交换', () =>
        {
            const m = new Matrix3x3([2, 1, 3, 0, 4, 5, 1, 0, 6]);
            const diagonal = [m.elements[0], m.elements[4], m.elements[8]];

            m.transpose();
            deepEqual([m.elements[0], m.elements[4], m.elements[8]], diagonal, '对角线不变');
            equal(m.elements[1], 0);
            equal(m.elements[3], 1);
            equal(m.elements[2], 1);
            equal(m.elements[6], 3);
        });

        it('toMatrix4x4 / formMatrix4x4 互逆（回归 #497）', () =>
        {
            const source = new Matrix3x3([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            const m4 = new Matrix4x4();

            equal(source.toMatrix4x4(m4), m4);

            // 3×3 里没有平移 / 透视信息 ⇒ 4×4 的这两部分保持单位
            equal(m4.elements[3], 0);
            equal(m4.elements[7], 0);
            equal(m4.elements[11], 0);
            equal(m4.elements[12], 0);
            equal(m4.elements[13], 0);
            equal(m4.elements[14], 0);
            equal(m4.elements[15], 1);

            // 往返还原
            const back = new Matrix3x3();
            equal(back.formMatrix4x4(m4), back);
            deepEqual([...back.elements], [...source.elements]);

            // 任意 3×3 都还原（含非对称、且第 3 列非零）
            const another = new Matrix3x3([2, -1, 0.5, 3, 4, -2, 0, 1, 7]);
            const m4b = new Matrix4x4();
            another.toMatrix4x4(m4b);
            const back2 = new Matrix3x3();
            back2.formMatrix4x4(m4b);
            deepEqual([...back2.elements], [...another.elements]);
        });
    });
});
