import { Object3D, batchRun, Camera, CubeGeometry, DirectionalLight, FPSController, Geometry, PlaneGeometry, reactive, Renderable, Scene, SphereGeometry, StandardMaterial, createStandardMaterial, Texture2D, ticker, logic, TorusGeometry, Vector3, View, createObject3D, createCamera, createScene, createMeshRenderer, createDirectionalLight, createFPSController, createPlaneGeometry, createSphereGeometry, createCubeGeometry, createTorusGeometry } from 'feng3d';

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3) {
    const m = logic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
reactive(scene).background = { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 };

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(logic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(logic(scene).object3D).children.push(logic(camera).object3D);

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
    reactive(logic(camera).object3D.position).y = 5;
    reactive(logic(camera).object3D.position).z = -10;
    lookAtTransform(logic(camera).object3D, new Vector3());
    { const c = createFPSController(); reactive(logic(camera).object3D).components.push(c); }
}

function initMaterials() {
    planeMaterial = createStandardMaterial();
    let tex: Texture2D;
    tex = new Texture2D(); tex.source = { url: "/floor_diffuse.jpg" }; reactive(planeMaterial).s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: "/floor_normal.jpg" }; reactive(planeMaterial).s_normal = tex;
    tex = new Texture2D(); tex.source = { url: "/floor_specular.jpg" }; reactive(planeMaterial).s_specular = tex;
    sphereMaterial = createStandardMaterial();
    tex = new Texture2D(); tex.source = { url: "/beachball_diffuse.jpg" }; reactive(sphereMaterial).s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: "/beachball_specular.jpg" }; reactive(sphereMaterial).s_specular = tex;
    cubeMaterial = createStandardMaterial();
    tex = new Texture2D(); tex.source = { url: "/trinket_diffuse.jpg" }; reactive(cubeMaterial).s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: "/trinket_normal.jpg" }; reactive(cubeMaterial).s_normal = tex;
    tex = new Texture2D(); tex.source = { url: "/trinket_specular.jpg" }; reactive(cubeMaterial).s_specular = tex;
    torusMaterial = createStandardMaterial();
    tex = new Texture2D(); tex.source = { url: "/weave_diffuse.jpg" }; reactive(torusMaterial).s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: "/weave_normal.jpg" }; reactive(torusMaterial).s_normal = tex;
    tex = new Texture2D(); tex.source = { url: "/weave_diffuse.jpg" }; reactive(torusMaterial).s_specular = tex;
}

function initLights() {
    reactive(scene.ambientColor).a = 0.2;

    light1 = createObject3D();
    const directionalLight = createDirectionalLight(); reactive(light1).components.push(directionalLight);
    reactive(directionalLight).intensity = 0.7;
    reactive(light1.rotation).x = 90;
    reactive(logic(scene).object3D).children.push(light1);

    light2 = createObject3D();
    const directionalLight2 = createDirectionalLight(); reactive(light2).components.push(directionalLight2);
    directionalLight2.color.fromUnit(0x00FFFF);
    reactive(directionalLight2).intensity = 0.7;
    reactive(light2.rotation).x = 90;
    reactive(logic(scene).object3D).children.push(light2);
}

function initObjects() {
    plane = createObject3D();
    const planeModel = createMeshRenderer(); reactive(plane).components.push(planeModel);
    const planeGeometry = createPlaneGeometry();
    reactive(planeGeometry).width = 10; reactive(planeGeometry).height = 10;
    reactive(planeModel).geometry = planeGeometry;
    reactive(planeModel).material = planeMaterial;
    planeGeometry.scaleU = 2;
    planeGeometry.scaleV = 2;
    reactive(plane.position).y = -0.20;
    reactive(logic(scene).object3D).children.push(plane);

    sphere = createObject3D();
    const sphereModel = createMeshRenderer(); reactive(sphere).components.push(sphereModel);
    reactive(sphereModel).geometry = (() => { const g = createSphereGeometry(); reactive(g).radius = 1.50; reactive(g).segmentsW = 40; reactive(g).segmentsH = 20; return g; })();
    reactive(sphereModel).material = sphereMaterial;
    reactive(sphere.position).x = 3;
    reactive(sphere.position).y = 1.60;
    reactive(sphere.position).z = 3.00;
    reactive(logic(scene).object3D).children.push(sphere);

    cube = createObject3D();
    const cubeModel = createMeshRenderer(); reactive(cube).components.push(cubeModel);
    reactive(cubeModel).geometry = (() => { const g = createCubeGeometry(); reactive(g).width = 2; reactive(g).height = 2; reactive(g).depth = 2; reactive(g).segmentsW = 1; reactive(g).segmentsH = 1; reactive(g).segmentsD = 1; reactive(g).tile6 = false; return g; })();
    reactive(cubeModel).material = cubeMaterial;
    reactive(cube.position).x = 3.00;
    reactive(cube.position).y = 1.60;
    reactive(cube.position).z = -2.50;
    reactive(logic(scene).object3D).children.push(cube);

    torus = createObject3D();
    const torusModel = createMeshRenderer(); reactive(torus).components.push(torusModel);
    const torusGeometry = reactive(torusModel).geometry = (() => { const g = createTorusGeometry(); reactive(g).radius = 1.50; reactive(g).tubeRadius = 0.60; reactive(g).segmentsR = 40; reactive(g).segmentsT = 20; return g; })();
    reactive(torusModel).material = torusMaterial;
    torusGeometry.scaleU = 10;
    torusGeometry.scaleV = 5;
    reactive(torus.position).x = -2.50;
    reactive(torus.position).y = 1.60;
    reactive(torus.position).z = -2.50;
    reactive(logic(scene).object3D).children.push(torus);
}

function initListeners() {
    ticker.onframe(onEnterFrame);
}

function onEnterFrame() {
    reactive(light1.rotation).x = 30;
    reactive(light1.rotation).y++;
}
