import { describe, expect, it } from 'vitest';

import { Vector2 } from '../src/geom/vector2Ops';
import { CurvePath } from '../src/shape/core/CurvePath';
import { LineCurve2 } from '../src/shape/curves/LineCurve2';

/**
 * `CurvePath`（`packages/math/src/shape/core/CurvePath.ts`，53 行，此前**行覆盖率 35.84%**）。
 *
 * "由若干条相连曲线组成的路径，但对外的 API 仍然像一条曲线"。字段：
 *
 * ```ts
 * curves: Curve<T>[] = [];       // 子曲线
 * autoClose = false;             // 是否自动闭合
 * cacheLengths: number[] | null; // 弧长缓存（注释：未计算为 undefined，失效时置 null）
 * ```
 *
 * 主要方法：`add` / `closePath` / `getPoint(t)` / `getLength` / `updateArcLengths` /
 * `getCurveLengths` / `getSpacedPoints(40)` / `getPoints(12)`。
 *
 * 本文件用**直线拼成的路径**来断言 —— 直线的弧长与中点都是精确值，所以
 * `getLength()` 与 `getPoint(t)` 可以写成精确等式（曲线情形只能写"落在附近"）。
 *
 * 实测到的 `closePath` 语义：**首尾不相接时追加一条 `LineCurve2(endPoint, startPoint)`**，
 * 相接时**不追加**。
 */

const v2 = (x: number, y: number) => ({ x: x, y: y });

/** 一条沿 x 轴、由两条单位长直线接成的路径（总长 2） */
function twoSegments()
{
    const path = new CurvePath<Vector2>();

    path.add(new LineCurve2(v2(0, 0), v2(1, 0)));
    path.add(new LineCurve2(v2(1, 0), v2(2, 0)));

    return path;
}

