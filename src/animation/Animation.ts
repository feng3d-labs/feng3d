import { Behaviour, createBehaviour } from '../component/Behaviour';
import type { AnimationClip } from './AnimationClip';
import { registerLogic, effect, reactive } from "@feng3d/reactivity";
import { BehaviourLogic, behaviourLogic } from '../component/Behaviour';
import { classUtils } from '@feng3d/polyfill';
import { findObject3DChild } from '../core/Object3D';
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
        animation: null as any,
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
        Animation: BehaviourLogic;
    }
}

/**
 * Animation 逻辑处理输出。
 *
 * 组合 behaviourLogic，额外：
 * - effect 监听 animation 变化时重置 time=0
 * - effect 监听 time 变化时应用动画曲线（_updateAni）
 * - update: 播放时累加 time
 */
export function animationLogic(animation: Animation)
{
    const base = behaviourLogic(animation);
    let _inited = false;

    const logic: any = {
        ...base,
        init()
        {
            if (_inited) return;
            _inited = true;
            base.init();

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
        update(interval: number)
        {
            base.update(interval);
            const r_animation = reactive(animation);
            if (r_animation.isplaying)
            {
                r_animation.time = r_animation.time + interval * animation.playspeed;
            }
        },
        dispose()
        {
            const r_animation = reactive(animation);
            r_animation.animation = null;
            r_animation.animations = null;
            base.dispose();
        },
    };

    function _updateAni()
    {
        if (!animation.animation) return;

        const cycle = animation.animation.length;
        const cliptime = (animation.time % cycle + cycle) % cycle;

        const propertyClips = animation.animation.propertyClips;

        for (let i = 0; i < propertyClips.length; i++)
        {
            const propertyClip = propertyClips[i];

            if (propertyClip.times.length === 0) continue;
            const propertyHost = getPropertyHost(propertyClip);
            if (!propertyHost) continue;
            propertyHost[propertyClip.propertyName] = propertyClip.getValue(cliptime);
        }
    }

    function getPropertyHost(propertyClip: PropertyClip)
    {
        let propertyHost: any = logic.object3D;
        const path = propertyClip.path;

        for (let i = 0; i < path.length; i++)
        {
            const element = path[i];
            switch (element[0])
            {
                case PropertyClipPathItemType.Object3D:
                    propertyHost = findObject3DChild(propertyHost, element[1]);
                    break;
                case PropertyClipPathItemType.Component:
                {
                    const componentClass = classUtils.getDefinitionByName(element[1]);
                    propertyHost = propertyHost.components.find((c: any) => c instanceof componentClass);
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

        return propertyHost;
    }

    return logic as any;
}

// 注册到 componentLogic 分发表
registerLogic('Animation', (component) =>
{
    return animationLogic(component as Animation) as any;
});
