import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/** 卡通着色近似（用 StandardMaterial 高 glossiness + 强光模拟硬边卡通效果）。对照 three.js webgl_materials_toon.html */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const spheres: Object3D[] = [];
for (let y = 0; y < 5; y++)
    for (let x = 0; x < 5; x++)
    {
        const hue = (x + y * 5) / 25;
        const r = Math.sin(hue * 6.28 + 0) * 0.3 + 0.5;
        const g = Math.sin(hue * 6.28 + 2.1) * 0.3 + 0.5;
        const b = Math.sin(hue * 6.28 + 4.2) * 0.3 + 0.5;
        spheres.push({
            __type__: 'Object3D', name: `s_${x}_${y}`,
            position: { x: (x - 2) * 25, y: (y - 2) * 25, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
            components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 10, segmentsW: 32, segmentsH: 16 },
                material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r, g, b, a: 1 }, u_specular: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 }, u_glossiness: 100, u_reflectivity: 0 } } }],
        });
    }

let groupRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.27, g: 0.27, b: 0.53, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 200 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 40, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 2500 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 }] },
            { __type__: 'Object3D', name: 'light', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            { __type__: 'Object3D', name: 'group', rotation: groupRot = { x: 0, y: 0, z: 0 }, children: spheres },
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() => { reactive(groupRot).y += 0.003; webgpu.submit(viewLogic.submit); });
