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

        CANNON.Transform.pointToWorldFrame(trans, v, v1);
        mat.transformVector(v, v2);

        assert.ok(v1.equals(v2));

    });

    QUnit.test("pointToLocalFrame,pointToWorldFrame", (assert) =>
    {
        var trans = new CANNON.Transform();
        trans.position = feng3d.Vector3.random();
        trans.quaternion = feng3d.Quaternion.random();

        var v = feng3d.Vector3.random();
        var v1 = CANNON.Transform.pointToWorldFrame(trans, v);
        var v2 = CANNON.Transform.pointToLocalFrame(trans, v1);

        assert.ok(v.equals(v2));

        var v = feng3d.Vector3.random();
        var v1 = CANNON.Transform.pointToLocalFrame(trans, v);
        var v2 = CANNON.Transform.pointToWorldFrame(trans, v1);

        assert.ok(v.equals(v2));

    });

    
    QUnit.test("vectorToWorldFrame,pointToWorldFrame", (assert) =>
    {
        var trans = new CANNON.Transform();
        trans.position = feng3d.Vector3.random();
        trans.quaternion = feng3d.Quaternion.random();

        var v = feng3d.Vector3.random();
        var v1 = CANNON.Transform.vectorToWorldFrame(trans, v);
        var v2 = CANNON.Transform.vectorToLocalFrame(trans, v1);

        assert.ok(v.equals(v2));

        var v = feng3d.Vector3.random();
        var v1 = CANNON.Transform.vectorToLocalFrame(trans, v);
        var v2 = CANNON.Transform.vectorToWorldFrame(trans, v1);

        assert.ok(v.equals(v2));

    });

});