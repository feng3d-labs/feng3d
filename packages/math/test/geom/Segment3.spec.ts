import { line3FromPoints, line3FromPosAndDir } from '../../src/geom/line3';
import { seg3Equals, seg3FromPoints, seg3GetPoint, seg3OnWithPoint, seg3Random } from '../../src/geom/segment3';
import { seg3IntersectionWithLine, seg3IntersectionWithSegment } from '../../src/geom/intersection';
import { vec3Equals, vec3Random, vec3Sub } from '../../src/geom/vector3';
import { assert, describe, it } from 'vitest';

/**
 * `Segment3` 的相交 / 判定行为（issue #134 阶段 C-c）。
 *
 * **本文件在 C-c 之前是 class 行为用例**（`new Segment3().random()` / `s.intersectionWithLine(l)`）；
 * class 删除后整文件改写为纯函数用例，**断言逐条保留**：
 *
 * | 原 class 写法 | 现纯函数写法 |
 * |---|---|
 * | `new Segment3().random()` | `seg3Random()` |
 * | `s.getPoint(t)` | `seg3GetPoint(s, t)` |
 * | `s.onWithPoint(p)` | `seg3OnWithPoint(s, p)` |
 * | `s.intersectionWithLine(l)` | `seg3IntersectionWithLine(s, l)` |
 * | `s.intersectionWithSegment(s0)` | `seg3IntersectionWithSegment(s, s0)` |
 * | `new Segment3().fromPoints(p0, p1)` | `seg3FromPoints(p0, p1)` |
 * | `new Line3().fromPoints(p, q)` / `.fromPosAndDir(p, d)` | `line3FromPoints(p, q)` / `line3FromPosAndDir(p, d)` |
 *
 * 判别方式随之从 `instanceof Segment3` 换成**结构化字段** `'p0' in r`（`intersection` 的统一做法）。
 * 原先的随机用例（依赖 `Math.random`、未固定种子）逐字保留，另补两条**确定性**用例覆盖
 * 「与线段重合」与「夹点落到线段外 ⇒ null」这两个退化分支。
 */
describe('Segment3D', () =>
{
    it('onWithPoint', () =>
    {
        const s = seg3Random();

        for (let i = 0; i < 10; i++)
        {
            const p = seg3GetPoint(s, Math.random());

            assert.ok(seg3OnWithPoint(s, p));
        }
    });

    it('intersectionWithLine', () =>
    {
        const s = seg3Random();
        const p = seg3GetPoint(s, Math.random());
        const l = line3FromPoints(p, vec3Random());

        const r0 = seg3IntersectionWithLine(s, l);

        assert.ok(r0 && !('p0' in r0) && vec3Equals(p, r0));

        const l2 = line3FromPosAndDir(p, vec3Sub(s.p1, s.p0));
        const r1 = seg3IntersectionWithLine(s, l2);

        assert.ok(r1 && 'p0' in r1 && seg3Equals(s, r1));
    });

    it('intersectionWithSegment', () =>
    {
        const s = seg3Random();
        const p0 = seg3GetPoint(s, Math.random());
        const p1 = vec3Random();
        const s0 = seg3FromPoints(p0, p1);

        const r0 = seg3IntersectionWithSegment(s, s0);

        assert.ok(r0 && !('p0' in r0) && vec3Equals(p0, r0));

        const p2 = seg3GetPoint(s, 1 + Math.random());
        const s1 = seg3FromPoints(p0, p2);
        const r1 = seg3IntersectionWithSegment(s, s1);

        assert.ok(r1 && seg3Equals(seg3FromPoints(p0, s.p1), r1));
    });

    it('★ 确定性：与线段重合时返回被裁出的那一段（结构判别的线段分支）', () =>
    {
        const a = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 10, y: 0, z: 0 } };
        const b = { p0: { x: 2, y: 0, z: 0 }, p1: { x: 8, y: 0, z: 0 } };
        const r = seg3IntersectionWithSegment(a, b);

        assert.ok(r && 'p0' in r, '应返回一段');
        assert.deepEqual({ x: r.p0.x, y: r.p0.y, z: r.p0.z }, { x: 2, y: 0, z: 0 });
        assert.deepEqual({ x: r.p1.x, y: r.p1.y, z: r.p1.z }, { x: 8, y: 0, z: 0 });
    });

    it('★ 确定性：夹点落到本线段之外 ⇒ null（原实现的第二个 return null）', () =>
    {
        const a = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 10, y: 0, z: 0 } };
        const b = { p0: { x: 20, y: 0, z: 0 }, p1: { x: 30, y: 0, z: 0 } };

        assert.equal(seg3IntersectionWithSegment(a, b), null);
    });
});
