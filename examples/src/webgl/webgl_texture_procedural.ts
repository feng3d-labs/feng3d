import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
function makeChecker() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!; for (let y=0; y<256; y+=32) for (let xx=0; xx<256; xx+=32) { x.fillStyle = ((xx/32+y/32)%2) ? '#fff' : '#333'; x.fillRect(xx,y,32,32); } return c; }
function makeNoise() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!; const img = x.createImageData(256,256); for (let i=0; i<img.data.length; i+=4) { const v = Math.random()*255; img.data[i]=v; img.data[i+1]=v; img.data[i+2]=v; img.data[i+3]=255; } x.putImageData(img,0,0); return c; }
function makeGradient() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!; const g = x.createLinearGradient(0,0,256,256); g.addColorStop(0,'#f00'); g.addColorStop(0.5,'#0f0'); g.addColorStop(1,'#00f'); x.fillStyle = g; x.fillRect(0,0,256,256); return c; }
const textures = [createTextureFromCanvas(makeChecker()), createTextureFromCanvas(makeNoise()), createTextureFromCanvas(makeGradient())];
let idx = 0;
let cr:{x:number;y:number;z:number};
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 5 }, rotation: cr={x:0,y:0,z:0}, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width/wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] }, { __type__: 'Object3D', name: 'plane', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 3, height: 3, depth: 0.2 }, material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }, s_texture: textures[0] as unknown as TextureMaterial['s_texture'] } }] }] } };
const vl = logic(v);
setInterval(() => { idx = (idx+1)%3; reactive(v.root!.children![1].components![0] as { material: { s_texture: unknown } }).material.s_texture = textures[idx]; }, 2000);
ticker.onframe(() => { reactive(cr).y += 0.005; webgpu.submit(vl.submit); });
