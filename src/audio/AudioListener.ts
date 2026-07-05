import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Behaviour } from '../component/Behaviour';
;
import { AddComponentMenu } from '../Menu';

// 触发 audioListenerLogic 注册到 componentLogic 分发表
import './audioListenerLogic';

export let audioCtx: AudioContext;
export let globalGain: GainNode;

/**
 * 声音监听器（纯数据）。
 *
 * 音频逻辑（gain 节点、listener 位置/朝向同步、volume）由 {@link audioListenerLogic} 提供。
 */
@AddComponentMenu('Audio/AudioListener')
@decoratorRegisterClass()
export class AudioListener extends Behaviour
{
    readonly __type__: string = 'AudioListener';

    gain: GainNode;

    declare enabled: boolean;

    /**
     * 音量
     */
    @serialize
    @oav({ tooltip: '音量' })
    volume: number;
}

(() =>
{
    if (typeof window === 'undefined') return;

    (window as any)['AudioContext'] = (window as any)['AudioContext'] || (window as any)['webkitAudioContext'];

    audioCtx = new AudioContext();
    globalGain = audioCtx.createGain();

    // 新增无音Gain，避免没有AudioListener组件时暂停声音播放进度
    const zeroGain = audioCtx.createGain();
    zeroGain.connect(audioCtx.destination);
    globalGain.connect(zeroGain);
    zeroGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.01);
    //
    const listener = audioCtx.listener;
    audioCtx.createGain();
    if (listener.forwardX)
    {
        listener.forwardX.value = 0;
        listener.forwardY.value = 0;
        listener.forwardZ.value = -1;
        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;
    }
    else
    {
        listener.setOrientation(0, 0, -1, 0, 1, 0);
    }
})();
