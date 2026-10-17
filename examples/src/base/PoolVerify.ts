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
 * 才看得出来。本页固定相机、预加载两张**同规格**纹理交替使用，并在切换时显式销毁
 * 被切走的那张（`destroyGpuResourcesOf` → 归还池），制造「销毁 → 重建」的真实 churn；
 * 池化开启时，重建会命中池。
 *
 * URL 参数：`?pool=1` 打开 buffer / texture 两个池（默认关闭，与发布默认一致）。
 * 就绪后暴露：
 * - `window.__poolReady`：布尔，渲染若干帧后置 true；
 * - `window.__poolStats()`：两个池的读数 + 渲染帧数。
 *
 * 由 `e2e/poolVerify.spec.ts` 驱动。
 */

const params = new URLSearchParams(location.search);
const poolEnabled = params.get('pool') === '1';

if (poolEnabled)
{
    setGpuBufferPoolEnabled(true);
    setGpuTexturePoolEnabled(true);
}

const canvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 两张同规格纹理（同一张图加载两次 → 两个不同的数据对象，池键相同）
const textureUrl = '/hellknight/hellknight_diffuse.jpg';
const textureA = await createTextureFromUrl(textureUrl);
const textureB = await createTextureFromUrl(textureUrl);
let current = textureA;

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
    if (poolEnabled && frame % 30 === 0)
    {
        const next = current === textureA ? textureB : textureA;
        const prev = current;

        reactive(material).s_texture = next;
        current = next;
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
    });
    host.__poolReady = true;
}, 3000);
