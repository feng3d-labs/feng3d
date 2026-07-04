import { Camera, Color4, ColorMaterial, CubeGeometry, CustomGeometry, Object3D, Matrix4x4, PlaneGeometry, reactive, Renderable, Scene, SphereGeometry, Vector3, View, object3DLogic } from 'feng3d';
const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
const scene = new Scene(); reactive(sceneObject3D).components.push(scene); scene.setObject3D(sceneObject3D); scene.init();
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
const camera = new Camera(); reactive(cameraObject3D).components.push(camera); camera.setObject3D(cameraObject3D); camera.init();
{ const _r = reactive(camera.object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
object3DLogic(scene.object3D).addChild(camera.object3D);

const engine = new View(null, scene, camera);

const object3D = new Object3D();
const model = new Renderable(); reactive(object3D).components.push(model); model.setObject3D(object3D); model.init();

const geometry = model.geometry = new CustomGeometry();
geometry.addGeometry(new PlaneGeometry());
const matrix = new Matrix4x4();
matrix.appendTranslation(0, 0.50, 0);
const sphereGeo = new SphereGeometry(); sphereGeo.radius = 50;
geometry.addGeometry(sphereGeo, matrix);

matrix.appendTranslation(0, 0.50, 0);
const addGeometry = new CubeGeometry();
geometry.addGeometry(addGeometry, matrix);

addGeometry.width = 0.50;
matrix.appendTranslation(0, 0.50, 0);
matrix.appendRotation(Vector3.Z_AXIS, 45);
geometry.addGeometry(addGeometry, matrix);

reactive(object3D.position).z = 3;
reactive(object3D.position).y = -1;
object3DLogic(scene.object3D).addChild(object3D);

//初始化颜色材质
model.material = new ColorMaterial();
const colorUniforms = model.material as ColorMaterial;

//变化旋转与颜色
setInterval(() => {
    reactive(object3D.rotation).y += 1;
}, 15);
setInterval(() => {
    colorUniforms.uniforms.u_diffuseInput.fromUnit(Math.random() * (1 << 32 - 1));
}, 1000);
