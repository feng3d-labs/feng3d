declare namespace feng3d {
    /**
     * 拾取的碰撞数据
     */
    class PickingCollisionVO {
        /**
         * 第一个穿过的物体
         */
        firstEntity: GameObject;
        /**
         * 碰撞的uv坐标
         */
        uv: Point;
        /**
         * 实体上碰撞本地坐标
         */
        localPosition: Vector3D;
        /**
         * 射线顶点到实体的距离
         */
        rayEntryDistance: number;
        /**
         * 本地坐标系射线
         */
        localRay: Ray3D;
        /**
         * 本地坐标碰撞法线
         */
        localNormal: Vector3D;
        /**
         * 场景中碰撞射线
         */
        ray3D: Ray3D;
        /**
         * 射线坐标是否在边界内
         */
        rayOriginIsInsideBounds: boolean;
        /**
         * 碰撞三角形索引
         */
        index: number;
        /**
         * 碰撞关联的渲染对象
         */
        renderable: Geometry;
        /**
         * 创建射线拾取碰撞数据
         * @param entity
         */
        constructor(entity: GameObject);
        /**
         * 实体上碰撞世界坐标
         */
        readonly scenePosition: Vector3D;
    }
}
