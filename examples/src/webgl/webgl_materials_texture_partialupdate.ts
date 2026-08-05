import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';

/** 纹理局部更新（每帧只重绘 canvas 的一部分）。对照 three.js webgl_materials_texture_partialupdate.html */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const texCanvas = document.createElement('canvas');
texCanvas.width = texCanvas.height = 256;
const tctx = texCanvas.getContext('2d')!;
tctx.fillStyle = '#222'; tctx.fillRect(0, 0, 256, 256);
const tex = createTextureFromCanvas(texCanvas);

let cubeRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 4 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'cube', rotation: cubeRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 2, height: 2, depth: 2 },
                material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }, s_texture: tex as unknown as TextureMaterial['s_texture'] } }] },
        ],
    },
};
const viewLogic = logic(view);
const startTime = Date.now();
ticker.onframe(() =>
{
    const t = (Date.now() - startTime) * 0.003;
    // 局部更新：只画一个小圆圈在移动位置
    const px = 128 + Math.cos(t) * 80;
    const py = 128 + Math.sin(t * 1.3) * 80;
    tctx.fillStyle = `hsla(${(t * 50) % 360}, 80%, 60%, 0.3)`;
    tctx.beginPath(); tctx.arc(px, py, 12, 0, Math.PI * 2); tctx.fill();
    // 触发纹理更新
    (reactive(tex) as { writeTextures: unknown[] }).writeTextures = [{ image: texCanvas }];
    reactive(cubeRot).y += 0.005;
    webgpu.submit(viewLogic.submit);
});
