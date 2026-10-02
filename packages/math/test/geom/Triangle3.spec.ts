import { mathUtil } from '@feng3d/polyfill';
import { line3DistanceWithPoint, line3FromPoints } from '../../src/geom/line3Ops';
import { seg3Equals, seg3FromPoints, seg3GetPoint } from '../../src/geom/segment3Ops';
import { tri3DecomposeWithLine, tri3DecomposeWithSegment, tri3IntersectionWithLine, tri3IntersectionWithSegment } from '../../src/geom/intersectionOps';
import {
    tri3Area,
    tri3BlendWithPoint,
    tri3ClosestPointWithPoint,
    tri3DecomposeWithPoint,
    tri3GetBarycentricCoordinates,
    tri3GetCircumcenter,
    tri3GetInnercenter,
    tri3GetNormal,
    tri3GetOrthocenter,
    tri3GetPoint,
    tri3GetSegments,
    tri3OnWithPoint,
    tri3Random,
    tri3RandomPoint,
    tri3Rasterize,
    tri3RasterizeCustom,
} from '../../src/geom/triangle3Ops';
import { vec3Add, vec3AddNumber, vec3Dot, vec3Equals, vec3Length, vec3Random, vec3Sub } from '../../src/geom/vector3Ops';

import { assert, afterEach, beforeEach, describe, it, vi } from 'vitest';

/**
 * 用**固定序列**替换 `Math.random`（issue #190）。
 *
 * 这一组用例依赖 `tri3Random` / `vec3Random` 造数据，而随机值落到退化位置
 * （点落在顶点上、两点近乎重合、直线与边共线）时判据会偶发不成立——实测两次失败分别落在
 * `intersectionWithLine` 与 `rasterizeCustom`，单独跑 6 次却全过。
 *
 * 固定序列让每次跑的都是**同一组数据**：通过是真的通过，失败也能原样复现（不再是"重跑一次就好"）。
 * 每个用例前重置种子，用例之间也不互相影响。
 *
 * ## 已知限制（如实记录）
 *
 * 这**没有**修掉判据本身对退化输入的敏感：把 `Math.random` 换成恒 `0`（极端退化：顶点重合、
 * 直线与边共线）时 14 个用例里有 7 个失败。本次只消除"随机性"这一层，让结果确定；
 * 要连退化输入也稳，得给这些几何操作补上退化情形的期望行为（或在使用例里显式避开退化输入），
 * 那是另一件事（issue #190 里记着）。
 *
 * ## issue #134 阶段 C-c
 *
 * 本文件原先全部是 **class 行为用例**（`new Triangle3().random()` / `t.decomposeWithPoint(p)`）；
 * `Triangle3` 的 class 删除后整文件改写为**同义纯函数用例**，断言逐条保留。
 * 调用次数与顺序**刻意逐字不变**（`vec3Random` 与 `Vector3.random` 是同一个实现），
 * 所以上面那套固定序列的期望值不受改写影响（方案 §10.1 的 P5）。
 */
let randomSeed = 12345;

/** 线性同余伪随机（[0,1)），只用于让测试确定化 */
function seededRandom(): number
{
    randomSeed = (randomSeed * 1103515245 + 12345) % 2147483648;

    return randomSeed / 2147483648;
}

beforeEach(() =>
{
    randomSeed = 12345;
    vi.spyOn(Math, 'random').mockImplementation(seededRandom);
});

afterEach(() =>
{
    vi.restoreAllMocks();
});

