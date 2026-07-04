import { Camera, Color4, Object3D, LookAtController, mathUtil, reactive, Scene, Vector3, View, object3DLogic, createPrimitive } from 'feng3d';
const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
const scene = new Scene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
const camera = new Camera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(camera.object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
object3DLogic(scene.object3D).addChild(camera.object3D);

const engine = new View(null, scene, camera);

const cube = createPrimitive("Cube");
object3DLogic(scene.object3D).addChild(cube);

const plane = createPrimitive("Plane");
{ const _r = reactive(plane.position); _r.x = 1.50; _r.y = 0; _r.z = 0; }
reactive(plane.rotation).x = -90;
{ const _r = reactive(plane.scale); _r.x = 0.1; _r.y = 0.1; _r.z = 0.1; }
object3DLogic(scene.object3D).addChild(plane);

const sphere = createPrimitive("Sphere");
{ const _r = reactive(sphere.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
object3DLogic(scene.object3D).addChild(sphere);

const capsule = createPrimitive("Capsule");
{ const _r = reactive(capsule.position); _r.x = 3; _r.y = 0; _r.z = 0; }
object3DLogic(scene.object3D).addChild(capsule);

const cylinder = createPrimitive("Cylinder");
{ const _r = reactive(cylinder.position); _r.x = -3; _r.y = 0; _r.z = 0; }
object3DLogic(scene.object3D).addChild(cylinder);

const controller = new LookAtController(camera.object3D);
controller.lookAtPosition = new Vector3();
//
setInterval(() => {
    const time = new Date().getTime();
    let angle = (Math.round(time / 17) % 360);
    angle = angle * mathUtil.DEG2RAD;
    { const _r = reactive(camera.object3D.position); _r.x = 10 * Math.sin(angle); _r.y = 0; _r.z = 10 * Math.cos(angle); }

    controller.update();
}, 17);
