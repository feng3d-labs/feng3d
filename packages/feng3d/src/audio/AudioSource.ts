import { audioCtx, globalGain } from './AudioListener';
import { Behaviour, BehaviourLogic } from '../component/Behaviour';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
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
    const panner = audioCtx.createPanner();
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
 * AudioSource 逻辑类。
 *
 * 继承 BehaviourLogic，额外：
 * - panner/gain/source WebAudio 节点管理
 * - effect 监听各 panner 参数变化时同步到 panner 节点
 * - effect 监听 enabled / url 变化时连接/断开 gain、重新加载音频
 * - effect 监听 local2world 变化时更新 panner 位置/朝向
 * - play / stop 控制
 */
export class AudioSourceLogic extends BehaviourLogic
{
    /** 数据引用 */
    readonly #audioSource: AudioSource;

    #panner: PannerNode | null = null;
    #source: AudioBufferSourceNode | null = null;
    #buffer: AudioBuffer | null = null;
    #gain: GainNode | null = null;
    /** init 去重标志（同一 component 只初始化一次） */
    #subInited = false;

    protected constructor(data: AudioSource)
    {
        super(data);
        this.#audioSource = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: AudioSource): AudioSourceLogic
    {
        return new AudioSourceLogic(data);
    }

    #getAudioNodes(): AudioNode[]
    {
        const arr: AudioNode[] = [];
        arr.push(this.#gain!);
        if (this.#audioSource.enablePosition)
        {
            arr.push(this.#panner!);
        }
        if (this.#source)
        {
            arr.push(this.#source);
        }

        return arr;
    }

    #connect(): void
    {
        const arr = this.#getAudioNodes();
        for (let i = 0; i < arr.length - 1; i++)
        {
            arr[i + 1].connect(arr[i]);
        }
    }

    #disconnect(): void
    {
        const arr = this.#getAudioNodes();
        for (let i = 0; i < arr.length - 1; i++)
        {
            arr[i + 1].disconnect(arr[i]);
        }
    }

    #enabledChanged(): void
    {
        if (!this.#gain)
        {
            return;
        }
        if (this.#audioSource.enabled)
        {
            this.#gain.connect(globalGain);
        }
        else
        {
            this.#gain.disconnect(globalGain);
        }
    }

    #onScenetransformChanged(): void
    {
        const local2world = getLogic(this.entity).local2world;
        const scenePosition = local2world.getPosition();

        const panner = this.#panner!;
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

    /** 停止播放 */
    stop(): void
    {
        if (this.#source)
        {
            this.#source.stop(0);
            this.#disconnect();
            this.#source = null;
        }
    }

    #onUrlChanged = async (): Promise<void> =>
    {
        this.stop();
        if (this.#audioSource.url)
        {
            const url = this.#audioSource.url;
            const response = await fetch(url);
            const data = await response.arrayBuffer();
            if (url !== this.#audioSource.url)
            {
                return;
            }
            audioCtx.decodeAudioData(data, (buffer) =>
            {
                this.#buffer = buffer;
            });
        }
    };

    override init(object3D?: Object3D): void
    {
        if (this.#subInited) return;
        this.#subInited = true;
        super.init(object3D);

        this.#panner = createPanner();
        // 初始化 panner 参数
        this.#panner.panningModel = 'HRTF';
        this.#panner.distanceModel = DistanceModelType.inverse;
        this.#panner.refDistance = 1;
        this.#panner.maxDistance = 10000;
        this.#panner.rolloffFactor = 1;
        this.#panner.coneInnerAngle = 360;
        this.#panner.coneOuterAngle = 0;
        this.#panner.coneOuterGain = 0;
        this.#gain = audioCtx.createGain();
        this.#gain.gain.setTargetAtTime(1, audioCtx.currentTime, 0.01);
        this.#enabledChanged();
        this.#connect();

        // @边界 effect：WebAudio 外设同步（panner 节点参数）
        // effect 监听 panner 参数变化
        effect(() =>
        {
            const r_audioSource = reactive(this.#audioSource);
            if (this.#panner)
            {
                this.#panner.panningModel = r_audioSource.panningModel;
                this.#panner.distanceModel = r_audioSource.distanceModel;
                this.#panner.refDistance = r_audioSource.refDistance;
                this.#panner.maxDistance = r_audioSource.maxDistance;
                this.#panner.rolloffFactor = r_audioSource.rolloffFactor;
                this.#panner.coneInnerAngle = r_audioSource.coneInnerAngle;
                this.#panner.coneOuterAngle = r_audioSource.coneOuterAngle;
                this.#panner.coneOuterGain = r_audioSource.coneOuterGain;
            }
        });

        // @边界 effect：WebAudio 外设同步（gain 音量）
        // effect 监听 volume 变化
        effect(() =>
        {
            const v = reactive(this.#audioSource).volume;
            if (this.#gain)
            {
                this.#gain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.01);
            }
        });

        // @边界 effect：WebAudio 外设同步（gain 连接状态）
        // effect 监听 enabled 变化
        effect(() =>
        {
            reactive(this.#audioSource).enabled;
            this.#enabledChanged();
        });

        // @边界 effect：WebAudio 外设同步（音频资源加载）
        // effect 监听 url 变化
        effect(() =>
        {
            reactive(this.#audioSource).url;
            this.#onUrlChanged();
        });

        // @边界 effect：WebAudio 外设同步（节点拓扑重连）
        // effect 监听 enablePosition 变化时重连
        effect(() =>
        {
            reactive(this.#audioSource).enablePosition;
            this.#disconnect();
            this.#connect();
        });

        // @边界 effect：WebAudio 外设同步（panner 位置/朝向）
        // effect 监听 local2world 变化
        effect(() =>
        {
            getLogic(this.entity).local2world;
            this.#onScenetransformChanged();
        });
    }

    /** 播放音频 */
    play(): void
    {
        this.stop();
        if (this.#buffer)
        {
            this.#source = audioCtx.createBufferSource();
            this.#source.buffer = this.#buffer;
            this.#connect();
            this.#source.loop = this.#audioSource.loop;
            this.#source.start(0);
        }
    }

    override dispose(): void
    {
        this.#disconnect();
        super.dispose();
        this.#panner = null;
        this.#source = null;
        this.#buffer = null;
        this.#gain = null;
    }
}
// 注册到 logic 分发表
registerLogic('AudioSource', AudioSourceLogic as unknown as new (data: AudioSource) => AudioSourceLogic);
