import { Behaviour, BehaviourLogic } from '../component/Behaviour';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
import type { Object3D } from '../core/Object3D';


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
 * AudioListener 逻辑类。
 *
 * 继承 BehaviourLogic，额外：
 * - volume getter/setter（带 gain 节点副作用）
 * - effect 监听 enabled 变化时连接/断开 gain
 * - effect 监听 local2world 变化时更新 listener 位置/朝向
 */
export class AudioListenerLogic extends BehaviourLogic
{
    /** 数据引用 */
    readonly #audioListener: AudioListener;

    #gain: GainNode | null = null;
    #volume = 1;
    /** init 去重标志（同一 component 只初始化一次） */
    #subInited = false;

    protected constructor(data: AudioListener)
    {
        super(data);
        this.#audioListener = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: AudioListener): AudioListenerLogic
    {
        return new AudioListenerLogic(data);
    }

    /** 音量 */
    get volume(): number
    {
        return this.#volume;
    }

    set volume(v: number)
    {
        this.#volume = v;
        if (this.#gain)
        {
            this.#gain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.01);
        }
    }

    #enabledChanged(): void
    {
        if (!this.#gain) return;
        if (this.#audioListener.enabled)
        {
            globalGain.connect(this.#gain);
        }
        else
        {
            globalGain.disconnect(this.#gain);
        }
    }

    #onScenetransformChanged(): void
    {
        const local2world = getLogic(this.entity).local2world;
        const position = local2world.getPosition();
        // 相机/监听器 forward 为本地 -Z（投影矩阵 m[11]=-1 约定）
        const forward = local2world.getAxisZ(); forward.x = -forward.x; forward.y = -forward.y; forward.z = -forward.z;
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

    override init(object3D?: Object3D): void
    {
        if (this.#subInited) return;
        this.#subInited = true;
        super.init(object3D);

        this.#gain = audioCtx.createGain();
        this.#gain.connect(audioCtx.destination);
        reactive(this.#audioListener).gain = this.#gain;
        reactive(this.#audioListener).enabled = true;

        // @边界 effect：WebAudio 外设同步（gain 连接状态，推模式）
        // effect 监听 enabled 变化时连接/断开 gain
        effect(() =>
        {
            reactive(this.#audioListener).enabled;
            this.#enabledChanged();
        });

        // @边界 effect：WebAudio 外设同步（listener 位置/朝向）
        // effect 监听 local2world 变化时更新 listener
        effect(() =>
        {
            getLogic(this.entity).local2world;
            this.#onScenetransformChanged();
        });
    }

    override dispose(): void
    {
        super.dispose();
        this.#gain = null;
    }
}
// 注册到 logic 分发表
registerLogic('AudioListener', AudioListenerLogic as unknown as new (data: AudioListener) => AudioListenerLogic);