describe('Triangle3', () =>
{
    it('randomPoint', () =>
    {
        const t = tri3Random();
        const p = tri3RandomPoint(t);

        assert.ok(
            tri3OnWithPoint(t, p)
        );
    });

    it('blendWithPoint', () =>
    {
        const t = tri3Random();
        const p = tri3RandomPoint(t);
        const b = tri3BlendWithPoint(t, p);

        assert.ok(
            vec3Equals(tri3GetPoint(t, b), p)
        );
    });

    it('getCircumcenter', () =>
    {
        const t = tri3Random();
        const circumcenter = tri3GetCircumcenter(t);

        assert.ok(
            mathUtil.equals(vec3Length(vec3Sub(circumcenter, t.p0)), vec3Length(vec3Sub(circumcenter, t.p1)))
        );

        assert.ok(
            mathUtil.equals(vec3Length(vec3Sub(circumcenter, t.p0)), vec3Length(vec3Sub(circumcenter, t.p2)))
        );
    });

    it('getInnercenter', () =>
    {
        const t = tri3Random();
        const p = tri3GetInnercenter(t);
        const d0 = line3DistanceWithPoint(line3FromPoints(t.p0, t.p1), p);
        const d1 = line3DistanceWithPoint(line3FromPoints(t.p0, t.p2), p);
        const d2 = line3DistanceWithPoint(line3FromPoints(t.p2, t.p1), p);

        assert.ok(
            tri3OnWithPoint(t, p)
        );

        assert.ok(
            mathUtil.equals(d0, d1)
        );

        assert.ok(
            mathUtil.equals(d0, d2)
        );
    });

    it('getOrthocenter', () =>
    {
        const t = tri3Random();
        const p = tri3GetOrthocenter(t);

        assert.ok(
            mathUtil.equals(0,
                vec3Dot(vec3Sub(t.p0, t.p1), vec3Sub(p, t.p2))
            )
        );
        assert.ok(
            mathUtil.equals(0,
                vec3Dot(vec3Sub(t.p2, t.p1), vec3Sub(p, t.p0))
            )
        );
        assert.ok(
            mathUtil.equals(0,
                vec3Dot(vec3Sub(t.p2, t.p0), vec3Sub(p, t.p1))
            )
        );
    });

    it('decomposeWithPoint', () =>
    {
        // 分割后的三角形面积总和与原三角形面积相等
        const t = tri3Random();
        let p = tri3RandomPoint(t);
        let ts = tri3DecomposeWithPoint(t, p);

        assert.ok(ts.length <= 3);
        assert.ok(
            mathUtil.equals(tri3Area(t), ts.reduce((area, x) => area + tri3Area(x), 0), 0.001)
        );

        p = seg3GetPoint(tri3GetSegments(t)[0], Math.random());
        ts = tri3DecomposeWithPoint(t, p);

        assert.ok(ts.length <= 2);
        assert.ok(
            mathUtil.equals(tri3Area(t), ts.reduce((area, x) => area + tri3Area(x), 0), 0.001)
        );
    });

    it('intersectionWithLine', () =>
    {
        const t = tri3Random();
        const p = tri3RandomPoint(t);
        const line = line3FromPoints(p, vec3Random());

        const r0 = tri3IntersectionWithLine(t, line);

        assert.ok(r0 && !('p0' in r0) && vec3Equals(p, r0));

        const ps = tri3GetSegments(t).map((s) => seg3GetPoint(s, Math.random()));
        const l0 = line3FromPoints(ps[0], ps[1]);
        const r1 = tri3IntersectionWithLine(t, l0);

        assert.ok(r1 && 'p0' in r1 && seg3Equals(seg3FromPoints(ps[0], ps[1]), r1));
    });

    it('intersectionWithSegment', () =>
    {
        const t = tri3Random();
        let s = seg3FromPoints(t.p0, t.p1);

        const r0 = tri3IntersectionWithSegment(t, s);

        assert.ok(r0 && 'p0' in r0 && seg3Equals(s, r0));

        s = seg3FromPoints(tri3RandomPoint(t), tri3RandomPoint(t));

        const r1 = tri3IntersectionWithSegment(t, s);

        assert.ok(r1 && 'p0' in r1 && seg3Equals(s, r1));

        s = seg3FromPoints(t.p0, vec3Random());

        const r2 = tri3IntersectionWithSegment(t, s);

        assert.ok(r2 && !('p0' in r2) && vec3Equals(t.p0, r2));
    });

    it('decomposeWithSegment', () =>
    {
        const t = tri3Random();
        let s = seg3FromPoints(tri3RandomPoint(t), vec3Add(tri3RandomPoint(t), tri3GetNormal(t)));
        let ts = tri3DecomposeWithSegment(t, s);

        assert.ok(ts.length <= 3);
        assert.ok(
            mathUtil.equals(ts.reduce((v, x) => v + tri3Area(x), 0), tri3Area(t), 0.001)
        );

        s = seg3FromPoints(tri3RandomPoint(t), tri3RandomPoint(t));
        ts = tri3DecomposeWithSegment(t, s);

        assert.ok(ts.length <= 5);
        assert.ok(
            mathUtil.equals(ts.reduce((v, x) => v + tri3Area(x), 0), tri3Area(t), 0.001)
        );
    });

    it('decomposeWithLine', () =>
    {
        const t = tri3Random();
        let l = line3FromPoints(tri3RandomPoint(t), vec3Add(tri3RandomPoint(t), tri3GetNormal(t)));
        let ts = tri3DecomposeWithLine(t, l);

        assert.ok(ts.length <= 3);
        assert.ok(
            mathUtil.equals(ts.reduce((v, x) => v + tri3Area(x), 0), tri3Area(t), 0.001)
        );

        l = line3FromPoints(tri3RandomPoint(t), tri3RandomPoint(t));
        ts = tri3DecomposeWithLine(t, l);

        assert.ok(ts.length <= 3);
        assert.ok(
            mathUtil.equals(ts.reduce((v, x) => v + tri3Area(x), 0), tri3Area(t), 0.0001)
        );
    });

    it('closestPointWithPoint', () =>
    {
        const t = tri3Random();
        let p = tri3RandomPoint(t);

        assert.ok(vec3Equals(p, tri3ClosestPointWithPoint(t, p)));

        assert.ok(vec3Equals(p, tri3ClosestPointWithPoint(t, vec3Add(p, tri3GetNormal(t)))));

        p = vec3Random();
        const closest = tri3ClosestPointWithPoint(t, p);

        assert.ok(tri3OnWithPoint(t, closest));
    });

    it('rasterize 栅格化为点阵', () =>
    {
        const t = tri3Random(10);
        const ps = tri3Rasterize(t);

        // 随机三角形可能栅格化不出点：此时没有可断言的样本，直接跳过。
        // （原先写的是 assert.ok(true)，恒真——它让用例"看起来通过"，却不验证任何东西）
        if (ps.length === 0) return;

        ps.forEach((v, i) =>
        {
            if (i % 3 === 0)
            {
                assert.ok(tri3OnWithPoint(t, { x: ps[i], y: ps[i + 1], z: ps[i + 2] }, 0.5));
            }
        });
    });

    it('rasterizeCustom 栅格化为点阵', () =>
    {
        const t = tri3Random(10);
        const ps = tri3RasterizeCustom(t, vec3AddNumber(vec3Random(0.5), 0.25), vec3Random());

        // 同上：采样为空时没有可断言的样本
        if (ps.length === 0) return;

        ps.forEach((v) =>
        {
            assert.ok(tri3OnWithPoint(t, { x: v.xv, y: v.yv, z: v.zv }, 0.5));
        });
    });

    it('getBarycentricCoordinates', () =>
    {
        const t = tri3Random(10);
        const bp = vec3Random(3);

        bp.z = 1 - bp.x - bp.y;

        const p = tri3GetPoint(t, bp);

        const bp1 = tri3GetBarycentricCoordinates(t, p);

        assert.ok(vec3Equals(bp, bp1));
    });
});
