import { Renderable, renderableLogic } from './Renderable';
import { registerLogic } from '@feng3d/reactivity';
import type { RenderableLogic } from './Renderable';

// 触发 meshRendererLogic 注册到 logic 分发表

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

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        MeshRenderer: RenderableLogic;
    }
}
// MeshRenderer 复用 renderableLogic：enabled / runEnvironment / castShadows / receiveShadows
// 默认值由 renderableLogic 工厂处理（组合 behaviourLogic + 自身 castShadows/receiveShadows）
registerLogic('MeshRenderer', renderableLogic);
