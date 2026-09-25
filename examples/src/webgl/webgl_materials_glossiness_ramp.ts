import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/** 光泽度渐变（10 球 glossiness 0→99）。 */
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const objs: Object3D[] = [];
for (let i = 0; i < 10; i++) objs.push({ __type__: 'Object3D', name: 's' + i, position: { x: (i - 4.5) * 2.5, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 0.9, segmentsW: 32, segmentsH: 16 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.3, g: 0.5, b: 0.8, a: 1 }, u_specular: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_glossiness: i * 11, u_reflectivity: 0 } } }] });
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 2, z: 18 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: wc.width / wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] }, { __type__: 'Object3D', name: 'l', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] }, ...objs] } };
const vl = logic(v);
ticker.onframe(() => { webgpu.submit(vl.submit); });
