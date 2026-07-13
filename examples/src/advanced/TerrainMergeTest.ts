import { Object3D, batchRun, Camera, FPSController, PointLight, reactive, Renderable, Scene, StandardMaterial, createStandardMaterial, createTerrainGeometry, Texture2D, ticker, logic, Vector3, View, createObject3D, createCamera, createScene, createMeshRenderer, createPointLight, createFPSController } from 'feng3d';

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

//
reactive((logic(camera).entity).position).z = -5;
reactive((logic(camera).entity).position).y = 2;
lookAtTransform(logic(camera).entity, new Vector3());
{ const c = createFPSController(); reactive(logic(camera).entity).components.push(c); }

const root = '/terrain/';
//
const terrain = createObject3D(); reactive(terrain).name = "terrain";
const model = createMeshRenderer(); reactive(terrain).components.push(model);
const heightMap = new Texture2D(); heightMap.source = { url: root + 'terrain_heights.jpg' };
reactive(model).geometry = (() => { const g = createTerrainGeometry(); g.heightMap = heightMap; return g; })();
const material = createStandardMaterial();
let tex: Texture2D;
tex = new Texture2D(); tex.source = { url: root + 'terrain_diffuse.jpg' }; reactive(material).s_diffuse = tex;
tex = new Texture2D(); tex.source = { url: root + 'terrain_normals.jpg' }; reactive(material).s_normal = tex;

reactive(model).material = material;
reactive(logic(scene).entity).children.push(terrain);

//初始化光源
const light1 = createObject3D();
const pointLight1 = createPointLight(); reactive(light1).components.push(pointLight1);
reactive(pointLight1).color = { __type__: 'Color3', r: 1, g: 1, b: 0 };
reactive(light1.position).y = 3;

//
ticker.onframe(() => {
    const time = new Date().getTime();
    const angle = time / 1000;
    reactive(light1.position).x = Math.sin(angle) * 3;
    reactive(light1.position).z = Math.cos(angle) * 3;
});
