import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
{ const _r = feng3d.reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

const cube = feng3d.GameObject.createPrimitive("Cube");
scene.gameObject.addChild(cube);

const plane = feng3d.GameObject.createPrimitive("Plane");
{ const _r = feng3d.reactive(plane.transform.position); _r.x = 1.50; _r.y = 0; _r.z = 0; }
feng3d.reactive(plane.transform.rotation).x = -90;
{ const _r = feng3d.reactive(plane.transform.scale); _r.x = 0.1; _r.y = 0.1; _r.z = 0.1; }
scene.gameObject.addChild(plane);

const sphere = feng3d.GameObject.createPrimitive("Sphere");
{ const _r = feng3d.reactive(sphere.transform.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
scene.gameObject.addChild(sphere);

const capsule = feng3d.GameObject.createPrimitive("Capsule");
{ const _r = feng3d.reactive(capsule.transform.position); _r.x = 3; _r.y = 0; _r.z = 0; }
scene.gameObject.addChild(capsule);

const cylinder = feng3d.GameObject.createPrimitive("Cylinder");
{ const _r = feng3d.reactive(cylinder.transform.position); _r.x = -3; _r.y = 0; _r.z = 0; }
scene.gameObject.addChild(cylinder);

const controller = new feng3d.LookAtController(camera.gameObject);
controller.lookAtPosition = new feng3d.Vector3();
//
setInterval(() => {
    const time = new Date().getTime();
    let angle = (Math.round(time / 17) % 360);
    angle = angle * feng3d.mathUtil.DEG2RAD;
    { const _r = feng3d.reactive(camera.transform.position); _r.x = 10 * Math.sin(angle); _r.y = 0; _r.z = 10 * Math.cos(angle); }

    controller.update();
}, 17);

