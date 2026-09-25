import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const walls: Object3D[] = []; const SZ = 10; const CELL = 4;
// 简单迷宫：边界墙 + 随机内部墙
for (let i = 0; i < SZ; i++) for (let j = 0; j < SZ; j++) { if (i === 0 || j === 0 || i === SZ - 1 || j === SZ - 1 || Math.random() < 0.3) { walls.push({ __type__: 'Object3D', name: 'w' + i + '_' + j, position: { x: (i - SZ / 2) * CELL, y: 1.5, z: (j - SZ / 2) * CELL }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: CELL * 0.9, height: 3, depth: CELL * 0.9 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.4 + Math.random() * 0.2, g: 0.3, b: 0.5, a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }] }); } }
let gr: { x: number; y: number; z: number };
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.08, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 30, z: 40 }, rotation: gr = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 0.1, far: 200 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.3 }] }, { __type__: 'Object3D', name: 'l', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] }, ...walls] } };
const vl = logic(v);
ticker.onframe(() => { reactive(gr).y += 0.001; webgpu.submit(vl.submit); });
