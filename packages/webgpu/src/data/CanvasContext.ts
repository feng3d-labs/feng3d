import { CanvasConfiguration } from './CanvasConfiguration';

/**
 * 画布上下文
 */
export interface CanvasContext
{
    /**
     * 画布。
     *
     * 可能是画布的编号，也可能是画布元素或者离屏画布。
     */
    readonly canvasId: string | HTMLCanvasElement | OffscreenCanvas;

    /**
     * WebGPU 画布配置
     *
     * 包含纹理格式、用途、颜色空间、色调映射等配置参数
     * 用于配置 WebGPU 画布上下文的渲染参数
     *
     * 可选属性，如果未提供则使用默认配置
     *
     * @see GPUCanvasContext - WebGPU 画布上下文接口
     * @see GPUCanvasContext.configure - WebGPU 画布配置方法
     */
    readonly configuration?: CanvasConfiguration;
}
