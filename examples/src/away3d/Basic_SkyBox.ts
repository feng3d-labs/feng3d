import { Camera, Color4, GameObject, PerspectiveLens, reactive, Renderable, Scene, SkyBox, StandardMaterial, TextureCube, ticker, transformLogic, TorusGeometry, Vector3, View, windowEventProxy } from 'feng3d';
const sceneGameObject = new GameObject(); sceneGameObject.name = "Untitled";
const scene = sceneGameObject.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraGameObject = new GameObject(); cameraGameObject.name = "Main Camera";
const camera = cameraGameObject.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

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

const skybox = new GameObject(); skybox.name = "skybox";
const skyboxComponent = skybox.addComponent(SkyBox);
skyboxComponent.s_skyboxTexture = cubeTexture;
scene.gameObject.addChild(skybox);

reactive(camera.transform.position).z = -6;
transformLogic(camera.transform).lookAt(new Vector3());
camera.lens = new PerspectiveLens(90);

const torusMaterial = new StandardMaterial();
torusMaterial.s_envMap = cubeTexture;
torusMaterial.uniforms.u_ambient.fromUnit(0x111111);
torusMaterial.uniforms.u_ambient.a = 0.25;

const torus = new GameObject(); torus.name = "torus";
const model = torus.addComponent(Renderable);
model.geometry = (() => { const g = new TorusGeometry(); g.radius = 1.50; g.tubeRadius = 0.60; g.segmentsR = 40; g.segmentsT = 20; return g; })();
model.material = torusMaterial;
scene.gameObject.addChild(torus);

ticker.onframe(() => {
    reactive(torus.transform.rotation).x += 2;
    reactive(torus.transform.rotation).y += 1;
    { const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 0; _r.z = 0; }
    reactive(camera.transform.rotation).y += 0.5 * (windowEventProxy.clientX - canvas.clientLeft - canvas.clientWidth / 2) / 800;
    transformLogic(camera.transform).moveBackward(6);
});
