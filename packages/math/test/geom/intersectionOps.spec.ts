import { assert, describe, it } from 'vitest';
import type { Line3Like } from '../../src/geom/line3';
import { line3Equals, line3FromPoints, line3OnWithPoint } from '../../src/geom/line3';
import type { Segment3Like } from '../../src/geom/segment3';
import { seg3Equals, seg3FromPoints } from '../../src/geom/segment3';
import type { Triangle3Like } from '../../src/geom/triangle3';
import { tri3FromPoints } from '../../src/geom/triangle3';
import { line3IntersectWithLine3D, seg3IntersectionWithLine, tri3IntersectionWithLine } from '../../src/geom/intersection';
import { vec3Equals } from '../../src/geom/vector3';

/**
 * `intersection` 纯函数层的契约测试（issue #134 阶段 C-a）。
 *
 * 这一层取代的是三个 class 里「联合类型 + `instanceof`」的成员
 * （`Line3.intersectWithLine3D` / `Segment3.intersectionWithLine` / `Triangle3.intersectionWithLine`），
 * 所以本文件重点钉住**结果形状的判别**：`'origin' in r` = 直线、`'p0' in r` = 线段、否则是点、`null` = 不相交。
 *
 * 期望值全部**手算**（不是在调用同一个实现的两条路径之间对拍）：
 * 这里的几何都是整数坐标 + 轴对齐情形，交点是显然的。
 */
describe('intersection 纯函数层（#134 C-a）', () =>
{
    /** 结果形状的名字，便于断言 */
    function shapeOf(r: unknown): 'line' | 'segment' | 'point' | 'null'
    {
        if (!r) return 'null';
        if ('origin' in (r as object)) return 'line';
        if ('p0' in (r as object)) return 'segment';

        return 'point';
    }

    describe('line3IntersectWithLine3D', () =>
    {
        it('平行 → null', () =>
        {
            const a = line3FromPoints({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
            const b = line3FromPoints({ x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 });

            assert.equal(line3IntersectWithLine3D(a, b), null);
        });

        it('重合 → 返回直线形状（`origin` / `direction`）', () =>
        {
            const a = line3FromPoints({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
            const b = line3FromPoints({ x: 5, y: 0, z: 0 }, { x: 6, y: 0, z: 0 });

            const r = line3IntersectWithLine3D(a, b);

            assert.equal(shapeOf(r), 'line');
            assert.ok(line3Equals(r as Line3Like, a));
        });

        it('★ 相交 → 交于点 (1, 0, 0)（手算：x 轴与「x=1、z=0 的 y 方向直线」的交点）', () =>
        {
            const a = line3FromPoints({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
            const b = line3FromPoints({ x: 1, y: -5, z: 0 }, { x: 1, y: 5, z: 0 });

            const r = line3IntersectWithLine3D(a, b);

            assert.equal(shapeOf(r), 'point');
            assert.ok(vec3Equals(r as { x: number, y: number, z: number }, { x: 1, y: 0, z: 0 }, 1e-6), `实际 ${JSON.stringify(r)}`);
            assert.ok(line3OnWithPoint(a, r as { x: number, y: number, z: number }));
        });

        it('异面（不相交）→ null', () =>
        {
            // x 轴（y=0、z=0）与「x=0、y=1、沿 z 的直线」是异面直线：没有交点，也不平行
            const a = line3FromPoints({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
            const b = line3FromPoints({ x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 2 });

            assert.equal(line3IntersectWithLine3D(a, b), null);
        });
    });

    describe('seg3IntersectionWithLine', () =>
    {
        it('★ 直线与线段相交 → 交于点', () =>
        {
            const s = seg3FromPoints({ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 });
            const line = line3FromPoints({ x: 1, y: -3, z: 0 }, { x: 1, y: 3, z: 0 });

            const r = seg3IntersectionWithLine(s, line);

            assert.equal(shapeOf(r), 'point');
            assert.ok(vec3Equals(r as { x: number, y: number, z: number }, { x: 1, y: 0, z: 0 }, 1e-9), `实际 ${JSON.stringify(r)}`);
        });

        it('直线与线段重合 → 返回该线段', () =>
        {
            const s = seg3FromPoints({ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 });
            const line = line3FromPoints({ x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });

            const r = seg3IntersectionWithLine(s, line);

            assert.equal(shapeOf(r), 'segment');
            assert.ok(seg3Equals(r as Segment3Like, s));
        });

        it('交点落在线段之外 → null', () =>
        {
            const s = seg3FromPoints({ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 });
            const line = line3FromPoints({ x: 5, y: -3, z: 0 }, { x: 5, y: 3, z: 0 });

            assert.equal(seg3IntersectionWithLine(s, line), null);
        });
    });

    describe('tri3IntersectionWithLine', () =>
    {
        /** xy 平面上的单位三角形 (0,0,0) (1,0,0) (0,1,0) */
        const tri: Triangle3Like = tri3FromPoints({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });

        it('★ 直线穿过三角形内部 → 交于点', () =>
        {
            const line = line3FromPoints({ x: 0.25, y: 0.25, z: -1 }, { x: 0.25, y: 0.25, z: 1 });

            const r = tri3IntersectionWithLine(tri, line);

            assert.equal(shapeOf(r), 'point');
            assert.ok(vec3Equals(r as { x: number, y: number, z: number }, { x: 0.25, y: 0.25, z: 0 }, 1e-9), `实际 ${JSON.stringify(r)}`);
        });

        it('直线穿过平面但落在三角形之外 → null', () =>
        {
            const line = line3FromPoints({ x: 2, y: 2, z: -1 }, { x: 2, y: 2, z: 1 });

            assert.equal(tri3IntersectionWithLine(tri, line), null);
        });

        it('★ 直线落在三角形平面上、穿过三角形 → 交于一段（线段的两个端点都在三角形边上）', () =>
        {
            // y = 0.5 的水平线：与边 (0,0,0)-(1,0,0) 平行，与斜边 x+y=1 交于 (0.5, 0.5, 0)、
            // 与边 (0,0,0)-(0,1,0) 交于 (0, 0.5, 0)
            const line = line3FromPoints({ x: -1, y: 0.5, z: 0 }, { x: 1, y: 0.5, z: 0 });

            const r = tri3IntersectionWithLine(tri, line);

            assert.equal(shapeOf(r), 'segment');
            assert.ok(
                seg3Equals(r as Segment3Like, seg3FromPoints({ x: 0, y: 0.5, z: 0 }, { x: 0.5, y: 0.5, z: 0 }), 1e-6),
                `实际 ${JSON.stringify(r)}`,
            );
        });

        it('直线落在三角形平面上但在三角形之外 → null', () =>
        {
            const line = line3FromPoints({ x: 5, y: 5, z: 0 }, { x: 6, y: 5, z: 0 });

            assert.equal(tri3IntersectionWithLine(tri, line), null);
        });

        it('直线平行于三角形平面（错开）→ null', () =>
        {
            const line = line3FromPoints({ x: -1, y: 0.25, z: 1 }, { x: 1, y: 0.25, z: 1 });

            assert.equal(tri3IntersectionWithLine(tri, line), null);
        });
    });
});
