import { Component3D } from '../Component3D';
import { RegisterComponent } from '../../ecs/Component';
import { FS } from '../../filesystem/FS';
import { oav } from '../../objectview/ObjectView';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { audioCtx, globalGain } from './AudioListener3D';

declare module '../../ecs/Component'
{
    interface ComponentMap
    {
        AudioSource3D: AudioSource3D;
    }
}

/**
 * 音量与距离算法
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PannerNode/distanceModel
 * @see https://mdn.github.io/webaudio-examples/panner-node/
 * @see https://github.com/mdn/webaudio-examples
 */
export enum DistanceModelType
{
    /**
     * 1 - rolloffFactor * (distance - refDistance) / (maxDistance - refDistance)
     */
    linear = 'linear',
    /**
     * refDistance / (refDistance + rolloffFactor * (distance - refDistance))
     */
    inverse = 'inverse',
    /**
     * pow(distance / refDistance, -rolloffFactor)
     */
    exponential = 'exponential',
}

/**
 * 声源
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
 */
@RegisterComponent({ name: 'AudioSource3D', menu: 'Audio/AudioSource' })
export class AudioSource3D extends Component3D
{
    private panner: PannerNode;
    private source: AudioBufferSourceNode;
    private buffer: AudioBuffer;
    private gain: GainNode;

    enabled = true;

    /**
     * 声音文件路径
     */
    @SerializeProperty()
    @oav({ component: 'OAVPick', tooltip: '声音文件路径', componentParam: { accepttype: 'audio' } })
    url = '';

    /**
     * 是否循环播放
     */
    @SerializeProperty()
    @oav({ tooltip: '是否循环播放' })
    get loop()
    {
        return this._loop;
    }
    set loop(v)
    {
        this._loop = v;
        if (this.source) this.source.loop = v;
    }
    private _loop = true;

