import { describe, expect, it } from 'vitest';

import { Shape2 } from '../src/shape/core/Shape2';
import { ShapePath2 } from '../src/shape/core/ShapePath2';

/**
 * ShapePath2.toShapes 的**孔洞判定路径**（noHoles = false）。
 *
 * 实现里有一个模块内私有函数 isPointInsidePolygon(inPt, inPolygon) —— 标准**射线法**：
 * 沿水平线左右翻转 inside，点落在轮廓上时直接返回 true（顶点 / 边 / 共线水平边三种情形）。
 *
 * ★★ 但**仅"几何包含"并不足以被判成孔洞**（这是我第一次跑测试时发现的）：
 * 外框与内框**同向**画时，toShapes(false, false) 给出**两个独立形状**；
 * 只有**内框绕向与外框相反**时，它才会被识别为孔洞、与外框**合并成一个 Shape2**。
 * 这与 three.js 的约定一致，但**从方法签名与文档里看不出来**。
 *
 * Round 81 的 shapePath2.spec.ts 只覆盖到"带孔洞时也能三角化"，**没有验证孔洞是否真被判出来**；
 * 本文件补上这一点，并把"方向要求"同时用**正例与反例**钉住。
 */

/** 顺时针画一个轴对齐矩形（作为外轮廓） */
function drawRect(path: ShapePath2, x: number, y: number, w: number, h: number): void
{
    path.moveTo(x, y);
    path.lineTo(x + w, y);
    path.lineTo(x + w, y + h);
    path.lineTo(x, y + h);
    path.closePath();
}

/** 反向（绕向相反）画同样的矩形 —— 用作孔洞 */
function drawRectReversed(path: ShapePath2, x: number, y: number, w: number, h: number): void
{
    path.moveTo(x, y);
    path.lineTo(x, y + h);
    path.lineTo(x + w, y + h);
    path.lineTo(x + w, y);
    path.closePath();
}

/** 取形状的孔洞数量 */
function holeCount(shape: Shape2): number
{
    return shape.extractPoints(4).holes.length;
}

/** 取形状的轮廓点数 */
function outlineCount(shape: Shape2): number
{
    return shape.extractPoints(4).shape.length;
}

describe('ShapePath2 的孔洞判定（toShapes 的 noHoles = false 路径）', () =>
{
    describe('★★ 孔洞的判定条件', () =>
    {
        it('★★ 外框 + **反向**的内框 → 合并成一个带孔洞的 Shape2', () =>
        {
            const path = new ShapePath2();

            drawRect(path, 0, 0, 10, 10);            // 外轮廓
            drawRectReversed(path, 3, 3, 4, 4);      // 绕向相反 → 孔洞

            const shapes = path.toShapes(false, false);

            expect(shapes.length, '内框应被当作孔洞、与外框合并').toBe(1);
            expect(shapes[0]).toBeInstanceOf(Shape2);
            expect(holeCount(shapes[0]), '应至少有一个孔洞').toBeGreaterThan(0);
            expect(outlineCount(shapes[0]), '外轮廓应当还在').toBeGreaterThan(0);
        });

        it('★★ 反例：同样的几何包含，但两个框**同向** → 不会被判成孔洞（两个独立形状）', () =>
        {
            const path = new ShapePath2();

            drawRect(path, 0, 0, 10, 10);
            drawRect(path, 3, 3, 4, 4);              // 同向

            const shapes = path.toShapes(false, false);

            expect(shapes.length, '同向就不算孔洞').toBe(2);
            for (const s of shapes) expect(holeCount(s)).toBe(0);
        });

        it('★★ noHoles = true 会跳过孔洞判定：反向内框也各自成独立形状', () =>
        {
            const withHoles = new ShapePath2();

            drawRect(withHoles, 0, 0, 10, 10);
            drawRectReversed(withHoles, 3, 3, 4, 4);

            const withoutHoles = new ShapePath2();

            drawRect(withoutHoles, 0, 0, 10, 10);
            drawRectReversed(withoutHoles, 3, 3, 4, 4);

            expect(withHoles.toShapes(false, false).length, '默认会判孔洞').toBe(1);
            expect(withoutHoles.toShapes(false, true).length, 'noHoles 时不判').toBe(2);
        });

        it('★★ 孔洞本身也有轮廓点（形状没被"吃掉"）', () =>
        {
            const path = new ShapePath2();

            drawRect(path, 0, 0, 10, 10);
            drawRectReversed(path, 3, 3, 4, 4);

            const shape = path.toShapes(false, false)[0];
            const extracted = shape.extractPoints(4);

            expect(extracted.holes.length).toBeGreaterThan(0);
            expect(extracted.holes[0].length, '孔洞也应有轮廓点').toBeGreaterThan(0);
        });
    });

    describe('★ 其它情形', () =>
    {
        it('★ 两个互不包含的矩形 → 两个形状，都没有孔洞', () =>
        {
            const path = new ShapePath2();

            drawRect(path, 0, 0, 4, 4);
            drawRect(path, 100, 100, 4, 4);

            const shapes = path.toShapes(false, false);

            expect(shapes.length).toBe(2);
            for (const s of shapes) expect(holeCount(s)).toBe(0);
        });

        it('★ 单个子路径 → 一个形状、没有孔洞', () =>
        {
            const path = new ShapePath2();

            drawRect(path, 0, 0, 5, 5);

            const shapes = path.toShapes(false, false);

            expect(shapes.length).toBe(1);
            expect(holeCount(shapes[0])).toBe(0);
        });

        it('★ 空路径 → 空数组（两种 noHoles 都不发散）', () =>
        {
            expect(new ShapePath2().toShapes(false, false)).toEqual([]);
            expect(new ShapePath2().toShapes(false, true)).toEqual([]);
        });

        it('★ 反向内框在**外侧**时不会发生"反向包含"（形状数合理、不崩）', () =>
        {
            const path = new ShapePath2();

            drawRectReversed(path, 3, 3, 4, 4);
            drawRect(path, 0, 0, 10, 10);

            const shapes = path.toShapes(false, false);

            expect(shapes.length).toBeGreaterThanOrEqual(1);
            for (const s of shapes) expect(s).toBeInstanceOf(Shape2);
        });
    });
});