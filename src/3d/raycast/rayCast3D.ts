import { Ray3 } from '../../math/geom/Ray3';
import { Vector2 } from '../../math/geom/Vector2';
import { Vector3 } from '../../math/geom/Vector3';
import { CullFace } from '../../renderer/data/RenderParams';
import { Mesh3D } from '../core/Mesh3D';
import { Node3D } from '../core/Node3D';
import { Geometry } from '../geometrys/Geometry';

/**
 * 投射射线获取穿过的最近的对象
 *
 * @param ray 射线
 * @param meshRenderers 实体列表
 * @return
 */
export function rayCast3D(ray: Ray3, meshRenderers: Mesh3D[])
{
    if (meshRenderers.length === 0) return null;

    const pickingCollisionVOs = meshRenderers.reduce((pv: PickingCollisionVO[], meshRenderer) =>
    {
        const pickingCollisionVO = meshRenderer && meshRenderer.worldRayIntersection(ray);
        if (pickingCollisionVO) pv.push(pickingCollisionVO);

        return pv;
    }, []);

    if (pickingCollisionVOs.length === 0) return null;

    // 根据与包围盒距离进行排序
    pickingCollisionVOs.sort((a, b) => a.rayEntryDistance - b.rayEntryDistance);

    let shortestCollisionDistance = Number.MAX_VALUE;
    let bestCollisionVO: PickingCollisionVO = null;
    const collisionVOs: PickingCollisionVO[] = [];

    for (let i = 0; i < pickingCollisionVOs.length; ++i)
    {
        const pickingCollisionVO = pickingCollisionVOs[i];
        if (!bestCollisionVO || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance)
        {
            const result = pickingCollisionVO.geometry.raycast(pickingCollisionVO.localRay, shortestCollisionDistance, pickingCollisionVO.cullFace);
            if (result)
            {
                pickingCollisionVO.rayEntryDistance = result.rayEntryDistance;
                pickingCollisionVO.index = result.index;
                pickingCollisionVO.localNormal = result.localNormal;
                pickingCollisionVO.localPosition = result.localPosition;
                pickingCollisionVO.uv = result.uv;
                //
                shortestCollisionDistance = pickingCollisionVO.rayEntryDistance;
                collisionVOs.push(pickingCollisionVO);
                bestCollisionVO = pickingCollisionVO;
            }
        }
    }

    return bestCollisionVO;
}

/**
 * 投射射线获取穿过的所有对象
 *
 * @param ray3D 射线
 * @param node3ds 实体列表
 * @return
 */
export function rayCastAll(ray3D: Ray3, node3ds: Node3D[])
{
    if (node3ds.length === 0) return [];

    const pickingCollisionVOs = node3ds.reduce((pv: PickingCollisionVO[], node3d) =>
    {
        const model = node3d.getComponent('Mesh3D');
        const pickingCollisionVO = model && model.worldRayIntersection(ray3D);
        if (pickingCollisionVO) pv.push(pickingCollisionVO);

        return pv;
    }, []);

    if (pickingCollisionVOs.length === 0) return [];

    const collisionVOs = pickingCollisionVOs.filter((v) =>
    {
        const result = v.geometry.raycast(v.localRay, Number.MAX_VALUE, v.cullFace);
        if (result)
        {
            v.rayEntryDistance = result.rayEntryDistance;
            v.index = result.index;
            v.localNormal = result.localNormal;
            v.localPosition = result.localPosition;
            v.uv = result.uv;

            return true;
        }

        return false;
    });

    return collisionVOs;
}

/**
 * 拾取的碰撞数据
 */
export interface PickingCollisionVO
{
    /**
     * 第一个穿过的物体
     */
    meshRenderer: Mesh3D;

    /**
     * 碰撞的uv坐标
     */
    uv?: Vector2;

    /**
     * 实体上碰撞本地坐标
     */
    localPosition?: Vector3;

    /**
     * 射线顶点到实体的距离
     */
    rayEntryDistance: number;

    /**
     * 本地坐标系射线
     */
    localRay: Ray3;

    /**
     * 本地坐标碰撞法线
     */
    localNormal: Vector3;

    /**
     * 射线坐标是否在边界内
     */
    rayOriginIsInsideBounds: boolean;

    /**
     * 碰撞三角形索引
     */
    index?: number;

    /**
     * 碰撞关联的渲染对象
     */
    geometry: Geometry;

    /**
     * 剔除面
     */
    cullFace: CullFace;
}
