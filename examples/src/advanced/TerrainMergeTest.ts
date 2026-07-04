import { Camera, Color3, Color4, FPSController, GameObject, PointLight, reactive, Renderable, Scene, StandardMaterial, TerrainGeometry, Texture2D, ticker, transformLogic, Vector3, View } from 'feng3d';
const sceneGameObject = new GameObject(); sceneGameObject.name = "Untitled";
const scene = sceneGameObject.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraGameObject = new GameObject(); cameraGameObject.name = "Main Camera";
const camera = cameraGameObject.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

//
reactive(camera.transform.position).z = -5;
reactive(camera.transform.position).y = 2;
transformLogic(camera.transform).lookAt(new Vector3());
camera.gameObject.addComponent(FPSController);

const root = '/terrain/';
//
const terrain = new GameObject(); terrain.name = "terrain";
const model = terrain.addComponent(Renderable);
const heightMap = new Texture2D(); heightMap.source = { url: root + 'terrain_heights.jpg' };
model.geometry = (() => { const g = new TerrainGeometry(); g.heightMap = heightMap; return g; })();
const material = new StandardMaterial();
let tex: Texture2D;
tex = new Texture2D(); tex.source = { url: root + 'terrain_diffuse.jpg' }; material.s_diffuse = tex;
tex = new Texture2D(); tex.source = { url: root + 'terrain_normals.jpg' }; material.s_normal = tex;

model.material = material;
scene.gameObject.addChild(terrain);

//初始化光源
const light1 = new GameObject();
const pointLight1 = light1.addComponent(PointLight);
pointLight1.color = new Color3(1, 1, 0);
reactive(light1.transform.position).y = 3;

//
ticker.onframe(() => {
    const time = new Date().getTime();
    const angle = time / 1000;
    reactive(light1.transform.position).x = Math.sin(angle) * 3;
    reactive(light1.transform.position).z = Math.cos(angle) * 3;
});
