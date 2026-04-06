namespace examples
{
    var scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Untitled' }).addComponent(feng3d.Scene);
    scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

    var camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Main Camera' }).addComponent(feng3d.Camera);
    camera.transform.position = new feng3d.Vector3(0, 1, -10);
    scene.gameObject.addChild(camera.gameObject);

    var engine = new feng3d.View(null, scene, camera);

    camera.transform.x = 0;
    camera.transform.y = 80;
    camera.transform.z = 0;
    // camera.transform.lookAt(new feng3d.Vector3());
    camera.gameObject.addComponent(feng3d.FPSController);

    var root = 'resources/terrain/';
    //
    var terrain = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'terrain' });
    var model = terrain.addComponent(feng3d.Renderable);
    // model.geometry = new feng3d.TerrainGeometry();
    model.geometry = new feng3d.TerrainGeometry({
        heightMap: { __class__: 'Texture2D', source: { url: `${root}terrain_heights.jpg` } },
        width: 500, height: 100, depth: 500,
        segmentsW: 100,
        segmentsH: 100,
    });
    var material = feng3d.serialization.setValue(new feng3d.Material(), {
        shaderName: 'terrain', uniforms: {
            s_diffuse: { __class__: 'Texture2D', source: { url: `${root}terrain_diffuse.jpg` } },
            s_normal: { __class__: 'Texture2D', source: { url: `${root}terrain_normals.jpg` } },
            //
            s_blendTexture: { __class__: 'Texture2D', source: { url: `${root}terrain_splats.png` }, generateMipmap: true, minFilter: feng3d.TextureMinFilter.LINEAR_MIPMAP_LINEAR },
            s_splatTexture1: { __class__: 'Texture2D', source: { url: `${root}beach.jpg` }, generateMipmap: true, minFilter: feng3d.TextureMinFilter.LINEAR_MIPMAP_LINEAR },
            s_splatTexture2: { __class__: 'Texture2D', source: { url: `${root}grass.jpg` }, generateMipmap: true, minFilter: feng3d.TextureMinFilter.LINEAR_MIPMAP_LINEAR },
            s_splatTexture3: { __class__: 'Texture2D', source: { url: `${root}rock.jpg` }, generateMipmap: true, minFilter: feng3d.TextureMinFilter.LINEAR_MIPMAP_LINEAR },
            u_splatRepeats: new feng3d.Vector4(1, 50, 50, 50),
        }
    });

    model.material = material;
    scene.gameObject.addChild(terrain);

    scene.ambientColor.setTo(0.2, 0.2, 0.2, 1.0);

    // 初始化光源
    var light1 = new feng3d.GameObject();
    var pointLight1 = light1.addComponent(feng3d.PointLight);
    pointLight1.range = 5000;
    pointLight1.color = new feng3d.Color3(1, 1, 1);
    // pointLight1.shadowType = feng3d.ShadowType.PCF_Shadows;
    light1.transform.y = 1000;
    scene.gameObject.addChild(light1);

    //
    feng3d.ticker.onframe(() =>
    {
        const time = new Date().getTime();
        const angle = time / 1000 / 5;
        light1.transform.y = Math.sin(angle) * 1000;
        light1.transform.z = Math.cos(angle) * 1000;

        // console.log(light1.transform.y, light1.transform.z);
    });
}
