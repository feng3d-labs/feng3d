namespace feng3d
{
    var NUM = 10;

    QUnit.module("PerspectiveLens", () =>
    {
        QUnit.test("project", (assert) =>
        {
            var fov = Math.random() * 360;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random();
            var perspectiveLens = new PerspectiveLens(fov, aspect, near, far);

            var tan = Math.tan(fov * Math.PI / 360);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new Vector3(-tan * near * aspect, -tan * near, near);
            var tv = perspectiveLens.project(lbn);
            assert.ok(new Vector3(-1, -1, -1).equals(tv));

            var lbf = new Vector3(-tan * far * aspect, -tan * far, far);
            var tv = perspectiveLens.project(lbf);
            assert.ok(new Vector3(-1, -1, 1).equals(tv));

            var ltn = new Vector3(-tan * near * aspect, tan * near, near);
            var tv = perspectiveLens.project(ltn);
            assert.ok(new Vector3(-1, 1, -1).equals(tv));

            var ltf = new Vector3(-tan * far * aspect, tan * far, far)
            var tv = perspectiveLens.project(ltf);
            assert.ok(new Vector3(-1, 1, 1).equals(tv));

            var rbn = new Vector3(tan * near * aspect, -tan * near, near);
            var tv = perspectiveLens.project(rbn);
            assert.ok(new Vector3(1, -1, -1).equals(tv));

            var rbf = new Vector3(tan * far * aspect, -tan * far, far)
            var tv = perspectiveLens.project(rbf);
            assert.ok(new Vector3(1, -1, 1).equals(tv));

            var rtn = new Vector3(tan * near * aspect, tan * near, near);
            var tv = perspectiveLens.project(rtn);
            assert.ok(new Vector3(1, 1, -1).equals(tv));

            var rtf = new Vector3(tan * far * aspect, tan * far, far);
            var tv = perspectiveLens.project(rtf);
            assert.ok(new Vector3(1, 1, 1).equals(tv));
        });

        QUnit.test("unproject", (assert) =>
        {
            var fov = Math.random() * 360;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random();
            var perspectiveLens = new PerspectiveLens(fov, aspect, near, far);

            var tan = Math.tan(fov * Math.PI / 360);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new Vector3(-1, -1, -1);
            var tv = perspectiveLens.unproject(lbn);
            assert.ok(new Vector3(-tan * near * aspect, -tan * near, near).equals(tv));

            var lbf = new Vector3(-1, -1, 1);
            var tv = perspectiveLens.unproject(lbf);
            assert.ok(new Vector3(-tan * far * aspect, -tan * far, far).equals(tv));

            var ltn = new Vector3(-1, 1, -1);
            var tv = perspectiveLens.unproject(ltn);
            assert.ok(new Vector3(-tan * near * aspect, tan * near, near).equals(tv));

            var ltf = new Vector3(-1, 1, 1)
            var tv = perspectiveLens.unproject(ltf);
            assert.ok(new Vector3(-tan * far * aspect, tan * far, far).equals(tv));

            var rbn = new Vector3(1, -1, -1);
            var tv = perspectiveLens.unproject(rbn);
            assert.ok(new Vector3(tan * near * aspect, -tan * near, near).equals(tv));

            var rbf = new Vector3(1, -1, 1)
            var tv = perspectiveLens.unproject(rbf);
            assert.ok(new Vector3(tan * far * aspect, -tan * far, far).equals(tv));

            var rtn = new Vector3(1, 1, -1);
            var tv = perspectiveLens.unproject(rtn);
            assert.ok(new Vector3(tan * near * aspect, tan * near, near).equals(tv));

            var rtf = new Vector3(1, 1, 1);
            var tv = perspectiveLens.unproject(rtf);
            assert.ok(new Vector3(tan * far * aspect, tan * far, far).equals(tv));

        });

        QUnit.test("unprojectRay", (assert) =>
        {
            var fov = Math.random() * 360;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random();
            var perspectiveLens = new PerspectiveLens(fov, aspect, near, far);

            var x = Math.random();
            var y = Math.random();

            for (let i = 0; i < NUM; i++)
            {
                var ray = perspectiveLens.unprojectRay(x, y);
                var p = ray.getPointWithZ(FMath.lerp(near, far, Math.random()));
                var pp = perspectiveLens.project(p);
                assert.ok(FMath.equals(x, pp.x));
                assert.ok(FMath.equals(y, pp.y));
            }
        });
    });
}