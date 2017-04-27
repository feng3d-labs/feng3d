module feng3d
{

	/**
	 * 使用纯计算与实体相交
	 */
    export class AS3PickingCollider
    {
        protected ray3D: Ray3D;
        /** 是否查找最短距离碰撞 */
        private _findClosestCollision: boolean;

		/**
		 * 创建一个AS碰撞检测器
		 * @param findClosestCollision 是否查找最短距离碰撞
		 */
        constructor(findClosestCollision: boolean = false)
        {
            this._findClosestCollision = findClosestCollision;
        }

        public testSubMeshCollision(subMesh: Model, pickingCollisionVO: PickingCollisionVO, shortestCollisionDistance = 0, bothSides: boolean = true): boolean
        {
            var geometry = subMesh.geometry;
            var indexData = geometry.getIndexData().indices;
            var vertexData = geometry.getVAData(GLAttribute.a_position).data;
            var uvData = geometry.getVAData(GLAttribute.a_uv).data;

            var t = 0;
            var i0 = 0, i1 = 0, i2 = 0;
            var rx = 0, ry = 0, rz = 0;
            var nx = 0, ny = 0, nz = 0;
            var cx = 0, cy = 0, cz = 0;
            var coeff = 0, u = 0, v = 0, w = 0;
            var p0x = 0, p0y = 0, p0z = 0;
            var p1x = 0, p1y = 0, p1z = 0;
            var p2x = 0, p2y = 0, p2z = 0;
            var s0x = 0, s0y = 0, s0z = 0;
            var s1x = 0, s1y = 0, s1z = 0;
            var nl = 0, nDotV = 0, D = 0, disToPlane = 0;
            var Q1Q2 = 0, Q1Q1 = 0, Q2Q2 = 0, RQ1 = 0, RQ2 = 0;

            var collisionTriangleIndex: number = -1;

            var vertexStride: number = 3;
            var vertexOffset: number = 0;
            var uvStride: number = 2;
            var numIndices: number = indexData.length;

            //遍历每个三角形 检测碰撞
            for (var index: number = 0; index < numIndices; index += 3)
            { // sweep all triangles
                //三角形三个顶点索引
                i0 = vertexOffset + indexData[index] * vertexStride;
                i1 = vertexOffset + indexData[index + 1] * vertexStride;
                i2 = vertexOffset + indexData[index + 2] * vertexStride;

                //三角形三个顶点数据
                p0x = vertexData[i0];
                p0y = vertexData[i0 + 1];
                p0z = vertexData[i0 + 2];
                p1x = vertexData[i1];
                p1y = vertexData[i1 + 1];
                p1z = vertexData[i1 + 2];
                p2x = vertexData[i2];
                p2y = vertexData[i2 + 1];
                p2z = vertexData[i2 + 2];

                //计算出三角面的法线
                s0x = p1x - p0x; // s0 = p1 - p0
                s0y = p1y - p0y;
                s0z = p1z - p0z;
                s1x = p2x - p0x; // s1 = p2 - p0
                s1y = p2y - p0y;
                s1z = p2z - p0z;
                nx = s0y * s1z - s0z * s1y; // n = s0 x s1
                ny = s0z * s1x - s0x * s1z;
                nz = s0x * s1y - s0y * s1x;
                nl = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz); // normalize n
                nx *= nl;
                ny *= nl;
                nz *= nl;

                //初始化射线数据
                var rayPosition: Vector3D = this.ray3D.position;
                var rayDirection: Vector3D = this.ray3D.direction;

                //计算射线与法线的点积，不等于零表示射线所在直线与三角面相交
                nDotV = nx * rayDirection.x + ny * +rayDirection.y + nz * rayDirection.z; // rayDirection . normal
                //判断射线是否与三角面相交
                if ((!bothSides && nDotV < 0.0) || (bothSides && nDotV != 0.0))
                { // an intersection must exist
                    //计算平面方程D值，参考Plane3D
                    D = -(nx * p0x + ny * p0y + nz * p0z);
                    //射线点到平面的距离
                    disToPlane = -(nx * rayPosition.x + ny * rayPosition.y + nz * rayPosition.z + D);
                    t = disToPlane / nDotV;
                    //得到交点
                    cx = rayPosition.x + t * rayDirection.x;
                    cy = rayPosition.y + t * rayDirection.y;
                    cz = rayPosition.z + t * rayDirection.z;
                    //判断交点是否在三角形内( using barycentric coordinates )
                    Q1Q2 = s0x * s1x + s0y * s1y + s0z * s1z;
                    Q1Q1 = s0x * s0x + s0y * s0y + s0z * s0z;
                    Q2Q2 = s1x * s1x + s1y * s1y + s1z * s1z;
                    rx = cx - p0x;
                    ry = cy - p0y;
                    rz = cz - p0z;
                    RQ1 = rx * s0x + ry * s0y + rz * s0z;
                    RQ2 = rx * s1x + ry * s1y + rz * s1z;
                    coeff = 1 / (Q1Q1 * Q2Q2 - Q1Q2 * Q1Q2);
                    v = coeff * (Q2Q2 * RQ1 - Q1Q2 * RQ2);
                    w = coeff * (-Q1Q2 * RQ1 + Q1Q1 * RQ2);
                    if (v < 0)
                        continue;
                    if (w < 0)
                        continue;
                    u = 1 - v - w;
                    //u v w都大于0表示点在三角形内 射线的坐标t大于0表示射线朝向三角面
                    if (!(u < 0) && t > 0 && t < shortestCollisionDistance)
                    {
                        shortestCollisionDistance = t;
                        collisionTriangleIndex = index / 3;
                        pickingCollisionVO.rayEntryDistance = t;
                        pickingCollisionVO.localPosition = new Vector3D(cx, cy, cz);
                        pickingCollisionVO.localNormal = new Vector3D(nx, ny, nz);
                        pickingCollisionVO.uv = this.getCollisionUV(indexData, uvData, index, v, w, u, 0, uvStride);
                        pickingCollisionVO.index = index;

                        //是否继续寻找最优解
                        if (!this._findClosestCollision)
                            return true;
                    }
                }
            }

            if (collisionTriangleIndex >= 0)
                return true;

            return false;
        }


		/**
		 * 获取碰撞法线
		 * @param indexData 顶点索引数据
		 * @param vertexData 顶点数据
		 * @param triangleIndex 三角形索引
		 * @param normal 碰撞法线
		 * @return 碰撞法线
		 *
		 */
        protected getCollisionNormal(indexData: number[], vertexData: number[], triangleIndex = 0, normal: Vector3D = null): Vector3D
        {
            var i0: number = indexData[triangleIndex] * 3;
            var i1: number = indexData[triangleIndex + 1] * 3;
            var i2: number = indexData[triangleIndex + 2] * 3;

            var side0x: number = vertexData[i1] - vertexData[i0];
            var side0y: number = vertexData[i1 + 1] - vertexData[i0 + 1];
            var side0z: number = vertexData[i1 + 2] - vertexData[i0 + 2];
            var side1x: number = vertexData[i2] - vertexData[i0];
            var side1y: number = vertexData[i2 + 1] - vertexData[i0 + 1];
            var side1z: number = vertexData[i2 + 2] - vertexData[i0 + 2];

            if (!normal)
                normal = new Vector3D();
            normal.x = side0y * side1z - side0z * side1y;
            normal.y = side0z * side1x - side0x * side1z;
            normal.z = side0x * side1y - side0y * side1x;
            normal.w = 1;
            normal.normalize();
            return normal;
        }

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
        protected getCollisionUV(indexData: Uint16Array, uvData: Float32Array, triangleIndex: number, v: number, w: number, u: number, uvOffset: number, uvStride: number, uv: Point = null): Point
        {
            var uIndex: number = indexData[triangleIndex] * uvStride + uvOffset;
            var uv0x: number = uvData[uIndex];
            var uv0y: number = uvData[uIndex + 1];
            uIndex = indexData[triangleIndex + 1] * uvStride + uvOffset;
            var uv1x: number = uvData[uIndex];
            var uv1y: number = uvData[uIndex + 1];
            uIndex = indexData[triangleIndex + 2] * uvStride + uvOffset;
            var uv2x: number = uvData[uIndex];
            var uv2y: number = uvData[uIndex + 1];
            if (!uv)
                uv = new Point();
            uv.x = u * uv0x + v * uv1x + w * uv2x;
            uv.y = u * uv0y + v * uv1y + w * uv2y;
            return uv;
        }

		/**
		 * 设置碰撞射线
		 */
        public setLocalRay(ray3D: Ray3D)
        {
            this.ray3D = ray3D;
        }
    }
}