describe('CurvePath（math/shape/core）', () =>
{
    describe('★ add 与字段', () =>
    {
        it('新建时 curves 为空、autoClose 为 false', () =>
        {
            const path = new CurvePath<Vector2>();

            expect(path.curves.length).toBe(0);
            expect(path.autoClose).toBe(false);
        });

        it('★ 每次 add 让 curves 长度加一，且顺序保持', () =>
        {
            const path = new CurvePath<Vector2>();
            const a = new LineCurve2(v2(0, 0), v2(1, 0));
            const b = new LineCurve2(v2(1, 0), v2(2, 0));

            path.add(a);
            expect(path.curves.length).toBe(1);
            path.add(b);
            expect(path.curves.length).toBe(2);
            expect(path.curves[0]).toBe(a);
            expect(path.curves[1]).toBe(b);
        });
    });

    describe('★★ closePath', () =>
    {
        it('★★ 首尾不相接时会追加一条闭合直线', () =>
        {
            const path = twoSegments();   // (0,0) → (1,0) → (2,0)

            path.closePath();

            // 首点 (0,0) 与末点 (2,0) 不同 → 追加一条 LineCurve2((2,0), (0,0))
            expect(path.curves.length).toBe(3);

            const last = path.curves[2];
            const start = last.getPoint(0)!;
            const end = last.getPoint(1)!;

            expect(start.x).toBeCloseTo(2, 6);
            expect(start.y).toBeCloseTo(0, 6);
            expect(end.x).toBeCloseTo(0, 6);
            expect(end.y).toBeCloseTo(0, 6);
        });

        it('★★ 首尾相接时**不**追加（路径本来就闭合）', () =>
        {
            const path = new CurvePath<Vector2>();

            path.add(new LineCurve2(v2(0, 0), v2(1, 0)));
            path.add(new LineCurve2(v2(1, 0), v2(0, 0)));   // 回到起点

            path.closePath();

            expect(path.curves.length).toBe(2);
        });
    });

    describe('★★ getLength / getPoint（用直线，值可精确算）', () =>
    {
        it('★★ 两条单位长直线 → getLength 为 2', () =>
        {
            expect(twoSegments().getLength()).toBeCloseTo(2, 6);
        });

        it('★★ getPoint(0) 是路径起点、getPoint(1) 是路径终点', () =>
        {
            const path = twoSegments();

            const start = path.getPoint(0)!;
            const end = path.getPoint(1)!;

            expect(start.x).toBeCloseTo(0, 6);
            expect(start.y).toBeCloseTo(0, 6);
            expect(end.x).toBeCloseTo(2, 6);
            expect(end.y).toBeCloseTo(0, 6);
        });

        it('★★ getPoint(0.5) 落在两段接缝处（各段长 1，总长 2）', () =>
        {
            const path = twoSegments();
            const mid = path.getPoint(0.5)!;

            expect(mid.x).toBeCloseTo(1, 6);
            expect(mid.y).toBeCloseTo(0, 6);
        });

        it('★ getPoint 在整段上都落在 x 轴上（y = 0）', () =>
        {
            const path = twoSegments();

            for (let i = 0; i <= 20; i++)
            {
                const p = path.getPoint(i / 20)!;

                expect(p.y, `t=${i / 20}`).toBeCloseTo(0, 6);
                expect(p.x, `t=${i / 20}`).toBeGreaterThanOrEqual(-1e-6);
                expect(p.x, `t=${i / 20}`).toBeLessThanOrEqual(2 + 1e-6);
            }
        });

        it('★ 单条直线路径：getLength 等于该直线长度、中点就是直线中点', () =>
        {
            const path = new CurvePath<Vector2>();

            path.add(new LineCurve2(v2(0, 0), v2(0, 10)));

            expect(path.getLength()).toBeCloseTo(10, 6);

            const mid = path.getPoint(0.5)!;

            expect(mid.x).toBeCloseTo(0, 6);
            expect(mid.y).toBeCloseTo(5, 6);
        });

        it('★★ 空路径的 getLength 是 undefined（不是 0）—— 如实钉住', () =>
        {
            // 实测：没有子曲线时返回 undefined，而不是 0。
            expect(new CurvePath<Vector2>().getLength()).toBeUndefined();
        });
    });

    describe('★ getCurveLengths / updateArcLengths', () =>
    {
        it('★★ getCurveLengths 给出各子曲线的长度', () =>
        {
            const path = twoSegments();

            path.add(new LineCurve2(v2(2, 0), v2(2, 3)));   // 再加一条长 3 的

            const lengths = path.getCurveLengths();

            // ★★ 实测：返回的是**累积**长度（1、1+1、1+1+3），而不是"各段长度"——
            // 尽管方法名与直觉都指向后者。第一版我按各段长度断言，失败了。
            expect(lengths.length).toBe(3);
            expect(lengths[0]).toBeCloseTo(1, 6);
            expect(lengths[1]).toBeCloseTo(2, 6);
            expect(lengths[2]).toBeCloseTo(5, 6);
        });

        it('★ updateArcLengths 之后 getLength 仍然正确', () =>
        {
            const path = twoSegments();
            const before = path.getLength();

            path.updateArcLengths();

            expect(path.getLength()).toBeCloseTo(before, 6);
        });
    });

    describe('★ getPoints / getSpacedPoints', () =>
    {
        it('★★ getPoints(divisions) **忽略 divisions**：恒返回 curves.length + 1 个点（实测）', () =>
        {
            // 实测：两条子曲线时，无论 divisions 传 1 / 4 / 12，都返回 3 个点。
            // 我第一版按基类 Curve 的约定（divisions + 1）断言，失败了。
            // 需要按 divisions 取点的是 getSpacedPoints（见下一条）。
            const path = twoSegments();

            for (const n of [1, 4, 12])
            {
                expect(path.getPoints(n).length, `divisions=${n}`).toBe(3);
            }
        });

        it('★ getSpacedPoints(divisions) 返回 divisions + 1 个点', () =>
        {
            const path = twoSegments();

            for (const n of [1, 4, 40])
            {
                expect(path.getSpacedPoints(n).length, `divisions=${n}`).toBe(n + 1);
            }
        });

        it('★ 取出的点都是有限的纯数据 Vector2 形状（无原型方法）', () =>
        {
            const path = twoSegments();

            for (const p of path.getPoints(6))
            {
                expect(typeof (p as unknown as { __type__?: unknown }).__type__, '纯函数层不产判别字段').toBe('undefined');
                expect(Object.getPrototypeOf(p)).toBe(Object.prototype);
                expect(Number.isFinite(p.x)).toBe(true);
                expect(Number.isFinite(p.y)).toBe(true);
            }
        });

        it('★ getSpacedPoints 的第一个与最后一个落在路径两端', () =>
        {
            const path = twoSegments();
            const pts = path.getSpacedPoints(4);

            expect(pts[0].x).toBeCloseTo(0, 6);
            expect(pts[pts.length - 1].x).toBeCloseTo(2, 6);
        });
    });
});
