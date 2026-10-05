import { ErrorCode, reportDegradation } from '../core/CodedError';
import { getAudioCtx, getGlobalGain } from './AudioListener';
import { Behaviour, BehaviourLogic, createBehaviourLogicBase } from '../component/Behaviour';
import { registerLogic, logic as getLogic, effect, reactive } from '@feng3d/reactivity';
import { mat4GetPosition } from '@feng3d/math';


declare module '../component/Component'
{
    export interface ComponentMap
    {
        AudioSource: AudioSource;
    }
}

/**
 * AudioSource（纯数据接口）。
 */
export interface AudioSource extends Behaviour
{
    readonly __type__: 'AudioSource';
    readonly url: string;
    readonly loop: boolean;
    readonly volume: number;
    readonly enablePosition: boolean;
    readonly coneInnerAngle: number;
    readonly coneOuterAngle: number;
    readonly coneOuterGain: number;
    readonly distanceModel: DistanceModelType;
    readonly maxDistance: number;
    readonly panningModel: PanningModelType;
    readonly refDistance: number;
    readonly rolloffFactor: number;
}

export enum DistanceModelType { linear = 'linear', inverse = 'inverse', exponential = 'exponential' }

export function createPanner(): PannerNode
{
    const panner = getAudioCtx().createPanner();
    if (panner.orientationX) { panner.orientationX.value = 1; panner.orientationY.value = 0; panner.orientationZ.value = 0; }
    else { panner.setOrientation(1, 0, 0); }
    return panner;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        AudioSource: AudioSourceLogic;
    }
}

/**
 * AudioSource 逻辑接口。
 *
 * 继承 BehaviourLogic，额外：
 * - panner/gain/source WebAudio 节点管理
 * - effect 监听各 panner 参数变化时同步到 panner 节点
 * - effect 监听 enabled / url 变化时连接/断开 gain、重新加载音频
 * - effect 监听 local2world 变化时更新 panner 位置/朝向
 * - play / stop 控制
 */
export interface AudioSourceLogic extends BehaviourLogic
{
    /** 停止播放 */
    stop(): void;
    /** 播放音频 */
    play(): void;
}

