import { OrthographicLens } from '../../../../src/3d/cameras/lenses/OrthographicLens';
import { Vector3 } from '../../../../src/math/geom/Vector3';
import { mathUtil } from '../../../../src/polyfill/MathUtil';

import { assert, describe, it } from 'vitest';
const { ok, equal, deepEqual } = assert;

const NUM = 10;

describe('OrthographicLens', () =>
{
    it('project', () =>
    {
        // 生成随机正交矩阵
        const size = Math.random();
        const near = Math.random();
        const far = Math.random() + near;

        const orthographicLens = new OrthographicLens(size, 1, near, far);

        // 测试可视空间的8个顶点是否被正确投影
        const lbn = new Vector3(-size, -size, near);
        let tv = orthographicLens.project(lbn);
        ok(new Vector3(-1, -1, -1).equals(tv));

        const lbf = new Vector3(-size, -size, far);
        tv = orthographicLens.project(lbf);
        ok(new Vector3(-1, -1, 1).equals(tv));

        const ltn = new Vector3(-size, size, near);
        tv = orthographicLens.project(ltn);
        ok(new Vector3(-1, 1, -1).equals(tv));

        const ltf = new Vector3(-size, size, far);
        tv = orthographicLens.project(ltf);
        ok(new Vector3(-1, 1, 1).equals(tv));

        const rbn = new Vector3(size, -size, near);
        tv = orthographicLens.project(rbn);
        ok(new Vector3(1, -1, -1).equals(tv));

        const rbf = new Vector3(size, -size, far);
        tv = orthographicLens.project(rbf);
        ok(new Vector3(1, -1, 1).equals(tv));

        const rtn = new Vector3(size, size, near);
        tv = orthographicLens.project(rtn);
        ok(new Vector3(1, 1, -1).equals(tv));

        const rtf = new Vector3(size, size, far);
        tv = orthographicLens.project(rtf);
        ok(new Vector3(1, 1, 1).equals(tv));
    });

    it('unproject', () =>
    {
        // 生成随机正交矩阵
        const size = Math.random();
        const near = Math.random();
        const far = Math.random() + near;

        const orthographicLens = new OrthographicLens(size, 1, near, far);

        // 测试可视空间的8个顶点是否被正确投影
        const lbn = new Vector3(-1, -1, -1);
        let tv = orthographicLens.unproject(lbn);
        ok(new Vector3(-size, -size, near).equals(tv));

        const lbf = new Vector3(-1, -1, 1);
        tv = orthographicLens.unproject(lbf);
        ok(new Vector3(-size, -size, far).equals(tv));

        const ltn = new Vector3(-1, 1, -1);
        tv = orthographicLens.unproject(ltn);
        ok(new Vector3(-size, size, near).equals(tv));

        const ltf = new Vector3(-1, 1, 1);
        tv = orthographicLens.unproject(ltf);
        ok(new Vector3(-size, size, far).equals(tv));

        const rbn = new Vector3(1, -1, -1);
        tv = orthographicLens.unproject(rbn);
        ok(new Vector3(size, -size, near).equals(tv));

        const rbf = new Vector3(1, -1, 1);
        tv = orthographicLens.unproject(rbf);
        ok(new Vector3(size, -size, far).equals(tv));

        const rtn = new Vector3(1, 1, -1);
        tv = orthographicLens.unproject(rtn);
        ok(new Vector3(size, size, near).equals(tv));

        const rtf = new Vector3(1, 1, 1);
        tv = orthographicLens.unproject(rtf);
        ok(new Vector3(size, size, far).equals(tv));
    });

    it('unprojectRay', () =>
    {
        const size = Math.random();
        const near = Math.random();
        const far = Math.random() + near;

        const orthographicLens = new OrthographicLens(size, 1, near, far);

        const x = Math.random();
        const y = Math.random();

        for (let i = 0; i < NUM; i++)
        {
            const ray = orthographicLens.unprojectRay(x, y);
            const p = ray.getPointWithZ(mathUtil.lerp(near, far, Math.random()));
            const pp = orthographicLens.project(p);
            ok(mathUtil.equals(x, pp.x));
            ok(mathUtil.equals(y, pp.y));
        }
    });

    it('unprojectWithDepth', () =>
    {
        const size = Math.random();
        const near = Math.random();
        const far = Math.random() + near;

        const orthographicLens = new OrthographicLens(size, 1, near, far);

        const x = Math.random();
        const y = Math.random();

        for (let i = 0; i < NUM; i++)
        {
            const sZ = mathUtil.lerp(near, far, Math.random());
            const p = orthographicLens.unprojectWithDepth(x, y, sZ);
            ok(mathUtil.equals(sZ, p.z));

            const pp = orthographicLens.project(p);
            ok(mathUtil.equals(x, pp.x));
            ok(mathUtil.equals(y, pp.y));
        }
    });
});
