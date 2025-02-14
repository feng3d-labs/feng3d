import { CapsuleGeometry, Color4, ColorMaterial, CubeGeometry, CylinderGeometry, Node3D, PlaneGeometry, SphereGeometry, Vector3 } from 'feng3d';

/**
 * 操作方式:鼠标按下后可以使用移动鼠标改变旋转，wasdqe平移
 */
const root = new Node3D();
root.addComponent('WebGLRenderer3D');

root.addComponent('MouseEvent3D'); // 启动3D结点鼠标事件响应功能。

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.entity.addChild(camera.entity);

camera.entity.z = -5;
camera.entity.lookAt(new Vector3());
camera.entity.addComponent('FPSController3D');

const cube = new Node3D().addComponent('Mesh3D', {
    material: new ColorMaterial(),
    geometry: new CubeGeometry(),
}).entity;
cube.mouseEnabled = true;
scene.entity.addChild(cube);

const sphere = new Node3D().addComponent('Mesh3D', {
    material: new ColorMaterial(),
    geometry: new SphereGeometry(),
}).entity;
sphere.position = new Vector3(-1.50, 0, 0);
sphere.mouseEnabled = true;
scene.entity.addChild(sphere);

const plane = new Node3D().addComponent('Mesh3D', {
    material: new ColorMaterial(),
    geometry: new PlaneGeometry(),
}).entity;
plane.position = new Vector3(1.50, 0, 0);
plane.mouseEnabled = true;
scene.entity.addChild(plane);

const capsule = new Node3D().addComponent('Mesh3D', {
    material: new ColorMaterial(),
    geometry: new CapsuleGeometry(),
}).entity;
capsule.position = new Vector3(3, 0, 0);
capsule.mouseEnabled = true;
scene.entity.addChild(capsule);

const cylinder = new Node3D().addComponent('Mesh3D', {
    material: new ColorMaterial(),
    geometry: new CylinderGeometry(),
}).entity;
cylinder.position = new Vector3(-3, 0, 0);
cylinder.mouseEnabled = true;
scene.entity.addChild(cylinder);

scene.emitter.on('click', (event) =>
{
    const meshRenderer = event.data.meshRenderer;
    const material = meshRenderer.material as ColorMaterial;
    material.uniforms.u_diffuseInput.random();
});
