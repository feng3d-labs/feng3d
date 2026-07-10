import { Renderable, createRenderable } from './Renderable';
import { RunEnvironment } from './RunEnvironment';
import { registerDefaults, registerLogic } from '@feng3d/reactivity';
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
 * MeshRenderer 逻辑处理输出。
 *
 * 纯粹复用 renderableLogic，无额外行为。
 */
export function meshRendererLogic(meshRenderer: MeshRenderer): RenderableLogic
{
    return createRenderableLogicForMeshRenderer(meshRenderer);
}

// 直接调用 createRenderableLogic（不经过 logic() 分发，避免 _pending 递归）
import { createRenderableLogic as createRenderableLogicForMeshRenderer } from './Renderable';

registerLogic('MeshRenderer', (component) =>
{
    return createRenderableLogicForMeshRenderer(component as MeshRenderer);
});
