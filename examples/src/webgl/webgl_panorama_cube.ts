import { WebGPU } from '@feng3d/webgpu';
import { createTextureCubeFromUrls, logic, Object3D, reactive, Scene, View, ticker } from 'feng3d';

/** 立方体全景（6 面 SkyBox 环绕）。对照 three.js webgl_panorama_cube.html */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const skyTex = await createTextureCubeFromUrls([
    '/skybox/snow_positive_x.jpg', '/skybox/snow_positive_y.jpg', '/skybox/snow_positive_z.jpg',
    '/skybox/snow_negative_x.jpg', '/skybox/snow_negative_y.jpg', '/skybox/snow_negative_z.jpg',
]);

const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 0.01 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 75, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 10000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, enableZoom: false }] },
            { __type__: 'Object3D', name: 'skybox', components: [{ __type__: 'SkyBox', s_skyboxTexture: skyTex as unknown as never }] },
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
