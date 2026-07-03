import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
camera.transform.position = new feng3d.Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);
var canvas = engine.canvas;

const cubeTexture = feng3d.serialization.setValue(new feng3d.TextureCube(), {
    urls: [
        '/skybox/snow_positive_x.jpg',
        '/skybox/snow_positive_y.jpg',
        '/skybox/snow_positive_z.jpg',
        '/skybox/snow_negative_x.jpg',
        '/skybox/snow_negative_y.jpg',
        '/skybox/snow_negative_z.jpg',
    ]
});

const skybox = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "skybox" });
const skyboxComponent = skybox.addComponent(feng3d.SkyBox);
skyboxComponent.s_skyboxTexture = cubeTexture;
scene.gameObject.addChild(skybox);

camera.transform.z = -6;
camera.transform.lookAt(new feng3d.Vector3());
camera.lens = new feng3d.PerspectiveLens(90);

const torusMaterial = new feng3d.StandardMaterial();
torusMaterial.s_envMap = cubeTexture;
torusMaterial.uniforms.u_ambient.fromUnit(0x111111);
torusMaterial.uniforms.u_ambient.a = 0.25;

const torus = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "torus" });
const model = torus.addComponent(feng3d.Renderable);
model.geometry = feng3d.serialization.setValue(new feng3d.TorusGeometry(), { radius: 1.50, tubeRadius: 0.60, segmentsR: 40, segmentsT: 20 });
model.material = torusMaterial;
scene.gameObject.addChild(torus);

feng3d.ticker.onframe(() => {
    torus.transform.rx += 2;
    torus.transform.ry += 1;
    camera.transform.position = new feng3d.Vector3(0, 0, 0);
    camera.transform.ry += 0.5 * (feng3d.windowEventProxy.clientX - canvas.clientLeft - canvas.clientWidth / 2) / 800;
    camera.transform.moveBackward(6);
});

