namespace examples
{
    var scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Untitled' }).addComponent(feng3d.Scene);
    scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

    var camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Main Camera' }).addComponent(feng3d.Camera);
    camera.transform.position = new feng3d.Vector3(0, 1, -10);
    scene.gameObject.addChild(camera.gameObject);

    var engine = new feng3d.View(null, scene, camera);

    //
    camera.transform.z = -5;
    camera.transform.y = 2;
    camera.transform.lookAt(new feng3d.Vector3());
    camera.gameObject.addComponent(feng3d.FPSController);

    var root = 'resources/terrain/';
    //
    var terrain = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'terrain' });
    var model = terrain.addComponent(feng3d.Renderable);
    model.geometry = new feng3d.TerrainGeometry({ heightMap: { __class__: 'Texture2D', source: { url: `${root}terrain_heights.jpg` } } });
    var material = feng3d.serialization.setValue(new feng3d.Material(), {
        shaderName: 'standard', uniforms: {
            s_diffuse: { __class__: 'Texture2D', source: { url: `${root}terrain_diffuse.jpg` } },
            s_normal: { __class__: 'Texture2D', source: { url: `${root}terrain_normals.jpg` } },
        }
    });

    // var terrainMethod = new TerrainMergeMethod(root + 'terrain_splats.png',root + 'test3.jpg',new Vector3(50, 50, 50));
    // material.terrainMethod = new TerrainMergeMethod(root + 'terrain_splats.png', root + 'test1.jpg', new Vector3(50, 50, 50));
    model.material = material;
    scene.gameObject.addChild(terrain);

    // 初始化光源
    var light1 = new feng3d.GameObject();
    var pointLight1 = light1.addComponent(feng3d.PointLight);
    // pointLight1.range = 1000;
    pointLight1.color = new feng3d.Color3(1, 1, 0);
    light1.transform.y = 3;
    // scene.transform.addChild(light1);

    //
    feng3d.ticker.onframe(() =>
    {
        const time = new Date().getTime();
        const angle = time / 1000;
        light1.transform.x = Math.sin(angle) * 3;
        light1.transform.z = Math.cos(angle) * 3;
    });

}
