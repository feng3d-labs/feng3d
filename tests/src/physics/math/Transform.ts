QUnit.module("Transform", () =>
{

    QUnit.test("toMatrix3D,pointToWorldFrame", (assert) =>
    {
        var trans = new CANNON.Transform();
        trans.position = feng3d.Vector3.random();
        trans.quaternion = feng3d.Quaternion.random();

        var mat = trans.toMatrix3D();

        var v = feng3d.Vector3.random();
        var v1 = new feng3d.Vector3();
        var v2 = new feng3d.Vector3();

        trans.pointToWorldFrame(v, v1);
        mat.transformVector(v, v2);

        assert.ok(v1.equals(v2));

    });

    QUnit.test("pointToLocalFrame,pointToWorldFrame", (assert) =>
    {
        var trans = new CANNON.Transform();
        trans.position = feng3d.Vector3.random();
        trans.quaternion = feng3d.Quaternion.random();

        var v = feng3d.Vector3.random();
        var v1 = trans.pointToWorldFrame(v);
        var v2 = trans.pointToLocalFrame(v1);

        assert.ok(v.equals(v2));
    });

    QUnit.test("vectorToWorldFrame,vectorToLocalFrame", (assert) =>
    {
        var trans = new CANNON.Transform();
        trans.position = feng3d.Vector3.random();
        trans.quaternion = feng3d.Quaternion.random();

        var v = feng3d.Vector3.random();
        var v1 = trans.vectorToWorldFrame(v);
        var v2 = trans.vectorToLocalFrame(v1);
        assert.ok(v.equals(v2));

        var mat = trans.toMatrix3D();
        var v3 = mat.deltaTransformVector(v);
        mat.invert();
        var v4 = mat.deltaTransformVector(v3);
        assert.ok(v.equals(v4));

        assert.ok(v1.equals(v3));
        assert.ok(v2.equals(v4));

    });

});