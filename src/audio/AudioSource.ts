import { audioCtx, globalGain } from './AudioListener';
import { Behaviour, createBehaviour } from '../component/Behaviour';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
import { FS } from '@feng3d/filesystem';
import { BehaviourLogic } from '../component/Behaviour';
import type { Object3D } from '../core/Object3D';

import './AudioSource';

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
    readonly distanceModel: string;
    readonly maxDistance: number;
    readonly panningModel: string;
    readonly refDistance: number;
    readonly rolloffFactor: number;
}

/**
 * 创建 AudioSource 实例。
 */
export function createAudioSource(): AudioSource
{
    return {
        ...createBehaviour(), __type__: 'AudioSource',
        url: '',
        loop: true,
        volume: 1,
        enablePosition: true,
        coneInnerAngle: 360,
        coneOuterAngle: 0,
        coneOuterGain: 0,
        distanceModel: 'inverse',
        maxDistance: 10000,
        panningModel: 'HRTF',
        refDistance: 1,
        rolloffFactor: 1,
    };
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
 * AudioSource 逻辑处理输出。
 *
 * 组合 behaviourLogic，额外：
 * - panner/gain/source WebAudio 节点管理
 * - effect 监听各 panner 参数变化时同步到 panner 节点
 * - effect 监听 enabled / url 变化时连接/断开 gain、重新加载音频
 * - effect 监听 local2world 变化时更新 panner 位置/朝向
 * - play / stop 控制
 */
export class AudioSourceLogic extends BehaviourLogic
{
    private _panner: PannerNode | null = null;
    private _source: AudioBufferSourceNode | null = null;
    private _buffer: AudioBuffer | null = null;
    private _gain: GainNode | null = null;
    /** init 去重标志（同一 component 只初始化一次） */
    private _subInited = false;

    constructor(audioSource: AudioSource)
    {
        super(audioSource);
    }

    private _getAudioNodes(): AudioNode[]
    {
        const audioSource = this.component as AudioSource;
        const arr: AudioNode[] = [];
        arr.push(this._gain!);
        if (audioSource.enablePosition)
        {
            arr.push(this._panner!);
        }
        if (this._source)
        {
            arr.push(this._source);
        }

        return arr;
    }

    private _connect(): void
    {
        const arr = this._getAudioNodes();
        for (let i = 0; i < arr.length - 1; i++)
        {
            arr[i + 1].connect(arr[i]);
        }
    }

    private _disconnect(): void
    {
        const arr = this._getAudioNodes();
        for (let i = 0; i < arr.length - 1; i++)
        {
            arr[i + 1].disconnect(arr[i]);
        }
    }

    private _enabledChanged(): void
    {
        if (!this._gain)
        {
            return;
        }
        const audioSource = this.component as AudioSource;
        if (audioSource.enabled)
        {
            this._gain.connect(globalGain);
        }
        else
        {
            this._gain.disconnect(globalGain);
        }
    }

    private _onScenetransformChanged(): void
    {
        const local2world = getLogic(this.entity).local2world;
        const scenePosition = local2world.getPosition();

        const panner = this._panner!;
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

    private async _onUrlChanged(): Promise<void>
    {
        const audioSource = this.component as AudioSource;
        this.stop();
        if (audioSource.url)
        {
            const url = audioSource.url;
            const data = await FS.fs.readArrayBuffer(audioSource.url);
            if (url !== audioSource.url)
            {
                return;
            }
            audioCtx.decodeAudioData(data, (buffer) =>
            {
                this._buffer = buffer;
            });
        }
    }

    init(object3D?: Object3D): void
    {
        if (this._subInited) return;
        this._subInited = true;
        super.init(object3D);

        const audioSource = this.component as AudioSource;

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
        this._gain = audioCtx.createGain();
        this._gain.gain.setTargetAtTime(1, audioCtx.currentTime, 0.01);
        this._enabledChanged();
        this._connect();

        // effect 监听 panner 参数变化
        effect(() =>
        {
            const r_audioSource = reactive(audioSource);
            if (this._panner)
            {
                this._panner.panningModel = r_audioSource.panningModel as any;
                this._panner.distanceModel = r_audioSource.distanceModel as any;
                this._panner.refDistance = r_audioSource.refDistance;
                this._panner.maxDistance = r_audioSource.maxDistance;
                this._panner.rolloffFactor = r_audioSource.rolloffFactor;
                this._panner.coneInnerAngle = r_audioSource.coneInnerAngle;
                this._panner.coneOuterAngle = r_audioSource.coneOuterAngle;
                this._panner.coneOuterGain = r_audioSource.coneOuterGain;
            }
        });

        // effect 监听 volume 变化
        effect(() =>
        {
            const v = reactive(audioSource).volume;
            if (this._gain)
            {
                this._gain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.01);
            }
        });

        // effect 监听 enabled 变化
        effect(() =>
        {
            reactive(audioSource).enabled;
            this._enabledChanged();
        });

        // effect 监听 url 变化
        effect(() =>
        {
            reactive(audioSource).url;
            this._onUrlChanged();
        });

        // effect 监听 enablePosition 变化时重连
        effect(() =>
        {
            reactive(audioSource).enablePosition;
            this._disconnect();
            this._connect();
        });

        // effect 监听 local2world 变化
        effect(() =>
        {
            getLogic(this.entity).local2world;
            this._onScenetransformChanged();
        });
    }

    update(interval: number): void
    {
        super.update(interval);
    }

    play(): void
    {
        const audioSource = this.component as AudioSource;
        this.stop();
        if (this._buffer)
        {
            this._source = audioCtx.createBufferSource();
            this._source.buffer = this._buffer;
            this._connect();
            this._source.loop = audioSource.loop;
            this._source.start(0);
        }
    }

    stop(): void
    {
        if (this._source)
        {
            this._source.stop(0);
            this._disconnect();
            this._source = null;
        }
    }

    dispose(): void
    {
        this._disconnect();
        super.dispose();
        this._panner = null;
        this._source = null;
        this._buffer = null;
        this._gain = null;
    }
}
// 注册到 componentLogic 分发表
registerLogic('AudioSource', AudioSourceLogic);
