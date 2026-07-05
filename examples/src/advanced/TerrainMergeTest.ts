import { Object3D, batchRun, Camera, Color3, Color4, FPSController, PointLight, reactive, Renderable, Scene, StandardMaterial, createStandardMaterial, createTerrainGeometry, Texture2D, ticker, transformLogic, Vector3, View, logic, cameraLogic, sceneLogic, createObject3D, createCamera, createScene, createRenderable, createPointLight, createFPSController} from 'feng3d';

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3) {
    const m = transformLogic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, sceneObject3D);

//
reactive(cameraLogic(camera).object3D.position).z = -5;
reactive(cameraLogic(camera).object3D.position).y = 2;
lookAtTransform(cameraLogic(camera).object3D, new Vector3());
{ const c = createFPSController(); reactive(cameraLogic(camera).object3D).components.push(c); }

const root = '/terrain/';
//
const terrain = createObject3D(); reactive(terrain).name = "terrain";
const model = createRenderable(); reactive(terrain).components.push(model);
const heightMap = new Texture2D(); heightMap.source = { url: root + 'terrain_heights.jpg' };
model.geometry = (() => { const g = createTerrainGeometry(); g.heightMap = heightMap; return g; })();
const material = createStandardMaterial();
let tex: Texture2D;
tex = new Texture2D(); tex.source = { url: root + 'terrain_diffuse.jpg' }; material.s_diffuse = tex;
tex = new Texture2D(); tex.source = { url: root + 'terrain_normals.jpg' }; material.s_normal = tex;

model.material = material;
reactive(sceneLogic(scene).object3D).children.push(terrain);

//初始化光源
const light1 = createObject3D();
const pointLight1 = createPointLight(); reactive(light1).components.push(pointLight1);
pointLight1.color = new Color3(1, 1, 0);
reactive(light1.position).y = 3;

//
ticker.onframe(() => {
    const time = new Date().getTime();
    const angle = time / 1000;
    reactive(light1.position).x = Math.sin(angle) * 3;
    reactive(light1.position).z = Math.cos(angle) * 3;
});
