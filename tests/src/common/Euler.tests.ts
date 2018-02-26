namespace feng3d
{

    // testRotate0()
    // {
    //     for (var i = 0; i < 100; i++)
    //     {
    //         var euler = new Euler(0, 0, 0);
    //         var rotation = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    //         rotation.scale(360);
    //         euler.rotate(Vector3.X_AXIS, rotation.x);
    //         euler.rotate(Vector3.Y_AXIS, rotation.y);
    //         euler.rotate(Vector3.Z_AXIS, rotation.z);
    //         assert(euler.equals(rotation, 0.01));
    //     }
    // }

    // testRotate()
    // {
    //     var euler = new Euler(0, 0, 0);
    //     var rotateMatrix3d = new Matrix4x4();
    //     for (var i = 0; i < 100; i++)
    //     {
    //         var axis = { x: Math.random(), y: Math.random(), z: Math.random() }, angle = Math.random() * 90;
    //         euler.rotate(axis, angle);
    //         rotateMatrix3d.appendRotation(axis, angle);
    //         var eulerMatrix3d = euler.toMatrix3D();
    //         assert(eulerMatrix3d.equals(rotateMatrix3d));
    //     }
    // }

    // testTransformRotation()
    // {
    //     var rotation = { x: Math.random() * 360, y: Math.random() * 360, z: Math.random() * 360 };
    //     var euler = new Euler(rotation);
    //     var rotateMatrix3d = Matrix4x4.fromRotation(rotation);
    //     for (var i = 0; i < 100; i++)
    //     {
    //         var randomRotation = { x: Math.random() * 360, y: Math.random() * 360, z: Math.random() * 360 };
    //         var resultRotation1 = new Vector3();
    //         var resultRotation2 = new Vector3();
    //         euler.transformRotation(randomRotation, resultRotation1);
    //         rotateMatrix3d.transformRotation(randomRotation, resultRotation2);
    //         assert(resultRotation1.equals(resultRotation2));
    //     }
    // }

    // testAppend()
    // {
    //     var rotation = { x: Math.random() * 360, y: Math.random() * 360, z: Math.random() * 360 };
    //     var euler = new Euler(rotation);
    //     var rotateMatrix3d = Matrix4x4.fromRotation(rotation);
    //     for (var i = 0; i < 100; i++)
    //     {
    //         var changeRotation = { x: Math.random() * 360, y: Math.random() * 360, z: Math.random() * 360 };

    //         euler.append(changeRotation);
    //         rotateMatrix3d.append(Matrix4x4.fromRotation(changeRotation));

    //         var eulerMatrix3d = euler.toMatrix3D();
    //         assert(eulerMatrix3d.equals(rotateMatrix3d));
    //     }
    // }

    // testInvert()
    // {
    //     for (var i = 0; i < 100; i++)
    //     {
    //         var rotation = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    //         rotation.scale(1000);
    //         var euler = new Euler(0, 0, 0);
    //         euler.rotate(Vector3.X_AXIS, rotation.x);
    //         euler.rotate(Vector3.Y_AXIS, rotation.y);
    //         euler.rotate(Vector3.Z_AXIS, rotation.z);
    //         assert(euler.equals(rotation, 0.001));

    //         euler.rotate(Vector3.Z_AXIS, -rotation.z);
    //         euler.rotate(Vector3.Y_AXIS, -rotation.y);
    //         euler.rotate(Vector3.X_AXIS, -rotation.x);
    //         assert(euler.equals(new Vector3()));

    //         var euler1 = new Euler();
    //         euler1.rotate(Vector3.X_AXIS, rotation.x);
    //         euler1.rotate(Vector3.Y_AXIS, rotation.y);
    //         euler1.rotate(Vector3.Z_AXIS, rotation.z);
    //         assert(euler1.equals(rotation, 0.001));

    //         var euler2 = new Euler();
    //         euler2.rotate(Vector3.Z_AXIS, -rotation.z);
    //         euler2.rotate(Vector3.Y_AXIS, -rotation.y);
    //         euler2.rotate(Vector3.X_AXIS, -rotation.x);

    //         var mergeEuler = euler1.clone();
    //         mergeEuler.append(euler2);
    //         assert(mergeEuler.equals(new Vector3()));

    //         // euler.copyFrom(rotation);
    //         // var inverteuler = euler.clone();
    //         // inverteuler.invert();

    //         // var result = euler.clone();
    //         // result.append(inverteuler);
    //         // assert(result.equals(new Vector3(), 0.0001));

    //         var euler = new Euler(0, 0, 0);
    //         euler.append(new Euler().rotate(Vector3.X_AXIS, rotation.x));

    //         var euler1 = new Euler();
    //         euler1.append(new Euler().rotate(Vector3.Y_AXIS, rotation.y));
    //         euler1.append(new Euler().rotate(Vector3.Z_AXIS, rotation.z));

    //         euler.append(euler1);
    //         assert(euler.equals(rotation, 0.0001));

    //     }
    // }

    // testAppendInvert()
    // {
    //     for (var i = 0; i < 100; i++)
    //     {
    //         var rotation = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    //         rotation.scale(1000);
    //         // rotation.x = -204.35293458336056;
    //         // rotation.y = 53.6719294679584;
    //         // rotation.z = -108.44530012851261;

    //         var changeRotation = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    //         changeRotation.scale(1000);
    //         // changeRotation.x = 0;
    //         // changeRotation.y = 0;
    //         // changeRotation.z = 0;

    //         // changeRotation.x = 0;
    //         // changeRotation.y = -343.32008752043055;
    //         // changeRotation.z = -326.93672932807874;

    //         var changeEuler = new Euler(changeRotation);

    //         var euler = new Euler(rotation);
    //         euler.append(changeEuler);
    //         euler.appendInvert(changeEuler);
    //         assert(euler.equals(rotation, 0.001));

    //         euler.appendInvert(euler);
    //         assert(euler.equals(new Vector3()));
    //     }
    // }

    // testMatrix3d()
    // {
    //     for (var i = 0; i < 100; i++)
    //     {
    //         var rotation = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    //         rotation.scale(1000);
    //         var scale = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    //         scale.scale(1000);

    //         var rotationmatrix3d = Matrix4x4.fromRotation(rotation);
    //         var scalematrix3d = Matrix4x4.fromScale(scale);

    //         var matrix3d1 = scalematrix3d.clone().append(rotationmatrix3d);
    //         var matrix3d2 = rotationmatrix3d.clone().append(scalematrix3d);

    //         log(matrix3d1.decompose()[2])
    //         log(matrix3d2.decompose()[2])

    //         assert(matrix3d1.equals(matrix3d2));
    //     }
    // }

    // testMatrix3d1()
    // {
    //     for (var i = 0; i < 100; i++)
    //     {
    //         var rotation = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    //         rotation.scale(1000);
    //         rotation.y = 90;

    //         var matrix3d1 = Matrix4x4.fromRotation(rotation);

    //         // var matrix3d2 = new Matrix4x4();
    //         // matrix3d2.appendRotation(matrix3d2.up, rotation.y);
    //         // matrix3d2.appendRotation(matrix3d2.right, rotation.x);
    //         // matrix3d2.appendRotation(matrix3d2.forward, rotation.z);

    //         // assert(matrix3d1.equals(matrix3d2));

    //         // log(rotation, matrix3d1.decompose()[1].scale(180 / Math.PI));
    //     }
    // }
}