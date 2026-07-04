import { BillboardComponent, Camera, Color4, FPSController, GameObject, HoldSizeComponent, PlaneGeometry, reactive, Renderable, Scene, StandardMaterial, Texture2D, View } from 'feng3d';
const sceneGameObject = new GameObject(); sceneGameObject.name = "Untitled";
const scene = sceneGameObject.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraGameObject = new GameObject(); cameraGameObject.name = "Main Camera";
const camera = cameraGameObject.addComponent(Camera);
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
const planeGeo = new PlaneGeometry(); planeGeo.width = 0.1; planeGeo.height = 0.1; planeGeo.segmentsW = 1; planeGeo.segmentsH = 1; planeGeo.yUp = false;
model.geometry = planeGeo;
const textureMaterial = model.material = new StandardMaterial();
const diffuseTex = new Texture2D(); diffuseTex.source = { url: '/m.png' };
textureMaterial.s_diffuse = diffuseTex;
