import { describe, expect, it } from 'vitest';
import { Vector2 } from '@feng3d/math';

import { ShapeUtils } from '../src/shape/ShapeUtils';

/**
 * `ShapeUtils`（`packages/math/src/shape/`；此前行覆盖率 0%）。
 *
 * 三个 static 方法都是**纯几何计算**，断言可以很精确：
 *
 * - `area`：**鞋带公式**（`a += x_p·y_q - x_q·y_p`，再乘 0.5）→ 逆时针为正、顺时针为负；
 * - `isClockWise`：就是 `area(contour) < 0`；
 * - `triangulateShape`：用 `earcut` 把（可带孔洞的）多边形三角化成 `number[][]`（每项 3 个索引）。
 *
 * 注意 `removeDupEndPts` 会**就地修改**传入数组，所以每个用例都用新造的点。
 */

const p = (x: number, y: number) => ({ x: x, y: y });

/** 逆时针单位正方形 */
const ccwSquare = () => [p(0, 0), p(1, 0), p(1, 1), p(0, 1)];
/** 顺时针单位正方形 */
const cwSquare = () => [p(0, 0), p(0, 1), p(1, 1), p(1, 0)];

describe('ShapeUtils（math/shape）', () =>
{
    describe('area（鞋带公式）', () =>
    {
        it('★ 逆时针单位正方形的面积是 +1', () =>
        {
            expect(ShapeUtils.area(ccwSquare())).toBeCloseTo(1, 10);
        });

        it('★ 顺时针单位正方形的面积是 -1（符号反映方向）', () =>
        {
            expect(ShapeUtils.area(cwSquare())).toBeCloseTo(-1, 10);
        });

        it('★ 直角三角形 (0,0)-(1,0)-(0,1) 的面积是 0.5', () =>
        {
            expect(ShapeUtils.area([p(0, 0), p(1, 0), p(0, 1)])).toBeCloseTo(0.5, 10);
        });

        it('★ 平移整体不改变面积（只与形状有关）', () =>
        {
            const a = ShapeUtils.area(ccwSquare());
            const b = ShapeUtils.area(ccwSquare().map((v) => p(v.x + 100, v.y - 37)));

            expect(b).toBeCloseTo(a, 10);
        });

        it('★ 边长放大 2 倍 → 面积放大 4 倍', () =>
        {
            const a = ShapeUtils.area(ccwSquare());
            const b = ShapeUtils.area(ccwSquare().map((v) => p(v.x * 2, v.y * 2)));

            expect(b).toBeCloseTo(a * 4, 10);
        });

        it('退化输入（少于 3 个点）返回 0', () =>
        {
            expect(ShapeUtils.area([])).toBeCloseTo(0, 10);
            expect(ShapeUtils.area([p(1, 1)])).toBeCloseTo(0, 10);
            expect(ShapeUtils.area([p(0, 0), p(1, 1)])).toBeCloseTo(0, 10);
        });
    });

    describe('isClockWise', () =>
    {
        it('★ 逆时针为 false、顺时针为 true', () =>
        {
            expect(ShapeUtils.isClockWise(ccwSquare())).toBe(false);
            expect(ShapeUtils.isClockWise(cwSquare())).toBe(true);
        });

        it('★ 与 area 的符号严格一致', () =>
        {
            for (const contour of [ccwSquare(), cwSquare(), [p(0, 0), p(3, 0), p(0, 4)], [p(0, 0), p(0, 4), p(3, 0)]])
            {
                const { area } = ShapeUtils;
                const c = contour;

                expect(ShapeUtils.isClockWise(c)).toBe(area(c) < 0);
            }
        });
    });

    describe('triangulateShape（earcut）', () =>
    {
        it('★ 无孔正方形 → 2 个三角形，每个 3 个索引', () =>
        {
            const faces = ShapeUtils.triangulateShape(ccwSquare(), []);

            expect(faces.length).toBe(2);
            for (const f of faces) expect(f.length).toBe(3);
        });

        it('★ 所有索引都在 [0, 顶点数) 内', () =>
        {
            const contour = ccwSquare();
            const faces = ShapeUtils.triangulateShape(contour, []);

            for (let i = 0; i < faces.length; i++)
            {
                for (const idx of faces[i])
                {
                    expect(Number.isInteger(idx), `faces[${i}] = ${idx}`).toBe(true);
                    expect(idx, `faces[${i}] = ${idx}`).toBeGreaterThanOrEqual(0);
                    expect(idx, `faces[${i}] = ${idx}`).toBeLessThan(contour.length);
                }
            }
        });

        it('★ 带孔洞时三角形数量比无孔时多', () =>
        {
            const contour = [p(0, 0), p(4, 0), p(4, 4), p(0, 4)];
            const hole = [p(1, 1), p(1, 2), p(2, 2), p(2, 1)];

            const withoutHole = ShapeUtils.triangulateShape(contour.map((v) => p(v.x, v.y)), []);
            const withHole = ShapeUtils.triangulateShape(contour.map((v) => p(v.x, v.y)), [hole]);

            expect(withHole.length).toBeGreaterThan(withoutHole.length);
        });

        it('带孔洞时索引仍不越界（孔洞顶点计入总顶点数）', () =>
        {
            const contour = [p(0, 0), p(4, 0), p(4, 4), p(0, 4)];
            const hole = [p(1, 1), p(1, 2), p(2, 2), p(2, 1)];
            const totalVertices = contour.length + hole.length;
            const faces = ShapeUtils.triangulateShape(contour, [hole]);

            expect(faces.length).toBeGreaterThan(0);
            for (const f of faces)
            {
                for (const idx of f)
                {
                    expect(idx, `索引 ${idx} 超出 ${totalVertices} 个顶点`).toBeLessThan(totalVertices);
                }
            }
        });

        it('★ n 边形的三角形数至少是 n - 2（三角化下界）', () =>
        {
            // 正六边形
            const hexagon: Vector2[] = [];
            for (let i = 0; i < 6; i++)
            {
                const a = (i / 6) * Math.PI * 2;
                hexagon.push(p(Math.cos(a) * 3, Math.sin(a) * 3));
            }

            const faces = ShapeUtils.triangulateShape(hexagon, []);

            expect(faces.length).toBeGreaterThanOrEqual(6 - 2);
        });

        it('首尾重复的端点被移除，不产生退化三角形', () =>
        {
            // 显式把首点再放一份到末尾（earcut 会因重复点出问题，实现里有 removeDupEndPts 兜住）
            const withDupEnd = [p(0, 0), p(1, 0), p(1, 1), p(0, 1), p(0, 0)];
            const faces = ShapeUtils.triangulateShape(withDupEnd, []);

            expect(faces.length).toBe(2);
            for (const f of faces) expect(f.length).toBe(3);
        });
    });
});
