QUnit.module("Transform", () =>
{

    QUnit.test("toMatrix3D ", (assert) =>
    {
        var trans = new CANNON.Transform();
        trans.position = feng3d.Vector3.random();
        trans.quaternion = feng3d.Quaternion.random();

        var mat = trans.toMatrix3D();

        var v = feng3d.Vector3.random();
        var v1 = new feng3d.Vector3();
        var v2 = new feng3d.Vector3();

        CANNON.Transform.pointToWorldFrame(trans, v, v1);
        mat.transformVector(v, v2);

        assert.ok(v1.equals(v2));

    });

});