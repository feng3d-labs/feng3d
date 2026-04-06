import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, Material, FPSController, DirectionalLight, Renderable, Geometry, PlaneGeometry, SphereGeometry, CubeGeometry, TorusGeometry, ticker } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

let planeMaterial: Material;
let sphereMaterial: Material;
let cubeMaterial: Material;
let torusMaterial: Material;
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

function initEngine()
{
    camera.transform.y = 5;
    camera.transform.z = -10;
    camera.transform.lookAt(new Vector3());
    camera.gameObject.addComponent(FPSController);
}

function initMaterials()
{
    planeMaterial = serialization.setValue(new Material(), {
        shaderName: 'standard', uniforms: {
            s_diffuse: { __class__: 'Texture2D', source: { url: '../../resources/floor_diffuse.jpg' } },
            s_normal: { __class__: 'Texture2D', source: { url: '../../resources/floor_normal.jpg' } },
            s_specular: { __class__: 'Texture2D', source: { url: '../../resources/floor_specular.jpg' } },
        }
    });
    sphereMaterial = serialization.setValue(new Material(), {
        shaderName: 'standard', uniforms: {
            s_diffuse: { __class__: 'Texture2D', source: { url: '../../resources/beachball_diffuse.jpg' } },
            s_specular: { __class__: 'Texture2D', source: { url: '../../resources/beachball_specular.jpg' } },
        }
    });
    cubeMaterial = serialization.setValue(new Material(), {
        shaderName: 'standard', uniforms: {
            s_diffuse: { __class__: 'Texture2D', source: { url: '../../resources/trinket_diffuse.jpg' } },
            s_normal: { __class__: 'Texture2D', source: { url: '../../resources/trinket_normal.jpg' } },
            s_specular: { __class__: 'Texture2D', source: { url: '../../resources/trinket_specular.jpg' } },
        }
    });
    torusMaterial = serialization.setValue(new Material(), {
        shaderName: 'standard', uniforms: {
            s_diffuse: { __class__: 'Texture2D', source: { url: '../../resources/weave_diffuse.jpg' } },
            s_normal: { __class__: 'Texture2D', source: { url: '../../resources/weave_normal.jpg' } },
        }
    });
}

function initLights()
{
    scene.ambientColor.a = 0.2;

    light1 = new GameObject();
    let directionalLight = light1.addComponent(DirectionalLight);
    directionalLight.intensity = 0.7;
    light1.transform.rx = 90;
    scene.gameObject.addChild(light1);

    light2 = new GameObject();
    directionalLight = light2.addComponent(DirectionalLight);
    directionalLight.color.fromUnit(0x00FFFF);
    directionalLight.intensity = 0.7;
    light2.transform.rx = 90;
    scene.gameObject.addChild(light2);
}

function initObjects()
{
    plane = new GameObject();
    let model = plane.addComponent(Renderable);
    let geometry: Geometry = model.geometry = serialization.setValue(new PlaneGeometry(), { width: 10, height: 10 });
    model.material = planeMaterial;
    geometry.scaleU = 2;
    geometry.scaleV = 2;
    plane.transform.y = -0.20;
    scene.gameObject.addChild(plane);
    sphere = new GameObject();
    model = sphere.addComponent(Renderable);
    model.geometry = serialization.setValue(new SphereGeometry(), { radius: 1.50, segmentsW: 40, segmentsH: 20 });
    model.material = sphereMaterial;
    sphere.transform.x = 3;
    sphere.transform.y = 1.60;
    sphere.transform.z = 3.00;
    scene.gameObject.addChild(sphere);
    cube = new GameObject();
    model = cube.addComponent(Renderable);
    model.geometry = serialization.setValue(new CubeGeometry(), { width: 2, height: 2, depth: 2, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
    model.material = cubeMaterial;
    cube.transform.x = 3.00;
    cube.transform.y = 1.60;
    cube.transform.z = -2.50;
    scene.gameObject.addChild(cube);
    torus = new GameObject();
    model = torus.addComponent(Renderable);
    geometry = model.geometry = serialization.setValue(new TorusGeometry(), { radius: 1.50, tubeRadius: 0.60, segmentsR: 40, segmentsT: 20 });
    model.material = torusMaterial;
    geometry.scaleU = 10;
    geometry.scaleV = 5;
    torus.transform.x = -2.50;
    torus.transform.y = 1.60;
    torus.transform.z = -2.50;
    scene.gameObject.addChild(torus);
}

function initListeners()
{
    ticker.onframe(onEnterFrame, this);
}

function onEnterFrame()
{
    light1.transform.rx = 30;
    light1.transform.ry++;
}
