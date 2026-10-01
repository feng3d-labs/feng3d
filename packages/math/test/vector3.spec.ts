import { describe, expect, it } from 'vitest';

import { Vector2 } from '../src/geom/Vector2';
import { Vector3 } from '../src/geom/Vector3';

/**
 * `Vector3`（`packages/math/src/geom/Vector3.ts`，**425 行**，此前**行覆盖率 41.88%**）——
 * 全仓最大的低覆盖纯数学文件，也是被引用最广的类型。
 *
 * 断言策略与 `Vector2`（#470）/ `Vector4`（#458）一致：**只钉数学必然成立的关系**，
 * 避开需要先确认的细节（`random` 的 `size` / `double` 语义、`normalize` 的 `thickness`
 * 参数用途、`tangents` 的算法）。
 *
 * 特别钉住的**四组"一对方法"**（原地版改自身、`…To` 版写 `vout`）：
 *
 * | 分数版 | 标量版 |
 * |---|---|
 * | `add` / `addTo`、`sub` / `subTo`、`multiply` / `multiplyTo`、`divide` / `divideTo` | `addNumber` / `addNumberTo`、`subNumber` / …、`multiplyNumber` / …、`divideNumber` / … |
 *
 * 以及 `cross` / `crossTo`、`negate` / `negateTo`、`inverse` / `inverseTo`、`addScaledVector` / `addScaledVectorTo`。
 */

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

