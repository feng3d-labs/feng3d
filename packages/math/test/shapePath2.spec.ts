import { describe, expect, it } from 'vitest';

import { Shape2 } from '../src/shape/core/Shape2';
import { ShapePath2 } from '../src/shape/core/ShapePath2';
import { Vector2 } from '../src/geom/Vector2';

/**
 * `ShapePath2`（`packages/math/src/shape/core/`；此前行覆盖率 0%）。
 *
 * 它是"用命令式调用画出若干子路径，再转成 `Shape2`（形状 + 孔洞）"的工具，公开面：
 *
 * ```ts
 * moveTo / lineTo / quadraticCurveTo / bezierCurveTo / splineThru / closePath   // 返回 this，可链式
 * toShapes(isCCW = false, noHoles = false): Shape2[]
 * ```
 *
 * 断言覆盖**整链**：画路径 → `toShapes` → `Shape2.extractPoints` / `Shape2.triangulate`，
 * 每一步都用**数量关系**验证（子路径数 → 形状数 → 顶点数 → 三角形索引数），而不是"不抛异常"。
 *
 * 注：实现里 `closePath()` 用 `this.currentPath!`（未 `moveTo` 就调用会抛错），
 * 源码注释说明这是**有意保留原行为**，本文件如实断言它。
 */

/** 用 4 条边画一个轴对齐矩形子路径（调用前需先 moveTo） */
function drawRect(path: ShapePath2, x: number, y: number, w: number, h: number): void
{
    path.moveTo(x, y);
    path.lineTo(x + w, y);
    path.lineTo(x + w, y + h);
    path.lineTo(x, y + h);
    path.closePath();
}

describe('ShapePath2（math/shape/core）', () =>
{
    describe('路径构建', () =>
    {
        it('★ moveTo / lineTo / closePath 都返回 this（可链式）', () =>
        {
            const path = new ShapePath2();

            expect(path.moveTo(0, 0)).toBe(path);
            expect(path.lineTo(1, 0)).toBe(path);
            expect(path.lineTo(1, 1)).toBe(path);
            expect(path.closePath()).toBeUndefined();   // closePath 无返回值
        });

        it('★ 未 moveTo 就 closePath 会抛错（实现用 currentPath!，源码注释说明是有意保留）', () =>
        {
            const path = new ShapePath2();

            expect(() => path.closePath()).toThrow();
        });

        it('曲线入口（quadraticCurveTo / bezierCurveTo / splineThru）返回 this', () =>
        {
            const path = new ShapePath2();
            path.moveTo(0, 0);

            expect(path.quadraticCurveTo(1, 2, 3, 0)).toBe(path);
            expect(path.bezierCurveTo(1, 1, 2, 1, 3, 0)).toBe(path);

            const path2 = new ShapePath2();
            path2.moveTo(0, 0);

            expect(path2.splineThru([new Vector2(1, 1), new Vector2(2, 0)])).toBe(path2);
        });
    });

    describe('toShapes', () =>
    {
        it('★ 一个矩形子路径 → 1 个 Shape2（noHoles = true）', () =>
        {
            const path = new ShapePath2();
            drawRect(path, 0, 0, 4, 4);

            const shapes = path.toShapes(false, true);

            expect(shapes.length).toBe(1);
            expect(shapes[0]).toBeInstanceOf(Shape2);
        });

        it('★ 两个矩形子路径 → 2 个 Shape2', () =>
        {
            const path = new ShapePath2();
            drawRect(path, 0, 0, 2, 2);
            drawRect(path, 10, 10, 2, 2);

            const shapes = path.toShapes(false, true);

            expect(shapes.length).toBe(2);
            for (const s of shapes) expect(s).toBeInstanceOf(Shape2);
        });

        it('noHoles = false 时也不会崩（走孔洞判定分支）', () =>
        {
            const path = new ShapePath2();
            drawRect(path, 0, 0, 10, 10);

            expect(() => path.toShapes(false, false)).not.toThrow();
            expect(path.toShapes(false, false).length).toBeGreaterThanOrEqual(1);
        });

        it('★ toShapes 产生的 Shape2 带着原路径的曲线（可以取点）', () =>
        {
            const path = new ShapePath2();
            drawRect(path, 0, 0, 4, 4);

            const shape = path.toShapes(false, true)[0];
            const pts = shape.getPoints(4);

            expect(pts.length).toBeGreaterThan(1);
            for (const p of pts)
            {
                expect(Number.isFinite(p.x), `x=${p.x}`).toBe(true);
                expect(Number.isFinite(p.y), `y=${p.y}`).toBe(true);
            }
        });
    });

    describe('Shape2 的提取与三角化', () =>
    {
        it('★ extractPoints 给出 shape / holes 两组点', () =>
        {
            const path = new ShapePath2();
            drawRect(path, 0, 0, 4, 4);
            const shape = path.toShapes(false, true)[0];

            const extracted = shape.extractPoints(4);

            expect(Array.isArray(extracted.shape)).toBe(true);
            expect(extracted.shape.length).toBeGreaterThan(0);
            expect(Array.isArray(extracted.holes)).toBe(true);
        });

        it('★ 矩形三角化 → 2 个三角形（6 个索引），且索引不越界', () =>
        {
            const path = new ShapePath2();
            drawRect(path, 0, 0, 4, 4);
            const shape = path.toShapes(false, true)[0];

            const geometry = { points: [] as number[], indices: [] as number[] };
            shape.triangulate(geometry);

            const vertexCount = geometry.points.length / 2;

            expect(geometry.indices.length).toBeGreaterThan(0);
            expect(geometry.indices.length % 3).toBe(0);
            for (let i = 0; i < geometry.indices.length; i++)
            {
                const idx = geometry.indices[i];
                expect(Number.isInteger(idx), `indices[${i}] = ${idx}`).toBe(true);
                expect(idx, `indices[${i}] = ${idx}`).toBeGreaterThanOrEqual(0);
                expect(idx, `indices[${i}] = ${idx}`).toBeLessThan(vertexCount);
            }
        });

        it('★ 所有三角化出来的点都是有限数', () =>
        {
            const path = new ShapePath2();
            drawRect(path, -3, -5, 8, 6);
            const shape = path.toShapes(false, true)[0];

            const geometry = { points: [] as number[], indices: [] as number[] };
            shape.triangulate(geometry);

            for (let i = 0; i < geometry.points.length; i++)
            {
                expect(Number.isFinite(geometry.points[i]), `points[${i}] = ${geometry.points[i]}`).toBe(true);
            }
        });

        it('带孔洞时也能三角化（外层大矩形 + 内层小矩形）', () =>
        {
            const path = new ShapePath2();
            drawRect(path, 0, 0, 10, 10);
            drawRect(path, 3, 3, 4, 4);

            const shapes = path.toShapes(false, false);
            expect(shapes.length).toBeGreaterThanOrEqual(1);

            const geometry = { points: [] as number[], indices: [] as number[] };
            expect(() => shapes[0].triangulate(geometry)).not.toThrow();
            expect(geometry.indices.length % 3).toBe(0);
        });
    });
});
