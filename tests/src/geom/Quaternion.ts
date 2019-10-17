namespace feng3d
{
    QUnit.module("Quaternion", () =>
    {
        QUnit.test("rotatePoint", (assert) =>
        {
            var quat = Quaternion.random();

            var v = Vector3.random();

            var v1 = quat.rotatePoint(v);
            var v2 = quat.toMatrix3D().transformVector(v);

            assert.ok(
                v1.equals(v2)
            );

        });
    });
}