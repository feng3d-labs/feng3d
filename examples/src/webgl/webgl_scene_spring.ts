import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
import type { Segment, SegmentGeometry, SegmentMaterial } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
// 弹簧螺旋线段
const COILS = 12; const PTS_PER_COIL = 16;
const springSegs: Segment[] = [];
let prev: { x: number; y: number; z: number } | null = null;
for (let i = 0; i <= COILS * PTS_PER_COIL; i++) { const t = i / PTS_PER_COIL; const a = t * Math.PI * 2; const x = Math.cos(a) * 8; const y = t * 3; const z = Math.sin(a) * 8; if (prev) springSegs.push({ start: prev, end: { x, y, z }, startColor: { __type__: 'Color4', r: 0.7, g: 0.7, b: 0.8, a: 1 }, endColor: { __type__: 'Color4', r: 0.7, g: 0.7, b: 0.8, a: 1 } }); prev = { x, y, z }; }
let gr: { x: number; y: number; z: number };
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.12, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 20, z: 60 }, rotation: gr = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: wc.width / wc.height, near: 1, far: 500 }, { __type__: 'OrbitControls', target: { x: 0, y: 20, z: 0 } }] }, { __type__: 'Object3D', name: 'l', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] }, { __type__: 'Object3D', name: 'spring', scale: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: springSegs } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] }, { __type__: 'Object3D', name: 'weight', position: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 12, height: 8, depth: 12 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.6, g: 0.3, b: 0.2, a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }] }] } };
const vl = logic(v); const spring = v.root!.children![2]; const weight = v.root!.children![3];
ticker.onframe(() => { const t = Date.now() * 0.002; const compress = Math.sin(t) * 0.3 + 1; reactive(spring).scale = { x: 1, y: compress, z: 1 }; reactive(weight).position = { x: 0, y: 36 * compress - 8, z: 0 }; webgpu.submit(vl.submit); });
