namespace examples
{
    var scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Untitled' }).addComponent(feng3d.Scene);
    scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

    var camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Main Camera' }).addComponent(feng3d.Camera);
    camera.transform.position = new feng3d.Vector3(0, 1, -10);
    scene.gameObject.addChild(camera.gameObject);

    var engine = new feng3d.View(null, scene, camera);

    var gameobject = new feng3d.GameObject();
    var model = gameobject.addComponent(feng3d.Renderable);

    var geometry = model.geometry = new feng3d.CustomGeometry();
    geometry.addGeometry(new feng3d.PlaneGeometry());
    var matrix = new feng3d.Matrix4x4();
    matrix.appendTranslation(0, 0.50, 0);
    geometry.addGeometry(feng3d.serialization.setValue(new feng3d.SphereGeometry(), { radius: 50 }), matrix);

    matrix.appendTranslation(0, 0.50, 0);
    var addGeometry = new feng3d.CubeGeometry();
    geometry.addGeometry(addGeometry, matrix);

    addGeometry.width = 0.50;
    matrix.appendTranslation(0, 0.50, 0);
    matrix.appendRotation(feng3d.Vector3.Z_AXIS, 45);
    geometry.addGeometry(addGeometry, matrix);

    gameobject.transform.z = 3;
    gameobject.transform.y = -1;
    scene.gameObject.addChild(gameobject);

    // 初始化颜色材质
    model.material = feng3d.serialization.setValue(new feng3d.Material(), { shaderName: 'color' });
    var colorUniforms = <feng3d.ColorUniforms>model.material.uniforms;

    // 变化旋转与颜色
    setInterval(function ()
    {
        gameobject.transform.ry += 1;
    }, 15);
    setInterval(function ()
    {
        colorUniforms.u_diffuseInput.fromUnit(Math.random() * (1 << 32 - 1));
    }, 1000);
}
