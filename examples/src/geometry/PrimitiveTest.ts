import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, LookAtController, mathUtil } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const cube = GameObject.createPrimitive('Cube');
scene.gameObject.addChild(cube);

const plane = GameObject.createPrimitive('Plane');
plane.transform.position = new Vector3(1.50, 0, 0);
plane.transform.rx = -90;
plane.transform.scale.set(0.1, 0.1, 0.1);
scene.gameObject.addChild(plane);

const sphere = GameObject.createPrimitive('Sphere');
sphere.transform.position = new Vector3(-1.50, 0, 0);
scene.gameObject.addChild(sphere);

const capsule = GameObject.createPrimitive('Capsule');
capsule.transform.position = new Vector3(3, 0, 0);
scene.gameObject.addChild(capsule);

const cylinder = GameObject.createPrimitive('Cylinder');
cylinder.transform.position = new Vector3(-3, 0, 0);
scene.gameObject.addChild(cylinder);

const controller = new LookAtController(camera.gameObject);
controller.lookAtPosition = new Vector3();
//
setInterval(() =>
{
    const time = new Date().getTime();
    let angle = (Math.round(time / 17) % 360);
    angle = angle * mathUtil.DEG2RAD;
    camera.transform.position = new Vector3(10 * Math.sin(angle), 0, 10 * Math.cos(angle));

    controller.update();
}, 17);
