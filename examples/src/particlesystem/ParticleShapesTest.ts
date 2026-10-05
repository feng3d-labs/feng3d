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

/** 一个发射形状示例：形状 + 颜色 */
function makeEmitter(name: string, x: number, shapeType: ParticleSystemShapeType, color: { r: number; g: number; b: number })
{
    return {
        __type__: 'Object3D' as const,
        name,
        position: { x, y: 0, z: 0 },
        components: [{
            ...particleSystemDefault(),
            main: {
                ...particleSystemDefault().main,
                startSpeed: curve(1.6),
                startLifetime: curve(2.5),
                startSize3D: curve3D(0.35),
                maxParticles: 400,
            },
            emission: {
                ...particleSystemDefault().emission,
                rateOverTime: curve(60, true),
            },
            shape: {
                ...particleSystemDefault().shape,
                shapeType,
                angle: 25,
                radius: 0.8,
                box: { x: 2, y: 2, z: 2 },
            },
            colorOverLifetime: {
                ...particleSystemDefault().colorOverLifetime,
                color: {
                    __type__: 'MinMaxGradient' as const,
                    ...particleSystemDefault().colorOverLifetime.color,
                    color: { __type__: 'Color4' as const, ...color, a: 1 },
                },
            },
            material: {
                ...particleSystemDefault().material,
                uniforms: {
                    u_TintColor: { __type__: 'Color4', ...color, a: 1 },
                },
                blend: {
                    color: { srcFactor: 'src-alpha' as const, dstFactor: 'one-minus-src-alpha' as const },
                    alpha: { srcFactor: 'one' as const, dstFactor: 'one-minus-src-alpha' as const },
                },
            },
        }],
    };
}

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
            position: { x: 0, y: 0, z: 14 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        },
            makeEmitter('SphereShape', -4, ParticleSystemShapeType.Sphere, { r: 0.4, g: 0.7, b: 1 }),
            makeEmitter('ConeShape', 0, ParticleSystemShapeType.Cone, { r: 1, g: 0.8, b: 0.3 }),
            makeEmitter('BoxShape', 4, ParticleSystemShapeType.Box, { r: 1, g: 0.4, b: 0.6 }),
        ],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
