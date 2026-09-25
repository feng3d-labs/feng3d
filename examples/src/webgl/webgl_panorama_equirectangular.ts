import { WebGPU } from '@feng3d/webgpu';
import { createTextureCubeFromUrls, logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/** 全景天空盒（SkyBox 环绕场景）。对照 three.js webgl_panorama_equirectangular.html */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const skyTex = await createTextureCubeFromUrls([
    '/skybox/px.jpg', '/skybox/py.jpg', '/skybox/pz.jpg',
    '/skybox/nx.jpg', '/skybox/ny.jpg', '/skybox/nz.jpg',
]);

let groupRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 5 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 75, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 10000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'light', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 0.5 }] },
            // 反射球
            { __type__: 'Object3D', name: 'sphere', rotation: groupRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 2, segmentsW: 64, segmentsH: 32 },
                material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 }, u_specular: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 }, u_glossiness: 100, u_reflectivity: 0.9 },
                    s_envMap: skyTex as unknown as StandardMaterial['s_envMap'] } }] },
            { __type__: 'Object3D', name: 'skybox', components: [{ __type__: 'SkyBox', s_skyboxTexture: skyTex as unknown as never }] },
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() => { reactive(groupRot).y += 0.003; webgpu.submit(viewLogic.submit); });
