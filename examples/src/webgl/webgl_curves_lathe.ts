import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
import { Vector2 } from '@feng3d/math';
import type { LatheGeometry } from '@feng3d/addons';
import '@feng3d/addons';

/** 车床旋转曲面（花瓶轮廓绕 Y 轴旋转）。对照 three.js LatheGeometry。 */
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 轮廓点（花瓶形）— 用 Vector2 实例（LatheGeometry 需要向量方法）
const pts2d: Vector2[] = [];
for (let i = 0; i <= 20; i++)
{
    const t = i / 20;
    pts2d.push(new Vector2(
        20 + Math.sin(t * Math.PI * 2) * 15 + Math.sin(t * Math.PI * 4) * 5,
        (t - 0.5) * 80,
    ));
}

let gr: { x: number; y: number; z: number };
const v: View = {
    __type__: 'View', canvas: wc,
    root: {
        __type__: 'Object3D', name: 'U',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.12, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 150 }, rotation: gr = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: wc.width / wc.height, near: 1, far: 1000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 }] },
            { __type__: 'Object3D', name: 'l', position: { x: 1, y: 1, z: 1 },
              components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            { __type__: 'Object3D', name: 'lathe', rotation: { x: 0, y: 0, z: 0 },
              components: [{
                  __type__: 'MeshRenderer',
                  geometry: { __type__: 'LatheGeometry', segments: 32, phiLength: 6.2832, __points: pts2d } as unknown as LatheGeometry,
                  material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.9, g: 0.7, b: 0.3, a: 1 }, u_specular: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 }, u_glossiness: 60, u_reflectivity: 0 } },
              }] },
        ],
    },
};
const vl = logic(v);
ticker.onframe(() => { webgpu.submit(vl.submit); });
