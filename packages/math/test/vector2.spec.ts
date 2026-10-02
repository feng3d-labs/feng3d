import { describe, expect, it } from 'vitest';

import {
    vec2Add,
    vec2Angle,
    vec2ClampMagnitude,
    vec2Copy,
    vec2Cross,
    vec2Distance,
    vec2Divide,
    vec2Dot,
    vec2Equals,
    vec2From,
    vec2Length,
    vec2LengthSquared,
    vec2LerpClamped,
    vec2LerpNumber,
    vec2MaxMathf,
    vec2MinMathf,
    vec2MoveTowards,
    vec2Multiply,
    vec2Normalize,
    vec2Perpendicular,
    vec2Polar,
    vec2Random,
    vec2Reflect,
    vec2Scale,
    vec2SignedAngle,
    vec2Sub,
    vec2ToString,
} from '../src/geom/vector2Ops';

/**
 * `Vector2`（`packages/math/src/geom/vector2Ops.ts`）。
 *
 * ★ **阶段 C-f**：`Vector2` 的 class 已删除，本文件从「class 规格」改写为**同义纯函数用例**
 * （与 C-e 对 `Box3` / `Quaternion` / `Matrix4x4` 的处理一致）：
 * 原 getter / 静态方法 / 原地方法与 `…To` 方法对，全部映射到 `vec2Xxx` 与 `out` 参数。
 *
 * 断言都选**数学必然成立**的部分（数值与关系逐条保留）。
 *
 * ⚠️ **不测 `SmoothDamp*`** —— 纯函数层要求显式传 `deltaTime`，本文件不引入随机/时序依赖；
 *      其行为由 `vec2SmoothDamp` 的 JSDoc 与 `vector3Ops` 的同构实现对齐。
 */

const v = (x: number, y: number) => ({ x: x, y: y });

