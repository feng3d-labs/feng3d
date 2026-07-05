import { Behaviour, createBehaviour } from '../component/Behaviour';

import './audioSourceLogic';

declare global
{
    export interface MixinsComponentMap
    {
        AudioSource: AudioSource;
    }
}

/**
 * AudioSource（纯数据接口）。
 */
export interface AudioSource extends Behaviour
{
    url: string;
    loop: boolean;
    volume: number;
    enablePosition: boolean;
    coneInnerAngle: number;
    coneOuterAngle: number;
    coneOuterGain: number;
    distanceModel: string;
    maxDistance: number;
    panningModel: string;
    refDistance: number;
    rolloffFactor: number;
}

/**
 * 创建 AudioSource 实例。
 */
export function createAudioSource(): AudioSource
{
    return {
        __type__: 'AudioSource', ...createBehaviour(),
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
