import { Camera, Color4, ColorMaterial, CubeGeometry, CustomGeometry, GameObject, Matrix4x4, PlaneGeometry, reactive, Renderable, Scene, SphereGeometry, Vector3, View } from 'feng3d';
const sceneGameObject = new GameObject(); sceneGameObject.name = "Untitled";
const scene = sceneGameObject.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraGameObject = new GameObject(); cameraGameObject.name = "Main Camera";
const camera = cameraGameObject.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const gameobject = new GameObject();
const model = gameobject.addComponent(Renderable);

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

reactive(gameobject.transform.position).z = 3;
reactive(gameobject.transform.position).y = -1;
scene.gameObject.addChild(gameobject);

//初始化颜色材质
model.material = new ColorMaterial();
const colorUniforms = model.material as ColorMaterial;

//变化旋转与颜色
setInterval(() => {
    reactive(gameobject.transform.rotation).y += 1;
}, 15);
setInterval(() => {
    colorUniforms.uniforms.u_diffuseInput.fromUnit(Math.random() * (1 << 32 - 1));
}, 1000);
