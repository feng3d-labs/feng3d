import { Behaviour, createBehaviour } from '../component/Behaviour';
import type { Component } from '../component/Component';
import type { AnimationClip } from './AnimationClip';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
import { BehaviourLogic } from '../component/Behaviour';
import { classUtils } from '@feng3d/polyfill';
import { findObject3DChild } from '../core/Object3D';
import type { Object3D } from '../core/Object3D';
import { PropertyClip, PropertyClipPathItemType } from './PropertyClip';

import './Animation';

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
}

/**
 * 创建 Animation 实例。
 */
export function createAnimation(): Animation
{
    return {
        ...createBehaviour(), __type__: 'Animation',
        animation: null as unknown as AnimationClip,
        animations: [],
        time: 0,
        isplaying: false,
        playspeed: 1,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Animation: AnimationLogic;
    }
}

/**
 * Animation 逻辑处理类。
 *
 * 继承 BehaviourLogic，额外：
 * - effect 监听 animation 变化时重置 time=0
 * - effect 监听 time 变化时应用动画曲线（_updateAni）
 * - update: 播放时累加 time
 */
export class AnimationLogic extends BehaviourLogic
{
    /** init 去重标志（同一 component 只初始化一次） */
    private _subInited = false;

    constructor(animation: Animation)
    {
        super(animation);
    }

    init(object3D?: Object3D): void
    {
        if (this._subInited) return;
        this._subInited = true;
        super.init(object3D);

        const animation = this.component as Animation;

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
            this._updateAni();
        });
    }

    update(interval: number): void
    {
        super.update(interval);
        const animation = this.component as Animation;
        const r_animation = reactive(animation);
        if (r_animation.isplaying)
        {
            r_animation.time = r_animation.time + interval * animation.playspeed;
        }
    }

    dispose(): void
    {
        const animation = this.component as Animation;
        const r_animation = reactive(animation);
        r_animation.animation = null;
        r_animation.animations = null;
        super.dispose();
    }

    private _updateAni(): void
    {
        const animation = this.component as Animation;

        if (!animation.animation) return;

        const cycle = animation.animation.length;
        const cliptime = (animation.time % cycle + cycle) % cycle;

        const propertyClips = animation.animation.propertyClips;

        for (let i = 0; i < propertyClips.length; i++)
        {
            const propertyClip = propertyClips[i];

            if (propertyClip.times.length === 0) continue;
            const propertyHost = this._getPropertyHost(propertyClip);
            if (!propertyHost) continue;
            propertyHost[propertyClip.propertyName] = propertyClip.getValue(cliptime);
        }
    }

    private _getPropertyHost(propertyClip: PropertyClip): Record<string, unknown> | null
    {
        let propertyHost: Object3D | Component | null = this.entity;
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
    }
}
// 注册到 componentLogic 分发表
registerLogic('Animation', AnimationLogic);
