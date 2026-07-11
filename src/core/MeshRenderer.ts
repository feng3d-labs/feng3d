import { Renderable, createRenderable } from './Renderable';
import { RunEnvironment } from './RunEnvironment';
import { registerDefaults, registerLogic, logic as getLogic } from '@feng3d/reactivity';
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

// 注册默认值（缺失字段自动填充）
// 复用 Renderable 行为默认值；geometry/material 留空由 renderableLogic fallback
registerDefaults('MeshRenderer', {
    enabled: true,
    runEnvironment: RunEnvironment.all,
    castShadows: true,
    receiveShadows: true,
});

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        MeshRenderer: RenderableLogic;
    }
}

/**
 * 获取 MeshRenderer 的 logic（委托给统一 logic 入口，与 initComponent 共享同一实例）。
 *
 * MeshRenderer 纯粹复用 RenderableLogic，无额外行为。
 */
export function meshRendererLogic(meshRenderer: MeshRenderer): RenderableLogic
{
    return getLogic(meshRenderer);
}

registerLogic('MeshRenderer', (component) =>
{
    return new RenderableLogic(component as MeshRenderer);
});
