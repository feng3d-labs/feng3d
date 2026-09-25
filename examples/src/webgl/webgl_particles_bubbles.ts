import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const N = 800; const pts: PointGeometry['points'] = []; const vy: number[] = [];
for (let i = 0; i < N; i++) { vy.push(0.5 + Math.random() * 1.5); pts.push({ position: { x: (Math.random() - 0.5) * 100, y: Math.random() * 200 - 100, z: (Math.random() - 0.5) * 100 }, color: { __type__: 'Color4', r: 0.5, g: 0.8, b: 1, a: 0.4 } }); }
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.02, g: 0.05, b: 0.1, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 250 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 1, far: 1000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] }, { __type__: 'Object3D', name: 'bubbles', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points: pts } as PointGeometry, material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 12 } } as PointMaterial }] }] } };
const vl = logic(v);
ticker.onframe(() => { const t = Date.now() * 0.001; for (let i = 0; i < N; i++) { const p = pts[i].position as { x: number; y: number; z: number }; const y = p.y + vy[i]; reactive(pts[i]).position = { x: p.x + Math.sin(t + i) * 0.2, y, z: p.z }; if (y > 120) reactive(pts[i]).position = { x: (Math.random() - 0.5) * 100, y: -100, z: (Math.random() - 0.5) * 100 }; } webgpu.submit(vl.submit); });
