namespace feng3d
{
    /**
     * 声源
     */
    export class AudioSource extends Component
    {
        private panner: PannerNode;
        private source: AudioBufferSourceNode;
        private buffer: AudioBuffer;
        private gain: GainNode;

        /**
         * 声音文件路径
         */
        @serialize
        @oav({ component: "OAVPick", componentParam: { accepttype: "audio" } })
        @watch("onUrlChanged")
        url = "";

        @serialize
        @oav()
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
        @serialize
        @oav()
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

        @serialize
        @oav()
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

        @serialize
        @oav()
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

        @serialize
        @oav()
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

        @serialize
        @oav()
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

        @serialize
        @oav()
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

        @serialize
        @oav()
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

        @serialize
        @oav()
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

        @serialize
        @oav()
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
            this.panner = createPanner();
            this.panningModel = <any>'HRTF';
            this.distanceModel = 'inverse';
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
            this.gain.connect(globalGain);
            this.panner.connect(this.gain);
        }

        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.gameObject.on("scenetransformChanged", this.onScenetransformChanged, this);
        }

        private onScenetransformChanged()
        {
            var scenePosition = this.transform.scenePosition;
            //
            var panner = this.panner;

            if (panner.positionX)
            {
                panner.positionX.value = scenePosition.x;
                panner.positionY.value = scenePosition.y;
                panner.positionZ.value = scenePosition.z;
            } else
            {
                panner.setPosition(scenePosition.x, scenePosition.y, scenePosition.z);
            }
        }

        private onUrlChanged()
        {
            this.stop();
            if (this.url)
            {
                var url = this.url;
                assets.readFile(this.url, (err, data) =>
                {
                    if (err)
                    {
                        warn(err);
                        return;
                    }
                    if (url != this.url)
                        return;
                    audioCtx.decodeAudioData(data, (buffer) =>
                    {
                        this.buffer = buffer;
                    })
                })
            }
        }

        @oav()
        play()
        {
            this.stop();
            if (this.buffer)
            {
                this.source = audioCtx.createBufferSource();
                this.source.buffer = this.buffer;
                this.source.connect(this.panner);
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
                this.source.disconnect(this.panner);
                this.source = null;
            }
        }
    }
}

interface PannerNode
{
    positionX: { value: number };
    positionY: { value: number };
    positionZ: { value: number };

    orientationX: { value: number };
    orientationY: { value: number };
    orientationZ: { value: number };
}

function createPanner()
{
    var panner = this.panner = feng3d.audioCtx.createPanner();

    if (panner.orientationX)
    {
        panner.orientationX.value = 1;
        panner.orientationY.value = 0;
        panner.orientationZ.value = 0;
    } else
    {
        panner.setOrientation(1, 0, 0);
    }
    return panner;
}