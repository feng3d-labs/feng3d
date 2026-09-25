import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const cones: Object3D[] = []; const SZ = 12; const SP = 3;
for (let i = 0; i < SZ; i++) for (let j = 0; j < SZ; j++) { const x = (i - SZ / 2) * SP; const z = (j - SZ / 2) * SP; const h = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 2 + 3; cones.push({ __type__: 'Object3D', name: 'c' + i + '_' + j, position: { x, y: 0, z }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'ConeGeometry', bottomRadius: 1, height: h, segmentsW: 8 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.3 + h * 0.1, g: 0.5 + h * 0.05, b: 0.8, a: 1 }, u_specular: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1 }, u_glossiness: 20, u_reflectivity: 0 } } }] }); }
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.12, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 20, z: 50 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 1, far: 200 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] }, { __type__: 'Object3D', name: 'l', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] }, ...cones] } };
const vl = logic(v);
ticker.onframe(() => { webgpu.submit(vl.submit); });
