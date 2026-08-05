import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/** 太阳系（中心太阳 + 4 行星公转自转）。 */
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const planets: { node: Object3D; rot: { x: number; y: number; z: number }; orbitSpeed: number; orbitR: number; selfSpeed: number }[] = [];
const colors: [number, number, number][] = [[0.8, 0.3, 0.2], [0.3, 0.6, 0.9], [0.9, 0.5, 0.2], [0.5, 0.3, 0.7]];
for (let i = 0; i < 4; i++)
{
    const rot = { x: 0, y: 0, z: 0 };
    const node: Object3D = { __type__: 'Object3D', name: 'p' + i, position: { x: 0, y: 0, z: 0 }, rotation: rot, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 0.5 + i * 0.3, segmentsW: 24, segmentsH: 12 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: colors[i][0], g: colors[i][1], b: colors[i][2], a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }] };
    planets.push({ node, rot, orbitSpeed: 0.5 / (i + 1), orbitR: 3 + i * 2.5, selfSpeed: 0.02 + i * 0.01 });
}

const v: View = {
    __type__: 'View', canvas: wc,
    root: {
        __type__: 'Object3D', name: 'U',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.01, g: 0.01, b: 0.02, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 15, z: 25 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 0.1, far: 200 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'dl', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            // 太阳
            { __type__: 'Object3D', name: 'sun', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 32, segmentsH: 16 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 1, g: 0.8, b: 0.2, a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }] },
            ...planets.map(p => p.node),
        ],
    },
};
const vl = logic(v);
ticker.onframe(() => { const t = Date.now() * 0.001; for (const p of planets) { const a = t * p.orbitSpeed; reactive(p.node).position = { x: Math.cos(a) * p.orbitR, y: 0, z: Math.sin(a) * p.orbitR }; reactive(p.rot).y += p.selfSpeed; } webgpu.submit(vl.submit); });
