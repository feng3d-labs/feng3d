import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, FPSController, SkyBox, TextureCube } from '../../../src';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

camera.transform.z = -5;
camera.transform.lookAt(new Vector3());
camera.gameObject.addComponent(FPSController);
//

const skybox = serialization.setValue(new GameObject(), { name: 'skybox' });
const model = skybox.addComponent(SkyBox);
model.s_skyboxTexture = serialization.setValue(new TextureCube(), {
    rawData: {
        type: 'path', paths: [
            '../../resources/skybox/px.jpg',
            '../../resources/skybox/py.jpg',
            '../../resources/skybox/pz.jpg',
            '../../resources/skybox/nx.jpg',
            '../../resources/skybox/ny.jpg',
            '../../resources/skybox/nz.jpg'
        ]
    }
}
);
scene.gameObject.addChild(skybox);