/**
 * 工厂函数：AudioSourceLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function audioSourceLogic(data: AudioSource): AudioSourceLogic
{
    const { members } = createBehaviourLogicBase(data);

    const audioSource = data;
    let panner: PannerNode | null = null;
    let source: AudioBufferSourceNode | null = null;
    let audioBuffer: AudioBuffer | null = null;
    let gain: GainNode | null = null;
    /** init 去重标志（同一 component 只初始化一次） */
    let subInited = false;

    function getAudioNodes(): AudioNode[]
    {
        const arr: AudioNode[] = [];
        arr.push(gain!);
        if (audioSource.enablePosition)
        {
            arr.push(panner!);
        }
        if (source)
        {
            arr.push(source);
        }

        return arr;
    }

    function connect(): void
    {
        const arr = getAudioNodes();
        for (let i = 0; i < arr.length - 1; i++)
        {
            arr[i + 1].connect(arr[i]);
        }
    }

    function disconnect(): void
    {
        const arr = getAudioNodes();
        for (let i = 0; i < arr.length - 1; i++)
        {
            arr[i + 1].disconnect(arr[i]);
        }
    }

    function enabledChanged(): void
    {
        if (!gain)
        {
            return;
        }
        if (audioSource.enabled)
        {
            gain.connect(getGlobalGain());
        }
        else
        {
            gain.disconnect(getGlobalGain());
        }
    }

    function onScenetransformChanged(): void
    {
        const local2world = getLogic(members.entity!).local2world;
        const scenePosition = mat4GetPosition(local2world);

        const pannerNode = panner!;
        if (pannerNode.orientationX)
        {
            pannerNode.positionX.value = scenePosition.x;
            pannerNode.positionY.value = scenePosition.y;
            pannerNode.positionZ.value = -scenePosition.z;
            pannerNode.orientationX.value = 1;
            pannerNode.orientationY.value = 0;
            pannerNode.orientationZ.value = 0;
        }
        else
        {
            pannerNode.setPosition(scenePosition.x, scenePosition.y, -scenePosition.z);
            pannerNode.setOrientation(1, 0, 0);
        }
    }

    function stopSound(): void
    {
        if (source)
        {
            source.stop(0);
            disconnect();
            source = null;
        }
    }

    const onUrlChanged = async (): Promise<void> =>
    {
        stopSound();
        if (audioSource.url)
        {
            const url = audioSource.url;
            const response = await fetch(url);
            if (!response.ok)
            {
                // 音频是可选资源：URL 取不到时**降级**（该音源不可用、其余照常），
                // 而不是抛错——抛在这里是个 async handler，会变成 unhandled rejection，
                // 把一次"资源没了"放大成"整个场景加载失败"。
                // 用 reportDegradation 留痕：默认不打印但计数照加，dev 下可解码出原因。
                reportDegradation(ErrorCode.AudioLoadFailed, { url, status: response.status });

                return;
            }
            const data = await response.arrayBuffer();
            if (url !== audioSource.url)
            {
                return;
            }
            getAudioCtx().decodeAudioData(data, (buffer) =>
            {
                audioBuffer = buffer;
            });
        }
    };

    const logic: AudioSourceLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        /** 停止播放 */
        stop()
        {
            stopSound();
        },
        /** 初始化：注入 entity（同一 component 只初始化一次） */
        init(object3D)
        {
            if (subInited) return;
            subInited = true;
            members.init(object3D);

            panner = createPanner();
            // 初始化 panner 参数
            panner.panningModel = 'HRTF';
            panner.distanceModel = DistanceModelType.inverse;
            panner.refDistance = 1;
            panner.maxDistance = 10000;
            panner.rolloffFactor = 1;
            panner.coneInnerAngle = 360;
            panner.coneOuterAngle = 0;
            panner.coneOuterGain = 0;
            gain = getAudioCtx().createGain();
            gain.gain.setTargetAtTime(1, getAudioCtx().currentTime, 0.01);
            enabledChanged();
            connect();

            // @边界 effect：WebAudio 外设同步（panner 节点参数）
            // effect 监听 panner 参数变化
            effect(() =>
            {
                const r_audioSource = reactive(audioSource);
                if (panner)
                {
                    panner.panningModel = r_audioSource.panningModel;
                    panner.distanceModel = r_audioSource.distanceModel;
                    panner.refDistance = r_audioSource.refDistance;
                    panner.maxDistance = r_audioSource.maxDistance;
                    panner.rolloffFactor = r_audioSource.rolloffFactor;
                    panner.coneInnerAngle = r_audioSource.coneInnerAngle;
                    panner.coneOuterAngle = r_audioSource.coneOuterAngle;
                    panner.coneOuterGain = r_audioSource.coneOuterGain;
                }
            });

            // @边界 effect：WebAudio 外设同步（gain 音量）
            // effect 监听 volume 变化
            effect(() =>
            {
                const v = reactive(audioSource).volume;
                if (gain)
                {
                    gain.gain.setTargetAtTime(v, getAudioCtx().currentTime, 0.01);
                }
            });

            // @边界 effect：WebAudio 外设同步（gain 连接状态）
            // effect 监听 enabled 变化
            effect(() =>
            {
                reactive(audioSource).enabled;
                enabledChanged();
            });

            // @边界 effect：WebAudio 外设同步（音频资源加载）
            // effect 监听 url 变化
            effect(() =>
            {
                reactive(audioSource).url;
                onUrlChanged();
            });

            // @边界 effect：WebAudio 外设同步（节点拓扑重连）
            // effect 监听 enablePosition 变化时重连
            effect(() =>
            {
                reactive(audioSource).enablePosition;
                disconnect();
                connect();
            });

            // @边界 effect：WebAudio 外设同步（panner 位置/朝向）
            // effect 监听 local2world 变化
            effect(() =>
            {
                getLogic(members.entity!).local2world;
                onScenetransformChanged();
            });
        },
        /** 播放音频 */
        play()
        {
            stopSound();
            if (audioBuffer)
            {
                source = getAudioCtx().createBufferSource();
                source.buffer = audioBuffer;
                connect();
                source.loop = audioSource.loop;
                source.start(0);
            }
        },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        update(interval) { members.update(interval); },
        get isLoaded() { return members.isLoaded; },
        dispose()
        {
            disconnect();
            members.dispose();
            panner = null;
            source = null;
            audioBuffer = null;
            gain = null;
        },
    };

    return logic;
}
// 注册到 logic 分发表
registerLogic('AudioSource', audioSourceLogic);
