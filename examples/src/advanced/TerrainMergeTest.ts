import { batchRun, Camera, Color3, Color4, FPSController, Object3D, PointLight, reactive, Renderable, Scene, StandardMaterial, TerrainGeometry, Texture2D, ticker, transformLogic, Transform, Vector3, View, object3DLogic } from 'feng3d';

function lookAtTransform(t: Transform, target: Vector3, upAxis?: Vector3) {
    const m = transformLogic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
const scene = object3DLogic(sceneObject3D).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
const camera = object3DLogic(cameraObject3D).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
object3DLogic(scene.object3D).addChild(camera.object3D);

const engine = new View(null, scene, camera);

//
reactive(camera.transform.position).z = -5;
reactive(camera.transform.position).y = 2;
lookAtTransform(camera.transform, new Vector3());
object3DLogic(camera.object3D).addComponent(FPSController);

const root = '/terrain/';
//
const terrain = new Object3D(); reactive(terrain).name = "terrain";
const model = object3DLogic(terrain).addComponent(Renderable);
const heightMap = new Texture2D(); heightMap.source = { url: root + 'terrain_heights.jpg' };
model.geometry = (() => { const g = new TerrainGeometry(); g.heightMap = heightMap; return g; })();
const material = new StandardMaterial();
let tex: Texture2D;
tex = new Texture2D(); tex.source = { url: root + 'terrain_diffuse.jpg' }; material.s_diffuse = tex;
tex = new Texture2D(); tex.source = { url: root + 'terrain_normals.jpg' }; material.s_normal = tex;

model.material = material;
object3DLogic(scene.object3D).addChild(terrain);

//初始化光源
const light1 = new Object3D();
const pointLight1 = object3DLogic(light1).addComponent(PointLight);
pointLight1.color = new Color3(1, 1, 0);
reactive(light1.transform.position).y = 3;

//
ticker.onframe(() => {
    const time = new Date().getTime();
    const angle = time / 1000;
    reactive(light1.transform.position).x = Math.sin(angle) * 3;
    reactive(light1.transform.position).z = Math.cos(angle) * 3;
});
