import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';

/** HTML 内容作为纹理（动态 canvas → 纹理更新）。对照 three.js webgl_materials_texture_html.html */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 动态 HTML canvas（模拟网页内容：渐变背景 + 文字 + 时间）
const htmlCanvas = document.createElement('canvas');
htmlCanvas.width = 512; htmlCanvas.height = 512;
const hctx = htmlCanvas.getContext('2d')!;
function drawHTMLContent()
{
    const t = Date.now() * 0.001;
    // 渐变背景
    const grad = hctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, `hsl(${(t * 30) % 360}, 70%, 30%)`);
    grad.addColorStop(1, `hsl(${(t * 30 + 120) % 360}, 70%, 20%)`);
    hctx.fillStyle = grad;
    hctx.fillRect(0, 0, 512, 512);
    // 文字
    hctx.fillStyle = '#fff';
    hctx.font = 'bold 48px sans-serif';
    hctx.textAlign = 'center';
    hctx.fillText('feng3d', 256, 200);
    hctx.font = '24px monospace';
    hctx.fillText(new Date().toLocaleTimeString(), 256, 260);
    // 圆形装饰
    for (let i = 0; i < 5; i++)
    {
        const a = t + i * 1.2;
        hctx.beginPath();
        hctx.arc(256 + Math.cos(a) * 150, 360 + Math.sin(a) * 30, 20, 0, Math.PI * 2);
        hctx.fillStyle = `hsla(${(t * 60 + i * 72) % 360}, 80%, 60%, 0.7)`;
        hctx.fill();
    }
}
drawHTMLContent();
const htmlTex = createTextureFromCanvas(htmlCanvas);

let cubeRot: { readonly x: number; readonly y: number; readonly z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 5 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'cube', rotation: cubeRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 2, height: 2, depth: 2 },
                material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }, s_texture: htmlTex as unknown as TextureMaterial['s_texture'] } }] },
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() =>
{
    drawHTMLContent();
    // 触发纹理更新（writeTextures）
    (reactive(htmlTex) as { writeTextures: readonly unknown[] }).writeTextures = [{ image: htmlCanvas }];
    reactive(cubeRot).y += 0.005;
    webgpu.submit(viewLogic.submit);
});
