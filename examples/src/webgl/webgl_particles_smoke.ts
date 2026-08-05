import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const N = 1500; const pts: PointGeometry['points'] = []; const vel: {x:number;y:number;z:number}[] = [];
for (let i = 0; i < N; i++) { pts.push({ position: { x: 0, y: 0, z: 0 }, color: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 0 } }); vel.push({ x: (Math.random()-0.5)*0.5, y: Math.random()*1+0.5, z: (Math.random()-0.5)*0.5 }); }
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.08, b: 0.05, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 50, z: 120 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width/wc.height, near: 1, far: 500 }, { __type__: 'OrbitControls', target: { x: 0, y: 30, z: 0 } }] }, { __type__: 'Object3D', name: 'smoke', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points: pts } as PointGeometry, material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 15 } } as PointMaterial }] }] } };
const vl = logic(v);
ticker.onframe(() => { for (let i = 0; i < N; i++) { const p = pts[i].position as {x:number;y:number;z:number}; p.x += vel[i].x; p.y += vel[i].y; p.z += vel[i].z; if (p.y > 100) { p.x=0; p.y=0; p.z=0; } reactive(pts[i]).position = { x: p.x, y: p.y, z: p.z }; reactive(pts[i]).color = { __type__: 'Color4', r: 0.6, g: 0.5, b: 0.4, a: Math.max(0, 1-p.y/100) }; } webgpu.submit(vl.submit); });
