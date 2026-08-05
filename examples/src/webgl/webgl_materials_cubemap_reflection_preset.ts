import { WebGPU } from '@feng3d/webgpu';
import { createTextureCubeFromUrls, logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const env = await createTextureCubeFromUrls(['/skybox/px.jpg','/skybox/py.jpg','/skybox/pz.jpg','/skybox/nx.jpg','/skybox/ny.jpg','/skybox/nz.jpg']);
let gr:{x:number;y:number;z:number};
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 } }], children: [
  { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 10 }, rotation: gr={x:0,y:0,z:0}, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width/wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 }] },
  { __type__: 'Object3D', name: 'metal', position: { x: -3, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 64, segmentsH: 32 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 }, u_specular: { __type__: 'Color4', r: 0.9, g: 0.9, b: 0.9, a: 1 }, u_glossiness: 100, u_reflectivity: 0.9 }, s_envMap: env as unknown as StandardMaterial['s_envMap'] } }] },
  { __type__: 'Object3D', name: 'plastic', position: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 64, segmentsH: 32 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.2, b: 0.2, a: 1 }, u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_glossiness: 20, u_reflectivity: 0.2 }, s_envMap: env as unknown as StandardMaterial['s_envMap'] } }] },
  { __type__: 'Object3D', name: 'glass', position: { x: 3, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 64, segmentsH: 32 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.3, g: 0.5, b: 0.8, a: 1 }, u_specular: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 }, u_glossiness: 80, u_reflectivity: 0.7 }, s_envMap: env as unknown as StandardMaterial['s_envMap'] } }] },
  { __type__: 'Object3D', name: 'skybox', components: [{ __type__: 'SkyBox', s_skyboxTexture: env as unknown as never }] },
] } };
const vl = logic(v);
ticker.onframe(() => { webgpu.submit(vl.submit); });
