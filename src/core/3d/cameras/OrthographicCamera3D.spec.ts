import { Vector3 } from '@feng3d/math';
import { mathUtil } from '../../../../polyfill/MathUtil';

import { Node3D, OrthographicCamera3D } from '../../../src';

import { assert, describe, it } from 'vitest';

const NUM = 10;

describe('OrthographicCamera3D', () =>
{
    it('project', () =>
    {
        // 生成随机正交矩阵
        const size = Math.random();
        const near = Math.random();
        const far = Math.random() + near;

        new Node3D().components
        const orthographicCamera3D: OrthographicCamera3D = new Node3D().addComponent('OrthographicCamera3D', {
            size,
            near,
            far,
        });
        // 测试可视空间的8个顶点是否被正确投影
        const lbn = new Vector3(-size, -size, near); // left bottom near
        let tv = orthographicCamera3D.project(lbn);
        assert.ok(new Vector3(-1, -1, -1).equals(tv));

        const lbf = new Vector3(-size, -size, far); // left bottom far
        tv = orthographicCamera3D.project(lbf);
        assert.ok(new Vector3(-1, -1, 1).equals(tv));

        const ltn = new Vector3(-size, size, near); // left top near
        tv = orthographicCamera3D.project(ltn);
        assert.ok(new Vector3(-1, 1, -1).equals(tv));

        const ltf = new Vector3(-size, size, far); // left top far
        tv = orthographicCamera3D.project(ltf);
        assert.ok(new Vector3(-1, 1, 1).equals(tv));

        const rbn = new Vector3(size, -size, near); // right bottom near
        tv = orthographicCamera3D.project(rbn);
        assert.ok(new Vector3(1, -1, -1).equals(tv));

        const rbf = new Vector3(size, -size, far); // right bottom far
        tv = orthographicCamera3D.project(rbf);
        assert.ok(new Vector3(1, -1, 1).equals(tv));

        const rtn = new Vector3(size, size, near); // right top near
        tv = orthographicCamera3D.project(rtn);
        assert.ok(new Vector3(1, 1, -1).equals(tv));

        const rtf = new Vector3(size, size, far); // right top far
        tv = orthographicCamera3D.project(rtf);
        assert.ok(new Vector3(1, 1, 1).equals(tv));
    });

    it('unproject', () =>
    {
        // 生成随机正交矩阵
        const size = Math.random();
        const near = Math.random();
        const far = Math.random() + near;

        const orthographicCamera3D: OrthographicCamera3D = new Node3D().addComponent('OrthographicCamera3D', {
            size,
            aspect: 1,
            near,
            far,
        });

        // 测试可视空间的8个顶点是否被正确投影
        const lbn = new Vector3(-1, -1, -1);
        let tv = orthographicCamera3D.unproject(lbn);
        assert.ok(new Vector3(-size, -size, near).equals(tv));

        const lbf = new Vector3(-1, -1, 1);
        tv = orthographicCamera3D.unproject(lbf);
        assert.ok(new Vector3(-size, -size, far).equals(tv));

        const ltn = new Vector3(-1, 1, -1);
        tv = orthographicCamera3D.unproject(ltn);
        assert.ok(new Vector3(-size, size, near).equals(tv));

        const ltf = new Vector3(-1, 1, 1);
        tv = orthographicCamera3D.unproject(ltf);
        assert.ok(new Vector3(-size, size, far).equals(tv));

        const rbn = new Vector3(1, -1, -1);
        tv = orthographicCamera3D.unproject(rbn);
        assert.ok(new Vector3(size, -size, near).equals(tv));

        const rbf = new Vector3(1, -1, 1);
        tv = orthographicCamera3D.unproject(rbf);
        assert.ok(new Vector3(size, -size, far).equals(tv));

        const rtn = new Vector3(1, 1, -1);
        tv = orthographicCamera3D.unproject(rtn);
        assert.ok(new Vector3(size, size, near).equals(tv));

        const rtf = new Vector3(1, 1, 1);
        tv = orthographicCamera3D.unproject(rtf);
        assert.ok(new Vector3(size, size, far).equals(tv));
    });

    it('unprojectRay', () =>
    {
        const size = Math.random();
        const near = Math.random();
        const far = Math.random() + near;

        const orthographicCamera3D: OrthographicCamera3D = new Node3D().addComponent('OrthographicCamera3D', {
            size,
            aspect: 1,
            near,
            far,
        });

        const x = Math.random();
        const y = Math.random();

        for (let i = 0; i < NUM; i++)
        {
            const ray = orthographicCamera3D.getGlobalRay3D(x, y);
            const p = ray.getPointWithZ(mathUtil.lerp(near, far, Math.random()));
            const pp = orthographicCamera3D.project(p);
            assert.ok(mathUtil.equals(x, pp.x));
            assert.ok(mathUtil.equals(y, pp.y));
        }
    });
});
