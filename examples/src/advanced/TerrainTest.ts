import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, FPSController, Renderable, TerrainGeometry, Material, TextureMinFilter, Vector4, PointLight, Color3, ticker } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

camera.transform.x = 0;
camera.transform.y = 80;
camera.transform.z = 0;
// camera.transform.lookAt(new Vector3());
camera.gameObject.addComponent(FPSController);

const root = '../../resources/terrain/';
//
const terrain = serialization.setValue(new GameObject(), { name: 'terrain' });
const model = terrain.addComponent(Renderable);
// model.geometry = new TerrainGeometry();
model.geometry = new TerrainGeometry({
    heightMap: { __class__: 'Texture2D', source: { url: `${root}terrain_heights.jpg` } },
    width: 500, height: 100, depth: 500,
    segmentsW: 100,
    segmentsH: 100,
});
const material = serialization.setValue(new Material(), {
    shaderName: 'terrain', uniforms: {
        s_diffuse: { __class__: 'Texture2D', source: { url: `${root}terrain_diffuse.jpg` } },
        s_normal: { __class__: 'Texture2D', source: { url: `${root}terrain_normals.jpg` } },
        //
        s_blendTexture: { __class__: 'Texture2D', source: { url: `${root}terrain_splats.png` }, generateMipmap: true, minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR },
        s_splatTexture1: { __class__: 'Texture2D', source: { url: `${root}beach.jpg` }, generateMipmap: true, minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR },
        s_splatTexture2: { __class__: 'Texture2D', source: { url: `${root}grass.jpg` }, generateMipmap: true, minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR },
        s_splatTexture3: { __class__: 'Texture2D', source: { url: `${root}rock.jpg` }, generateMipmap: true, minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR },
        u_splatRepeats: new Vector4(1, 50, 50, 50),
    }
});

model.material = material;
scene.gameObject.addChild(terrain);

scene.ambientColor.setTo(0.2, 0.2, 0.2, 1.0);

// 初始化光源
const light1 = new GameObject();
const pointLight1 = light1.addComponent(PointLight);
pointLight1.range = 5000;
pointLight1.color = new Color3(1, 1, 1);
// pointLight1.shadowType = ShadowType.PCF_Shadows;
light1.transform.y = 1000;
scene.gameObject.addChild(light1);

//
ticker.onframe(() =>
{
    const time = new Date().getTime();
    const angle = time / 1000 / 5;
    light1.transform.y = Math.sin(angle) * 1000;
    light1.transform.z = Math.cos(angle) * 1000;

    // console.log(light1.transform.y, light1.transform.z);
});
