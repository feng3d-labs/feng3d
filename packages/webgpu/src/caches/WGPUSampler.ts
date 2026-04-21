import { computed, Computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { Sampler, defaultSampler } from '../data/Sampler';
import { ReactiveObject } from '../ReactiveObject';

export class WGPUSampler extends ReactiveObject
{
    get gpuSampler()
    {
        return this._computedGpuSampler.value;
    }

    private _computedGpuSampler: Computed<GPUSampler>;

    constructor(device: GPUDevice, sampler: Sampler)
    {
        super();

        this._onCreate(device, sampler);

        //
        WGPUSampler.map.set([device, sampler], this);
        this.destroyCall(() =>
        {
            WGPUSampler.map.delete([device, sampler]);
        });
    }

    private _onCreate(device: GPUDevice, sampler: Sampler)
    {
        const r_sampler = reactive(sampler);

        this._computedGpuSampler = computed(() =>
        {
            // defaultSampler 是常量，不需要 reactive 包装
            //
            const label = r_sampler.label;
            const addressModeU = r_sampler.addressModeU ?? defaultSampler.addressModeU;
            const addressModeV = r_sampler.addressModeV ?? defaultSampler.addressModeV;
            const addressModeW = r_sampler.addressModeW ?? defaultSampler.addressModeW;
            const magFilter = r_sampler.magFilter ?? defaultSampler.magFilter;
            const minFilter = r_sampler.minFilter ?? defaultSampler.minFilter;
            const mipmapFilter = r_sampler.mipmapFilter ?? defaultSampler.mipmapFilter;
            let lodMinClamp = r_sampler.lodMinClamp ?? defaultSampler.lodMinClamp;

            // WebGPU 不允许负数的 LOD clamp 值
            if (lodMinClamp < 0)
            {
                console.warn(`[WGPUSampler] lodMinClamp (${lodMinClamp}) 不能为负数，已自动修正为 0`);
                lodMinClamp = 0;
            }
            // 当用户没有显式设置 mipmapFilter 时，lodMaxClamp 默认为 0（不使用 mipmap）
            const lodMaxClamp = r_sampler.lodMaxClamp ?? (r_sampler.mipmapFilter === undefined ? 0 : defaultSampler.lodMaxClamp);
            const compare = r_sampler.compare ?? defaultSampler.compare;
            const maxAnisotropy = (minFilter === 'linear' && magFilter === 'linear' && mipmapFilter === 'linear')
                ? (r_sampler.maxAnisotropy ?? defaultSampler.maxAnisotropy)
                : defaultSampler.maxAnisotropy;

            //
            const gpuSampler = device.createSampler({
                label,
                addressModeU,
                addressModeV,
                addressModeW,
                magFilter,
                minFilter,
                mipmapFilter,
                lodMinClamp,
                lodMaxClamp,
                compare,
                maxAnisotropy,
            });

            //
            return gpuSampler;
        });
    }

    /**
     * 从设备以及采样器描述获得GPU采样器。
     *
     * @param device 设备。
     * @param sampler 采样器描述。
     * @returns GPU采样器。
     */
    static getInstance(device: GPUDevice, sampler: Sampler)
    {
        return this.map.get([device, sampler]) || new WGPUSampler(device, sampler);
    }

    private static readonly map = new ChainMap<[GPUDevice, Sampler], WGPUSampler>();
}