import { Camera, Color4, FPSController, GameObject, reactive, Renderable, Scene, serialization, SkyBox, TextureCube, transformLogic, Vector3, View } from 'feng3d';
const scene = serialization.setValue(new GameObject(), { name: "Untitled" }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: "Main Camera" }).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

reactive(camera.transform.position).z = -5;
transformLogic(camera.transform).lookAt(new Vector3());
camera.gameObject.addComponent(FPSController);
//

const skybox = serialization.setValue(new GameObject(), { name: "skybox" });
const model = skybox.addComponent(SkyBox);
model.s_skyboxTexture = serialization.setValue(new TextureCube(), {
    urls: [
        '/skybox/px.jpg',
        '/skybox/py.jpg',
        '/skybox/pz.jpg',
        '/skybox/nx.jpg',
        '/skybox/ny.jpg',
        '/skybox/nz.jpg'
    ]
}
);
scene.gameObject.addChild(skybox);
