import { TextureLike } from '../types/TextureLike';

import { WGPUCanvasTexture } from './WGPUCanvasTexture';
import { WGPUTexture } from './WGPUTexture';

export class WGPUTextureLike
{
    /**
     * 获取纹理实例
     * @param device GPU设备
     * @param textureLike 纹理对象
     * @param autoCreate 是否自动创建
     * @returns 纹理实例
     */
    static getInstance(device: GPUDevice, textureLike: TextureLike)
    {
        // 处理画布纹理
        if ('context' in textureLike)
        {
            return WGPUCanvasTexture.getInstance(device, textureLike);
        }

        return WGPUTexture.getInstance(device, textureLike);
    }
}