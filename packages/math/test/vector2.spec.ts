import { describe, expect, it } from 'vitest';

import { Vector2 } from '../src/geom/Vector2';

/**
 * `Vector2`（`packages/math/src/geom/Vector2.ts`，190 行，此前**行覆盖率 23.68%** ——
 * `math` 包里覆盖最低的大文件）。
 *
 * Unity 风格的二维向量：`length / lengthSquared / magnitude / sqrMagnitude / normalized` 一组 getter，
 * 一批 `static` 工具（`Lerp` / `MoveTowards` / `Dot` / `Angle` / `Distance` / `Reflect` / `polar` …），
 * 以及 `add`/`addTo` 式的**原地版与 `…To` 版方法对**。
 *
 * 断言都选**数学必然成立**的部分：
 * - `lengthSquared === x² + y²`、`length === √lengthSquared`、`magnitude === length`、`sqrMagnitude === lengthSquared`；
 * - `Dot((1,0),(0,1)) === 0`、`cross((1,0),(0,1)) === 1`（二维叉积是**标量**）；
 * - `normalize()` 后长度为 1；`normalized` 是 getter（不改自身）而 `normalize()` 原地；
 * - `add`/`sub`/`multiply`/`divide` 原地改；对应的 `…To` 版不改自身、写入 `vout`（与 `Vector4` 同一约定）。
 *
 * ⚠️ **不测 `SmoothDamp*`** —— 它们依赖 `Time.deltaTime`，而 `Time` 在该包里是"未实现"（会抛）。
 */

const v = (x: number, y: number) => new Vector2(x, y);

