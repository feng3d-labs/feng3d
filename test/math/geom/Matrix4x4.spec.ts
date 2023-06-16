import { mathUtil } from '@feng3d/polyfill';
import { RotationOrder } from '../../../src/math/enums/RotationOrder';
import { Matrix4x4 } from '../../../src/math/geom/Matrix4x4';
import { Vector3 } from '../../../src/math/geom/Vector3';
import { Vector4 } from '../../../src/math/geom/Vector4';

import { assert, describe, it } from 'vitest';
const { ok, equal, deepEqual } = assert;

describe('Matrix4x4', () =>
{
    it('invert', () =>
    {
        const mat = new Matrix4x4().fromTRS(new Vector3().random(), new Vector3().random(), new Vector3().random());
        const iMat = mat.clone().invert();

        ok(
            iMat.clone().append(mat).equals(new Matrix4x4())
        );

        const v = new Vector4().random();
        // var v = new Vector4().fromVector3(new Vector3().random(), 1);
        const v0 = v.clone().applyMatrix4x4(mat).applyMatrix4x4(iMat);
        ok(
            v.equals(v0)
        );
    });

    it('decompose,recompose', () =>
    {
        const vs = [new Vector3().random(), new Vector3().random(), new Vector3().random()];
        vs[2].set(1, 1, 1);
        const mat = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);
        const vs0 = mat.toTRS();

        ok(vs[0].equals(vs0[0]));
        ok(vs[1].equals(vs0[1]));
        ok(vs[2].equals(vs0[2]));

        const t = new Matrix4x4().fromPosition(vs[0].x, vs[0].y, vs[0].z);
        const r = new Matrix4x4().fromRotation(vs[1].x, vs[1].y, vs[1].z);
        const s = new Matrix4x4().fromScale(vs[2].x, vs[2].y, vs[2].z);
        const mat0 = new Matrix4x4().append(s).append(r).append(t);

        ok(mat.equals(mat0));

        const mat1 = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);
        ok(mat.equals(mat1));
    });

    it('！！！！', () =>
    {
        const mat0 = new Matrix4x4().fromTRS(new Vector3().random(), new Vector3().random(360), new Vector3().random());
        const mat1 = new Matrix4x4().fromTRS(new Vector3().random(), new Vector3().random(360), new Vector3().random());

        const mat2 = mat0.append(mat1);
        const vs = mat2.toTRS();
        const mat3 = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);

        // !!!!
        ok(
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
        ok(mat.determinant !== 0);

        const invertMat = mat.clone().invert();
        const v = new Vector4().random();
        const v1 = invertMat.transformVector4(mat.transformVector4(v));
        ok(v.equals(v1));
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
        const lbn = new Vector4(left, bottom, near, 1);
        let tv = mat.transformVector4(lbn);
        ok(new Vector4(-1, -1, -1, 1).equals(tv));

        const lbf = new Vector4(left, bottom, far, 1);
        tv = mat.transformVector4(lbf);
        ok(new Vector4(-1, -1, 1, 1).equals(tv));

        const ltn = new Vector4(left, top, near, 1);
        tv = mat.transformVector4(ltn);
        ok(new Vector4(-1, 1, -1, 1).equals(tv));

        const ltf = new Vector4(left, top, far, 1);
        tv = mat.transformVector4(ltf);
        ok(new Vector4(-1, 1, 1, 1).equals(tv));

        const rbn = new Vector4(right, bottom, near, 1);
        tv = mat.transformVector4(rbn);
        ok(new Vector4(1, -1, -1, 1).equals(tv));

        const rbf = new Vector4(right, bottom, far, 1);
        tv = mat.transformVector4(rbf);
        ok(new Vector4(1, -1, 1, 1).equals(tv));

        const rtn = new Vector4(right, top, near, 1);
        tv = mat.transformVector4(rtn);
        ok(new Vector4(1, 1, -1, 1).equals(tv));

        const rtf = new Vector4(right, top, far, 1);
        tv = mat.transformVector4(rtf);
        ok(new Vector4(1, 1, 1, 1).equals(tv));
    });

    it('setPerspectiveFromFOV，测试透视矩阵可逆性', () =>
    {
        const fov = Math.random() * Math.PI * 2;
        const aspect = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = new Matrix4x4().setPerspectiveFromFOV(fov, aspect, near, far);
        ok(mat.determinant !== 0);

        const invertMat = mat.clone().invert();
        const v = new Vector4().random();
        const v1 = invertMat.transformVector4(mat.transformVector4(v));

        ok(v.equals(v1));
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
        const lbn = new Vector4(-tan * near * aspect, -tan * near, near, 1);
        let tv = mat.transformVector4(lbn);
        equal(tv.w, lbn.z);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(-1, -1, -1, 1).equals(tv));

        const lbf = new Vector4(-tan * far * aspect, -tan * far, far, 1);
        tv = mat.transformVector4(lbf);
        equal(tv.w, lbf.z);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(-1, -1, 1, 1).equals(tv));

        const ltn = new Vector4(-tan * near * aspect, tan * near, near, 1);
        tv = mat.transformVector4(ltn);
        equal(tv.w, ltn.z);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(-1, 1, -1, 1).equals(tv));

        const ltf = new Vector4(-tan * far * aspect, tan * far, far, 1);
        tv = mat.transformVector4(ltf);
        equal(tv.w, ltf.z);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(-1, 1, 1, 1).equals(tv));

        const rbn = new Vector4(tan * near * aspect, -tan * near, near, 1);
        tv = mat.transformVector4(rbn);
        equal(tv.w, rbn.z);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(1, -1, -1, 1).equals(tv));

        const rbf = new Vector4(tan * far * aspect, -tan * far, far, 1);
        tv = mat.transformVector4(rbf);
        equal(tv.w, rbf.z);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(1, -1, 1, 1).equals(tv));

        const rtn = new Vector4(tan * near * aspect, tan * near, near, 1);
        tv = mat.transformVector4(rtn);
        equal(tv.w, rtn.z);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(1, 1, -1, 1).equals(tv));

        const rtf = new Vector4(tan * far * aspect, tan * far, far, 1);
        tv = mat.transformVector4(rtf);
        equal(tv.w, rtf.z);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(1, 1, 1, 1).equals(tv));
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
        ok(mat.determinant !== 0);

        const invertMat = mat.clone().invert();
        const v = new Vector4().random();
        const v1 = invertMat.transformVector4(mat.transformVector4(v));

        ok(v.equals(v1));
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
        // 测试可视空间的8个顶点是否被正确投影
        const lbn = new Vector4(-tan * near * aspect, -tan * near, near, 1);
        let tv = mat.transformVector4(lbn);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(-1, -1, -1, 1).equals(tv));

        const lbf = new Vector4(-tan * far * aspect, -tan * far, far, 1);
        tv = mat.transformVector4(lbf);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(-1, -1, 1, 1).equals(tv));

        const ltn = new Vector4(-tan * near * aspect, tan * near, near, 1);
        tv = mat.transformVector4(ltn);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(-1, 1, -1, 1).equals(tv));

        const ltf = new Vector4(-tan * far * aspect, tan * far, far, 1);
        tv = mat.transformVector4(ltf);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(-1, 1, 1, 1).equals(tv));

        const rbn = new Vector4(tan * near * aspect, -tan * near, near, 1);
        tv = mat.transformVector4(rbn);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(1, -1, -1, 1).equals(tv));

        const rbf = new Vector4(tan * far * aspect, -tan * far, far, 1);
        tv = mat.transformVector4(rbf);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(1, -1, 1, 1).equals(tv));

        const rtn = new Vector4(tan * near * aspect, tan * near, near, 1);
        tv = mat.transformVector4(rtn);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(1, 1, -1, 1).equals(tv));

        const rtf = new Vector4(tan * far * aspect, tan * far, far, 1);
        tv = mat.transformVector4(rtf);
        tv.scaleNumber(1 / tv.w);
        ok(new Vector4(1, 1, 1, 1).equals(tv));
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
        ok(mat.equals(mat0));

        //
        mat = new Matrix4x4().fromRotation(r.x, r.y, r.z, RotationOrder.YZX);
        mat0 = new Matrix4x4()
            .appendRotation(Vector3.X_AXIS, r.x)
            .appendRotation(Vector3.Z_AXIS, r.z)
            .appendRotation(Vector3.Y_AXIS, r.y)
            ;
        ok(mat.equals(mat0));

        //
        mat = new Matrix4x4().fromRotation(r.x, r.y, r.z, RotationOrder.ZXY);
        mat0 = new Matrix4x4()
            .appendRotation(Vector3.Y_AXIS, r.y)
            .appendRotation(Vector3.X_AXIS, r.x)
            .appendRotation(Vector3.Z_AXIS, r.z)
            ;
        ok(mat.equals(mat0));

        mat = new Matrix4x4().fromRotation(r.x, r.y, r.z, RotationOrder.XZY);
        mat0 = new Matrix4x4()
            .appendRotation(Vector3.Y_AXIS, r.y)
            .appendRotation(Vector3.Z_AXIS, r.z)
            .appendRotation(Vector3.X_AXIS, r.x)
            ;
        ok(mat.equals(mat0));

        //
        mat = new Matrix4x4().fromRotation(r.x, r.y, r.z, RotationOrder.YXZ);
        mat0 = new Matrix4x4()
            .appendRotation(Vector3.Z_AXIS, r.z)
            .appendRotation(Vector3.X_AXIS, r.x)
            .appendRotation(Vector3.Y_AXIS, r.y)
            ;
        ok(mat.equals(mat0));

        //
        mat = new Matrix4x4().fromRotation(r.x, r.y, r.z, RotationOrder.XYZ);
        mat0 = new Matrix4x4()
            .appendRotation(Vector3.Z_AXIS, r.z)
            .appendRotation(Vector3.Y_AXIS, r.y)
            .appendRotation(Vector3.X_AXIS, r.x)
            ;
        ok(mat.equals(mat0));
    });

    it('prependScale', () =>
    {
        const vs = [new Vector3().random(), new Vector3().random(), new Vector3().random()];
        const mat = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);

        const s = new Vector3().random();

        const mat0 = mat.prependScale(s.x, s.y, s.z);
        const mat1 = mat.prependScale1(s.x, s.y, s.z);

        ok(mat1.equals(mat0));
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

        ok(result0.equals(result1));

        //
        const randomTRSMat4 = new Matrix4x4().fromTRS(
            new Vector3(Math.random(), Math.random(), Math.random()),
            new Vector3(Math.random(), Math.random(), Math.random()),
            new Vector3(Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5),
        );

        const result2 = new Matrix4x4().copy(randomTRSMat4).append(translationMat4);

        const v0 = new Vector3(randomTRSMat4.elements[12], randomTRSMat4.elements[13], randomTRSMat4.elements[14]).add(translationVec3);
        const v = new Vector3(result2.elements[12], result2.elements[13], result2.elements[14]);

        ok(v0.equals(v));
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

        ok(mathUtil.equals(length0, length1) && mathUtil.equals(length0, length2));
    });
});
