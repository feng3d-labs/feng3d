import { Camera, Color3, Color4, FPSController, GameObject, PointLight, reactive, Renderable, Scene, serialization, StandardMaterial, TerrainGeometry, ticker, transformLogic, Vector3, View } from 'feng3d';
const scene = serialization.setValue(new GameObject(), { name: "Untitled" }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: "Main Camera" }).addComponent(Camera);
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
const terrain = serialization.setValue(new GameObject(), { name: "terrain" });
const model = terrain.addComponent(Renderable);
model.geometry = new TerrainGeometry({ heightMap: { __class__: "Texture2D", source: { url: root + 'terrain_heights.jpg' } } });
const material = serialization.setValue(new StandardMaterial(), {
    s_diffuse: { __class__: "Texture2D", source: { url: root + 'terrain_diffuse.jpg' } },
    s_normal: { __class__: "Texture2D", source: { url: root + 'terrain_normals.jpg' } },
} as any);

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
