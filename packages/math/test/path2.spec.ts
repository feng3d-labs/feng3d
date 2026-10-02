import { describe, expect, it } from 'vitest';


import { Path2 } from '../src/shape/core/Path2';

/**
 * `Path2`（`packages/math/src/shape/core/Path2.ts`，46+ 行，此前**行覆盖率 58.69%**）。
 *
 * 二维路径（`extends CurvePath<Vector2>`），把一串"路径命令"翻译成 `curves` 数组。
 *
 * ★★ **实测：所有命令遵循同一个统一模式**
 *
 * ```
 * 1. 用 this.currentPoint.clone() 作为曲线起点，构造一条具体曲线；
 * 2. this.curves.push(curve);
 * 3. this.currentPoint.set(终点)   // splineThru 用 .copy(最后一点)
 * 4. return this;                  // 因此可以链式调用
 * ```
 *
 * **`moveTo` 是唯一不产生曲线的命令**（它只 `currentPoint.set` 后返回 `this`）。
 *
 * 这个模式意味着 **`currentPoint` 始终等于"上一条曲线的终点"** —— 所以连续 `lineTo`
 * 一定是首尾相接的。本文件把这一点当作核心断言（它同时是"这条链没断"的守卫）。
 */

const v = (x: number, y: number) => ({ x: x, y: y });

