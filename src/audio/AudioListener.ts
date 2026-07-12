import { Behaviour, createBehaviour } from '../component/Behaviour';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
import { BehaviourLogic } from '../component/Behaviour';
import type { Object3D } from '../core/Object3D';

import './AudioListener';

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
    readonly __type__: 'AudioListener';
    readonly gain: GainNode;
    readonly volume: number;
}

/**
 * 创建 AudioListener 实例。
 */
export function createAudioListener(): AudioListener
{
    return {
        ...createBehaviour(), __type__: 'AudioListener',
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

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        AudioListener: AudioListenerLogic;
    }
}

/**
 * AudioListener 逻辑处理输出。
 *
 * 组合 behaviourLogic，额外：
 * - volume getter/setter（带 gain 节点副作用）
 * - effect 监听 enabled 变化时连接/断开 gain
 * - effect 监听 local2world 变化时更新 listener 位置/朝向
 */
export class AudioListenerLogic extends BehaviourLogic
{
    private _gain: GainNode | null = null;
    private _volume = 1;
    /** init 去重标志（同一 component 只初始化一次） */
    private _subInited = false;

    constructor(audioListener: AudioListener)
    {
        super(audioListener);
    }

    get volume(): number { return this._volume; }

    set volume(v: number)
    {
        this._volume = v;
        if (this._gain)
        {
            this._gain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.01);
        }
    }

    private _enabledChanged(): void
    {
        if (!this._gain) return;
        const audioListener = this.component as AudioListener;
        if (audioListener.enabled)
        {
            globalGain.connect(this._gain);
        }
        else
        {
            globalGain.disconnect(this._gain);
        }
    }

    private _onScenetransformChanged(): void
    {
        const local2world = getLogic(this.entity).local2world.value;
        const position = local2world.getPosition();
        const forward = local2world.getAxisZ();
        const up = local2world.getAxisY();
        //
        const listener = audioCtx.listener;
        // feng3d中为左手坐标系，listener中使用的为右手坐标系
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

    init(object3D?: Object3D): void
    {
        if (this._subInited) return;
        this._subInited = true;
        super.init(object3D);

        const audioListener = this.component as AudioListener;

        this._gain = audioCtx.createGain();
        this._gain.connect(audioCtx.destination);
        reactive(audioListener).gain = this._gain;
        reactive(audioListener).enabled = true;

        // effect 监听 enabled 变化时连接/断开 gain
        effect(() =>
        {
            reactive(audioListener).enabled;
            this._enabledChanged();
        });

        // effect 监听 local2world 变化时更新 listener
        effect(() =>
        {
            getLogic(this.entity).local2world.value;
            this._onScenetransformChanged();
        });
    }

    update(interval: number): void
    {
        super.update(interval);
    }

    dispose(): void
    {
        super.dispose();
        this._gain = null;
    }
}
// 注册到 componentLogic 分发表
registerLogic('AudioListener', AudioListenerLogic);
