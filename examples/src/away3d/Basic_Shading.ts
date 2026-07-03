import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
camera.transform.position = new feng3d.Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

let planeMaterial: feng3d.StandardMaterial;
let sphereMaterial: feng3d.StandardMaterial;
let cubeMaterial: feng3d.StandardMaterial;
let torusMaterial: feng3d.StandardMaterial;
let light1: feng3d.GameObject;
let light2: feng3d.GameObject;
let plane: feng3d.GameObject;
let sphere: feng3d.GameObject;
let cube: feng3d.GameObject;
let torus: feng3d.GameObject;

initEngine();
initLights();
initMaterials();
initObjects();
initListeners();

function initEngine() {
    camera.transform.y = 5;
    camera.transform.z = -10;
    camera.transform.lookAt(new feng3d.Vector3());
    camera.gameObject.addComponent(feng3d.FPSController);
}

function initMaterials() {
    planeMaterial = feng3d.serialization.setValue(new feng3d.StandardMaterial(), {
        s_diffuse: { __class__: "Texture2D", source: { url: "/floor_diffuse.jpg" } },
        s_normal: { __class__: "Texture2D", source: { url: "/floor_normal.jpg" } },
        s_specular: { __class__: "Texture2D", source: { url: "/floor_specular.jpg" } },
    } as any);
    sphereMaterial = feng3d.serialization.setValue(new feng3d.StandardMaterial(), {
        s_diffuse: { __class__: "Texture2D", source: { url: "/beachball_diffuse.jpg" } },
        s_specular: { __class__: "Texture2D", source: { url: "/beachball_specular.jpg" } },
    } as any);
    cubeMaterial = feng3d.serialization.setValue(new feng3d.StandardMaterial(), {
        s_diffuse: { __class__: "Texture2D", source: { url: "/trinket_diffuse.jpg" } },
        s_normal: { __class__: "Texture2D", source: { url: "/trinket_normal.jpg" } },
        s_specular: { __class__: "Texture2D", source: { url: "/trinket_specular.jpg" } },
    } as any);
    torusMaterial = feng3d.serialization.setValue(new feng3d.StandardMaterial(), {
        s_diffuse: { __class__: "Texture2D", source: { url: "/weave_diffuse.jpg" } },
        s_normal: { __class__: "Texture2D", source: { url: "/weave_normal.jpg" } },
        s_specular: { __class__: "Texture2D", source: { url: "/weave_diffuse.jpg" } },
    } as any);
}

function initLights() {
    scene.ambientColor.a = 0.2;

    light1 = new feng3d.GameObject();
    const directionalLight = light1.addComponent(feng3d.DirectionalLight);
    directionalLight.intensity = 0.7;
    light1.transform.rx = 90;
    scene.gameObject.addChild(light1);

    light2 = new feng3d.GameObject();
    const directionalLight2 = light2.addComponent(feng3d.DirectionalLight);
    directionalLight2.color.fromUnit(0x00FFFF);
    directionalLight2.intensity = 0.7;
    light2.transform.rx = 90;
    scene.gameObject.addChild(light2);
}

function initObjects() {
    plane = new feng3d.GameObject();
    const planeModel = plane.addComponent(feng3d.Renderable);
    const planeGeometry: feng3d.Geometry = planeModel.geometry = feng3d.serialization.setValue(new feng3d.PlaneGeometry(), { width: 10, height: 10 });
    planeModel.material = planeMaterial;
    planeGeometry.scaleU = 2;
    planeGeometry.scaleV = 2;
    plane.transform.y = -0.20;
    scene.gameObject.addChild(plane);

    sphere = new feng3d.GameObject();
    const sphereModel = sphere.addComponent(feng3d.Renderable);
    sphereModel.geometry = feng3d.serialization.setValue(new feng3d.SphereGeometry(), { radius: 1.50, segmentsW: 40, segmentsH: 20 });
    sphereModel.material = sphereMaterial;
    sphere.transform.x = 3;
    sphere.transform.y = 1.60;
    sphere.transform.z = 3.00;
    scene.gameObject.addChild(sphere);

    cube = new feng3d.GameObject();
    const cubeModel = cube.addComponent(feng3d.Renderable);
    cubeModel.geometry = feng3d.serialization.setValue(new feng3d.CubeGeometry(), { width: 2, height: 2, depth: 2, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
    cubeModel.material = cubeMaterial;
    cube.transform.x = 3.00;
    cube.transform.y = 1.60;
    cube.transform.z = -2.50;
    scene.gameObject.addChild(cube);

    torus = new feng3d.GameObject();
    const torusModel = torus.addComponent(feng3d.Renderable);
    const torusGeometry = torusModel.geometry = feng3d.serialization.setValue(new feng3d.TorusGeometry(), { radius: 1.50, tubeRadius: 0.60, segmentsR: 40, segmentsT: 20 });
    torusModel.material = torusMaterial;
    torusGeometry.scaleU = 10;
    torusGeometry.scaleV = 5;
    torus.transform.x = -2.50;
    torus.transform.y = 1.60;
    torus.transform.z = -2.50;
    scene.gameObject.addChild(torus);
}

function initListeners() {
    feng3d.ticker.onframe(onEnterFrame);
}

function onEnterFrame() {
    light1.transform.rx = 30;
    light1.transform.ry++;
}

