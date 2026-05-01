import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
camera.transform.position = new feng3d.Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

const cube = feng3d.GameObject.createPrimitive("Cube");
scene.gameObject.addChild(cube);

const plane = feng3d.GameObject.createPrimitive("Plane");
plane.transform.position = new feng3d.Vector3(1.50, 0, 0);
plane.transform.rx = -90;
plane.transform.scale.set(0.1, 0.1, 0.1);
scene.gameObject.addChild(plane);

const sphere = feng3d.GameObject.createPrimitive("Sphere");
sphere.transform.position = new feng3d.Vector3(-1.50, 0, 0);
scene.gameObject.addChild(sphere);

const capsule = feng3d.GameObject.createPrimitive("Capsule");
capsule.transform.position = new feng3d.Vector3(3, 0, 0);
scene.gameObject.addChild(capsule);

const cylinder = feng3d.GameObject.createPrimitive("Cylinder");
cylinder.transform.position = new feng3d.Vector3(-3, 0, 0);
scene.gameObject.addChild(cylinder);

const controller = new feng3d.LookAtController(camera.gameObject);
controller.lookAtPosition = new feng3d.Vector3();
//
setInterval(() => {
    const time = new Date().getTime();
    let angle = (Math.round(time / 17) % 360);
    angle = angle * feng3d.mathUtil.DEG2RAD;
    camera.transform.position = new feng3d.Vector3(10 * Math.sin(angle), 0, 10 * Math.cos(angle));

    controller.update();
}, 17);

