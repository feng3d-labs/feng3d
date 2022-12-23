import { oav } from '../../objectview/ObjectView';
import { decoratorRegisterClass } from '../../serialization/ClassUtils';
import { serialize } from '../../serialization/serialize';
import { watcher } from '../../watcher/watcher';
import { Behaviour } from '../component/Behaviour';
import { RegisterComponent } from '../component/Component';
import { AddComponentMenu } from '../Menu';

export let audioCtx: AudioContext;
export let globalGain: GainNode;

declare global
{
    export interface MixinsComponentMap
    {
        AudioListener: AudioListener;
    }
}
/**
 * 声音监听器
 */
@AddComponentMenu('Audio/AudioListener')
@RegisterComponent()
@decoratorRegisterClass()
export class AudioListener extends Behaviour
{
    gain: GainNode;

    declare enabled: boolean;

    /**
     * 音量
     */
    @serialize
    @oav({ tooltip: '音量' })
    get volume()
    {
        return this._volume;
    }
    set volume(v)
    {
        this._volume = v;
        this.gain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.01);
    }
    private _volume = 1;

    constructor()
    {
        super();
        watcher.watch(this as AudioListener, 'enabled', this._enabledChanged, this);
        this.gain = audioCtx.createGain();
        this.gain.connect(audioCtx.destination);
        this.enabled = true;
    }

    init()
    {
        super.init();
        this.on('globalMatrixChanged', this._onGlobalMatrixChanged, this);
        this._onGlobalMatrixChanged();
    }

    private _onGlobalMatrixChanged()
    {
        const globalMatrix = this.object3D.globalMatrix;
        const position = globalMatrix.getPosition();
        const forward = globalMatrix.getAxisZ();
        const up = globalMatrix.getAxisY();
        //
        const listener = audioCtx.listener;
        // feng3d中为左手坐标系，listener中使用的为右手坐标系，参考https://developer.mozilla.org/en-US/docs/Web/API/AudioListener
        if (listener.forwardX)
        {
            listener.positionX.setValueAtTime(position.x, audioCtx.currentTime);
            listener.positionY.setValueAtTime(position.y, audioCtx.currentTime);
            listener.positionZ.setValueAtTime(-position.z, audioCtx.currentTime);
            listener.forwardX.setValueAtTime(forward.x, audioCtx.currentTime);
            listener.forwardY.setValueAtTime(forward.y, audioCtx.currentTime);
            listener.forwardZ.setValueAtTime(-forward.z, audioCtx.currentTime);
            listener.upX.setValueAtTime(up.x, audioCtx.currentTime);
            listener.upY.setValueAtTime(up.y, audioCtx.currentTime);
            listener.upZ.setValueAtTime(-up.z, audioCtx.currentTime);
        }
        else
        {
            listener.setOrientation(forward.x, forward.y, -forward.z, up.x, up.y, -up.z);
            listener.setPosition(position.x, position.y, -position.z);
        }
    }

    private _enabledChanged()
    {
        if (!this.gain) return;
        if (this.enabled)
        {
            globalGain.connect(this.gain);
        }
        else
        {
            globalGain.disconnect(this.gain);
        }
    }

    dispose()
    {
        this.off('globalMatrixChanged', this._onGlobalMatrixChanged, this);
        super.dispose();
    }
}

(() =>
{
    if (typeof window === 'undefined') return;

    window['AudioContext'] = window['AudioContext'] || window['webkitAudioContext'];

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
