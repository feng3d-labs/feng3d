import { Camera, Color4, CubeGeometry, Object3D, reactive, Renderable, Scene, StandardMaterial, View, object3DLogic } from 'feng3d';
const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
const scene = new Scene(); reactive(sceneObject3D).components.push(scene); scene.setObject3D(sceneObject3D); scene.init();
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
const camera = new Camera(); reactive(cameraObject3D).components.push(camera); camera.setObject3D(cameraObject3D); camera.init();
{ const _r = reactive(camera.object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
object3DLogic(scene.object3D).addChild(camera.object3D);

const engine = new View(null, scene, camera);

const cube = new Object3D();
reactive(cube.position).z = 3;
reactive(cube.position).y = -1;
object3DLogic(scene.object3D).addChild(cube);

//变化旋转与颜色
setInterval(() => {
    reactive(cube.rotation).y += 1;
}, 15);

const model = new Renderable(); reactive(cube).components.push(model); model.setObject3D(cube); model.init();
const cubeGeo = new CubeGeometry(); cubeGeo.width = 1; cubeGeo.height = 1; cubeGeo.depth = 1; cubeGeo.segmentsW = 1; cubeGeo.segmentsH = 1; cubeGeo.segmentsD = 1; cubeGeo.tile6 = false;
model.geometry = cubeGeo;
//材质
const textureMaterial = model.material = new StandardMaterial();
(textureMaterial as any).s_texture = { source: { url: '/m.png' }, flipY: false };
