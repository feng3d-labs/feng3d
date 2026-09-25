import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const layers: Object3D[] = [];
for (let i = 0; i < 10; i++) { const r = 15 - i * 1.2; layers.push({ __type__: 'Object3D', name: 'L' + i, position: { x: 0, y: i * 8, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CylinderGeometry', topRadius: r * 0.9, bottomRadius: r, height: 7, segmentsW: 24 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.4 + i * 0.05, g: 0.3 + i * 0.03, b: 0.2, a: 1 }, u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_glossiness: 20, u_reflectivity: 0 } } }] }); }
let gr: { x: number; y: number; z: number };
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.12, g: 0.12, b: 0.15, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 40, z: 120 }, rotation: gr = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: wc.width / wc.height, near: 1, far: 500 }, { __type__: 'OrbitControls', target: { x: 0, y: 40, z: 0 }, autoRotate: true, autoRotateSpeed: 0.3 }] }, { __type__: 'Object3D', name: 'l', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] }, ...layers] } };
const vl = logic(v);
ticker.onframe(() => { webgpu.submit(vl.submit); });
