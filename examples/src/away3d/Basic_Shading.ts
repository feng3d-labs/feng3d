import { $set, Color4, CubeGeometry, Geometry, Material, Node3D, PlaneGeometry, SphereGeometry, StandardMaterial, ticker, TorusGeometry, Vector3 } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.entity.addChild(camera.entity);

let planeMaterial: Material;
let sphereMaterial: Material;
let cubeMaterial: Material;
let torusMaterial: Material;
let light1: Node3D;
let light2: Node3D;
let plane: Node3D;
let sphere: Node3D;
let cube: Node3D;
let torus: Node3D;

initEngine();
initLights();
initMaterials();
initObjects();
initListeners();

function initEngine()
{
    camera.entity.y = 5;
    camera.entity.z = -10;
    camera.entity.lookAt(new Vector3());
    camera.entity.addComponent('FPSController3D');
}

function initMaterials()
{
    planeMaterial = new StandardMaterial().init({
        uniforms: {
            s_diffuse: { __class__: 'LoadImageTexture2D', url: '../../floor_diffuse.jpg' },
            s_normal: { __class__: 'LoadImageTexture2D', url: '../../floor_normal.jpg' },
            s_specular: { __class__: 'LoadImageTexture2D', url: '../../floor_specular.jpg' },
        }
    });
    sphereMaterial = new StandardMaterial().init({
        uniforms: {
            s_diffuse: { __class__: 'LoadImageTexture2D', url: '../../beachball_diffuse.jpg' },
            s_specular: { __class__: 'LoadImageTexture2D', url: '../../beachball_specular.jpg' },
        }
    });
    cubeMaterial = new StandardMaterial().init({
        uniforms: {
            s_diffuse: { __class__: 'LoadImageTexture2D', url: '../../trinket_diffuse.jpg' },
            s_normal: { __class__: 'LoadImageTexture2D', url: '../../trinket_normal.jpg' },
            s_specular: { __class__: 'LoadImageTexture2D', url: '../../trinket_specular.jpg' },
        }
    });
    torusMaterial = new StandardMaterial().init({
        uniforms: {
            s_diffuse: { __class__: 'LoadImageTexture2D', url: '../../weave_diffuse.jpg' },
            s_normal: { __class__: 'LoadImageTexture2D', url: '../../weave_normal.jpg' },
            s_specular: { __class__: 'LoadImageTexture2D', url: '../../weave_diffuse.jpg' },
        }
    });
}

function initLights()
{
    scene.ambientColor.a = 0.2;

    light1 = new Node3D();
    let directionalLight = light1.addComponent('DirectionalLight3D');
    directionalLight.intensity = 0.7;
    light1.rx = 90;
    scene.entity.addChild(light1);

    light2 = new Node3D();
    directionalLight = light2.addComponent('DirectionalLight3D');
    directionalLight.color.fromUnit(0x00FFFF);
    directionalLight.intensity = 0.7;
    light2.rx = 90;
    scene.entity.addChild(light2);
}

function initObjects()
{
    plane = new Node3D();
    let model = plane.addComponent('Mesh3D');
    let geometry: Geometry = model.geometry = $set(new PlaneGeometry(), { width: 10, height: 10 });
    model.material = planeMaterial;
    geometry.scaleU = 2;
    geometry.scaleV = 2;
    plane.y = -0.20;
    scene.entity.addChild(plane);
    sphere = new Node3D();
    model = sphere.addComponent('Mesh3D');
    model.geometry = $set(new SphereGeometry(), { radius: 1.50, segmentsW: 40, segmentsH: 20 });
    model.material = sphereMaterial;
    sphere.x = 3;
    sphere.y = 1.60;
    sphere.z = 3.00;
    scene.entity.addChild(sphere);
    cube = new Node3D();
    model = cube.addComponent('Mesh3D');
    model.geometry = $set(new CubeGeometry(), { width: 2, height: 2, depth: 2, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
    model.material = cubeMaterial;
    cube.x = 3.00;
    cube.y = 1.60;
    cube.z = -2.50;
    scene.entity.addChild(cube);
    torus = new Node3D();
    model = torus.addComponent('Mesh3D');
    geometry = model.geometry = $set(new TorusGeometry(), { radius: 1.50, tubeRadius: 0.60, segmentsR: 40, segmentsT: 20 });
    model.material = torusMaterial;
    geometry.scaleU = 10;
    geometry.scaleV = 5;
    torus.x = -2.50;
    torus.y = 1.60;
    torus.z = -2.50;
    scene.entity.addChild(torus);
}

function initListeners()
{
    ticker.onFrame(onEnterFrame, this);
}

function onEnterFrame()
{
    light1.rx = 30;
    light1.ry++;
}
