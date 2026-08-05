import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const N = 3000; const pts: PointGeometry['points'] = []; const vel: {x:number;y:number;z:number}[] = []; const life: number[] = [];
for (let i = 0; i < N; i++) { pts.push({ position: { x: 0, y: -200, z: 0 }, color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 0 } }); vel.push({ x: 0, y: 0, z: 0 }); life.push(0); }
let burstTimer = 0; let burstIdx = 0;
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.05, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 400 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 60, aspect: wc.width/wc.height, near: 1, far: 1000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] }, { __type__: 'Object3D', name: 'fw', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points: pts } as PointGeometry, material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 6 } } as PointMaterial }] }] } };
const vl = logic(v);
ticker.onframe(() => {
  burstTimer++; if (burstTimer > 30) { burstTimer = 0; const cx=(Math.random()-0.5)*200, cy=Math.random()*100+50, cz=(Math.random()-0.5)*200; const hue=Math.random(); const cnt=80;
    for (let j = 0; j < cnt; j++) { const i = burstIdx*cnt+j; if (i >= N) break; const a = Math.random()*Math.PI*2; const phi = Math.acos(Math.random()*2-1); const sp = Math.random()*3+1; vel[i] = { x: Math.sin(phi)*Math.cos(a)*sp, y: Math.sin(phi)*Math.sin(a)*sp, z: Math.cos(phi)*sp }; life[i] = 1; pts[i].position = { x: cx, y: cy, z: cz } as never; reactive(pts[i]).color = { __type__: 'Color4', r: Math.sin(hue*6.28)*0.5+0.5, g: Math.sin(hue*6.28+2.1)*0.5+0.5, b: Math.sin(hue*6.28+4.2)*0.5+0.5, a: 1 }; } burstIdx = (burstIdx+1) % Math.floor(N/cnt); }
  for (let i = 0; i < N; i++) { if (life[i] <= 0) continue; vel[i].y -= 0.03; const p = pts[i].position as {x:number;y:number;z:number}; reactive(pts[i]).position = { x: p.x+vel[i].x, y: p.y+vel[i].y, z: p.z+vel[i].z }; life[i] -= 0.01; reactive(pts[i]).color = { __type__: 'Color4', r: pts[i].color.r, g: pts[i].color.g, b: pts[i].color.b, a: Math.max(0, life[i]) }; }
  webgpu.submit(vl.submit);
});
