import { Camera, Color3, Color4, FPSController, GameObject, PointLight, reactive, Renderable, Scene, StandardMaterial, TerrainGeometry, Texture2D, TextureMinFilter, ticker, transformLogic, Vector3, Vector4, View } from 'feng3d';
const sceneGameObject = new GameObject(); sceneGameObject.name = "Untitled";
const scene = sceneGameObject.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraGameObject = new GameObject(); cameraGameObject.name = "Main Camera";
const camera = cameraGameObject.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

reactive(camera.transform.position).x = 0;
reactive(camera.transform.position).y = 80;
reactive(camera.transform.position).z = 0;
camera.gameObject.addComponent(FPSController);

const root = '/terrain/';
//
const terrain = new GameObject(); terrain.name = "terrain";
const model = terrain.addComponent(Renderable);
const heightMap = new Texture2D(); heightMap.source = { url: root + 'terrain_heights.jpg' };
const terrainGeo = new TerrainGeometry();
terrainGeo.heightMap = heightMap;
terrainGeo.width = 500; terrainGeo.height = 100; terrainGeo.depth = 500;
terrainGeo.segmentsW = 100;
terrainGeo.segmentsH = 100;
model.geometry = terrainGeo;
const material = new StandardMaterial();
let tex: Texture2D;
tex = new Texture2D(); tex.source = { url: root + 'terrain_diffuse.jpg' }; material.s_diffuse = tex;
tex = new Texture2D(); tex.source = { url: root + 'terrain_normals.jpg' }; material.s_normal = tex;
//
tex = new Texture2D(); tex.source = { url: root + 'terrain_splats.png' }; tex.generateMipmap = true; tex.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR; (material as any).s_blendTexture = tex;
tex = new Texture2D(); tex.source = { url: root + 'beach.jpg' }; tex.generateMipmap = true; tex.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR; (material as any).s_splatTexture1 = tex;
tex = new Texture2D(); tex.source = { url: root + 'grass.jpg' }; tex.generateMipmap = true; tex.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR; (material as any).s_splatTexture2 = tex;
tex = new Texture2D(); tex.source = { url: root + 'rock.jpg' }; tex.generateMipmap = true; tex.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR; (material as any).s_splatTexture3 = tex;
material.uniforms['u_splatRepeats'] = new Vector4(1, 50, 50, 50);

model.material = material;
scene.gameObject.addChild(terrain);

scene.ambientColor.setTo(0.2, 0.2, 0.2, 1.0);

//初始化光源
const light1 = new GameObject();
const pointLight1 = light1.addComponent(PointLight);
pointLight1.range = 5000;
pointLight1.color = new Color3(1, 1, 1);
reactive(light1.transform.position).y = 1000;
scene.gameObject.addChild(light1);

//
ticker.onframe(() => {
    const time = new Date().getTime();
    const angle = time / 1000 / 5;
    reactive(light1.transform.position).y = Math.sin(angle) * 1000;
    reactive(light1.transform.position).z = Math.cos(angle) * 1000;
});
