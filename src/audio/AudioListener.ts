import { Behaviour, createBehaviour } from '../component/Behaviour';

import './audioListenerLogic';

declare module '../component/Component'
{
    export interface ComponentMap
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

export let audioCtx: AudioContext;
export let globalGain: GainNode;

(() =>
{
    if (typeof window === 'undefined') return;
    (window as any)['AudioContext'] = (window as any)['AudioContext'] || (window as any)['webkitAudioContext'];
    audioCtx = new AudioContext();
    globalGain = audioCtx.createGain();
    const zeroGain = audioCtx.createGain();
    zeroGain.connect(audioCtx.destination);
    globalGain.connect(zeroGain);
    zeroGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.01);
    const listener = audioCtx.listener;
    audioCtx.createGain();
    if (listener.forwardX)
    {
        listener.forwardX.value = 0; listener.forwardY.value = 0; listener.forwardZ.value = -1;
        listener.upX.value = 0; listener.upY.value = 1; listener.upZ.value = 0;
    }
    else { listener.setOrientation(0, 0, -1, 0, 1, 0); }
})();
