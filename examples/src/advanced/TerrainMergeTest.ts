import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
{ const _r = feng3d.reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

//
feng3d.reactive(camera.transform.position).z = -5;
feng3d.reactive(camera.transform.position).y = 2;
feng3d.transformLogic(camera.transform).lookAt(new feng3d.Vector3());
camera.gameObject.addComponent(feng3d.FPSController);

const root = '/terrain/';
//
const terrain = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "terrain" });
const model = terrain.addComponent(feng3d.Renderable);
model.geometry = new feng3d.TerrainGeometry({ heightMap: { __class__: "Texture2D", source: { url: root + 'terrain_heights.jpg' } } });
const material = feng3d.serialization.setValue(new feng3d.StandardMaterial(), {
    s_diffuse: { __class__: "Texture2D", source: { url: root + 'terrain_diffuse.jpg' } },
    s_normal: { __class__: "Texture2D", source: { url: root + 'terrain_normals.jpg' } },
} as any);

model.material = material;
scene.gameObject.addChild(terrain);

//初始化光源
const light1 = new feng3d.GameObject();
const pointLight1 = light1.addComponent(feng3d.PointLight);
pointLight1.color = new feng3d.Color3(1, 1, 0);
feng3d.reactive(light1.transform.position).y = 3;

//
feng3d.ticker.onframe(() => {
    const time = new Date().getTime();
    const angle = time / 1000;
    feng3d.reactive(light1.transform.position).x = Math.sin(angle) * 3;
    feng3d.reactive(light1.transform.position).z = Math.cos(angle) * 3;
});

