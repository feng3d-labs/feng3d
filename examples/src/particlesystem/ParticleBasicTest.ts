import { WebGPU } from '@feng3d/webgpu';
import { minMaxCurveDefault, minMaxCurveVector3Default } from '@feng3d/math';
import { logic, ticker, View } from 'feng3d';
// 副作用导入：ParticleSystem 组件类型、粒子材质与着色器由本包注册
import { particleSystemDefault } from '@feng3d/particlesystem';


/** 造「常量」曲线（原 `{ constant: v }` 的完整形态） */
function curve(v: number, between0And1 = false)
{
    return { __type__: 'MinMaxCurve' as const, ...minMaxCurveDefault(), between0And1, constant: v, constantMin: v, constantMax: v };
}

/** 造「三轴同值」的曲线（原 `startSize: { constant: v }` 的等价物） */
function curve3D(v: number)
{
    return { __type__: 'MinMaxCurveVector3' as const, ...minMaxCurveVector3Default(), xCurve: curve(v, true), yCurve: curve(v, true), zCurve: curve(v, true) };
}

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化WebGPU

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.08, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 0, z: 10 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        }, {
            __type__: 'Object3D',
            name: 'Particles',
            position: { x: 0, y: -3, z: 0 },
            // 纯数据化后：默认工厂展开 + 覆盖关心的字段（不再需要类型断言）
            components: [{
                ...particleSystemDefault(),
                main: {
                    ...particleSystemDefault().main,
                    startSpeed: curve(3),
                    startLifetime: curve(3),
                    startSize3D: curve3D(0.8),
                    maxParticles: 600,
                },
                emission: {
                    ...particleSystemDefault().emission,
                    rateOverTime: curve(90, true),
                },
                material: {
                    ...particleSystemDefault().material,
                    // alpha 混合：粒子贴图是径向衰减的圆点，不混合会看到方片黑底
                    uniforms: {
                        u_TintColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                    },
                    blend: {
                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
                    },
                },
            }],
        }],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
