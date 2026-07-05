import { Behaviour, createBehaviour } from '../component/Behaviour';

import './audioListenerLogic';

declare global
{
    export interface MixinsComponentMap
    {
        AudioListener: AudioListener;
    }
}

/**
 * AudioListener（纯数据接口）。
 */
export interface AudioListener extends Behaviour
{
    gain: GainNode;
    volume: number;
}

/**
 * 创建 AudioListener 实例。
 */
export function createAudioListener(): AudioListener
{
    return {
        __type__: 'AudioListener', ...createBehaviour(),
        gain: null as any,
        volume: 1,
    };
}
