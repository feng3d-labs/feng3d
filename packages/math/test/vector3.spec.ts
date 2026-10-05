import { describe, expect, it } from 'vitest';

import {
    vec2ToVec3,
    vec3Add,
    vec3AddNumber,
    vec3AddScaled,
    vec3AlmostZero,
    vec3Copy,
    vec3Cross,
    vec3Distance,
    vec3DistanceSquared,
    vec3Divide,
    vec3DivideNumber,
    vec3Dot,
    vec3Equals,
    vec3From,
    vec3FromArray,
    vec3Inverse,
    vec3IsAntiparallel,
    vec3IsZero,
    vec3Length,
    vec3LengthSquared,
    vec3Multiply,
    vec3Negate,
    vec3NormalizeThickness,
    vec3Random,
    vec3ScaleNumber,
    vec3SetZero,
    vec3Sub,
    vec3SubNumber,
    vec3ToVec2,
    vec3Unit,
} from '../src/geom/vector3';
import { VEC3_ZERO } from '../src/geom/vector3';

/**
 * `Vector3`（`packages/math/src/geom/vector3.ts`）——全仓被引用最广的数值类型。
 *
 * ★ **阶段 C-f**：`Vector3` 的 class 已删除，本文件从「class 规格」改写为**同义纯函数用例**
 * （与 C-e 对 `Box3` / `Quaternion` / `Matrix4x4` 的处理一致）：
 *
 * - 原「原地版」＝ 纯函数把 `out` 传成自己；
 * - 原「`…To` 版」＝ 纯函数把 `out` 传成显式目标；
 * - 原 getter（`length` / `lengthSquared`）＝ `vec3Length` / `vec3LengthSquared`；
 * - 原静态工厂 / 静态常量＝ `vec3Xxx` / `VEC3_*`。
 *
 * 断言逐条保留（同一批数值、同一批关系），只换写法。
 */

const v = (x: number, y: number, z: number) => ({ x: x, y: y, z: z });

