namespace feng3d
{
    export var audioCtx: AudioContext;
    export var globalGain: GainNode;

    /**
     * 声音监听器
     */
    export class AudioListener extends Behaviour
    {
        gain: GainNode;

        @watch("enabledChanged")
        enabled = true;

        /**
         * 音量
         */
        @serialize
        @oav({ componentParam: { tooltip: "音量" } })
        get volume()
        {
            return this._volume;
        }
        set volume(v)
        {
            this._volume = v;
            this.gain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.01);
        }
        private _volume = 1;

        constructor()
        {
            super();
            this.gain = audioCtx.createGain();
            this.gain.connect(audioCtx.destination);
            this.enabledChanged();
        }

        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.gameObject.on("scenetransformChanged", this.onScenetransformChanged, this);
            this.onScenetransformChanged();
        }

        private onScenetransformChanged()
        {
            var scenePosition = this.transform.scenePosition;
            //
            var listener = audioCtx.listener;

            if (listener.positionX)
            {
                listener.positionX.value = scenePosition.x;
                listener.positionY.value = scenePosition.y;
                listener.positionZ.value = scenePosition.z;
            } else
            {
                listener.setPosition(scenePosition.x, scenePosition.y, scenePosition.z);
            }
        }

        private enabledChanged()
        {
            if (!this.gain) return;
            if (this.enabled)
            {
                globalGain.connect(this.gain);
            } else
            {
                globalGain.disconnect(this.gain);
            }
        }

        dispose()
        {
            this.gameObject.off("scenetransformChanged", this.onScenetransformChanged, this);
            super.dispose();
        }
    }
}

interface AudioListener
{
    positionX: { value: number };
    positionY: { value: number };
    positionZ: { value: number };

    forwardX: { value: number };
    forwardY: { value: number };
    forwardZ: { value: number };

    upX: { value: number };
    upY: { value: number };
    upZ: { value: number };
}

(() =>
{
    window["AudioContext"] = window["AudioContext"] || window["webkitAudioContext"];

    var audioCtx = feng3d.audioCtx = new AudioContext();
    var globalGain = feng3d.globalGain = audioCtx.createGain();
    // 新增无音Gain，避免没有AudioListener组件时暂停声音播放进度
    var zeroGain = audioCtx.createGain();
    zeroGain.connect(audioCtx.destination);
    globalGain.connect(zeroGain);
    zeroGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.01);
    //
    var listener = audioCtx.listener;
    audioCtx.createGain();
    if (listener.forwardX)
    {
        listener.forwardX.value = 0;
        listener.forwardY.value = 0;
        listener.forwardZ.value = -1;
        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;
    } else
    {
        listener.setOrientation(0, 0, -1, 0, 1, 0);
    }
})();