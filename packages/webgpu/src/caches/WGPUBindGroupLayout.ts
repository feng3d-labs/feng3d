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

    /**
     * 实例缓存的存储（R2，issue #614：缓存一律 lazy-init，不在 import 时分配）。
     */
    private static _map: ChainMap<[GPUDevice, BindGroupLayoutDescriptor], GPUBindGroupLayout> | null = null;

    /** 实例缓存（首次访问时创建） */
    private static get map(): ChainMap<[GPUDevice, BindGroupLayoutDescriptor], GPUBindGroupLayout>
    {
        if (!WGPUBindGroupLayout._map) WGPUBindGroupLayout._map = new ChainMap();

        return WGPUBindGroupLayout._map;
    }
}