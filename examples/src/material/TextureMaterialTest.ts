namespace examples
{
    var scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Untitled' }).addComponent(feng3d.Scene);
    scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

    var camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Main Camera' }).addComponent(feng3d.Camera);
    camera.transform.position = new feng3d.Vector3(0, 1, -10);
    scene.gameObject.addChild(camera.gameObject);

    var engine = new feng3d.View(null, scene, camera);

    var cube = new feng3d.GameObject();
    cube.transform.z = 3;
    cube.transform.y = -1;
    scene.gameObject.addChild(cube);

    // 变化旋转与颜色
    setInterval(function ()
    {
        cube.transform.ry += 1;
    }, 15);

    var model = cube.addComponent(feng3d.Renderable);
    model.geometry = feng3d.serialization.setValue(new feng3d.CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
    // model.geometry = new PlaneGeometry();
    // 材质
    model.material = feng3d.serialization.setValue(new feng3d.Material(), {
        shaderName: 'texture',
        uniforms: {
            s_texture: {
                __class__: 'Texture2D', source: { url: 'resources/m.png' }, flipY: false
            }
        }
    });
}
