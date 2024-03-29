import { RegisterComponent } from '../../ecs/Component';
import { oav } from '../../objectview/ObjectView';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Component3D } from '../core/Component3D';

export let audioCtx: AudioContext;
export let gainNode: GainNode;

declare module '../../ecs/Component' { interface ComponentMap { AudioListener3D: AudioListener3D; } }

/**
 * 声音监听器
 */
@RegisterComponent({ name: 'AudioListener3D', menu: 'Audio/AudioListener' })
export class AudioListener3D extends Component3D
{
    gain: GainNode;

    declare enabled: boolean;

    /**
     * 音量
     */
    @SerializeProperty()
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
        watcher.watch(this as AudioListener3D, 'enabled', this._enabledChanged, this);
        this.gain = audioCtx.createGain();
        this.gain.connect(audioCtx.destination);
        this.enabled = true;
    }

    init()
    {
        super.init();
        this.emitter.on('globalMatrixChanged', this._onGlobalMatrixChanged, this);
        this._onGlobalMatrixChanged();
    }

    private _onGlobalMatrixChanged()
    {
        const globalMatrix = this.node3d.globalMatrix;
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
            gainNode.connect(this.gain);
        }
        else
        {
            gainNode.disconnect(this.gain);
        }
    }

    dispose()
    {
        this.emitter.off('globalMatrixChanged', this._onGlobalMatrixChanged, this);
        super.dispose();
    }
}

(() =>
{
    if (typeof window === 'undefined') return;

    window['AudioContext'] = window['AudioContext'] || window['webkitAudioContext'];

    audioCtx = new AudioContext();
    gainNode = audioCtx.createGain();

    // 新增无音Gain，避免没有AudioListener组件时暂停声音播放进度
    const zeroGain = audioCtx.createGain();
    zeroGain.connect(audioCtx.destination);
    gainNode.connect(zeroGain);
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
