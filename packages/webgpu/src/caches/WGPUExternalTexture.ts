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

    /**
     * 实例缓存的存储（R2，issue #614：缓存一律 lazy-init，不在 import 时分配）。
     */
    private static _map: ChainMap<[GPUDevice, VideoTexture], WGPUExternalTexture> | null = null;

    /** 实例缓存（首次访问时创建） */
    static get map(): ChainMap<[GPUDevice, VideoTexture], WGPUExternalTexture>
    {
        if (!WGPUExternalTexture._map) WGPUExternalTexture._map = new ChainMap();

        return WGPUExternalTexture._map;
    }
}

let _autoIndex = 0;