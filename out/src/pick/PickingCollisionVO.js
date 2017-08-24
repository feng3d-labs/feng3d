var feng3d;
(function (feng3d) {
    /**
     * 拾取的碰撞数据
     */
    var PickingCollisionVO = (function () {
        /**
         * 创建射线拾取碰撞数据
         * @param entity
         */
        function PickingCollisionVO(entity) {
            /**
             * 本地坐标系射线
             */
            this.localRay = new feng3d.Ray3D();
            /**
             * 场景中碰撞射线
             */
            this.ray3D = new feng3d.Ray3D();
            this.firstEntity = entity;
        }
        Object.defineProperty(PickingCollisionVO.prototype, "scenePosition", {
            /**
             * 实体上碰撞世界坐标
             */
            get: function () {
                return this.firstEntity.transform.localToWorldMatrix.transformVector(this.localPosition);
            },
            enumerable: true,
            configurable: true
        });
        return PickingCollisionVO;
    }());
    feng3d.PickingCollisionVO = PickingCollisionVO;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=PickingCollisionVO.js.map