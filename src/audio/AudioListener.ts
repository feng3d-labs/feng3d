namespace feng3d
{
    export var audioCtx: AudioContext;

    /**
     * 声音监听器
     */
    export class AudioListener extends Component
    {
        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.gameObject.on("scenetransformChanged", this.onScenetransformChanged, this);
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
    var listener = audioCtx.listener;
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