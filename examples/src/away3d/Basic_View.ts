import { Camera, Color4, FPSController, Object3D, reactive, Scene, transformLogic, Vector3, View } from 'feng3d';
const sceneObject3D = new Object3D(); sceneObject3D.name = "Untitled";
const scene = sceneObject3D.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); cameraObject3D.name = "Main Camera";
const camera = cameraObject3D.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.object3D.addChild(camera.object3D);

const engine = new View(null, scene, camera);

const cube = Object3D.createPrimitive("Cube");
scene.object3D.addChild(cube);

const sphere = Object3D.createPrimitive("Sphere");
{ const _r = reactive(sphere.transform.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
scene.object3D.addChild(sphere);

const capsule = Object3D.createPrimitive("Capsule");
{ const _r = reactive(capsule.transform.position); _r.x = 3; _r.y = 0; _r.z = 0; }
scene.object3D.addChild(capsule);

const cylinder = Object3D.createPrimitive("Cylinder");
{ const _r = reactive(cylinder.transform.position); _r.x = -3; _r.y = 0; _r.z = 0; }
scene.object3D.addChild(cylinder);

reactive(camera.transform.position).z = -5;
transformLogic(camera.transform).lookAt(new Vector3());
//
camera.object3D.addComponent(FPSController);
