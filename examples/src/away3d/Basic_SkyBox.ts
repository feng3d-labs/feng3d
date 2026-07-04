import { Camera, Color4, Object3D, PerspectiveLens, reactive, Renderable, Scene, SkyBox, StandardMaterial, TextureCube, ticker, transformLogic, TorusGeometry, Vector3, View, windowEventProxy, object3DLogic } from 'feng3d';
const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
const scene = object3DLogic(sceneObject3D).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
const camera = object3DLogic(cameraObject3D).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
object3DLogic(scene.object3D).addChild(camera.object3D);

const engine = new View(null, scene, camera);
var canvas = engine.canvas;

const cubeTexture = new TextureCube();
cubeTexture.urls = [
    '/skybox/snow_positive_x.jpg',
    '/skybox/snow_positive_y.jpg',
    '/skybox/snow_positive_z.jpg',
    '/skybox/snow_negative_x.jpg',
    '/skybox/snow_negative_y.jpg',
    '/skybox/snow_negative_z.jpg',
];

const skybox = new Object3D(); reactive(skybox).name = "skybox";
const skyboxComponent = object3DLogic(skybox).addComponent(SkyBox);
skyboxComponent.s_skyboxTexture = cubeTexture;
object3DLogic(scene.object3D).addChild(skybox);

reactive(camera.transform.position).z = -6;
transformLogic(camera.transform).lookAt(new Vector3());
camera.lens = new PerspectiveLens(90);

const torusMaterial = new StandardMaterial();
torusMaterial.s_envMap = cubeTexture;
torusMaterial.uniforms.u_ambient.fromUnit(0x111111);
torusMaterial.uniforms.u_ambient.a = 0.25;

const torus = new Object3D(); reactive(torus).name = "torus";
const model = object3DLogic(torus).addComponent(Renderable);
model.geometry = (() => { const g = new TorusGeometry(); g.radius = 1.50; g.tubeRadius = 0.60; g.segmentsR = 40; g.segmentsT = 20; return g; })();
model.material = torusMaterial;
object3DLogic(scene.object3D).addChild(torus);

ticker.onframe(() => {
    reactive(torus.transform.rotation).x += 2;
    reactive(torus.transform.rotation).y += 1;
    { const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 0; _r.z = 0; }
    reactive(camera.transform.rotation).y += 0.5 * (windowEventProxy.clientX - canvas.clientLeft - canvas.clientWidth / 2) / 800;
    transformLogic(camera.transform).moveBackward(6);
});
