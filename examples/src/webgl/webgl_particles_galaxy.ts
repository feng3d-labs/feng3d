import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const N = 8000; const pts: PointGeometry['points'] = [];
for (let i = 0; i < N; i++) { const r = Math.random()*200+20; const a = i*0.1; const arm = (i%3)*2.094; const x = Math.cos(a+arm)*r; const z = Math.sin(a+arm)*r; const y = (Math.random()-0.5)*20*(1-r/200); pts.push({ position: { x, y, z }, color: { __type__: 'Color4', r: r/200, g: 0.5+Math.random()*0.5, b: 1-r/200, a: 0.8 } }); }
let gr:{x:number;y:number;z:number};
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.01, g: 0.01, b: 0.03, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 100, z: 300 }, rotation: gr={x:0,y:0,z:0}, components: [{ __type__: 'PerspectiveCamera', fov: 60, aspect: wc.width/wc.height, near: 1, far: 2000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.3 }] }, { __type__: 'Object3D', name: 'galaxy', rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points: pts } as PointGeometry, material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 4 } } as PointMaterial }] }] } };
const vl = logic(v);
ticker.onframe(() => { webgpu.submit(vl.submit); });
