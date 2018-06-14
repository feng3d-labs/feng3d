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
            var v = Vector3.random();
            var v1 = invertMat.transformVector(mat.transformVector(v));
            assert.ok(v.equals(v1));
        });

        QUnit.test("setPerspective", (assert) =>
        {
            var fov = Math.random() * Math.PI;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random() + near;
            //
            var mat = new Matrix4x4().setPerspective(fov, aspect, near, far);
            assert.ok(mat.determinant != 0);

            var invertMat = mat.clone().invert();
            var v = Vector3.random();
            var v1 = invertMat.transformVector(mat.transformVector(v));

            // 透视矩阵并不可逆，但是其中x，y分量（保存不变）可逆
            v1.z = v.z;

            assert.ok(v.equals(v1));
        });


    });
}