import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const N = 800; const pts: PointGeometry['points'] = []; const vel: { x: number; y: number; z: number }[] = []; const life: number[] = []; const cr0: number[] = []; const cg0: number[] = []; const cb0: number[] = [];
for (let i = 0; i < N; i++) { vel.push({ x: 0, y: 0, z: 0 }); life.push(0); const hue = Math.random(); cr0.push(Math.sin(hue * 6.28) * 0.5 + 0.5); cg0.push(Math.sin(hue * 6.28 + 2.1) * 0.5 + 0.5); cb0.push(Math.sin(hue * 6.28 + 4.2) * 0.5 + 0.5); pts.push({ position: { x: 9999, y: 9999, z: 9999 }, color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 0 } }); }
let timer = 0; let idx = 0;
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.02, g: 0.01, b: 0.01, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 300 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 55, aspect: wc.width / wc.height, near: 1, far: 1000, frustumCulling: false }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] }, { __type__: 'Object3D', name: 'boom', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points: pts } as PointGeometry, material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 8 } } as PointMaterial }] }] } };
const vl = logic(v);
ticker.onframe(() => {
    timer++; if (timer > 60) { timer = 0; const cx = (Math.random() - 0.5) * 150; const cy = (Math.random() - 0.5) * 100; const cz = (Math.random() - 0.5) * 150; const cnt = 80;
        for (let j = 0; j < cnt; j++) { const i = idx * cnt + j; if (i >= N) break; const a = Math.random() * 6.28; const phi = Math.acos(Math.random() * 2 - 1); const sp = Math.random() * 5 + 2; vel[i] = { x: Math.sin(phi) * Math.cos(a) * sp, y: Math.sin(phi) * Math.sin(a) * sp, z: Math.cos(phi) * sp }; life[i] = 1; reactive(pts[i]).position = { x: cx, y: cy, z: cz }; reactive(pts[i]).color = { __type__: 'Color4', r: cr0[i], g: cg0[i], b: cb0[i], a: 1 }; } idx = (idx + 1) % Math.floor(N / cnt); }
    for (let i = 0; i < N; i++) { if (life[i] <= 0) continue; vel[i].y -= 0.04; const p = pts[i].position as { x: number; y: number; z: number }; reactive(pts[i]).position = { x: p.x + vel[i].x, y: p.y + vel[i].y, z: p.z + vel[i].z }; life[i] -= 0.012; reactive(pts[i]).color = { __type__: 'Color4', r: cr0[i], g: cg0[i], b: cb0[i], a: Math.max(0, life[i]) }; }
    webgpu.submit(vl.submit);
});
