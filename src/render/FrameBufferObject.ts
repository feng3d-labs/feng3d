import { watcher } from '@feng3d/watcher';
import { RenderTargetTexture2D } from '../textures/RenderTargetTexture2D';

/**
 * 帧缓冲对象。
 *
 * 原 WebGL 实现基于 gl.framebufferTexture2D 等 GL API。已重写为 WebGPU 兼容版本：
 * 保留纹理（RenderTargetTexture2D）与尺寸字段，供 Light.shadowMap / Water 引用。
 * 实际的离屏渲染由 WebGPU 的 RenderPassDescriptor（colorAttachments + depthStencilAttachment）完成。
 *
 * TODO: 后续可基于 webgpu 的 RenderTarget 进一步整合。
 */
export class FrameBufferObject
{
    /** 离屏宽度。 */
    OFFSCREEN_WIDTH = 1024;

    /** 离屏高度。 */
    OFFSCREEN_HEIGHT = 1024;

    /** 渲染目标纹理（颜色附件）。 */
    texture: RenderTargetTexture2D;

    constructor(width = 1024, height = 1024)
    {
        watcher.watch(this as FrameBufferObject, 'OFFSCREEN_WIDTH', this.invalidateSize, this);
        watcher.watch(this as FrameBufferObject, 'OFFSCREEN_HEIGHT', this.invalidateSize, this);

        this.texture = new RenderTargetTexture2D();
        this.OFFSCREEN_WIDTH = width;
        this.OFFSCREEN_HEIGHT = height;
    }

    /** 是否失效。 */
    private _invalid = true;

    /** 标记失效。 */
    protected invalidate()
    {
        this._invalid = true;
    }

    private invalidateSize()
    {
        if (this.texture)
        {
            this.texture.OFFSCREEN_WIDTH = this.OFFSCREEN_WIDTH;
            this.texture.OFFSCREEN_HEIGHT = this.OFFSCREEN_HEIGHT;
            // 设置 WebGPU descriptor，使 WGPUTexture 创建可渲染+可采样的离屏纹理
            this.texture.descriptor = {
                size: [this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT],
                format: 'rgba8unorm' as const,
            };
        }
        this._invalid = true;
    }
}
