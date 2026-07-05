import { BillboardComponent, Camera, Color4, FPSController, Object3D, HoldSizeComponent, PlaneGeometry, reactive, Renderable, Scene, StandardMaterial, Texture2D, View, logic, createPrimitive, cameraLogic, sceneLogic, createObject3D, createCamera, createScene, createFPSController, createBillboardComponent, createHoldSizeComponent} from 'feng3d';
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, sceneObject3D);

{ const c = createFPSController(); reactive(cameraLogic(camera).object3D).components.push(c); }
scene.background.setTo(0.3, 0.3, 0.3, 1);

const cube = createPrimitive("Cube");
reactive(cube.position).z = 3;
reactive(sceneLogic(scene).object3D).children.push(cube);

const object3D = createPrimitive("Plane");
reactive(object3D.position).y = 1.50;
const holdSizeComponent = createHoldSizeComponent(); reactive(object3D).components.push(holdSizeComponent);
holdSizeComponent.holdSize = 1;
holdSizeComponent.camera = camera;
const billboardComponent = createBillboardComponent(); reactive(object3D).components.push(billboardComponent);
billboardComponent.camera = camera;
reactive(cube).children.push(object3D);

//材质
const model = object3D.components.find(c => c.__type__ === "Renderable" || c.__type__ === "MeshRenderer") as Renderable;
const planeGeo = new PlaneGeometry(); planeGeo.width = 0.1; planeGeo.height = 0.1; planeGeo.segmentsW = 1; planeGeo.segmentsH = 1; planeGeo.yUp = false;
model.geometry = planeGeo;
const textureMaterial = model.material = new StandardMaterial();
const diffuseTex = new Texture2D(); diffuseTex.source = { url: '/m.png' };
textureMaterial.s_diffuse = diffuseTex;
