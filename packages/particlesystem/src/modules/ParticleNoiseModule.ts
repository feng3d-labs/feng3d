import { MinMaxCurveMode, minMaxCurveDefault, minMaxCurveGetValue, minMaxCurveVector3GetValue, noise, vec3ScaleNumber } from '@feng3d/math';
import type { MinMaxCurve, MinMaxCurveVector3 } from '@feng3d/math';
import { ParticleSystemNoiseQuality } from '../enums/ParticleSystemNoiseQuality';
import type { Particle } from '../Particle';
import { particleModuleVector3CurveDefault, type ParticleModuleLike, type WritableParticleModuleLike } from './ParticleModule';

/**
 * 噪声模块（纯数据接口 + 模块级行为函数）。
 *
 * 原 class 的 `strength` / `strengthX|Y|Z` / `remap` / `remapX|Y|Z` getter/setter 都是「转发到 `strength3D` / `remap3D`」
 * 的便捷访问器，删除；私有滚动状态 `_scrollValue` 提升为公开字段 `scrollValue`；三个 `static` 缩放系数改成模块级常量。
 */
export interface ParticleNoiseModuleLike extends ParticleModuleLike
{
    /** 是否分轴控制噪声 */
    readonly separateAxes: boolean;

    /** 噪声强度（三条轴） */
    readonly strength3D: MinMaxCurveVector3;

    /** 噪声频率（低值柔和、高值快速变化） */
    readonly frequency: number;

    /** 噪声图滚动速度 */
    readonly scrollSpeed: MinMaxCurve;

    /** 高频噪声是否按比例衰减强度 */
    readonly damping: boolean;

    /** 叠加的噪声层数 */
    readonly octaveCount: number;

    /** 每层噪声的强度系数 */
    readonly octaveMultiplier: number;

    /** 每层噪声的频率系数 */
    readonly octaveScale: number;

    /** 噪声质量（决定用 perlin1/2/3） */
    readonly quality: ParticleSystemNoiseQuality;

    /** 是否启用重映射 */
    readonly remapEnabled: boolean;

    /** 噪声值重映射曲线 */
    readonly remap3D: MinMaxCurveVector3;

    /** 噪声图滚动累积值（运行时状态，由 `update` 累加） */
    readonly scrollValue: number;
}

/** 可写出的噪声模块（写侧形状）。 */
export interface WritableParticleNoiseModuleLike extends WritableParticleModuleLike
{
    separateAxes: boolean;
    strength3D: MinMaxCurveVector3;
    frequency: number;
    scrollSpeed: MinMaxCurve;
    damping: boolean;
    octaveCount: number;
    octaveMultiplier: number;
    octaveScale: number;
    quality: ParticleSystemNoiseQuality;
    remapEnabled: boolean;
    remap3D: MinMaxCurveVector3;
    scrollValue: number;
}

/** 纯数据「噪声模块」（带判别字段）。 */
export interface ParticleNoiseModule extends ParticleNoiseModuleLike
{
    readonly __type__: 'ParticleNoiseModule';
}

