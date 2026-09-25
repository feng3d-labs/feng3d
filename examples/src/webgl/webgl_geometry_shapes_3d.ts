import { WebGPU } from '@feng3d/webgpu';
import { Shape2, Vector2 } from '@feng3d/math';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
import type { ShapeGeometry, ExtrudeGeometry } from '@feng3d/addons';
import '@feng3d/addons';
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 圆形轮廓（Shape2 实例，ShapeGeometry 契约要求——不接受字符串预设）
const circleShape = new Shape2();
circleShape.absarc(0, 0, 2, 0, Math.PI * 2, false);

// 五角星轮廓：10 个顶点在内外半径间交替
const starPoints: Vector2[] = [];
for (let i = 0; i < 10; i++)
{
    const r = i % 2 === 0 ? 2 : 0.8;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    starPoints.push(new Vector2(Math.cos(a) * r, Math.sin(a) * r));
}
const starShape = new Shape2(starPoints);

let gr:{x:number;y:number;z:number};
const v: View = { __type__: 'View', canvas: wc, root: { __type__: 'Object3D', name: 'U', components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.15, g: 0.15, b: 0.15, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } }], children: [{ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 5, z: 15 }, rotation: gr={x:0,y:0,z:0}, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width/wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 }] }, { __type__: 'Object3D', name: 'l', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] }, { __type__: 'Object3D', name: 'shape1', position: { x: -3, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'ShapeGeometry', shape: circleShape } as ShapeGeometry, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.3, b: 0.3, a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }] }, { __type__: 'Object3D', name: 'shape2', position: { x: 3, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'ShapeGeometry', shape: starShape } as ShapeGeometry, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.3, g: 0.8, b: 0.3, a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }] }] } };
const vl = logic(v);
ticker.onframe(() => { webgpu.submit(vl.submit); });
