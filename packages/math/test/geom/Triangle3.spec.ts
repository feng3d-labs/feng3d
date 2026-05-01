import { mathUtil } from '@feng3d/polyfill';
import { ok } from 'assert';
import { Line3, Segment3, Triangle3, Vector3 } from '../../src';
import { describe, it } from 'vitest';

describe('Triangle3', () =>
{
    it('randomPoint', () =>
    {
        const t = Triangle3.random();
        const p = t.randomPoint();
        ok(
            t.onWithPoint(p)
        );
    });

    it('blendWithPoint', () =>
    {
        const t = Triangle3.random();
        const p = t.randomPoint();
        const b = t.blendWithPoint(p);
        ok(
            t.getPoint(b).equals(p)
        );
    });

    it('getCircumcenter', () =>
    {
        const t = Triangle3.random();
        const circumcenter = t.getCircumcenter();

        ok(
            mathUtil.equals(circumcenter.subTo(t.p0).length, circumcenter.subTo(t.p1).length)
        );

        ok(
            mathUtil.equals(circumcenter.subTo(t.p0).length, circumcenter.subTo(t.p2).length)
        );
    });

    it('getInnercenter', () =>
    {
        const t = Triangle3.random();
        const p = t.getInnercenter();
        const d0 = Line3.fromPoints(t.p0, t.p1).distanceWithPoint(p);
        const d1 = Line3.fromPoints(t.p0, t.p2).distanceWithPoint(p);
        const d2 = Line3.fromPoints(t.p2, t.p1).distanceWithPoint(p);

        ok(
            t.onWithPoint(p)
        );

        ok(
            mathUtil.equals(d0, d1)
        );

        ok(
            mathUtil.equals(d0, d2)
        );
    });

    it('getOrthocenter', () =>
    {
        const t = Triangle3.random();
        const p = t.getOrthocenter();

        ok(
            mathUtil.equals(0,
                t.p0.subTo(t.p1).dot(p.subTo(t.p2))
            )
        );
        ok(
            mathUtil.equals(0,
                t.p2.subTo(t.p1).dot(p.subTo(t.p0))
            )
        );
        ok(
            mathUtil.equals(0,
                t.p2.subTo(t.p0).dot(p.subTo(t.p1))
            )
        );
    });

    it('decomposeWithPoint', () =>
    {
        // 分割后的三角形面积总和与原三角形面积相等
        const t = Triangle3.random();
        let p = t.randomPoint();
        let ts = t.decomposeWithPoint(p);

        ok(ts.length <= 3);
        ok(
            mathUtil.equals(t.area(), ts.reduce((area, t) => area + t.area(), 0), 0.001)
        );

        p = t.getSegments()[0].getPoint(Math.random());
        ts = t.decomposeWithPoint(p);

        ok(ts.length <= 2);
        ok(
            mathUtil.equals(t.area(), ts.reduce((area, t) => area + t.area(), 0), 0.001)
        );
    });

    it('intersectionWithLine', () =>
    {
        const t = Triangle3.random();
        const p = t.randomPoint();
        const line = Line3.fromPoints(p, Vector3.random());

        ok(
            p.equals(<Vector3>t.intersectionWithLine(line))
        );

        const ps = t.getSegments().map((s) => s.getPoint(Math.random()));
        const l0 = Line3.fromPoints(ps[0], ps[1]);
        ok(
            Segment3.fromPoints(ps[0], ps[1]).equals(<Segment3>t.intersectionWithLine(l0))
        );
    });

    it('intersectionWithSegment', () =>
    {
        const t = Triangle3.random();
        let s = Segment3.fromPoints(t.p0, t.p1);

        ok(
            s.equals(<Segment3>t.intersectionWithSegment(s))
        );

        s = Segment3.fromPoints(t.randomPoint(), t.randomPoint());
        ok(
            s.equals(<Segment3>t.intersectionWithSegment(s))
        );

        s = Segment3.fromPoints(t.p0, Vector3.random());
        ok(
            t.p0.equals(<Vector3>t.intersectionWithSegment(s))
        );
    });

    it('decomposeWithSegment', () =>
    {
        const t = Triangle3.random();
        let s = Segment3.fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
        let ts = t.decomposeWithSegment(s);

        ok(ts.length <= 3);
        ok(
            mathUtil.equals(ts.reduce((v, t) => v + t.area(), 0), t.area(), 0.001)
        );

        s = Segment3.fromPoints(t.randomPoint(), t.randomPoint());
        ts = t.decomposeWithSegment(s);

        ok(ts.length <= 5);
        ok(
            mathUtil.equals(ts.reduce((v, t) => v + t.area(), 0), t.area(), 0.001)
        );
    });

    it('decomposeWithLine', () =>
    {
        const t = Triangle3.random();
        let l = Line3.fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
        let ts = t.decomposeWithLine(l);

        ok(ts.length <= 3);
        ok(
            mathUtil.equals(ts.reduce((v, t) => v + t.area(), 0), t.area(), 0.001)
        );

        l = Line3.fromPoints(t.randomPoint(), t.randomPoint());
        ts = t.decomposeWithLine(l);

        ok(ts.length <= 3);
        ok(
            mathUtil.equals(ts.reduce((v, t) => v + t.area(), 0), t.area(), 0.0001)
        );
    });

    it('closestPointWithPoint', () =>
    {
        const t = Triangle3.random();
        let p = t.randomPoint();

        ok(p.equals(t.closestPointWithPoint(p)));

        ok(p.equals(t.closestPointWithPoint(p.addTo(t.getNormal()))));

        p = Vector3.random();
        const closest = t.closestPointWithPoint(p);

        ok(t.onWithPoint(closest));
    });

    it('rasterize 栅格化为点阵', () =>
    {
        const t = Triangle3.random(10);
        const ps = t.rasterize();

        if (ps.length === 0) ok(true);

        ps.forEach((v, i) =>
        {
            if (i % 3 === 0)
            {
                ok(t.onWithPoint(new Vector3(ps[i], ps[i + 1], ps[i + 2]), 0.5));
            }
        });
    });

    it('rasterizeCustom 栅格化为点阵', () =>
    {
        const t = Triangle3.random(10);
        const ps = t.rasterizeCustom(Vector3.random(0.5).addNumber(0.25), Vector3.random());

        if (ps.length === 0) ok(true);

        ps.forEach((v) =>
        {
            ok(t.onWithPoint(new Vector3(v.xv, v.yv, v.zv), 0.5));
        });
    });

    it('getBarycentricCoordinates', () =>
    {
        const t = Triangle3.random(10);
        const bp = Vector3.random(3);
        bp.z = 1 - bp.x - bp.y;

        const p = t.getPoint(bp);

        const bp1 = t.getBarycentricCoordinates(p);

        ok(bp.equals(bp1));
    });
});
