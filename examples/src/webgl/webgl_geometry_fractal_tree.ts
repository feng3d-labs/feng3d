import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, View, ticker } from 'feng3d';
import type { Segment, SegmentGeometry, SegmentMaterial } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const segs: Segment[] = [];
function branch(x: number, y: number, z: number, angle: number, len: number, depth: number) { if (depth <= 0 || len < 1) return; const ex = x + Math.cos(angle) * len; const ey = y + len * 0.7; const ez = z + Math.sin(angle) * len; const col = { __type__: 'Color4' as const, r: 0.3 + depth * 0.1, g: 0.5 + depth * 0.08, b: 0.2, a: 1 }; segs.push({ start: { x, y, z }, end: { x: ex, y: ey, z: ez }, startColor: { ...col }, endColor: { ...col } }); branch(ex, ey, ez, angle - 0.5, len * 0.7, depth - 1); branch(ex, ey, ez, angle + 0.5, len * 0.7, depth - 1); }
branch(0, 0, 0, 0, 20, 6);
let gr: { x: number; y: number; z: number };
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.08, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 30, z: 80 }, rotation: gr = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 1, far: 500 }, { __type__: 'OrbitControls', target: { x: 0, y: 20, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 }] }, { __type__: 'Object3D', name: 'tree', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: segs } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] }] } };
const vl = logic(v);
ticker.onframe(() => { reactive(gr).y += 0.002; webgpu.submit(vl.submit); });
