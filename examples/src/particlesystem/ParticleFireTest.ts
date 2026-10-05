import { WebGPU } from '@feng3d/webgpu';
import { animationCurveDefault, gradientDefault, GradientMode, minMaxCurveDefault, minMaxCurveVector3Default, minMaxGradientDefault, MinMaxCurveMode, MinMaxGradientMode } from '@feng3d/math';
import type { MinMaxCurve, MinMaxCurveVector3, MinMaxGradient } from '@feng3d/math';
import { logic, ticker, View } from 'feng3d';
import { ParticleSystemShapeType, ParticleSystemSimulationSpace, particleSystemDefault } from '@feng3d/particlesystem';

/**
 * Unity 风格粒子效果 · 火焰。
 *
 * 组合了四个模块来贴近 Unity 的 Fire 预设：
 * - \`shape\`：细长圆锥（angle 8°）+ 宿主绕 x 轴 -90°，让锥体朝 +Y 喷（火焰向上）；
 * - \`colorOverLifetime\`：亮黄白 → 橙 → 暗红 → 熄灭的四段渐变（含 alpha 淡出）；
 * - \`sizeOverLifetime\`：先胀后缩的关键帧曲线（0.6 → 1.35 → 0.15）；
 * - \`noise\`：中等强度 + 0.8 滚动速度，让火苗边缘抖动而不是笔直喷；
 * - 材质走**加性混合**（one / one），亮部叠加成白热核心。
 */

/** 造「常量」曲线 */
function curve(v: number, between0And1 = false): MinMaxCurve
{
    return { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1, constant: v, constantMin: v, constantMax: v };
}

/** 造关键帧曲线（curveMultiplier 保持默认 1） */
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

/** 火焰渐变：亮黄白 → 橙 → 暗红 → 熄灭 */
function fireGradient(): MinMaxGradient
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
                { color: { __type__: 'Color3', r: 1, g: 0.96, b: 0.7 }, time: 0 },
                { color: { __type__: 'Color3', r: 1, g: 0.52, b: 0.12 }, time: 0.32 },
                { color: { __type__: 'Color3', r: 0.6, g: 0.09, b: 0.02 }, time: 0.72 },
                { color: { __type__: 'Color3', r: 0.06, g: 0.01, b: 0.01 }, time: 1 },
            ],
            alphaKeys: [
                { alpha: 0.3, time: 0 },
                { alpha: 0.85, time: 0.2 },
                { alpha: 0.45, time: 0.7 },
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
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.03, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1.6, z: 9 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Fire',
            position: { x: 0, y: -2.6, z: 0 },
            // 锥体沿 +Z 发射；绕 x 转 -90° 让它朝 +Y（火苗向上）
            rotation: { x: -90, y: 0, z: 0 },
            components: [{
                ...particleSystemDefault(),
                main: {
                    ...particleSystemDefault().main,
                    startSpeed: curve(2.8),
                    startLifetime: curve(1.15),
                    startSize3D: curve3D(curve(0.72, true)),
                    maxParticles: 700,
                    simulationSpace: ParticleSystemSimulationSpace.World,
                },
                emission: {
                    ...particleSystemDefault().emission,
                    rateOverTime: curve(70, true),
                },
                shape: {
                    ...particleSystemDefault().shape,
                    shapeType: ParticleSystemShapeType.Cone,
                    angle: 10,
                    radius: 0.5,
                },
                colorOverLifetime: {
                    ...particleSystemDefault().colorOverLifetime,
                    color: fireGradient(),
                },
                sizeOverLifetime: {
                    ...particleSystemDefault().sizeOverLifetime,
                    separateAxes: false,
                    size3D: curve3D(curveKeys([[0, 0.55], [0.25, 1.35], [1, 0.1]])),
                },
                noise: {
                    ...particleSystemDefault().noise,
                    separateAxes: false,
                    strength3D: curve3D(curve(0.5, true)),
                    frequency: 1.1,
                    scrollSpeed: curve(0.8),
                    damping: true,
                },
                material: {
                    ...particleSystemDefault().material,
                    uniforms: {
                        u_TintColor: { __type__: 'Color4', r: 1, g: 0.68, b: 0.3, a: 1 },
                    },
                    // 加性混合：亮部叠加成白热核心
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
