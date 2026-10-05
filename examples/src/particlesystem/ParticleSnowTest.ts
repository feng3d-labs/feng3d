import { WebGPU } from '@feng3d/webgpu';
import { minMaxCurveDefault, minMaxCurveVector3Default } from '@feng3d/math';
import type { MinMaxCurve, MinMaxCurveVector3 } from '@feng3d/math';
import { logic, ticker, View } from 'feng3d';
import { ParticleSystemShapeType, ParticleSystemSimulationSpace, particleSystemDefault } from '@feng3d/particlesystem';

/**
 * Unity 风格粒子效果 · 落雪。
 *
 * - \`shape\`：Box（8×6×8 的体积）作为"下雪的天空箱"；
 * - \`main.startSpeed\` 很小（0.4）+ \`gravityModifier\` 0.06，雪花几乎匀速缓降；
 * - \`noise\` 给 0.5 的横向扰动 + 0.12 的滚动速度，雪花左右飘而不是直线掉；
 * - \`rotationOverLifetime\` 让每片雪花缓慢自转；
 * - 材质走 **alpha 混合**（半透明白）。
 */
/** 造「常量」曲线 */
function curve(v: number, between0And1 = false): MinMaxCurve
{
    return { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1, constant: v, constantMin: v, constantMax: v };
}

/** 三条轴共用同一条曲线 */
function curve3D(c: MinMaxCurve): MinMaxCurveVector3
{
    return { __type__: 'MinMaxCurveVector3', ...minMaxCurveVector3Default(), xCurve: c, yCurve: c, zCurve: c };
}

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.03, g: 0.05, b: 0.1, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 2, z: 12 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Snow',
            position: { x: 0, y: 4, z: 0 },
            components: [{
                ...particleSystemDefault(),
                main: {
                    ...particleSystemDefault().main,
                    duration: 6,
                    startSpeed: curve(0.4),
                    startLifetime: curve(6),
                    startSize3D: curve3D(curve(0.16, true)),
                    maxParticles: 1500,
                    gravityModifier: curve(0.06),
                    simulationSpace: ParticleSystemSimulationSpace.World,
                },
                emission: {
                    ...particleSystemDefault().emission,
                    rateOverTime: curve(70, true),
                },
                shape: {
                    ...particleSystemDefault().shape,
                    shapeType: ParticleSystemShapeType.Box,
                    box: { x: 9, y: 6, z: 9 },
                },
                noise: {
                    ...particleSystemDefault().noise,
                    separateAxes: false,
                    strength3D: curve3D(curve(0.55, true)),
                    frequency: 0.32,
                    scrollSpeed: curve(0.12),
                    damping: true,
                },
                rotationOverLifetime: {
                    ...particleSystemDefault().rotationOverLifetime,
                    separateAxes: true,
                    angularVelocity: curve3D(curve(0.6)),
                },
                material: {
                    ...particleSystemDefault().material,
                    uniforms: {
                        u_TintColor: { __type__: 'Color4', r: 0.95, g: 0.97, b: 1, a: 1 },
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
