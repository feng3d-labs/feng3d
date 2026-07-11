import { Object3D, View, TextureCube, logic, Vector3 } from 'feng3d';

const skyboxTexture = new TextureCube();
skyboxTexture.urls = [
    '/skybox/px.jpg',
    '/skybox/py.jpg',
    '/skybox/pz.jpg',
    '/skybox/nx.jpg',
    '/skybox/ny.jpg',
    '/skybox/nz.jpg',
];

const sceneObject3D: Object3D = {
    __type__: 'Object3D',
    name: 'Untitled',
    components: [{
        __type__: 'Scene',
        background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
    }],
    children: [{
        __type__: 'Object3D',
        name: 'Main Camera',
        position: { x: 0, y: 1, z: -5 },
        components: [{
            __type__: 'Camera',
        }, {
            __type__: 'FPSController',
        }],
    }, {
        __type__: 'Object3D',
        name: 'skybox',
        components: [{
            __type__: 'SkyBox',
            s_skyboxTexture: skyboxTexture,
        }],
    }],
};

const engine = new View(null, sceneObject3D);

// 初始化时让相机看向原点（仅一次，后续由 FPSController 接管旋转）
const cameraEntity = sceneObject3D.children!.find(c => c.name === 'Main Camera')!;
logic(cameraEntity).lookAt(new Vector3(0, 0, 0));
