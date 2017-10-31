module feng3d
{
	/**
	 * 射线投射拾取器
	 * @author feng 2014-4-29
	 */
    export var raycastPicker = {
        pick: pick
    };

    /**
     * 获取射线穿过的实体
     * @param ray3D 射线
     * @param entitys 实体列表
     * @return
     */
    function pick(ray3D: Ray3D, entitys: GameObject[], findClosest = false)
    {
        var entities: PickingCollisionVO[] = [];

        if (entitys.length == 0)
            return null;

        entitys.forEach(entity =>
        {
            var boundingComponent = entity.getComponent(BoundingComponent);
            var pickingCollisionVO = boundingComponent && boundingComponent.isIntersectingRay(ray3D);
            if (pickingCollisionVO)
                entities.push(pickingCollisionVO);
        });

        if (entities.length == 0)
            return null;

        return getPickingCollisionVO(entities, findClosest);
    }

    /**
     *获取射线穿过的实体
     */
    function getPickingCollisionVO(entities: PickingCollisionVO[], findClosest: boolean)
    {
        // Sort entities from closest to furthest.
        entities = entities.sort((entity1, entity2) =>
        {
            return entity1.rayEntryDistance - entity2.rayEntryDistance;
        });

        // ---------------------------------------------------------------------
        // Evaluate triangle collisions when needed.
        // Replaces collision data provided by bounds collider with more precise data.
        // ---------------------------------------------------------------------

        var shortestCollisionDistance = Number.MAX_VALUE;
        var bestCollisionVO: PickingCollisionVO | null = null;
        var pickingCollisionVO: PickingCollisionVO;
        var i: number;

        for (i = 0; i < entities.length; ++i)
        {
            pickingCollisionVO = entities[i];
            if (as3PickingCollider)
            {
                // If a collision exists, update the collision data and stop all checks.
                if ((bestCollisionVO == null || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance) && collidesBefore(pickingCollisionVO, shortestCollisionDistance, findClosest))
                {
                    shortestCollisionDistance = pickingCollisionVO.rayEntryDistance;
                    bestCollisionVO = pickingCollisionVO;
                    if (!findClosest)
                    {
                        updateLocalPosition(pickingCollisionVO);
                        return pickingCollisionVO;
                    }
                }
            }
            else if (bestCollisionVO == null || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance)
            { // A bounds collision with no triangle collider stops all checks.
                // Note: a bounds collision with a ray origin inside its bounds is ONLY ever used
                // to enable the detection of a corresponsding triangle collision.
                // Therefore, bounds collisions with a ray origin inside its bounds can be ignored
                // if it has been established that there is NO triangle collider to test
                if (!pickingCollisionVO.rayOriginIsInsideBounds)
                {
                    updateLocalPosition(pickingCollisionVO);
                    return pickingCollisionVO;
                }
            }
        }

        return bestCollisionVO;
    }

    /**
     * 更新碰撞本地坐标
     * @param pickingCollisionVO
     */
    function updateLocalPosition(pickingCollisionVO: PickingCollisionVO)
    {
        pickingCollisionVO.localPosition = pickingCollisionVO.localRay.getPoint(pickingCollisionVO.rayEntryDistance);
    }

    /**
     * 碰撞前设置碰撞状态
     * @param shortestCollisionDistance 最短碰撞距离
     * @param findClosest 是否寻找最优碰撞
     * @return
     */
    function collidesBefore(pickingCollisionVO: PickingCollisionVO, shortestCollisionDistance: number, findClosest: boolean): boolean
    {
        var result = as3PickingCollider.testSubMeshCollision(pickingCollisionVO.geometry, pickingCollisionVO.localRay, shortestCollisionDistance, true, findClosest);
        if (result)
        {
            pickingCollisionVO.rayEntryDistance = result.rayEntryDistance;
            pickingCollisionVO.index = result.index;
            pickingCollisionVO.localNormal = result.localNormal;
            pickingCollisionVO.localPosition = result.localPosition;
            pickingCollisionVO.uv = result.uv;
            //
            shortestCollisionDistance = pickingCollisionVO.rayEntryDistance;
            return true;
        }

        return false;
    }
}
