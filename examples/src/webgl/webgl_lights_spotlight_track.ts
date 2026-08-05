import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/** 聚光灯追踪移动球体。 */
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const v: View = {
    __type__: 'View', canvas: wc,
    root: {
        __type__: 'Object3D', name: 'U',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.03, g: 0.03, b: 0.03, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 5, y: 5, z: 10 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'floor', position: { x: 0, y: -0.05, z: 0 }, rotation: { x: -1.5708, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PlaneGeometry', width: 20, height: 20 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }] },
            { __type__: 'Object3D', name: 'ball', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 0.5, segmentsW: 32, segmentsH: 16 },
              material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 1, g: 0.6, b: 0.2, a: 1 }, u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_glossiness: 30, u_reflectivity: 0 } } }] },
            { __type__: 'Object3D', name: 'spot', position: { x: 0, y: 5, z: 0 },
              components: [{ __type__: 'SpotLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 20, range: 30, angle: 25, penumbra: 0.3 }] },
        ],
    },
};
const vl = logic(v); const ball = v.root!.children![2]; const spot = v.root!.children![3];
ticker.onframe(() => { const t = Date.now() * 0.001; const bx = Math.cos(t) * 4; const bz = Math.sin(t) * 4; reactive(ball).position = { x: bx, y: 0.5, z: bz }; reactive(spot).position = { x: bx, y: 5, z: bz }; webgpu.submit(vl.submit); });