describe('Vector3（math/geom）', () =>
{
    describe('★ 构造与基础', () =>
    {
        it('默认构造是 (0,0,0)；三参构造按顺序写入', () =>
        {
            const a = new Vector3();

            expect(a.x).toBe(0);
            expect(a.y).toBe(0);
            expect(a.z).toBe(0);

            const b = v(1, 2, 3);

            expect(b.x).toBe(1);
            expect(b.y).toBe(2);
            expect(b.z).toBe(3);
        });

        it('★ set 写入并返回 this；setZero 归零', () =>
        {
            const a = new Vector3();

            expect(a.set(4, 5, 6)).toBe(a);
            expect(a.z).toBe(6);

            a.setZero();
            expect(a.x).toBe(0);
            expect(a.y).toBe(0);
            expect(a.z).toBe(0);
        });

        it('★ isZero 只在三个分量都为 0 时为真', () =>
        {
            expect(v(0, 0, 0).isZero()).toBe(true);
            expect(v(0, 0, 1e-30).isZero()).toBe(false);
            expect(v(1, 0, 0).isZero()).toBe(false);
        });

        it('★ almostZero 在极小的分量下为真', () =>
        {
            expect(v(0, 0, 0).almostZero()).toBe(true);
            expect(v(1e-20, 0, 0).almostZero()).toBe(true);
            expect(v(1, 0, 0).almostZero()).toBe(false);
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

                expect(a.lengthSquared, `(${x},${y},${z})`).toBeCloseTo(sq, 10);
                expect(a.length, `(${x},${y},${z})`).toBeCloseTo(Math.sqrt(sq), 10);
            }
        });

        it('★ 单位轴长度为 1：(3,4,0) 长度为 5', () =>
        {
            expect(v(1, 0, 0).length).toBeCloseTo(1, 10);
            expect(v(0, 1, 0).length).toBeCloseTo(1, 10);
            expect(v(0, 0, 1).length).toBeCloseTo(1, 10);
            expect(v(3, 4, 0).length).toBeCloseTo(5, 10);
        });
    });

    describe('★★ 归一化', () =>
    {
        it('★★ normalize() 后长度为 1，方向不变', () =>
        {
            const a = v(0, 3, 4);

            a.normalize();

            expect(a.length).toBeCloseTo(1, 6);
            // 方向不变：与原向量的叉积应为零向量
            expect(Math.abs(v(0, 3, 4).unit().dot(a))).toBeCloseTo(1, 6);
        });

        it('★ unit() 产生长度为 1 的向量（不破坏原向量）', () =>
        {
            const a = v(0, 3, 4);
            const u = a.unit();

            expect(u.length).toBeCloseTo(1, 6);
            expect(a.y, '原向量不该被改').toBeCloseTo(3, 10);

            // 传 target 时应当复用该对象
            const target = new Vector3();

            expect(a.unit(target)).toBe(target);
            expect(target.length).toBeCloseTo(1, 6);
        });
    });

    describe('★★ 距离', () =>
    {
        it('★ distanceSquared / distance 与长度一致', () =>
        {
            const a = v(0, 0, 0);
            const b = v(1, 2, 2);

            expect(a.distanceSquared(b)).toBeCloseTo(9, 10);
            expect(a.distance(b)).toBeCloseTo(3, 10);
            expect(b.distance(a), '距离应对称').toBeCloseTo(3, 10);
        });

        it('★ 同一点距离为 0', () =>
        {
            expect(v(5, 6, 7).distance(v(5, 6, 7))).toBeCloseTo(0, 10);
        });
    });

    describe('★★ 点积与叉积', () =>
    {
        it('★★ dot：正交为 0、同向为长度积', () =>
        {
            expect(v(1, 0, 0).dot(v(0, 1, 0))).toBeCloseTo(0, 10);
            expect(v(1, 0, 0).dot(v(1, 0, 0))).toBeCloseTo(1, 10);
            expect(v(1, 2, 3).dot(v(4, 5, 6))).toBeCloseTo(32, 10);
        });

        it('★★ cross：x̂ × ŷ = ẑ（右手系）', () =>
        {
            const c = v(1, 0, 0).cross(v(0, 1, 0));

            expect(c.x).toBeCloseTo(0, 10);
            expect(c.y).toBeCloseTo(0, 10);
            expect(c.z).toBeCloseTo(1, 10);

            // 反向应当是负的
            const d = v(0, 1, 0).cross(v(1, 0, 0));

            expect(d.z).toBeCloseTo(-1, 10);
        });

        it('★★ cross：自身与自身叉积为零向量；结果与两个输入都正交', () =>
        {
            const a = v(1, 2, 3);

            expect(a.cross(a).length).toBeCloseTo(0, 10);

            const b = v(4, -5, 6);
            const c = a.cross(b);

            expect(c.dot(a)).toBeCloseTo(0, 8);
            expect(c.dot(b)).toBeCloseTo(0, 8);
        });

        it('★★ crossTo 写入 vout 且不改自身', () =>
        {
            const a = v(1, 0, 0);
            const b = v(0, 1, 0);
            const out = new Vector3();

            expect(a.crossTo(b, out)).toBe(out);
            expect(a.x, 'a 不该被改').toBe(1);
            expect(out.z).toBeCloseTo(1, 10);
        });
    });

    describe('★★ 原地版 vs …To 版（与 Vector2 / Vector4 同一约定）', () =>
    {
        it('★★ add / sub / multiply / divide 原地改', () =>
        {
            const a = v(10, 20, 30);

            a.add(v(1, 2, 3));
            expect(a.x).toBeCloseTo(11, 10);
            expect(a.z).toBeCloseTo(33, 10);

            a.sub(v(1, 2, 3));
            expect(a.x).toBeCloseTo(10, 10);

            a.multiply(v(2, 3, 4));
            expect(a.x).toBeCloseTo(20, 10);
            expect(a.z).toBeCloseTo(120, 10);

            a.divide(v(2, 3, 4));
            expect(a.x).toBeCloseTo(10, 10);
            expect(a.z).toBeCloseTo(30, 10);
        });

        it('★★ addTo / subTo / multiplyTo / divideTo 写 vout 且不改自身', () =>
        {
            const a = v(10, 20, 30);
            const out = new Vector3();

            expect(a.addTo(v(1, 1, 1), out)).toBe(out);
            expect(a.x, 'a 不该被改').toBeCloseTo(10, 10);
            expect(out.z).toBeCloseTo(31, 10);

            a.subTo(v(1, 1, 1), out);
            expect(a.z).toBeCloseTo(30, 10);
            expect(out.z).toBeCloseTo(29, 10);

            a.multiplyTo(v(2, 2, 2), out);
            expect(a.z).toBeCloseTo(30, 10);
            expect(out.z).toBeCloseTo(60, 10);

            a.divideTo(v(2, 2, 2), out);
            expect(a.z).toBeCloseTo(30, 10);
            expect(out.z).toBeCloseTo(15, 10);
        });

        it('★★ 标量版 addNumber / subNumber / multiplyNumber / divideNumber 原地改', () =>
        {
            const a = v(1, 2, 3);

            a.addNumber(10);
            expect(a.x).toBeCloseTo(11, 10);
            expect(a.z).toBeCloseTo(13, 10);

            a.subNumber(10);
            expect(a.x).toBeCloseTo(1, 10);

            a.multiplyNumber(5);
            expect(a.x).toBeCloseTo(5, 10);
            expect(a.z).toBeCloseTo(15, 10);

            a.divideNumber(5);
            expect(a.x).toBeCloseTo(1, 10);
            expect(a.z).toBeCloseTo(3, 10);
        });

        it('★★ 标量版 …To 写 vout 且不改自身', () =>
        {
            const a = v(1, 2, 3);
            const out = new Vector3();

            a.addNumberTo(10, out);
            expect(a.x, 'a 不该被改').toBeCloseTo(1, 10);
            expect(out.x).toBeCloseTo(11, 10);

            a.subNumberTo(10, out);
            expect(a.x).toBeCloseTo(1, 10);
            expect(out.x).toBeCloseTo(-9, 10);

            a.multiplyNumberTo(3, out);
            expect(a.x).toBeCloseTo(1, 10);
            expect(out.x).toBeCloseTo(3, 10);

            a.divideNumberTo(3, out);
            expect(a.x).toBeCloseTo(1, 10);
            expect(out.x).toBeCloseTo(1 / 3, 10);
        });

        it('★★ negate / negateTo', () =>
        {
            const a = v(1, -2, 3);

            expect(a.negate()).toBe(a);
            expect(a.x).toBe(-1);
            expect(a.z).toBe(-3);

            const b = v(1, -2, 3);
            const out = new Vector3();

            b.negateTo(out);
            expect(b.x, 'b 不该被改').toBe(1);
            expect(out.x).toBe(-1);
            expect(out.z).toBe(-3);
        });

        it('★★ addScaledVector / addScaledVectorTo', () =>
        {
            const a = v(1, 1, 1);

            a.addScaledVector(2, v(1, 0, 0));
            expect(a.x).toBeCloseTo(3, 10);
            expect(a.y).toBeCloseTo(1, 10);

            const b = v(1, 1, 1);
            const out = new Vector3();

            b.addScaledVectorTo(3, v(0, 1, 0), out);
            expect(b.y, 'b 不该被改').toBeCloseTo(1, 10);
            expect(out.y).toBeCloseTo(4, 10);
        });
    });

    describe('★ inverse / equals / copy / clone', () =>
    {
        it('★ inverse 是逐分量取倒数（分量不变）', () =>
        {
            const a = v(2, 4, 5);

            a.inverse();

            expect(a.x).toBeCloseTo(0.5, 10);
            expect(a.y).toBeCloseTo(0.25, 10);
            expect(a.z).toBeCloseTo(0.2, 10);
        });

        it('★ inverseTo 写 vout 且不改自身', () =>
        {
            const a = v(2, 4, 5);
            const out = new Vector3();

            a.inverseTo(out);

            expect(a.x, 'a 不该被改').toBe(2);
            expect(out.x).toBeCloseTo(0.5, 10);
        });

        it('★ equals / copy / clone', () =>
        {
            expect(v(1, 2, 3).equals(v(1, 2, 3))).toBe(true);
            expect(v(1, 2, 3).equals(v(1, 2, 4))).toBe(false);

            const src = v(7, 8, 9);
            const dst = new Vector3();

            expect(dst.copy(src)).toBe(dst);
            expect(dst.x).toBe(7);

            const c = src.clone();

            expect(c).not.toBe(src);
            c.x = 99;
            expect(src.x, 'clone 应独立').toBe(7);
        });

        it('★ isAntiparallelTo：反向为真、同向为假', () =>
        {
            expect(v(1, 0, 0).isAntiparallelTo(v(-1, 0, 0))).toBe(true);
            expect(v(1, 0, 0).isAntiparallelTo(v(1, 0, 0))).toBe(false);
        });
    });

    describe('★★ Vector2 / 数组互转', () =>
    {
        it('★★ toVector2 取 x/y，fromVector2 补 z', () =>
        {
            const a = v(1, 2, 3);
            const v2 = a.toVector2();

            expect(v2).toBeInstanceOf(Vector2);
            expect(v2.x).toBe(1);
            expect(v2.y).toBe(2);

            const back = new Vector3().fromVector2(new Vector2(4, 5), 6);

            expect(back.x).toBe(4);
            expect(back.y).toBe(5);
            expect(back.z).toBe(6);

            expect(Vector3.fromVector2(new Vector2(1, 2)).z, '省略 z 时取 0').toBe(0);
        });

        it('★ fromArray 支持 offset；静态版与实例版一致', () =>
        {
            const a = Vector3.fromArray([9, 9, 1, 2, 3], 2);

            expect(a.x).toBe(1);
            expect(a.z).toBe(3);

            const b = new Vector3().fromArray([4, 5, 6]);

            expect(b.y).toBe(5);
        });
    });

    describe('★ random', () =>
    {
        it('★ random 的三个分量都是有限数且非负', () =>
        {
            for (let i = 0; i < 15; i++)
            {
                const r = Vector3.random();

                for (const [name, val] of [['x', r.x], ['y', r.y], ['z', r.z]] as const)
                {
                    expect(Number.isFinite(val), `${name}=${val}`).toBe(true);
                    expect(val, `${name}=${val}`).toBeGreaterThanOrEqual(0);
                }
            }
        });

        it('★ 实例版 random 也是有限数', () =>
        {
            const r = new Vector3().random();

            expect(Number.isFinite(r.x)).toBe(true);
            expect(Number.isFinite(r.y)).toBe(true);
            expect(Number.isFinite(r.z)).toBe(true);
        });
    });
});
