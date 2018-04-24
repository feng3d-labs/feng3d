namespace feng3d
{

	/**
	 * 使用纯计算与实体相交
	 */
    export var as3PickingCollider = {
        raycastGeometry: raycastGeometry,
    };

    /**
     * 射线投影几何体
     * @param geometry  几何体
     * @param ray       射线
     * @param shortestCollisionDistance     当前最短碰撞距离
     * @param bothSides     是否检测双面
     */
    function raycastGeometry(geometry: Geometry, ray: Ray3D, shortestCollisionDistance = 0, bothSides = true)
    {
        var indices = geometry.indices;
        var positions = geometry.positions;
        var uvs = geometry.uvs;

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

        var collisionTriangleIndex = -1;

        var numIndices = indices.length;

        var result: { rayEntryDistance: number, localPosition: Vector3, localNormal: Vector3, uv: Vector2, index: number } = <any>{};

        //遍历每个三角形 检测碰撞
        for (var index = 0; index < numIndices; index += 3)
        { // sweep all triangles
            //三角形三个顶点索引
            i0 = indices[index] * 3;
            i1 = indices[index + 1] * 3;
            i2 = indices[index + 2] * 3;

            //三角形三个顶点数据
            p0x = positions[i0];
            p0y = positions[i0 + 1];
            p0z = positions[i0 + 2];
            p1x = positions[i1];
            p1y = positions[i1 + 1];
            p1z = positions[i1 + 2];
            p2x = positions[i2];
            p2y = positions[i2 + 1];
            p2z = positions[i2 + 2];

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
            var rayPosition: Vector3 = ray.position;
            var rayDirection: Vector3 = ray.direction;

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
                    result.rayEntryDistance = t;
                    result.localPosition = new Vector3(cx, cy, cz);
                    result.localNormal = new Vector3(nx, ny, nz);
                    if (uvs)
                    {
                        result.uv = getCollisionUV(indices, uvs, index, v, w, u);
                    }
                    result.localNormal = getCollisionNormal(indices, positions, index);
                    result.index = index;
                }
            }
        }

        if (collisionTriangleIndex >= 0)
            return result;

        return null;
    }

    /**
     * 获取碰撞法线
     * @param indices 顶点索引数据
     * @param positions 顶点数据
     * @param triangleIndex 三角形索引
     * @return 碰撞法线
     */
    function getCollisionNormal(indices: number[], positions: number[], triangleIndex = 0): Vector3
    {
        var i0 = indices[triangleIndex] * 3;
        var i1 = indices[triangleIndex + 1] * 3;
        var i2 = indices[triangleIndex + 2] * 3;

        var side0x = positions[i1] - positions[i0];
        var side0y = positions[i1 + 1] - positions[i0 + 1];
        var side0z = positions[i1 + 2] - positions[i0 + 2];
        var side1x = positions[i2] - positions[i0];
        var side1y = positions[i2 + 1] - positions[i0 + 1];
        var side1z = positions[i2 + 2] - positions[i0 + 2];

        var normal = new Vector3();
        normal.x = side0y * side1z - side0z * side1y;
        normal.y = side0z * side1x - side0x * side1z;
        normal.z = side0x * side1y - side0y * side1x;
        normal.normalize();
        return normal;
    }

    /**
     * 获取碰撞uv
     * @param indices 顶点数据
     * @param uvs uv数据
     * @param triangleIndex 三角形所有
     * @param v
     * @param w
     * @param u
     * @param uvOffset
     * @param uvStride
     * @return 碰撞uv
     */
    function getCollisionUV(indices: number[], uvs: number[], triangleIndex: number, v: number, w: number, u: number): Vector2
    {
        var uIndex = indices[triangleIndex] * 2;
        var uv0x = uvs[uIndex];
        var uv0y = uvs[uIndex + 1];
        uIndex = indices[triangleIndex + 1] * 2;
        var uv1x = uvs[uIndex];
        var uv1y = uvs[uIndex + 1];
        uIndex = indices[triangleIndex + 2] * 2;
        var uv2x = uvs[uIndex];
        var uv2y = uvs[uIndex + 1];
        var uv = new Vector2();
        uv.x = u * uv0x + v * uv1x + w * uv2x;
        uv.y = u * uv0y + v * uv1y + w * uv2y;
        return uv;
    }
}