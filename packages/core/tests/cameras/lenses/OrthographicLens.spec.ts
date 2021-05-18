import { Vector3 } from '@feng3d/math';
import { mathUtil } from '@feng3d/polyfill';
import { ok } from 'assert';
import { OrthographicLens } from '../../../src';

var NUM = 10;

describe("OrthographicLens", () =>
{
    it("project", () =>
    {
        // 生成随机正交矩阵
        var size = Math.random();
        var near = Math.random();
        var far = Math.random() + near;

        var orthographicLens = new OrthographicLens(size, 1, near, far);

        // 测试可视空间的8个顶点是否被正确投影
        var lbn = new Vector3(-size, -size, near);
        var tv = orthographicLens.project(lbn);
        ok(new Vector3(-1, -1, -1).equals(tv));

        var lbf = new Vector3(-size, -size, far);
        var tv = orthographicLens.project(lbf);
        ok(new Vector3(-1, -1, 1).equals(tv));

        var ltn = new Vector3(-size, size, near);
        var tv = orthographicLens.project(ltn);
        ok(new Vector3(-1, 1, -1).equals(tv));

        var ltf = new Vector3(-size, size, far)
        var tv = orthographicLens.project(ltf);
        ok(new Vector3(-1, 1, 1).equals(tv));

        var rbn = new Vector3(size, -size, near);
        var tv = orthographicLens.project(rbn);
        ok(new Vector3(1, -1, -1).equals(tv));

        var rbf = new Vector3(size, -size, far)
        var tv = orthographicLens.project(rbf);
        ok(new Vector3(1, -1, 1).equals(tv));

        var rtn = new Vector3(size, size, near);
        var tv = orthographicLens.project(rtn);
        ok(new Vector3(1, 1, -1).equals(tv));

        var rtf = new Vector3(size, size, far);
        var tv = orthographicLens.project(rtf);
        ok(new Vector3(1, 1, 1).equals(tv));
    });

    it("unproject", () =>
    {
        // 生成随机正交矩阵
        var size = Math.random();
        var near = Math.random();
        var far = Math.random() + near;

        var orthographicLens = new OrthographicLens(size, 1, near, far);

        // 测试可视空间的8个顶点是否被正确投影
        var lbn = new Vector3(-1, -1, -1);
        var tv = orthographicLens.unproject(lbn);
        ok(new Vector3(-size, -size, near).equals(tv));

        var lbf = new Vector3(-1, -1, 1);
        var tv = orthographicLens.unproject(lbf);
        ok(new Vector3(-size, -size, far).equals(tv));

        var ltn = new Vector3(-1, 1, -1);
        var tv = orthographicLens.unproject(ltn);
        ok(new Vector3(-size, size, near).equals(tv));

        var ltf = new Vector3(-1, 1, 1)
        var tv = orthographicLens.unproject(ltf);
        ok(new Vector3(-size, size, far).equals(tv));

        var rbn = new Vector3(1, -1, -1);
        var tv = orthographicLens.unproject(rbn);
        ok(new Vector3(size, -size, near).equals(tv));

        var rbf = new Vector3(1, -1, 1)
        var tv = orthographicLens.unproject(rbf);
        ok(new Vector3(size, -size, far).equals(tv));

        var rtn = new Vector3(1, 1, -1);
        var tv = orthographicLens.unproject(rtn);
        ok(new Vector3(size, size, near).equals(tv));

        var rtf = new Vector3(1, 1, 1);
        var tv = orthographicLens.unproject(rtf);
        ok(new Vector3(size, size, far).equals(tv));

    });

    it("unprojectRay", () =>
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
            var p = ray.getPointWithZ(mathUtil.lerp(near, far, Math.random()));
            var pp = orthographicLens.project(p);
            ok(mathUtil.equals(x, pp.x));
            ok(mathUtil.equals(y, pp.y));
        }
    });

    it("unprojectWithDepth", () =>
    {
        var size = Math.random();
        var near = Math.random();
        var far = Math.random() + near;

        var orthographicLens = new OrthographicLens(size, 1, near, far);

        var x = Math.random();
        var y = Math.random();

        for (let i = 0; i < NUM; i++)
        {
            var sZ = mathUtil.lerp(near, far, Math.random());
            var p = orthographicLens.unprojectWithDepth(x, y, sZ);
            ok(mathUtil.equals(sZ, p.z));

            var pp = orthographicLens.project(p);
            ok(mathUtil.equals(x, pp.x));
            ok(mathUtil.equals(y, pp.y));
        }
    });
});
