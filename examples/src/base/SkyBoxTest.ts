import { Object3D, View, createTextureCubeFromUrls, logic, Vector3, ticker } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

let cameraEntity: Object3D;

// createTextureCubeFromUrls 返回 Promise<Texture>；await 后再构造 View
const skyboxTexture = await createTextureCubeFromUrls([
    '/skybox/px.jpg',
    '/skybox/py.jpg',
    '/skybox/pz.jpg',
    '/skybox/nx.jpg',
    '/skybox/ny.jpg',
    '/skybox/nz.jpg',
]);

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
        }],
        children: [cameraEntity = {
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: -5 },
            components: [{
                __type__: 'PerspectiveCamera',
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
    },
};
const viewLogic = logic(view);

// 初始化时让相机看向原点（仅一次，后续由 FPSController 接管旋转）
logic(cameraEntity).lookAt(new Vector3(0, 0, 0));

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
