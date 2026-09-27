import { mathUtil } from '@feng3d/polyfill';
import { Line3 } from '../../src/geom/Line3';
import { Segment3 } from '../../src/geom/Segment3';
import { Triangle3 } from '../../src/geom/Triangle3';
import { Vector3 } from '../../src/geom/Vector3';

import { assert, afterEach, beforeEach, describe, it, vi } from 'vitest';

/**
 * 用**固定序列**替换 `Math.random`（issue #190）。
 *
 * 这一组用例依赖 `Triangle3/Vector3/Segment3.random()` 造数据，而随机值落到退化位置
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
        const t = new Triangle3().random();
        const p = t.randomPoint();
        assert.ok(
            t.onWithPoint(p)
        );
    });

    it('blendWithPoint', () =>
    {
        const t = new Triangle3().random();
        const p = t.randomPoint();
        const b = t.blendWithPoint(p);
        assert.ok(
            t.getPoint(b).equals(p)
        );
    });

    it('getCircumcenter', () =>
    {
        const t = new Triangle3().random();
        const circumcenter = t.getCircumcenter();

        assert.ok(
            mathUtil.equals(circumcenter.subTo(t.p0).length, circumcenter.subTo(t.p1).length)
        );

        assert.ok(
            mathUtil.equals(circumcenter.subTo(t.p0).length, circumcenter.subTo(t.p2).length)
        );
    });

    it('getInnercenter', () =>
    {
        const t = new Triangle3().random();
        const p = t.getInnercenter();
        const d0 = new Line3().fromPoints(t.p0, t.p1).distanceWithPoint(p);
        const d1 = new Line3().fromPoints(t.p0, t.p2).distanceWithPoint(p);
        const d2 = new Line3().fromPoints(t.p2, t.p1).distanceWithPoint(p);

        assert.ok(
            t.onWithPoint(p)
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
        const t = new Triangle3().random();
        const p = t.getOrthocenter();

        assert.ok(
            mathUtil.equals(0,
                t.p0.subTo(t.p1).dot(p.subTo(t.p2))
            )
        );
        assert.ok(
            mathUtil.equals(0,
                t.p2.subTo(t.p1).dot(p.subTo(t.p0))
            )
        );
        assert.ok(
            mathUtil.equals(0,
                t.p2.subTo(t.p0).dot(p.subTo(t.p1))
            )
        );
    });

    it('decomposeWithPoint', () =>
    {
        // 分割后的三角形面积总和与原三角形面积相等
        const t = new Triangle3().random();
        let p = t.randomPoint();
        let ts = t.decomposeWithPoint(p);

        assert.ok(ts.length <= 3);
        assert.ok(
            mathUtil.equals(t.area(), ts.reduce((area, t) => area + t.area(), 0), 0.001)
        );

        p = t.getSegments()[0].getPoint(Math.random());
        ts = t.decomposeWithPoint(p);

        assert.ok(ts.length <= 2);
        assert.ok(
            mathUtil.equals(t.area(), ts.reduce((area, t) => area + t.area(), 0), 0.001)
        );
    });

    it('intersectionWithLine', () =>
    {
        const t = new Triangle3().random();
        const p = t.randomPoint();
        const line = new Line3().fromPoints(p, new Vector3().random());

        assert.ok(
            p.equals(<Vector3>t.intersectionWithLine(line))
        );

        const ps = t.getSegments().map((s) => s.getPoint(Math.random()));
        const l0 = new Line3().fromPoints(ps[0], ps[1]);
        assert.ok(
            new Segment3().fromPoints(ps[0], ps[1]).equals(<Segment3>t.intersectionWithLine(l0))
        );
    });

    it('intersectionWithSegment', () =>
    {
        const t = new Triangle3().random();
        let s = new Segment3().fromPoints(t.p0, t.p1);

        assert.ok(
            s.equals(<Segment3>t.intersectionWithSegment(s))
        );

        s = new Segment3().fromPoints(t.randomPoint(), t.randomPoint());
        assert.ok(
            s.equals(<Segment3>t.intersectionWithSegment(s))
        );

        s = new Segment3().fromPoints(t.p0, new Vector3().random());
        assert.ok(
            t.p0.equals(<Vector3>t.intersectionWithSegment(s))
        );
    });

    it('decomposeWithSegment', () =>
    {
        const t = new Triangle3().random();
        let s = new Segment3().fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
        let ts = t.decomposeWithSegment(s);

        assert.ok(ts.length <= 3);
        assert.ok(
            mathUtil.equals(ts.reduce((v, t) => v + t.area(), 0), t.area(), 0.001)
        );

        s = new Segment3().fromPoints(t.randomPoint(), t.randomPoint());
        ts = t.decomposeWithSegment(s);

        assert.ok(ts.length <= 5);
        assert.ok(
            mathUtil.equals(ts.reduce((v, t) => v + t.area(), 0), t.area(), 0.001)
        );
    });

    it('decomposeWithLine', () =>
    {
        const t = new Triangle3().random();
        let l = new Line3().fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
        let ts = t.decomposeWithLine(l);

        assert.ok(ts.length <= 3);
        assert.ok(
            mathUtil.equals(ts.reduce((v, t) => v + t.area(), 0), t.area(), 0.001)
        );

        l = new Line3().fromPoints(t.randomPoint(), t.randomPoint());
        ts = t.decomposeWithLine(l);

        assert.ok(ts.length <= 3);
        assert.ok(
            mathUtil.equals(ts.reduce((v, t) => v + t.area(), 0), t.area(), 0.0001)
        );
    });

    it('closestPointWithPoint', () =>
    {
        const t = new Triangle3().random();
        let p = t.randomPoint();

        assert.ok(p.equals(t.closestPointWithPoint(p)));

        assert.ok(p.equals(t.closestPointWithPoint(p.addTo(t.getNormal()))));

        p = new Vector3().random();
        const closest = t.closestPointWithPoint(p);

        assert.ok(t.onWithPoint(closest));
    });

    it('rasterize 栅格化为点阵', () =>
    {
        const t = new Triangle3().random(10);
        const ps = t.rasterize();

        // 随机三角形可能栅格化不出点：此时没有可断言的样本，直接跳过。
        // （原先写的是 assert.ok(true)，恒真——它让用例"看起来通过"，却不验证任何东西）
        if (ps.length === 0) return;

        ps.forEach((v, i) =>
        {
            if (i % 3 === 0)
            {
                assert.ok(t.onWithPoint(new Vector3(ps[i], ps[i + 1], ps[i + 2]), 0.5));
            }
        });
    });

    it('rasterizeCustom 栅格化为点阵', () =>
    {
        const t = new Triangle3().random(10);
        const ps = t.rasterizeCustom(new Vector3().random(0.5).addNumber(0.25), new Vector3().random());

        // 同上：采样为空时没有可断言的样本
        if (ps.length === 0) return;

        ps.forEach((v) =>
        {
            assert.ok(t.onWithPoint(new Vector3(v.xv, v.yv, v.zv), 0.5));
        });
    });

    it('getBarycentricCoordinates', () =>
    {
        const t = new Triangle3().random(10);
        const bp = new Vector3().random(3);
        bp.z = 1 - bp.x - bp.y;

        const p = t.getPoint(bp);

        const bp1 = t.getBarycentricCoordinates(p);

        assert.ok(bp.equals(bp1));
    });
});