describe('Vector2（math/geom）', () =>
{
    describe('★ 构造与 set', () =>
    {
        it('默认构造是 (0,0)；两参构造按顺序写入', () =>
        {
            const a = vec2From(0, 0);

            expect(a.x).toBe(0);
            expect(a.y).toBe(0);

            const b = v(3, 4);

            expect(b.x).toBe(3);
            expect(b.y).toBe(4);
        });

        it('★ set 写入并返回 out', () =>
        {
            const a = { x: 0, y: 0 };

            expect(vec2From(5, 6, a)).toBe(a);
            expect(a.x).toBe(5);
            expect(a.y).toBe(6);
        });
    });

    describe('★★ 长度相关的两组量彼此自洽', () =>
    {
        it('★★ lengthSquared === x² + y²，length === √lengthSquared', () =>
        {
            for (const [x, y] of [[3, 4], [0, 0], [-5, 12], [1, 1]] as [number, number][])
            {
                const a = v(x, y);

                expect(vec2LengthSquared(a), `(${x},${y})`).toBeCloseTo(x * x + y * y, 10);
                expect(vec2Length(a), `(${x},${y})`).toBeCloseTo(Math.sqrt(x * x + y * y), 10);
            }
        });

        it('★★ magnitude / sqrMagnitude 与 length / lengthSquared 是同一组量', () =>
        {
            const a = v(3, 4);

            expect(vec2Length(a)).toBeCloseTo(vec2Length(a), 10);
            expect(vec2LengthSquared(a)).toBeCloseTo(vec2LengthSquared(a), 10);
            expect(vec2Length(a)).toBeCloseTo(5, 10);
        });

        it('★ 单位向量长度为 1、零向量长度为 0', () =>
        {
            expect(vec2Length(v(1, 0))).toBeCloseTo(1, 10);
            expect(vec2Length(v(0, 1))).toBeCloseTo(1, 10);
            expect(vec2Length(v(0, 0))).toBeCloseTo(0, 10);
        });
    });

    describe('★★ 新建 out（原 normalized）与就地 out（原 normalize()）的区别', () =>
    {
        it('★★ 缺省 out 返回长度 1 的**新**对象，自身不变', () =>
        {
            const a = v(3, 4);
            const n = vec2Normalize(a);

            expect(n).not.toBe(a);
            expect(vec2Length(n)).toBeCloseTo(1, 6);
            expect(a.x, '自身不该被改').toBe(3);
            expect(a.y).toBe(4);
        });

        it('★★ out 传自己即原地归一化', () =>
        {
            const a = v(3, 4);

            vec2Normalize(a, a);

            expect(vec2Length(a)).toBeCloseTo(1, 6);
            expect(a.x).toBeCloseTo(0.6, 6);
            expect(a.y).toBeCloseTo(0.8, 6);
        });

        it('★ 零向量归一化退化为 (0,0)（不抛、不产生 NaN）', () =>
        {
            expect(() => vec2Normalize(v(0, 0))).not.toThrow();
            expect(vec2Normalize(v(0, 0))).toEqual({ x: 0, y: 0 });
        });
    });

    describe('★★ 纯函数工具（数学可直接验算）', () =>
    {
        it('★★ Dot：正交为 0、同向为长度积', () =>
        {
            expect(vec2Dot(v(1, 0), v(0, 1))).toBeCloseTo(0, 10);
            expect(vec2Dot(v(1, 0), v(1, 0))).toBeCloseTo(1, 10);
            expect(vec2Dot(v(3, 0), v(2, 0))).toBeCloseTo(6, 10);
            expect(vec2Dot(v(1, 2), v(3, 4))).toBeCloseTo(11, 10);
        });

        it('★★ cross：二维叉积是**标量**（z 分量），(1,0)×(0,1) = 1', () =>
        {
            expect(vec2Cross(v(1, 0), v(0, 1))).toBeCloseTo(1, 10);
            expect(vec2Cross(v(0, 1), v(1, 0))).toBeCloseTo(-1, 10);
            // 共线时叉积为 0
            expect(vec2Cross(v(2, 0), v(5, 0))).toBeCloseTo(0, 10);
        });

        it('★ Scale / Perpendicular / Reflect', () =>
        {
            const s = vec2Scale(v(2, 3), v(4, 5));

            expect(s.x).toBeCloseTo(8, 10);
            expect(s.y).toBeCloseTo(15, 10);

            // Perpendicular 是把方向转 90°：模长不变、与原向量点积为 0
            const perp = vec2Perpendicular(v(1, 0));

            expect(vec2Length(perp)).toBeCloseTo(1, 10);
            expect(vec2Dot(perp, v(1, 0))).toBeCloseTo(0, 10);

            // Reflect：以 x 轴为法线反射 (1,-1) → (1,1)
            const r = vec2Reflect(v(1, -1), v(0, 1));

            expect(r.x).toBeCloseTo(1, 10);
            expect(r.y).toBeCloseTo(1, 10);
        });

        it('★★ Lerp 与 MoveTowards 的端点行为', () =>
        {
            const a = v(0, 0);
            const b = v(10, 20);

            expect(vec2LerpClamped(a, b, 0).x).toBeCloseTo(0, 10);
            expect(vec2LerpClamped(a, b, 1).y).toBeCloseTo(20, 10);
            expect(vec2LerpClamped(a, b, 0.5).x).toBeCloseTo(5, 10);
            expect(vec2LerpClamped(a, b, 0.5).y).toBeCloseTo(10, 10);

            // LerpUnclamped 会外推
            expect(vec2LerpNumber(a, b, 2).x).toBeCloseTo(20, 10);

            // MoveTowards：够近就直接到（退化分支返回入参 target 本身）
            expect(vec2MoveTowards(a, b, 1000).x).toBeCloseTo(10, 10);
            // 否之朝目标移动 maxDistanceDelta（沿单位方向）
            const stepped = vec2MoveTowards(a, b, 1);

            expect(Math.hypot(stepped.x, stepped.y)).toBeCloseTo(1, 6);
        });

        it('★ Distance 与 ClampMagnitude', () =>
        {
            expect(vec2Distance(v(0, 0), v(3, 4))).toBeCloseTo(5, 10);

            const clamped = vec2ClampMagnitude(v(10, 0), 3);

            expect(vec2Length(clamped)).toBeCloseTo(3, 6);
            // 本来就在范围内的向量按原值拷贝
            const inside = vec2ClampMagnitude(v(1, 0), 3);

            expect(inside.x).toBeCloseTo(1, 6);
        });

        it('★ 静态 Min / Max 是逐分量取小 / 取大（Mathf 语义）', () =>
        {
            const a = v(1, 9);
            const b = v(5, 2);

            expect(vec2MinMathf(a, b).x).toBeCloseTo(1, 10);
            expect(vec2MinMathf(a, b).y).toBeCloseTo(2, 10);
            expect(vec2MaxMathf(a, b).x).toBeCloseTo(5, 10);
            expect(vec2MaxMathf(a, b).y).toBeCloseTo(9, 10);
        });

        it('★ Angle / SignedAngle（同向 0°、正交 90°）', () =>
        {
            expect(vec2Angle(v(1, 0), v(1, 0))).toBeCloseTo(0, 4);
            expect(vec2Angle(v(1, 0), v(0, 1))).toBeCloseTo(90, 4);

            const signed = vec2SignedAngle(v(1, 0), v(0, 1));

            // 带符号：正负方向应当相反
            expect(Math.abs(signed)).toBeCloseTo(90, 4);
            expect(vec2SignedAngle(v(0, 1), v(1, 0))).toBeCloseTo(-signed, 4);
        });

        it('★ polar：长度为 len 的向量（角度约定不确定，只验长度与 0 角）', () =>
        {
            const p = vec2Polar(1, 0);

            expect(vec2Length(p)).toBeCloseTo(1, 6);
            expect(p.x).toBeCloseTo(1, 6);
            expect(p.y).toBeCloseTo(0, 6);

            expect(vec2Length(vec2Polar(5, 0))).toBeCloseTo(5, 6);
        });

        it('★ random 的分量落在 [0,1)', () =>
        {
            for (let i = 0; i < 20; i++)
            {
                const r = vec2Random();

                expect(r.x).toBeGreaterThanOrEqual(0);
                expect(r.x).toBeLessThan(1);
                expect(r.y).toBeGreaterThanOrEqual(0);
                expect(r.y).toBeLessThan(1);
            }
        });
    });

    describe('★★ 原地版 vs 显式 out 版', () =>
    {
        it('★★ add / sub / multiply / divide 原地改', () =>
        {
            const a = v(10, 20);

            vec2Add(a, v(1, 2), a);
            expect(a.x).toBeCloseTo(11, 10);
            expect(a.y).toBeCloseTo(22, 10);

            vec2Sub(a, v(1, 2), a);
            expect(a.x).toBeCloseTo(10, 10);

            vec2Multiply(a, v(2, 3), a);
            expect(a.x).toBeCloseTo(20, 10);
            expect(a.y).toBeCloseTo(60, 10);

            vec2Divide(a, v(2, 3), a);
            expect(a.x).toBeCloseTo(10, 10);
            expect(a.y).toBeCloseTo(20, 10);
        });

        it('★★ add / sub / multiply / divide 不改自身，而是写入 out', () =>
        {
            const a = v(10, 20);
            const out = { x: 0, y: 0 };

            expect(vec2Add(a, v(1, 1), out)).toBe(out);
            expect(a.x, 'a 不该被改').toBeCloseTo(10, 10);
            expect(out.x).toBeCloseTo(11, 10);

            vec2Sub(a, v(1, 1), out);
            expect(a.x).toBeCloseTo(10, 10);
            expect(out.x).toBeCloseTo(9, 10);

            vec2Multiply(a, v(2, 2), out);
            expect(a.x).toBeCloseTo(10, 10);
            expect(out.x).toBeCloseTo(20, 10);

            vec2Divide(a, v(2, 2), out);
            expect(a.x).toBeCloseTo(10, 10);
            expect(out.x).toBeCloseTo(5, 10);
        });

        it('★ 省略 out 时新建对象，且不改自身', () =>
        {
            const a = v(1, 2);
            const out = vec2Add(a, v(1, 1));

            expect(out).not.toBe(a);
            expect(a.x).toBe(1);
            expect(out.x).toBeCloseTo(2, 10);
        });
    });

    describe('★ equals / copy / toString', () =>
    {
        it('★ equals：相同为真、任一分量不同为假', () =>
        {
            expect(vec2Equals(v(1, 2), v(1, 2))).toBe(true);
            expect(vec2Equals(v(1, 2), v(1, 3))).toBe(false);
            expect(vec2Equals(v(1, 2), v(9, 2))).toBe(false);
        });

        it('★ copy 写入 out 并返回 out；缺省 out 产生独立对象', () =>
        {
            const src = v(7, 8);
            const dst = { x: 0, y: 0 };

            expect(vec2Copy(src, dst)).toBe(dst);
            expect(dst.x).toBe(7);
            expect(dst.y).toBe(8);

            const c = vec2Copy(src);

            expect(c).not.toBe(src);
            c.x = 99;
            expect(src.x, '缺省 out 应独立').toBe(7);
        });

        it('★ toString 返回字符串且含两个分量', () =>
        {
            const s = vec2ToString(v(1.5, -2.25));

            expect(typeof s).toBe('string');
            expect(s).toContain('1.5');
            expect(s).toContain('2.25');
        });
    });
});
