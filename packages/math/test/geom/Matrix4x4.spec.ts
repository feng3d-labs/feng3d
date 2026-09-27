import { mathUtil } from '@feng3d/polyfill';
import { RotationOrder } from '../../src/enums/RotationOrder';
import { Matrix4x4 } from '../../src/geom/Matrix4x4';
import { Vector3 } from '../../src/geom/Vector3';
import { Vector4 } from '../../src/geom/Vector4';

import { assert, describe, it, vi } from 'vitest';
const { equal } = assert;

describe('Matrix4x4', () =>
{
    it('invert', () =>
    {
        const mat = new Matrix4x4().fromTRS(new Vector3().random(), new Vector3().random(), new Vector3().random());
        const iMat = mat.clone().invert();

        assert.ok(
            iMat.clone().append(mat).equals(new Matrix4x4())
        );

        const v = new Vector4().random();
        // var v = new Vector4().fromVector3(new Vector3().random(), 1);
        const v0 = v.clone().applyMatrix4x4(mat).applyMatrix4x4(iMat);
        assert.ok(
            v.equals(v0)
        );
    });

    it('decompose,recompose', () =>
    {
        const vs = [new Vector3().random(), new Vector3().random(), new Vector3().random()];
        vs[2].set(1, 1, 1);
        const mat = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);
        const vs0 = mat.toTRS();

        assert.ok(vs[0].equals(vs0[0]));
        assert.ok(vs[1].equals(vs0[1]));
        assert.ok(vs[2].equals(vs0[2]));

        const t = new Matrix4x4().fromPosition(vs[0].x, vs[0].y, vs[0].z);
        const r = new Matrix4x4().fromRotation(vs[1].x, vs[1].y, vs[1].z);
        const s = new Matrix4x4().fromScale(vs[2].x, vs[2].y, vs[2].z);
        const mat0 = new Matrix4x4().append(s).append(r).append(t);

        assert.ok(mat.equals(mat0));

        const mat1 = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);
        assert.ok(mat.equals(mat1));
    });

    it('！！！！', () =>
    {
        const mat0 = new Matrix4x4().fromTRS(new Vector3().random(), new Vector3().random(360), new Vector3().random());
        const mat1 = new Matrix4x4().fromTRS(new Vector3().random(), new Vector3().random(360), new Vector3().random());

        const mat2 = mat0.append(mat1);
        const vs = mat2.toTRS();
        const mat3 = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);

        // !!!!
        assert.ok(
            !mat2.equals(mat3)
        );
    });

    it('setOrtho， 测试正交矩阵可逆性', () =>
    {
        // 生成随机正交矩阵
        const left = Math.random();
        const right = Math.random();
        const top = Math.random();
        const bottom = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = new Matrix4x4().setOrtho(left, right, top, bottom, near, far);
        assert.ok(mat.determinant !== 0);

        const invertMat = mat.clone().invert();
        const v = new Vector4().random();
        const v1 = invertMat.transformVector4(mat.transformVector4(v));
        assert.ok(v.equals(v1));
    });

    it('setOrtho，测试可视空间的8个顶点是否被正确投影', () =>
    {
        // 生成随机正交矩阵
        const left = Math.random();
        const right = Math.random();
        const top = Math.random();
        const bottom = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = new Matrix4x4().setOrtho(left, right, top, bottom, near, far);

        // 测试可视空间的8个顶点是否被正确投影
        // WebGPU 约定（z→[0,1]，相机看 -Z）：视锥体顶点 z 为 -near/-far（相机前方 -Z），near→0/far→1
        const lbn = new Vector4(left, bottom, -near, 1);
        let tv = mat.transformVector4(lbn);
        assert.ok(new Vector4(-1, -1, 0, 1).equals(tv));

        const lbf = new Vector4(left, bottom, -far, 1);
        tv = mat.transformVector4(lbf);
        assert.ok(new Vector4(-1, -1, 1, 1).equals(tv));

        const ltn = new Vector4(left, top, -near, 1);
        tv = mat.transformVector4(ltn);
        assert.ok(new Vector4(-1, 1, 0, 1).equals(tv));

        const ltf = new Vector4(left, top, -far, 1);
        tv = mat.transformVector4(ltf);
        assert.ok(new Vector4(-1, 1, 1, 1).equals(tv));

        const rbn = new Vector4(right, bottom, -near, 1);
        tv = mat.transformVector4(rbn);
        assert.ok(new Vector4(1, -1, 0, 1).equals(tv));

        const rbf = new Vector4(right, bottom, -far, 1);
        tv = mat.transformVector4(rbf);
        assert.ok(new Vector4(1, -1, 1, 1).equals(tv));

        const rtn = new Vector4(right, top, -near, 1);
        tv = mat.transformVector4(rtn);
        assert.ok(new Vector4(1, 1, 0, 1).equals(tv));

        const rtf = new Vector4(right, top, -far, 1);
        tv = mat.transformVector4(rtf);
        assert.ok(new Vector4(1, 1, 1, 1).equals(tv));
    });

    it('setPerspectiveFromFOV，测试透视矩阵可逆性', () =>
    {
        const fov = Math.random() * Math.PI * 2;
        const aspect = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = new Matrix4x4().setPerspectiveFromFOV(fov, aspect, near, far);
        assert.ok(mat.determinant !== 0);

        const invertMat = mat.clone().invert();
        const v = new Vector4().random();
        const v1 = invertMat.transformVector4(mat.transformVector4(v));

        assert.ok(v.equals(v1));
    });

    it('setPerspectiveFromFOV，测试可视空间的8个顶点是否被正确投影', () =>
    {
        const fov = Math.random() * 360;
        const aspect = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = new Matrix4x4().setPerspectiveFromFOV(fov, aspect, near, far);

        const tan = Math.tan(fov * Math.PI / 360);
        // 测试可视空间的8个顶点是否被正确投影
        // WebGPU 约定（z→[0,1]，相机看 -Z）：视锥体顶点 z 为 -near/-far（相机前方 -Z），
        // w = -z（m[11]=-1），齐次除法后 z 近→0/远→1
        const lbn = new Vector4(-tan * near * aspect, -tan * near, -near, 1);
        let tv = mat.transformVector4(lbn);
        equal(tv.w, -lbn.z);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(-1, -1, 0, 1).equals(tv));

        const lbf = new Vector4(-tan * far * aspect, -tan * far, -far, 1);
        tv = mat.transformVector4(lbf);
        equal(tv.w, -lbf.z);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(-1, -1, 1, 1).equals(tv));

        const ltn = new Vector4(-tan * near * aspect, tan * near, -near, 1);
        tv = mat.transformVector4(ltn);
        equal(tv.w, -ltn.z);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(-1, 1, 0, 1).equals(tv));

        const ltf = new Vector4(-tan * far * aspect, tan * far, -far, 1);
        tv = mat.transformVector4(ltf);
        equal(tv.w, -ltf.z);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(-1, 1, 1, 1).equals(tv));

        const rbn = new Vector4(tan * near * aspect, -tan * near, -near, 1);
        tv = mat.transformVector4(rbn);
        equal(tv.w, -rbn.z);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(1, -1, 0, 1).equals(tv));

        const rbf = new Vector4(tan * far * aspect, -tan * far, -far, 1);
        tv = mat.transformVector4(rbf);
        equal(tv.w, -rbf.z);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(1, -1, 1, 1).equals(tv));

        const rtn = new Vector4(tan * near * aspect, tan * near, -near, 1);
        tv = mat.transformVector4(rtn);
        equal(tv.w, -rtn.z);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(1, 1, 0, 1).equals(tv));

        const rtf = new Vector4(tan * far * aspect, tan * far, -far, 1);
        tv = mat.transformVector4(rtf);
        equal(tv.w, -rtf.z);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(1, 1, 1, 1).equals(tv));
    });

    it('setPerspective，测试透视矩阵可逆性', () =>
    {
        const left = Math.random();
        const right = Math.random();
        const top = Math.random();
        const bottom = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = new Matrix4x4().setPerspective(left, right, top, bottom, near, far);
        assert.ok(mat.determinant !== 0);

        const invertMat = mat.clone().invert();
        const v = new Vector4().random();
        const v1 = invertMat.transformVector4(mat.transformVector4(v));

        assert.ok(v.equals(v1));
    });

    it('setPerspective,测试可视空间的8个顶点是否被正确投影', () =>
    {
        const left = Math.random();
        const right = Math.random();
        const top = Math.random();
        const bottom = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = new Matrix4x4().setPerspective(left, right, top, bottom, near, far);

        const tan = (top - bottom) / 2 / near;
        const aspect = (right - left) / (top - bottom);
        // 测试可视空间的8个顶点是否被正确投影（WebGPU 约定 z→[0,1]，视锥体顶点 z 为 -near/-far）
        const lbn = new Vector4(-tan * near * aspect, -tan * near, -near, 1);
        let tv = mat.transformVector4(lbn);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(-1, -1, 0, 1).equals(tv));

        const lbf = new Vector4(-tan * far * aspect, -tan * far, -far, 1);
        tv = mat.transformVector4(lbf);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(-1, -1, 1, 1).equals(tv));

        const ltn = new Vector4(-tan * near * aspect, tan * near, -near, 1);
        tv = mat.transformVector4(ltn);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(-1, 1, 0, 1).equals(tv));

        const ltf = new Vector4(-tan * far * aspect, tan * far, -far, 1);
        tv = mat.transformVector4(ltf);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(-1, 1, 1, 1).equals(tv));

        const rbn = new Vector4(tan * near * aspect, -tan * near, -near, 1);
        tv = mat.transformVector4(rbn);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(1, -1, 0, 1).equals(tv));

        const rbf = new Vector4(tan * far * aspect, -tan * far, -far, 1);
        tv = mat.transformVector4(rbf);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(1, -1, 1, 1).equals(tv));

        const rtn = new Vector4(tan * near * aspect, tan * near, -near, 1);
        tv = mat.transformVector4(rtn);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(1, 1, 0, 1).equals(tv));

        const rtf = new Vector4(tan * far * aspect, tan * far, -far, 1);
        tv = mat.transformVector4(rtf);
        tv.scaleNumber(1 / tv.w);
        assert.ok(new Vector4(1, 1, 1, 1).equals(tv));
    });

    it('fromRotation', () =>
    {
        const r = new Vector3().random(360, true);

        //
        let mat = new Matrix4x4().fromRotation(r.x, r.y, r.z, RotationOrder.ZYX);
        let mat0 = new Matrix4x4()
            .appendRotation(Vector3.X_AXIS, r.x)
            .appendRotation(Vector3.Y_AXIS, r.y)
            .appendRotation(Vector3.Z_AXIS, r.z)
            ;
        assert.ok(mat.equals(mat0));

        //
        mat = new Matrix4x4().fromRotation(r.x, r.y, r.z, RotationOrder.YZX);
        mat0 = new Matrix4x4()
            .appendRotation(Vector3.X_AXIS, r.x)
            .appendRotation(Vector3.Z_AXIS, r.z)
            .appendRotation(Vector3.Y_AXIS, r.y)
            ;
        assert.ok(mat.equals(mat0));

        //
        mat = new Matrix4x4().fromRotation(r.x, r.y, r.z, RotationOrder.ZXY);
        mat0 = new Matrix4x4()
            .appendRotation(Vector3.Y_AXIS, r.y)
            .appendRotation(Vector3.X_AXIS, r.x)
            .appendRotation(Vector3.Z_AXIS, r.z)
            ;
        assert.ok(mat.equals(mat0));

        mat = new Matrix4x4().fromRotation(r.x, r.y, r.z, RotationOrder.XZY);
        mat0 = new Matrix4x4()
            .appendRotation(Vector3.Y_AXIS, r.y)
            .appendRotation(Vector3.Z_AXIS, r.z)
            .appendRotation(Vector3.X_AXIS, r.x)
            ;
        assert.ok(mat.equals(mat0));

        //
        mat = new Matrix4x4().fromRotation(r.x, r.y, r.z, RotationOrder.YXZ);
        mat0 = new Matrix4x4()
            .appendRotation(Vector3.Z_AXIS, r.z)
            .appendRotation(Vector3.X_AXIS, r.x)
            .appendRotation(Vector3.Y_AXIS, r.y)
            ;
        assert.ok(mat.equals(mat0));

        //
        mat = new Matrix4x4().fromRotation(r.x, r.y, r.z, RotationOrder.XYZ);
        mat0 = new Matrix4x4()
            .appendRotation(Vector3.Z_AXIS, r.z)
            .appendRotation(Vector3.Y_AXIS, r.y)
            .appendRotation(Vector3.X_AXIS, r.x)
            ;
        assert.ok(mat.equals(mat0));
    });

    it('prependScale', () =>
    {
        const vs = [new Vector3().random(), new Vector3().random(), new Vector3().random()];
        const mat = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);

        const s = new Vector3().random();

        const mat0 = mat.prependScale(s.x, s.y, s.z);
        const mat1 = mat.prependScale1(s.x, s.y, s.z);

        assert.ok(mat1.equals(mat0));
    });

    it('appendTranslation', () =>
    {
        const translationVec3 = new Vector3(Math.random(), Math.random(), Math.random());
        const translationMat4 = new Matrix4x4().fromPosition(translationVec3.x, translationVec3.y, translationVec3.z);

        const randomMat4 = new Matrix4x4([
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
        ]);

        const result0 = new Matrix4x4().copy(randomMat4).append(translationMat4);
        const result1 = new Matrix4x4().copy(randomMat4).appendTranslation(translationVec3.x, translationVec3.y, translationVec3.z);

        assert.ok(result0.equals(result1));

        //
        const randomTRSMat4 = new Matrix4x4().fromTRS(
            new Vector3(Math.random(), Math.random(), Math.random()),
            new Vector3(Math.random(), Math.random(), Math.random()),
            new Vector3(Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5),
        );

        const result2 = new Matrix4x4().copy(randomTRSMat4).append(translationMat4);

        const v0 = new Vector3(randomTRSMat4.elements[12], randomTRSMat4.elements[13], randomTRSMat4.elements[14]).add(translationVec3);
        const v = new Vector3(result2.elements[12], result2.elements[13], result2.elements[14]);

        assert.ok(v0.equals(v));
    });

    it('appendScale', () =>
    {
        const randomMat4 = new Matrix4x4([
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
        ]);
        const s = new Vector3().random();

        const result0 = new Matrix4x4().copy(randomMat4).append(Matrix4x4.fromScale(s.x, s.y, s.z));
        const result1 = new Matrix4x4().copy(randomMat4).appendScale(s.x, s.y, s.z);

        // 直接改写 elements 必须与「乘一个缩放矩阵」完全等价
        assert.ok(result0.equals(result1));

        // 只影响前 3 行：第 3 行（m[3] / m[7] / m[11] / m[15]）保持不变
        assert.deepEqual(
            [result1.elements[3], result1.elements[7], result1.elements[11], result1.elements[15]],
            [randomMat4.elements[3], randomMat4.elements[7], randomMat4.elements[11], randomMat4.elements[15]],
        );
    });

    it('appendScale 直接改写 elements（不构造缩放矩阵）', () =>
    {
        const spy = vi.spyOn(Matrix4x4, 'fromScale');
        const mat = new Matrix4x4().fromTRS(new Vector3().random(), new Vector3().random(), new Vector3().random());

        mat.appendScale(Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5);

        assert.equal(spy.mock.calls.length, 0, 'appendScale 不应再分配缩放矩阵');

        spy.mockRestore();
    });

    it('appendScale 支持锚点缩放（锚点是不动点）', () =>
    {
        const pivot = new Vector3(1, 2, 3);
        const mat = new Matrix4x4().appendScale(2, 3, 4, pivot);

        // 锚点自身在缩放后位置不变
        const moved = mat.transformPoint3(pivot);

        assert.ok(moved.equals(pivot));

        // 其它点按相对锚点的偏移被缩放
        const scaled = mat.transformPoint3(new Vector3(2, 2, 3));

        assert.ok(scaled.equals(new Vector3(3, 2, 3)));
    });

    it('appendScale 锚点为原点时与不传锚点等价', () =>
    {
        const vs = [new Vector3().random(), new Vector3().random(), new Vector3().random()];
        const mat0 = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]).appendScale(2, 3, 4);
        const mat1 = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]).appendScale(2, 3, 4, new Vector3(0, 0, 0));

        assert.ok(mat0.equals(mat1));
    });

    it('快速计算向量变换后的长度', () =>
    {
        const p0 = new Vector3().random().scaleNumber(100);
        const p1 = new Vector3().random().scaleNumber(100);

        const vs = [new Vector3().random(), new Vector3().random(), new Vector3().random()];
        const mat = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);

        // 0 两点求长度
        const p0t1 = mat.transformPoint3(p0);
        const p1t1 = mat.transformPoint3(p1);
        const length0 = p1t1.subTo(p0t1).length;

        // 1 向量求长度
        let p01 = p1.subTo(p0);
        const p01t1 = mat.transformVector3(p01);
        const length1 = p01t1.length;

        // 2 快速计算向量变换后的长度（缩放求长度）
        p01 = p1.subTo(p0);
        const s = mat.getScale();
        const p01t2 = p01.multiplyTo(s);
        const length2 = p01t2.length;

        assert.ok(mathUtil.equals(length0, length1) && mathUtil.equals(length0, length2));
    });
});
