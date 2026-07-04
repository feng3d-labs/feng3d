import { BillboardComponent, Camera, Color4, FPSController, Object3D, HoldSizeComponent, PlaneGeometry, reactive, Renderable, Scene, StandardMaterial, Texture2D, View } from 'feng3d';
const sceneObject3D = new Object3D(); sceneObject3D.name = "Untitled";
const scene = sceneObject3D.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); cameraObject3D.name = "Main Camera";
const camera = cameraObject3D.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.object3D.addChild(camera.object3D);

const engine = new View(null, scene, camera);

camera.object3D.addComponent(FPSController);
scene.background.setTo(0.3, 0.3, 0.3, 1);

const cube = Object3D.createPrimitive("Cube");
reactive(cube.transform.position).z = 3;
scene.object3D.addChild(cube);

const object3D = Object3D.createPrimitive("Plane");
reactive(object3D.transform.position).y = 1.50;
const holdSizeComponent = object3D.addComponent(HoldSizeComponent);
holdSizeComponent.holdSize = 1;
holdSizeComponent.camera = camera;
const billboardComponent = object3D.addComponent(BillboardComponent);
billboardComponent.camera = camera;
cube.addChild(object3D);

//材质
const model = object3D.getComponent(Renderable);
const planeGeo = new PlaneGeometry(); planeGeo.width = 0.1; planeGeo.height = 0.1; planeGeo.segmentsW = 1; planeGeo.segmentsH = 1; planeGeo.yUp = false;
model.geometry = planeGeo;
const textureMaterial = model.material = new StandardMaterial();
const diffuseTex = new Texture2D(); diffuseTex.source = { url: '/m.png' };
textureMaterial.s_diffuse = diffuseTex;
