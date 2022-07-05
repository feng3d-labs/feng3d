namespace feng3d
{
    // var oldok = QUnit.assert.ok;
    // QUnit.assert.ok = function (state)
    // {
    //     if (!state)
    //         debugger;
    //     oldok.apply(this, arguments);
    // }

    QUnit.module("Triangle3", () =>
    {

        QUnit.test("randomPoint", (assert) =>
        {
            var t = Triangle3.random();
            var p = t.randomPoint();
            assert.ok(
                t.onWithPoint(p)
            );
        });

        QUnit.test("blendWithPoint", (assert) =>
        {
            var t = Triangle3.random();
            var p = t.randomPoint();
            var b = t.blendWithPoint(p);
            assert.ok(
                t.getPoint(b).equals(p)
            );
        });

        QUnit.test("getCircumcenter", (assert) =>
        {
            var t = Triangle3.random();
            var circumcenter = t.getCircumcenter();

            assert.ok(
                Math.equals(circumcenter.subTo(t.p0).length, circumcenter.subTo(t.p1).length)
            );

            assert.ok(
                Math.equals(circumcenter.subTo(t.p0).length, circumcenter.subTo(t.p2).length)
            );
        });

        QUnit.test("getInnercenter", (assert) =>
        {
            var t = Triangle3.random();
            var p = t.getInnercenter();
            var d0 = Line3.fromPoints(t.p0, t.p1).distanceWithPoint(p);
            var d1 = Line3.fromPoints(t.p0, t.p2).distanceWithPoint(p);
            var d2 = Line3.fromPoints(t.p2, t.p1).distanceWithPoint(p);

            assert.ok(
                t.onWithPoint(p)
            );

            assert.ok(
                Math.equals(d0, d1)
            );

            assert.ok(
                Math.equals(d0, d2)
            );

        });

        QUnit.test("getOrthocenter", (assert) =>
        {
            var t = Triangle3.random();
            var p = t.getOrthocenter();

            assert.ok(
                Math.equals(0,
                    t.p0.subTo(t.p1).dot(p.subTo(t.p2))
                )
            )
            assert.ok(
                Math.equals(0,
                    t.p2.subTo(t.p1).dot(p.subTo(t.p0))
                )
            )
            assert.ok(
                Math.equals(0,
                    t.p2.subTo(t.p0).dot(p.subTo(t.p1))
                )
            )
        });

        QUnit.test("decomposeWithPoint", (assert) =>
        {
            //分割后的三角形面积总和与原三角形面积相等
            var t = Triangle3.random();
            var p = t.randomPoint();
            var ts = t.decomposeWithPoint(p);

            assert.ok(ts.length <= 3);
            assert.ok(
                Math.equals(t.area(), ts.reduce((area, t) => { return area + t.area(); }, 0), 0.001)
            )

            p = t.getSegments()[0].getPoint(Math.random());
            ts = t.decomposeWithPoint(p);

            assert.ok(ts.length <= 2);
            assert.ok(
                Math.equals(t.area(), ts.reduce((area, t) => { return area + t.area(); }, 0), 0.001)
            )
        });

        QUnit.test("intersectionWithLine", (assert) =>
        {
            var t = Triangle3.random();
            var p = t.randomPoint();
            var line = Line3.fromPoints(p, Vector3.random());

            assert.ok(
                p.equals(<Vector3>t.intersectionWithLine(line))
            );

            var ps = t.getSegments().map((s) => { return s.getPoint(Math.random()); });
            var l0 = Line3.fromPoints(ps[0], ps[1]);
            assert.ok(
                Segment3.fromPoints(ps[0], ps[1]).equals(<Segment3>t.intersectionWithLine(l0))
            );
        });

        QUnit.test("intersectionWithSegment", (assert) =>
        {
            var t = Triangle3.random();
            var s = Segment3.fromPoints(t.p0, t.p1);

            assert.ok(
                s.equals(<Segment3>t.intersectionWithSegment(s))
            );

            s = Segment3.fromPoints(t.randomPoint(), t.randomPoint());
            assert.ok(
                s.equals(<Segment3>t.intersectionWithSegment(s))
            );

            s = Segment3.fromPoints(t.p0, Vector3.random());
            assert.ok(
                t.p0.equals(<Vector3>t.intersectionWithSegment(s))
            );

        });

        QUnit.test("decomposeWithSegment", (assert) =>
        {
            var t = Triangle3.random();
            var s = Segment3.fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
            var ts = t.decomposeWithSegment(s);

            assert.ok(ts.length <= 3);
            assert.ok(
                Math.equals(ts.reduce((v, t) => { return v + t.area(); }, 0), t.area(), 0.001)
            );

            s = Segment3.fromPoints(t.randomPoint(), t.randomPoint());
            ts = t.decomposeWithSegment(s);

            assert.ok(ts.length <= 5);
            assert.ok(
                Math.equals(ts.reduce((v, t) => { return v + t.area(); }, 0), t.area(), 0.001)
            );

        });

        QUnit.test("decomposeWithLine", (assert) =>
        {
            var t = Triangle3.random();
            var l = Line3.fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
            var ts = t.decomposeWithLine(l);

            assert.ok(ts.length <= 3);
            assert.ok(
                Math.equals(ts.reduce((v, t) => { return v + t.area(); }, 0), t.area(), 0.001)
            );

            l = Line3.fromPoints(t.randomPoint(), t.randomPoint());
            ts = t.decomposeWithLine(l);

            assert.ok(ts.length <= 3);
            assert.ok(
                Math.equals(ts.reduce((v, t) => { return v + t.area(); }, 0), t.area(), 0.0001)
            );

        });

        QUnit.test("closestPointWithPoint", (assert) =>
        {
            var t = Triangle3.random();
            var p = t.randomPoint();

            assert.ok(p.equals(t.closestPointWithPoint(p)));

            assert.ok(p.equals(t.closestPointWithPoint(p.addTo(t.getNormal()))));

            p = Vector3.random();
            var closest = t.closestPointWithPoint(p);

            assert.ok(t.onWithPoint(closest));
        });

        QUnit.test("rasterize 栅格化为点阵", (assert) =>
        {
            var t = Triangle3.random(10);
            var ps = t.rasterize();

            if (ps.length == 0) assert.ok(true);

            ps.forEach((v, i) =>
            {
                if (i % 3 == 0)
                {
                    assert.ok(t.onWithPoint(new Vector3(ps[i], ps[i + 1], ps[i + 2]), 0.5));
                }
            });

        });

        QUnit.test("rasterizeCustom 栅格化为点阵", (assert) =>
        {
            var t = Triangle3.random(10);
            var ps = t.rasterizeCustom(Vector3.random(0.5).addNumber(0.25), Vector3.random());

            if (ps.length == 0) assert.ok(true);

            ps.forEach(v =>
            {
                assert.ok(t.onWithPoint(new Vector3(v.xv, v.yv, v.zv), 0.5));
            });

        });

        QUnit.test("getBarycentricCoordinates", (assert) =>
        {
            var t = Triangle3.random(10);
            var bp = Vector3.random(3);
            bp.z = 1 - bp.x - bp.y;

            var p = t.getPoint(bp);

            var bp1 = t.getBarycentricCoordinates(p);

            assert.ok(bp.equals(bp1));
        });
    });
}