namespace feng3d
{
    export var audioCtx: AudioContext;
    export var globalGain: GainNode;

    /**
     * 声音监听器
     */
    export class AudioListener extends Behaviour
    {
        // /**
        //  * 是否监听中
        //  */
        // private isListening = true;

        gain: GainNode;

        @watch("enabledChanged")
        enabled = true;

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

            // if (this.isListening == this.enabled)
            //     return;
            // if (audioCtx.state === 'running')
            // {
            //     // 暂停
            //     audioCtx.suspend().then(() =>
            //     {
            //         this.isListening = false;
            //     });
            // } else if (audioCtx.state === 'suspended')
            // {
            //     // 继续
            //     audioCtx.resume().then(() =>
            //     {
            //         this.isListening = true;
            //     });
            // }
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
    // globalGain.connect(audioCtx.destination);
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