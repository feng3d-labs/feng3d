namespace feng3d
{
    QUnit.module("Matrix4x4", () =>
    {

        QUnit.test("invert", (assert) =>
        {
            var mat = new PerspectiveLens().matrix;
            // var mat = new Matrix4x4().recompose([Vector3.random(), Vector3.random(), Vector3.random()]);
            var imat = mat.clone().invert()

            assert.ok(
                imat.clone().append(mat).equals(new Matrix4x4())
            );

            var v = Vector4.random();
            // var v = Vector4.fromVector3(Vector3.random(), 1);
            var v0 = v.clone().applyMatrix4x4(mat).applyMatrix4x4(imat)
            assert.ok(
                v.equals(v0)
            );

        });

        QUnit.test("decompose,recompose", (assert) =>
        {
            var vs = [Vector3.random(), Vector3.random(), Vector3.random()];
            vs[2].set(1, 1, 1);
            var mat = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);
            var vs0 = mat.toTRS();

            assert.ok(vs[0].equals(vs0[0]));
            assert.ok(vs[1].equals(vs0[1]));
            assert.ok(vs[2].equals(vs0[2]));

            var t = Matrix4x4.fromPosition(vs[0].x, vs[0].y, vs[0].z);
            var r = Matrix4x4.fromRotation(vs[1].x, vs[1].y, vs[1].z);
            var s = Matrix4x4.fromScale(vs[2].x, vs[2].y, vs[2].z);
            var mat0 = new Matrix4x4().append(s).append(r).append(t);

            assert.ok(mat.equals(mat0));

            var mat1 = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);
            assert.ok(mat.equals(mat1));
        });

        QUnit.test("！！！！", (assert) =>
        {
            var mat0 = new Matrix4x4().fromTRS(Vector3.random(), Vector3.random(360), Vector3.random());
            var mat1 = new Matrix4x4().fromTRS(Vector3.random(), Vector3.random(360), Vector3.random());

            var mat2 = mat0.append(mat1);
            var vs = mat2.toTRS();
            var mat3 = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);

            // !!!!
            assert.notOk(
                mat2.equals(mat3)
            );

        });

        QUnit.test("setOrtho， 测试正交矩阵可逆性", (assert) =>
        {
            // 生成随机正交矩阵
            var left = Math.random();
            var right = Math.random();
            var top = Math.random();
            var bottom = Math.random();
            var near = Math.random();
            var far = Math.random();
            //
            var mat = new Matrix4x4().setOrtho(left, right, top, bottom, near, far);
            assert.ok(mat.determinant != 0);

            var invertMat = mat.clone().invert();
            var v = Vector4.random();
            var v1 = invertMat.transformVector4(mat.transformVector4(v));
            assert.ok(v.equals(v1));
        });

        QUnit.test("setOrtho，测试可视空间的8个顶点是否被正确投影", (assert) =>
        {
            // 生成随机正交矩阵
            var left = Math.random();
            var right = Math.random();
            var top = Math.random();
            var bottom = Math.random();
            var near = Math.random();
            var far = Math.random();
            //
            var mat = new Matrix4x4().setOrtho(left, right, top, bottom, near, far);

            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new Vector4(left, bottom, near, 1);
            var tv = mat.transformVector4(lbn);
            assert.ok(new Vector4(-1, -1, -1, 1).equals(tv));

            var lbf = new Vector4(left, bottom, far, 1);
            var tv = mat.transformVector4(lbf);
            assert.ok(new Vector4(-1, -1, 1, 1).equals(tv));

            var ltn = new Vector4(left, top, near, 1);
            var tv = mat.transformVector4(ltn);
            assert.ok(new Vector4(-1, 1, -1, 1).equals(tv));

            var ltf = new Vector4(left, top, far, 1)
            var tv = mat.transformVector4(ltf);
            assert.ok(new Vector4(-1, 1, 1, 1).equals(tv));

            var rbn = new Vector4(right, bottom, near, 1);
            var tv = mat.transformVector4(rbn);
            assert.ok(new Vector4(1, -1, -1, 1).equals(tv));

            var rbf = new Vector4(right, bottom, far, 1)
            var tv = mat.transformVector4(rbf);
            assert.ok(new Vector4(1, -1, 1, 1).equals(tv));

            var rtn = new Vector4(right, top, near, 1);
            var tv = mat.transformVector4(rtn);
            assert.ok(new Vector4(1, 1, -1, 1).equals(tv));

            var rtf = new Vector4(right, top, far, 1);
            var tv = mat.transformVector4(rtf);
            assert.ok(new Vector4(1, 1, 1, 1).equals(tv));
        });

        QUnit.test("setPerspectiveFromFOV，测试透视矩阵可逆性", (assert) =>
        {
            var fov = Math.random() * Math.PI * 2;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random();
            //
            var mat = new Matrix4x4().setPerspectiveFromFOV(fov, aspect, near, far);
            assert.ok(mat.determinant != 0);

            var invertMat = mat.clone().invert();
            var v = Vector4.random();
            var v1 = invertMat.transformVector4(mat.transformVector4(v));

            assert.ok(v.equals(v1));
        });

        QUnit.test("setPerspectiveFromFOV，测试可视空间的8个顶点是否被正确投影", (assert) =>
        {
            var fov = Math.random() * 360;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random();
            //
            var mat = new Matrix4x4().setPerspectiveFromFOV(fov, aspect, near, far);

            var tan = Math.tan(fov * Math.PI / 360);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new Vector4(-tan * near * aspect, -tan * near, near, 1);
            var tv = mat.transformVector4(lbn);
            assert.equal(tv.w, lbn.z)
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(-1, -1, -1, 1).equals(tv));

            var lbf = new Vector4(-tan * far * aspect, -tan * far, far, 1);
            var tv = mat.transformVector4(lbf);
            assert.equal(tv.w, lbf.z)
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(-1, -1, 1, 1).equals(tv));

            var ltn = new Vector4(-tan * near * aspect, tan * near, near, 1);
            var tv = mat.transformVector4(ltn);
            assert.equal(tv.w, ltn.z)
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(-1, 1, -1, 1).equals(tv));

            var ltf = new Vector4(-tan * far * aspect, tan * far, far, 1)
            var tv = mat.transformVector4(ltf);
            assert.equal(tv.w, ltf.z)
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(-1, 1, 1, 1).equals(tv));

            var rbn = new Vector4(tan * near * aspect, -tan * near, near, 1);
            var tv = mat.transformVector4(rbn);
            assert.equal(tv.w, rbn.z)
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(1, -1, -1, 1).equals(tv));

            var rbf = new Vector4(tan * far * aspect, -tan * far, far, 1)
            var tv = mat.transformVector4(rbf);
            assert.equal(tv.w, rbf.z)
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(1, -1, 1, 1).equals(tv));

            var rtn = new Vector4(tan * near * aspect, tan * near, near, 1);
            var tv = mat.transformVector4(rtn);
            assert.equal(tv.w, rtn.z)
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(1, 1, -1, 1).equals(tv));

            var rtf = new Vector4(tan * far * aspect, tan * far, far, 1);
            var tv = mat.transformVector4(rtf);
            assert.equal(tv.w, rtf.z)
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(1, 1, 1, 1).equals(tv));
        });

        QUnit.test("setPerspective，测试透视矩阵可逆性", (assert) =>
        {
            var left = Math.random();
            var right = Math.random();
            var top = Math.random();
            var bottom = Math.random();
            var near = Math.random();
            var far = Math.random();
            //
            var mat = new Matrix4x4().setPerspective(left, right, top, bottom, near, far);
            assert.ok(mat.determinant != 0);

            var invertMat = mat.clone().invert();
            var v = Vector4.random();
            var v1 = invertMat.transformVector4(mat.transformVector4(v));

            assert.ok(v.equals(v1));
        });

        QUnit.test("setPerspective,测试可视空间的8个顶点是否被正确投影", (assert) =>
        {
            var left = Math.random();
            var right = Math.random();
            var top = Math.random();
            var bottom = Math.random();
            var near = Math.random();
            var far = Math.random();
            //
            var mat = new Matrix4x4().setPerspective(left, right, top, bottom, near, far);

            var tan = (top - bottom) / 2 / near;
            var aspect = (right - left) / (top - bottom);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new Vector4(-tan * near * aspect, -tan * near, near, 1);
            var tv = mat.transformVector4(lbn);
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(-1, -1, -1, 1).equals(tv));

            var lbf = new Vector4(-tan * far * aspect, -tan * far, far, 1);
            var tv = mat.transformVector4(lbf);
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(-1, -1, 1, 1).equals(tv));

            var ltn = new Vector4(-tan * near * aspect, tan * near, near, 1);
            var tv = mat.transformVector4(ltn);
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(-1, 1, -1, 1).equals(tv));

            var ltf = new Vector4(-tan * far * aspect, tan * far, far, 1)
            var tv = mat.transformVector4(ltf);
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(-1, 1, 1, 1).equals(tv));

            var rbn = new Vector4(tan * near * aspect, -tan * near, near, 1);
            var tv = mat.transformVector4(rbn);
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(1, -1, -1, 1).equals(tv));

            var rbf = new Vector4(tan * far * aspect, -tan * far, far, 1)
            var tv = mat.transformVector4(rbf);
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(1, -1, 1, 1).equals(tv));

            var rtn = new Vector4(tan * near * aspect, tan * near, near, 1);
            var tv = mat.transformVector4(rtn);
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(1, 1, -1, 1).equals(tv));

            var rtf = new Vector4(tan * far * aspect, tan * far, far, 1);
            var tv = mat.transformVector4(rtf);
            tv.scale(1 / tv.w);
            assert.ok(new Vector4(1, 1, 1, 1).equals(tv));
        });

        QUnit.test("fromRotation", (assert) =>
        {
            var r = Vector3.random(360, true);

            //
            var mat = Matrix4x4.fromRotation(r.x, r.y, r.z, feng3d.RotationOrder.ZYX);
            var mat0 = new Matrix4x4()
                .appendRotation(Vector3.X_AXIS, r.x)
                .appendRotation(Vector3.Y_AXIS, r.y)
                .appendRotation(Vector3.Z_AXIS, r.z)
                ;
            assert.ok(mat.equals(mat0));

            //
            var mat = Matrix4x4.fromRotation(r.x, r.y, r.z, feng3d.RotationOrder.YZX);
            var mat0 = new Matrix4x4()
                .appendRotation(Vector3.X_AXIS, r.x)
                .appendRotation(Vector3.Z_AXIS, r.z)
                .appendRotation(Vector3.Y_AXIS, r.y)
                ;
            assert.ok(mat.equals(mat0));

            //
            var mat = Matrix4x4.fromRotation(r.x, r.y, r.z, feng3d.RotationOrder.ZXY);
            var mat0 = new Matrix4x4()
                .appendRotation(Vector3.Y_AXIS, r.y)
                .appendRotation(Vector3.X_AXIS, r.x)
                .appendRotation(Vector3.Z_AXIS, r.z)
                ;
            assert.ok(mat.equals(mat0));

            var mat = Matrix4x4.fromRotation(r.x, r.y, r.z, feng3d.RotationOrder.XZY);
            var mat0 = new Matrix4x4()
                .appendRotation(Vector3.Y_AXIS, r.y)
                .appendRotation(Vector3.Z_AXIS, r.z)
                .appendRotation(Vector3.X_AXIS, r.x)
                ;
            assert.ok(mat.equals(mat0));

            //
            var mat = Matrix4x4.fromRotation(r.x, r.y, r.z, feng3d.RotationOrder.YXZ);
            var mat0 = new Matrix4x4()
                .appendRotation(Vector3.Z_AXIS, r.z)
                .appendRotation(Vector3.X_AXIS, r.x)
                .appendRotation(Vector3.Y_AXIS, r.y)
                ;
            assert.ok(mat.equals(mat0));

            //
            var mat = Matrix4x4.fromRotation(r.x, r.y, r.z, feng3d.RotationOrder.XYZ);
            var mat0 = new Matrix4x4()
                .appendRotation(Vector3.Z_AXIS, r.z)
                .appendRotation(Vector3.Y_AXIS, r.y)
                .appendRotation(Vector3.X_AXIS, r.x)
                ;
            assert.ok(mat.equals(mat0));
        });

        QUnit.test("fromQuaternion", (assert) =>
        {
            var q = Quaternion.random();
            var mat = q.toMatrix();
            var mat0 = new Matrix4x4().fromQuaternion(q);

            assert.ok(mat.equals(mat0));
        });

        QUnit.test("prependScale", (assert) =>
        {
            var vs = [Vector3.random(), Vector3.random(), Vector3.random()];
            var mat = new Matrix4x4().fromTRS(vs[0], vs[1], vs[2]);

            var s = Vector3.random();

            var mat0 = mat.prependScale(s.x, s.y, s.z);
            var mat1 = mat.prependScale1(s.x, s.y, s.z);

            assert.ok(mat1.equals(mat0));
        });

        QUnit.test("appendTranslation", (assert) =>
        {
            const translationVec3 = new Vector3(Math.random(), Math.random(), Math.random());
            const translationMat4 = Matrix4x4.fromPosition(translationVec3.x, translationVec3.y, translationVec3.z);

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

    });
}