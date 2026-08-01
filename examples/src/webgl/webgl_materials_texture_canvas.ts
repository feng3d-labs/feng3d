import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, Texture, TextureMaterial, View, ticker } from 'feng3d';

/**
 * 用 2D Canvas 作为立方体纹理，鼠标在 canvas 上绘制实时映射到立方体表面。
 *
 * 对照 three.js：examples/webgl_materials_texture_canvas.html
 *
 * 原示例：BoxGeometry + MeshBasicMaterial({ map: CanvasTexture })，旁边一个 128×128
 * 的 2D canvas 接受 pointer 绘制，绘制时 material.map.needsUpdate = true 触发纹理更新。
 *
 * feng3d 适配：
 * - CanvasTexture → createTextureFromCanvas(canvas)
 * - needsUpdate = true → texture.writeTextures = [{ image: canvas }]（响应式触发 GPU 重传）
 * - pointer 绘制逻辑、旋转动画完整保留
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 绘制 canvas（128×128，右上角） ----
const drawingCanvas = document.createElement('canvas');
drawingCanvas.id = 'drawing-canvas';
drawingCanvas.width = 128;
drawingCanvas.height = 128;
drawingCanvas.setAttribute('style', 'position:absolute;background-color:#000;top:0;right:0;z-index:3000;cursor:crosshair;touch-action:none;');
document.body.appendChild(drawingCanvas);
const ctx = drawingCanvas.getContext('2d')!;
// 白底
ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, 128, 128);

// ---- 创建纹理（canvas 作为 image source） ----
const canvasTexture: Texture = {
    descriptor: { size: [128, 128], format: 'rgba8unorm' },
    sources: [{ image: drawingCanvas }],
} as Texture;

// ---- 立方体（旋转动画） ----
let cubeRot: { readonly x: number; readonly y: number; readonly z: number };
const cubeNode: Object3D = {
    __type__: 'Object3D',
    name: 'cube',
    rotation: cubeRot = { x: 0, y: 0, z: 0 },
    components: [{
        __type__: 'MeshRenderer',
        geometry: { __type__: 'CubeGeometry', width: 200, height: 200, depth: 200 },
        material: {
            __type__: 'TextureMaterial',
            uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
            s_texture: canvasTexture as unknown as TextureMaterial['s_texture'],
        },
    }],
};

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 500 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 50,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 2000,
                }],
            },
            cubeNode,
        ],
    },
};

const viewLogic = logic(view);

// ---- 绘制交互（对应原示例 setupCanvasDrawing） ----
let paint = false;
const drawStartPos = { x: 0, y: 0 };

drawingCanvas.addEventListener('pointerdown', (e: PointerEvent) =>
{
    paint = true;
    drawStartPos.x = e.offsetX;
    drawStartPos.y = e.offsetY;
});
drawingCanvas.addEventListener('pointermove', (e: PointerEvent) =>
{
    if (paint) draw(e.offsetX, e.offsetY);
});
drawingCanvas.addEventListener('pointerup', () => { paint = false; });
drawingCanvas.addEventListener('pointerleave', () => { paint = false; });

function draw(x: number, y: number): void
{
    ctx.moveTo(drawStartPos.x, drawStartPos.y);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineTo(x, y);
    ctx.stroke();
    drawStartPos.x = x;
    drawStartPos.y = y;
    // 触发纹理更新（对应 three.js material.map.needsUpdate = true）
    (reactive(canvasTexture) as { writeTextures: unknown[] }).writeTextures = [{ image: drawingCanvas }];
}

// ---- animate（立方体旋转） ----
ticker.onframe(() =>
{
    reactive(cubeRot).x += 0.01;
    reactive(cubeRot).y += 0.01;
    webgpu.submit(viewLogic.submit);
});
