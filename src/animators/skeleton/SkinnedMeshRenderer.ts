import { decoratorRegisterClass } from '@feng3d/polyfill';
import { BufferBinding } from '@feng3d/webgpu';
;
import { Renderable } from '../../core/Renderable';

// 触发 skinnedMeshRendererLogic 注册到 componentLogic 分发表
import './skinnedMeshRendererLogic';

declare module '@feng3d/webgpu'
{
    export interface BindingResources
    {
        skinned: BufferBinding<SkinnedUniforms>;
    }
}

/**
 * 骨骼动画网格渲染器（纯数据）。
 *
 * 渲染逻辑由 {@link skinnedMeshRendererLogic} 提供。
 */
@decoratorRegisterClass()
export class SkinnedMeshRenderer extends Renderable
{
    readonly __type__: string = 'SkinnedMeshRenderer';

    __class__: 'SkinnedMeshRenderer';
}
