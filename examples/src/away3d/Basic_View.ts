import { Object3D, batchRun, Camera, FPSController, reactive, Scene, logic, Vector3, View, createPrimitive, cameraLogic, sceneLogic, createObject3D, createCamera, createScene, createFPSController } from 'feng3d';

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3) {
    const m = logic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
reactive(scene).background = { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 };

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, sceneObject3D);

const cube = createPrimitive("Cube");
reactive(sceneLogic(scene).object3D).children.push(cube);

const sphere = createPrimitive("Sphere");
{ const _r = reactive(sphere.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
reactive(sceneLogic(scene).object3D).children.push(sphere);

const capsule = createPrimitive("Capsule");
{ const _r = reactive(capsule.position); _r.x = 3; _r.y = 0; _r.z = 0; }
reactive(sceneLogic(scene).object3D).children.push(capsule);

const cylinder = createPrimitive("Cylinder");
{ const _r = reactive(cylinder.position); _r.x = -3; _r.y = 0; _r.z = 0; }
reactive(sceneLogic(scene).object3D).children.push(cylinder);

reactive(cameraLogic(camera).object3D.position).z = -5;
lookAtTransform(cameraLogic(camera).object3D, new Vector3());
//
{ const c = createFPSController(); reactive(cameraLogic(camera).object3D).components.push(c); }
