namespace feng3d
{
    QUnit.module("Segment3D", () =>
    {
        QUnit.test("onWithPoint", (assert) =>
        {
            var s = Segment3D.random();
            for (let i = 0; i < 10; i++)
            {
                var p = s.getPoint(Math.random());
                assert.ok(s.onWithPoint(p));
            }
        });

        QUnit.test("intersectionWithLine", (assert) =>
        {
            var s = Segment3D.random();
            var p = s.getPoint(Math.random());
            var l = Line3D.fromPoints(p, Vector3.random());

            assert.ok(
                p.equals(<Vector3>s.intersectionWithLine(l))
            );

            l.fromPosAndDir(p, s.p1.subTo(s.p0));
            assert.ok(
                s.equals(<Segment3D>s.intersectionWithLine(l))
            );
        });

        QUnit.test("intersectionWithSegment", (assert) =>
        {
            var s = Segment3D.random();
            var p0 = s.getPoint(Math.random());
            var p1 = Vector3.random();
            var s0 = Segment3D.fromPoints(p0, p1);

            assert.ok(
                p0.equals(<Vector3>s.intersectionWithSegment(s0))
            );

            var p2 = s.getPoint(1 + Math.random());
            var s1 = Segment3D.fromPoints(p0, p2);
            assert.ok(
                Segment3D.fromPoints(p0, s.p1).equals(<Segment3D>s.intersectionWithSegment(s1))
            );

        });
    });
}