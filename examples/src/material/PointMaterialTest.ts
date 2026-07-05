import { Camera, Color4, Object3D, PointGeometry, PointMaterial, createPointMaterial, reactive, Renderable, Scene, Vector3, View, logic, cameraLogic, sceneLogic, createObject3D, createCamera, createScene, createRenderable} from 'feng3d';
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, sceneObject3D);

const pointGeometry = new PointGeometry();
const pointMaterial = createPointMaterial();
const object3D = createObject3D(); reactive(object3D).name = "plane";
const model = createRenderable(); reactive(object3D).components.push(model);
model.geometry = pointGeometry;
model.material = pointMaterial;
reactive(object3D.position).z = 3;
reactive(sceneLogic(scene).object3D).children.push(object3D);

const length = 200;
const height = 2 / Math.PI;
for (let x = -length; x <= length; x = x + 4) {
    const angle = x / length * Math.PI;
    const vec = new Vector3(x / 100, Math.sin(angle) * height, 0);
    pointGeometry.points.push({ position: vec });
}

//变化旋转
setInterval(() => {
    reactive(object3D.rotation).y += 1;
}, 15);
