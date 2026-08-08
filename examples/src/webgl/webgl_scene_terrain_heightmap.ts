import { WebGPU } from '@feng3d/webgpu';
import { VertexDataGeometry, logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const SEG = 48; const SZ = 100;
const pos: number[] = []; const idx: number[] = []; const nor: number[] = []; const uv: number[] = []; const col: number[] = [];
for (let z = 0; z <= SEG; z++) for (let x = 0; x <= SEG; x++) { const u = x / SEG; const v = z / SEG; const px = (u - 0.5) * SZ; const pz = (v - 0.5) * SZ; const py = Math.sin(px * 0.08) * Math.cos(pz * 0.08) * 12 + Math.sin(px * 0.03 + pz * 0.04) * 8; pos.push(px, py, pz); nor.push(0, 1, 0); uv.push(u, v); const h = (py + 20) / 40; col.push(h * 0.4 + 0.3, h * 0.6 + 0.2, h * 0.2, 1); }
for (let z = 0; z < SEG; z++) for (let x = 0; x < SEG; x++) { const a = z * (SEG + 1) + x; idx.push(a, a + SEG + 1, a + 1, a + 1, a + SEG + 1, a + SEG + 2); }
const geo: VertexDataGeometry = { __type__: 'VertexDataGeometry' }; const r = reactive(geo); r.positions = pos; r.normals = nor; r.uvs = uv; r.colors = col; r.indices = idx;
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.3, g: 0.5, b: 0.7, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 60, y: 60, z: 80 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: wc.width / wc.height, near: 1, far: 500 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] }, { __type__: 'Object3D', name: 'l', position: { x: 0.5, y: 1, z: 0.3 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] }, { __type__: 'Object3D', name: 'terrain', components: [{ __type__: 'MeshRenderer', geometry: geo, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }] }] } };
const vl = logic(v);
ticker.onframe(() => { webgpu.submit(vl.submit); });
