import { Object3D, batchRun, Camera, Color4, CubeGeometry, DirectionalLight, FPSController, Geometry, PlaneGeometry, reactive, Renderable, Scene, SphereGeometry, StandardMaterial, createStandardMaterial, Texture2D, ticker, transformLogic, TorusGeometry, Vector3, View, logic, cameraLogic, sceneLogic, createObject3D, createCamera, createScene, createRenderable, createDirectionalLight, createFPSController, createPlaneGeometry, createSphereGeometry, createCubeGeometry, createTorusGeometry} from 'feng3d';

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3) {
    const m = transformLogic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, sceneObject3D);

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
    reactive(cameraLogic(camera).object3D.position).y = 5;
    reactive(cameraLogic(camera).object3D.position).z = -10;
    lookAtTransform(cameraLogic(camera).object3D, new Vector3());
    { const c = createFPSController(); reactive(cameraLogic(camera).object3D).components.push(c); }
}

function initMaterials() {
    planeMaterial = createStandardMaterial();
    let tex: Texture2D;
    tex = new Texture2D(); tex.source = { url: "/floor_diffuse.jpg" }; planeMaterial.s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: "/floor_normal.jpg" }; planeMaterial.s_normal = tex;
    tex = new Texture2D(); tex.source = { url: "/floor_specular.jpg" }; planeMaterial.s_specular = tex;
    sphereMaterial = createStandardMaterial();
    tex = new Texture2D(); tex.source = { url: "/beachball_diffuse.jpg" }; sphereMaterial.s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: "/beachball_specular.jpg" }; sphereMaterial.s_specular = tex;
    cubeMaterial = createStandardMaterial();
    tex = new Texture2D(); tex.source = { url: "/trinket_diffuse.jpg" }; cubeMaterial.s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: "/trinket_normal.jpg" }; cubeMaterial.s_normal = tex;
    tex = new Texture2D(); tex.source = { url: "/trinket_specular.jpg" }; cubeMaterial.s_specular = tex;
    torusMaterial = createStandardMaterial();
    tex = new Texture2D(); tex.source = { url: "/weave_diffuse.jpg" }; torusMaterial.s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: "/weave_normal.jpg" }; torusMaterial.s_normal = tex;
    tex = new Texture2D(); tex.source = { url: "/weave_diffuse.jpg" }; torusMaterial.s_specular = tex;
}

function initLights() {
    scene.ambientColor.a = 0.2;

    light1 = createObject3D();
    const directionalLight = createDirectionalLight(); reactive(light1).components.push(directionalLight);
    directionalLight.intensity = 0.7;
    reactive(light1.rotation).x = 90;
    reactive(sceneLogic(scene).object3D).children.push(light1);

    light2 = createObject3D();
    const directionalLight2 = createDirectionalLight(); reactive(light2).components.push(directionalLight2);
    directionalLight2.color.fromUnit(0x00FFFF);
    directionalLight2.intensity = 0.7;
    reactive(light2.rotation).x = 90;
    reactive(sceneLogic(scene).object3D).children.push(light2);
}

function initObjects() {
    plane = createObject3D();
    const planeModel = createRenderable(); reactive(plane).components.push(planeModel);
    const planeGeometry = createPlaneGeometry();
    planeGeometry.width = 10; planeGeometry.height = 10;
    planeModel.geometry = planeGeometry;
    planeModel.material = planeMaterial;
    planeGeometry.scaleU = 2;
    planeGeometry.scaleV = 2;
    reactive(plane.position).y = -0.20;
    reactive(sceneLogic(scene).object3D).children.push(plane);

    sphere = createObject3D();
    const sphereModel = createRenderable(); reactive(sphere).components.push(sphereModel);
    sphereModel.geometry = (() => { const g = createSphereGeometry(); g.radius = 1.50; g.segmentsW = 40; g.segmentsH = 20; return g; })();
    sphereModel.material = sphereMaterial;
    reactive(sphere.position).x = 3;
    reactive(sphere.position).y = 1.60;
    reactive(sphere.position).z = 3.00;
    reactive(sceneLogic(scene).object3D).children.push(sphere);

    cube = createObject3D();
    const cubeModel = createRenderable(); reactive(cube).components.push(cubeModel);
    cubeModel.geometry = (() => { const g = createCubeGeometry(); g.width = 2; g.height = 2; g.depth = 2; g.segmentsW = 1; g.segmentsH = 1; g.segmentsD = 1; g.tile6 = false; return g; })();
    cubeModel.material = cubeMaterial;
    reactive(cube.position).x = 3.00;
    reactive(cube.position).y = 1.60;
    reactive(cube.position).z = -2.50;
    reactive(sceneLogic(scene).object3D).children.push(cube);

    torus = createObject3D();
    const torusModel = createRenderable(); reactive(torus).components.push(torusModel);
    const torusGeometry = torusModel.geometry = (() => { const g = createTorusGeometry(); g.radius = 1.50; g.tubeRadius = 0.60; g.segmentsR = 40; g.segmentsT = 20; return g; })();
    torusModel.material = torusMaterial;
    torusGeometry.scaleU = 10;
    torusGeometry.scaleV = 5;
    reactive(torus.position).x = -2.50;
    reactive(torus.position).y = 1.60;
    reactive(torus.position).z = -2.50;
    reactive(sceneLogic(scene).object3D).children.push(torus);
}

function initListeners() {
    ticker.onframe(onEnterFrame);
}

function onEnterFrame() {
    reactive(light1.rotation).x = 30;
    reactive(light1.rotation).y++;
}
