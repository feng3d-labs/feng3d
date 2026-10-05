import { WebGPU } from '@feng3d/webgpu';
import { animationCurveDefault, gradientDefault, GradientMode, minMaxCurveDefault, minMaxCurveVector3Default, minMaxGradientDefault, MinMaxCurveMode, MinMaxGradientMode } from '@feng3d/math';
import type { MinMaxCurve, MinMaxCurveVector3, MinMaxGradient } from '@feng3d/math';
import { logic, ticker, View } from 'feng3d';
import { ParticleSystemShapeType, ParticleSystemSimulationSpace, particleSystemDefault } from '@feng3d/particlesystem';

/**
 * Unity 风格粒子效果 · 烟雾。
 *
 * 与 Fire 同一套发射参数（细长圆锥朝上），但把"火"换成"烟"：
 * - \`main\`：初速低（0.9）、寿命长（4.5）、粒子大（2.2）→ 缓慢翻滚上升；
 * - \`noise\`：0.8 强度 + 0.5 频率 + 0.35 滚动，形成大团絮状扰动；
 * - \`sizeOverLifetime\`：0.4 → 2.4 → 3.4（越飘越大）；
 * - \`colorOverLifetime\`：深灰 → 中灰 → 淡灰，alpha 两端淡入淡出；
 * - \`rotationOverLifetime\`：缓慢自转，避免所有云团同向；
 * - 材质走 **alpha 混合**（半透明灰）。
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

/** 烟雾渐变：深灰 → 中灰 → 淡灰 */
function smokeGradient(): MinMaxGradient
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
                { color: { __type__: 'Color3', r: 0.16, g: 0.16, b: 0.18 }, time: 0 },
                { color: { __type__: 'Color3', r: 0.45, g: 0.45, b: 0.48 }, time: 1 },
            ],
            alphaKeys: [
                { alpha: 0, time: 0 },
                { alpha: 0.42, time: 0.25 },
                { alpha: 0.3, time: 0.7 },
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
            background: { __type__: 'Color4', r: 0.06, g: 0.06, b: 0.07, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1.8, z: 11 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Smoke',
            position: { x: 0, y: -3, z: 0 },
            rotation: { x: -90, y: 0, z: 0 },
            components: [{
                ...particleSystemDefault(),
                main: {
                    ...particleSystemDefault().main,
                    duration: 6,
                    startSpeed: curve(0.9),
                    startLifetime: curve(4.5),
                    startSize3D: curve3D(curve(3, true)),
                    maxParticles: 420,
                    gravityModifier: curve(0.02),
                    simulationSpace: ParticleSystemSimulationSpace.World,
                },
                emission: {
                    ...particleSystemDefault().emission,
                    rateOverTime: curve(30, true),
                },
                shape: {
                    ...particleSystemDefault().shape,
                    shapeType: ParticleSystemShapeType.Cone,
                    angle: 16,
                    radius: 0.6,
                },
                colorOverLifetime: {
                    ...particleSystemDefault().colorOverLifetime,
                    color: smokeGradient(),
                },
                sizeOverLifetime: {
                    ...particleSystemDefault().sizeOverLifetime,
                    separateAxes: false,
                    size3D: curve3D(curveKeys([[0, 0.4], [0.4, 2.4], [1, 3.4]])),
                },
                noise: {
                    ...particleSystemDefault().noise,
                    separateAxes: false,
                    strength3D: curve3D(curve(0.9, true)),
                    frequency: 0.5,
                    scrollSpeed: curve(0.35),
                    damping: true,
                },
                rotationOverLifetime: {
                    ...particleSystemDefault().rotationOverLifetime,
                    separateAxes: true,
                    angularVelocity: { __type__: 'MinMaxCurveVector3', ...minMaxCurveVector3Default(), zCurve: curve(0.35) },
                },
                material: {
                    ...particleSystemDefault().material,
                    uniforms: {
                        u_TintColor: { __type__: 'Color4', r: 0.85, g: 0.85, b: 0.9, a: 1 },
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
