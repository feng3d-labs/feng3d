import { Ray3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { RegisterComponent } from '../component/Component';
import { Geometry, GeometryLike } from '../geometry/Geometry';
import { Material } from '../materials/Material';
import { PickingCollisionVO } from '../pick/Raycaster';
import { RayCastable } from './RayCastable';

// 触发 renderableLogic 注册到 componentLogic 分发表
import './renderableLogic';
export { renderableLogic } from './renderableLogic';
export type { RenderableLogic } from './renderableLogic';

declare global
{
    export interface MixinsComponentMap { Renderable: Renderable; }
}

/**
 * 可渲染组件（纯数据）。
 *
 * General functionality for all renderers.
 *
 * 渲染逻辑（renderObject computed、beforeRender 分发、射线相交、加载状态、dispose）
 * 由 {@link renderableLogic} 提供。
 */
@RegisterComponent()
export class Renderable extends RayCastable
{
    /**
     * 几何体
     */
    @oav({ component: 'OAVPick', tooltip: '几何体，提供模型以形状', componentParam: { accepttype: 'geometry', datatype: 'geometry' } })
    @serialize
    geometry: GeometryLike = Geometry.getDefault('Cube');

    /**
     * 材质
     */
    @oav({ component: 'OAVPick', tooltip: '材质，提供模型以皮肤', componentParam: { accepttype: 'material', datatype: 'material' } })
    @serialize
    material = Material.getDefault('Default-Material');

    @oav({ tooltip: '是否投射阴影' })
    @serialize
    castShadows = true;

    @oav({ tooltip: '是否接受阴影' })
    @serialize
    receiveShadows = true;

    /**
     * 与世界空间射线相交。
     *
     * @param _worldRay 世界空间射线
     * @return 相交信息（由 renderableLogic.worldRayIntersection 实现）
     */
    worldRayIntersection(_worldRay: Ray3): PickingCollisionVO
    {
        throw '请在子类中实现！';
    }
}
