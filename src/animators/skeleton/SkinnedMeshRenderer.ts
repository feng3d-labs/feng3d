import { Renderable, createRenderable } from '../../core/Renderable';
import type { BufferBinding } from '@feng3d/webgpu';

import './skinnedMeshRendererLogic';

declare module '../../component/Component'
{
    export interface ComponentMap
    {
        SkinnedMeshRenderer: SkinnedMeshRenderer;
    }
}

declare module '@feng3d/webgpu'
{
    export interface BindingResources
    {
        skinned: BufferBinding<any>;
    }
}

/**
 * SkinnedMeshRenderer（纯数据接口）。
 */
export interface SkinnedMeshRenderer extends Renderable
{
    readonly __type__: 'SkinnedMeshRenderer';
}

/**
 * 创建 SkinnedMeshRenderer 实例。
 */
export function createSkinnedMeshRenderer(): SkinnedMeshRenderer
{
    return {
        ...createRenderable(), __type__: 'SkinnedMeshRenderer'
    };
}
