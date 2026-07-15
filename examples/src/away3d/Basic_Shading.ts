import { Object3D, reactive, ticker, Texture2D, View, logic, Vector3, getWebGPU } from 'feng3d';
import { getGPUDeviceStats } from '@feng3d/webgpu';

function tex(url: string) { const t = new Texture2D(); t.source = { url }; return t; }

const sceneObject3D: Object3D = {
    __type__: 'Object3D',
    name: 'Untitled',
    components: [{
        __type__: 'Scene',
        background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
        ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 0.2 },
    }],
    children: [{
        __type__: 'Object3D',
        name: 'Main Camera',
        position: { x: 0, y: 5, z: -10 },
        components: [{
            __type__: 'Camera',
        }, {
            __type__: 'FPSController',
        }],
    }, {
        __type__: 'Object3D',
        name: 'light1',
        rotation: { x: 30, y: 0, z: 0 },
        components: [{
            __type__: 'DirectionalLight',
            intensity: 0.7,
            color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
            shadowType: 1,
        }],
    }, {
        __type__: 'Object3D',
        name: 'light2',
        rotation: { x: 90, y: 0, z: 0 },
        components: [{
            __type__: 'DirectionalLight',
            intensity: 0.7,
            color: { __type__: 'Color3', r: 0, g: 1, b: 1 },
        }],
    }, {
        __type__: 'Object3D',
        name: 'plane',
        position: { x: 0, y: -0.2, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'PlaneGeometry', width: 10, height: 10, segmentsW: 1, segmentsH: 1, scaleU: 2, scaleV: 2 },
            material: {
                __type__: 'StandardMaterial',
                s_diffuse: tex('/floor_diffuse.jpg'),
                s_normal: tex('/floor_normal.jpg'),
                s_specular: tex('/floor_specular.jpg'),
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
                s_diffuse: tex('/beachball_diffuse.jpg'),
                s_specular: tex('/beachball_specular.jpg'),
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
                s_diffuse: tex('/trinket_diffuse.jpg'),
                s_normal: tex('/trinket_normal.jpg'),
                s_specular: tex('/trinket_specular.jpg'),
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
                s_diffuse: tex('/weave_diffuse.jpg'),
                s_normal: tex('/weave_normal.jpg'),
                s_specular: tex('/weave_diffuse.jpg'),
            },
        }],
    }],
};

const engine = new View(null, sceneObject3D);

// 相机看向原点
const camera = sceneObject3D.children!.find(c => c.name === 'Main Camera')!;
logic(camera).lookAt(new Vector3(0, 0, 0));

// 光源旋转
const light1 = sceneObject3D.children!.find(c => c.name === 'light1')!;
ticker.onframe(() =>
{
    reactive(light1.rotation).y += 1;
});

// ---- GPU 内存泄漏分析 ----
// 每秒采样一次 GPUDeviceStats，输出各资源 created/freed/count 和显存，
// 观察 created 是否持续增长而 count 趋于稳定（= 持续创建未释放 = 泄漏）。
{
    const device = () => getWebGPU()?.device;
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
