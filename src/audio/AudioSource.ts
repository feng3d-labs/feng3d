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
            return this.gain.gain.value;
        }
        set volume(v)
        {
            this.gain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.01);
        }

        @serialize
        @oav()
        get coneInnerAngle()
        {
            return this.panner.coneInnerAngle;
        }
        set coneInnerAngle(v)
        {
            this.panner.coneInnerAngle = v;
        }

        @serialize
        @oav()
        get coneOuterAngle()
        {
            return this.panner.coneOuterAngle;
        }
        set coneOuterAngle(v)
        {
            this.panner.coneOuterAngle = v;
        }

        @serialize
        @oav()
        get coneOuterGain()
        {
            return this.panner.coneOuterGain;
        }
        set coneOuterGain(v)
        {
            this.panner.coneOuterGain = v;
        }

        @serialize
        @oav()
        get distanceModel()
        {
            return this.panner.distanceModel;
        }
        set distanceModel(v)
        {
            this.panner.distanceModel = v;
        }

        @serialize
        @oav()
        get maxDistance()
        {
            return this.panner.maxDistance;
        }
        set maxDistance(v)
        {
            this.panner.maxDistance = v;
        }

        @serialize
        @oav()
        get panningModel()
        {
            return this.panner.panningModel;
        }
        set panningModel(v)
        {
            this.panner.panningModel = v;
        }

        @serialize
        @oav()
        get refDistance()
        {
            return this.panner.refDistance;
        }
        set refDistance(v)
        {
            this.panner.refDistance = v;
        }

        @serialize
        @oav()
        get rolloffFactor()
        {
            return this.panner.rolloffFactor;
        }
        set rolloffFactor(v)
        {
            this.panner.rolloffFactor = v;
        }

        constructor()
        {
            super();
            this.panner = createPanner();
            this.gain = audioCtx.createGain();

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
    panner.panningModel = <any>'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;

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