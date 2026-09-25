import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const N = 1500; const pts: PointGeometry['points'] = []; const base: {r:number;a:number;ph:number;sp:number}[] = [];
for (let i = 0; i < N; i++) { const r = 80 + Math.random() * 120; const a = Math.random() * 6.28; const ph = (Math.random() - 0.5) * 0.5; const sp = (0.5 + Math.random()) * 0.002; base.push({ r, a, ph, sp }); pts.push({ position: { x: 0, y: 0, z: 0 }, color: { __type__: 'Color4', r: Math.random() * 0.5 + 0.5, g: 0.5, b: 1, a: 0.8 } }); }
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.05, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 100, z: 300 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 60, aspect: wc.width / wc.height, near: 1, far: 2000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] }, { __type__: 'Object3D', name: 'orbit', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points: pts } as PointGeometry, material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 6 } } as PointMaterial }] }] } };
const vl = logic(v);
ticker.onframe(() => { const t = Date.now(); for (let i = 0; i < N; i++) { const b = base[i]; const a = b.a + t * b.sp; reactive(pts[i]).position = { x: b.r * Math.cos(a), y: b.r * Math.sin(a) * b.ph, z: b.r * Math.sin(a) }; } webgpu.submit(vl.submit); });
