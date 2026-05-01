import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
camera.transform.position = new feng3d.Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

camera.transform.z = -5;
camera.transform.lookAt(new feng3d.Vector3());
camera.gameObject.addComponent(feng3d.FPSController);
//

const skybox = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "skybox" });
const model = skybox.addComponent(feng3d.SkyBox);
model.s_skyboxTexture = feng3d.serialization.setValue(new feng3d.TextureCube(), {
    rawData: {
        type: "path", paths: [
            '/skybox/px.jpg',
            '/skybox/py.jpg',
            '/skybox/pz.jpg',
            '/skybox/nx.jpg',
            '/skybox/ny.jpg',
            '/skybox/nz.jpg'
        ]
    }
}
);
scene.gameObject.addChild(skybox);

