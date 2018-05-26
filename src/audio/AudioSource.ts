namespace feng3d
{
    /**
     * 声源
     */
    export class AudioSource extends Component
    {
        private panner = createPanner();
        private source = audioCtx.createBufferSource();

        /**
         * 声音文件路径
         */
        @serialize
        @oav()
        @watch("onUrlChanged")
        url = "";

        @serialize
        @oav()
        @watch("onLoopChanged")
        loop = true;

        @serialize
        @oav()
        @watch("onConeInnerAngleChanged")
        coneInnerAngle = 360;

        @serialize
        @oav()
        @watch("onConeOuterAngleChanged")
        coneOuterAngle = 0;

        @serialize
        @oav()
        @watch("onConeOuterGainChanged")
        coneOuterGain = 0;

        @serialize
        @oav()
        @watch("onDistanceModelChanged")
        distanceModel: DistanceModelType = 'inverse';

        @serialize
        @oav()
        @watch("onMaxDistanceChanged")
        maxDistance = 10000;

        @serialize
        @oav()
        @watch("onPanningModelChanged")
        panningModel: PanningModelType = 'HRTF';

        @serialize
        @oav()
        @watch("onRefDistanceChanged")
        refDistance = 1;

        @serialize
        @oav()
        @watch("onRolloffFactorChanged")
        rolloffFactor = 1;

        constructor()
        {
            super();
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
            if (this.url)
            {
                assets.readFile(this.url, (err, data) =>
                {
                    if (err)
                    {
                        err(err);
                        return;
                    }
                    audioCtx.decodeAudioData(data, (buffer) =>
                    {
                        this.source.buffer = buffer;

                        this.source.connect(this.panner);
                        this.panner.connect(audioCtx.destination);
                        this.source.loop = this.loop;
                    })
                })
            }
        }

        play()
        {
            this.source && this.source.start(0);
        }

        stop()
        {
            this.source && this.source.stop(0);
        }

        private onLoopChanged() { this.source && (this.source.loop = this.loop); };
        private onConeInnerAngleChanged() { this.panner.coneInnerAngle && (this.panner.coneInnerAngle = this.coneInnerAngle); };
        private onConeOuterAngleChanged() { this.panner.coneOuterAngle && (this.panner.coneOuterAngle = this.coneOuterAngle); };
        private onConeOuterGainChanged() { this.panner.coneOuterGain && (this.panner.coneOuterGain = this.coneOuterGain); };
        private onDistanceModelChanged() { this.panner.distanceModel && (this.panner.distanceModel = this.distanceModel); };
        private onMaxDistanceChanged() { this.panner.maxDistance && (this.panner.maxDistance = this.maxDistance); };
        private onPanningModelChanged() { this.panner.panningModel && (this.panner.panningModel = this.panningModel); };
        private onRefDistanceChanged() { this.panner.refDistance && (this.panner.refDistance = this.refDistance); };
        private onRolloffFactorChanged() { this.panner.rolloffFactor && (this.panner.rolloffFactor = this.rolloffFactor); };
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
    panner.panningModel = 'HRTF';
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