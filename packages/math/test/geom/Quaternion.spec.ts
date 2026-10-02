import { RotationOrder } from '../../src/enums/RotationOrder';
import { eulerRandom } from '../../src/geom/eulerOps';
import { mat4FromQuaternion, mat4FromRotation, mat4Identity, mat4TransformPoint3 } from '../../src/geom/matrix4x4Ops';
import {
    quatCopy,
    quatEquals,
    quatFromArray,
    quatFromAxisAngle,
    quatFromEuler,
    quatFromMatrix,
    quatFromUnitVectors,
    quatIntegrate,
    quatInverse,
    quatLerp,
    quatMagnitude,
    quatMult,
    quatMultiplyVector,
    quatNormalize,
    quatNormalizeFast,
    quatRandom,
    quatRotatePoint,
    quatSet,
    quatSlerp,
    quatToArray,
    quatToAxisAngle,
    quatToString,
    quatVmult,
    type QuaternionLike,
    type WritableQuaternionLike,
} from '../../src/geom/quaternionOps';
import { vec3Copy, vec3Equals, vec3Negate, vec3Normalized, vec3Random } from '../../src/geom/vector3Ops';

import { assert, describe, expect, it } from 'vitest';
const { equal, deepEqual } = assert;

/**
 * issue #134 阶段 C-e：`Quaternion` 的 class 已删除，本文件由 class 行为用例改写为
 * **同义纯函数用例**，断言逐条保留。改写约定：
 *
 * - `new Quaternion(x, y, z, w)` → {@link q4}（纯数据字面量，缺省 `w = 1`）；
 * - 实例方法 → 同名纯函数（`q.clone()` → `quatCopy(q)`、`q.multTo(b)` → `quatMult(q, b)`、
 *   `q.rotatePoint(v)` → `quatRotatePoint(q, v)` …）；
 * - 需要结果带 `Vector3` 方法的断言，显式传 `new Vector3()` 当 `out`；
 * - `q.slerpTo(qb, t, out)` 在 class 里有一条 `qb === out` 时先 clone 的保护，纯函数层没有，
 *   所以断言里显式写 `quatSlerp(qa, quatCopy(shared), t, shared)`；
 * - `q.toAxisAngle()` 在 class 里会**先 `this.normalize()`**（副作用），纯函数层刻意不含它
 *   （见 `quaternionOps.quatToAxisAngle` 的说明），用例里显式补一次 `quatNormalize`。
 */

/** 纯数据四元数字面量（原 `new Quaternion(x, y, z, w)`，缺省 `w = 1`） */
function q4(x = 0, y = 0, z = 0, w = 1): WritableQuaternionLike
{
    return { x, y, z, w };
}

