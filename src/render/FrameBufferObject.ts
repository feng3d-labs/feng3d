import { Texture } from '@feng3d/webgpu';

/**
 * 帧缓冲对象。
 *
 * 原 WebGL 实现基于 gl.framebufferTexture2D 等 GL API。已重写为 WebGPU 兼容版本：
 * 保留纹理（webgpu `Texture`）与尺寸字段，供 Light.shadowMap / Water 引用。
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
    texture: Texture;

    constructor(width = 1024, height = 1024)
    {
        this.OFFSCREEN_WIDTH = width;
        this.OFFSCREEN_HEIGHT = height;
        // 直接构造 webgpu Texture 对象（无 TextureInfo 字段，WGPUTexture 按 descriptor 创建）。
        this.texture = {
            descriptor: {
                size: [this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT],
                format: 'rgba8unorm',
            },
        } as Texture;
    }

    /** 是否失效。 */
    private _invalid = true;

    /** 标记失效。 */
    protected invalidate()
    {
        this._invalid = true;
    }
}