/**
 * `new ParticleNoiseModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleNoiseModuleDefault(out: WritableParticleNoiseModuleLike = {
    enabled: false,
    separateAxes: false,
    strength3D: particleModuleVector3CurveDefault(1, true, 1),
    frequency: 0.5,
    scrollSpeed: { __type__: 'MinMaxCurve', ...minMaxCurveDefault() },
    damping: true,
    octaveCount: 1,
    octaveMultiplier: 0.5,
    octaveScale: 2,
    quality: ParticleSystemNoiseQuality.High,
    remapEnabled: false,
    remap3D: particleModuleVector3CurveDefault(1, true, 1),
    scrollValue: 0,
}): WritableParticleNoiseModuleLike
{
    out.enabled = false;
    out.separateAxes = false;
    out.strength3D = particleModuleVector3CurveDefault(1, true, 1);
    out.frequency = 0.5;
    out.scrollSpeed = { __type__: 'MinMaxCurve', ...minMaxCurveDefault() };
    out.damping = true;
    out.octaveCount = 1;
    out.octaveMultiplier = 0.5;
    out.octaveScale = 2;
    out.quality = ParticleSystemNoiseQuality.High;
    out.remapEnabled = false;
    out.remap3D = particleModuleVector3CurveDefault(1, true, 1);
    out.scrollValue = 0;

    return out;
}

// 以下三个值与 Unity 中数据接近
const NOISE_FREQUENCY_SCALE = 5;
const NOISE_STRENGTH_SCALE = 0.3;
const NOISE_TIME_SCALE = 5;

/**
 * 初始化粒子状态（原 `ParticleNoiseModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleNoiseModuleInitParticleState(module: ParticleNoiseModuleLike, particle: Particle): void
{
    particle[NoiseStrengthRate] = Math.random();
    particle[NoiseParticleRate] = Math.random();
}

/**
 * 更新粒子状态（原 `ParticleNoiseModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleNoiseModuleUpdateParticleState(module: ParticleNoiseModuleLike, particle: Particle): void
{
    module.particleSystem!.removeParticlePosition(particle, NoisePreOffset);
    if (!module.enabled) return;

    let strengthX = 1;
    let strengthY = 1;
    let strengthZ = 1;
    if (module.separateAxes)
    {
        const strength3D = minMaxCurveVector3GetValue(module.strength3D, particle.rateAtLifeTime, particle[NoiseStrengthRate]);
        strengthX = strength3D.x;
        strengthY = strength3D.y;
        strengthZ = strength3D.z;
    }
    else
    {
        strengthX = strengthY = strengthZ = minMaxCurveGetValue(module.strength3D.xCurve, particle.rateAtLifeTime, particle[NoiseStrengthRate]);
    }
    //
    const frequency = NOISE_FREQUENCY_SCALE * module.frequency;
    //
    const offsetPos = { x: strengthX, y: strengthY, z: strengthZ };
    //
    vec3ScaleNumber(offsetPos, NOISE_STRENGTH_SCALE, offsetPos);
    if (module.damping)
    {
        vec3ScaleNumber(offsetPos, 1 / module.frequency, offsetPos);
    }
    const time = particle.rateAtLifeTime * NOISE_TIME_SCALE % 1;
    //
    offsetPos.x *= particleNoiseModuleGetNoiseValue(module, (1 / 3 * 0 + time) * frequency, particle[NoiseParticleRate] * frequency);
    offsetPos.y *= particleNoiseModuleGetNoiseValue(module, (1 / 3 * 1 + time) * frequency, particle[NoiseParticleRate] * frequency);
    offsetPos.z *= particleNoiseModuleGetNoiseValue(module, (1 / 3 * 2 + time) * frequency, particle[NoiseParticleRate] * frequency);
    //
    module.particleSystem!.addParticlePosition(particle, offsetPos, module.particleSystem!.main.simulationSpace, NoisePreOffset);
}

/**
 * 更新（原 `ParticleNoiseModule.update`）：累加噪声图滚动量。
 *
 * @param module 模块数据
 * @param interval 时间间隔（毫秒）
 */
export function particleNoiseModuleUpdate(module: WritableParticleNoiseModuleLike, interval: number): void
{
    module.scrollValue += minMaxCurveGetValue(module.scrollSpeed, module.particleSystem!.emitInfo.rateAtDuration) * interval / 1000;
}

/**
 * 绘制噪声到图片（原 `ParticleNoiseModule.drawImage`，编辑器面板用）。
 *
 * @param module 模块数据
 * @param image 图片数据
 */
