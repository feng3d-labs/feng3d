import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, FPSController, Renderable, TerrainGeometry, Material, PointLight, Color3, ticker } from 'feng3d';

    const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
    scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

    const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
    camera.transform.position = new Vector3(0, 1, -10);
    scene.gameObject.addChild(camera.gameObject);

    const engine = new View(null, scene, camera);

    //
    camera.transform.z = -5;
    camera.transform.y = 2;
    camera.transform.lookAt(new Vector3());
    camera.gameObject.addComponent(FPSController);

    const root = '../../resources/terrain/';
    //
    const terrain = serialization.setValue(new GameObject(), { name: 'terrain' });
    const model = terrain.addComponent(Renderable);
    model.geometry = new TerrainGeometry({ heightMap: { __class__: 'Texture2D', source: { url: `${root}terrain_heights.jpg` } } });
    const material = serialization.setValue(new Material(), {
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
    const light1 = new GameObject();
    const pointLight1 = light1.addComponent(PointLight);
    // pointLight1.range = 1000;
    pointLight1.color = new Color3(1, 1, 0);
    light1.transform.y = 3;
    // scene.transform.addChild(light1);

    //
    ticker.onframe(() =>
    {
        const time = new Date().getTime();
        const angle = time / 1000;
        light1.transform.x = Math.sin(angle) * 3;
        light1.transform.z = Math.cos(angle) * 3;
    });

