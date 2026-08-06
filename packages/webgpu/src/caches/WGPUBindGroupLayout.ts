import { ChainMap } from '../utils/ChainMap';
import { BindGroupLayoutDescriptor } from './WGPUPipelineLayout';
import { trackCreate } from '../utils/GPUDeviceStats';

export class WGPUBindGroupLayout
{
    static getGPUBindGroupLayout(device: GPUDevice, bindGroupLayout: BindGroupLayoutDescriptor)
    {
        let gpuBindGroupLayout = this.map.get([device, bindGroupLayout]);

        if (!gpuBindGroupLayout)
        {
            gpuBindGroupLayout = device.createBindGroupLayout(bindGroupLayout);

            this.map.set([device, bindGroupLayout], gpuBindGroupLayout);
            // 绑定组布局随 device 生命周期常驻缓存，只统计创建累计数
            trackCreate(device, 'bindGroupLayout');
        }

        return gpuBindGroupLayout;
    }

    private static readonly map = new ChainMap<[GPUDevice, BindGroupLayoutDescriptor], GPUBindGroupLayout>();
}