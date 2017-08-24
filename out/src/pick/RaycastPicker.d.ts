declare namespace feng3d {
    /**
     * 射线投射拾取器
     * @author feng 2014-4-29
     */
    class RaycastPicker {
        /** 是否需要寻找最接近的 */
        private _findClosestCollision;
        protected _entities: GameObject[];
        private static pickingCollider;
        /**
         *
         * @param findClosestCollision 是否需要寻找最接近的
         */
        constructor(findClosestCollision: boolean);
        /**
         * 获取射线穿过的实体
         * @param ray3D 射线
         * @param entitys 实体列表
         * @return
         */
        getViewCollision(ray3D: Ray3D, entitys: GameObject[]): PickingCollisionVO;
        /**
         *获取射线穿过的实体
         */
        private getPickingCollisionVO();
        /**
         * 按与射线原点距离排序
         */
        private sortOnNearT(entity1, entity2);
        /**
         * 更新碰撞本地坐标
         * @param pickingCollisionVO
         */
        private updateLocalPosition(pickingCollisionVO);
    }
}
