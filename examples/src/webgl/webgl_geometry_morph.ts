import { WebGPU } from '@feng3d/webgpu';
import { VertexDataGeometry, logic, MeshRenderer, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const SEG = 32;
function buildSphere(r: number): VertexDataGeometry { const pos: number[]=[]; const nor: number[]=[]; const uv: number[]=[]; const idx: number[]=[]; const col: number[]=[];
  for (let z=0; z<=SEG; z++) for (let x=0; x<=SEG; x++) { const u=x/SEG, v=z/SEG; const th=u*Math.PI*2, ph=v*Math.PI; pos.push(Math.sin(ph)*Math.cos(th)*r, Math.cos(ph)*r, Math.sin(ph)*Math.sin(th)*r); nor.push(pos[pos.length-3], pos[pos.length-2], pos[pos.length-1]); uv.push(u,v); col.push(0.5,0.7,1,1); }
  for (let z=0; z<SEG; z++) for (let x=0; x<SEG; x++) { const a=z*(SEG+1)+x, b=a+1, c=a+SEG+1, d=c+1; idx.push(a,c,b,b,c,d); }
  const g: VertexDataGeometry = { __type__: 'VertexDataGeometry' }; const rg=reactive(g); rg.positions=pos; rg.normals=nor; rg.uvs=uv; rg.colors=col; rg.indices=idx; return g; }
let curGeo = buildSphere(1.5);
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 5 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width/wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] }, { __type__: 'Object3D', name: 'l', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] }, { __type__: 'Object3D', name: 'morph', rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: curGeo, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.4, g: 0.8, b: 0.6, a: 1 }, u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_glossiness: 30, u_reflectivity: 0 } } }] }] } };
const vl = logic(v); const morphNode = v.root!.children![2];
ticker.onframe(() => { const t = Date.now()*0.001; const r = 1.5+Math.sin(t*2)*0.5; curGeo = buildSphere(r); reactive(morphNode.components![0] as MeshRenderer).geometry = curGeo; reactive(morphNode.rotation as {y:number}).y = t*0.3; webgpu.submit(vl.submit); });
