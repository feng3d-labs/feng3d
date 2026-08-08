import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';

/** 视频纹理（用 canvas 模拟视频帧动画）。对照 three.js webgl_materials_video.html
 * feng3d 无 VideoTexture，用动态 canvas 2D 动画 → writeTextures 近似。 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const videoCanvas = document.createElement('canvas');
videoCanvas.width = 320; videoCanvas.height = 240;
const vctx = videoCanvas.getContext('2d')!;
const tex = createTextureFromCanvas(videoCanvas);

let planeRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 4 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'screen', rotation: planeRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 3.2, height: 2.4, depth: 0.1 },
                material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }, s_texture: tex as unknown as TextureMaterial['s_texture'] } }] },
        ],
    },
};
const viewLogic = logic(view);
const startTime = Date.now();
ticker.onframe(() =>
{
    const t = (Date.now() - startTime) * 0.001;
    // 模拟视频帧：移动渐变 + 文字
    const grad = vctx.createLinearGradient(0, 0, 320, 240);
    grad.addColorStop(0, `hsl(${(t * 40) % 360}, 70%, 40%)`);
    grad.addColorStop(1, `hsl(${(t * 40 + 120) % 360}, 70%, 30%)`);
    vctx.fillStyle = grad; vctx.fillRect(0, 0, 320, 240);
    vctx.fillStyle = '#fff'; vctx.font = 'bold 36px sans-serif'; vctx.textAlign = 'center';
    vctx.fillText('VIDEO', 160, 100);
    vctx.font = '20px monospace';
    vctx.fillText(`t=${t.toFixed(1)}s`, 160, 150);
    // 移动方块
    vctx.fillStyle = `hsla(${(t * 80) % 360}, 90%, 60%, 0.7)`;
    vctx.fillRect(140 + Math.cos(t * 2) * 80, 190, 40, 30);
    // 触发纹理更新
    (reactive(tex) as { writeTextures: readonly unknown[] }).writeTextures = [{ image: videoCanvas }];
    webgpu.submit(viewLogic.submit);
});
