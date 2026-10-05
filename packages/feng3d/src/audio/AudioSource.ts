import { ErrorCode, reportDegradation } from '../core/CodedError';
import { getAudioCtx, getGlobalGain } from './AudioListener';
import { behaviourLogicProto, setupBehaviourLogicState, Behaviour, BehaviourLogic, type BehaviourLogicState } from '../component/Behaviour';
import { registerLogic, logic as getLogic, effect, reactive, createLogicProto } from "@feng3d/reactivity";
import { mat4GetPosition } from '@feng3d/math';
import type { Object3D } from '../core/Object3D';


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

/** AudioSourceLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface AudioSourceLogicState extends BehaviourLogicState
{
    /** 数据引用 */
    _audioSource: AudioSource;

    _panner: PannerNode | null;
    _source: AudioBufferSourceNode | null;
    _buffer: AudioBuffer | null;
    _gain: GainNode | null;
    /** init 去重标志（同一 component 只初始化一次） */
    _subInited: boolean;

    _connect: () => void;
    _disconnect: () => void;
    _enabledChanged: () => void;
    _onScenetransformChanged: () => void;
    _onUrlChanged: () => Promise<void>;
}

/** AudioSourceLogic 的共享原型：继承 Behaviour 基类实现，实现 stop / play 并覆写 init / dispose */
const audioSourceLogicProto = createLogicProto<AudioSourceLogic>(behaviourLogicProto, {
    /** 停止播放 */
    stop: {
        value: function (this: AudioSourceLogic & AudioSourceLogicState): void
        {
            if (this._source)
            {
                this._source.stop(0);
                this._disconnect();
                this._source = null;
            }
        },
    },
    init: {
        value: function (this: AudioSourceLogic & AudioSourceLogicState, object3D?: Object3D): void
        {
            if (this._subInited) return;
            this._subInited = true;
            behaviourLogicProto.init.call(this, object3D);

            this._panner = createPanner();
            // 初始化 panner 参数
            this._panner.panningModel = 'HRTF';
            this._panner.distanceModel = DistanceModelType.inverse;
            this._panner.refDistance = 1;
            this._panner.maxDistance = 10000;
            this._panner.rolloffFactor = 1;
            this._panner.coneInnerAngle = 360;
            this._panner.coneOuterAngle = 0;
            this._panner.coneOuterGain = 0;
            this._gain = getAudioCtx().createGain();
            this._gain.gain.setTargetAtTime(1, getAudioCtx().currentTime, 0.01);
            this._enabledChanged();
            this._connect();

            // @边界 effect：WebAudio 外设同步（panner 节点参数）
            // effect 监听 panner 参数变化
            effect(() =>
            {
                const r_audioSource = reactive(this._audioSource);
                if (this._panner)
                {
                    this._panner.panningModel = r_audioSource.panningModel;
                    this._panner.distanceModel = r_audioSource.distanceModel;
                    this._panner.refDistance = r_audioSource.refDistance;
                    this._panner.maxDistance = r_audioSource.maxDistance;
                    this._panner.rolloffFactor = r_audioSource.rolloffFactor;
                    this._panner.coneInnerAngle = r_audioSource.coneInnerAngle;
                    this._panner.coneOuterAngle = r_audioSource.coneOuterAngle;
                    this._panner.coneOuterGain = r_audioSource.coneOuterGain;
                }
            });

            // @边界 effect：WebAudio 外设同步（gain 音量）
            // effect 监听 volume 变化
            effect(() =>
            {
                const v = reactive(this._audioSource).volume;
                if (this._gain)
                {
                    this._gain.gain.setTargetAtTime(v, getAudioCtx().currentTime, 0.01);
                }
            });

            // @边界 effect：WebAudio 外设同步（gain 连接状态）
            // effect 监听 enabled 变化
            effect(() =>
            {
                reactive(this._audioSource).enabled;
                this._enabledChanged();
            });

            // @边界 effect：WebAudio 外设同步（音频资源加载）
            // effect 监听 url 变化
            effect(() =>
            {
                reactive(this._audioSource).url;
                this._onUrlChanged();
            });

            // @边界 effect：WebAudio 外设同步（节点拓扑重连）
            // effect 监听 enablePosition 变化时重连
            effect(() =>
            {
                reactive(this._audioSource).enablePosition;
                this._disconnect();
                this._connect();
            });

            // @边界 effect：WebAudio 外设同步（panner 位置/朝向）
            // effect 监听 local2world 变化
            effect(() =>
            {
                getLogic(this.entity!).local2world;
                this._onScenetransformChanged();
            });
        },
    },
    /** 播放音频 */
    play: {
        value: function (this: AudioSourceLogic & AudioSourceLogicState): void
        {
            this.stop();
            if (this._buffer)
            {
                this._source = getAudioCtx().createBufferSource();
                this._source.buffer = this._buffer;
                this._connect();
                this._source.loop = this._audioSource.loop;
                this._source.start(0);
            }
        },
    },
    dispose: {
        value: function (this: AudioSourceLogic & AudioSourceLogicState): void
        {
            this._disconnect();
            behaviourLogicProto.dispose.call(this);
            this._panner = null;
            this._source = null;
            this._buffer = null;
            this._gain = null;
        },
    },
});

/**
 * 工厂函数：AudioSourceLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function audioSourceLogic(data: AudioSource): AudioSourceLogic
{
    const logic = setupBehaviourLogicState(Object.create(audioSourceLogicProto) as AudioSourceLogic & AudioSourceLogicState, data);

    logic._audioSource = data;
    logic._panner = null;
    logic._source = null;
    logic._buffer = null;
    logic._gain = null;
    logic._subInited = false;

    function getAudioNodes(): AudioNode[]
    {
        const arr: AudioNode[] = [];
        arr.push(logic._gain!);
        if (logic._audioSource.enablePosition)
        {
            arr.push(logic._panner!);
        }
        if (logic._source)
        {
            arr.push(logic._source);
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
        if (!logic._gain)
        {
            return;
        }
        if (logic._audioSource.enabled)
        {
            logic._gain.connect(getGlobalGain());
        }
        else
        {
            logic._gain.disconnect(getGlobalGain());
        }
    }

    function onScenetransformChanged(): void
    {
        const local2world = getLogic(logic.entity!).local2world;
        const scenePosition = mat4GetPosition(local2world);

        const panner = logic._panner!;
        if (panner.orientationX)
        {
            panner.positionX.value = scenePosition.x;
            panner.positionY.value = scenePosition.y;
            panner.positionZ.value = -scenePosition.z;
            panner.orientationX.value = 1;
            panner.orientationY.value = 0;
            panner.orientationZ.value = 0;
        }
        else
        {
            panner.setPosition(scenePosition.x, scenePosition.y, -scenePosition.z);
            panner.setOrientation(1, 0, 0);
        }
    }

    const onUrlChanged = async (): Promise<void> =>
    {
        logic.stop();
        if (logic._audioSource.url)
        {
            const url = logic._audioSource.url;
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
            if (url !== logic._audioSource.url)
            {
                return;
            }
            getAudioCtx().decodeAudioData(data, (buffer) =>
            {
                logic._buffer = buffer;
            });
        }
    };

    logic._connect = connect;
    logic._disconnect = disconnect;
    logic._enabledChanged = enabledChanged;
    logic._onScenetransformChanged = onScenetransformChanged;
    logic._onUrlChanged = onUrlChanged;

    return logic;
}
// 注册到 logic 分发表
registerLogic('AudioSource', audioSourceLogic);
