import { $set, Color4, LoadImageTextureCube, Node3D, Vector3 } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.entity.addChild(camera.entity);

camera.entity.z = -5;
camera.entity.lookAt(new Vector3());
camera.entity.addComponent('FPSController3D');
//

const skybox = $set(new Node3D(), { name: 'skybox' });
const model = skybox.addComponent('SkyBox');
model.s_skyBoxTexture = $set(new LoadImageTextureCube(), {
    urls: {
        TEXTURE_CUBE_MAP_POSITIVE_X: '../../skybox/px.jpg',
        TEXTURE_CUBE_MAP_POSITIVE_Y: '../../skybox/py.jpg',
        TEXTURE_CUBE_MAP_POSITIVE_Z: '../../skybox/pz.jpg',
        TEXTURE_CUBE_MAP_NEGATIVE_X: '../../skybox/nx.jpg',
        TEXTURE_CUBE_MAP_NEGATIVE_Y: '../../skybox/ny.jpg',
        TEXTURE_CUBE_MAP_NEGATIVE_Z: '../../skybox/nz.jpg'
    }
}
);
scene.entity.addChild(skybox);