describe('Path2（math/shape/core）', () =>
{
    describe('★ moveTo', () =>
    {
        it('★ moveTo 只设置 currentPoint，**不产生曲线**', () =>
        {
            const path = new Path2();

            path.moveTo(3, 4);

            expect(path.curves.length).toBe(0);
            expect(path.currentPoint.x).toBeCloseTo(3, 10);
            expect(path.currentPoint.y).toBeCloseTo(4, 10);
        });

        it('★ moveTo 返回 this（可链式）', () =>
        {
            const path = new Path2();

            expect(path.moveTo(1, 2)).toBe(path);
        });
    });

    describe('★★ lineTo 与曲线链', () =>
    {
        it('★★ 每次 lineTo 追加一条曲线，并更新 currentPoint', () =>
        {
            const path = new Path2();

            path.moveTo(0, 0);
            expect(path.curves.length).toBe(0);

            path.lineTo(1, 0);
            expect(path.curves.length).toBe(1);
            expect(path.currentPoint.x).toBeCloseTo(1, 10);
            expect(path.currentPoint.y).toBeCloseTo(0, 10);

            path.lineTo(1, 1);
            expect(path.curves.length).toBe(2);
            expect(path.currentPoint.y).toBeCloseTo(1, 10);
        });

        it('★★ 连续 lineTo 是首尾相接的（第 N 条曲线的起点 = 第 N-1 条的终点）', () =>
        {
            const path = new Path2();

            path.moveTo(0, 0).lineTo(1, 0).lineTo(1, 1).lineTo(0, 1);

            expect(path.curves.length).toBe(3);
            for (let i = 1; i < path.curves.length; i++)
            {
                const prevEnd = path.curves[i - 1].getPoint(1)!;
                const currStart = path.curves[i].getPoint(0)!;

                expect(currStart.x, `第 ${i} 条线的起点 x`).toBeCloseTo(prevEnd.x, 6);
                expect(currStart.y, `第 ${i} 条线的起点 y`).toBeCloseTo(prevEnd.y, 6);
            }
        });

        it('★★ 每条线的两端就是命令给出的两点', () =>
        {
            const path = new Path2();

            path.moveTo(2, 3).lineTo(7, 9);

            const c = path.curves[0];
            const start = c.getPoint(0)!;
            const end = c.getPoint(1)!;

            expect(start.x).toBeCloseTo(2, 6);
            expect(start.y).toBeCloseTo(3, 6);
            expect(end.x).toBeCloseTo(7, 6);
            expect(end.y).toBeCloseTo(9, 6);
        });

        it('★ lineTo 返回 this（可链式）', () =>
        {
            const path = new Path2();

            expect(path.moveTo(0, 0).lineTo(1, 1)).toBe(path);
        });
    });

    describe('★★ fromPoints（moveTo + 逐个 lineTo）', () =>
    {
        it('★★ N 个点产生 N − 1 条曲线', () =>
        {
            const path = new Path2();

            path.fromPoints([v(0, 0), v(1, 0), v(2, 0), v(3, 0)]);

            expect(path.curves.length).toBe(3);
        });

        it('★ currentPoint 停在第末个点上', () =>
        {
            const path = new Path2();

            path.fromPoints([v(0, 0), v(5, 6)]);

            expect(path.currentPoint.x).toBeCloseTo(5, 10);
            expect(path.currentPoint.y).toBeCloseTo(6, 10);
        });

        it('★ fromPoints 返回 this', () =>
        {
            const path = new Path2();

            expect(path.fromPoints([v(0, 0), v(1, 1)])).toBe(path);
        });

        it('★ 单个点时不产生曲线（只有 moveTo）', () =>
        {
            const path = new Path2();

            path.fromPoints([v(1, 1)]);

            expect(path.curves.length).toBe(0);
            expect(path.currentPoint.x).toBeCloseTo(1, 10);
        });
    });

    describe('★★ 曲线命令同样"更新 currentPoint + 返回 this"', () =>
    {
        it('★ quadraticCurveTo 追加一条二次贝塞尔并更新点', () =>
        {
            const path = new Path2();

            expect(path.moveTo(0, 0).quadraticCurveTo(1, 2, 3, 0)).toBe(path);
            expect(path.curves.length).toBe(1);

            const c = path.curves[0];

            expect(c.getPoint(0)!.x).toBeCloseTo(0, 6);
            expect(c.getPoint(1)!.x).toBeCloseTo(3, 6);
            expect(path.currentPoint.x).toBeCloseTo(3, 10);
        });

        it('★ bezierCurveTo 追加一条三次贝塞尔并更新点', () =>
        {
            const path = new Path2();

            expect(path.moveTo(0, 0).bezierCurveTo(1, 1, 2, 1, 3, 0)).toBe(path);
            expect(path.curves.length).toBe(1);

            const c = path.curves[0];

            expect(c.getPoint(0)!.x).toBeCloseTo(0, 6);
            expect(c.getPoint(1)!.x).toBeCloseTo(3, 6);
            expect(path.currentPoint.x).toBeCloseTo(3, 10);
        });

        it('★ splineThru 把 currentPoint 当作首点，并停在最后一点', () =>
        {
            const path = new Path2();

            expect(path.moveTo(0, 0).splineThru([v(1, 1), v(2, 0)])).toBe(path);
            expect(path.curves.length).toBe(1);
            expect(path.currentPoint.x).toBeCloseTo(2, 10);

            const c = path.curves[0];

            expect(c.getPoint(0)!.x).toBeCloseTo(0, 6);
            expect(c.getPoint(1)!.x).toBeCloseTo(2, 6);
        });

        it('★ 曲线命令之间也能首尾相接（先 lineTo 再 quadraticCurveTo）', () =>
        {
            const path = new Path2();

            path.moveTo(0, 0).lineTo(1, 0).quadraticCurveTo(2, 1, 3, 0);

            expect(path.curves.length).toBe(2);

            const lineEnd = path.curves[0].getPoint(1)!;
            const quadStart = path.curves[1].getPoint(0)!;

            expect(quadStart.x).toBeCloseTo(lineEnd.x, 6);
            expect(quadStart.y).toBeCloseTo(lineEnd.y, 6);
        });
    });

    describe('★ 构造', () =>
    {
        it('★ 不带 points 时 curves 为空、currentPoint 是 (0,0)', () =>
        {
            const path = new Path2();

            expect(path.curves.length).toBe(0);
            expect(path.currentPoint.x).toBe(0);
            expect(path.currentPoint.y).toBe(0);
        });

        it('★★ 带 points 的构造等价于先构造再 fromPoints', () =>
        {
            const a = new Path2([v(0, 0), v(1, 2), v(3, 4)]);
            const b = new Path2();

            b.fromPoints([v(0, 0), v(1, 2), v(3, 4)]);

            expect(a.curves.length).toBe(b.curves.length);
            expect(a.currentPoint.x).toBeCloseTo(b.currentPoint.x, 10);
            expect(a.currentPoint.y).toBeCloseTo(b.currentPoint.y, 10);
        });

        it('★ 空 points 数组会让 fromPoints 抛错（实现直接取 points[0]）—— 如实钉住', () =>
        {
            // 实测：fromPoints 第一行就是 points[0].x，空数组会抛 TypeError。
            // 注意 new Path2() 不传参数是走另一条分支（不会调 fromPoints）。
            expect(() => new Path2().fromPoints([])).toThrow();
        });
    });
});
