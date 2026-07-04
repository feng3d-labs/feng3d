import { Camera, Color4, FPSController, GameObject, reactive, Scene, serialization, transformLogic, Vector3, View } from 'feng3d';
const scene = serialization.setValue(new GameObject(), { name: "Untitled" }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: "Main Camera" }).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const cube = GameObject.createPrimitive("Cube");
scene.gameObject.addChild(cube);

const sphere = GameObject.createPrimitive("Sphere");
{ const _r = reactive(sphere.transform.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
scene.gameObject.addChild(sphere);

const capsule = GameObject.createPrimitive("Capsule");
{ const _r = reactive(capsule.transform.position); _r.x = 3; _r.y = 0; _r.z = 0; }
scene.gameObject.addChild(capsule);

const cylinder = GameObject.createPrimitive("Cylinder");
{ const _r = reactive(cylinder.transform.position); _r.x = -3; _r.y = 0; _r.z = 0; }
scene.gameObject.addChild(cylinder);

reactive(camera.transform.position).z = -5;
transformLogic(camera.transform).lookAt(new Vector3());
//
camera.gameObject.addComponent(FPSController);
