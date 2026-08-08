import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';

/** 渐变纹理动画（canvas 水平渐变色相流动）。 */
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const tc = document.createElement('canvas'); tc.width = 256; tc.height = 256; const tx = tc.getContext('2d')!;
const tex = createTextureFromCanvas(tc);
let cr: { x: number; y: number; z: number };
const v: View = {
    __type__: 'View', canvas: wc,
    root: {
        __type__: 'Object3D', name: 'U',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 5 }, rotation: cr = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'cube', rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 3, height: 3, depth: 3 }, material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }, s_texture: tex as unknown as TextureMaterial['s_texture'] } }] },
        ],
    },
};
const vl = logic(v);
ticker.onframe(() => { const t = Date.now() * 0.001; const g = tx.createLinearGradient(0, 0, 256, 256); g.addColorStop(0, 'hsl(' + (t * 30 % 360) + ',80%,50%)'); g.addColorStop(0.5, 'hsl(' + (t * 30 + 120) % 360 + ',80%,40%)'); g.addColorStop(1, 'hsl(' + (t * 30 + 240) % 360 + ',80%,30%)'); tx.fillStyle = g; tx.fillRect(0, 0, 256, 256); (reactive(tex) as { writeTextures: readonly unknown[] }).writeTextures = [{ image: tc }]; reactive(cr).y += 0.005; webgpu.submit(vl.submit); });
