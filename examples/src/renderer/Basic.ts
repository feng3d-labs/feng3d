import { Camera, Color4, Object3D, LookAtController, mathUtil, reactive, Scene, Vector3, View, logic, createPrimitive, cameraLogic, sceneLogic, createObject3D} from 'feng3d';
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
logic(sceneObject3D);
const scene = new Scene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = new Camera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, scene, camera);

const cube = createPrimitive("Cube");
reactive(sceneLogic(scene).object3D).children.push(cube);

const plane = createPrimitive("Plane");
{ const _r = reactive(plane.position); _r.x = 1.50; _r.y = 0; _r.z = 0; }
reactive(plane.rotation).x = -90;
{ const _r = reactive(plane.scale); _r.x = 0.1; _r.y = 0.1; _r.z = 0.1; }
reactive(sceneLogic(scene).object3D).children.push(plane);

const sphere = createPrimitive("Sphere");
{ const _r = reactive(sphere.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
reactive(sceneLogic(scene).object3D).children.push(sphere);

const capsule = createPrimitive("Capsule");
{ const _r = reactive(capsule.position); _r.x = 3; _r.y = 0; _r.z = 0; }
reactive(sceneLogic(scene).object3D).children.push(capsule);

const cylinder = createPrimitive("Cylinder");
{ const _r = reactive(cylinder.position); _r.x = -3; _r.y = 0; _r.z = 0; }
reactive(sceneLogic(scene).object3D).children.push(cylinder);

const controller = new LookAtController(cameraLogic(camera).object3D);
controller.lookAtPosition = new Vector3();
//
setInterval(() => {
    const time = new Date().getTime();
    let angle = (Math.round(time / 17) % 360);
    angle = angle * mathUtil.DEG2RAD;
    { const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 10 * Math.sin(angle); _r.y = 0; _r.z = 10 * Math.cos(angle); }

    controller.update();
}, 17);
