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
            var mat = new Matrix4x4().recompose(vs);
            var vs0 = mat.decompose();

            assert.ok(vs[0].equals(vs0[0]));
            assert.ok(vs[1].equals(vs0[1]));
            assert.ok(vs[2].equals(vs0[2]));
        });

        QUnit.test("！！！！", (assert) =>
        {
            var mat0 = new Matrix4x4().recompose([Vector3.random(), Vector3.random(), Vector3.random()]);
            var mat1 = new Matrix4x4().recompose([Vector3.random(), Vector3.random(), Vector3.random()]);

            var mat2 = mat0.append(mat1);
            var vs = mat2.decompose();
            var mat3 = new Matrix4x4().recompose(vs);

            // !!!!
            assert.notOk(
                mat2.equals(mat3)
            );

        });

        QUnit.test("setOrtho", (assert) =>
        {
            var left = Math.random();
            var right = Math.random() + left;
            var top = Math.random();
            var bottom = Math.random() + top;
            var near = Math.random();
            var far = Math.random() + near;
            //
            var mat = new Matrix4x4().setOrtho(left, right, top, bottom, near, far);
            assert.ok(mat.determinant != 0);

            var invertMat = mat.clone().invert();
            var v = Vector4.random();
            var v1 = invertMat.transformVector4(mat.transformVector4(v));
            assert.ok(v.equals(v1));

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

        QUnit.test("setPerspectiveFromFOV", (assert) =>
        {
            var fov = Math.random() * Math.PI;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random() + near;
            //
            var mat = new Matrix4x4().setPerspectiveFromFOV(fov, aspect, near, far);
            assert.ok(mat.determinant != 0);

            var invertMat = mat.clone().invert();
            var v = Vector4.random();
            var v1 = invertMat.transformVector4(mat.transformVector4(v));

            assert.ok(v.equals(v1));

            var tan = Math.tan(fov / 2);
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

        QUnit.test("setPerspective", (assert) =>
        {
            var left = Math.random();
            var right = Math.random() + left;
            var top = Math.random();
            var bottom = Math.random() + top;
            var near = Math.random();
            var far = Math.random() + near;
            //
            var mat = new Matrix4x4().setPerspective(left, right, top, bottom, near, far);
            assert.ok(mat.determinant != 0);

            var invertMat = mat.clone().invert();
            var v = Vector4.random();
            var v1 = invertMat.transformVector4(mat.transformVector4(v));

            assert.ok(v.equals(v1));

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


    });
}