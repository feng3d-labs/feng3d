import { RotationOrder } from '../../src/enums/RotationOrder';
import { Euler } from '../../src/geom/Euler';
import { Matrix4x4 } from '../../src/geom/Matrix4x4';
import { Quaternion } from '../../src/geom/Quaternion';
import { Vector3 } from '../../src/geom/Vector3';

import { assert, describe, expect, it } from 'vitest';
const { equal, deepEqual } = assert;

describe('Quaternion', () =>
{
    it('四元素正值与负值等价', () =>
    {
        const quaternion0 = new Quaternion().random();
        const quaternion1 = quaternion0.clone();
        quaternion1.x *= -1;
        quaternion1.y *= -1;
        quaternion1.z *= -1;
        quaternion1.w *= -1;

        const matrix0 = new Matrix4x4();
        matrix0.fromQuaternion(quaternion0);
        const matrix1 = new Matrix4x4();
        matrix1.fromQuaternion(quaternion1);

        deepEqual(matrix0, matrix1);
    });

    it('rotatePoint', () =>
    {
        const quat = new Quaternion().random();

        const v = new Vector3().random();

        const v1 = quat.rotatePoint(v);
        const v2 = new Matrix4x4().fromQuaternion(quat).transformPoint3(v);

        assert.ok(
            v1.equals(v2)
        );
    });

    it('inverse', () =>
    {
        const quat = new Quaternion().random();

        const v = new Vector3().random();

        const invQ = quat.inverseTo();

        const v1 = quat.rotatePoint(v);
        const v2 = invQ.rotatePoint(v1);

        assert.ok(
            v.equals(v2)
        );
    });

    it('creation', () =>
    {
        const q = new Quaternion(1, 2, 3, 4);
        equal(q.x, 1, 'Creating should set the first parameter to the x value');
        equal(q.y, 2, 'Creating should set the second parameter to the y value');
        equal(q.z, 3, 'Creating should set the third parameter to the z value');
        equal(q.w, 4, 'Creating should set the third parameter to the z value');
    });

    it('fromMatrix', () =>
    {
        const euler = new Euler().random();
        const quaternion = new Quaternion();
        quaternion.fromEuler(euler.x, euler.y, euler.z, euler.order);

        //
        const matrix = new Matrix4x4();
        matrix.fromRotation(euler.x, euler.y, euler.z, euler.order);
        const quaternion1 = new Quaternion();
        quaternion1.fromMatrix(matrix);

        deepEqual(quaternion.equals(quaternion1), true);
    });

    it('fromEuler', () =>
    {
        const euler = new Euler().random();
        const quaternion = new Quaternion();
        quaternion.fromEuler(euler.x, euler.y, euler.z, euler.order);

        //
        const matrix = new Matrix4x4();
        matrix.fromRotation(euler.x, euler.y, euler.z, euler.order);
        const quaternion1 = new Quaternion();
        quaternion1.fromMatrix(matrix);

        deepEqual(quaternion.equals(quaternion1), true);
    });

    it('setFromVectors', () =>
    {
        const q = new Quaternion();

        {
            const vec30 = new Vector3().random().normalize();
            const vec31 = new Vector3().random().normalize();
            q.fromUnitVectors(vec30, vec31);

            const result = q.vmult(vec30);
            assert.ok(result.equals(vec31));
        }

        {
            //
            const vec30 = new Vector3().random().normalize();
            const vec31 = new Vector3().random().normalize();
            vec30.negateTo(vec31);
            //
            q.fromUnitVectors(vec30, vec31);
            const result = q.vmult(vec30);
            //
            assert.ok(result.equals(vec31));
        }
    });

    it('slerp', () =>
    {
        const qa = new Quaternion();
        const qb = new Quaternion();
        qa.slerpTo(qb, 0.5, qb);
        deepEqual(qa, qb);

        qa.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 4);
        qb.fromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 4);
        qa.slerpTo(qb, 0.5, qb);
        deepEqual(qb, new Quaternion());
    });

    // ───────────────────────── 以下为本轮新增用例 ─────────────────────────
    //
    // 约定：只钉**数学上必然成立**的不变量。
    // ⚠️ `equals` 在 `this.x === 0` 时无效（实测单位四元数与自身都不相等，见 #489），
    // 所以这里只为 `x !== 0` 的情形写断言。

    describe('构造、字段与拷贝', () =>
    {
        it('默认构造是单位四元数 (0, 0, 0, 1)', () =>
        {
            const q = new Quaternion();

            expect([q.x, q.y, q.z, q.w]).toEqual([0, 0, 0, 1]);
            expect(q.magnitude).toBe(1);
        });

        it('set 返回自身并按参数写入四个分量', () =>
        {
            const q = new Quaternion();

            expect(q.set(1, 2, 3, 4)).toBe(q);
            expect([q.x, q.y, q.z, q.w]).toEqual([1, 2, 3, 4]);
        });

        it('magnitude 是模：(3, 4, 0, 0) → 5', () =>
        {
            expect(new Quaternion(3, 4, 0, 0).magnitude).toBe(5);
            expect(new Quaternion(0, 0, 0, -2).magnitude).toBe(2);
        });

        it('copy 就地写入并返回自身，clone 是独立副本', () =>
        {
            const source = new Quaternion(1, 2, 3, 4);
            const target = new Quaternion();

            expect(target.copy(source)).toBe(target);
            expect([target.x, target.y, target.z, target.w]).toEqual([1, 2, 3, 4]);

            const cloned = source.clone();
            expect(cloned).not.toBe(source);
            expect([cloned.x, cloned.y, cloned.z, cloned.w]).toEqual([1, 2, 3, 4]);

            // 改 clone 不影响源
            cloned.x = 99;
            expect(source.x).toBe(1);
        });
    });

    describe('equals（x ≠ 0 的安全情形）', () =>
    {
        it('与自身相等、与取负版本等价', () =>
        {
            const q = new Quaternion(1, 2, 3, 4);

            expect(q.equals(new Quaternion(1, 2, 3, 4))).toBe(true);
            // 四元数与它的负值表示同一个旋转
            expect(q.equals(new Quaternion(-1, -2, -3, -4))).toBe(true);
        });

        it('分量不同则不等，精度可控', () =>
        {
            const q = new Quaternion(1, 2, 3, 4);

            expect(q.equals(new Quaternion(1, 2, 3, 5))).toBe(false);
            // 差 0.001：默认精度（1e-6）下不等，放宽到 0.01 后相等
            expect(q.equals(new Quaternion(1.001, 2, 3, 4))).toBe(false);
            expect(q.equals(new Quaternion(1.001, 2, 3, 4), 0.01)).toBe(true);
        });
    });

    describe('fromArray / toArray', () =>
    {
        it('静态与实例 fromArray 一致，支持 offset', () =>
        {
            const values = [9, 9, 1, 2, 3, 4];

            const fromStatic = Quaternion.fromArray(values, 2);
            expect([fromStatic.x, fromStatic.y, fromStatic.z, fromStatic.w]).toEqual([1, 2, 3, 4]);

            const q = new Quaternion();
            expect(q.fromArray(values, 2)).toBe(q);
            expect([q.x, q.y, q.z, q.w]).toEqual([1, 2, 3, 4]);
        });

        it('toArray 支持 offset 与复用数组，且能往返还原', () =>
        {
            const q = new Quaternion(1, 2, 3, 4);

            expect(q.toArray()).toEqual([1, 2, 3, 4]);

            const buffer = [0, 0, 0, 0, 0, 0];
            expect(q.toArray(buffer, 2)).toBe(buffer);
            expect(buffer).toEqual([0, 0, 1, 2, 3, 4]);

            // 往返
            const restored = new Quaternion().fromArray(q.toArray());
            expect([restored.x, restored.y, restored.z, restored.w]).toEqual([1, 2, 3, 4]);
        });
    });

    describe('乘法与逆', () =>
    {
        /** 用逐分量断言（绕开 equals 在 x === 0 时的缺陷） */
        function expectQuaternion(actual: Quaternion, x: number, y: number, z: number, w: number, precision = 10)
        {
            expect(actual.x).toBeCloseTo(x, precision);
            expect(actual.y).toBeCloseTo(y, precision);
            expect(actual.z).toBeCloseTo(z, precision);
            expect(actual.w).toBeCloseTo(w, precision);
        }

        it('mult 就地：乘单位四元数不变', () =>
        {
            const q = new Quaternion().fromAxisAngle(new Vector3(1, 2, 3).normalize(), 0.7);
            const before = [q.x, q.y, q.z, q.w];

            expect(q.mult(new Quaternion())).toBe(q);
            expect([q.x, q.y, q.z, q.w]).toEqual(before);
        });

        it('multTo 写入 target 且不改动自身', () =>
        {
            const a = new Quaternion().fromAxisAngle(new Vector3(1, 0, 0), 0.4);
            const b = new Quaternion().fromAxisAngle(new Vector3(0, 1, 0), 0.9);
            const before = [a.x, a.y, a.z, a.w];
            const target = new Quaternion();

            expect(a.multTo(b, target)).toBe(target);
            expect(target).not.toBe(a);
            expect([a.x, a.y, a.z, a.w]).toEqual(before);

            // 与就地版本一致
            const inPlace = a.clone().mult(b);
            expectQuaternion(target, inPlace.x, inPlace.y, inPlace.z, inPlace.w, 12);
        });

        it('q ⊗ q⁻¹ 是单位四元数', () =>
        {
            const q = new Quaternion().fromAxisAngle(new Vector3(0.3, -0.5, 0.8).normalize(), 1.2);
            const product = q.clone().mult(q.inverseTo());

            expectQuaternion(product, 0, 0, 0, 1);
        });

        it('inverse 就地共轭（x/y/z 取反、w 不变），两次还原', () =>
        {
            const q = new Quaternion(0.5, -0.25, 0.125, 0.75);
            const conjugated = q.clone().inverse();

            expect([conjugated.x, conjugated.y, conjugated.z, conjugated.w]).toEqual([-0.5, 0.25, -0.125, 0.75]);
            expect([q.x, q.y, q.z, q.w]).toEqual([0.5, -0.25, 0.125, 0.75], '不就地修改原对象');

            // 两次共轭还原
            expect([q.clone().inverse().inverse().x, q.clone().inverse().inverse().y]).toEqual([0.5, -0.25]);

            // inverseTo 写 target 且不改自身
            const target = new Quaternion();
            expect(q.inverseTo(target)).toBe(target);
            expect([target.x, target.y, target.z, target.w]).toEqual([-0.5, 0.25, -0.125, 0.75]);
        });

        it('multiplyVector(v) 逐位等于 q ⊗ (v, 0)', () =>
        {
            const q = new Quaternion().fromAxisAngle(new Vector3(1, -2, 0.5).normalize(), 0.8);
            const v = new Vector3(1, -2, 0.5);

            const byMultiplyVector = q.multiplyVector(v);
            const byMult = q.clone().mult(new Quaternion(v.x, v.y, v.z, 0));

            expectQuaternion(byMultiplyVector, byMult.x, byMult.y, byMult.z, byMult.w, 12);
        });

        it('(q ⊗ v) ⊗ q⁻¹ = rotatePoint(v) = vmult(v)', () =>
        {
            const q = new Quaternion().fromAxisAngle(new Vector3(1, 2, 3).normalize(), 0.9);
            const v = new Vector3(1, -2, 0.5);

            const restored = q.multiplyVector(v).mult(q.inverseTo());
            const rotated = q.rotatePoint(v);
            const multiplied = q.vmult(v);

            expect(restored.x).toBeCloseTo(rotated.x, 10);
            expect(restored.y).toBeCloseTo(rotated.y, 10);
            expect(restored.z).toBeCloseTo(rotated.z, 10);
            expect(multiplied.x).toBeCloseTo(rotated.x, 10);
            expect(multiplied.y).toBeCloseTo(rotated.y, 10);
            expect(multiplied.z).toBeCloseTo(rotated.z, 10);
        });
    });

    describe('旋转', () =>
    {
        it('单位四元数不改变点；绕 z 轴 90° 把 (1,0,0) 送到 (0,1,0)', () =>
        {
            const v = new Vector3(1, 2, -3);
            const unchanged = new Quaternion().rotatePoint(v);

            expect(unchanged.x).toBeCloseTo(1, 12);
            expect(unchanged.y).toBeCloseTo(2, 12);
            expect(unchanged.z).toBeCloseTo(-3, 12);

            const turned = new Quaternion().fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2).rotatePoint(new Vector3(1, 0, 0));
            expect(turned.x).toBeCloseTo(0, 10);
            expect(turned.y).toBeCloseTo(1, 10);
            expect(turned.z).toBeCloseTo(0, 10);
        });

        it('rotatePoint / vmult 返回 target 且不改动入参', () =>
        {
            const q = new Quaternion().fromAxisAngle(new Vector3(0, 1, 0), 0.6);
            const point = new Vector3(1, 2, 3);
            const target = new Vector3();

            expect(q.rotatePoint(point, target)).toBe(target);
            expect(q.vmult(point, target)).toBe(target);
            expect([point.x, point.y, point.z]).toEqual([1, 2, 3], 'rotatePoint 不改动入参');
        });

        it('与 Matrix4x4.fromQuaternion 作用同一点的结果一致', () =>
        {
            for (let i = 0; i < 5; i++)
            {
                const q = new Quaternion().random();
                const v = new Vector3().random(10, true);
                const byQuaternion = q.rotatePoint(v);
                const byMatrix = new Matrix4x4().fromQuaternion(q).transformPoint3(v);

                expect(byQuaternion.x).toBeCloseTo(byMatrix.x, 8);
                expect(byQuaternion.y).toBeCloseTo(byMatrix.y, 8);
                expect(byQuaternion.z).toBeCloseTo(byMatrix.z, 8);
            }
        });
    });

    describe('轴角', () =>
    {
        it('fromAxisAngle：单位轴 + θ → (sin(θ/2)·axis, cos(θ/2))', () =>
        {
            const q = new Quaternion();

            expect(q.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)).toBe(q);
            expect(q.x).toBeCloseTo(0, 12);
            expect(q.y).toBeCloseTo(Math.SQRT1_2, 12);
            expect(q.z).toBeCloseTo(0, 12);
            expect(q.w).toBeCloseTo(Math.SQRT1_2, 12);
            expect(q.magnitude).toBeCloseTo(1, 12);
        });

        it('fromAxisAngle ⇄ toAxisAngle 往返', () =>
        {
            const axis = new Vector3(0, 1, 0);
            const q = new Quaternion().fromAxisAngle(axis, 0.3);
            const [resultAxis, angle] = q.toAxisAngle();

            expect(resultAxis.x).toBeCloseTo(0, 10);
            expect(resultAxis.y).toBeCloseTo(1, 10);
            expect(resultAxis.z).toBeCloseTo(0, 10);
            expect(angle).toBeCloseTo(0.3, 10);
        });

        it('角度 0 时轴退化为零向量（s < 0.001 分支）', () =>
        {
            const [axis, angle] = new Quaternion().fromAxisAngle(new Vector3(0, 1, 0), 0).toAxisAngle();

            expect(angle).toBe(0);
            expect([axis.x, axis.y, axis.z]).toEqual([0, 0, 0]);
        });

        it('toAxisAngle 复用传入的轴向量，并把自身归一化', () =>
        {
            const target = new Vector3();
            // 未归一化的四元数：(2, 0, 0, 2) 表示绕 x 轴 90°
            const q = new Quaternion(2, 0, 0, 2);
            const result = q.toAxisAngle(target);

            expect(result[0]).toBe(target);
            expect(target.x).toBeCloseTo(1, 10);
            expect(result[1]).toBeCloseTo(Math.PI / 2, 10);
            // toAxisAngle 内部先 normalize 自身
            expect(q.magnitude).toBeCloseTo(1, 12);
        });
    });

    describe('fromUnitVectors', () =>
    {
        it('把 u 旋到 v，且结果始终是单位四元数', () =>
        {
            const q = new Quaternion();

            for (let i = 0; i < 5; i++)
            {
                const u = new Vector3().random(2, true).normalize();
                const v = new Vector3().random(2, true).normalize();
                const uBefore = u.clone();

                q.fromUnitVectors(u, v);
                expect(q.magnitude).toBeCloseTo(1, 12);

                const result = q.vmult(u);
                expect(result.x).toBeCloseTo(v.x, 6);
                expect(result.y).toBeCloseTo(v.y, 6);
                expect(result.z).toBeCloseTo(v.z, 6);
                // 不改动入参
                expect([u.x, u.y, u.z]).toEqual([uBefore.x, uBefore.y, uBefore.z]);
            }
        });

        it('反平行（u = -v）也把 u 旋到 v', () =>
        {
            const q = new Quaternion();
            const u = new Vector3(1, 2, 3).normalize();
            const v = u.clone().negateTo();

            q.fromUnitVectors(u, v);
            const result = q.vmult(u);

            expect(result.x).toBeCloseTo(v.x, 8);
            expect(result.y).toBeCloseTo(v.y, 8);
            expect(result.z).toBeCloseTo(v.z, 8);
        });
    });

    describe('slerp / slerpTo / lerp', () =>
    {
        it('slerp：t = 0 保持不变、t = 1 变成 qb', () =>
        {
            const qa = new Quaternion().fromAxisAngle(new Vector3(0, 0, 1), 0.2);
            const qb = new Quaternion().fromAxisAngle(new Vector3(1, 0, 0), 1.1);

            const at0 = qa.clone().slerp(qb, 0);
            expect([at0.x, at0.y, at0.z, at0.w]).toEqual([qa.x, qa.y, qa.z, qa.w]);

            const at1 = qa.clone().slerp(qb, 1);
            expect(at1.x).toBeCloseTo(qb.x, 12);
            expect(at1.y).toBeCloseTo(qb.y, 12);
            expect(at1.z).toBeCloseTo(qb.z, 12);
            expect(at1.w).toBeCloseTo(qb.w, 12);
        });

        it('同轴时 slerp(0.5) 恰好是角度中点', () =>
        {
            const axis = new Vector3(0, 0, 1);
            const qa = new Quaternion().fromAxisAngle(axis, 0);
            const qb = new Quaternion().fromAxisAngle(axis, Math.PI / 2);
            const half = new Quaternion().fromAxisAngle(axis, Math.PI / 4);
            const actual = qa.slerpTo(qb, 0.5);

            expect(actual.x).toBeCloseTo(half.x, 12);
            expect(actual.y).toBeCloseTo(half.y, 12);
            expect(actual.z).toBeCloseTo(half.z, 12);
            expect(actual.w).toBeCloseTo(half.w, 12);
        });

        it('目标是 qb 的取负版本时结果不变（cosHalfTheta < 0 分支）', () =>
        {
            const axis = new Vector3(0, 0, 1);
            const qa = new Quaternion().fromAxisAngle(axis, 0);
            const qb = new Quaternion().fromAxisAngle(axis, Math.PI / 2);
            const negated = new Quaternion(-qb.x, -qb.y, -qb.z, -qb.w);

            const fromQb = qa.clone().slerp(qb, 0.5);
            const fromNegated = qa.clone().slerp(negated, 0.5);

            expect(fromNegated.x).toBeCloseTo(fromQb.x, 12);
            expect(fromNegated.y).toBeCloseTo(fromQb.y, 12);
            expect(fromNegated.z).toBeCloseTo(fromQb.z, 12);
            expect(fromNegated.w).toBeCloseTo(fromQb.w, 12);
        });

        it('极小夹角走线性插值分支，结果仍是单位四元数', () =>
        {
            const axis = new Vector3(0, 0, 1);
            const qa = new Quaternion().fromAxisAngle(axis, 0.5);
            const qb = new Quaternion().fromAxisAngle(axis, 0.5 + 1e-9);

            const actual = qa.clone().slerp(qb, 0.5);

            // 两端几乎重合 ⇒ 结果几乎等于 qb
            expect(actual.z).toBeCloseTo(qb.z, 8);
            expect(actual.w).toBeCloseTo(qb.w, 8);
            expect(actual.magnitude).toBeCloseTo(1, 12);
        });

        it('slerpTo 写入 out、不改自身；out 与 qb 是同一对象时也不破坏', () =>
        {
            const qa = new Quaternion().fromAxisAngle(new Vector3(0, 0, 1), 0.2);
            const qb = new Quaternion().fromAxisAngle(new Vector3(0, 0, 1), 1.0);
            const before = [qa.x, qa.y, qa.z, qa.w];
            const out = new Quaternion();

            expect(qa.slerpTo(qb, 0.5, out)).toBe(out);
            expect([qa.x, qa.y, qa.z, qa.w]).toEqual(before);

            // qb 与 out 同一对象：实现内部先 clone，结果应与正常调用一致
            const expected = qa.slerpTo(qb.clone(), 0.5);
            const shared = qb.clone();
            qa.slerpTo(shared, 0.5, shared);

            expect(shared.x).toBeCloseTo(expected.x, 12);
            expect(shared.y).toBeCloseTo(expected.y, 12);
            expect(shared.z).toBeCloseTo(expected.z, 12);
            expect(shared.w).toBeCloseTo(expected.w, 12);
        });

        it('lerp：端点取两端、同轴中点等于角度中点，且不改动入参', () =>
        {
            const axis = new Vector3(0, 0, 1);
            const qa = new Quaternion().fromAxisAngle(axis, 0);
            const qb = new Quaternion().fromAxisAngle(axis, Math.PI / 2);

            const at0 = new Quaternion(); at0.lerp(qa, qb, 0);
            const at1 = new Quaternion(); at1.lerp(qa, qb, 1);
            const atHalf = new Quaternion(); atHalf.lerp(qa, qb, 0.5);

            expect(at0.w).toBeCloseTo(qa.w, 12);
            expect(at1.z).toBeCloseTo(qb.z, 12);
            expect(at1.w).toBeCloseTo(qb.w, 12);

            // 同轴时线性插值 + 归一化 = 球面插值
            const expected = new Quaternion().fromAxisAngle(axis, Math.PI / 4);
            expect(atHalf.z).toBeCloseTo(expected.z, 12);
            expect(atHalf.w).toBeCloseTo(expected.w, 12);
            expect(atHalf.magnitude).toBeCloseTo(1, 12);

            // 不改动入参
            expect([qa.x, qa.y, qa.z, qa.w]).toEqual([0, 0, 0, 1]);
            expect(qb.z).toBeCloseTo(Math.SQRT1_2, 12);
        });
    });

    describe('normalize / normalizeFast', () =>
    {
        it('normalize：放大的四元数回到单位，零四元数变成单位四元数', () =>
        {
            const q = new Quaternion(3, 4, 0, 0);

            expect(q.normalize()).toBe(q);
            expect(q.x).toBeCloseTo(0.6, 12);
            expect(q.y).toBeCloseTo(0.8, 12);
            expect(q.z).toBe(0);
            expect(q.w).toBe(0);

            expect(new Quaternion(0, 0, 0, 0).normalize().toArray()).toEqual([0, 0, 0, 1]);
            expect(new Quaternion(0, 2, 0, 0).normalize().toArray()).toEqual([0, 1, 0, 0]);
        });

        it('normalize(val) 把模变成 val', () =>
        {
            expect(new Quaternion(3, 4, 0, 0).normalize(2).magnitude).toBeCloseTo(2, 12);
            expect(new Quaternion(0, 0, 0, 5).normalize(0.5).magnitude).toBeCloseTo(0.5, 12);
        });

        it('normalizeFast：单位四元数不变，|q|² = 3 时被清零（f === 0 分支）', () =>
        {
            const unit = new Quaternion();

            expect(unit.normalizeFast()).toBe(unit);
            expect(unit.toArray()).toEqual([0, 0, 0, 1]);

            // |(1,1,1,0)|² = 3 ⇒ f = (3 - 3) / 2 = 0 ⇒ 全部分量置零
            expect(new Quaternion(1, 1, 1, 0).normalizeFast().toArray()).toEqual([0, 0, 0, 0]);
        });
    });

    describe('integrate', () =>
    {
        const angularVelocity = new Vector3(0, 0, 2);
        const factor = new Vector3(1, 0, 1);

        it('dt = 0 / 角速度 0 / factor 0 时都不变', () =>
        {
            const identity = [0, 0, 0, 1];

            expect(new Quaternion().integrate(new Vector3(1, 2, 3), 0, factor).toArray()).toEqual(identity);
            expect(new Quaternion().integrate(new Vector3(0, 0, 0), 0.5, factor).toArray()).toEqual(identity);
            expect(new Quaternion().integrate(angularVelocity, 0.5, new Vector3(0, 0, 0)).toArray()).toEqual(identity);
        });

        it('小步长下与解析旋转（fromAxisAngle）在 O(dt²) 内一致', () =>
        {
            const dt = 0.001;
            const integrated = new Quaternion().integrate(angularVelocity, dt, new Vector3(1, 1, 1));
            // 只有 z 轴角速度生效（factor = (1,1,1)）
            const analytic = new Quaternion().fromAxisAngle(new Vector3(0, 0, 1), angularVelocity.z * dt);

            expect(integrated.x).toBeCloseTo(analytic.x, 5);
            expect(integrated.y).toBeCloseTo(analytic.y, 5);
            expect(integrated.z).toBeCloseTo(analytic.z, 5);
            expect(integrated.w).toBeCloseTo(analytic.w, 5);
        });

        it('integrateTo 写入 target 且不改动自身', () =>
        {
            const q = new Quaternion().fromAxisAngle(new Vector3(0, 0, 1), 0.1);
            const before = q.toArray();
            const target = new Quaternion();

            expect(q.integrateTo(angularVelocity, 0.01, new Vector3(1, 1, 1), target)).toBe(target);
            expect(q.toArray()).toEqual(before);

            const inPlace = q.clone().integrate(angularVelocity, 0.01, new Vector3(1, 1, 1));
            expect(target.x).toBeCloseTo(inPlace.x, 12);
            expect(target.w).toBeCloseTo(inPlace.w, 12);
        });
    });

    describe('fromEuler / fromMatrix / toString / random', () =>
    {
        it('六种 RotationOrder 都与 Matrix4x4.fromRotation 表示同一个旋转', () =>
        {
            const orders = [RotationOrder.XYZ, RotationOrder.YXZ, RotationOrder.ZXY, RotationOrder.ZYX, RotationOrder.YZX, RotationOrder.XZY];
            const point = new Vector3(1, 2, -0.5);

            for (const order of orders)
            {
                const q = new Quaternion().fromEuler(0.3, -0.7, 1.1, order);
                const matrix = new Matrix4x4().fromRotation(0.3, -0.7, 1.1, order);

                const byQuaternion = q.rotatePoint(point);
                const byMatrix = matrix.transformPoint3(point);

                expect(byQuaternion.x, `order=${order} x`).toBeCloseTo(byMatrix.x, 10);
                expect(byQuaternion.y, `order=${order} y`).toBeCloseTo(byMatrix.y, 10);
                expect(byQuaternion.z, `order=${order} z`).toBeCloseTo(byMatrix.z, 10);
            }
        });

        it('fromMatrix：单位矩阵得到单位四元数', () =>
        {
            const q = new Quaternion();

            expect(q.fromMatrix(new Matrix4x4())).toBe(q);
            expect(q.x).toBeCloseTo(0, 10);
            expect(q.y).toBeCloseTo(0, 10);
            expect(q.z).toBeCloseTo(0, 10);
            expect(q.w).toBeCloseTo(1, 10);
        });

        it('toString 输出四个分量', () =>
        {
            expect(new Quaternion(1, 2, 3, 4).toString()).toBe('{this.x:1 this.y:2 this.z:3 this.w:4}');
        });

        it('静态与实例 random 都产生单位四元数', () =>
        {
            for (let i = 0; i < 5; i++)
            {
                expect(Quaternion.random().magnitude).toBeCloseTo(1, 12);

                const q = new Quaternion();
                expect(q.random()).toBe(q);
                expect(q.magnitude).toBeCloseTo(1, 12);
            }
        });
    });
});
