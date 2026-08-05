import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const N = 3000; const pts: PointGeometry['points'] = [];
for (let i = 0; i < N; i++) pts.push({ position: { x: (Math.random() - 0.5) * 500, y: Math.random() * 400, z: (Math.random() - 0.5) * 500 }, color: { __type__: 'Color4', r: 0.3, g: 0.5, b: 0.9, a: 0.6 } });
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.02, g: 0.03, b: 0.05, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 50, z: 500 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 60, aspect: wc.width / wc.height, near: 1, far: 2000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] }, { __type__: 'Object3D', name: 'rain', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points: pts } as PointGeometry, material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 3 } } as PointMaterial }] }] } };
const vl = logic(v);
ticker.onframe(() => { for (let i = 0; i < N; i++) { const p = pts[i].position as { y: number }; const y = p.y - 4; reactive(pts[i]).position = { x: (pts[i].position as {x:number}).x, y, z: (pts[i].position as {z:number}).z }; if (y < -200) reactive(pts[i]).position = { x: (Math.random() - 0.5) * 500, y: 200, z: (Math.random() - 0.5) * 500 }; } webgpu.submit(vl.submit); });
