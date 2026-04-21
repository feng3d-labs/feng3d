import { ChainMap } from '../utils/ChainMap';
import { BindGroupLayoutDescriptor } from './WGPUPipelineLayout';

export class WGPUBindGroupLayout
{
    static getGPUBindGroupLayout(device: GPUDevice, bindGroupLayout: BindGroupLayoutDescriptor)
    {
        let gpuBindGroupLayout = this.map.get([device, bindGroupLayout]);

        if (!gpuBindGroupLayout)
        {
            gpuBindGroupLayout = device.createBindGroupLayout(bindGroupLayout);

            this.map.set([device, bindGroupLayout], gpuBindGroupLayout);
        }

        return gpuBindGroupLayout;
    }

    private static readonly map = new ChainMap<[GPUDevice, BindGroupLayoutDescriptor], GPUBindGroupLayout>();
}