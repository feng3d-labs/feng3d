import { Object3D, batchRun, Camera, Color4, PerspectiveLens, reactive, Renderable, Scene, SkyBox, StandardMaterial, TextureCube, ticker, transformLogic, TorusGeometry, Vector3, View, windowEventProxy, object3DLogic, cameraLogic, sceneLogic, createObject3D} from 'feng3d';

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3) {
    const m = transformLogic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
object3DLogic(sceneObject3D);
const scene = new Scene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
object3DLogic(cameraObject3D);
const camera = new Camera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

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

const skybox = createObject3D(); reactive(skybox).name = "skybox";
const skyboxComponent = new SkyBox(); reactive(skybox).components.push(skyboxComponent);
skyboxComponent.s_skyboxTexture = cubeTexture;
reactive(sceneLogic(scene).object3D).children.push(skybox);

reactive(cameraLogic(camera).object3D.position).z = -6;
lookAtTransform(cameraLogic(camera).object3D, new Vector3());
camera.lens = new PerspectiveLens(90);

const torusMaterial = new StandardMaterial();
torusMaterial.s_envMap = cubeTexture;
torusMaterial.uniforms.u_ambient.fromUnit(0x111111);
torusMaterial.uniforms.u_ambient.a = 0.25;

const torus = createObject3D(); reactive(torus).name = "torus";
const model = new Renderable(); reactive(torus).components.push(model);
model.geometry = (() => { const g = new TorusGeometry(); g.radius = 1.50; g.tubeRadius = 0.60; g.segmentsR = 40; g.segmentsT = 20; return g; })();
model.material = torusMaterial;
reactive(sceneLogic(scene).object3D).children.push(torus);

ticker.onframe(() => {
    reactive(torus.rotation).x += 2;
    reactive(torus.rotation).y += 1;
    { const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 0; _r.z = 0; }
    reactive(cameraLogic(camera).object3D.rotation).y += 0.5 * (windowEventProxy.clientX - canvas.clientLeft - canvas.clientWidth / 2) / 800;
    // moveBackward: translate along local -Z by distance
    const _m = transformLogic(cameraLogic(camera).object3D).matrix.value;
    const _back = _m.getAxisZ().scaleNumber(-6);
    const _r_pos = reactive(cameraLogic(camera).object3D.position);
    _r_pos.x += _back.x; _r_pos.y += _back.y; _r_pos.z += _back.z;
});
