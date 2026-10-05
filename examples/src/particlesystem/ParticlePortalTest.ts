import { WebGPU } from '@feng3d/webgpu';
import { animationCurveDefault, gradientDefault, GradientMode, minMaxCurveDefault, minMaxCurveVector3Default, minMaxGradientDefault, MinMaxCurveMode, MinMaxGradientMode } from '@feng3d/math';
import type { MinMaxCurve, MinMaxCurveVector3, MinMaxGradient } from '@feng3d/math';
import { logic, ticker, View } from 'feng3d';
import { ParticleSystemShapeType, particleSystemDefault } from '@feng3d/particlesystem';

/**
 * Unity 风格粒子效果 · 魔法能量环（传送门）。
 *
 * - \`shape\`：Circle（半径 1.9 的圆盘），粒子沿圆盘各向生成、几乎不动（startSpeed 0.25），
 *   于是叠成一个发光的环形盘面；
 * - \`rotationOverLifetime\`：给 z 轴角速度，让每个粒子自身缓慢旋转，盘面有"流动"感；
 * - \`colorOverLifetime\`：紫 → 品红 → 青的渐变（魔法感），alpha 两端淡出；
 * - \`sizeOverLifetime\`：0.45 → 1.3 → 0.1，粒子先胀后消；
 * - 加性混合 + 青紫色调 = 发光法阵。
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

/** 魔法渐变：紫 → 品红 → 青 */
function magicGradient(): MinMaxGradient
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
                { color: { __type__: 'Color3', r: 0.55, g: 0.2, b: 1 }, time: 0 },
                { color: { __type__: 'Color3', r: 0.95, g: 0.25, b: 0.9 }, time: 0.45 },
                { color: { __type__: 'Color3', r: 0.25, g: 0.9, b: 1 }, time: 1 },
            ],
            alphaKeys: [
                { alpha: 0, time: 0 },
                { alpha: 0.85, time: 0.25 },
                { alpha: 0.85, time: 0.7 },
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
            background: { __type__: 'Color4', r: 0.015, g: 0.015, b: 0.03, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 0.4, z: 9 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Portal',
            position: { x: 0, y: 0.3, z: 0 },
            components: [{
                ...particleSystemDefault(),
                main: {
                    ...particleSystemDefault().main,
                    duration: 4,
                    startSpeed: curve(0.25),
                    startLifetime: curve(1.3),
                    startSize3D: curve3D(curve(0.55, true)),
                    maxParticles: 1200,
                },
                emission: {
                    ...particleSystemDefault().emission,
                    rateOverTime: curve(220, true),
                },
                shape: {
                    ...particleSystemDefault().shape,
                    shapeType: ParticleSystemShapeType.CircleEdge,
                    radius: 2.0,
                    arc: 360,
                    arcMode: 0,
                },
                colorOverLifetime: {
                    ...particleSystemDefault().colorOverLifetime,
                    color: magicGradient(),
                },
                sizeOverLifetime: {
                    ...particleSystemDefault().sizeOverLifetime,
                    separateAxes: false,
                    size3D: curve3D(curveKeys([[0, 0.45], [0.35, 1.3], [1, 0.1]])),
                },
                rotationOverLifetime: {
                    ...particleSystemDefault().rotationOverLifetime,
                    separateAxes: true,
                    // 只绕 z 转（圆盘平面内的自转）
                    angularVelocity: { __type__: 'MinMaxCurveVector3', ...minMaxCurveVector3Default(), zCurve: curve(1.4) },
                },
                material: {
                    ...particleSystemDefault().material,
                    uniforms: {
                        u_TintColor: { __type__: 'Color4', r: 0.75, g: 0.55, b: 1, a: 1 },
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
