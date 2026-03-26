import { Color4, LookAtController3D, mathUtil, Node3D, Vector3 } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.entity.addChild(camera.entity);

const cube = Node3D.createPrimitive('Cube');
scene.entity.addChild(cube);

const plane = Node3D.createPrimitive('Plane');
plane.position = new Vector3(1.50, 0, 0);
plane.rx = -90;
plane.scale.set(0.1, 0.1, 0.1);
scene.entity.addChild(plane);

const sphere = Node3D.createPrimitive('Sphere');
sphere.position = new Vector3(-1.50, 0, 0);
scene.entity.addChild(sphere);

const capsule = Node3D.createPrimitive('Capsule');
capsule.position = new Vector3(3, 0, 0);
scene.entity.addChild(capsule);

const cylinder = Node3D.createPrimitive('Cylinder');
cylinder.position = new Vector3(-3, 0, 0);
scene.entity.addChild(cylinder);

const controller = new LookAtController3D(camera.entity);
controller.lookAtPosition = new Vector3();
//
setInterval(() =>
{
    const time = new Date().getTime();
    let angle = (Math.round(time / 17) % 360);
    angle = angle * mathUtil.DEG2RAD;
    camera.entity.position = new Vector3(10 * Math.sin(angle), 0, 10 * Math.cos(angle));

    controller.update();
}, 17);
