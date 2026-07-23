import { Behaviour, behaviourLogic, BehaviourLogic } from '../component/Behaviour';
import type { Component } from '../component/Component';
import type { AnimationClip } from './AnimationClip';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
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
export interface AnimationLogic extends BehaviourLogic
{
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

    return Object.assign(base, {
        init(object3D?: Object3D): void
        {
            if (_subInited) return;
            _subInited = true;
            base.init(object3D);

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
            base.update(interval);
            const r_animation = reactive(animation);
            if (r_animation.isplaying)
            {
                r_animation.time = r_animation.time + interval * animation.playspeed;
            }
        },
        dispose(): void
        {
            const r_animation = reactive(animation);
            r_animation.animation = null;
            r_animation.animations = null;
            base.dispose();
        },
    }) as unknown as AnimationLogic;
}
// 注册到 componentLogic 分发表
registerLogic('Animation', animationLogic);
