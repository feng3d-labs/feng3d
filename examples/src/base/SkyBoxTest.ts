import { Camera, Color4, FPSController, GameObject, reactive, Renderable, Scene, SkyBox, TextureCube, transformLogic, Vector3, View } from 'feng3d';
const sceneGameObject = new GameObject(); sceneGameObject.name = "Untitled";
const scene = sceneGameObject.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraGameObject = new GameObject(); cameraGameObject.name = "Main Camera";
const camera = cameraGameObject.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

reactive(camera.transform.position).z = -5;
transformLogic(camera.transform).lookAt(new Vector3());
camera.gameObject.addComponent(FPSController);
//

const skybox = new GameObject(); skybox.name = "skybox";
const model = skybox.addComponent(SkyBox);
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
scene.gameObject.addChild(skybox);
