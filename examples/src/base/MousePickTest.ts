import { Object3D, batchRun, Camera, FPSController, reactive, Renderable, Scene, StandardMaterial, createStandardMaterial, logic, Vector3, View, createPrimitive, createObject3D, createCamera, createScene, createFPSController } from 'feng3d';

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3) {
    const m = logic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
/**
 * 操作方式:鼠标按下后可以使用移动鼠标改变旋转，wasdqe平移
 */
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
reactive(scene).background = { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 };

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive((logic(camera).entity).position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(logic(scene).entity).children.push(logic(camera).entity);

const engine = new View(null, sceneObject3D);

reactive((logic(camera).entity).position).z = -5;
lookAtTransform(logic(camera).entity, new Vector3());
{ const c = createFPSController(); reactive(logic(camera).entity).components.push(c); }

const cube = createPrimitive("Cube");
reactive(cube).mouseEnabled = true;
reactive(cube.components.find(c => c.__type__ === "Renderable" || c.__type__ === "MeshRenderer") as Renderable).material = createStandardMaterial();
reactive(logic(scene).entity).children.push(cube);

const sphere = createPrimitive("Sphere");
{ const _r = reactive(sphere.position); _r.x = -1.50; _r.y = 0; _r.z = 0; }
reactive(sphere).mouseEnabled = true;
reactive(sphere.components.find(c => c.__type__ === "Renderable" || c.__type__ === "MeshRenderer") as Renderable).material = createStandardMaterial();
reactive(logic(scene).entity).children.push(sphere);

const capsule = createPrimitive("Capsule");
{ const _r = reactive(capsule.position); _r.x = 3; _r.y = 0; _r.z = 0; }
reactive(capsule).mouseEnabled = true;
reactive(capsule.components.find(c => c.__type__ === "Renderable" || c.__type__ === "MeshRenderer") as Renderable).material = createStandardMaterial();
reactive(logic(scene).entity).children.push(capsule);

const cylinder = createPrimitive("Cylinder");
{ const _r = reactive(cylinder.position); _r.x = -3; _r.y = 0; _r.z = 0; }
reactive(cylinder).mouseEnabled = true;
reactive(cylinder.components.find(c => c.__type__ === "Renderable" || c.__type__ === "MeshRenderer") as Renderable).material = createStandardMaterial();
reactive(logic(scene).entity).children.push(cylinder);

(scene as any).on("click", (event) => {
    const object3D = event.target as Object3D;
    if (object3D.components.find(c => c.__type__ === "Renderable" || c.__type__ === "MeshRenderer")) {
        const material = (object3D.components.find(c => c.__type__ === "Renderable" || c.__type__ === "MeshRenderer") as Renderable).material as StandardMaterial;
        // 每通道独立响应式随机（纯数据 Color4）
        reactive(material.uniforms.u_diffuse).r = Math.random();
        reactive(material.uniforms.u_diffuse).g = Math.random();
        reactive(material.uniforms.u_diffuse).b = Math.random();
    }
});
