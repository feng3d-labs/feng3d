import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';

/**
 * ASCII 艺术渲染（简化版）。
 *
 * 对照 three.js：examples/webgl_effects_ascii.html
 * 原示例用 AsciiEffect 把渲染结果转为 ASCII 字符。feng3d 无此后处理，
 * 用 2D canvas 实时采样 WebGPU canvas → 灰度 → ASCII 字符 → 显示在覆盖 canvas 上。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 创建 ASCII 覆盖 canvas（半透明，覆盖在 webgpu canvas 上）
const asciiCanvas = document.createElement('canvas');
asciiCanvas.width = webgpuCanvas.clientWidth;
asciiCanvas.height = webgpuCanvas.clientHeight;
asciiCanvas.setAttribute('style', 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;background:#000;');
document.body.appendChild(asciiCanvas);
const asciiCtx = asciiCanvas.getContext('2d')!;

// 棋盘格纹理
const checkerCanvas = document.createElement('canvas');
checkerCanvas.width = checkerCanvas.height = 64;
const cctx = checkerCanvas.getContext('2d')!;
cctx.fillStyle = '#888'; cctx.fillRect(0, 0, 64, 64);
cctx.fillStyle = '#ccc'; cctx.fillRect(0, 0, 32, 32); cctx.fillRect(32, 32, 32, 32);
const checkerTex = createTextureFromCanvas(checkerCanvas);

let torusRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 5 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }] },
            { __type__: 'Object3D', name: 'torus', rotation: torusRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'TorusGeometry', radius: 1.5, tubeRadius: 0.5, segmentsR: 32, segmentsT: 8 },
                material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }, s_texture: checkerTex as unknown as TextureMaterial['s_texture'] } }] },
        ],
    },
};

const viewLogic = logic(view);

// ASCII 字符集（从暗到亮）
const ASCII_CHARS = ' .:-=+*#%@';
const CELL = 8; // 每个 ASCII 字符占 8×8 像素

ticker.onframe(() =>
{
    reactive(torusRot).x += 0.01;
    reactive(torusRot).y += 0.02;
    webgpu.submit(viewLogic.submit);

    // 采样 webgpu canvas → ASCII
    const w = webgpuCanvas.width, h = webgpuCanvas.height;
    asciiCanvas.width = w; asciiCanvas.height = h;
    // 用临时 canvas 读取 WebGPU 内容
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tctx = tmp.getContext('2d')!;
    tctx.drawImage(webgpuCanvas, 0, 0);
    asciiCtx.fillStyle = '#000';
    asciiCtx.fillRect(0, 0, w, h);
    asciiCtx.font = `${CELL}px monospace`;
    asciiCtx.textBaseline = 'top';
    for (let y = 0; y < h; y += CELL)
    {
        for (let x = 0; x < w; x += CELL)
        {
            const d = tctx.getImageData(x + CELL / 2, y + CELL / 2, 1, 1).data;
            const gray = (d[0] + d[1] + d[2]) / 3;
            const idx = Math.min(Math.floor(gray / 256 * ASCII_CHARS.length), ASCII_CHARS.length - 1);
            const ch = ASCII_CHARS[idx];
            if (ch !== ' ')
            {
                asciiCtx.fillStyle = `rgb(${gray|0},${gray|0},${gray|0})`;
                asciiCtx.fillText(ch, x, y);
            }
        }
    }
});
