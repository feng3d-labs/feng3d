import { Computed, computed } from '@feng3d/reactivity';
import { BindingResources } from '../data/BindingResources';
import { ChainMap } from '../utils/ChainMap';

import { ReactiveObject } from '../ReactiveObject';
import { WGPUBindGroupEntry } from './WGPUBindGroupEntry';
import { WGPUBindGroupLayout } from './WGPUBindGroupLayout';
import { BindGroupLayoutDescriptor } from './WGPUPipelineLayout';

export class WGPUBindGroup extends ReactiveObject
{
    get gpuBindGroup()
    {
        return this._computedGpuBindGroup.value;
    }

    private _computedGpuBindGroup: Computed<GPUBindGroup>;

    constructor(device: GPUDevice, bindGroupLayout: BindGroupLayoutDescriptor, bindingResources: BindingResources)
    {
        super();

        this._onCreate(device, bindGroupLayout, bindingResources);
        //
        WGPUBindGroup.map.set([device, bindGroupLayout, bindingResources], this);
        this.destroyCall(() =>
        {
            WGPUBindGroup.map.delete([device, bindGroupLayout, bindingResources]);
        });
    }

    private _onCreate(device: GPUDevice, bindGroupLayout: BindGroupLayoutDescriptor, bindingResources: BindingResources)
    {
        this._computedGpuBindGroup = computed(() =>
        {
            const entries = bindGroupLayout.entries.map((v) =>
            {
                const wgpuBindGroupEntry = WGPUBindGroupEntry.getInstance(device, v, bindingResources);

                return wgpuBindGroupEntry.gpuBindGroupEntry;
            });

            //
            const resources = entries.map((v) => v.resource);
            const gpuBindGroupKey = [bindGroupLayout, ...resources];
            let gBindGroup = WGPUBindGroup.gpuBindGroupMap.get(gpuBindGroupKey);

            if (!gBindGroup)
            {
                const gpuBindGroupLayout = WGPUBindGroupLayout.getGPUBindGroupLayout(device, bindGroupLayout);

                gBindGroup = device.createBindGroup({ layout: gpuBindGroupLayout, entries });

                WGPUBindGroup.gpuBindGroupMap.set(gpuBindGroupKey, gBindGroup);
            }

            return gBindGroup;
        });
    }

    static getInstance(device: GPUDevice, bindGroupLayout: BindGroupLayoutDescriptor, bindingResources: BindingResources)
    {
        return this.map.get([device, bindGroupLayout, bindingResources]) || new WGPUBindGroup(device, bindGroupLayout, bindingResources);
    }

    private static readonly gpuBindGroupMap = new ChainMap<any, GPUBindGroup>();
    private static readonly map = new ChainMap<[GPUDevice, BindGroupLayoutDescriptor, BindingResources], WGPUBindGroup>();
}
