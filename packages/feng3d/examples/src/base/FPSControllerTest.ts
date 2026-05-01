import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
camera.transform.position = new feng3d.Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

const cube = feng3d.GameObject.createPrimitive("Cube");
scene.gameObject.addChild(cube);

const sphere = feng3d.GameObject.createPrimitive("Sphere");
sphere.transform.position = new feng3d.Vector3(-1.50, 0, 0);
scene.gameObject.addChild(sphere);

const capsule = feng3d.GameObject.createPrimitive("Capsule");
capsule.transform.position = new feng3d.Vector3(3, 0, 0);
scene.gameObject.addChild(capsule);

const cylinder = feng3d.GameObject.createPrimitive("Cylinder");
cylinder.transform.position = new feng3d.Vector3(-3, 0, 0);
scene.gameObject.addChild(cylinder);

camera.transform.z = -5;
camera.transform.lookAt(new feng3d.Vector3());
//
camera.gameObject.addComponent(feng3d.FPSController);

