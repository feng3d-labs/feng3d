import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
camera.transform.position = new feng3d.Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

camera.transform.z = -6;
camera.transform.y = 5;
camera.transform.lookAt(new feng3d.Vector3());

const plane = new feng3d.GameObject();
const model = plane.addComponent(feng3d.Renderable);
model.geometry = feng3d.serialization.setValue(new feng3d.PlaneGeometry(), { width: 7, height: 7 });
const material = model.material = feng3d.serialization.setValue(new feng3d.StandardMaterial(), { s_diffuse: { __class__: "Texture2D", source: { url: "/floor_diffuse.jpg" } } } as any);
scene.gameObject.addChild(plane);

feng3d.ticker.onframe(() => {
    plane.transform.ry += 1;
});

