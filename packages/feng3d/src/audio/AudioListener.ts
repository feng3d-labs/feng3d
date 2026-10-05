import { Behaviour, BehaviourLogic } from '../component/Behaviour';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
import { mat4GetAxisY, mat4GetAxisZ, mat4GetPosition } from '@feng3d/math';
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
    /**
     * 音频增益节点。由 `AudioListenerLogic` 初始化时**注入**（`reactive(data).gain = …`）——
     * `GainNode` 不是纯数据、无法字面量构造，所以数据字段上声明为可选。
     */
    readonly gain?: GainNode;
    readonly volume: number;
}

let audioCtxCache: AudioContext | null = null;
let globalGainCache: GainNode | null = null;

/**
 * 取得全局 AudioContext（**首次调用时**才创建）。
 *
 * 不在模块加载时创建，原因有二：
 *  1. 浏览器要求 AudioContext 在用户交互之后才能启动，模块加载即创建会在控制台报
 *     "The AudioContext was not allowed to start"（issue #56 的截图就是这个警告）；
 *  2. 模块级 `new` 属于 R2「零模块级副作用」禁止的形态（顶层执行代码）。
 */
export function getAudioCtx(): AudioContext
{
    if (audioCtxCache !== null) return audioCtxCache;

    // 旧版 Safari 前缀兼容（webkitAudioContext 与 AudioContext 等价）
    const w = window as unknown as { AudioContext?: typeof AudioContext, webkitAudioContext?: typeof AudioContext };

    w.AudioContext = w.AudioContext || w.webkitAudioContext;
    const ctx = new AudioContext();

    audioCtxCache = ctx;

    const gain = ctx.createGain();
    const zeroGain = ctx.createGain();

    zeroGain.connect(ctx.destination);
    gain.connect(zeroGain);
    zeroGain.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
    globalGainCache = gain;

    const listener = ctx.listener;

    if (listener.forwardX)
    {
        listener.forwardX.value = 0; listener.forwardY.value = 0; listener.forwardZ.value = -1;
        listener.upX.value = 0; listener.upY.value = 1; listener.upZ.value = 0;
    }
    else { listener.setOrientation(0, 0, -1, 0, 1, 0); }

    return ctx;
}

/** 取得全局增益节点（内部会确保 AudioContext 已创建） */
export function getGlobalGain(): GainNode
{
    getAudioCtx();

    return globalGainCache!;
}

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
            this.#gain.gain.setTargetAtTime(v, getAudioCtx().currentTime, 0.01);
        }
    }

    #enabledChanged(): void
    {
        if (!this.#gain) return;
        if (this.#audioListener.enabled)
        {
            getGlobalGain().connect(this.#gain);
        }
        else
        {
            getGlobalGain().disconnect(this.#gain);
        }
    }

    #onScenetransformChanged(): void
    {
        const local2world = getLogic(this.entity!).local2world;
        const position = mat4GetPosition(local2world);
        // 相机/监听器 forward 为本地 -Z（投影矩阵 m[11]=-1 约定）
        const forward = mat4GetAxisZ(local2world); forward.x = -forward.x; forward.y = -forward.y; forward.z = -forward.z;
        const up = mat4GetAxisY(local2world);
        //
        const listener = getAudioCtx().listener;
        // feng3d中为左手坐标系，listener中使用的为右手坐标系
        if (listener.forwardX)
        {
            listener.positionX.setValueAtTime(position.x, getAudioCtx().currentTime);
            listener.positionY.setValueAtTime(position.y, getAudioCtx().currentTime);
            listener.positionZ.setValueAtTime(-position.z, getAudioCtx().currentTime);
            listener.forwardX.setValueAtTime(forward.x, getAudioCtx().currentTime);
            listener.forwardY.setValueAtTime(forward.y, getAudioCtx().currentTime);
            listener.forwardZ.setValueAtTime(-forward.z, getAudioCtx().currentTime);
            listener.upX.setValueAtTime(up.x, getAudioCtx().currentTime);
            listener.upY.setValueAtTime(up.y, getAudioCtx().currentTime);
            listener.upZ.setValueAtTime(-up.z, getAudioCtx().currentTime);
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

        this.#gain = getAudioCtx().createGain();
        this.#gain.connect(getAudioCtx().destination);
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
            getLogic(this.entity!).local2world;
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
registerLogic('AudioListener', AudioListenerLogic.create);
