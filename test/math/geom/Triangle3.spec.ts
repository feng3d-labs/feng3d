import { Line3 } from '../../../src/math/geom/Line3';
import { Segment3 } from '../../../src/math/geom/Segment3';
import { Triangle3 } from '../../../src/math/geom/Triangle3';
import { Vector3 } from '../../../src/math/geom/Vector3';
import { mathUtil } from '../../../src/polyfill/MathUtil';

import { assert, describe, expect, it } from 'vitest';
const { ok, equal, deepEqual } = assert;

describe('Triangle3', () =>
{
    it('randomPoint', () =>
    {
        const t = new Triangle3().random();
        const p = t.randomPoint();
        ok(
            t.onWithPoint(p)
        );
    });

    it('blendWithPoint', () =>
    {
        const t = new Triangle3().random();
        const p = t.randomPoint();
        const b = t.blendWithPoint(p);
        ok(
            t.getPoint(b).equals(p)
        );
    });

    it('getCircumcenter', () =>
    {
        const t = new Triangle3().random();
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
        const t = new Triangle3().random();
        const p = t.getInnercenter();
        const d0 = new Line3().fromPoints(t.p0, t.p1).distanceWithPoint(p);
        const d1 = new Line3().fromPoints(t.p0, t.p2).distanceWithPoint(p);
        const d2 = new Line3().fromPoints(t.p2, t.p1).distanceWithPoint(p);

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
        const t = new Triangle3().random();
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
        const t = new Triangle3().random();
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
        const t = new Triangle3().random();
        const p = t.randomPoint();
        const line = new Line3().fromPoints(p, new Vector3().random());

        ok(
            p.equals(<Vector3>t.intersectionWithLine(line))
        );

        const ps = t.getSegments().map((s) => s.getPoint(Math.random()));
        const l0 = new Line3().fromPoints(ps[0], ps[1]);
        ok(
            new Segment3().fromPoints(ps[0], ps[1]).equals(<Segment3>t.intersectionWithLine(l0))
        );
    });

    it('intersectionWithSegment', () =>
    {
        const t = new Triangle3().random();
        let s = new Segment3().fromPoints(t.p0, t.p1);

        ok(
            s.equals(<Segment3>t.intersectionWithSegment(s))
        );

        s = new Segment3().fromPoints(t.randomPoint(), t.randomPoint());
        ok(
            s.equals(<Segment3>t.intersectionWithSegment(s))
        );

        s = new Segment3().fromPoints(t.p0, new Vector3().random());
        ok(
            t.p0.equals(<Vector3>t.intersectionWithSegment(s))
        );
    });

    it('decomposeWithSegment', () =>
    {
        const t = new Triangle3().random();
        let s = new Segment3().fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
        let ts = t.decomposeWithSegment(s);

        ok(ts.length <= 3);
        ok(
            mathUtil.equals(ts.reduce((v, t) => v + t.area(), 0), t.area(), 0.001)
        );

        s = new Segment3().fromPoints(t.randomPoint(), t.randomPoint());
        ts = t.decomposeWithSegment(s);

        ok(ts.length <= 5);
        ok(
            mathUtil.equals(ts.reduce((v, t) => v + t.area(), 0), t.area(), 0.001)
        );
    });

    it('decomposeWithLine', () =>
    {
        const t = new Triangle3().random();
        let l = new Line3().fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
        let ts = t.decomposeWithLine(l);

        ok(ts.length <= 3);
        ok(
            mathUtil.equals(ts.reduce((v, t) => v + t.area(), 0), t.area(), 0.001)
        );

        l = new Line3().fromPoints(t.randomPoint(), t.randomPoint());
        ts = t.decomposeWithLine(l);

        ok(ts.length <= 3);
        ok(
            mathUtil.equals(ts.reduce((v, t) => v + t.area(), 0), t.area(), 0.0001)
        );
    });

    it('closestPointWithPoint', () =>
    {
        const t = new Triangle3().random();
        let p = t.randomPoint();

        ok(p.equals(t.closestPointWithPoint(p)));

        ok(p.equals(t.closestPointWithPoint(p.addTo(t.getNormal()))));

        p = new Vector3().random();
        const closest = t.closestPointWithPoint(p);

        ok(t.onWithPoint(closest));
    });

    it('rasterize 栅格化为点阵', () =>
    {
        const t = new Triangle3().random(10);
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
        const t = new Triangle3().random(10);
        const ps = t.rasterizeCustom(new Vector3().random(0.5).addNumber(0.25), new Vector3().random());

        if (ps.length === 0) ok(true);

        ps.forEach((v) =>
        {
            ok(t.onWithPoint(new Vector3(v.xv, v.yv, v.zv), 0.5));
        });
    });

    it('getBarycentricCoordinates', () =>
    {
        const t = new Triangle3().random(10);
        const bp = new Vector3().random(3);
        bp.z = 1 - bp.x - bp.y;

        const p = t.getPoint(bp);

        const bp1 = t.getBarycentricCoordinates(p);

        ok(bp.equals(bp1));
    });
});
