import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
{ const _r = feng3d.reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
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
    feng3d.reactive(camera.transform.position).y = 5;
    feng3d.reactive(camera.transform.position).z = -10;
    feng3d.transformLogic(camera.transform).lookAt(new feng3d.Vector3());
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
    feng3d.reactive(light1.transform.rotation).x = 90;
    scene.gameObject.addChild(light1);

    light2 = new feng3d.GameObject();
    const directionalLight2 = light2.addComponent(feng3d.DirectionalLight);
    directionalLight2.color.fromUnit(0x00FFFF);
    directionalLight2.intensity = 0.7;
    feng3d.reactive(light2.transform.rotation).x = 90;
    scene.gameObject.addChild(light2);
}

function initObjects() {
    plane = new feng3d.GameObject();
    const planeModel = plane.addComponent(feng3d.Renderable);
    const planeGeometry: feng3d.Geometry = planeModel.geometry = feng3d.serialization.setValue(new feng3d.PlaneGeometry(), { width: 10, height: 10 });
    planeModel.material = planeMaterial;
    planeGeometry.scaleU = 2;
    planeGeometry.scaleV = 2;
    feng3d.reactive(plane.transform.position).y = -0.20;
    scene.gameObject.addChild(plane);

    sphere = new feng3d.GameObject();
    const sphereModel = sphere.addComponent(feng3d.Renderable);
    sphereModel.geometry = feng3d.serialization.setValue(new feng3d.SphereGeometry(), { radius: 1.50, segmentsW: 40, segmentsH: 20 });
    sphereModel.material = sphereMaterial;
    feng3d.reactive(sphere.transform.position).x = 3;
    feng3d.reactive(sphere.transform.position).y = 1.60;
    feng3d.reactive(sphere.transform.position).z = 3.00;
    scene.gameObject.addChild(sphere);

    cube = new feng3d.GameObject();
    const cubeModel = cube.addComponent(feng3d.Renderable);
    cubeModel.geometry = feng3d.serialization.setValue(new feng3d.CubeGeometry(), { width: 2, height: 2, depth: 2, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
    cubeModel.material = cubeMaterial;
    feng3d.reactive(cube.transform.position).x = 3.00;
    feng3d.reactive(cube.transform.position).y = 1.60;
    feng3d.reactive(cube.transform.position).z = -2.50;
    scene.gameObject.addChild(cube);

    torus = new feng3d.GameObject();
    const torusModel = torus.addComponent(feng3d.Renderable);
    const torusGeometry = torusModel.geometry = feng3d.serialization.setValue(new feng3d.TorusGeometry(), { radius: 1.50, tubeRadius: 0.60, segmentsR: 40, segmentsT: 20 });
    torusModel.material = torusMaterial;
    torusGeometry.scaleU = 10;
    torusGeometry.scaleV = 5;
    feng3d.reactive(torus.transform.position).x = -2.50;
    feng3d.reactive(torus.transform.position).y = 1.60;
    feng3d.reactive(torus.transform.position).z = -2.50;
    scene.gameObject.addChild(torus);
}

function initListeners() {
    feng3d.ticker.onframe(onEnterFrame);
}

function onEnterFrame() {
    feng3d.reactive(light1.transform.rotation).x = 30;
    feng3d.reactive(light1.transform.rotation).y++;
}

