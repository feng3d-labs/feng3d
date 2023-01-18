import { Camera3D, mathUtil, Node3D, OrthographicCamera3D, Vector3 } from '../../../src';

import { assert, describe, it } from 'vitest';
const { ok, equal, deepEqual } = assert;

describe('Camera3D', () =>
{
    it('project', () =>
    {
        // 生成随机正交矩阵
        const near = Math.random();
        const far = Math.random() + near;
        const aspect = 1;

        const camera3D: Camera3D = new Node3D().addComponent('Camera3D', {
            aspect,
            near,
            far,
        });
        const fov = 60; // Camera3D 默认为fov为60度的视野。

        const nearW = near * Math.tan(fov * 0.5 * Math.PI / 180);
        const nearH = nearW * aspect;

        // 测试可视空间的8个顶点是否被正确投影
        const lbn = new Vector3(-nearW, -nearH, near);
        let tv = camera3D.project(lbn);
        ok(new Vector3(-1, -1, -1).equals(tv));

        const ltn = new Vector3(-nearW, nearH, near);
        tv = camera3D.project(ltn);
        ok(new Vector3(-1, 1, -1).equals(tv));

        const rbn = new Vector3(nearW, -nearH, near);
        tv = camera3D.project(rbn);
        ok(new Vector3(1, -1, -1).equals(tv));

        const rtn = new Vector3(nearW, nearH, near);
        tv = camera3D.project(rtn);
        ok(new Vector3(1, 1, -1).equals(tv));

        const farW = far * Math.tan(fov * 0.5 * Math.PI / 180);
        const farH = farW * aspect;

        const lbf = new Vector3(-farW, -farH, far);
        tv = camera3D.project(lbf);
        ok(new Vector3(-1, -1, 1).equals(tv));

        const ltf = new Vector3(-farW, farH, far);
        tv = camera3D.project(ltf);
        ok(new Vector3(-1, 1, 1).equals(tv));

        const rbf = new Vector3(farW, -farH, far);
        tv = camera3D.project(rbf);
        ok(new Vector3(1, -1, 1).equals(tv));

        const rtf = new Vector3(farW, farH, far);
        tv = camera3D.project(rtf);
        ok(new Vector3(1, 1, 1).equals(tv));
    });
});
