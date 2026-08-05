import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const spheres: Object3D[] = [];
for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) { const hue = (x + y * 6) / 24; spheres.push({ __type__: 'Object3D', name: 's' + x + '_' + y, position: { x: (x - 2.5) * 2.5, y: (y - 1.5) * 2.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 0.8, segmentsW: 32, segmentsH: 16 }, material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: Math.sin(hue * 6.28) * 0.5 + 0.5, g: Math.sin(hue * 6.28 + 2.1) * 0.5 + 0.5, b: Math.sin(hue * 6.28 + 4.2) * 0.5 + 0.5, a: 1 } } } }] }); }
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 18 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] }, ...spheres] } };
const vl = logic(v);
ticker.onframe(() => { webgpu.submit(vl.submit); });
