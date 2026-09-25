import { computed, Computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { VideoTexture } from '../data/VideoTexture';
import { ReactiveObject } from '../ReactiveObject';

export class WGPUExternalTexture extends ReactiveObject
{
    get gpuExternalTexture()
    {
        return this._computedGpuExternalTexture.value;
    }

    private _computedGpuExternalTexture: Computed<GPUExternalTexture>;

    constructor(device: GPUDevice, videoTexture: VideoTexture)
    {
        super();

        this._onCreate(device, videoTexture);
        //
        WGPUExternalTexture.map.set([device, videoTexture], this);
        this.destroyCall(() =>
        {
            WGPUExternalTexture.map.delete([device, videoTexture]);
        });
    }

    private _onCreate(device: GPUDevice, videoTexture: VideoTexture)
    {
        const r_queue = reactive(device.queue);
        const r_videoTexture = reactive(videoTexture);

        this._computedGpuExternalTexture = computed(() =>
        {
            // 在提交前确保收集到正确的外部纹理。
            r_queue.preSubmit;

            //
            const label = r_videoTexture.label ?? `GPUExternalTexture ${_autoIndex++}`;

            //
            r_videoTexture.source;
            const source = videoTexture.source;

            const descriptor: GPUExternalTextureDescriptor = { label, source };

            if (r_videoTexture.colorSpace)
            {
                descriptor.colorSpace = r_videoTexture.colorSpace;
            }

            //
            const gpuExternalTexture = device.importExternalTexture(descriptor);

            return gpuExternalTexture;
        });
    }

    static getInstance(device: GPUDevice, videoTexture: VideoTexture)
    {
        return WGPUExternalTexture.map.get([device, videoTexture]) || new WGPUExternalTexture(device, videoTexture);
    }

    static readonly map = new ChainMap<[GPUDevice, VideoTexture], WGPUExternalTexture>();
}

let _autoIndex = 0;