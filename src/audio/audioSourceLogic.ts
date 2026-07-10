import { logic as getLogic } from '@feng3d/reactivity';
import { FS } from '@feng3d/filesystem';
import { effect, reactive } from '@feng3d/reactivity';
import { BehaviourLogic, behaviourLogic } from '../component/behaviourLogic';
import { registerComponentLogic } from '../component/componentLogic';
import { AudioSource, DistanceModelType, createPanner } from './AudioSource';
import { audioCtx, globalGain } from './AudioListener';

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
export interface AudioSourceLogic extends BehaviourLogic
{
    play(): void;
    stop(): void;
}


/**
 * 获取 AudioSource 的 logic。
 */
export function audioSourceLogic(audioSource: AudioSource): AudioSourceLogic

{
    return getLogic(audioSource);
}

function createAudioSourceLogic(audioSource: AudioSource): AudioSourceLogic
{
    const base = behaviourLogic(audioSource);
    let _panner: PannerNode | null = null;
    let _source: AudioBufferSourceNode | null = null;
    let _buffer: AudioBuffer | null = null;
    let _gain: GainNode | null = null;
    let _inited = false;

    function _getAudioNodes(): AudioNode[]
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
    }

    function _connect(): void
    {
        const arr = _getAudioNodes();
        for (let i = 0; i < arr.length - 1; i++)
        {
            arr[i + 1].connect(arr[i]);
        }
    }

    function _disconnect(): void
    {
        const arr = _getAudioNodes();
        for (let i = 0; i < arr.length - 1; i++)
        {
            arr[i + 1].disconnect(arr[i]);
        }
    }

    function _enabledChanged(): void
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
    }

    function _onScenetransformChanged(): void
    {
        const local2world = getLogic(logic.object3D).local2world.value;
        const scenePosition = local2world.getPosition();

        const panner = _panner;
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

    async function _onUrlChanged(): Promise<void>
    {
        logic.stop();
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
                _buffer = buffer;
            });
        }
    }

    const logic = {
        object3D: null as any,
        get isVisibleAndEnabled() { return base.isVisibleAndEnabled; },
        init()
        {
            if (_inited) return;
            _inited = true;
            base.init();

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
                    _panner.panningModel = r_audioSource.panningModel as any;
                    _panner.distanceModel = r_audioSource.distanceModel as any;
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
                getLogic(logic.object3D).local2world.value;
                _onScenetransformChanged();
            });
        },
        beforeRender(ro, scene, camera) { base.beforeRender(ro, scene, camera); },
        update(interval: number) { base.update(interval); },
        play()
        {
            logic.stop();
            if (_buffer)
            {
                _source = audioCtx.createBufferSource();
                _source.buffer = _buffer;
                _connect();
                _source.loop = audioSource.loop;
                _source.start(0);
            }
        },
        stop()
        {
            if (_source)
            {
                _source.stop(0);
                _disconnect();
                _source = null;
            }
        },
        dispose()
        {
            _disconnect();
            base.dispose();
            _panner = null;
            _source = null;
            _buffer = null;
            _gain = null;
                    },
    };

    return logic as any;
}

// 注册到 componentLogic 分发表
registerComponentLogic('AudioSource', (component) =>
{
    return createAudioSourceLogic(component as AudioSource);
});
