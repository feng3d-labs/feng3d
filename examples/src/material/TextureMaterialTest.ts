import { Camera, Color4, CubeGeometry, Object3D, reactive, Renderable, Scene, StandardMaterial, View } from 'feng3d';
const sceneObject3D = new Object3D(); sceneObject3D.name = "Untitled";
const scene = sceneObject3D.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); cameraObject3D.name = "Main Camera";
const camera = cameraObject3D.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.object3D.addChild(camera.object3D);

const engine = new View(null, scene, camera);

const cube = new Object3D();
reactive(cube.transform.position).z = 3;
reactive(cube.transform.position).y = -1;
scene.object3D.addChild(cube);

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
