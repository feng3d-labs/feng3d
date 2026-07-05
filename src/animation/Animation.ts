import { Behaviour, createBehaviour } from '../component/Behaviour';
import type { AnimationClip } from './AnimationClip';

import './animationLogic';

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
    animation: AnimationClip;
    animations: AnimationClip[];
    time: number;
    isplaying: boolean;
    playspeed: number;
}

/**
 * 创建 Animation 实例。
 */
export function createAnimation(): Animation
{
    return {
        __type__: 'Animation', ...createBehaviour(),
        animation: null as any,
        animations: [],
        time: 0,
        isplaying: false,
        playspeed: 1,
    };
}
