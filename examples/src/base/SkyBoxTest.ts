import { Camera, Color4, FPSController, Object3D, reactive, Renderable, Scene, SkyBox, TextureCube, transformLogic, Vector3, View, object3DLogic } from 'feng3d';
const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
const scene = object3DLogic(sceneObject3D).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
const camera = object3DLogic(cameraObject3D).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
object3DLogic(scene.object3D).addChild(camera.object3D);

const engine = new View(null, scene, camera);

reactive(camera.transform.position).z = -5;
transformLogic(camera.transform).lookAt(new Vector3());
object3DLogic(camera.object3D).addComponent(FPSController);
//

const skybox = new Object3D(); reactive(skybox).name = "skybox";
const model = object3DLogic(skybox).addComponent(SkyBox);
const skyboxTexture = new TextureCube();
skyboxTexture.urls = [
    '/skybox/px.jpg',
    '/skybox/py.jpg',
    '/skybox/pz.jpg',
    '/skybox/nx.jpg',
    '/skybox/ny.jpg',
    '/skybox/nz.jpg'
];
model.s_skyboxTexture = skyboxTexture;
object3DLogic(scene.object3D).addChild(skybox);