describe('Vector3（math/geom）', () =>
{
    describe('★ 构造与基础', () =>
    {
        it('默认构造是 (0,0,0)；三参构造按顺序写入', () =>
        {
            const a = vec3From(0, 0, 0);

            expect(a.x).toBe(0);
            expect(a.y).toBe(0);
            expect(a.z).toBe(0);

            const b = v(1, 2, 3);

            expect(b.x).toBe(1);
            expect(b.y).toBe(2);
            expect(b.z).toBe(3);
        });

        it('★ set 写入并返回 out；setZero 归零', () =>
        {
            const a = { x: 0, y: 0, z: 0 };

            expect(vec3From(4, 5, 6, a)).toBe(a);
            expect(a.z).toBe(6);

            vec3SetZero(a);
            expect(a.x).toBe(0);
            expect(a.y).toBe(0);
            expect(a.z).toBe(0);
        });

        it('★ isZero 只在三个分量都为 0 时为真', () =>
        {
            expect(vec3IsZero(v(0, 0, 0))).toBe(true);
            expect(vec3IsZero(v(0, 0, 1e-30))).toBe(false);
            expect(vec3IsZero(v(1, 0, 0))).toBe(false);
        });

        it('★ almostZero 在极小的分量下为真', () =>
        {
            expect(vec3AlmostZero(v(0, 0, 0))).toBe(true);
            expect(vec3AlmostZero(v(1e-20, 0, 0))).toBe(true);
            expect(vec3AlmostZero(v(1, 0, 0))).toBe(false);
        });
    });

    describe('★★ 长度四件套自洽', () =>
    {
        it('★★ lengthSquared === x² + y² + z²，length === √lengthSquared', () =>
        {
            for (const [x, y, z] of [[3, 4, 0], [1, 2, 2], [0, 0, 0], [-2, -3, -6]] as [number, number, number][])
            {
                const a = v(x, y, z);
                const sq = x * x + y * y + z * z;

                expect(vec3LengthSquared(a), `(${x},${y},${z})`).toBeCloseTo(sq, 10);
                expect(vec3Length(a), `(${x},${y},${z})`).toBeCloseTo(Math.sqrt(sq), 10);
            }
        });

        it('★ 单位轴长度为 1：(3,4,0) 长度为 5', () =>
        {
            expect(vec3Length(v(1, 0, 0))).toBeCloseTo(1, 10);
            expect(vec3Length(v(0, 1, 0))).toBeCloseTo(1, 10);
            expect(vec3Length(v(0, 0, 1))).toBeCloseTo(1, 10);
            expect(vec3Length(v(3, 4, 0))).toBeCloseTo(5, 10);
        });
    });

    describe('★★ 归一化', () =>
    {
        it('★★ normalize() 后长度为 1，方向不变', () =>
        {
            const a = v(0, 3, 4);

            vec3NormalizeThickness(a, 1, a);

            expect(vec3Length(a)).toBeCloseTo(1, 6);
            // 方向不变：与单位化后的自身点乘应为 1
            expect(Math.abs(vec3Dot(vec3Unit(v(0, 3, 4)), a))).toBeCloseTo(1, 6);
        });

        it('★ unit() 产生长度为 1 的向量（不破坏原向量）', () =>
        {
            const a = v(0, 3, 4);
            const u = vec3Unit(a);

            expect(vec3Length(u)).toBeCloseTo(1, 6);
            expect(a.y, '原向量不该被改').toBeCloseTo(3, 10);

            // 传 target 时应当复用该对象
            const target = { x: 0, y: 0, z: 0 };

            expect(vec3Unit(a, target)).toBe(target);
            expect(vec3Length(target)).toBeCloseTo(1, 6);
        });
    });

    describe('★★ 距离', () =>
    {
        it('★ distanceSquared / distance 与长度一致', () =>
        {
            const a = v(0, 0, 0);
            const b = v(1, 2, 2);

            expect(vec3DistanceSquared(a, b)).toBeCloseTo(9, 10);
            expect(vec3Distance(a, b)).toBeCloseTo(3, 10);
            expect(vec3Distance(b, a), '距离应对称').toBeCloseTo(3, 10);
        });

        it('★ 同一点距离为 0', () =>
        {
            expect(vec3Distance(v(5, 6, 7), v(5, 6, 7))).toBeCloseTo(0, 10);
        });
    });

    describe('★★ 点积与叉积', () =>
    {
        it('★★ dot：正交为 0、同向为长度积', () =>
        {
            expect(vec3Dot(v(1, 0, 0), v(0, 1, 0))).toBeCloseTo(0, 10);
            expect(vec3Dot(v(1, 0, 0), v(1, 0, 0))).toBeCloseTo(1, 10);
            expect(vec3Dot(v(1, 2, 3), v(4, 5, 6))).toBeCloseTo(32, 10);
        });

        it('★★ cross：x̂ × ŷ = ẑ（右手系）', () =>
        {
            const c = vec3Cross(v(1, 0, 0), v(0, 1, 0));

            expect(c.x).toBeCloseTo(0, 10);
            expect(c.y).toBeCloseTo(0, 10);
            expect(c.z).toBeCloseTo(1, 10);

            // 反向应当是负的
            const d = vec3Cross(v(0, 1, 0), v(1, 0, 0));

            expect(d.z).toBeCloseTo(-1, 10);
        });

        it('★★ cross：自身与自身叉积为零向量；结果与两个输入都正交', () =>
        {
            const a = v(1, 2, 3);

            expect(vec3Length(vec3Cross(a, a))).toBeCloseTo(0, 10);

            const b = v(4, -5, 6);
            const c = vec3Cross(a, b);

            expect(vec3Dot(c, a)).toBeCloseTo(0, 8);
            expect(vec3Dot(c, b)).toBeCloseTo(0, 8);
        });

        it('★★ cross 写 out 且不改自身', () =>
        {
            const a = v(1, 0, 0);
            const b = v(0, 1, 0);
            const out = { x: 0, y: 0, z: 0 };

            expect(vec3Cross(a, b, out)).toBe(out);
            expect(a.x, 'a 不该被改').toBe(1);
            expect(out.z).toBeCloseTo(1, 10);
        });
    });

    describe('★★ 原地版 vs 显式 out 版（与 Vector2 / Vector4 同一约定）', () =>
    {
        it('★★ add / sub / multiply / divide 原地改', () =>
        {
            const a = v(10, 20, 30);

            vec3Add(a, v(1, 2, 3), a);
            expect(a.x).toBeCloseTo(11, 10);
            expect(a.z).toBeCloseTo(33, 10);

            vec3Sub(a, v(1, 2, 3), a);
            expect(a.x).toBeCloseTo(10, 10);

            vec3Multiply(a, v(2, 3, 4), a);
            expect(a.x).toBeCloseTo(20, 10);
            expect(a.z).toBeCloseTo(120, 10);

            vec3Divide(a, v(2, 3, 4), a);
            expect(a.x).toBeCloseTo(10, 10);
            expect(a.z).toBeCloseTo(30, 10);
        });

        it('★★ add / sub / multiply / divide 写 out 且不改自身', () =>
        {
            const a = v(10, 20, 30);
            const out = { x: 0, y: 0, z: 0 };

            expect(vec3Add(a, v(1, 1, 1), out)).toBe(out);
            expect(a.x, 'a 不该被改').toBeCloseTo(10, 10);
            expect(out.z).toBeCloseTo(31, 10);

            vec3Sub(a, v(1, 1, 1), out);
            expect(a.z).toBeCloseTo(30, 10);
            expect(out.z).toBeCloseTo(29, 10);

            vec3Multiply(a, v(2, 2, 2), out);
            expect(a.z).toBeCloseTo(30, 10);
            expect(out.z).toBeCloseTo(60, 10);

            vec3Divide(a, v(2, 2, 2), out);
            expect(a.z).toBeCloseTo(30, 10);
            expect(out.z).toBeCloseTo(15, 10);
        });

        it('★★ 标量版 addNumber / subNumber / multiplyNumber / divideNumber 原地改', () =>
        {
            const a = v(1, 2, 3);

            vec3AddNumber(a, 10, a);
            expect(a.x).toBeCloseTo(11, 10);
            expect(a.z).toBeCloseTo(13, 10);

            vec3SubNumber(a, 10, a);
            expect(a.x).toBeCloseTo(1, 10);

            vec3ScaleNumber(a, 5, a);
            expect(a.x).toBeCloseTo(5, 10);
            expect(a.z).toBeCloseTo(15, 10);

            vec3DivideNumber(a, 5, a);
            expect(a.x).toBeCloseTo(1, 10);
            expect(a.z).toBeCloseTo(3, 10);
        });

        it('★★ 标量版写 out 且不改自身', () =>
        {
            const a = v(1, 2, 3);
            const out = { x: 0, y: 0, z: 0 };

            vec3AddNumber(a, 10, out);
            expect(a.x, 'a 不该被改').toBeCloseTo(1, 10);
            expect(out.x).toBeCloseTo(11, 10);

            vec3SubNumber(a, 10, out);
            expect(a.x).toBeCloseTo(1, 10);
            expect(out.x).toBeCloseTo(-9, 10);

            vec3ScaleNumber(a, 3, out);
            expect(a.x).toBeCloseTo(1, 10);
            expect(out.x).toBeCloseTo(3, 10);

            vec3DivideNumber(a, 3, out);
            expect(a.x).toBeCloseTo(1, 10);
            expect(out.x).toBeCloseTo(1 / 3, 10);
        });

        it('★★ negate 原地 / 写 out', () =>
        {
            const a = v(1, -2, 3);

            expect(vec3Negate(a, a)).toBe(a);
            expect(a.x).toBe(-1);
            expect(a.z).toBe(-3);

            const b = v(1, -2, 3);
            const out = { x: 0, y: 0, z: 0 };

            vec3Negate(b, out);
            expect(b.x, 'b 不该被改').toBe(1);
            expect(out.x).toBe(-1);
            expect(out.z).toBe(-3);
        });

        it('★★ addScaled 原地 / 写 out', () =>
        {
            const a = v(1, 1, 1);

            vec3AddScaled(a, 2, v(1, 0, 0), a);
            expect(a.x).toBeCloseTo(3, 10);
            expect(a.y).toBeCloseTo(1, 10);

            const b = v(1, 1, 1);
            const out = { x: 0, y: 0, z: 0 };

            vec3AddScaled(b, 3, v(0, 1, 0), out);
            expect(b.y, 'b 不该被改').toBeCloseTo(1, 10);
            expect(out.y).toBeCloseTo(4, 10);
        });
    });

    describe('★ inverse / equals / copy', () =>
    {
        it('★ inverse 是逐分量取倒数（分量不变）', () =>
        {
            const a = v(2, 4, 5);

            vec3Inverse(a, a);

            expect(a.x).toBeCloseTo(0.5, 10);
            expect(a.y).toBeCloseTo(0.25, 10);
            expect(a.z).toBeCloseTo(0.2, 10);
        });

        it('★ inverse 写 out 且不改自身', () =>
        {
            const a = v(2, 4, 5);
            const out = { x: 0, y: 0, z: 0 };

            vec3Inverse(a, out);

            expect(a.x, 'a 不该被改').toBe(2);
            expect(out.x).toBeCloseTo(0.5, 10);
        });

        it('★ equals / copy（copy 就是原 clone 的纯函数形式）', () =>
        {
            expect(vec3Equals(v(1, 2, 3), v(1, 2, 3))).toBe(true);
            expect(vec3Equals(v(1, 2, 3), v(1, 2, 4))).toBe(false);

            const src = v(7, 8, 9);
            const dst = { x: 0, y: 0, z: 0 };

            expect(vec3Copy(src, dst)).toBe(dst);
            expect(dst.x).toBe(7);

            const c = vec3Copy(src);

            expect(c).not.toBe(src);
            c.x = 99;
            expect(src.x, 'vec3Copy 的缺省 out 应独立').toBe(7);
        });

        it('★ isAntiparallel：反向为真、同向为假', () =>
        {
            expect(vec3IsAntiparallel(v(1, 0, 0), v(-1, 0, 0))).toBe(true);
            expect(vec3IsAntiparallel(v(1, 0, 0), v(1, 0, 0))).toBe(false);
        });
    });

    describe('★★ Vector2 / 数组互转', () =>
    {
        it('★★ toVector2 取 x/y，fromVector2 补 z', () =>
        {
            const a = v(1, 2, 3);
            const v2 = vec3ToVec2(a);

            expect(v2.x).toBe(1);
            expect(v2.y).toBe(2);

            const back = { x: 0, y: 0, z: 0 };

            vec2ToVec3({ x: 4, y: 5 }, 6, back);

            expect(back.x).toBe(4);
            expect(back.y).toBe(5);
            expect(back.z).toBe(6);

            expect(vec2ToVec3({ x: 1, y: 2 }, 0).z, '省略 z 时取 0').toBe(0);
        });

        it('★ fromArray 支持 offset；静态版与实例版一致（同一个函数）', () =>
        {
            const a = vec3FromArray([9, 9, 1, 2, 3], 2);

            expect(a.x).toBe(1);
            expect(a.z).toBe(3);

            const b = { x: 0, y: 0, z: 0 };

            vec3FromArray([4, 5, 6], 0, b);

            expect(b.y).toBe(5);
        });
    });

    describe('★ random', () =>
    {
        it('★ random 的三个分量都是有限数且非负', () =>
        {
            for (let i = 0; i < 15; i++)
            {
                const r = vec3Random();

                for (const [name, val] of [['x', r.x], ['y', r.y], ['z', r.z]] as const)
                {
                    expect(Number.isFinite(val), `${name}=${val}`).toBe(true);
                    expect(val, `${name}=${val}`).toBeGreaterThanOrEqual(0);
                }
            }
        });

        it('★ 传 out 的 random 就地写入同一个对象', () =>
        {
            const r = { x: 0, y: 0, z: 0 };

            expect(vec3Random(1, false, r)).toBe(r);
            expect(Number.isFinite(r.x)).toBe(true);
            expect(Number.isFinite(r.y)).toBe(true);
            expect(Number.isFinite(r.z)).toBe(true);
        });
    });

    describe('★ 冻结常量', () =>
    {
        it('★ VEC3_ZERO 是冻结的 (0,0,0)', () =>
        {
            expect(VEC3_ZERO.x).toBe(0);
            expect(Object.isExtensible(VEC3_ZERO)).toBe(false);
        });
    });
});

