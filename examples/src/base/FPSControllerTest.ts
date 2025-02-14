import { Color4, ColorMaterial, Geometry, Node3D, Vector3 } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
root.addChild(camera.entity);

const cube = new Node3D().addComponent('Mesh3D', {
    material: new ColorMaterial(),
    geometry: Geometry.create('CubeGeometry'),
}).entity;
scene.entity.addChild(cube);

const sphere = new Node3D().addComponent('Mesh3D', {
    material: new ColorMaterial(),
    geometry: Geometry.create('SphereGeometry'),
}).entity;
sphere.position = new Vector3(-1.50, 0, 0);
scene.entity.addChild(sphere);

const plane = new Node3D().addComponent('Mesh3D', {
    material: new ColorMaterial(),
    geometry: Geometry.create('PlaneGeometry'),
}).entity;
plane.position = new Vector3(1.50, 0, 0);
scene.entity.addChild(plane);

const capsule = new Node3D().addComponent('Mesh3D', {
    material: new ColorMaterial(),
    geometry: Geometry.create('CapsuleGeometry'),
}).entity;
capsule.position = new Vector3(3, 0, 0);
scene.entity.addChild(capsule);

const cylinder = new Node3D().addComponent('Mesh3D', {
    material: new ColorMaterial(),
    geometry: Geometry.create('CylinderGeometry'),
}).entity;
cylinder.position = new Vector3(-3, 0, 0);
scene.entity.addChild(cylinder);

camera.entity.z = -5;
camera.entity.lookAt(new Vector3());
//
camera.entity.addComponent('FPSController3D');
