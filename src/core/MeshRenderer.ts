import { Renderable, createRenderable } from './Renderable';
import { registerLogic } from '@feng3d/reactivity';
import { RenderableLogic } from './Renderable';

// 触发 meshRendererLogic 注册到 logic 分发表
import './MeshRenderer';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        MeshRenderer: MeshRenderer; 
    }
}

/**
 * 网格渲染器（纯数据接口）。
 *
 * 渲染逻辑由 meshRendererLogic（复用 renderableLogic）提供。
 */
export interface MeshRenderer extends Renderable
{
    readonly __type__: 'MeshRenderer';
}

/**
 * 创建 MeshRenderer 实例。
 */
export function createMeshRenderer(): MeshRenderer
{
    return { ...createRenderable(), __type__: 'MeshRenderer' };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        MeshRenderer: RenderableLogic;
    }
}
// MeshRenderer 复用 RenderableLogic：enabled / runEnvironment / castShadows / receiveShadows
// 默认值由 RenderableLogic 构造函数处理（继承自 BehaviourLogic + 自身 castShadows/receiveShadows）
registerLogic('MeshRenderer', RenderableLogic as new (data: { readonly __type__: 'MeshRenderer' }) => RenderableLogic);
