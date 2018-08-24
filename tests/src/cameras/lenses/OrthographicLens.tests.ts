namespace feng3d
{
    var NUM = 10;

    QUnit.module("OrthographicLens", () =>
    {
        QUnit.test("project", (assert) =>
        {
            // 生成随机正交矩阵
            var size = Math.random();
            var near = Math.random();
            var far = Math.random() + near;

            var orthographicLens = new OrthographicLens(size, 1, near, far);

            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new Vector3(size, -size, near);
            var tv = orthographicLens.project(lbn);
            assert.ok(new Vector3(-1, -1, -1).equals(tv));

            var lbf = new Vector3(size, -size, far);
            var tv = orthographicLens.project(lbf);
            assert.ok(new Vector3(-1, -1, 1).equals(tv));

            var ltn = new Vector3(size, size, near);
            var tv = orthographicLens.project(ltn);
            assert.ok(new Vector3(-1, 1, -1).equals(tv));

            var ltf = new Vector3(size, size, far)
            var tv = orthographicLens.project(ltf);
            assert.ok(new Vector3(-1, 1, 1).equals(tv));

            var rbn = new Vector3(size, -size, near);
            var tv = orthographicLens.project(rbn);
            assert.ok(new Vector3(1, -1, -1).equals(tv));

            var rbf = new Vector3(size, -size, far)
            var tv = orthographicLens.project(rbf);
            assert.ok(new Vector3(1, -1, 1).equals(tv));

            var rtn = new Vector3(size, size, near);
            var tv = orthographicLens.project(rtn);
            assert.ok(new Vector3(1, 1, -1).equals(tv));

            var rtf = new Vector3(size, size, far);
            var tv = orthographicLens.project(rtf);
            assert.ok(new Vector3(1, 1, 1).equals(tv));
        });

        QUnit.test("unproject", (assert) =>
        {
            // 生成随机正交矩阵
            var size = Math.random();
            var near = Math.random();
            var far = Math.random() + near;

            var orthographicLens = new OrthographicLens(size, 1, near, far);

            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new Vector3(-1, -1, -1);
            var tv = orthographicLens.unproject(lbn);
            assert.ok(new Vector3(size, -size, near).equals(tv));

            var lbf = new Vector3(-1, -1, 1);
            var tv = orthographicLens.unproject(lbf);
            assert.ok(new Vector3(size, -size, far).equals(tv));

            var ltn = new Vector3(-1, 1, -1);
            var tv = orthographicLens.unproject(ltn);
            assert.ok(new Vector3(size, size, near).equals(tv));

            var ltf = new Vector3(-1, 1, 1)
            var tv = orthographicLens.unproject(ltf);
            assert.ok(new Vector3(size, size, far).equals(tv));

            var rbn = new Vector3(1, -1, -1);
            var tv = orthographicLens.unproject(rbn);
            assert.ok(new Vector3(size, -size, near).equals(tv));

            var rbf = new Vector3(1, -1, 1)
            var tv = orthographicLens.unproject(rbf);
            assert.ok(new Vector3(size, -size, far).equals(tv));

            var rtn = new Vector3(1, 1, -1);
            var tv = orthographicLens.unproject(rtn);
            assert.ok(new Vector3(size, size, near).equals(tv));

            var rtf = new Vector3(1, 1, 1);
            var tv = orthographicLens.unproject(rtf);
            assert.ok(new Vector3(size, size, far).equals(tv));

        });

        QUnit.test("unprojectRay", (assert) =>
        {
            var size = Math.random();
            var near = Math.random();
            var far = Math.random() + near;

            var orthographicLens = new OrthographicLens(size, 1, near, far);

            var x = Math.random();
            var y = Math.random();

            for (let i = 0; i < NUM; i++)
            {
                var ray = orthographicLens.unprojectRay(x, y);
                var p = ray.getPointWithZ(FMath.lerp(near, far, Math.random()));
                var pp = orthographicLens.project(p);
                assert.ok(FMath.equals(x, pp.x));
                assert.ok(FMath.equals(y, pp.y));
            }
        });

        QUnit.test("unprojectWithDepth", (assert) =>
        {
            var size = Math.random();
            var near = Math.random();
            var far = Math.random() + near;

            var orthographicLens = new OrthographicLens(size, 1, near, far);

            var x = Math.random();
            var y = Math.random();

            for (let i = 0; i < NUM; i++)
            {
                var sZ = FMath.lerp(near, far, Math.random());
                var p = orthographicLens.unprojectWithDepth(x, y, sZ);
                assert.ok(FMath.equals(sZ, p.z));

                var pp = orthographicLens.project(p);
                assert.ok(FMath.equals(x, pp.x));
                assert.ok(FMath.equals(y, pp.y));
            }
        });
    });
}