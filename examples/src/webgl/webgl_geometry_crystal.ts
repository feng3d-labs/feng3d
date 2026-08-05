import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
import '@feng3d/addons';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const crystals: Object3D[] = [];
for (let i = 0; i < 15; i++) { const hue = i / 15; crystals.push({ __type__: 'Object3D', name: 'c' + i, position: { x: (Math.random() - 0.5) * 30, y: (Math.random() - 0.5) * 20, z: (Math.random() - 0.5) * 30 }, rotation: { x: Math.random() * 3, y: Math.random() * 3, z: Math.random() * 3 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: i % 2 ? 'IcosahedronGeometry' : 'OctahedronGeometry', radius: Math.random() * 1.5 + 1, detail: 0 } as never, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: Math.sin(hue * 6.28) * 0.3 + 0.5, g: Math.sin(hue * 6.28 + 2.1) * 0.3 + 0.5, b: Math.sin(hue * 6.28 + 4.2) * 0.3 + 0.7, a: 1 }, u_specular: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 }, u_glossiness: 80, u_reflectivity: 0 } } }] }); }
let gr: { x: number; y: number; z: number };
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.08, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 30 }, rotation: gr = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.3 }] }, { __type__: 'Object3D', name: 'l', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] }, ...crystals] } };
const vl = logic(v);
ticker.onframe(() => { for (const c of crystals) reactive(c.rotation as { y: number }).y += 0.005; webgpu.submit(vl.submit); });
