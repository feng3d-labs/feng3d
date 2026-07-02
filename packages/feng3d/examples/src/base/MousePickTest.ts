import * as feng3d from 'feng3d';
/**
 * 操作方式:鼠标按下后可以使用移动鼠标改变旋转，wasdqe平移
 */
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
camera.transform.position = new feng3d.Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

camera.transform.z = -5;
camera.transform.lookAt(new feng3d.Vector3());
camera.gameObject.addComponent(feng3d.FPSController);

const cube = feng3d.GameObject.createPrimitive("Cube");
cube.mouseEnabled = true;
cube.getComponent(feng3d.Renderable).material = new feng3d.StandardMaterial();
scene.gameObject.addChild(cube);

const sphere = feng3d.GameObject.createPrimitive("Sphere");
sphere.transform.position = new feng3d.Vector3(-1.50, 0, 0);
sphere.mouseEnabled = true;
sphere.getComponent(feng3d.Renderable).material = new feng3d.StandardMaterial();
scene.gameObject.addChild(sphere);

const capsule = feng3d.GameObject.createPrimitive("Capsule");
capsule.transform.position = new feng3d.Vector3(3, 0, 0);
capsule.mouseEnabled = true;
capsule.getComponent(feng3d.Renderable).material = new feng3d.StandardMaterial();
scene.gameObject.addChild(capsule);

const cylinder = feng3d.GameObject.createPrimitive("Cylinder");
cylinder.transform.position = new feng3d.Vector3(-3, 0, 0);
cylinder.mouseEnabled = true;
cylinder.getComponent(feng3d.Renderable).material = new feng3d.StandardMaterial();
scene.gameObject.addChild(cylinder);

scene.on("click", (event) => {
    const gameObject = event.target as feng3d.GameObject;
    if (gameObject.getComponent(feng3d.Renderable)) {
        const material = gameObject.getComponent(feng3d.Renderable).material as feng3d.StandardMaterial;
        material.u_diffuse.fromUnit(Math.random() * (1 << 24));
    }
});

