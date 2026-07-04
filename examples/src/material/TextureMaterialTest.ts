import { Camera, Color4, CubeGeometry, GameObject, reactive, Renderable, Scene, StandardMaterial, View } from 'feng3d';
const sceneGameObject = new GameObject(); sceneGameObject.name = "Untitled";
const scene = sceneGameObject.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraGameObject = new GameObject(); cameraGameObject.name = "Main Camera";
const camera = cameraGameObject.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const cube = new GameObject();
reactive(cube.transform.position).z = 3;
reactive(cube.transform.position).y = -1;
scene.gameObject.addChild(cube);

//变化旋转与颜色
setInterval(() => {
    reactive(cube.transform.rotation).y += 1;
}, 15);

const model = cube.addComponent(Renderable);
const cubeGeo = new CubeGeometry(); cubeGeo.width = 1; cubeGeo.height = 1; cubeGeo.depth = 1; cubeGeo.segmentsW = 1; cubeGeo.segmentsH = 1; cubeGeo.segmentsD = 1; cubeGeo.tile6 = false;
model.geometry = cubeGeo;
//材质
const textureMaterial = model.material = new StandardMaterial();
(textureMaterial as any).s_texture = { source: { url: '/m.png' }, flipY: false };
