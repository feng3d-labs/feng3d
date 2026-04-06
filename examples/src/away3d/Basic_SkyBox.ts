import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, TextureCube, SkyBox, PerspectiveLens, Material, StandardUniforms, Renderable, TorusGeometry, ticker, windowEventProxy } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);
const canvas = engine.canvas;

const cubeTexture = serialization.setValue(new TextureCube(), {
    rawData: {
        type: 'path', paths: [
            '../../resources/skybox/snow_positive_x.jpg',
            '../../resources/skybox/snow_positive_y.jpg',
            '../../resources/skybox/snow_positive_z.jpg',
            '../../resources/skybox/snow_negative_x.jpg',
            '../../resources/skybox/snow_negative_y.jpg',
            '../../resources/skybox/snow_negative_z.jpg',
        ]
    }
});

const skybox = serialization.setValue(new GameObject(), { name: 'skybox' });
const skyboxComponent = skybox.addComponent(SkyBox);
skyboxComponent.s_skyboxTexture = cubeTexture;
scene.gameObject.addChild(skybox);

camera.transform.z = -6;
camera.transform.lookAt(new Vector3());
camera.lens = new PerspectiveLens(90);

const torusMaterial = new Material();
const uniforms = torusMaterial.uniforms as StandardUniforms;
uniforms.s_envMap = cubeTexture;
uniforms.u_ambient.fromUnit(0x111111);
uniforms.u_ambient.a = 0.25;

const torus = serialization.setValue(new GameObject(), { name: 'torus' });
const model = torus.addComponent(Renderable);
model.geometry = serialization.setValue(new TorusGeometry(), { radius: 1.50, tubeRadius: 0.60, segmentsR: 40, segmentsT: 20 });
model.material = torusMaterial;
scene.gameObject.addChild(torus);

ticker.onframe(() =>
{
    torus.transform.rx += 2;
    torus.transform.ry += 1;
    camera.transform.position = new Vector3(0, 0, 0);
    camera.transform.ry += 0.5 * (windowEventProxy.clientX - canvas.clientLeft - canvas.clientWidth / 2) / 800;
    camera.transform.moveBackward(6);
});
