import { Camera, Color4, GameObject, LookAtController, mathUtil, reactive, Scene, Vector3, View } from 'feng3d';
const sceneGameObject = new GameObject(); sceneGameObject.name = "Untitled";
const scene = sceneGameObject.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraGameObject = new GameObject(); cameraGameObject.name = "Main Camera";
const camera = cameraGameObject.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const cube = GameObject.createPrimitive("Cube");
scene.gameObject.addChild(cube);

const plane = GameObject.createPrimitive("Plane");
{ const _r = reactive(plane.transform.position); _r.x = 1.50; _r.y = 0; _r.z = 0; }
reactive(plane.transform.rotation).x = -90;
{ const _r = reactive(plane.transform.scale); _r.x = 0.1; _r.y = 0.1; _r.z = 0.1; }
scene.gameObject.addChild(plane);

const sphere = GameObject.createPrimitive("Sphere");
{ const _r = reactive(sphere.transform.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
scene.gameObject.addChild(sphere);

const capsule = GameObject.createPrimitive("Capsule");
{ const _r = reactive(capsule.transform.position); _r.x = 3; _r.y = 0; _r.z = 0; }
scene.gameObject.addChild(capsule);

const cylinder = GameObject.createPrimitive("Cylinder");
{ const _r = reactive(cylinder.transform.position); _r.x = -3; _r.y = 0; _r.z = 0; }
scene.gameObject.addChild(cylinder);

const controller = new LookAtController(camera.gameObject);
controller.lookAtPosition = new Vector3();
//
setInterval(() => {
    const time = new Date().getTime();
    let angle = (Math.round(time / 17) % 360);
    angle = angle * mathUtil.DEG2RAD;
    { const _r = reactive(camera.transform.position); _r.x = 10 * Math.sin(angle); _r.y = 0; _r.z = 10 * Math.cos(angle); }

    controller.update();
}, 17);
