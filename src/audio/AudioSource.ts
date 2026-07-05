import { audioCtx } from './AudioListener';
import { Behaviour, createBehaviour } from '../component/Behaviour';

import './audioSourceLogic';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        AudioSource: AudioSource;
    }
}

/**
 * AudioSource（纯数据接口）。
 */
export interface AudioSource extends Behaviour
{
    readonly __type__: 'AudioSource';
    readonly url: string;
    readonly loop: boolean;
    readonly volume: number;
    readonly enablePosition: boolean;
    readonly coneInnerAngle: number;
    readonly coneOuterAngle: number;
    readonly coneOuterGain: number;
    readonly distanceModel: string;
    readonly maxDistance: number;
    readonly panningModel: string;
    readonly refDistance: number;
    readonly rolloffFactor: number;
}

/**
 * 创建 AudioSource 实例。
 */
export function createAudioSource(): AudioSource
{
    return {
        ...createBehaviour(), __type__: 'AudioSource',
        url: '',
        loop: true,
        volume: 1,
        enablePosition: true,
        coneInnerAngle: 360,
        coneOuterAngle: 0,
        coneOuterGain: 0,
        distanceModel: 'inverse',
        maxDistance: 10000,
        panningModel: 'HRTF',
        refDistance: 1,
        rolloffFactor: 1,
    };
}

export enum DistanceModelType { linear = 'linear', inverse = 'inverse', exponential = 'exponential' }

export function createPanner(): PannerNode
{
    const panner = audioCtx.createPanner();
    if (panner.orientationX) { panner.orientationX.value = 1; panner.orientationY.value = 0; panner.orientationZ.value = 0; }
    else { panner.setOrientation(1, 0, 0); }
    return panner;
}
