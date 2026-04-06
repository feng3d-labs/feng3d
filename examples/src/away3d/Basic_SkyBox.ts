namespace examples
{
    var scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Untitled' }).addComponent(feng3d.Scene);
    scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

    var camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Main Camera' }).addComponent(feng3d.Camera);
    camera.transform.position = new feng3d.Vector3(0, 1, -10);
    scene.gameObject.addChild(camera.gameObject);

    var engine = new feng3d.View(null, scene, camera);
    var canvas = engine.canvas;

    var cubeTexture = feng3d.serialization.setValue(new feng3d.TextureCube(), {
        rawData: {
            type: 'path', paths: [
                'resources/skybox/snow_positive_x.jpg',
                'resources/skybox/snow_positive_y.jpg',
                'resources/skybox/snow_positive_z.jpg',
                'resources/skybox/snow_negative_x.jpg',
                'resources/skybox/snow_negative_y.jpg',
                'resources/skybox/snow_negative_z.jpg',
            ]
        }
    });

    var skybox = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'skybox' });
    var skyboxComponent = skybox.addComponent(feng3d.SkyBox);
    skyboxComponent.s_skyboxTexture = cubeTexture;
    scene.gameObject.addChild(skybox);

    camera.transform.z = -6;
    camera.transform.lookAt(new feng3d.Vector3());
    camera.lens = new feng3d.PerspectiveLens(90);

    var torusMaterial = new feng3d.Material();
    const uniforms = torusMaterial.uniforms as feng3d.StandardUniforms;
    uniforms.s_envMap = cubeTexture;
    uniforms.u_ambient.fromUnit(0x111111);
    uniforms.u_ambient.a = 0.25;

    var torus = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'torus' });
    var model = torus.addComponent(feng3d.Renderable);
    model.geometry = feng3d.serialization.setValue(new feng3d.TorusGeometry(), { radius: 1.50, tubeRadius: 0.60, segmentsR: 40, segmentsT: 20 });
    model.material = torusMaterial;
    scene.gameObject.addChild(torus);

    feng3d.ticker.onframe(() =>
    {
        torus.transform.rx += 2;
        torus.transform.ry += 1;
        camera.transform.position = new feng3d.Vector3(0, 0, 0);
        camera.transform.ry += 0.5 * (feng3d.windowEventProxy.clientX - canvas.clientLeft - canvas.clientWidth / 2) / 800;
        camera.transform.moveBackward(6);
    });
}
