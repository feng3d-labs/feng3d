import { Camera, Color4, FPSController, Object3D, reactive, Renderable, Scene, StandardMaterial, transformLogic, Vector3, View, object3DLogic, createPrimitive } from 'feng3d';
/**
 * 操作方式:鼠标按下后可以使用移动鼠标改变旋转，wasdqe平移
 */
const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
const scene = object3DLogic(sceneObject3D).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
const camera = object3DLogic(cameraObject3D).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
object3DLogic(scene.object3D).addChild(camera.object3D);

const engine = new View(null, scene, camera);

reactive(camera.transform.position).z = -5;
transformLogic(camera.transform).lookAt(new Vector3());
object3DLogic(camera.object3D).addComponent(FPSController);

const cube = createPrimitive("Cube");
reactive(cube).mouseEnabled = true;
object3DLogic(cube).getComponent(Renderable).material = new StandardMaterial();
object3DLogic(scene.object3D).addChild(cube);

const sphere = createPrimitive("Sphere");
{ const _r = reactive(sphere.transform.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
reactive(sphere).mouseEnabled = true;
object3DLogic(sphere).getComponent(Renderable).material = new StandardMaterial();
object3DLogic(scene.object3D).addChild(sphere);

const capsule = createPrimitive("Capsule");
{ const _r = reactive(capsule.transform.position); _r.x = 3; _r.y = 0; _r.z = 0; }
reactive(capsule).mouseEnabled = true;
object3DLogic(capsule).getComponent(Renderable).material = new StandardMaterial();
object3DLogic(scene.object3D).addChild(capsule);

const cylinder = createPrimitive("Cylinder");
{ const _r = reactive(cylinder.transform.position); _r.x = -3; _r.y = 0; _r.z = 0; }
reactive(cylinder).mouseEnabled = true;
object3DLogic(cylinder).getComponent(Renderable).material = new StandardMaterial();
object3DLogic(scene.object3D).addChild(cylinder);

(scene as any).on("click", (event) => {
    const object3D = event.target as Object3D;
    if (object3DLogic(object3D).getComponent(Renderable)) {
        const material = object3DLogic(object3D).getComponent(Renderable).material as StandardMaterial;
        material.uniforms.u_diffuse.fromUnit(Math.random() * (1 << 24));
    }
});