describe('Quaternion', () =>
{
    it('四元素正值与负值等价', () =>
    {
        const quaternion0 = quatRandom();
        const quaternion1 = quatCopy(quaternion0);
        quaternion1.x *= -1;
        quaternion1.y *= -1;
        quaternion1.z *= -1;
        quaternion1.w *= -1;

        const matrix0 = mat4FromQuaternion(quaternion0);
        const matrix1 = mat4FromQuaternion(quaternion1);

        deepEqual(matrix0, matrix1);
    });

    it('rotatePoint', () =>
    {
        const quat = quatRandom();

        const v = vec3Random();

        const v1 = { x: 0, y: 0, z: 0 };
        quatRotatePoint(quat, v, v1);
        const v2 = mat4TransformPoint3(mat4FromQuaternion(quat), v, { x: 0, y: 0, z: 0 });

        assert.ok(
            vec3Equals(v1, v2)
        );
    });

    it('inverse', () =>
    {
        const quat = quatRandom();

        const v = vec3Random();

        const invQ = quatInverse(quat);

        const v1 = { x: 0, y: 0, z: 0 };
        quatRotatePoint(quat, v, v1);
        const v2 = { x: 0, y: 0, z: 0 };
        quatRotatePoint(invQ, v1, v2);

        assert.ok(
            vec3Equals(v, v2)
        );
    });

    it('creation', () =>
    {
        const q = q4(1, 2, 3, 4);
        equal(q.x, 1, 'Creating should set the first parameter to the x value');
        equal(q.y, 2, 'Creating should set the second parameter to the y value');
        equal(q.z, 3, 'Creating should set the third parameter to the z value');
        equal(q.w, 4, 'Creating should set the third parameter to the z value');
    });

    it('fromMatrix', () =>
    {
        const euler = eulerRandom();
        const quaternion = quatFromEuler(euler.x, euler.y, euler.z, euler.order);

        //
        const matrix = mat4FromRotation(euler.x, euler.y, euler.z, euler.order);
        const quaternion1 = quatFromMatrix(matrix);

        deepEqual(quatEquals(quaternion, quaternion1), true);
    });

    it('fromEuler', () =>
    {
        const euler = eulerRandom();
        const quaternion = quatFromEuler(euler.x, euler.y, euler.z, euler.order);

        //
        const matrix = mat4FromRotation(euler.x, euler.y, euler.z, euler.order);
        const quaternion1 = quatFromMatrix(matrix);

        deepEqual(quatEquals(quaternion, quaternion1), true);
    });

    it('setFromVectors', () =>
    {
        const q = q4();

        {
            const vec30 = vec3Normalized(vec3Random());
            const vec31 = vec3Normalized(vec3Random());
            quatFromUnitVectors(vec30, vec31, q);

            const result = { x: 0, y: 0, z: 0 };
            quatVmult(q, vec30, result);
            assert.ok(vec3Equals(result, vec31));
        }

        {
            //
            const vec30 = vec3Normalized(vec3Random());
            const vec31 = vec3Normalized(vec3Random());
            vec3Negate(vec30, vec31);
            //
            quatFromUnitVectors(vec30, vec31, q);
            const result = { x: 0, y: 0, z: 0 };
            quatVmult(q, vec30, result);
            //
            assert.ok(vec3Equals(result, vec31));
        }
    });

    it('slerp', () =>
    {
        const qa = q4();
        const qb = q4();

        // class 的 `slerpTo` 在 `qb === out` 时先 clone 一份，纯函数层没有这层保护 → 显式 clone
        quatSlerp(qa, quatCopy(qb), 0.5, qb);
        deepEqual(qa, qb);

        quatFromAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI / 4, qa);
        quatFromAxisAngle({ x: 0, y: 0, z: 1 }, -Math.PI / 4, qb);
        quatSlerp(qa, quatCopy(qb), 0.5, qb);
        deepEqual(qb, q4());
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
            const q = q4();

            expect([q.x, q.y, q.z, q.w]).toEqual([0, 0, 0, 1]);
            expect(quatMagnitude(q)).toBe(1);
        });

        it('set 返回自身并按参数写入四个分量', () =>
        {
            const q = q4();

            expect(quatSet(1, 2, 3, 4, q)).toBe(q);
            expect([q.x, q.y, q.z, q.w]).toEqual([1, 2, 3, 4]);
        });

        it('magnitude 是模：(3, 4, 0, 0) → 5', () =>
        {
            expect(quatMagnitude(q4(3, 4, 0, 0))).toBe(5);
            expect(quatMagnitude(q4(0, 0, 0, -2))).toBe(2);
        });

        it('copy 就地写入并返回自身，clone 是独立副本', () =>
        {
            const source = q4(1, 2, 3, 4);
            const target = q4();

            expect(quatCopy(source, target)).toBe(target);
            expect([target.x, target.y, target.z, target.w]).toEqual([1, 2, 3, 4]);

            const cloned = quatCopy(source);
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
            const q = q4(1, 2, 3, 4);

            expect(quatEquals(q, q4(1, 2, 3, 4))).toBe(true);
            // 四元数与它的负值表示同一个旋转
            expect(quatEquals(q, q4(-1, -2, -3, -4))).toBe(true);
        });

        it('分量不同则不等，精度可控', () =>
        {
            const q = q4(1, 2, 3, 4);

            expect(quatEquals(q, q4(1, 2, 3, 5))).toBe(false);
            // 差 0.001：默认精度（1e-6）下不等，放宽到 0.01 后相等
            expect(quatEquals(q, q4(1.001, 2, 3, 4))).toBe(false);
            expect(quatEquals(q, q4(1.001, 2, 3, 4), 0.01)).toBe(true);
        });
    });

    describe('equals（x = 0 的回归用例，#489）', () =>
    {
        it('单位四元数与自身相等', () =>
        {
            expect(quatEquals(q4(), q4())).toBe(true);
            // 单位四元数与它的负值表示同一个旋转
            expect(quatEquals(q4(), q4(0, 0, 0, -1))).toBe(true);
        });

        it('x = 0 的四元数与自身相等，与取负版本等价', () =>
        {
            const q = q4(0, 1, 2, 3);

            expect(quatEquals(q, q4(0, 1, 2, 3))).toBe(true);
            expect(quatEquals(q, q4(0, -1, -2, -3))).toBe(true);
        });

        it('绕 Y 轴的纯旋转与自身相等（x 分量恰为 0）', () =>
        {
            const axis = { x: 0, y: 1, z: 0 };
            const a = quatFromAxisAngle(axis, Math.PI / 2);
            const b = quatFromAxisAngle(axis, Math.PI / 2);

            expect(quatEquals(a, b)).toBe(true);
        });

        it('x = 0 时依然能区分不同的四元数', () =>
        {
            expect(quatEquals(q4(), q4(0, 0, 0, 0.99))).toBe(false);
            expect(quatEquals(q4(0, 1, 2, 3), q4(0, 1, 2, 4))).toBe(false);
            // 正交四元数（内积为 0）也不相等
            expect(quatEquals(q4(1, 0, 0, 0), q4(0, 1, 0, 0))).toBe(false);
        });
    });

    describe('fromArray / toArray', () =>
    {
        it('静态与实例 fromArray 一致，支持 offset', () =>
        {
            const values = [9, 9, 1, 2, 3, 4];

            const fromStatic = quatFromArray(values, 2);
            expect([fromStatic.x, fromStatic.y, fromStatic.z, fromStatic.w]).toEqual([1, 2, 3, 4]);

            const q = q4();
            expect(quatFromArray(values, 2, q)).toBe(q);
            expect([q.x, q.y, q.z, q.w]).toEqual([1, 2, 3, 4]);
        });

        it('toArray 支持 offset 与复用数组，且能往返还原', () =>
        {
            const q = q4(1, 2, 3, 4);

            expect(quatToArray(q)).toEqual([1, 2, 3, 4]);

            const buffer = [0, 0, 0, 0, 0, 0];
            expect(quatToArray(q, buffer, 2)).toBe(buffer);
            expect(buffer).toEqual([0, 0, 1, 2, 3, 4]);

            // 往返
            const restored = quatFromArray(quatToArray(q));
            expect([restored.x, restored.y, restored.z, restored.w]).toEqual([1, 2, 3, 4]);
        });
    });

    describe('乘法与逆', () =>
    {
        /** 用逐分量断言（绕开 equals 在 x === 0 时的缺陷） */
        function expectQuaternion(actual: QuaternionLike, x: number, y: number, z: number, w: number, precision = 10)
        {
            expect(actual.x).toBeCloseTo(x, precision);
            expect(actual.y).toBeCloseTo(y, precision);
            expect(actual.z).toBeCloseTo(z, precision);
            expect(actual.w).toBeCloseTo(w, precision);
        }

        it('mult 就地：乘单位四元数不变', () =>
        {
            const q = quatFromAxisAngle(vec3Normalized({ x: 1, y: 2, z: 3  }), 0.7);
            const before = [q.x, q.y, q.z, q.w];

            expect(quatMult(q, q4(), q)).toBe(q);
            expect([q.x, q.y, q.z, q.w]).toEqual(before);
        });

        it('multTo 写入 target 且不改动自身', () =>
        {
            const a = quatFromAxisAngle({ x: 1, y: 0, z: 0 }, 0.4);
            const b = quatFromAxisAngle({ x: 0, y: 1, z: 0 }, 0.9);
            const before = [a.x, a.y, a.z, a.w];
            const target = q4();

            expect(quatMult(a, b, target)).toBe(target);
            expect(target).not.toBe(a);
            expect([a.x, a.y, a.z, a.w]).toEqual(before);

            // 与就地版本一致
            const inPlace = quatMult(quatCopy(a), b);
            expectQuaternion(target, inPlace.x, inPlace.y, inPlace.z, inPlace.w, 12);
        });

        it('q ⊗ q⁻¹ 是单位四元数', () =>
        {
            const q = quatFromAxisAngle(vec3Normalized({ x: 0.3, y: -0.5, z: 0.8  }), 1.2);
            const product = quatMult(quatCopy(q), quatInverse(q));

            expectQuaternion(product, 0, 0, 0, 1);
        });

        it('inverse 就地共轭（x/y/z 取反、w 不变），两次还原', () =>
        {
            const q = q4(0.5, -0.25, 0.125, 0.75);
            const conjugated = quatInverse(q);

            expect([conjugated.x, conjugated.y, conjugated.z, conjugated.w]).toEqual([-0.5, 0.25, -0.125, 0.75]);
            expect([q.x, q.y, q.z, q.w], '不就地修改原对象').toEqual([0.5, -0.25, 0.125, 0.75]);

            // 两次共轭还原
            expect([quatInverse(quatInverse(q)).x, quatInverse(quatInverse(q)).y]).toEqual([0.5, -0.25]);

            // inverseTo 写 target 且不改自身
            const target = q4();
            expect(quatInverse(q, target)).toBe(target);
            expect([target.x, target.y, target.z, target.w]).toEqual([-0.5, 0.25, -0.125, 0.75]);
        });

        it('multiplyVector(v) 逐位等于 q ⊗ (v, 0)', () =>
        {
            const q = quatFromAxisAngle(vec3Normalized({ x: 1, y: -2, z: 0.5  }), 0.8);
            const v = { x: 1, y: -2, z: 0.5 };

            const byMultiplyVector = quatMultiplyVector(q, v);
            const byMult = quatMult(q, q4(v.x, v.y, v.z, 0));

            expectQuaternion(byMultiplyVector, byMult.x, byMult.y, byMult.z, byMult.w, 12);
        });

        it('(q ⊗ v) ⊗ q⁻¹ = rotatePoint(v) = vmult(v)', () =>
        {
            const q = quatFromAxisAngle(vec3Normalized({ x: 1, y: 2, z: 3  }), 0.9);
            const v = { x: 1, y: -2, z: 0.5 };

            const restored = quatMult(quatMultiplyVector(q, v), quatInverse(q));
            const rotated = quatRotatePoint(q, v);
            const multiplied = quatVmult(q, v);

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
            const v = { x: 1, y: 2, z: -3 };
            const unchanged = quatRotatePoint(q4(), v);

            expect(unchanged.x).toBeCloseTo(1, 12);
            expect(unchanged.y).toBeCloseTo(2, 12);
            expect(unchanged.z).toBeCloseTo(-3, 12);

            const turned = quatRotatePoint(quatFromAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI / 2), { x: 1, y: 0, z: 0 });
            expect(turned.x).toBeCloseTo(0, 10);
            expect(turned.y).toBeCloseTo(1, 10);
            expect(turned.z).toBeCloseTo(0, 10);
        });

        it('rotatePoint / vmult 返回 target 且不改动入参', () =>
        {
            const q = quatFromAxisAngle({ x: 0, y: 1, z: 0 }, 0.6);
            const point = { x: 1, y: 2, z: 3 };
            const target = { x: 0, y: 0, z: 0 };

            expect(quatRotatePoint(q, point, target)).toBe(target);
            expect(quatVmult(q, point, target)).toBe(target);
            expect([point.x, point.y, point.z], 'rotatePoint 不改动入参').toEqual([1, 2, 3]);
        });

        it('与 Matrix4x4.fromQuaternion 作用同一点的结果一致', () =>
        {
            for (let i = 0; i < 5; i++)
            {
                const q = quatRandom();
                const v = vec3Random(10, true);
                const byQuaternion = quatRotatePoint(q, v);
                const byMatrix = mat4TransformPoint3(mat4FromQuaternion(q), v);

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
            const q = q4();

            expect(quatFromAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI / 2, q)).toBe(q);
            expect(q.x).toBeCloseTo(0, 12);
            expect(q.y).toBeCloseTo(Math.SQRT1_2, 12);
            expect(q.z).toBeCloseTo(0, 12);
            expect(q.w).toBeCloseTo(Math.SQRT1_2, 12);
            expect(quatMagnitude(q)).toBeCloseTo(1, 12);
        });

        it('fromAxisAngle ⇄ toAxisAngle 往返', () =>
        {
            const axis = { x: 0, y: 1, z: 0 };
            const q = quatFromAxisAngle(axis, 0.3);
            const [resultAxis, angle] = quatToAxisAngle(q);

            expect(resultAxis.x).toBeCloseTo(0, 10);
            expect(resultAxis.y).toBeCloseTo(1, 10);
            expect(resultAxis.z).toBeCloseTo(0, 10);
            expect(angle).toBeCloseTo(0.3, 10);
        });

        it('角度 0 时轴退化为零向量（s < 0.001 分支）', () =>
        {
            const [axis, angle] = quatToAxisAngle(quatFromAxisAngle({ x: 0, y: 1, z: 0 }, 0));

            expect(angle).toBe(0);
            expect([axis.x, axis.y, axis.z]).toEqual([0, 0, 0]);
        });

        it('toAxisAngle 复用传入的轴向量，并把自身归一化', () =>
        {
            const target = { x: 0, y: 0, z: 0 };
            // 未归一化的四元数：(2, 0, 0, 2) 表示绕 x 轴 90°
            const q = q4(2, 0, 0, 2);

            // 原 class 的 `toAxisAngle()` 会先做 `this.normalize()`（副作用），
            // 纯函数层刻意不含它 —— 这里显式补一次，语义不变
            quatNormalize(q, 1, q);
            const result = quatToAxisAngle(q, target);

            expect(result[0]).toBe(target);
            expect(target.x).toBeCloseTo(1, 10);
            expect(result[1]).toBeCloseTo(Math.PI / 2, 10);
            // toAxisAngle 内部先 normalize 自身
            expect(quatMagnitude(q)).toBeCloseTo(1, 12);
        });
    });

    describe('fromUnitVectors', () =>
    {
        it('把 u 旋到 v，且结果始终是单位四元数', () =>
        {
            const q = q4();

            for (let i = 0; i < 5; i++)
            {
                const u = vec3Normalized(vec3Random(2, true));
                const v = vec3Normalized(vec3Random(2, true));
                const uBefore = vec3Copy(u);

                quatFromUnitVectors(u, v, q);
                expect(quatMagnitude(q)).toBeCloseTo(1, 12);

                const result = quatVmult(q, u);
                expect(result.x).toBeCloseTo(v.x, 6);
                expect(result.y).toBeCloseTo(v.y, 6);
                expect(result.z).toBeCloseTo(v.z, 6);
                // 不改动入参
                expect([u.x, u.y, u.z]).toEqual([uBefore.x, uBefore.y, uBefore.z]);
            }
        });

        it('反平行（u = -v）也把 u 旋到 v', () =>
        {
            const q = q4();
            const u = vec3Normalized({ x: 1, y: 2, z: 3  });
            const v = vec3Negate(u);

            quatFromUnitVectors(u, v, q);
            const result = quatVmult(q, u);

            expect(result.x).toBeCloseTo(v.x, 8);
            expect(result.y).toBeCloseTo(v.y, 8);
            expect(result.z).toBeCloseTo(v.z, 8);
        });
    });

    describe('slerp / slerpTo / lerp', () =>
    {
        it('slerp：t = 0 保持不变、t = 1 变成 qb', () =>
        {
            const qa = quatFromAxisAngle({ x: 0, y: 0, z: 1 }, 0.2);
            const qb = quatFromAxisAngle({ x: 1, y: 0, z: 0 }, 1.1);

            const at0 = quatSlerp(qa, qb, 0);
            expect([at0.x, at0.y, at0.z, at0.w]).toEqual([qa.x, qa.y, qa.z, qa.w]);

            const at1 = quatSlerp(qa, qb, 1);
            expect(at1.x).toBeCloseTo(qb.x, 12);
            expect(at1.y).toBeCloseTo(qb.y, 12);
            expect(at1.z).toBeCloseTo(qb.z, 12);
            expect(at1.w).toBeCloseTo(qb.w, 12);
        });

        it('同轴时 slerp(0.5) 恰好是角度中点', () =>
        {
            const axis = { x: 0, y: 0, z: 1 };
            const qa = quatFromAxisAngle(axis, 0);
            const qb = quatFromAxisAngle(axis, Math.PI / 2);
            const half = quatFromAxisAngle(axis, Math.PI / 4);
            const actual = quatSlerp(qa, qb, 0.5);

            expect(actual.x).toBeCloseTo(half.x, 12);
            expect(actual.y).toBeCloseTo(half.y, 12);
            expect(actual.z).toBeCloseTo(half.z, 12);
            expect(actual.w).toBeCloseTo(half.w, 12);
        });

        it('目标是 qb 的取负版本时结果不变（cosHalfTheta < 0 分支）', () =>
        {
            const axis = { x: 0, y: 0, z: 1 };
            const qa = quatFromAxisAngle(axis, 0);
            const qb = quatFromAxisAngle(axis, Math.PI / 2);
            const negated = q4(-qb.x, -qb.y, -qb.z, -qb.w);

            const fromQb = quatSlerp(qa, qb, 0.5);
            const fromNegated = quatSlerp(qa, negated, 0.5);

            expect(fromNegated.x).toBeCloseTo(fromQb.x, 12);
            expect(fromNegated.y).toBeCloseTo(fromQb.y, 12);
            expect(fromNegated.z).toBeCloseTo(fromQb.z, 12);
            expect(fromNegated.w).toBeCloseTo(fromQb.w, 12);
        });

        it('极小夹角走线性插值分支，结果仍是单位四元数', () =>
        {
            const axis = { x: 0, y: 0, z: 1 };
            const qa = quatFromAxisAngle(axis, 0.5);
            const qb = quatFromAxisAngle(axis, 0.5 + 1e-9);

            const actual = quatSlerp(qa, qb, 0.5);

            // 两端几乎重合 ⇒ 结果几乎等于 qb
            expect(actual.z).toBeCloseTo(qb.z, 8);
            expect(actual.w).toBeCloseTo(qb.w, 8);
            expect(quatMagnitude(actual)).toBeCloseTo(1, 12);
        });

        it('slerpTo 写入 out、不改自身；out 与 qb 是同一对象时也不破坏', () =>
        {
            const qa = quatFromAxisAngle({ x: 0, y: 0, z: 1 }, 0.2);
            const qb = quatFromAxisAngle({ x: 0, y: 0, z: 1 }, 1.0);
            const before = [qa.x, qa.y, qa.z, qa.w];
            const out = q4();

            expect(quatSlerp(qa, qb, 0.5, out)).toBe(out);
            expect([qa.x, qa.y, qa.z, qa.w]).toEqual(before);

            // qb 与 out 同一对象：class 的 `slerpTo` 内部先 clone，纯函数层要显式 clone
            const expected = quatSlerp(qa, qb, 0.5);
            const shared = quatCopy(qb);

            quatSlerp(qa, quatCopy(shared), 0.5, shared);

            expect(shared.x).toBeCloseTo(expected.x, 12);
            expect(shared.y).toBeCloseTo(expected.y, 12);
            expect(shared.z).toBeCloseTo(expected.z, 12);
            expect(shared.w).toBeCloseTo(expected.w, 12);
        });

        it('lerp：端点取两端、同轴中点等于角度中点，且不改动入参', () =>
        {
            const axis = { x: 0, y: 0, z: 1 };
            const qa = quatFromAxisAngle(axis, 0);
            const qb = quatFromAxisAngle(axis, Math.PI / 2);

            const at0 = quatLerp(qa, qb, 0);
            const at1 = quatLerp(qa, qb, 1);
            const atHalf = quatLerp(qa, qb, 0.5);

            expect(at0.w).toBeCloseTo(qa.w, 12);
            expect(at1.z).toBeCloseTo(qb.z, 12);
            expect(at1.w).toBeCloseTo(qb.w, 12);

            // 同轴时线性插值 + 归一化 = 球面插值
            const expected = quatFromAxisAngle(axis, Math.PI / 4);
            expect(atHalf.z).toBeCloseTo(expected.z, 12);
            expect(atHalf.w).toBeCloseTo(expected.w, 12);
            expect(quatMagnitude(atHalf)).toBeCloseTo(1, 12);

            // 不改动入参
            expect([qa.x, qa.y, qa.z, qa.w]).toEqual([0, 0, 0, 1]);
            expect(qb.z).toBeCloseTo(Math.SQRT1_2, 12);
        });
    });

    describe('normalize / normalizeFast', () =>
    {
        it('normalize：放大的四元数回到单位，零四元数变成单位四元数', () =>
        {
            const q = q4(3, 4, 0, 0);

            expect(quatNormalize(q, 1, q)).toBe(q);
            expect(q.x).toBeCloseTo(0.6, 12);
            expect(q.y).toBeCloseTo(0.8, 12);
            expect(q.z).toBe(0);
            expect(q.w).toBe(0);

            expect(quatToArray(quatNormalize(q4(0, 0, 0, 0)))).toEqual([0, 0, 0, 1]);
            expect(quatToArray(quatNormalize(q4(0, 2, 0, 0)))).toEqual([0, 1, 0, 0]);
        });

        it('normalize(val) 把模变成 val', () =>
        {
            expect(quatMagnitude(quatNormalize(q4(3, 4, 0, 0), 2))).toBeCloseTo(2, 12);
            expect(quatMagnitude(quatNormalize(q4(0, 0, 0, 5), 0.5))).toBeCloseTo(0.5, 12);
        });

        it('normalizeFast：单位四元数不变，|q|² = 3 时被清零（f === 0 分支）', () =>
        {
            const unit = q4();

            expect(quatNormalizeFast(unit, unit)).toBe(unit);
            expect(quatToArray(unit)).toEqual([0, 0, 0, 1]);

            // |(1,1,1,0)|² = 3 ⇒ f = (3 - 3) / 2 = 0 ⇒ 全部分量置零
            expect(quatToArray(quatNormalizeFast(q4(1, 1, 1, 0)))).toEqual([0, 0, 0, 0]);
        });
    });

    describe('integrate', () =>
    {
        const angularVelocity = { x: 0, y: 0, z: 2 };
        const factor = { x: 1, y: 0, z: 1 };

        it('dt = 0 / 角速度 0 / factor 0 时都不变', () =>
        {
            const identity = [0, 0, 0, 1];

            expect(quatToArray(quatIntegrate(q4(), { x: 1, y: 2, z: 3 }, 0, factor))).toEqual(identity);
            expect(quatToArray(quatIntegrate(q4(), { x: 0, y: 0, z: 0 }, 0.5, factor))).toEqual(identity);
            expect(quatToArray(quatIntegrate(q4(), angularVelocity, 0.5, { x: 0, y: 0, z: 0 }))).toEqual(identity);
        });

        it('小步长下与解析旋转（fromAxisAngle）在 O(dt²) 内一致', () =>
        {
            const dt = 0.001;
            const integrated = quatIntegrate(q4(), angularVelocity, dt, { x: 1, y: 1, z: 1 });
            // 只有 z 轴角速度生效（factor = (1,1,1)）
            const analytic = quatFromAxisAngle({ x: 0, y: 0, z: 1 }, angularVelocity.z * dt);

            expect(integrated.x).toBeCloseTo(analytic.x, 5);
            expect(integrated.y).toBeCloseTo(analytic.y, 5);
            expect(integrated.z).toBeCloseTo(analytic.z, 5);
            expect(integrated.w).toBeCloseTo(analytic.w, 5);
        });

        it('integrateTo 写入 target 且不改动自身', () =>
        {
            const q = quatFromAxisAngle({ x: 0, y: 0, z: 1 }, 0.1);
            const before = quatToArray(q);
            const target = q4();

            expect(quatIntegrate(q, angularVelocity, 0.01, { x: 1, y: 1, z: 1 }, target)).toBe(target);
            expect(quatToArray(q)).toEqual(before);

            const inPlace = quatIntegrate(quatCopy(q), angularVelocity, 0.01, { x: 1, y: 1, z: 1 });
            expect(target.x).toBeCloseTo(inPlace.x, 12);
            expect(target.w).toBeCloseTo(inPlace.w, 12);
        });
    });

    describe('fromEuler / fromMatrix / toString / random', () =>
    {
        it('六种 RotationOrder 都与 Matrix4x4.fromRotation 表示同一个旋转', () =>
        {
            const orders = [RotationOrder.XYZ, RotationOrder.YXZ, RotationOrder.ZXY, RotationOrder.ZYX, RotationOrder.YZX, RotationOrder.XZY];
            const point = { x: 1, y: 2, z: -0.5 };

            for (const order of orders)
            {
                const q = quatFromEuler(0.3, -0.7, 1.1, order);
                const matrix = mat4FromRotation(0.3, -0.7, 1.1, order);

                const byQuaternion = quatRotatePoint(q, point);
                const byMatrix = mat4TransformPoint3(matrix, point);

                expect(byQuaternion.x, `order=${order} x`).toBeCloseTo(byMatrix.x, 10);
                expect(byQuaternion.y, `order=${order} y`).toBeCloseTo(byMatrix.y, 10);
                expect(byQuaternion.z, `order=${order} z`).toBeCloseTo(byMatrix.z, 10);
            }
        });

        it('fromMatrix：单位矩阵得到单位四元数', () =>
        {
            const q = q4();

            expect(quatFromMatrix(mat4Identity(), q)).toBe(q);
            expect(q.x).toBeCloseTo(0, 10);
            expect(q.y).toBeCloseTo(0, 10);
            expect(q.z).toBeCloseTo(0, 10);
            expect(q.w).toBeCloseTo(1, 10);
        });

        it('toString 输出四个分量', () =>
        {
            expect(quatToString(q4(1, 2, 3, 4))).toBe('{this.x:1 this.y:2 this.z:3 this.w:4}');
        });

        it('静态与实例 random 都产生单位四元数', () =>
        {
            for (let i = 0; i < 5; i++)
            {
                expect(quatMagnitude(quatRandom())).toBeCloseTo(1, 12);

                const q = q4();

                expect(quatRandom(q)).toBe(q);
                expect(quatMagnitude(q)).toBeCloseTo(1, 12);
            }
        });
    });

    describe('参数放宽（issue #134 B7 / C-e）：Vector3 入参收纯字面量', () =>
    {
        // 7 处入参放宽为 Vector3Like；`out` 参数由调用方显式给出（纯函数原样返回它）
        const axis = { x: 0, y: 0, z: 1 };
        const u = { x: 1, y: 0, z: 0 };
        const v = { x: 0, y: 1, z: 0 };
        const vector = { x: 1, y: 2, z: -0.5 };
        const vector3 = { x: 1, y: 2, z: -0.5 };

        it('fromAxisAngle / fromUnitVectors：字面量与 Vector3 实参逐位相同，且返回传入的 out', () =>
        {
            const byLike = q4();
            const byClass = q4();

            expect(quatFromAxisAngle(axis, Math.PI / 3, byLike)).toBe(byLike);
            quatFromAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI / 3, byClass);
            expect(quatToArray(byLike)).toEqual(quatToArray(byClass));

            expect(quatFromUnitVectors(u, v, byLike)).toBe(byLike);
            quatFromUnitVectors({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, byClass);
            expect(quatToArray(byLike)).toEqual(quatToArray(byClass));
        });

        it('multiplyVector / rotatePoint / vmult：字面量与 Vector3 实参逐位相同，out 原样返回', () =>
        {
            const q = quatFromEuler(0.3, -0.7, 1.1);

            // 显式传 out：纯函数返回的就是这个 out（返回形态不退化）
            const byMultiplyVector = q4();

            expect(quatMultiplyVector(q, vector, byMultiplyVector)).toBe(byMultiplyVector);
            expect(quatToArray(byMultiplyVector)).toEqual(quatToArray(quatMultiplyVector(q, vector3)));

            const byRotatePoint = { x: 0, y: 0, z: 0 };

            expect(quatRotatePoint(q, vector, byRotatePoint)).toBe(byRotatePoint);

            const rotateLike = quatRotatePoint(q, vector);
            const rotateClass = quatRotatePoint(q, vector3);

            expect([byRotatePoint.x, byRotatePoint.y, byRotatePoint.z])
                .toEqual([rotateClass.x, rotateClass.y, rotateClass.z]);
            expect([rotateLike.x, rotateLike.y, rotateLike.z]).toEqual([rotateClass.x, rotateClass.y, rotateClass.z]);

            const byVmult = { x: 0, y: 0, z: 0 };

            expect(quatVmult(q, vector, byVmult)).toBe(byVmult);

            const vmultLike = quatVmult(q, vector);
            const vmultClass = quatVmult(q, vector3);

            expect([byVmult.x, byVmult.y, byVmult.z]).toEqual([vmultClass.x, vmultClass.y, vmultClass.z]);
            expect([vmultLike.x, vmultLike.y, vmultLike.z]).toEqual([vmultClass.x, vmultClass.y, vmultClass.z]);
        });

        it('integrate / integrateTo：字面量与 Vector3 实参逐位相同，target 原样返回', () =>
        {
            const angularVelocity = { x: 0.5, y: -0.25, z: 2 };
            const angularFactor = { x: 1, y: 0, z: 1 };
            const initial = quatFromEuler(0.2, 0.4, -0.6);
            const byLike = quatCopy(initial);
            const byClass = quatCopy(initial);

            expect(quatIntegrate(byLike, angularVelocity, 0.01, angularFactor, byLike)).toBe(byLike);
            quatIntegrate(byClass, { x: 0.5, y: -0.25, z: 2 }, 0.01, { x: 1, y: 0, z: 1 }, byClass);
            expect(quatToArray(byLike)).toEqual(quatToArray(byClass));

            const target = q4();
            const byIntegrateTo = quatIntegrate(initial, angularVelocity, 0.01, angularFactor, target);

            expect(byIntegrateTo).toBe(target);
            // integrateTo 与 integrate 语义相同（都是在自身基础上累加）
            expect(quatToArray(target)).toEqual(quatToArray(quatIntegrate(quatCopy(initial), angularVelocity, 0.01, angularFactor)));
        });
    });
});