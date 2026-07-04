import { BillboardComponent, Camera, Color4, FPSController, GameObject, HoldSizeComponent, PlaneGeometry, reactive, Renderable, Scene, serialization, StandardMaterial, View } from 'feng3d';
const scene = serialization.setValue(new GameObject(), { name: "Untitled" }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: "Main Camera" }).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

camera.gameObject.addComponent(FPSController);
scene.background.setTo(0.3, 0.3, 0.3, 1);

const cube = GameObject.createPrimitive("Cube");
reactive(cube.transform.position).z = 3;
scene.gameObject.addChild(cube);

const gameObject = GameObject.createPrimitive("Plane");
reactive(gameObject.transform.position).y = 1.50;
const holdSizeComponent = gameObject.addComponent(HoldSizeComponent);
holdSizeComponent.holdSize = 1;
holdSizeComponent.camera = camera;
const billboardComponent = gameObject.addComponent(BillboardComponent);
billboardComponent.camera = camera;
cube.addChild(gameObject);

//材质
const model = gameObject.getComponent(Renderable);
model.geometry = serialization.setValue(new PlaneGeometry(), { width: 0.1, height: 0.1, segmentsW: 1, segmentsH: 1, yUp: false });
const textureMaterial = model.material = serialization.setValue(new StandardMaterial(), { s_diffuse: { __class__: "Texture2D", source: { url: '/m.png' } } } as any);
