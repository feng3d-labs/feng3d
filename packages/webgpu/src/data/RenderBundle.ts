import { RenderObject } from './RenderObject';

/**
 * GPU渲染捆绑对象。
 *
 * {@link GPURenderBundleEncoder}
 *
 * {@link GPUDevice.createRenderBundleEncoder}
 */
export interface RenderBundle
{
    /**
     * 数据类型。
     */
    readonly __type__: 'RenderBundle';

    /**
     * GPU渲染捆绑编码器描述。
     */
    readonly descriptor?: RenderBundleDescriptor

    /**
     * GPU渲染对象列表。
     */
    readonly renderObjects: readonly RenderObject[];
}

/**
 * GPU渲染捆绑编码器描述。
 *
 * {@link GPURenderBundleEncoderDescriptor}
 *
 * 'colorFormats' | 'depthStencilFormat' | 'sampleCount' 都将从GPU渲染通道中自动获取。
 */
export interface RenderBundleDescriptor
{
    /**
     * If `true`, indicates that the render bundle does not modify the depth component of the
     * {@link GPURenderPassDepthStencilAttachment} of any render pass the render bundle is executed
     * in.
     * See read-only depth-stencil.
     */
    readonly depthReadOnly?: boolean;

    /**
     * If `true`, indicates that the render bundle does not modify the stencil component of the
     * {@link GPURenderPassDepthStencilAttachment} of any render pass the render bundle is executed
     * in.
     * See read-only depth-stencil.
     */
    readonly stencilReadOnly?: boolean;
}
