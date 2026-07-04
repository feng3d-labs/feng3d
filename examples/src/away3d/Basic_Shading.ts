import { Object3D, batchRun, Camera, Color4, CubeGeometry, DirectionalLight, FPSController, Geometry, PlaneGeometry, reactive, Renderable, Scene, SphereGeometry, StandardMaterial, Texture2D, ticker, transformLogic, TorusGeometry, Vector3, View, object3DLogic } from 'feng3d';

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3) {
    const m = transformLogic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
const scene = object3DLogic(sceneObject3D).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
const camera = object3DLogic(cameraObject3D).addComponent(Camera);
{ const _r = reactive(camera.object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
object3DLogic(scene.object3D).addChild(camera.object3D);

const engine = new View(null, scene, camera);

let planeMaterial: StandardMaterial;
let sphereMaterial: StandardMaterial;
let cubeMaterial: StandardMaterial;
let torusMaterial: StandardMaterial;
let light1: Object3D;
let light2: Object3D;
let plane: Object3D;
let sphere: Object3D;
let cube: Object3D;
let torus: Object3D;

initEngine();
initLights();
initMaterials();
initObjects();
initListeners();

function initEngine() {
    reactive(camera.object3D.position).y = 5;
    reactive(camera.object3D.position).z = -10;
    lookAtTransform(camera.transform, new Vector3());
    object3DLogic(camera.object3D).addComponent(FPSController);
}

function initMaterials() {
    planeMaterial = new StandardMaterial();
    let tex: Texture2D;
    tex = new Texture2D(); tex.source = { url: "/floor_diffuse.jpg" }; planeMaterial.s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: "/floor_normal.jpg" }; planeMaterial.s_normal = tex;
    tex = new Texture2D(); tex.source = { url: "/floor_specular.jpg" }; planeMaterial.s_specular = tex;
    sphereMaterial = new StandardMaterial();
    tex = new Texture2D(); tex.source = { url: "/beachball_diffuse.jpg" }; sphereMaterial.s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: "/beachball_specular.jpg" }; sphereMaterial.s_specular = tex;
    cubeMaterial = new StandardMaterial();
    tex = new Texture2D(); tex.source = { url: "/trinket_diffuse.jpg" }; cubeMaterial.s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: "/trinket_normal.jpg" }; cubeMaterial.s_normal = tex;
    tex = new Texture2D(); tex.source = { url: "/trinket_specular.jpg" }; cubeMaterial.s_specular = tex;
    torusMaterial = new StandardMaterial();
    tex = new Texture2D(); tex.source = { url: "/weave_diffuse.jpg" }; torusMaterial.s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: "/weave_normal.jpg" }; torusMaterial.s_normal = tex;
    tex = new Texture2D(); tex.source = { url: "/weave_diffuse.jpg" }; torusMaterial.s_specular = tex;
}

function initLights() {
    scene.ambientColor.a = 0.2;

    light1 = new Object3D();
    const directionalLight = object3DLogic(light1).addComponent(DirectionalLight);
    directionalLight.intensity = 0.7;
    reactive(light1.rotation).x = 90;
    object3DLogic(scene.object3D).addChild(light1);

    light2 = new Object3D();
    const directionalLight2 = object3DLogic(light2).addComponent(DirectionalLight);
    directionalLight2.color.fromUnit(0x00FFFF);
    directionalLight2.intensity = 0.7;
    reactive(light2.rotation).x = 90;
    object3DLogic(scene.object3D).addChild(light2);
}

function initObjects() {
    plane = new Object3D();
    const planeModel = object3DLogic(plane).addComponent(Renderable);
    const planeGeometry = new PlaneGeometry();
    planeGeometry.width = 10; planeGeometry.height = 10;
    planeModel.geometry = planeGeometry;
    planeModel.material = planeMaterial;
    planeGeometry.scaleU = 2;
    planeGeometry.scaleV = 2;
    reactive(plane.position).y = -0.20;
    object3DLogic(scene.object3D).addChild(plane);

    sphere = new Object3D();
    const sphereModel = object3DLogic(sphere).addComponent(Renderable);
    sphereModel.geometry = (() => { const g = new SphereGeometry(); g.radius = 1.50; g.segmentsW = 40; g.segmentsH = 20; return g; })();
    sphereModel.material = sphereMaterial;
    reactive(sphere.position).x = 3;
    reactive(sphere.position).y = 1.60;
    reactive(sphere.position).z = 3.00;
    object3DLogic(scene.object3D).addChild(sphere);

    cube = new Object3D();
    const cubeModel = object3DLogic(cube).addComponent(Renderable);
    cubeModel.geometry = (() => { const g = new CubeGeometry(); g.width = 2; g.height = 2; g.depth = 2; g.segmentsW = 1; g.segmentsH = 1; g.segmentsD = 1; g.tile6 = false; return g; })();
    cubeModel.material = cubeMaterial;
    reactive(cube.position).x = 3.00;
    reactive(cube.position).y = 1.60;
    reactive(cube.position).z = -2.50;
    object3DLogic(scene.object3D).addChild(cube);

    torus = new Object3D();
    const torusModel = object3DLogic(torus).addComponent(Renderable);
    const torusGeometry = torusModel.geometry = (() => { const g = new TorusGeometry(); g.radius = 1.50; g.tubeRadius = 0.60; g.segmentsR = 40; g.segmentsT = 20; return g; })();
    torusModel.material = torusMaterial;
    torusGeometry.scaleU = 10;
    torusGeometry.scaleV = 5;
    reactive(torus.position).x = -2.50;
    reactive(torus.position).y = 1.60;
    reactive(torus.position).z = -2.50;
    object3DLogic(scene.object3D).addChild(torus);
}

function initListeners() {
    ticker.onframe(onEnterFrame);
}

function onEnterFrame() {
    reactive(light1.rotation).x = 30;
    reactive(light1.rotation).y++;
}
