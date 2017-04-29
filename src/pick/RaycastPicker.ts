module feng3d
{
	/**
	 * 射线投射拾取器
	 * @author feng 2014-4-29
	 */
    export class RaycastPicker
    {
        /** 是否需要寻找最接近的 */
        private _findClosestCollision: boolean;

        protected _entities: GameObject[];

        private static pickingCollider: AS3PickingCollider;

		/**
		 *
		 * @param findClosestCollision 是否需要寻找最接近的
		 */
        constructor(findClosestCollision: boolean)
        {
            this._findClosestCollision = findClosestCollision;
            RaycastPicker.pickingCollider = RaycastPicker.pickingCollider || new AS3PickingCollider();
        }

		/**
		 * 获取射线穿过的实体
		 * @param ray3D 射线
		 * @param entitys 实体列表
		 * @return
		 */
        public getViewCollision(ray3D: Ray3D, entitys: GameObject[]): PickingCollisionVO
        {
            this._entities = [];

            if (entitys.length == 0)
                return null;

            entitys.forEach(entity =>
            {
                if (entity.isIntersectingRay(ray3D))
                    this._entities.push(entity);
            });

            if (this._entities.length == 0)
                return null;

            return this.getPickingCollisionVO();
        }

		/**
		 *获取射线穿过的实体
		 */
        private getPickingCollisionVO(): PickingCollisionVO
        {
            // Sort entities from closest to furthest.
            this._entities = this._entities.sort(this.sortOnNearT);

            // ---------------------------------------------------------------------
            // Evaluate triangle collisions when needed.
            // Replaces collision data provided by bounds collider with more precise data.
            // ---------------------------------------------------------------------

            var shortestCollisionDistance: number = Number.MAX_VALUE;
            var bestCollisionVO: PickingCollisionVO;
            var pickingCollisionVO: PickingCollisionVO;
            var entity: GameObject;
            var i: number;

            for (i = 0; i < this._entities.length; ++i)
            {
                entity = this._entities[i];
                pickingCollisionVO = entity._pickingCollisionVO;
                if (RaycastPicker.pickingCollider)
                {
                    // If a collision exists, update the collision data and stop all checks.
                    if ((bestCollisionVO == null || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance) && entity.collidesBefore(RaycastPicker.pickingCollider, shortestCollisionDistance, this._findClosestCollision))
                    {
                        shortestCollisionDistance = pickingCollisionVO.rayEntryDistance;
                        bestCollisionVO = pickingCollisionVO;
                        if (!this._findClosestCollision)
                        {
                            this.updateLocalPosition(pickingCollisionVO);
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
                        this.updateLocalPosition(pickingCollisionVO);
                        return pickingCollisionVO;
                    }
                }
            }

            return bestCollisionVO;
        }

		/**
		 * 按与射线原点距离排序
		 */
        private sortOnNearT(entity1: GameObject, entity2: GameObject): number
        {
            return entity1.pickingCollisionVO.rayEntryDistance > entity2.pickingCollisionVO.rayEntryDistance ? 1 : -1;
        }

		/**
		 * 更新碰撞本地坐标
		 * @param pickingCollisionVO
		 */
        private updateLocalPosition(pickingCollisionVO: PickingCollisionVO)
        {
            pickingCollisionVO.localPosition = pickingCollisionVO.localRay.getPoint(pickingCollisionVO.rayEntryDistance);
        }
    }
}
