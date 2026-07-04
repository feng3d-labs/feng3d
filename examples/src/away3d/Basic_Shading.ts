import { Camera, Color4, CubeGeometry, DirectionalLight, FPSController, GameObject, Geometry, PlaneGeometry, reactive, Renderable, Scene, serialization, SphereGeometry, StandardMaterial, ticker, transformLogic, TorusGeometry, Vector3, View } from 'feng3d';
const scene = serialization.setValue(new GameObject(), { name: "Untitled" }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: "Main Camera" }).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

let planeMaterial: StandardMaterial;
let sphereMaterial: StandardMaterial;
let cubeMaterial: StandardMaterial;
let torusMaterial: StandardMaterial;
let light1: GameObject;
let light2: GameObject;
let plane: GameObject;
let sphere: GameObject;
let cube: GameObject;
let torus: GameObject;

initEngine();
initLights();
initMaterials();
initObjects();
initListeners();

function initEngine() {
    reactive(camera.transform.position).y = 5;
    reactive(camera.transform.position).z = -10;
    transformLogic(camera.transform).lookAt(new Vector3());
    camera.gameObject.addComponent(FPSController);
}

function initMaterials() {
    planeMaterial = serialization.setValue(new StandardMaterial(), {
        s_diffuse: { __class__: "Texture2D", source: { url: "/floor_diffuse.jpg" } },
        s_normal: { __class__: "Texture2D", source: { url: "/floor_normal.jpg" } },
        s_specular: { __class__: "Texture2D", source: { url: "/floor_specular.jpg" } },
    } as any);
    sphereMaterial = serialization.setValue(new StandardMaterial(), {
        s_diffuse: { __class__: "Texture2D", source: { url: "/beachball_diffuse.jpg" } },
        s_specular: { __class__: "Texture2D", source: { url: "/beachball_specular.jpg" } },
    } as any);
    cubeMaterial = serialization.setValue(new StandardMaterial(), {
        s_diffuse: { __class__: "Texture2D", source: { url: "/trinket_diffuse.jpg" } },
        s_normal: { __class__: "Texture2D", source: { url: "/trinket_normal.jpg" } },
        s_specular: { __class__: "Texture2D", source: { url: "/trinket_specular.jpg" } },
    } as any);
    torusMaterial = serialization.setValue(new StandardMaterial(), {
        s_diffuse: { __class__: "Texture2D", source: { url: "/weave_diffuse.jpg" } },
        s_normal: { __class__: "Texture2D", source: { url: "/weave_normal.jpg" } },
        s_specular: { __class__: "Texture2D", source: { url: "/weave_diffuse.jpg" } },
    } as any);
}

function initLights() {
    scene.ambientColor.a = 0.2;

    light1 = new GameObject();
    const directionalLight = light1.addComponent(DirectionalLight);
    directionalLight.intensity = 0.7;
    reactive(light1.transform.rotation).x = 90;
    scene.gameObject.addChild(light1);

    light2 = new GameObject();
    const directionalLight2 = light2.addComponent(DirectionalLight);
    directionalLight2.color.fromUnit(0x00FFFF);
    directionalLight2.intensity = 0.7;
    reactive(light2.transform.rotation).x = 90;
    scene.gameObject.addChild(light2);
}

function initObjects() {
    plane = new GameObject();
    const planeModel = plane.addComponent(Renderable);
    const planeGeometry: Geometry = planeModel.geometry = serialization.setValue(new PlaneGeometry(), { width: 10, height: 10 });
    planeModel.material = planeMaterial;
    planeGeometry.scaleU = 2;
    planeGeometry.scaleV = 2;
    reactive(plane.transform.position).y = -0.20;
    scene.gameObject.addChild(plane);

    sphere = new GameObject();
    const sphereModel = sphere.addComponent(Renderable);
    sphereModel.geometry = serialization.setValue(new SphereGeometry(), { radius: 1.50, segmentsW: 40, segmentsH: 20 });
    sphereModel.material = sphereMaterial;
    reactive(sphere.transform.position).x = 3;
    reactive(sphere.transform.position).y = 1.60;
    reactive(sphere.transform.position).z = 3.00;
    scene.gameObject.addChild(sphere);

    cube = new GameObject();
    const cubeModel = cube.addComponent(Renderable);
    cubeModel.geometry = serialization.setValue(new CubeGeometry(), { width: 2, height: 2, depth: 2, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
    cubeModel.material = cubeMaterial;
    reactive(cube.transform.position).x = 3.00;
    reactive(cube.transform.position).y = 1.60;
    reactive(cube.transform.position).z = -2.50;
    scene.gameObject.addChild(cube);

    torus = new GameObject();
    const torusModel = torus.addComponent(Renderable);
    const torusGeometry = torusModel.geometry = serialization.setValue(new TorusGeometry(), { radius: 1.50, tubeRadius: 0.60, segmentsR: 40, segmentsT: 20 });
    torusModel.material = torusMaterial;
    torusGeometry.scaleU = 10;
    torusGeometry.scaleV = 5;
    reactive(torus.transform.position).x = -2.50;
    reactive(torus.transform.position).y = 1.60;
    reactive(torus.transform.position).z = -2.50;
    scene.gameObject.addChild(torus);
}

function initListeners() {
    ticker.onframe(onEnterFrame);
}

function onEnterFrame() {
    reactive(light1.transform.rotation).x = 30;
    reactive(light1.transform.rotation).y++;
}
