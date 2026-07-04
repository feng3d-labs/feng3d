import { Camera, Color4, Object3D, PointGeometry, PointMaterial, reactive, Renderable, Scene, Vector3, View } from 'feng3d';
const sceneObject3D = new Object3D(); sceneObject3D.name = "Untitled";
const scene = sceneObject3D.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); cameraObject3D.name = "Main Camera";
const camera = cameraObject3D.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.object3D.addChild(camera.object3D);

const engine = new View(null, scene, camera);

const pointGeometry = new PointGeometry();
const pointMaterial = new PointMaterial();
const object3D = new Object3D(); object3D.name = "plane";
const model = object3D.addComponent(Renderable);
model.geometry = pointGeometry;
model.material = pointMaterial;
reactive(object3D.transform.position).z = 3;
scene.object3D.addChild(object3D);

const length = 200;
const height = 2 / Math.PI;
for (let x = -length; x <= length; x = x + 4) {
    const angle = x / length * Math.PI;
    const vec = new Vector3(x / 100, Math.sin(angle) * height, 0);
    pointGeometry.points.push({ position: vec });
}

//变化旋转
setInterval(() => {
    reactive(object3D.transform.rotation).y += 1;
}, 15);
