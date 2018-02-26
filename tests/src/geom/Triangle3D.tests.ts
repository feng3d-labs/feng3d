namespace feng3d
{
    // var oldok = QUnit.assert.ok;
    // QUnit.assert.ok = function (state)
    // {
    //     if (!state)
    //         debugger;
    //     oldok.apply(this, arguments);
    // }

    QUnit.module("Triangle3D", () =>
    {

        QUnit.test("randomPoint", (assert) =>
        {
            var t = Triangle3D.random();
            var p = t.randomPoint();
            assert.ok(
                t.onWithPoint(p)
            );
        });

        QUnit.test("blendWithPoint", (assert) =>
        {
            var t = Triangle3D.random();
            var p = t.randomPoint();
            var b = t.blendWithPoint(p);
            assert.ok(
                t.getPoint(b).equals(p)
            );
        });

        QUnit.test("getCircumcenter", (assert) =>
        {
            var t = Triangle3D.random();
            var circumcenter = t.getCircumcenter();

            assert.ok(
                FMath.equals(circumcenter.subTo(t.p0).length, circumcenter.subTo(t.p1).length)
            );

            assert.ok(
                FMath.equals(circumcenter.subTo(t.p0).length, circumcenter.subTo(t.p2).length)
            );
        });

        QUnit.test("getInnercenter", (assert) =>
        {
            var t = Triangle3D.random();
            var p = t.getInnercenter();
            var d0 = Line3D.fromPoints(t.p0, t.p1).distanceWithPoint(p);
            var d1 = Line3D.fromPoints(t.p0, t.p2).distanceWithPoint(p);
            var d2 = Line3D.fromPoints(t.p2, t.p1).distanceWithPoint(p);

            assert.ok(
                t.onWithPoint(p)
            );

            assert.ok(
                FMath.equals(d0, d1)
            );

            assert.ok(
                FMath.equals(d0, d2)
            );

        });

        QUnit.test("getOrthocenter", (assert) =>
        {
            var t = Triangle3D.random();
            var p = t.getOrthocenter();

            assert.ok(
                FMath.equals(0,
                    t.p0.subTo(t.p1).dot(p.subTo(t.p2))
                )
            )
            assert.ok(
                FMath.equals(0,
                    t.p2.subTo(t.p1).dot(p.subTo(t.p0))
                )
            )
            assert.ok(
                FMath.equals(0,
                    t.p2.subTo(t.p0).dot(p.subTo(t.p1))
                )
            )
        });

        QUnit.test("decomposeWithPoint", (assert) =>
        {
            //分割后的三角形面积总和与原三角形面积相等
            var t = Triangle3D.random();
            var p = t.randomPoint();
            var ts = t.decomposeWithPoint(p);

            assert.ok(ts.length <= 3);
            assert.ok(
                FMath.equals(t.area(), ts.reduce((area, t) => { return area + t.area(); }, 0), 0.001)
            )

            p = t.getSegments()[0].getPoint(Math.random());
            ts = t.decomposeWithPoint(p);

            assert.ok(ts.length <= 2);
            assert.ok(
                FMath.equals(t.area(), ts.reduce((area, t) => { return area + t.area(); }, 0), 0.001)
            )
        });

        QUnit.test("intersectionWithLine", (assert) =>
        {
            var t = Triangle3D.random();
            var p = t.randomPoint();
            var line = Line3D.fromPoints(p, Vector3.random());

            assert.ok(
                p.equals(<Vector3>t.intersectionWithLine(line))
            );

            var ps = t.getSegments().map((s) => { return s.getPoint(Math.random()); });
            var l0 = Line3D.fromPoints(ps[0], ps[1]);
            assert.ok(
                Segment3D.fromPoints(ps[0], ps[1]).equals(<Segment3D>t.intersectionWithLine(l0))
            );
        });

        QUnit.test("intersectionWithSegment", (assert) =>
        {
            var t = Triangle3D.random();
            var s = Segment3D.fromPoints(t.p0, t.p1);

            assert.ok(
                s.equals(<Segment3D>t.intersectionWithSegment(s))
            );

            s = Segment3D.fromPoints(t.randomPoint(), t.randomPoint());
            assert.ok(
                s.equals(<Segment3D>t.intersectionWithSegment(s))
            );

            s = Segment3D.fromPoints(t.p0, Vector3.random());
            assert.ok(
                t.p0.equals(<Vector3>t.intersectionWithSegment(s))
            );

        });

        QUnit.test("decomposeWithSegment", (assert) =>
        {
            var t = Triangle3D.random();
            var s = Segment3D.fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
            var ts = t.decomposeWithSegment(s);

            assert.ok(ts.length <= 3);
            assert.ok(
                FMath.equals(ts.reduce((v, t) => { return v + t.area(); }, 0), t.area(), 0.001)
            );

            s = Segment3D.fromPoints(t.randomPoint(), t.randomPoint());
            ts = t.decomposeWithSegment(s);

            assert.ok(ts.length <= 5);
            assert.ok(
                FMath.equals(ts.reduce((v, t) => { return v + t.area(); }, 0), t.area(), 0.001)
            );

        });

        QUnit.test("decomposeWithLine", (assert) =>
        {
            var t = Triangle3D.random();
            var l = Line3D.fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
            var ts = t.decomposeWithLine(l);

            assert.ok(ts.length <= 3);
            assert.ok(
                FMath.equals(ts.reduce((v, t) => { return v + t.area(); }, 0), t.area(), 0.001)
            );

            l = Line3D.fromPoints(t.randomPoint(), t.randomPoint());
            ts = t.decomposeWithLine(l);

            assert.ok(ts.length <= 3);
            assert.ok(
                FMath.equals(ts.reduce((v, t) => { return v + t.area(); }, 0), t.area(), 0.0001)
            );

        });

        QUnit.test("closestPointWithPoint", (assert) =>
        {
            var t = Triangle3D.random();
            var p = t.randomPoint();

            assert.ok(p.equals(t.closestPointWithPoint(p)));

            assert.ok(p.equals(t.closestPointWithPoint(p.addTo(t.getNormal()))));

            p = Vector3.random();
            var closest = t.closestPointWithPoint(p);

            assert.ok(t.onWithPoint(closest));
        });
    });
}