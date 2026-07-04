import { batchRun, Camera, Color4, FPSController, Object3D, reactive, Scene, transformLogic, Transform, Vector3, View, object3DLogic, createPrimitive } from 'feng3d';

function lookAtTransform(t: Transform, target: Vector3, upAxis?: Vector3) {
    const m = transformLogic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
const scene = object3DLogic(sceneObject3D).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
const camera = object3DLogic(cameraObject3D).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
object3DLogic(scene.object3D).addChild(camera.object3D);

const engine = new View(null, scene, camera);

const cube = createPrimitive("Cube");
object3DLogic(scene.object3D).addChild(cube);

const sphere = createPrimitive("Sphere");
{ const _r = reactive(sphere.transform.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
object3DLogic(scene.object3D).addChild(sphere);

const capsule = createPrimitive("Capsule");
{ const _r = reactive(capsule.transform.position); _r.x = 3; _r.y = 0; _r.z = 0; }
object3DLogic(scene.object3D).addChild(capsule);

const cylinder = createPrimitive("Cylinder");
{ const _r = reactive(cylinder.transform.position); _r.x = -3; _r.y = 0; _r.z = 0; }
object3DLogic(scene.object3D).addChild(cylinder);

reactive(camera.transform.position).z = -5;
lookAtTransform(camera.transform, new Vector3());
//
object3DLogic(camera.object3D).addComponent(FPSController);