describe('Vector2（math/geom）', () =>
{
    describe('★ 构造与 set', () =>
    {
        it('默认构造是 (0,0)；两参构造按顺序写入', () =>
        {
            const a = new Vector2();

            expect(a.x).toBe(0);
            expect(a.y).toBe(0);

            const b = v(3, 4);

            expect(b.x).toBe(3);
            expect(b.y).toBe(4);
        });

        it('★ set 写入并返回 this', () =>
        {
            const a = new Vector2();

            expect(a.set(5, 6)).toBe(a);
            expect(a.x).toBe(5);
            expect(a.y).toBe(6);
        });
    });

    describe('★★ 长度相关的四个 getter 彼此自洽', () =>
    {
        it('★★ lengthSquared === x² + y²，length === √lengthSquared', () =>
        {
            for (const [x, y] of [[3, 4], [0, 0], [-5, 12], [1, 1]] as [number, number][])
            {
                const a = v(x, y);

                expect(a.lengthSquared, `(${x},${y})`).toBeCloseTo(x * x + y * y, 10);
                expect(a.length, `(${x},${y})`).toBeCloseTo(Math.sqrt(x * x + y * y), 10);
            }
        });

        it('★★ magnitude / sqrMagnitude 与 length / lengthSquared 是同一组量', () =>
        {
            const a = v(3, 4);

            expect(a.magnitude).toBeCloseTo(a.length, 10);
            expect(a.sqrMagnitude).toBeCloseTo(a.lengthSquared, 10);
            expect(a.length).toBeCloseTo(5, 10);
        });

        it('★ 单位向量长度为 1、零向量长度为 0', () =>
        {
            expect(v(1, 0).length).toBeCloseTo(1, 10);
            expect(v(0, 1).length).toBeCloseTo(1, 10);
            expect(v(0, 0).length).toBeCloseTo(0, 10);
        });
    });

    describe('★★ normalized（getter）与 normalize()（原地）的区别', () =>
    {
        it('★★ normalized 返回长度 1 的**新**对象，自身不变', () =>
        {
            const a = v(3, 4);
            const n = a.normalized;

            expect(n).not.toBe(a);
            expect(n.length).toBeCloseTo(1, 6);
            expect(a.x, '自身不该被改').toBe(3);
            expect(a.y).toBe(4);
        });

        it('★★ normalize() 原地归一化（返回自身或已归一化的对象）', () =>
        {
            const a = v(3, 4);

            a.normalize();

            expect(a.length).toBeCloseTo(1, 6);
            expect(a.x).toBeCloseTo(0.6, 6);
            expect(a.y).toBeCloseTo(0.8, 6);
        });

        it('★ 零向量归一化不产生 NaN 之外的崩溃（至少不抛）', () =>
        {
            expect(() => v(0, 0).normalize()).not.toThrow();
            expect(() => v(0, 0).normalized).not.toThrow();
        });
    });

    describe('★★ 静态工具（数学可直接验算）', () =>
    {
        it('★★ Dot：正交为 0、同向为长度积', () =>
        {
            expect(Vector2.Dot(v(1, 0), v(0, 1))).toBeCloseTo(0, 10);
            expect(Vector2.Dot(v(1, 0), v(1, 0))).toBeCloseTo(1, 10);
            expect(Vector2.Dot(v(3, 0), v(2, 0))).toBeCloseTo(6, 10);
            expect(Vector2.Dot(v(1, 2), v(3, 4))).toBeCloseTo(11, 10);
            // 实例版应与静态版一致
            expect(v(1, 2).dot(v(3, 4))).toBeCloseTo(Vector2.Dot(v(1, 2), v(3, 4)), 10);
        });

        it('★★ cross：二维叉积是**标量**（z 分量），(1,0)×(0,1) = 1', () =>
        {
            expect(v(1, 0).cross(v(0, 1))).toBeCloseTo(1, 10);
            expect(v(0, 1).cross(v(1, 0))).toBeCloseTo(-1, 10);
            // 共线时叉积为 0
            expect(v(2, 0).cross(v(5, 0))).toBeCloseTo(0, 10);
        });

        it('★ Scale / Perpendicular / Reflect', () =>
        {
            const s = Vector2.Scale(v(2, 3), v(4, 5));

            expect(s.x).toBeCloseTo(8, 10);
            expect(s.y).toBeCloseTo(15, 10);

            // Perpendicular 是把方向转 90°：模长不变、与原向量点积为 0
            const perp = Vector2.Perpendicular(v(1, 0));

            expect(perp.length).toBeCloseTo(1, 10);
            expect(Vector2.Dot(perp, v(1, 0))).toBeCloseTo(0, 10);

            // Reflect：以 x 轴为法线反射 (1,-1) → (1,1)
            const r = Vector2.Reflect(v(1, -1), v(0, 1));

            expect(r.x).toBeCloseTo(1, 10);
            expect(r.y).toBeCloseTo(1, 10);
        });

        it('★★ Lerp 与 MoveTowards 的端点行为', () =>
        {
            const a = v(0, 0);
            const b = v(10, 20);

            expect(Vector2.Lerp(a, b, 0).x).toBeCloseTo(0, 10);
            expect(Vector2.Lerp(a, b, 1).y).toBeCloseTo(20, 10);
            expect(Vector2.Lerp(a, b, 0.5).x).toBeCloseTo(5, 10);
            expect(Vector2.Lerp(a, b, 0.5).y).toBeCloseTo(10, 10);

            // LerpUnclamped 会外推
            expect(Vector2.LerpUnclamped(a, b, 2).x).toBeCloseTo(20, 10);

            // MoveTowards：够近就直接到
            expect(Vector2.MoveTowards(a, b, 1000).x).toBeCloseTo(10, 10);
            // 否之朝目标移动 maxDistanceDelta（沿单位方向）
            const stepped = Vector2.MoveTowards(a, b, 1);

            expect(Math.hypot(stepped.x, stepped.y)).toBeCloseTo(1, 6);
        });

        it('★ Distance 与 ClampMagnitude', () =>
        {
            expect(Vector2.Distance(v(0, 0), v(3, 4))).toBeCloseTo(5, 10);
            expect(v(0, 0).distance(v(3, 4))).toBeCloseTo(5, 10);

            const clamped = Vector2.ClampMagnitude(v(10, 0), 3);

            expect(clamped.length).toBeCloseTo(3, 6);
            // 本来就在范围内的向量不该被改
            const inside = Vector2.ClampMagnitude(v(1, 0), 3);

            expect(inside.x).toBeCloseTo(1, 6);
        });

        it('★ Min / Max 是逐分量取小 / 取大', () =>
        {
            const a = v(1, 9);
            const b = v(5, 2);

            expect(Vector2.Min(a, b).x).toBeCloseTo(1, 10);
            expect(Vector2.Min(a, b).y).toBeCloseTo(2, 10);
            expect(Vector2.Max(a, b).x).toBeCloseTo(5, 10);
            expect(Vector2.Max(a, b).y).toBeCloseTo(9, 10);
        });

        it('★ Angle / SignedAngle（同向 0°、正交 90°）', () =>
        {
            expect(Vector2.Angle(v(1, 0), v(1, 0))).toBeCloseTo(0, 4);
            expect(Vector2.Angle(v(1, 0), v(0, 1))).toBeCloseTo(90, 4);

            const signed = Vector2.SignedAngle(v(1, 0), v(0, 1));

            // 带符号：正负方向应当相反
            expect(Math.abs(signed)).toBeCloseTo(90, 4);
            expect(Vector2.SignedAngle(v(0, 1), v(1, 0))).toBeCloseTo(-signed, 4);
        });

        it('★ polar：长度为 len 的向量（角度约定不确定，只验长度与 0 角）', () =>
        {
            const p = Vector2.polar(1, 0);

            expect(p.length).toBeCloseTo(1, 6);
            expect(p.x).toBeCloseTo(1, 6);
            expect(p.y).toBeCloseTo(0, 6);

            expect(Vector2.polar(5, 0).length).toBeCloseTo(5, 6);
        });

        it('★ random 的分量落在 [0,1)', () =>
        {
            for (let i = 0; i < 20; i++)
            {
                const r = Vector2.random();

                expect(r.x).toBeGreaterThanOrEqual(0);
                expect(r.x).toBeLessThan(1);
                expect(r.y).toBeGreaterThanOrEqual(0);
                expect(r.y).toBeLessThan(1);
            }
        });
    });

    describe('★★ 原地版 vs …To 版（与 Vector4 同一约定）', () =>
    {
        it('★★ add / sub / multiply / divide 原地改并返回自身', () =>
        {
            const a = v(10, 20);

            a.add(v(1, 2));
            expect(a.x).toBeCloseTo(11, 10);
            expect(a.y).toBeCloseTo(22, 10);

            a.sub(v(1, 2));
            expect(a.x).toBeCloseTo(10, 10);

            a.multiply(v(2, 3));
            expect(a.x).toBeCloseTo(20, 10);
            expect(a.y).toBeCloseTo(60, 10);

            a.divide(v(2, 3));
            expect(a.x).toBeCloseTo(10, 10);
            expect(a.y).toBeCloseTo(20, 10);
        });

        it('★★ addTo / subTo / multiplyTo / divideTo 不改自身，而是写入 vout', () =>
        {
            const a = v(10, 20);
            const out = new Vector2();

            expect(a.addTo(v(1, 1), out)).toBe(out);
            expect(a.x, 'a 不该被改').toBeCloseTo(10, 10);
            expect(out.x).toBeCloseTo(11, 10);

            a.subTo(v(1, 1), out);
            expect(a.x).toBeCloseTo(10, 10);
            expect(out.x).toBeCloseTo(9, 10);

            a.multiplyTo(v(2, 2), out);
            expect(a.x).toBeCloseTo(10, 10);
            expect(out.x).toBeCloseTo(20, 10);

            a.divideTo(v(2, 2), out);
            expect(a.x).toBeCloseTo(10, 10);
            expect(out.x).toBeCloseTo(5, 10);
        });

        it('★ 省略 vout 时新建对象，且不改自身', () =>
        {
            const a = v(1, 2);
            const out = a.addTo(v(1, 1));

            expect(out).not.toBe(a);
            expect(a.x).toBe(1);
            expect(out.x).toBeCloseTo(2, 10);
        });
    });

    describe('★ equals / copy / clone / toString', () =>
    {
        it('★ equals：相同为真、任一分量不同为假', () =>
        {
            expect(v(1, 2).equals(v(1, 2))).toBe(true);
            expect(v(1, 2).equals(v(1, 3))).toBe(false);
            expect(v(1, 2).equals(v(9, 2))).toBe(false);
        });

        it('★ copy 复制并返回 this；clone 产生独立对象', () =>
        {
            const src = v(7, 8);
            const dst = new Vector2();

            expect(dst.copy(src)).toBe(dst);
            expect(dst.x).toBe(7);
            expect(dst.y).toBe(8);

            const c = src.clone();

            expect(c).not.toBe(src);
            c.x = 99;
            expect(src.x, 'clone 应独立').toBe(7);
        });

        it('★ toString 返回字符串且含两个分量', () =>
        {
            const s = v(1.5, -2.25).toString();

            expect(typeof s).toBe('string');
            expect(s).toContain('1.5');
            expect(s).toContain('2.25');
        });
    });
});
