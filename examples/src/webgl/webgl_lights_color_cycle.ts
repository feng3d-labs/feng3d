import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/** 光源颜色循环（PointLight RGB 周期变化 + 圆周运动）。 */
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const v: View = {
    __type__: 'View', canvas: wc,
    root: {
        __type__: 'Object3D', name: 'U',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 8 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'dl', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 0.3 }] },
            { __type__: 'Object3D', name: 'sphere', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 2, segmentsW: 64, segmentsH: 32 },
              material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_specular: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 }, u_glossiness: 60, u_reflectivity: 0 } } }] },
            { __type__: 'Object3D', name: 'pl', position: { x: 3, y: 0, z: 0 }, components: [{ __type__: 'PointLight', color: { __type__: 'Color3', r: 1, g: 0, b: 0 }, intensity: 10, range: 20 }] },
        ],
    },
};
const vl = logic(v); const pl = v.root!.children![3]; const plColor = pl.components![0] as { color: { r: number; g: number; b: number } };
ticker.onframe(() => { const t = Date.now() * 0.0005; reactive(pl).position = { x: Math.cos(t) * 4, y: Math.sin(t * 1.3) * 2, z: Math.sin(t) * 4 }; reactive(plColor).color = { r: Math.sin(t) * 0.5 + 0.5, g: Math.sin(t + 2.1) * 0.5 + 0.5, b: Math.sin(t + 4.2) * 0.5 + 0.5 }; webgpu.submit(vl.submit); });
