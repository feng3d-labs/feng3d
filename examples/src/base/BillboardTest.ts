import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
{ const _r = feng3d.reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

camera.gameObject.addComponent(feng3d.FPSController);
scene.background.setTo(0.3, 0.3, 0.3, 1);

const cube = feng3d.GameObject.createPrimitive("Cube");
feng3d.reactive(cube.transform.position).z = 3;
scene.gameObject.addChild(cube);

const gameObject = feng3d.GameObject.createPrimitive("Plane");
feng3d.reactive(gameObject.transform.position).y = 1.50;
const holdSizeComponent = gameObject.addComponent(feng3d.HoldSizeComponent);
holdSizeComponent.holdSize = 1;
holdSizeComponent.camera = camera;
const billboardComponent = gameObject.addComponent(feng3d.BillboardComponent);
billboardComponent.camera = camera;
cube.addChild(gameObject);

//材质
const model = gameObject.getComponent(feng3d.Renderable);
model.geometry = feng3d.serialization.setValue(new feng3d.PlaneGeometry(), { width: 0.1, height: 0.1, segmentsW: 1, segmentsH: 1, yUp: false });
const textureMaterial = model.material = feng3d.serialization.setValue(new feng3d.StandardMaterial(), { s_diffuse: { __class__: "Texture2D", source: { url: '/m.png' } } } as any);

