import { WebGPU, getGPUDeviceStats } from '@feng3d/webgpu';
import { getComputedEvalCount, ticker, View, logic } from 'feng3d';

/**
 * 静态场景 benchmark（框架设计文档 G2「最小计算」的量化标尺）。
 *
 * - 场景：N 个 ColorMaterial 立方体网格，无动画、无交互、无异步资源。
 *   geometry/material 为共享对象（同一 raw 对象），排除每对象管线差异的噪声，
 *   聚焦测量变换/派生/渲染链的每帧开销。
 * - 规模：URL 参数 ?count=N（默认 1000，建议 200 / 1000 / 5000 三档）。
 * - 每秒输出：帧数、平均/最大帧时间、computed 求值次数（总量与每帧均值）、
 *   GPU 资源存活计数与显存。
 * - 验收参考（改造计划阶段 1）：静态场景每帧 computed 求值次数应趋近 0。
 */
const params = new URLSearchParams(location.search);
const count = Math.max(1, parseInt(params.get('count') ?? '1000', 10) || 1000);

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化WebGPU

// ---- 静态场景数据（纯 JSON 声明） ----

// 共享 geometry / material（同一对象被多个 MeshRenderer 引用）
const geometry = { __type__: 'CubeGeometry', width: 1, height: 1, depth: 1 } as const;
const material = {
    __type__: 'ColorMaterial',
    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.7, g: 0.6, b: 0.5, a: 1 } },
} as const;

// 网格布局：sqrt(N) x sqrt(N)，间距 3，中心对齐原点
const side = Math.ceil(Math.sqrt(count));
const half = (side - 1) * 3 / 2;
const children: any[] = [];
for (let i = 0; i < count; i++)
{
    children.push({
        __type__: 'Object3D',
        name: `Cube-${i}`,
        position: { x: (i % side) * 3 - half, y: Math.floor(i / side) * 3 - half, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry,
            material,
        }],
    });
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 0, z: side * 3 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        }, ...children],
    },
};
const viewLogic = logic(view);

// ---- 每秒采样：帧时间 / computed 求值 / GPU 资源 ----
{
    let frameTimes: number[] = [];
    let lastFrame = performance.now();
    let maxFrame = 0;
    let evalsLast = 0;

    ticker.onframe(() =>
    {
        const now = performance.now();
        const dt = now - lastFrame;
        lastFrame = now;
        frameTimes.push(dt);
        if (dt > maxFrame) maxFrame = dt;
    });

    setInterval(() =>
    {
        if (frameTimes.length === 0) return;
        const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const evalsTotal = getComputedEvalCount();
        const evalsDelta = evalsTotal - evalsLast;
        console.log(`[Benchmark count=${count}] ${frameTimes.length}帧 平均${avg.toFixed(2)}ms 最大${maxFrame.toFixed(2)}ms computed求值 ${evalsDelta}（${(evalsDelta / frameTimes.length).toFixed(1)}/帧）`);
        frameTimes = [];
        maxFrame = 0;
        evalsLast = evalsTotal;

        const d = webgpu.device;
        if (d)
        {
            const s = getGPUDeviceStats(d);
            console.log(`[Benchmark GPU] buffer=${s.buffer.count} texture=${s.texture.count} renderPipeline=${s.renderPipeline.count} bindGroup=${s.bindGroup.count} mem=${(s.totalMemory / 1024).toFixed(1)}KB`);
        }
    }, 1000);
}

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
