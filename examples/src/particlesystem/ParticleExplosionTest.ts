import { WebGPU } from '@feng3d/webgpu';
import { animationCurveDefault, gradientDefault, GradientMode, minMaxCurveDefault, minMaxCurveVector3Default, minMaxGradientDefault, MinMaxCurveMode, MinMaxGradientMode } from '@feng3d/math';
import type { MinMaxCurve, MinMaxCurveVector3, MinMaxGradient } from '@feng3d/math';
import { logic, ticker, View } from 'feng3d';
import { ParticleSystemShapeType, ParticleSystemSimulationSpace, particleEmissionBurstDefault, particleSystemDefault } from '@feng3d/particlesystem';

/**
 * Unity 风格粒子效果 · 爆炸 / 烟花。
 *
 * 与持续发射的效果不同，它靠**爆发**发射：
 * - \`emission.bursts\`：每次循环在 t=0 爆发 260 颗（\`rateOverTime\` 归零）；
 * - \`shape\`：SphereShell，粒子从球面各向均匀飞出；
 * - \`main.startSpeed\` 用关键帧曲线（9 → 1.2）做出"先快后慢"的冲击感；
 * - \`main.gravityModifier\` 给 1，粒子飞散后下坠；
 * - \`colorOverLifetime\`：白 → 黄 → 橙 → 暗红（烟花冷却）；
 * - 加性混合让重叠处发白。
 */

/** 造「常量」曲线 */
function curve(v: number, between0And1 = false): MinMaxCurve
{
    return { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1, constant: v, constantMin: v, constantMax: v };
}

/** 造关键帧曲线 */
function curveKeys(keys: [number, number][]): MinMaxCurve
{
    return {
        __type__: 'MinMaxCurve',
        ...minMaxCurveDefault(),
        mode: MinMaxCurveMode.Curve,
        curve: {
            __type__: 'AnimationCurve',
            ...animationCurveDefault(),
            keys: keys.map(([time, value]) => ({ time, value, inTangent: 0, outTangent: 0 })),
        },
    };
}

/** 三条轴共用同一条曲线 */
function curve3D(c: MinMaxCurve): MinMaxCurveVector3
{
    return { __type__: 'MinMaxCurveVector3', ...minMaxCurveVector3Default(), xCurve: c, yCurve: c, zCurve: c };
}

/** 烟花渐变：白热 → 黄 → 橙 → 暗红 */
function sparkGradient(): MinMaxGradient
{
    return {
        __type__: 'MinMaxGradient',
        ...minMaxGradientDefault(),
        mode: MinMaxGradientMode.Gradient,
        gradient: {
            __type__: 'Gradient',
            ...gradientDefault(),
            mode: GradientMode.Blend,
            colorKeys: [
                { color: { __type__: 'Color3', r: 1, g: 1, b: 0.92 }, time: 0 },
                { color: { __type__: 'Color3', r: 1, g: 0.85, b: 0.35 }, time: 0.25 },
                { color: { __type__: 'Color3', r: 1, g: 0.42, b: 0.1 }, time: 0.55 },
                { color: { __type__: 'Color3', r: 0.4, g: 0.05, b: 0.02 }, time: 1 },
            ],
            alphaKeys: [
                { alpha: 1, time: 0 },
                { alpha: 0.9, time: 0.5 },
                { alpha: 0, time: 1 },
            ],
        },
    };
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
            background: { __type__: 'Color4', r: 0.01, g: 0.01, b: 0.02, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1.2, z: 12 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Explosion',
            position: { x: 0, y: 0.5, z: 0 },
            components: [{
                ...particleSystemDefault(),
                main: {
                    ...particleSystemDefault().main,
                    // 每 2.4 秒循环一次，每次循环爆发一轮
                    duration: 2.4,
                    loop: true,
                    startSpeed: curveKeys([[0, 9], [0.35, 4.5], [1, 1.2]]),
                    startLifetime: curve(1.9),
                    startSize3D: curve3D(curve(0.55, true)),
                    maxParticles: 900,
                    gravityModifier: curve(1),
                    simulationSpace: ParticleSystemSimulationSpace.World,
                },
                emission: {
                    ...particleSystemDefault().emission,
                    // 只靠爆发：持续发射归零
                    rateOverTime: curve(0, true),
                    bursts: [{ __type__: 'ParticleEmissionBurst', ...particleEmissionBurstDefault(), time: 0, count: curve(260) }],
                },
                shape: {
                    ...particleSystemDefault().shape,
                    shapeType: ParticleSystemShapeType.SphereShell,
                    radius: 0.35,
                },
                colorOverLifetime: {
                    ...particleSystemDefault().colorOverLifetime,
                    color: sparkGradient(),
                },
                sizeOverLifetime: {
                    ...particleSystemDefault().sizeOverLifetime,
                    separateAxes: false,
                    size3D: curve3D(curveKeys([[0, 1.15], [0.6, 0.5], [1, 0.05]])),
                },
                material: {
                    ...particleSystemDefault().material,
                    uniforms: {
                        u_TintColor: { __type__: 'Color4', r: 1, g: 0.86, b: 0.55, a: 1 },
                    },
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
