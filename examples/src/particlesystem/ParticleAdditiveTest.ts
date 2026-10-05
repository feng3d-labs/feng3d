import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker, View } from 'feng3d';
import { ParticleSystemShapeType, particleSystemDefault } from '@feng3d/particlesystem';
import { minMaxCurveDefault, minMaxCurveVector3Default } from '@feng3d/math';


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
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.03, a: 1.0 },
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
            name: 'Flame',
            position: { x: 0, y: -2.5, z: 0 },
            components: [{
                ...particleSystemDefault(),
                main: {
                    ...particleSystemDefault().main,
                    startSpeed: curve(1.6),
                    startLifetime: curve(2),
                    startSize3D: curve3D(0.7),
                    maxParticles: 500,
                },
                // 高发射率 + 加性混合 = 火焰
                emission: {
                    ...particleSystemDefault().emission,
                    rateOverTime: curve(120, true),
                },
                shape: {
                    ...particleSystemDefault().shape,
                    shapeType: ParticleSystemShapeType.Cone,
                    angle: 14,
                    radius: 0.25,
                },
                colorOverLifetime: {
                    ...particleSystemDefault().colorOverLifetime,
                    color: {
                        __type__: 'MinMaxGradient',
                        ...particleSystemDefault().colorOverLifetime.color,
                        color: { __type__: 'Color4', r: 1, g: 0.55, b: 0.12, a: 1 },
                    },
                },
                material: {
                    ...particleSystemDefault().material,
                    uniforms: {
                        u_TintColor: { __type__: 'Color4', r: 1, g: 0.72, b: 0.28, a: 1 },
                    },
                    // 加性混合：粒子亮度叠加，形成发光核心
                    blend: {
                        color: { srcFactor: 'one', dstFactor: 'one' },
                        alpha: { srcFactor: 'one', dstFactor: 'one' },
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
