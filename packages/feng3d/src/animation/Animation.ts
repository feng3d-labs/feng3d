import { Behaviour, behaviourLogic, BehaviourLogic } from '../component/Behaviour';
import type { TransformSamplingLogic } from '../component/Component';
import type { Component } from '../component/Component';
import type { AnimationClip } from './AnimationClip';
import { computed, registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
import { Vector3 } from '@feng3d/math';
import { classUtils } from '@feng3d/polyfill';
import { findObject3DChild } from '../core/Object3D';
import type { Object3D } from '../core/Object3D';
import { PropertyClip, PropertyClipPathItemType } from './PropertyClip';
import { timeSource } from './TimeSource';


declare module '../component/Component'
{
    export interface ComponentMap
    {
        Animation: Animation;
    }
}

/**
 * Animation（纯数据接口）。
 */
export interface Animation extends Behaviour
{
    readonly __type__: 'Animation';
    readonly animation: AnimationClip;
    readonly animations: AnimationClip[];
    readonly time: number;
    readonly isplaying: boolean;
    readonly playspeed: number;
    /**
     * 声明式模式（设计 4.5 终态，默认 false）：
     * - true：动画值为 computed 采样（时间源驱动，不写回数据字段，暂停即停渲染）
     * - false：命令式（update 累加 time 并写回属性，过渡形态）
     */
    readonly declarative?: boolean;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Animation: AnimationLogic;
    }
}

/**
 * Animation 逻辑处理接口。
 *
 * 组合 behaviourLogic，额外：
 * - effect 监听 animation 变化时重置 time=0
 * - effect 监听 time 变化时应用动画曲线（_updateAni）
 * - update: 播放时累加 time
 */
/**
 * Animation 逻辑处理接口。
 *
 * 实现 {@link TransformSamplingLogic} 能力（依赖倒置）：Object3D 经该接口
 * 通用探测变换采样，不依赖 Animation 具体类型。
 *
 * 组合 behaviourLogic，额外：
 * - effect 监听 animation 变化时重置 time=0
 * - effect 监听 time 变化时应用动画曲线（_updateAni）
 * - update: 播放时累加 time（declarative 模式跳过，采样由 computed 派生）
 */
export interface AnimationLogic extends BehaviourLogic, TransformSamplingLogic
{
    /**
     * 声明式采样（declarative 模式）：激活动画时返回自身 TRS 采样值
     * （position/rotation/scale 中被 clip 驱动的项），否则 null。
     * 由 Object3DLogic 经 TransformSamplingLogic 能力探测消费。
     */
    get sampleTransform(): { position?: Vector3; rotation?: Vector3; scale?: Vector3 } | null;
}

/**
 * 创建 AnimationLogic 实例（工厂函数，组合 behaviourLogic 基础行为）。
 */
