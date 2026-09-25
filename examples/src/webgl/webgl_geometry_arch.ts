import { WebGPU } from "@feng3d/webgpu";
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from "feng3d";
const wc = document.getElementById("webgpu") as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const arch: Object3D[] = [];
for (let i = 0; i <= 15; i++) { const t = i/15; const x = Math.sin(t*Math.PI)*60; const y = t*100; arch.push({ __type__: "Object3D", name: "ring"+i, position: { x, y, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: "MeshRenderer", geometry: { __type__: "TorusGeometry", radius: 8, tubeRadius: 3, segmentsR: 24, segmentsT: 8 }, material: { __type__: "StandardMaterial", uniforms: { u_diffuse: { __type__: "Color4", r: 0.7, g: 0.5+t*0.3, b: 0.3, a: 1 }, u_specular: { __type__: "Color4", r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_glossiness: 30, u_reflectivity: 0 } } }] }); }
let gr:{x:number;y:number;z:number};
const v: View = { __type__: "View", canvas: wc, root: { __type__: "Object3D", name: "U", components: [{ __type__: "Scene", background: { __type__: "Color4", r: 0.12, g: 0.12, b: 0.15, a: 1 }, ambientColor: { __type__: "Color4", r: 0.6, g: 0.6, b: 0.6, a: 1 } }], children: [{ __type__: "Object3D", name: "cam", position: { x: 0, y: 50, z: 200 }, rotation: gr={x:0,y:0,z:0}, components: [{ __type__: "PerspectiveCamera", fov: 45, aspect: wc.width/wc.height, near: 1, far: 1000 }, { __type__: "OrbitControls", target: { x: 0, y: 50, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 }] }, { __type__: "Object3D", name: "l", position: { x: 1, y: 1, z: 1 }, components: [{ __type__: "DirectionalLight", color: { __type__: "Color3", r: 1, g: 1, b: 1 }, intensity: 1 }] }, ...arch] } };
const vl = logic(v);
ticker.onframe(() => { webgpu.submit(vl.submit); });
