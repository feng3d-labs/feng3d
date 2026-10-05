import { minMaxCurveDefault, minMaxCurveGetValue, vec2From, vec2Reciprocal, vec2Scale, vec4From } from '@feng3d/math';
import { animationCurveDefault } from '@feng3d/math';
import { MinMaxCurveMode } from '@feng3d/math';
import type { MinMaxCurve, Vector2Like } from '@feng3d/math';
import { ParticleSystemAnimationType } from '../enums/ParticleSystemAnimationType';
import { UVChannelFlags } from '../enums/UVChannelFlags';
import type { Particle } from '../Particle';
import type { ParticleModuleLike, WritableParticleModuleLike } from './ParticleModule';

/**
 * 纹理表动画模块（纯数据接口 + 模块级行为函数）。
 *
 * 原 class 的 `flipU` / `flipV` / `numTilesX` / `numTilesY` / `frameOverTimeMultiplier` / `startFrameMultiplier`
 * 与 `rowIndex` 的 getter/setter 是「转发到字段或曲线」的便捷访问器：其中转发型删除（调用方直接读写字段），
 * `rowIndex` 由私有 `_rowIndex` 提升为公开字段。
 */
export interface ParticleTextureSheetAnimationModuleLike extends ParticleModuleLike
{
    /** 纹理的平铺 */
    readonly tiles: Vector2Like;

    /** 动画类型 */
    readonly animation: ParticleSystemAnimationType;

    /** 控制纹理表动画播放哪一帧的曲线 */
    readonly frameOverTime: MinMaxCurve;

    /** 每个粒子是否使用随机行 */
    readonly useRandomRow: boolean;

    /** 使用哪一行（`useRandomRow` 为 false 时生效） */
    readonly rowIndex: number;

    /** 起始帧曲线 */
    readonly startFrame: MinMaxCurve;

    /** 循环次数 */
    readonly cycleCount: number;

    /** 是否翻转 UV */
    readonly flipUV: Vector2Like;

    /** UV 通道掩码 */
    readonly uvChannelMask: UVChannelFlags;
}

/** 可写出的纹理表动画模块（写侧形状）。 */
export interface WritableParticleTextureSheetAnimationModuleLike extends WritableParticleModuleLike
{
    tiles: Vector2Like;
    animation: ParticleSystemAnimationType;
    frameOverTime: MinMaxCurve;
    useRandomRow: boolean;
    rowIndex: number;
    startFrame: MinMaxCurve;
    cycleCount: number;
    flipUV: Vector2Like;
    uvChannelMask: UVChannelFlags;
}

/** 纯数据「纹理表动画模块」（带判别字段）。 */
export interface ParticleTextureSheetAnimationModule extends ParticleTextureSheetAnimationModuleLike
{
    readonly __type__: 'ParticleTextureSheetAnimationModule';
}

/**
 * `new ParticleTextureSheetAnimationModule()` 的纯函数版：字段默认值与原 class 逐字一致
 * （原 `serialization.setValue` 对 `curveMin` 的递归覆盖，在这里写成完整的曲线字面量）。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleTextureSheetAnimationModuleDefault(out: WritableParticleTextureSheetAnimationModuleLike = {
    enabled: false,
    tiles: { x: 1, y: 1 },
    animation: ParticleSystemAnimationType.WholeSheet,
    frameOverTime: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), mode: MinMaxCurveMode.Curve, curveMin: { __type__: 'AnimationCurve', ...animationCurveDefault(), keys: [{ time: 0, value: 0, inTangent: 1, outTangent: 1 }, { time: 1, value: 1, inTangent: 1, outTangent: 1 }] } },
    useRandomRow: true,
    rowIndex: 0,
    startFrame: { __type__: 'MinMaxCurve', ...minMaxCurveDefault() },
    cycleCount: 1,
    flipUV: { x: 0, y: 0 },
    uvChannelMask: UVChannelFlags.Everything,
}): WritableParticleTextureSheetAnimationModuleLike
{
    out.enabled = false;
    out.tiles = { x: 1, y: 1 };
    out.animation = ParticleSystemAnimationType.WholeSheet;
    out.frameOverTime = { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), mode: MinMaxCurveMode.Curve, curveMin: { __type__: 'AnimationCurve', ...animationCurveDefault(), keys: [{ time: 0, value: 0, inTangent: 1, outTangent: 1 }, { time: 1, value: 1, inTangent: 1, outTangent: 1 }] } };
    out.useRandomRow = true;
    out.rowIndex = 0;
    out.startFrame = { __type__: 'MinMaxCurve', ...minMaxCurveDefault() };
    out.cycleCount = 1;
    out.flipUV = { x: 0, y: 0 };
    out.uvChannelMask = UVChannelFlags.Everything;

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleTextureSheetAnimationModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleTextureSheetAnimationModuleInitParticleState(module: ParticleTextureSheetAnimationModuleLike, particle: Particle): void
{
    particle[TextureSheetAnimationFrameOverTime] = Math.random();
    particle[TextureSheetAnimationStartFrame] = Math.random();
    particle[TextureSheetAnimationRandomRow] = Math.random();
}

/**
 * 更新粒子状态（原 `ParticleTextureSheetAnimationModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleTextureSheetAnimationModuleUpdateParticleState(module: ParticleTextureSheetAnimationModuleLike, particle: Particle): void
{
    vec4From(1, 1, 0, 0, particle.tilingOffset);
    vec2From(0, 0, particle.flipUV);
    if (!module.enabled) return;

    const segmentsX = module.tiles.x;
    const segmentsY = module.tiles.y;
    const step = vec2Reciprocal(module.tiles);
    const uvPos = { x: 0, y: 0 };
    const frameOverTime = minMaxCurveGetValue(module.frameOverTime, particle.rateAtLifeTime, particle[TextureSheetAnimationFrameOverTime]);
    let frameIndex = minMaxCurveGetValue(module.startFrame, particle.rateAtLifeTime, particle[TextureSheetAnimationStartFrame]);
    let rowIndex = module.rowIndex;
    const cycleCount = module.cycleCount;

    if (module.animation === ParticleSystemAnimationType.WholeSheet)
    {
        frameIndex = Math.round(frameIndex + frameOverTime * segmentsX * segmentsY * cycleCount);
        vec2Scale(vec2From(frameIndex % segmentsX, Math.floor(frameIndex / segmentsX) % segmentsY, uvPos), step, uvPos);
    }
    else if (module.animation === ParticleSystemAnimationType.SingleRow)
    {
        frameIndex = Math.round(frameIndex + frameOverTime * segmentsX * cycleCount);
        if (module.useRandomRow)
        {
            rowIndex = Math.round(segmentsY * particle[TextureSheetAnimationRandomRow]);
        }
        vec2Scale(vec2From(frameIndex % segmentsX, rowIndex, uvPos), step, uvPos);
    }

    vec4From(step.x, step.y, uvPos.x, uvPos.y, particle.tilingOffset);
    particle.flipUV = module.flipUV;
}

const TextureSheetAnimationFrameOverTime = '_TextureSheetAnimation_rateAtLifeTime';
const TextureSheetAnimationStartFrame = '_TextureSheetAnimation_startFrame';
const TextureSheetAnimationRandomRow = '_TextureSheetAnimation_randomRow';