export function particleNoiseModuleDrawImage(module: ParticleNoiseModuleLike, image: ImageData): void
{
    const strength = particleNoiseModuleGetDrawImageStrength(module);
    let strengthX = strength.x;
    let strengthY = strength.y;
    let strengthZ = strength.z;
    //
    strengthX *= NOISE_STRENGTH_SCALE;
    strengthY *= NOISE_STRENGTH_SCALE;
    strengthZ *= NOISE_STRENGTH_SCALE;

    if (module.damping)
    {
        strengthX /= module.frequency;
        strengthY /= module.frequency;
        strengthZ /= module.frequency;
    }
    //
    const frequency = NOISE_FREQUENCY_SCALE * module.frequency;
    //
    const data = image.data;
    const imageWidth = image.width;
    const imageHeight = image.height;

    for (let x = 0; x < imageWidth; x++)
    {
        for (let y = 0; y < imageHeight; y++)
        {
            const xv = x / imageWidth * frequency;
            const yv = 1 - y / imageHeight * frequency;

            let value = particleNoiseModuleGetNoiseValue(module, xv, yv);

            if (xv < 1 / 3)
            { value = (value * strengthX + 1) / 2 * 256; }
            else if (xv < 2 / 3)
            { value = (value * strengthY + 1) / 2 * 256; }
            else
            { value = (value * strengthZ + 1) / 2 * 256; }

            const cell = (x + y * imageWidth) * 4;
            data[cell] = data[cell + 1] = data[cell + 2] = Math.floor(value);
            data[cell + 3] = 255; // alpha
        }
    }
}

/**
 * 取绘制用的强度（原 `ParticleNoiseModule._getDrawImageStrength`）。
 *
 * @param module 模块数据
 */
function particleNoiseModuleGetDrawImageStrength(module: ParticleNoiseModuleLike): { x: number; y: number; z: number }
{
    let strengthX = 1;
    let strengthY = 1;
    let strengthZ = 1;
    if (module.separateAxes)
    {
        strengthX = getStrengthOfCurve(module.strength3D.xCurve);
        strengthY = getStrengthOfCurve(module.strength3D.yCurve);
        strengthZ = getStrengthOfCurve(module.strength3D.zCurve);
    }
    else
    {
        strengthX = strengthY = strengthZ = getStrengthOfCurve(module.strength3D.xCurve);
    }

    return { x: strengthX, y: strengthY, z: strengthZ };
}

/** 按曲线模式取「绘制用强度」（原 `_getDrawImageStrength` 三个分支的公共部分） */
function getStrengthOfCurve(curve: MinMaxCurve): number
{
    if (curve.mode === MinMaxCurveMode.Curve || curve.mode === MinMaxCurveMode.TwoCurves)
    {
        return curve.curveMultiplier;
    }
    if (curve.mode === MinMaxCurveMode.Constant)
    {
        return curve.constant;
    }
    if (curve.mode === MinMaxCurveMode.TwoConstants)
    {
        return curve.constantMax;
    }

    return 1;
}

/**
 * 获取噪声值（原 `ParticleNoiseModule._getNoiseValue`，含倍频叠加）。
 *
 * @param module 模块数据
 * @param x x 坐标
 * @param y y 坐标
 */
function particleNoiseModuleGetNoiseValue(module: ParticleNoiseModuleLike, x: number, y: number): number
{
    let value = particleNoiseModuleGetNoiseValueBase(module, x, y);
    for (let l = 1, ln = module.octaveCount; l < ln; l++)
    {
        const value0 = particleNoiseModuleGetNoiseValueBase(module, x * module.octaveScale, y * module.octaveScale);
        value += (value0 - value) * module.octaveMultiplier;
    }

    return value;
}

/**
 * 获取单层噪声值（原 `ParticleNoiseModule._getNoiseValueBase`）。
 *
 * @param module 模块数据
 * @param x x 坐标
 * @param y y 坐标
 */
function particleNoiseModuleGetNoiseValueBase(module: ParticleNoiseModuleLike, x: number, y: number): number
{
    const scrollValue = module.scrollValue;
    if (module.quality === ParticleSystemNoiseQuality.Low)
    {
        return noise.perlin1(x + scrollValue);
    }
    if (module.quality === ParticleSystemNoiseQuality.Medium)
    {
        return noise.perlin2(x, y + scrollValue);
    }

    return noise.perlin3(x, y, scrollValue);
}

const NoiseStrengthRate = '_Noise_strength_rate';
const NoiseParticleRate = '_Noise_particle_rate';
const NoisePreOffset = '_Noise_preOffset';
