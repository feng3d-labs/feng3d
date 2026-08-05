import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/** 多场景对比（两个旋转球不同材质属性）。对照 three.js webgl_multiple_scenes_comparison.html */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

let rot1: { x: number; y: number; z: number };
let rot2: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 10 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'light', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            // 粗糙球（低 glossiness）
            { __type__: 'Object3D', name: 'rough', position: { x: -2.5, y: 0, z: 0 }, rotation: rot1 = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 64, segmentsH: 32 },
                material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.3, b: 0.2, a: 1 }, u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_glossiness: 5, u_reflectivity: 0 } } }] },
            // 光滑球（高 glossiness）
            { __type__: 'Object3D', name: 'smooth', position: { x: 2.5, y: 0, z: 0 }, rotation: rot2 = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 64, segmentsH: 32 },
                material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.2, g: 0.5, b: 0.9, a: 1 }, u_specular: { __type__: 'Color4', r: 0.9, g: 0.9, b: 0.9, a: 1 }, u_glossiness: 100, u_reflectivity: 0 } } }] },
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() =>
{
    reactive(rot1).y += 0.005;
    reactive(rot2).y -= 0.005;
    webgpu.submit(viewLogic.submit);
});
