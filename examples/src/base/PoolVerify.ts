import { createTextureFromUrl, findByName, logic, reactive, ticker } from 'feng3d';
import type { View } from 'feng3d';
import {
    destroyGpuResourcesOf,
    getGpuBufferPoolStats,
    getGpuTexturePoolStats,
    setGpuBufferPoolEnabled,
    setGpuTexturePoolEnabled,
    WebGPU,
} from '@feng3d/webgpu';

/**
 * GPU 资源池真机验证页（issue #98，**e2e 专用**，不进示例导航）。
 *
 * 为什么需要它：池化的价值（少分配、复用）与风险（画面错位、残留）都只在真实 GPU 上
 * 才看得出来。本页固定相机，用**两张颜色不同的同规格纹理**交替使用：
 * - 颜色可区分 → 复用后若残留了「上一张」的内容，画面颜色会不对（issue #947 的修复即由此暴露）；
 * - 切换时显式销毁被切走的那张（`destroyGpuResourcesOf` → 归还池），制造真实的 churn。
 *
 * URL 参数：
 * - `?pool=1` 打开 buffer / texture 两个池（默认关闭，与发布默认一致）；
 * - `?static=1` 不做 churn（静止在第一张纹理），用于「池化开/关画面逐像素一致」的对比。
 *
 * 就绪后暴露 `window.__poolReady` 与 `window.__poolStats()`（含 `color` 当前纹理颜色）。
 * 由 `e2e/poolVerify.spec.ts` 驱动。
 */

const params = new URLSearchParams(location.search);
const poolEnabled = params.get('pool') === '1';
const staticMode = params.get('static') === '1';

if (poolEnabled)
{
    setGpuBufferPoolEnabled(true);
    setGpuTexturePoolEnabled(true);
}

const canvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

/** 生成一张纯色 canvas 纹理的 data URL（同尺寸、不同颜色） */
function makeColorDataUrl(color: string): string
{
    const source = document.createElement('canvas');

    source.width = 64;
    source.height = 64;
    const context = source.getContext('2d')!;

    context.fillStyle = color;
    context.fillRect(0, 0, 64, 64);

    return source.toDataURL('image/png');
}

const COLOR_A = '#e03030';
const COLOR_B = '#30c060';
const textureA = await createTextureFromUrl(makeColorDataUrl(COLOR_A));
const textureB = await createTextureFromUrl(makeColorDataUrl(COLOR_B));
let current = textureA;
let currentColor = COLOR_A;

const view: View = {
    __type__: 'View',
    canvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 0, z: 6 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Cube',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'TextureMaterial', s_texture: textureA },
            }],
        }],
    },
};
const viewLogic = logic(view);

const cube = findByName(view.root, 'Cube')!;
const material = cube.components![0].material as { s_texture?: unknown };

let frame = 0;
let renders = 0;

ticker.onframe(() =>
{
    renders++;

    // 每 30 帧切一次纹理，并销毁被切走的那张：池化开启时它进入池，切回来时复用
    if (poolEnabled && !staticMode && frame > 30 && frame % 30 === 0)
    {
        const next = current === textureA ? textureB : textureA;
        const prev = current;

        reactive(material).s_texture = next;
        current = next;
        currentColor = next === textureA ? COLOR_A : COLOR_B;
        destroyGpuResourcesOf(prev);
    }
    frame++;

    webgpu.submit(viewLogic.submit);
});

setTimeout(() =>
{
    const host = window as unknown as { __poolReady: boolean; __poolStats: () => unknown };

    host.__poolStats = () => ({
        buffer: getGpuBufferPoolStats(webgpu.device),
        texture: getGpuTexturePoolStats(webgpu.device),
        renders,
        color: currentColor,
    });
    host.__poolReady = true;
}, 3000);
