import { registerLogic } from "@feng3d/reactivity";
import { RenderableLogic } from './renderableLogic';
import { MeshRenderer } from './MeshRenderer';

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
import { createRenderableLogic as createRenderableLogicForMeshRenderer } from './renderableLogic';

registerLogic('MeshRenderer', (component) =>
{
    return createRenderableLogicForMeshRenderer(component as MeshRenderer);
});