    /**
     * 音量
     */
    @SerializeProperty()
    @oav({ tooltip: '音量' })
    get volume()
    {
        return this._volume;
    }
    set volume(v)
    {
        this._volume = v;
        this.gain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.01);
    }
    private _volume: number;

    /**
     * 是否启用位置影响声音
     */
    @SerializeProperty()
    @oav({ tooltip: '是否启用位置影响声音' })
    get enablePosition()
    {
        return this._enablePosition;
    }
    set enablePosition(v)
    {
        this._disconnect();
        this._enablePosition = v;
        this._connect();
    }
    private _enablePosition = true;

    // @SerializeProperty()
    // @oav()
    get coneInnerAngle()
    {
        return this._coneInnerAngle;
    }
    set coneInnerAngle(v)
    {
        this._coneInnerAngle = v;
        this.panner.coneInnerAngle = v;
    }
    private _coneInnerAngle: number;

    // @SerializeProperty()
    // @oav()
    get coneOuterAngle()
    {
        return this._coneOuterAngle;
    }
    set coneOuterAngle(v)
    {
        this._coneOuterAngle = v;
        this.panner.coneOuterAngle = v;
    }
    private _coneOuterAngle: number;

    // @SerializeProperty()
    // @oav()
    get coneOuterGain()
    {
        return this._coneOuterGain;
    }
    set coneOuterGain(v)
    {
        this._coneOuterGain = v;
        this.panner.coneOuterGain = v;
    }
    private _coneOuterGain: number;

    /**
     * 该接口的distanceModel属性PannerNode是一个枚举值，用于确定在音频源离开收听者时用于减少音频源音量的算法。
     *
     * 可能的值是：
     * * linear：根据以下公式计算由距离引起的增益的线性距离模型：
     *      1 - rolloffFactor * (distance - refDistance) / (maxDistance - refDistance)
     * * inverse：根据以下公式计算由距离引起的增益的反距离模型：
     *      refDistance / (refDistance + rolloffFactor * (distance - refDistance))
     * * exponential：按照下式计算由距离引起的增益的指数距离模型
     *      pow(distance / refDistance, -rolloffFactor)。
     *
     * inverse是的默认值distanceModel。
     */
    @SerializeProperty()
    @oav({ component: 'OAVEnum', tooltip: '距离模式，距离影响声音的方式', componentParam: { enumClass: DistanceModelType } })
    get distanceModel()
    {
        return this._distanceModel;
    }
    set distanceModel(v)
    {
        this._distanceModel = v;
        this.panner.distanceModel = v;
    }
    private _distanceModel: DistanceModelType;

    /**
     * 表示音频源和收听者之间的最大距离，之后音量不会再降低。该值仅由linear距离模型使用。默认值是10000。
     */
    @SerializeProperty()
    @oav({ tooltip: '表示音频源和收听者之间的最大距离，之后音量不会再降低。该值仅由linear距离模型使用。默认值是10000。' })
    get maxDistance()
    {
        return this._maxDistance;
    }
    set maxDistance(v)
    {
        this._maxDistance = v;
        this.panner.maxDistance = v;
    }
    private _maxDistance: number;

    // @SerializeProperty()
    // @oav()
    get panningModel()
    {
        return this._panningModel;
    }
    set panningModel(v)
    {
        this._panningModel = v;
        this.panner.panningModel = v;
    }
    private _panningModel: PanningModelType;

    /**
     * 表示随着音频源远离收听者而减小音量的参考距离。此值由所有距离模型使用。默认值是1。
     */
    @SerializeProperty()
    @oav({ tooltip: '表示随着音频源远离收听者而减小音量的参考距离。此值由所有距离模型使用。默认值是1。' })
    get refDistance()
    {
        return this._refDistance;
    }
    set refDistance(v)
    {
        this._refDistance = v;
        this.panner.refDistance = v;
    }
    private _refDistance: number;

    /**
     * 描述了音源离开收听者音量降低的速度。此值由所有距离模型使用。默认值是1。
     */
    @SerializeProperty()
    @oav({ tooltip: '描述了音源离开收听者音量降低的速度。此值由所有距离模型使用。默认值是1。' })
    get rolloffFactor()
    {
        return this._rolloffFactor;
    }
    set rolloffFactor(v)
    {
        this._rolloffFactor = v;
        this.panner.rolloffFactor = v;
    }
    private _rolloffFactor: number;

    constructor()
    {
        super();
        watcher.watch(this as AudioSource3D, 'enabled', this._enabledChanged, this);
        watcher.watch(this as AudioSource3D, 'url', this._onUrlChanged, this);
        this.panner = createPanner();
        this.panningModel = 'HRTF';
        this.distanceModel = DistanceModelType.inverse;
        this.refDistance = 1;
        this.maxDistance = 10000;
        this.rolloffFactor = 1;
        this.coneInnerAngle = 360;
        this.coneOuterAngle = 0;
        this.coneOuterGain = 0;
        //
        this.gain = audioCtx.createGain();
        this.volume = 1;
        //
        //
        this._enabledChanged();
        this._connect();
    }

    init()
    {
        super.init();
        this.emitter.on('globalMatrixChanged', this._onScenetransformChanged, this);
    }

    @oav()
    play()
    {
        this.stop();
        if (this.buffer)
        {
            this.source = audioCtx.createBufferSource();
            this.source.buffer = this.buffer;
            this._connect();
            this.source.loop = this.loop;
            this.source.start(0);
        }
    }

    @oav()
    stop()
    {
        if (this.source)
        {
            this.source.stop(0);
            this._disconnect();
            this.source = null;
        }
    }

    private _onScenetransformChanged()
    {
        const globalMatrix = this.node3d.globalMatrix;
        const scenePosition = globalMatrix.getPosition();

        //
        const panner = this.panner;
        // feng3d使用左手坐标系，panner使用右手坐标系，参考https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
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

    private async _onUrlChanged()
    {
        this.stop();
        if (this.url)
        {
            const url = this.url;
            const data = await FS.fs.readArrayBuffer(this.url);
            if (url !== this.url)
            {
                return;
            }
            audioCtx.decodeAudioData(data, (buffer) =>
            {
                this.buffer = buffer;
            });
        }
    }

    private _connect()
    {
        const arr = this._getAudioNodes();
        for (let i = 0; i < arr.length - 1; i++)
        {
            arr[i + 1].connect(arr[i]);
        }
    }

    private _disconnect()
    {
        const arr = this._getAudioNodes();
        for (let i = 0; i < arr.length - 1; i++)
        {
            arr[i + 1].disconnect(arr[i]);
        }
    }

    private _getAudioNodes()
    {
        const arr: AudioNode[] = [];
        arr.push(this.gain);
        if (this._enablePosition)
        { arr.push(this.panner); }
        if (this.source)
        { arr.push(this.source); }

        return arr;
    }

    private _enabledChanged()
    {
        if (!this.gain)
        {
            return;
        }
        if (this.enabled)
        {
            this.gain.connect(globalGain);
        }
        else
        {
            this.gain.disconnect(globalGain);
        }
    }

    dispose()
    {
        this.emitter.off('globalMatrixChanged', this._onScenetransformChanged, this);
        this._disconnect();
        super.dispose();
    }
}

function createPanner()
{
    const panner = audioCtx.createPanner();

    if (panner.orientationX)
    {
        panner.orientationX.value = 1;
        panner.orientationY.value = 0;
        panner.orientationZ.value = 0;
    }
    else
    {
        panner.setOrientation(1, 0, 0);
    }

    return panner;
}
