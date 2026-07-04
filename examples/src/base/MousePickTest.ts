import { Object3D, batchRun, Camera, Color4, FPSController, reactive, Renderable, Scene, StandardMaterial, transformLogic, Vector3, View, object3DLogic, createPrimitive } from 'feng3d';

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3) {
    const m = transformLogic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
/**
 * 操作方式:鼠标按下后可以使用移动鼠标改变旋转，wasdqe平移
 */
const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
const scene = new Scene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
const camera = new Camera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(camera.object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
object3DLogic(scene.object3D).addChild(camera.object3D);

const engine = new View(null, scene, camera);

reactive(camera.object3D.position).z = -5;
lookAtTransform(camera.transform, new Vector3());
{ const c = new FPSController(); reactive(camera.object3D).components.push(c); }

const cube = createPrimitive("Cube");
reactive(cube).mouseEnabled = true;
(cube.components.find(c => c instanceof Renderable) as Renderable).material = new StandardMaterial();
object3DLogic(scene.object3D).addChild(cube);

const sphere = createPrimitive("Sphere");
{ const _r = reactive(sphere.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
reactive(sphere).mouseEnabled = true;
(sphere.components.find(c => c instanceof Renderable) as Renderable).material = new StandardMaterial();
object3DLogic(scene.object3D).addChild(sphere);

const capsule = createPrimitive("Capsule");
{ const _r = reactive(capsule.position); _r.x = 3; _r.y = 0; _r.z = 0; }
reactive(capsule).mouseEnabled = true;
(capsule.components.find(c => c instanceof Renderable) as Renderable).material = new StandardMaterial();
object3DLogic(scene.object3D).addChild(capsule);

const cylinder = createPrimitive("Cylinder");
{ const _r = reactive(cylinder.position); _r.x = -3; _r.y = 0; _r.z = 0; }
reactive(cylinder).mouseEnabled = true;
(cylinder.components.find(c => c instanceof Renderable) as Renderable).material = new StandardMaterial();
object3DLogic(scene.object3D).addChild(cylinder);

(scene as any).on("click", (event) => {
    const object3D = event.target as Object3D;
    if (object3D.components.find(c => c instanceof Renderable)) {
        const material = (object3D.components.find(c => c instanceof Renderable) as Renderable).material as StandardMaterial;
        material.uniforms.u_diffuse.fromUnit(Math.random() * (1 << 24));
    }
});
