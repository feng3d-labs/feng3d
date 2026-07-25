import { Object3D, ticker, createTextureFromUrl, View, logic, Vector3 } from 'feng3d';
import { getGPUDeviceStats, WebGPU } from '@feng3d/webgpu';

let camera: Object3D;

// createTextureFromUrl 返回 Promise<Texture>；用 await 收齐后再构造 View
const tex = (url: string) => createTextureFromUrl(url);

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化WebGPU

// 先 await 所有纹理 Promise，再构造 View（createTextureFromUrl 是 Promise 工厂，
// 在创建时即 resolve；保留此 await 确保数据就绪）
const [
    floor_diffuse, floor_normal, floor_specular,
    beachball_diffuse, beachball_specular,
    trinket_diffuse, trinket_normal, trinket_specular,
    weave_diffuse, weave_normal,
] = await Promise.all([
    tex('/floor_diffuse.jpg'), tex('/floor_normal.jpg'), tex('/floor_specular.jpg'),
    tex('/beachball_diffuse.jpg'), tex('/beachball_specular.jpg'),
    tex('/trinket_diffuse.jpg'), tex('/trinket_normal.jpg'), tex('/trinket_specular.jpg'),
    tex('/weave_diffuse.jpg'), tex('/weave_normal.jpg'),
]);

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
            ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 0.2 },
        }],
        children: [camera = {
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 5, z: -10 },
            components: [{
                __type__: 'PerspectiveCamera',
            }, {
                __type__: 'FPSController',
            }],
        }, {
            __type__: 'Object3D',
            name: 'light1',
            rotation: { x: 90, y: 0, z: 0 },
            components: [{
                __type__: 'DirectionalLight',
                intensity: 0.7,
                color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                shadowType: 1,
            }],
        // }, {
        //     __type__: 'Object3D',
        //     name: 'light2',
        //     rotation: { x: 90, y: 0, z: 0 },
        //     components: [{
        //         __type__: 'DirectionalLight',
        //         intensity: 0.7,
        //         color: { __type__: 'Color3', r: 0, g: 1, b: 1 },
        //     }],
        }, {
            __type__: 'Object3D',
            name: 'plane',
            position: { x: 0, y: -0.2, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                castShadows: false,
                geometry: { __type__: 'PlaneGeometry', width: 50, height: 50, segmentsW: 1, segmentsH: 1, scaleU: 10, scaleV: 10 },
                material: {
                    __type__: 'StandardMaterial',
                    s_diffuse: floor_diffuse,
                    s_normal: floor_normal,
                    s_specular: floor_specular,
                },
            }],
        }, {
            __type__: 'Object3D',
            name: 'sphere',
            position: { x: 3, y: 1.6, z: 3 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 40, segmentsH: 20 },
                material: {
                    __type__: 'StandardMaterial',
                    s_diffuse: beachball_diffuse,
                    s_specular: beachball_specular,
                },
            }],
        }, {
            __type__: 'Object3D',
            name: 'cube',
            position: { x: 3, y: 1.6, z: -2.5 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry', width: 2, height: 2, depth: 2 },
                material: {
                    __type__: 'StandardMaterial',
                    s_diffuse: trinket_diffuse,
                    s_normal: trinket_normal,
                    s_specular: trinket_specular,
                },
            }],
        }, {
            __type__: 'Object3D',
            name: 'torus',
            position: { x: -2.5, y: 1.6, z: -2.5 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'TorusGeometry', radius: 1.5, tubeRadius: 0.6, segmentsR: 40, segmentsT: 20, scaleU: 10, scaleV: 5 },
                material: {
                    __type__: 'StandardMaterial',
                    s_diffuse: weave_diffuse,
                    s_normal: weave_normal,
                    s_specular: weave_diffuse,
                },
            }],
        }],
    },
};
const viewLogic = logic(view);

// 相机看向原点
logic(camera).lookAt(new Vector3(0, 0, 0));

// 光源静止（从正上方垂直照射，验证 shadow map 覆盖范围）

// ---- GPU 内存泄漏分析 ----
// 每秒采样一次 GPUDeviceStats，输出各资源 created/freed/count 和显存，
// 观察 created 是否持续增长而 count 趋于稳定（= 持续创建未释放 = 泄漏）。
{
    const device = () => webgpu.device;
    let prev: any = null;
    let sampleIndex = 0;
    const sample = () =>
    {
        const d = device();
        if (!d) return;
        const s = getGPUDeviceStats(d);
        const snap = {
            texture: `${s.texture.created}/${s.texture.freed}/${s.texture.count}`,
            buffer: `${s.buffer.created}/${s.buffer.freed}/${s.buffer.count}`,
            textureView: `${s.textureView.created}/${s.textureView.freed}/${s.textureView.count}`,
            sampler: `${s.sampler.created}/${s.sampler.freed}/${s.sampler.count}`,
            renderPipeline: `${s.renderPipeline.created}/${s.renderPipeline.freed}/${s.renderPipeline.count}`,
            bindGroup: `${s.bindGroup.created}/${s.bindGroup.freed}/${s.bindGroup.count}`,
            bindGroupLayout: `${s.bindGroupLayout.created}/${s.bindGroupLayout.freed}/${s.bindGroupLayout.count}`,
            pipelineLayout: `${s.pipelineLayout.created}/${s.pipelineLayout.freed}/${s.pipelineLayout.count}`,
            shaderModule: `${s.shaderModule.created}/${s.shaderModule.freed}/${s.shaderModule.count}`,
            mem: `${(s.totalMemory / 1024).toFixed(1)}KB (tex ${(s.textureMemory / 1024).toFixed(1)}KB + buf ${(s.bufferMemory / 1024).toFixed(1)}KB)`,
        };

        let diff = '';
        if (prev)
        {
            const changed = Object.keys(snap).filter(k => snap[k] !== prev[k]);
            if (changed.length) diff = ' 变化:' + changed.map(k => `${k} ${prev[k]}→${snap[k]}`).join(', ');
        }
        console.log(`[GPU统计 #${sampleIndex}] c/f/存活 → ${Object.entries(snap).map(([k, v]) => `${k}=${v}`).join(' ')}${diff}`);
        prev = snap;
        sampleIndex++;
    };

    // 等 WebGPU 就绪后开始，每秒采样，共采 15 次
    const waitAndSample = () =>
    {
        if (device())
        {
            sample();
            setInterval(sample, 1000);
        }
        else
        {
            setTimeout(waitAndSample, 200);
        }
    };
    waitAndSample();
}

// ---- 帧时间性能监控 ----
// 每秒输出：平均帧时间(ms)、最大帧时间(ms)、帧数。定位卡顿来源（渲染慢/GC/响应式重算）。
{
    let frameTimes: number[] = [];
    let lastFrame = performance.now();
    let maxFrame = 0;
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
        console.log(`[性能] ${frameTimes.length}帧 平均${avg.toFixed(1)}ms 最大${maxFrame.toFixed(1)}ms`);
        frameTimes = [];
        maxFrame = 0;
    }, 1000);
}


ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
