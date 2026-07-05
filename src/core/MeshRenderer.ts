import { Renderable, createRenderable } from './Renderable';
import { RunEnvironment } from './RunEnvironment';
import { registerDefaults } from './logic';

// 触发 meshRendererLogic 注册到 logic 分发表
import './meshRendererLogic';

/**
 * 网格渲染器（纯数据接口）。
 *
 * 渲染逻辑由 meshRendererLogic（复用 renderableLogic）提供。
 */
export interface MeshRenderer extends Renderable
{
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
