import { GeometryLike, Material } from 'feng3d';
import type { Vector3 } from '@feng3d/math';
import type { ParticleSystemRenderMode } from '../enums/ParticleSystemRenderMode';
import type { ParticleSystemRenderSpace } from '../enums/ParticleSystemRenderSpace';
import type { ParticleSystemSortMode } from '../enums/ParticleSystemSortMode';
import type { SpriteMaskInteraction } from '../enums/SpriteMaskInteraction';
import type { ParticleModuleLike, WritableParticleModuleLike } from './ParticleModule';

/**
 * 粒子系统渲染器设置（纯数据接口 + 默认工厂）。
 *
 * 原 class 的字段**都没有初始值**（运行时为 `undefined`），纯数据形态把字段声明为可选、工厂只补 `enabled`，
 * 保持运行时行为逐字一致；这些字段目前没有引擎侧消费方（是 Unity API 的镜像壳），因此没有补默认值。
 */
export interface ParticleSystemRendererLike extends ParticleModuleLike
{
    /** 当前激活的自定义顶点流数量 */
    readonly activeVertexStreamsCount?: number;

    /** 粒子朝向的控制方式 */
    readonly alignment?: ParticleSystemRenderSpace;

    /** 是否允许公告牌粒子绕 z 轴翻滚 */
    readonly allowRoll?: boolean;

    /** 粒子按相机速度拉伸的程度 */
    readonly cameraVelocityScale?: number;

    /** 是否启用 GPU Instancing */
    readonly enableGPUInstancing?: boolean;

    /** 沿各轴翻转的粒子比例 */
    readonly flip?: Vector3;

    /** 是否启用自由拉伸 */
    readonly freeformStretching?: boolean;

    /** 沿运动方向拉伸的程度（长度 / 宽度） */
    readonly lengthScale?: number;

    /** 与 SpriteMask 的交互方式 */
    readonly maskInteraction?: SpriteMaskInteraction;

    /** 粒子尺寸上限 */
    readonly maxParticleSize?: number;

    /** 替代公告牌贴图使用的网格 */
    readonly mesh?: GeometryLike;

    /** 用于粒子渲染的网格数 */
    readonly meshCount?: number;

    /** 粒子尺寸下限 */
    readonly minParticleSize?: number;

    /** 公告牌法线朝向相机的程度 */
    readonly normalDirection?: number;

    /** 旋转粒子用的轴心点偏移 */
    readonly pivot?: Vector3;

    /** 粒子的绘制方式 */
    readonly renderMode?: ParticleSystemRenderMode;

    /** 是否按拉伸方向旋转粒子 */
    readonly rotateWithStretchDirection?: boolean;

    /** 阴影偏移（占粒子尺寸的比例） */
    readonly shadowBias?: number;

    /** 粒子系统排序偏差 */
    readonly sortingFudge?: number;

    /** 粒子系统内部的排序方式 */
    readonly sortMode?: ParticleSystemSortMode;

    /** 拖尾模块使用的材质 */
    readonly trailMaterial?: Material;

    /** 按速度拉伸的程度 */
    readonly velocityScale?: number;
}

/** 可写出的渲染器设置（写侧形状）。 */
export interface WritableParticleSystemRendererLike extends WritableParticleModuleLike
{
    activeVertexStreamsCount?: number;

    alignment?: ParticleSystemRenderSpace;

    allowRoll?: boolean;

    cameraVelocityScale?: number;

    enableGPUInstancing?: boolean;

    flip?: Vector3;

    freeformStretching?: boolean;

    lengthScale?: number;

    maskInteraction?: SpriteMaskInteraction;

    maxParticleSize?: number;

    mesh?: GeometryLike;

    meshCount?: number;

    minParticleSize?: number;

    normalDirection?: number;

    pivot?: Vector3;

    renderMode?: ParticleSystemRenderMode;

    rotateWithStretchDirection?: boolean;

    shadowBias?: number;

    sortingFudge?: number;

    sortMode?: ParticleSystemSortMode;

    trailMaterial?: Material;

    velocityScale?: number;
}

/** 纯数据「粒子系统渲染器设置」（带判别字段）。 */
export interface ParticleSystemRenderer extends Required<ParticleSystemRendererLike>
{
    readonly __type__: 'ParticleSystemRenderer';
}

/**
 * `new ParticleSystemRenderer()` 的纯函数版。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleSystemRendererModuleDefault(out: WritableParticleSystemRendererLike = { enabled: false }): WritableParticleSystemRendererLike
{
    out.enabled = false;

    return out;
}
