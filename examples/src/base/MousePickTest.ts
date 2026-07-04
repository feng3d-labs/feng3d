import { Camera, Color4, FPSController, GameObject, reactive, Renderable, Scene, StandardMaterial, transformLogic, Vector3, View } from 'feng3d';
/**
 * 操作方式:鼠标按下后可以使用移动鼠标改变旋转，wasdqe平移
 */
const sceneGameObject = new GameObject(); sceneGameObject.name = "Untitled";
const scene = sceneGameObject.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraGameObject = new GameObject(); cameraGameObject.name = "Main Camera";
const camera = cameraGameObject.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

reactive(camera.transform.position).z = -5;
transformLogic(camera.transform).lookAt(new Vector3());
camera.gameObject.addComponent(FPSController);

const cube = GameObject.createPrimitive("Cube");
cube.mouseEnabled = true;
cube.getComponent(Renderable).material = new StandardMaterial();
scene.gameObject.addChild(cube);

const sphere = GameObject.createPrimitive("Sphere");
{ const _r = reactive(sphere.transform.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
sphere.mouseEnabled = true;
sphere.getComponent(Renderable).material = new StandardMaterial();
scene.gameObject.addChild(sphere);

const capsule = GameObject.createPrimitive("Capsule");
{ const _r = reactive(capsule.transform.position); _r.x = 3; _r.y = 0; _r.z = 0; }
capsule.mouseEnabled = true;
capsule.getComponent(Renderable).material = new StandardMaterial();
scene.gameObject.addChild(capsule);

const cylinder = GameObject.createPrimitive("Cylinder");
{ const _r = reactive(cylinder.transform.position); _r.x = -3; _r.y = 0; _r.z = 0; }
cylinder.mouseEnabled = true;
cylinder.getComponent(Renderable).material = new StandardMaterial();
scene.gameObject.addChild(cylinder);

scene.on("click", (event) => {
    const gameObject = event.target as GameObject;
    if (gameObject.getComponent(Renderable)) {
        const material = gameObject.getComponent(Renderable).material as StandardMaterial;
        material.uniforms.u_diffuse.fromUnit(Math.random() * (1 << 24));
    }
});
