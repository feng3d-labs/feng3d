import { Object3D, batchRun, Camera, FPSController, reactive, Renderable, Scene, SkyBox, TextureCube, logic, Vector3, View, createObject3D, createCamera, createScene, createFPSController, createSkyBox } from 'feng3d';

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3) {
    const m = logic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
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
//

const skybox = createObject3D(); reactive(skybox).name = "skybox";
const model = createSkyBox(); reactive(skybox).components.push(model);
const skyboxTexture = new TextureCube();
skyboxTexture.urls = [
    '/skybox/px.jpg',
    '/skybox/py.jpg',
    '/skybox/pz.jpg',
    '/skybox/nx.jpg',
    '/skybox/ny.jpg',
    '/skybox/nz.jpg'
];
reactive(model).s_skyboxTexture = skyboxTexture;
reactive(logic(scene).entity).children.push(skybox);
