namespace examples
{
    var scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Untitled' }).addComponent(feng3d.Scene);
    scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

    var camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Main Camera' }).addComponent(feng3d.Camera);
    camera.transform.position = new feng3d.Vector3(0, 1, -10);
    scene.gameObject.addChild(camera.gameObject);

    var engine = new feng3d.View(null, scene, camera);

    var cube = feng3d.GameObject.createPrimitive('Cube');
    cube.transform.z = 3;
    scene.gameObject.addChild(cube);

    // 初始化颜色材质
    var colorMaterial = cube.getComponent(feng3d.Renderable).material = feng3d.serialization.setValue(new feng3d.Material(), { shaderName: 'color' });

    // 变化旋转与颜色
    setInterval(function ()
    {
        cube.transform.ry += 1;
    }, 15);
    setInterval(function ()
    {
        (<feng3d.ColorUniforms>colorMaterial.uniforms).u_diffuseInput.fromUnit(Math.random() * (1 << 32 - 1));
    }, 1000);
}
