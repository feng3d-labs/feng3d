import { Renderable } from './Renderable';
import { RenderableLogic } from './Renderable';
import { registerLogic } from '@feng3d/reactivity';

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
 * 渲染逻辑由 RenderableLogic 提供（复用）。
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
// MeshRenderer 复用 RenderableLogic：enabled / runEnvironment / castShadows / receiveShadows
// 默认值由基类组合链处理
registerLogic('MeshRenderer', RenderableLogic as unknown as new (data: MeshRenderer) => RenderableLogic);
