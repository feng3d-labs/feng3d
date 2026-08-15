import { audioCtx, globalGain } from './AudioListener';
import { Behaviour, behaviourLogic, BehaviourLogic } from '../component/Behaviour';
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
 * AudioSource 逻辑处理接口。
 *
 * 组合 behaviourLogic，额外：
 * - panner/gain/source WebAudio 节点管理
 * - effect 监听各 panner 参数变化时同步到 panner 节点
 * - effect 监听 enabled / url 变化时连接/断开 gain、重新加载音频
 * - effect 监听 local2world 变化时更新 panner 位置/朝向
 * - play / stop 控制
 */
export interface AudioSourceLogic extends BehaviourLogic
{
    /** 播放音频 */
    play(): void;
    /** 停止播放 */
    stop(): void;
}

/**
 * 创建 AudioSourceLogic 实例（工厂函数，组合 behaviourLogic 基础行为）。
 */
export function audioSourceLogic(audioSource: AudioSource): AudioSourceLogic
{
    const base = behaviourLogic(audioSource);

    let _panner: PannerNode | null = null;
    let _source: AudioBufferSourceNode | null = null;
    let _buffer: AudioBuffer | null = null;
    let _gain: GainNode | null = null;
    /** init 去重标志（同一 component 只初始化一次） */
    let _subInited = false;

    const _getAudioNodes = (): AudioNode[] =>
    {
        const arr: AudioNode[] = [];
        arr.push(_gain!);
        if (audioSource.enablePosition)
        {
            arr.push(_panner!);
        }
        if (_source)
        {
            arr.push(_source);
        }

        return arr;
    };

    const _connect = (): void =>
    {
        const arr = _getAudioNodes();
        for (let i = 0; i < arr.length - 1; i++)
        {
            arr[i + 1].connect(arr[i]);
        }
    };

    const _disconnect = (): void =>
    {
        const arr = _getAudioNodes();
        for (let i = 0; i < arr.length - 1; i++)
        {
            arr[i + 1].disconnect(arr[i]);
        }
    };

    const _enabledChanged = (): void =>
    {
        if (!_gain)
        {
            return;
        }
        if (audioSource.enabled)
        {
            _gain.connect(globalGain);
        }
        else
        {
            _gain.disconnect(globalGain);
        }
    };

    const _onScenetransformChanged = (): void =>
    {
        const local2world = getLogic(base.entity).local2world;
        const scenePosition = local2world.getPosition();

        const panner = _panner!;
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
    };

    const stop = (): void =>
    {
        if (_source)
        {
            _source.stop(0);
            _disconnect();
            _source = null;
        }
    };

    const _onUrlChanged = async (): Promise<void> =>
    {
        stop();
        if (audioSource.url)
        {
            const url = audioSource.url;
            const response = await fetch(url);
            const data = await response.arrayBuffer();
            if (url !== audioSource.url)
            {
                return;
            }
            audioCtx.decodeAudioData(data, (buffer) =>
            {
                _buffer = buffer;
            });
        }
    };

    // 捕获基类方法，避免覆盖后再调用 base.init/update/dispose 导致递归
    const baseInit = base.init;
    const baseUpdate = base.update;
    const baseDispose = base.dispose;

    return Object.assign(base, {
        init(object3D?: Object3D): void
        {
            if (_subInited) return;
            _subInited = true;
            baseInit.call(base, object3D);

            _panner = createPanner();
            // 初始化 panner 参数
            _panner.panningModel = 'HRTF';
            _panner.distanceModel = DistanceModelType.inverse;
            _panner.refDistance = 1;
            _panner.maxDistance = 10000;
            _panner.rolloffFactor = 1;
            _panner.coneInnerAngle = 360;
            _panner.coneOuterAngle = 0;
            _panner.coneOuterGain = 0;
            _gain = audioCtx.createGain();
            _gain.gain.setTargetAtTime(1, audioCtx.currentTime, 0.01);
            _enabledChanged();
            _connect();

            // effect 监听 panner 参数变化
            effect(() =>
            {
                const r_audioSource = reactive(audioSource);
                if (_panner)
                {
                    _panner.panningModel = r_audioSource.panningModel;
                    _panner.distanceModel = r_audioSource.distanceModel;
                    _panner.refDistance = r_audioSource.refDistance;
                    _panner.maxDistance = r_audioSource.maxDistance;
                    _panner.rolloffFactor = r_audioSource.rolloffFactor;
                    _panner.coneInnerAngle = r_audioSource.coneInnerAngle;
                    _panner.coneOuterAngle = r_audioSource.coneOuterAngle;
                    _panner.coneOuterGain = r_audioSource.coneOuterGain;
                }
            });

            // effect 监听 volume 变化
            effect(() =>
            {
                const v = reactive(audioSource).volume;
                if (_gain)
                {
                    _gain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.01);
                }
            });

            // effect 监听 enabled 变化
            effect(() =>
            {
                reactive(audioSource).enabled;
                _enabledChanged();
            });

            // effect 监听 url 变化
            effect(() =>
            {
                reactive(audioSource).url;
                _onUrlChanged();
            });

            // effect 监听 enablePosition 变化时重连
            effect(() =>
            {
                reactive(audioSource).enablePosition;
                _disconnect();
                _connect();
            });

            // effect 监听 local2world 变化
            effect(() =>
            {
                getLogic(base.entity).local2world;
                _onScenetransformChanged();
            });
        },
        update(interval: number): void
        {
            baseUpdate.call(base, interval);
        },
        play(): void
        {
            stop();
            if (_buffer)
            {
                _source = audioCtx.createBufferSource();
                _source.buffer = _buffer;
                _connect();
                _source.loop = audioSource.loop;
                _source.start(0);
            }
        },
        stop,
        dispose(): void
        {
            _disconnect();
            baseDispose.call(base);
            _panner = null;
            _source = null;
            _buffer = null;
            _gain = null;
        },
    }) as unknown as AudioSourceLogic;
}
// 注册到 componentLogic 分发表
registerLogic('AudioSource', audioSourceLogic);
