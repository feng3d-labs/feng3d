import { registerComponentLogic } from '../component/componentLogic';
import { renderableLogic } from './renderableLogic';
import { MeshRenderer } from './MeshRenderer';

/**
 * MeshRenderer 逻辑处理输出。
 *
 * 纯粹复用 renderableLogic，无额外行为。
 */
export function meshRendererLogic(meshRenderer: MeshRenderer)
{
    return renderableLogic(meshRenderer);
}

// 注册到 componentLogic 分发表
registerComponentLogic('MeshRenderer', (component) =>
{
    return renderableLogic(component as MeshRenderer);
});
