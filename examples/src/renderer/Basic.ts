import { Camera, Object3D, LookAtController, mathUtil, reactive, Scene, Vector3, View, logic, createPrimitive, createObject3D, createCamera, createScene, ticker} from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
reactive(scene).background = { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 };

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive((logic(camera).entity).position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(logic(scene).entity).children.push(logic(camera).entity);

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const view: View = { __type__: 'View', canvas: webgpuCanvas, root: sceneObject3D };
const viewLogic = logic(view);

const cube = createPrimitive("Cube");
reactive(logic(scene).entity).children.push(cube);

const plane = createPrimitive("Plane");
{ const _r = reactive(plane.position); _r.x = 1.50; _r.y = 0; _r.z = 0; }
reactive(plane.rotation).x = -90;
{ const _r = reactive(plane.scale); _r.x = 0.1; _r.y = 0.1; _r.z = 0.1; }
reactive(logic(scene).entity).children.push(plane);

const sphere = createPrimitive("Sphere");
{ const _r = reactive(sphere.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
reactive(logic(scene).entity).children.push(sphere);

const capsule = createPrimitive("Capsule");
{ const _r = reactive(capsule.position); _r.x = 3; _r.y = 0; _r.z = 0; }
reactive(logic(scene).entity).children.push(capsule);

const cylinder = createPrimitive("Cylinder");
{ const _r = reactive(cylinder.position); _r.x = -3; _r.y = 0; _r.z = 0; }
reactive(logic(scene).entity).children.push(cylinder);

const controller = new LookAtController(logic(camera).entity);
controller.lookAtPosition = new Vector3();
//
setInterval(() => {
    const time = new Date().getTime();
    let angle = (Math.round(time / 17) % 360);
    angle = angle * mathUtil.DEG2RAD;
    { const _r = reactive((logic(camera).entity).position); _r.x = 10 * Math.sin(angle); _r.y = 0; _r.z = 10 * Math.cos(angle); }

    controller.update();
}, 17);

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
