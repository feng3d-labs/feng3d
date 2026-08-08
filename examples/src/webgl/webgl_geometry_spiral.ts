import { WebGPU } from "@feng3d/webgpu";
import { CustomGeometry, logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from "feng3d";
const wc = document.getElementById("webgpu") as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const SEG = 200; const pos: number[] = []; const idx: number[] = []; const nor: number[] = []; const uv: number[] = []; const col: number[] = [];
for (let i = 0; i < SEG; i++) { const t = i/(SEG-1); const r = 20+t*40; const a = t*Math.PI*6; const x = Math.cos(a)*r; const z = Math.sin(a)*r; const y = t*30; pos.push(x,y,z,x,y+5,z); nor.push(0,1,0,0,1,0); uv.push(t,0,t,1); col.push(0.3,t,0.8,1,0.5,t*0.5+0.5,0.9,1); if (i<SEG-1) { const b=i*2; idx.push(b,b+1,b+2,b+1,b+3,b+2); } }
const geo: CustomGeometry = { __type__: "CustomGeometry" }; const r = reactive(geo); r.positions=pos; r.normals=nor; r.uvs=uv; r.colors=col; r.indices=idx;
let gr:{x:number;y:number;z:number};
const v: View = { __type__: "View", canvas: wc, root: { __type__: "Object3D", name: "U", components: [{ __type__: "Scene", background: { __type__: "Color4", r: 0.08, g: 0.08, b: 0.1, a: 1 }, ambientColor: { __type__: "Color4", r: 0.7, g: 0.7, b: 0.7, a: 1 } }], children: [{ __type__: "Object3D", name: "cam", position: { x: 0, y: 30, z: 120 }, rotation: gr={x:0,y:0,z:0}, components: [{ __type__: "PerspectiveCamera", fov: 50, aspect: wc.width/wc.height, near: 1, far: 500 }, { __type__: "OrbitControls", target: { x: 0, y: 15, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 }] }, { __type__: "Object3D", name: "l", position: { x: 1, y: 1, z: 1 }, components: [{ __type__: "DirectionalLight", color: { __type__: "Color3", r: 1, g: 1, b: 1 }, intensity: 1 }] }, { __type__: "Object3D", name: "spiral", rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: "MeshRenderer", geometry: geo, material: { __type__: "StandardMaterial", uniforms: { u_diffuse: { __type__: "Color4", r: 1, g: 1, b: 1, a: 1 }, u_specular: { __type__: "Color4", r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }] }] } };
const vl = logic(v);
ticker.onframe(() => { reactive(gr).y += 0.003; webgpu.submit(vl.submit); });