export function animationLogic(animation: Animation): AnimationLogic
{
    const base = behaviourLogic(animation);

    // init 去重标志（同一 component 只初始化一次）
    let _subInited = false;

    const _getPropertyHost = (propertyClip: PropertyClip): Record<string, unknown> | null =>
    {
        let propertyHost: Object3D | Component | null = base.entity;
        const path = propertyClip.path;

        for (let i = 0; i < path.length; i++)
        {
            const element = path[i];
            switch (element[0])
            {
                case PropertyClipPathItemType.Object3D:
                    propertyHost = propertyHost && 'children' in propertyHost ? findObject3DChild(propertyHost as Object3D, element[1]) ?? null : null;
                    break;
                case PropertyClipPathItemType.Component:
                {
                    if (!propertyHost || !('components' in propertyHost)) { propertyHost = null; break; }
                    const componentClass = classUtils.getDefinitionByName(element[1]) as new (...args: unknown[]) => unknown;
                    propertyHost = (propertyHost as Object3D).components.find((c: Component) => c instanceof componentClass) ?? null;
                    break;
                }
                default:
                    console.error(`无法获取 PropertyHost ${element}`);
            }
            if (!propertyHost)
            {
                return null;
            }
        }

        return propertyHost as unknown as Record<string, unknown> | null;
    };

    const _updateAni = (): void =>
    {
        if (!animation.animation) return;

        const cycle = animation.animation.length;
        const cliptime = (animation.time % cycle + cycle) % cycle;

        const propertyClips = animation.animation.propertyClips;

        for (let i = 0; i < propertyClips.length; i++)
        {
            const propertyClip = propertyClips[i];

            if (propertyClip.times.length === 0) continue;
            const propertyHost = _getPropertyHost(propertyClip);
            if (!propertyHost) continue;
            propertyHost[propertyClip.propertyName] = propertyClip.getValue(cliptime);
        }
    };

    // 捕获基类方法，避免覆盖后再调用 base.init/update/dispose 导致递归
    const baseInit = base.init;
    const baseUpdate = base.update;
    const baseDispose = base.dispose;

    // 声明式动画采样（设计 4.5 终态）：自身 TRS 的动画值为纯 computed 派生，
    // 由 Object3DLogic.matrix 消费（不写回数据字段，数据保持干净）。
    // 仅处理作用于自身 position/rotation/scale 且 path 为空的 propertyClip；
    // 复杂 path 的 clip 仍走命令式 update 写回（过渡形态）。
    const sampleTransform = computed<{ position?: Vector3; rotation?: Vector3; scale?: Vector3 } | null>(() =>
    {
        const r_animation = reactive(animation);
        if (!r_animation.isplaying || !r_animation.declarative) return null;

        const clip = r_animation.animation;
        if (!clip || !clip.propertyClips) return null;

        // 全局时间源（单一，设计 4.5）：被本 computed 消费后每帧推进驱动失效。
        // 时间源单位为秒，clip.times/length 单位为 ms，此处换算。
        const t = reactive(timeSource).t * (r_animation.playspeed ?? 1);
        const cycle = clip.length;
        const cliptime = cycle > 0 ? (((t * 1000) % cycle) + cycle) % cycle : 0;

        let position: Vector3 | undefined;
        let rotation: Vector3 | undefined;
        let scale: Vector3 | undefined;
        for (let i = 0; i < clip.propertyClips.length; i++)
        {
            const propertyClip = clip.propertyClips[i];
            if (propertyClip.times.length === 0) continue;
            if (propertyClip.path && propertyClip.path.length > 0) continue;

            const value = propertyClip.getValue(cliptime) as Vector3 | undefined;
            if (propertyClip.propertyName === 'position' && value instanceof Vector3) position = value;
            else if (propertyClip.propertyName === 'rotation' && value instanceof Vector3) rotation = value;
            else if (propertyClip.propertyName === 'scale' && value instanceof Vector3) scale = value;
        }

        return { position, rotation, scale };
    });

    const ext = Object.assign(base, {
        init(object3D?: Object3D): void
        {
            if (_subInited) return;
            _subInited = true;
            baseInit.call(base, object3D);

            // animation 变化时重置 time=0
            effect(() =>
            {
                reactive(animation).animation;
                reactive(animation).time = 0;
            });

            // time 变化时应用动画
            effect(() =>
            {
                const r_animation = reactive(animation);
                r_animation.time;
                _updateAni();
            });
        },
        update(interval: number): void
        {
            baseUpdate.call(base, interval);
            const r_animation = reactive(animation);
            // 声明式模式跳过命令式写回（动画值由 sampleTransform computed 派生）
            if (r_animation.isplaying && !r_animation.declarative)
            {
                r_animation.time = r_animation.time + interval * animation.playspeed;
            }
        },
        dispose(): void
        {
            const r_animation = reactive(animation);
            r_animation.animation = null;
            r_animation.animations = null;
            baseDispose.call(base);
        },
    });

    // 访问器必须用 defineProperty：Object.assign 会调用 getter 一次后存为静态值
    // （Renderable 同款约束），sampleTransform 的响应性依赖 getter 每次读取 computed
    Object.defineProperty(ext, 'sampleTransform', {
        get() { return sampleTransform.value; },
        enumerable: true,
        configurable: true,
    });

    return ext as unknown as AnimationLogic;
}
// 注册到 componentLogic 分发表
registerLogic('Animation', animationLogic);
