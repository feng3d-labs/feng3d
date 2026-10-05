import { Computed, computed, reactive } from '@feng3d/reactivity';
import { CanvasTexture } from '../data/CanvasTexture';
import { ChainMap } from '../utils/ChainMap';

import { ReactiveObject } from '../ReactiveObject';
import { WGPUCanvasContext } from './WGPUCanvasContext';

/**
 * WebGPU画布纹理缓存类
 *
 * 负责管理WebGPU画布纹理的创建、更新和销毁
 * 继承自 ReactiveObject ，支持响应式属性监听
 */
export class WGPUCanvasTexture extends ReactiveObject
{
    /**
     * WebGPU纹理对象
     */
    get gpuTexture()
    {
        return this._computedGpuTexture.value;
    }

    private _computedGpuTexture: Computed<GPUTexture>;

    /**
     * 构造函数
     *
     * @param device GPU设备
     * @param canvasTexture 画布纹理对象
     */
    constructor(device: GPUDevice, canvasTexture: CanvasTexture)
    {
        super();

        //
        this._onCreate(device, canvasTexture);

        const canvasId = canvasTexture.context.canvasId;

        //
        WGPUCanvasTexture.map.set([device, canvasId], this);
        this.destroyCall(() =>
        {
            WGPUCanvasTexture.map.delete([device, canvasId]);
        });
    }

    private _onCreate(device: GPUDevice, canvasTexture: CanvasTexture)
    {
        const r_canvasTexture = reactive(canvasTexture);

        let oldGpuTexture: GPUTexture;

        this._computedGpuTexture = computed(() =>
        {
            reactive(device.queue).preSubmit;

            r_canvasTexture.context;

            const context = canvasTexture.context;

            //
            const wgpuCanvasContext = WGPUCanvasContext.getInstance(device, context);

            // 监听画布上下文版本号变化
            wgpuCanvasContext.version;

            const gpuCanvasContext = wgpuCanvasContext.gpuCanvasContext;

            // 获取当前纹理
            const gpuTexture = gpuCanvasContext.getCurrentTexture();

            if (gpuTexture === oldGpuTexture) return gpuTexture;

            // 设置纹理标签
            gpuTexture.label = `GPU画布纹理-${id++}`;

            oldGpuTexture = gpuTexture;

            return gpuTexture;
        });
    }

    /**
     * 获取纹理实例
     *
     * @param device GPU设备
     * @param canvasTexture 画布纹理对象
     * @returns 纹理实例
     */
    static getInstance(device: GPUDevice, canvasTexture: CanvasTexture)
    {
        return this.map.get([device, canvasTexture.context.canvasId]) || new WGPUCanvasTexture(device, canvasTexture);
    }

    /**
     * 实例缓存的存储（R2，issue #614：缓存一律 lazy-init，不在 import 时分配）。
     */
    private static _map: ChainMap<[GPUDevice, string | HTMLCanvasElement | OffscreenCanvas], WGPUCanvasTexture> | null = null;

    /** 实例缓存（首次访问时创建） */
    private static get map(): ChainMap<[GPUDevice, string | HTMLCanvasElement | OffscreenCanvas], WGPUCanvasTexture>
    {
        if (!WGPUCanvasTexture._map) WGPUCanvasTexture._map = new ChainMap();

        return WGPUCanvasTexture._map;
    }
}

let id = 0;