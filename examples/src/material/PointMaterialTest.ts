import { Camera, Object3D, PointGeometry, PointMaterial, createPointMaterial, reactive, Renderable, Scene, Vector3, View, logic, createObject3D, createCamera, createScene, createMeshRenderer, createPointGeometry} from 'feng3d';
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
reactive(scene).background = { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 };

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive((logic(camera).entity).position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(logic(scene).entity).children.push(logic(camera).entity);

const engine = new View(null, sceneObject3D);

const pointGeometry = createPointGeometry();
const pointMaterial = createPointMaterial();
const object3D = createObject3D(); reactive(object3D).name = "plane";
const model = createMeshRenderer(); reactive(object3D).components.push(model);
reactive(model).geometry = pointGeometry;
reactive(model).material = pointMaterial;
reactive(object3D.position).z = 3;
reactive(logic(scene).entity).children.push(object3D);

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
