import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
{ const _r = feng3d.reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

feng3d.reactive(camera.transform.position).z = -6;
feng3d.reactive(camera.transform.position).y = 5;
feng3d.transformLogic(camera.transform).lookAt(new feng3d.Vector3());

const plane = new feng3d.GameObject();
const model = plane.addComponent(feng3d.Renderable);
model.geometry = feng3d.serialization.setValue(new feng3d.PlaneGeometry(), { width: 7, height: 7 });
const material = model.material = feng3d.serialization.setValue(new feng3d.StandardMaterial(), { s_diffuse: { __class__: "Texture2D", source: { url: "/floor_diffuse.jpg" } } } as any);
scene.gameObject.addChild(plane);

feng3d.ticker.onframe(() => {
    feng3d.reactive(plane.transform.rotation).y += 1;
});

