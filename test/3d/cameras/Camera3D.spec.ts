import { Vector2, Vector3 } from '@feng3d/math';
import { mathUtil } from '@feng3d/polyfill';
import { assert, describe, it } from 'vitest';
import { Camera3D } from '../../../src/3d/cameras/Camera3D';
import { Node3D } from '../../../src/3d/core/Node3D';

const { ok, equal, deepEqual } = assert;

describe('Camera3D', () =>
{
    it('project unproject', () =>
    {
        // 生成随机正交矩阵
        const near = Math.random();
        const far = Math.random() + near;
        const aspect = Math.random();
        const fov = 60; // Camera3D 默认为fov为60度的视野。

        const camera3D: Camera3D = new Node3D().addComponent('Camera3D', {
            aspect,
            near,
            far,
        });

        const nearH = near * Math.tan(fov * 0.5 * Math.PI / 180);
        const nearW = nearH * aspect;

        // 测试可视空间的8个顶点是否被正确投影
        const lbn = new Vector3(-nearW, -nearH, near);
        const lbn1 = new Vector3(-1, -1, -1);
        let tv = camera3D.project(lbn);
        ok(lbn1.equals(tv));
        tv = camera3D.unproject(lbn1);
        ok(lbn.equals(tv));

        const ltn = new Vector3(-nearW, nearH, near);
        const ltn1 = new Vector3(-1, 1, -1);
        tv = camera3D.project(ltn);
        ok(ltn1.equals(tv));
        tv = camera3D.unproject(ltn1);
        ok(ltn.equals(tv));

        const rbn = new Vector3(nearW, -nearH, near);
        const rbn1 = new Vector3(1, -1, -1);
        tv = camera3D.project(rbn);
        ok(rbn1.equals(tv));
        tv = camera3D.unproject(rbn1);
        ok(rbn.equals(tv));

        const rtn = new Vector3(nearW, nearH, near);
        const rtn1 = new Vector3(1, 1, -1);
        tv = camera3D.project(rtn);
        ok(rtn1.equals(tv));
        tv = camera3D.unproject(rtn1);
        ok(rtn.equals(tv));

        const farH = far * Math.tan(fov * 0.5 * Math.PI / 180);
        const farW = farH * aspect;

        const lbf = new Vector3(-farW, -farH, far);
        const lbf1 = new Vector3(-1, -1, 1);
        tv = camera3D.project(lbf);
        ok(lbf1.equals(tv));
        tv = camera3D.unproject(lbf1);
        ok(lbf.equals(tv));

        const ltf = new Vector3(-farW, farH, far);
        const ltf1 = new Vector3(-1, 1, 1);
        tv = camera3D.project(ltf);
        ok(ltf1.equals(tv));
        tv = camera3D.unproject(ltf1);
        ok(ltf.equals(tv));

        const rbf = new Vector3(farW, -farH, far);
        const rbf1 = new Vector3(1, -1, 1);
        tv = camera3D.project(rbf);
        ok(rbf1.equals(tv));
        tv = camera3D.unproject(rbf1);
        ok(rbf.equals(tv));

        const rtf = new Vector3(farW, farH, far);
        const rtf1 = new Vector3(1, 1, 1);
        tv = camera3D.project(rtf);
        ok(rtf1.equals(tv));
        tv = camera3D.unproject(rtf1);
        ok(rtf.equals(tv));
    });

    it('getGlobalRay3D', () =>
    {
        // 生成随机正交矩阵
        const near = Math.random();
        const far = Math.random() + near;
        const aspect = Math.random();
        const fov = 60; // Camera3D 默认为fov为60度的视野。

        const camera3D: Camera3D = new Node3D().addComponent('Camera3D', {
            aspect,
            near,
            far,
        });

        const nearH = near * Math.tan(fov * 0.5 * Math.PI / 180);
        const nearW = nearH * aspect;

        const lbn = new Vector3(-nearW, -nearH, near);
        const lbn1 = new Vector3(-1, -1, -1);

        const ray = camera3D.getGlobalRay3D(lbn1.x, lbn1.y);
        const r = ray.onWithPoint(lbn);

        equal(r, true);
    });

    it('getScaleByDepth', () =>
    {
        // 生成随机正交矩阵
        const near = Math.random();
        const far = Math.random() + near;
        const aspect = Math.random();
        const fov = 60; // Camera3D 默认为fov为60度的视野。

        const camera3D: Camera3D = new Node3D().addComponent('Camera3D', {
            aspect,
            near,
            far,
        });

        const nearH = near * Math.tan(fov * 0.5 * Math.PI / 180);
        const nearW = nearH * aspect;

        let scale: number;

        scale = camera3D.getScaleByDepth(-1, new Vector2(1, 0));
        ok(mathUtil.equals(scale, nearW));

        scale = camera3D.getScaleByDepth(-1, new Vector2(0, 1));
        ok(mathUtil.equals(scale, nearH));

        const farH = far * Math.tan(fov * 0.5 * Math.PI / 180);
        const farW = farH * aspect;

        scale = camera3D.getScaleByDepth(1, new Vector2(1, 0));
        ok(mathUtil.equals(scale, farW));

        scale = camera3D.getScaleByDepth(1, new Vector2(0, 1));
        ok(mathUtil.equals(scale, farH));
    });
});
