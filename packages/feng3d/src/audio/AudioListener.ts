import { Behaviour, BehaviourLogic, createBehaviourLogicBase } from '../component/Behaviour';
import { registerLogic, logic as getLogic, effect, reactive } from '@feng3d/reactivity';
import { mat4GetAxisY, mat4GetAxisZ, mat4GetPosition } from '@feng3d/math';


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
 * AudioListener 逻辑接口。
 *
 * 继承 BehaviourLogic，额外：
 * - volume getter/setter（带 gain 节点副作用）
 * - effect 监听 enabled 变化时连接/断开 gain
 * - effect 监听 local2world 变化时更新 listener 位置/朝向
 */
export interface AudioListenerLogic extends BehaviourLogic
{
    /** 音量 */
    volume: number;
}

/**
 * 工厂函数：AudioListenerLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function audioListenerLogic(data: AudioListener): AudioListenerLogic
{
    const { members } = createBehaviourLogicBase(data);

    const audioListener = data;
    let gain: GainNode | null = null;
    let volume = 1;
    let subInited = false;

    function enabledChanged(): void
    {
        if (!gain) return;
        if (audioListener.enabled)
        {
            getGlobalGain().connect(gain);
        }
        else
        {
            getGlobalGain().disconnect(gain);
        }
    }

    function onScenetransformChanged(): void
    {
        const local2world = getLogic(members.entity!).local2world;
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

    const logic: AudioListenerLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        /** 音量 */
        get volume() { return volume; },
        set volume(v)
        {
            volume = v;
            if (gain)
            {
                gain.gain.setTargetAtTime(v, getAudioCtx().currentTime, 0.01);
            }
        },
        /** 初始化：注入 entity（同一 component 只初始化一次） */
        init(object3D)
        {
            if (subInited) return;
            subInited = true;
            members.init(object3D);

            gain = getAudioCtx().createGain();
            gain.connect(getAudioCtx().destination);
            reactive(audioListener).gain = gain;
            reactive(audioListener).enabled = true;

            // @边界 effect：WebAudio 外设同步（gain 连接状态，推模式）
            // effect 监听 enabled 变化时连接/断开 gain
            effect(() =>
            {
                reactive(audioListener).enabled;
                enabledChanged();
            });

            // @边界 effect：WebAudio 外设同步（listener 位置/朝向）
            // effect 监听 local2world 变化时更新 listener
            effect(() =>
            {
                getLogic(members.entity!).local2world;
                onScenetransformChanged();
            });
        },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        update(interval) { members.update(interval); },
        get isLoaded() { return members.isLoaded; },
        dispose()
        {
            members.dispose();
            gain = null;
        },
    };

    return logic;
}
// 注册到 logic 分发表
registerLogic('AudioListener', audioListenerLogic);
