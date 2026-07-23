import { Behaviour, createBehaviour, behaviourLogic, BehaviourLogic } from '../component/Behaviour';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
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
        gain: null as unknown as GainNode,
        volume: 1,
    };
}

export let audioCtx: AudioContext;
export let globalGain: GainNode;

(() =>
{
    if (typeof window === 'undefined') return;
    // 旧版 Safari 前缀兼容（webkitAudioContext 与 AudioContext 等价）
    const w = window as unknown as { AudioContext?: typeof AudioContext, webkitAudioContext?: typeof AudioContext };
    w.AudioContext = w.AudioContext || w.webkitAudioContext;
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
 * AudioListener 逻辑处理接口。
 *
 * 组合 behaviourLogic，额外：
 * - volume getter/setter（带 gain 节点副作用）
 * - effect 监听 enabled 变化时连接/断开 gain
 * - effect 监听 local2world 变化时更新 listener 位置/朝向
 */
export interface AudioListenerLogic extends BehaviourLogic
{
    /** 音量 */
    readonly volume: number;
}

/**
 * 创建 AudioListenerLogic 实例（工厂函数，组合 behaviourLogic 基础行为）。
 */
export function audioListenerLogic(audioListener: AudioListener): AudioListenerLogic
{
    const base = behaviourLogic(audioListener);

    let _gain: GainNode | null = null;
    let _volume = 1;
    /** init 去重标志（同一 component 只初始化一次） */
    let _subInited = false;

    const _enabledChanged = (): void =>
    {
        if (!_gain) return;
        if (audioListener.enabled)
        {
            globalGain.connect(_gain);
        }
        else
        {
            globalGain.disconnect(_gain);
        }
    };

    const _onScenetransformChanged = (): void =>
    {
        const local2world = getLogic(base.entity).local2world;
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
    };

    return Object.assign(base, {
        get volume(): number { return _volume; },
        set volume(v: number)
        {
            _volume = v;
            if (_gain)
            {
                _gain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.01);
            }
        },
        init(object3D?: Object3D): void
        {
            if (_subInited) return;
            _subInited = true;
            base.init(object3D);

            _gain = audioCtx.createGain();
            _gain.connect(audioCtx.destination);
            reactive(audioListener).gain = _gain;
            reactive(audioListener).enabled = true;

            // effect 监听 enabled 变化时连接/断开 gain
            effect(() =>
            {
                reactive(audioListener).enabled;
                _enabledChanged();
            });

            // effect 监听 local2world 变化时更新 listener
            effect(() =>
            {
                getLogic(base.entity).local2world;
                _onScenetransformChanged();
            });
        },
        update(interval: number): void
        {
            base.update(interval);
        },
        dispose(): void
        {
            base.dispose();
            _gain = null;
        },
    }) as unknown as AudioListenerLogic;
}
// 注册到 componentLogic 分发表
registerLogic('AudioListener', audioListenerLogic);
