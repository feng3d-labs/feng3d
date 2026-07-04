import { Object3D, batchRun, Camera, Color4, FPSController, reactive, Scene, transformLogic, Vector3, View, object3DLogic, createPrimitive, cameraLogic, sceneLogic, createObject3D} from 'feng3d';

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3) {
    const m = transformLogic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
object3DLogic(sceneObject3D);
const scene = new Scene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
object3DLogic(cameraObject3D);
const camera = new Camera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, scene, camera);

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
{ const c = new FPSController(); reactive(cameraLogic(camera).object3D).components.push(c); }
