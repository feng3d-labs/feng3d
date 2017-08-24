var feng3d;
(function (feng3d) {
    /**
     * 射线投射拾取器
     * @author feng 2014-4-29
     */
    var RaycastPicker = (function () {
        /**
         *
         * @param findClosestCollision 是否需要寻找最接近的
         */
        function RaycastPicker(findClosestCollision) {
            this._findClosestCollision = findClosestCollision;
            RaycastPicker.pickingCollider = RaycastPicker.pickingCollider || new feng3d.AS3PickingCollider();
        }
        /**
         * 获取射线穿过的实体
         * @param ray3D 射线
         * @param entitys 实体列表
         * @return
         */
        RaycastPicker.prototype.getViewCollision = function (ray3D, entitys) {
            var _this = this;
            this._entities = [];
            if (entitys.length == 0)
                return null;
            entitys.forEach(function (entity) {
                if (entity.transform.isIntersectingRay(ray3D))
                    _this._entities.push(entity);
            });
            if (this._entities.length == 0)
                return null;
            return this.getPickingCollisionVO();
        };
        /**
         *获取射线穿过的实体
         */
        RaycastPicker.prototype.getPickingCollisionVO = function () {
            // Sort entities from closest to furthest.
            this._entities = this._entities.sort(this.sortOnNearT);
            // ---------------------------------------------------------------------
            // Evaluate triangle collisions when needed.
            // Replaces collision data provided by bounds collider with more precise data.
            // ---------------------------------------------------------------------
            var shortestCollisionDistance = Number.MAX_VALUE;
            var bestCollisionVO;
            var pickingCollisionVO;
            var entity;
            var i;
            for (i = 0; i < this._entities.length; ++i) {
                entity = this._entities[i];
                pickingCollisionVO = entity.transform._pickingCollisionVO;
                if (RaycastPicker.pickingCollider) {
                    // If a collision exists, update the collision data and stop all checks.
                    if ((bestCollisionVO == null || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance) && entity.transform.collidesBefore(RaycastPicker.pickingCollider, shortestCollisionDistance, this._findClosestCollision)) {
                        shortestCollisionDistance = pickingCollisionVO.rayEntryDistance;
                        bestCollisionVO = pickingCollisionVO;
                        if (!this._findClosestCollision) {
                            this.updateLocalPosition(pickingCollisionVO);
                            return pickingCollisionVO;
                        }
                    }
                }
                else if (bestCollisionVO == null || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance) {
                    // Note: a bounds collision with a ray origin inside its bounds is ONLY ever used
                    // to enable the detection of a corresponsding triangle collision.
                    // Therefore, bounds collisions with a ray origin inside its bounds can be ignored
                    // if it has been established that there is NO triangle collider to test
                    if (!pickingCollisionVO.rayOriginIsInsideBounds) {
                        this.updateLocalPosition(pickingCollisionVO);
                        return pickingCollisionVO;
                    }
                }
            }
            return bestCollisionVO;
        };
        /**
         * 按与射线原点距离排序
         */
        RaycastPicker.prototype.sortOnNearT = function (entity1, entity2) {
            return entity1.transform.pickingCollisionVO.rayEntryDistance > entity2.transform.pickingCollisionVO.rayEntryDistance ? 1 : -1;
        };
        /**
         * 更新碰撞本地坐标
         * @param pickingCollisionVO
         */
        RaycastPicker.prototype.updateLocalPosition = function (pickingCollisionVO) {
            pickingCollisionVO.localPosition = pickingCollisionVO.localRay.getPoint(pickingCollisionVO.rayEntryDistance);
        };
        return RaycastPicker;
    }());
    feng3d.RaycastPicker = RaycastPicker;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=RaycastPicker.js.map