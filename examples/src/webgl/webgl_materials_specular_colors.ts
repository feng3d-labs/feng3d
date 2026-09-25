import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const spheres: Object3D[] = [];
for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) { const hue = (x+y*5)/15; spheres.push({ __type__: 'Object3D', name: `s${x}_${y}`, position: { x: (x-2)*2.5, y: (y-1)*2.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 0.8, segmentsW: 32, segmentsH: 16 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1 }, u_specular: { __type__: 'Color4', r: Math.sin(hue*6.28)*0.5+0.5, g: Math.sin(hue*6.28+2.1)*0.5+0.5, b: Math.sin(hue*6.28+4.2)*0.5+0.5, a: 1 }, u_glossiness: 80, u_reflectivity: 0 } } }] }); }
let gr:{x:number;y:number;z:number};
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.05, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 15 }, rotation: gr={x:0,y:0,z:0}, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width/wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] }, { __type__: 'Object3D', name: 'l', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] }, ...spheres] } };
const vl = logic(v);
ticker.onframe(() => { webgpu.submit(vl.submit); });
