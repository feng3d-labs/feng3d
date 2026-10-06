import { WebGPU } from '@feng3d/webgpu';
import { animationCurveDefault, gradientDefault, GradientMode, minMaxCurveDefault, minMaxCurveVector3Default, minMaxGradientDefault, MinMaxCurveMode, MinMaxGradientMode } from '@feng3d/math';
import type { MinMaxCurve, MinMaxCurveVector3, MinMaxGradient } from '@feng3d/math';
import { logic, ticker, View } from 'feng3d';
import { ParticleSystemShapeType, ParticleSystemSimulationSpace, ParticleSystemSubEmitterProperties, ParticleSystemSubEmitterType, particleSystemDefault } from '@feng3d/particlesystem';
import type { ParticleSystem } from '@feng3d/particlesystem';

/**
 * Unity 风格粒子效果 · 流星拖尾（**子发射器 / subEmitters**）。
 *
 * 这是目前唯一覆盖 \`subEmitters\` 模块的示例，也顺带演示了两个纯数据组件如何互相引用：
 * - **父系统（流星）**：细锥形 + 倾斜的宿主，粒子斜向上飞出；它自己不画尾迹；
 * - **子系统（尾迹）**：\`isSubParticleSystem: true\`（**自己不会自动发射**），只在被父系统触发时发射；
 * - 两者用字面量里的对象引用接起来：
 *   \`subEmitters: { enabled: true, subEmitters: [{ subEmitter: trail, type: Birth, ... }] }\`；
 * - 触发时机选 **Birth**：\`particleSubEmittersModuleUpdateParticleState\` 对 \`Birth\` 类型是**每帧对每个父粒子**
 *   触发一次，于是子系统按自己的 \`rateOverTime\` 持续产出——父粒子飞过之处就拖出一条尾迹；
 * - 子系统换一套参数：慢速（0.35）、短寿命（0.6）、橙红渐变 + 加性混合，与流星头的冷白分开。
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

/** 尾迹渐变：橙黄 → 橙红 → 熄灭 */
function trailGradient(): MinMaxGradient
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
                { color: { __type__: 'Color3', r: 1, g: 0.82, b: 0.45 }, time: 0 },
                { color: { __type__: 'Color3', r: 1, g: 0.45, b: 0.12 }, time: 0.6 },
                { color: { __type__: 'Color3', r: 0.35, g: 0.05, b: 0.02 }, time: 1 },
            ],
            alphaKeys: [
                { alpha: 0.9, time: 0 },
                { alpha: 0.5, time: 0.6 },
                { alpha: 0, time: 1 },
            ],
        },
    };
}

/** 尾迹（子系统）：自己不开火，只被父系统拖出来 */
const trail: ParticleSystem = {
    ...particleSystemDefault(),
    // 关键：标记为子粒子系统，自身不自动发射
    isSubParticleSystem: true,
    main: {
        ...particleSystemDefault().main,
        duration: 6,
        startSpeed: curve(0.35),
        startLifetime: curve(0.6),
        startSize3D: curve3D(curve(0.5, true)),
        maxParticles: 2000,
        simulationSpace: ParticleSystemSimulationSpace.World,
    },
    emission: {
        ...particleSystemDefault().emission,
        rateOverTime: curve(55, true),
    },
    colorOverLifetime: {
        ...particleSystemDefault().colorOverLifetime,
        color: trailGradient(),
    },
    sizeOverLifetime: {
        ...particleSystemDefault().sizeOverLifetime,
        separateAxes: false,
        size3D: curve3D(curveKeys([[0, 1.1], [1, 0.05]])),
    },
    material: {
        ...particleSystemDefault().material,
        uniforms: {
            u_TintColor: { __type__: 'Color4', r: 1, g: 0.62, b: 0.25, a: 1 },
        },
        blend: {
            color: { srcFactor: 'one', dstFactor: 'one' },
            alpha: { srcFactor: 'one', dstFactor: 'one' },
        },
    },
};

/** 流星头（父系统）：只负责飞，尾迹交给子系统 */
const meteor: ParticleSystem = {
    ...particleSystemDefault(),
    main: {
        ...particleSystemDefault().main,
        duration: 6,
        startSpeed: curve(6.5),
        startLifetime: curve(1.5),
        startSize3D: curve3D(curve(0.5, true)),
        maxParticles: 60,
        simulationSpace: ParticleSystemSimulationSpace.World,
    },
    emission: {
        ...particleSystemDefault().emission,
        rateOverTime: curve(9, true),
    },
    shape: {
        ...particleSystemDefault().shape,
        shapeType: ParticleSystemShapeType.Sphere,
        radius: 0.12,
    },
    subEmitters: {
        ...particleSystemDefault().subEmitters,
        enabled: true,
        subEmitters: [{
            subEmitter: trail,
            type: ParticleSystemSubEmitterType.Birth,
            properties: ParticleSystemSubEmitterProperties.InheritNothing,
            emitProbability: 1,
        }],
    },
    material: {
        ...particleSystemDefault().material,
        uniforms: {
            u_TintColor: { __type__: 'Color4', r: 1, g: 0.95, b: 0.8, a: 1 },
        },
        blend: {
            color: { srcFactor: 'one', dstFactor: 'one' },
            alpha: { srcFactor: 'one', dstFactor: 'one' },
        },
    },
};

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
            background: { __type__: 'Color4', r: 0.01, g: 0.012, b: 0.025, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1.5, z: 13 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Meteor',
            position: { x: 0, y: -2.2, z: 0 },
            // 锥体沿 +Z；先转 -90° 朝上，再绕 z 倾斜 35° 让流星斜着飞
            rotation: { x: -90, y: 0, z: 0 },
            components: [meteor],
        }, {
            // 子系统必须有宿主，它的 logic 才会被创建（触发时才能发射）
            __type__: 'Object3D',
            name: 'TrailEmitter',
            components: [trail],
        }],
    },
};
const viewLogic = logic(view);




ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
