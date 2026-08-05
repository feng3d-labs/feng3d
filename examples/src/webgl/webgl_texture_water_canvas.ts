import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';

/** 水面波纹纹理（canvas 2D 正弦波纹动画）。 */
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const tc = document.createElement('canvas'); tc.width = 256; tc.height = 256; const tx = tc.getContext('2d')!;
const tex = createTextureFromCanvas(tc);
let cr: { x: number; y: number; z: number };
const v: View = {
    __type__: 'View', canvas: wc,
    root: {
        __type__: 'Object3D', name: 'U',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.05, g: 0.1, b: 0.15, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 5 }, rotation: cr = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'plane', rotation: cr = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 4, height: 4, depth: 0.3 }, material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 0.5, g: 0.8, b: 1, a: 1 } }, s_texture: tex as unknown as TextureMaterial['s_texture'] } }] },
        ],
    },
};
const vl = logic(v);
ticker.onframe(() => {
    const t = Date.now() * 0.002;
    const img = tx.createImageData(256, 256);
    for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
            const i = (y * 256 + x) * 4;
            const wave = Math.sin(x * 0.05 + t * 2) * Math.cos(y * 0.05 + t * 1.5);
            const v2 = (wave * 0.5 + 0.5) * 200 + 30;
            img.data[i] = v2 * 0.3; img.data[i + 1] = v2 * 0.6; img.data[i + 2] = v2 * 0.9; img.data[i + 3] = 255;
        }
    }
    tx.putImageData(img, 0, 0);
    (reactive(tex) as { writeTextures: unknown[] }).writeTextures = [{ image: tc }];
    reactive(cr).y += 0.003;
    webgpu.submit(vl.submit);
});
