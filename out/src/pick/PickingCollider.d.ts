declare namespace feng3d {
    /**
     * 使用纯计算与实体相交
     */
    class AS3PickingCollider {
        protected ray3D: Ray3D;
        /** 是否查找最短距离碰撞 */
        private _findClosestCollision;
        /**
         * 创建一个AS碰撞检测器
         * @param findClosestCollision 是否查找最短距离碰撞
         */
        constructor(findClosestCollision?: boolean);
        testSubMeshCollision(geometry: Geometry, pickingCollisionVO: PickingCollisionVO, shortestCollisionDistance?: number, bothSides?: boolean): boolean;
        /**
         * 获取碰撞法线
         * @param indexData 顶点索引数据
         * @param vertexData 顶点数据
         * @param triangleIndex 三角形索引
         * @param normal 碰撞法线
         * @return 碰撞法线
         *
         */
        protected getCollisionNormal(indexData: number[], vertexData: number[], triangleIndex?: number, normal?: Vector3D): Vector3D;
        /**
         * 获取碰撞uv
         * @param indexData 顶点数据
         * @param uvData uv数据
         * @param triangleIndex 三角形所有
         * @param v
         * @param w
         * @param u
         * @param uvOffset
         * @param uvStride
         * @param uv uv坐标
         * @return 碰撞uv
         */
        protected getCollisionUV(indexData: Uint16Array, uvData: Float32Array, triangleIndex: number, v: number, w: number, u: number, uvOffset: number, uvStride: number, uv?: Point): Point;
        /**
         * 设置碰撞射线
         */
        setLocalRay(ray3D: Ray3D): void;
    }
}
