import { $set, Color4, LoadImageTextureCube, Node3D, StandardMaterial, StandardUniforms, TextureCube, ticker, TorusGeometry, TransformUtils, Vector3, windowEventProxy } from 'feng3d';

const root = new Node3D();
const view3d = root.addComponent('WebGLRenderer3D');
const canvas = view3d.getRenderCanvas();

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('PerspectiveCamera3D', { fov: 90 });
camera.entity.position = new Vector3(0, 1, -6);
camera.entity.lookAt(new Vector3());
scene.entity.addChild(camera.entity);

const cubeTexture = $set(new LoadImageTextureCube(), {
    urls: {
        TEXTURE_CUBE_MAP_POSITIVE_X: '../../skybox/snow_positive_x.jpg',
        TEXTURE_CUBE_MAP_POSITIVE_Y: '../../skybox/snow_positive_y.jpg',
        TEXTURE_CUBE_MAP_POSITIVE_Z: '../../skybox/snow_positive_z.jpg',
        TEXTURE_CUBE_MAP_NEGATIVE_X: '../../skybox/snow_negative_x.jpg',
        TEXTURE_CUBE_MAP_NEGATIVE_Y: '../../skybox/snow_negative_y.jpg',
        TEXTURE_CUBE_MAP_NEGATIVE_Z: '../../skybox/snow_negative_z.jpg',
    }
});

const skybox = $set(new Node3D(), { name: 'skybox' });
const skyboxComponent = skybox.addComponent('SkyBox');
skyboxComponent.s_skyBoxTexture = cubeTexture;
scene.entity.addChild(skybox);

const torusMaterial = new StandardMaterial();
const uniforms = torusMaterial.uniforms as StandardUniforms;
uniforms.s_envMap = cubeTexture;
uniforms.u_ambient.fromUnit(0x111111);
uniforms.u_ambient.a = 0.25;

const torus = $set(new Node3D(), { name: 'torus' });
const model = torus.addComponent('Mesh3D');
model.geometry = $set(new TorusGeometry(), { radius: 1.50, tubeRadius: 0.60, segmentsR: 40, segmentsT: 20 });
model.material = torusMaterial;
scene.entity.addChild(torus);

ticker.onFrame(() =>
{
    torus.rx += 2;
    torus.ry += 1;
    camera.entity.position = new Vector3(0, 0, 0);
    camera.entity.ry += 0.5 * (windowEventProxy.clientX - canvas.clientLeft - canvas.clientWidth / 2) / 800;
    TransformUtils.moveBackward(camera.entity, 6);
});
