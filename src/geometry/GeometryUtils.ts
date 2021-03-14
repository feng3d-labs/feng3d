namespace feng3d
{
    export var geometryUtils: GeometryUtils;
    export class GeometryUtils 
    {
        /**
         * 根据顶点数量按顺序创建顶点索引
         * @param positions 顶点数据
         */
        createIndices(positions: number[])
        {
            var vertexNum = positions.length / 3;
            var indices: number[] = [];
            for (var i = 0; i < vertexNum; i++)
            {
                indices[i] = i;
            }
            return indices;
        }

        /**
         * 创建循环uv数据
         * @param positions 顶点数据
         */
        createUVs(positions: number[])
        {
            var idx = 0, uvIdx = 0;
            var target: number[] = [];
            var len = positions.length / 3 * 2;
            while (idx < len)
            {
                target[idx++] = uvIdx * .5;
                target[idx++] = 1.0 - (uvIdx & 1);
                if (++uvIdx == 3)
                    uvIdx = 0;
            }
            return target;
        }

        /**
         * 计算顶点法线数据
         * @param indices 顶点索引
         * @param positions 顶点数据
         * @param useFaceWeights 是否使用面权重计算法线
         */
        createVertexNormals(indices: number[], positions: number[], useFaceWeights = false)
        {
            var faceNormalsResult = this.createFaceNormals(indices, positions, useFaceWeights);
            var faceWeights = faceNormalsResult.faceWeights;
            var faceNormals = faceNormalsResult.faceNormals;

            var v1 = 0;
            var f1 = 0, f2 = 1, f3 = 2;
            var lenV = positions.length;
            var normalStride = 3;
            var normalOffset = 0;
            var normals = new Array<number>(lenV);
            v1 = 0;
            while (v1 < lenV)
            {
                normals[v1] = 0.0;
                normals[v1 + 1] = 0.0;
                normals[v1 + 2] = 0.0;
                v1 += normalStride;
            }
            var i = 0, k = 0;
            var lenI = indices.length;
            var index = 0;
            var weight = 0;
            while (i < lenI)
            {
                weight = useFaceWeights ? faceWeights[k++] : 1;
                index = normalOffset + indices[i++] * normalStride;
                normals[index++] += faceNormals[f1] * weight;
                normals[index++] += faceNormals[f2] * weight;
                normals[index] += faceNormals[f3] * weight;
                index = normalOffset + indices[i++] * normalStride;
                normals[index++] += faceNormals[f1] * weight;
                normals[index++] += faceNormals[f2] * weight;
                normals[index] += faceNormals[f3] * weight;
                index = normalOffset + indices[i++] * normalStride;
                normals[index++] += faceNormals[f1] * weight;
                normals[index++] += faceNormals[f2] * weight;
                normals[index] += faceNormals[f3] * weight;
                f1 += 3;
                f2 += 3;
                f3 += 3;
            }
            v1 = normalOffset;
            while (v1 < lenV)
            {
                var vx = normals[v1];
                var vy = normals[v1 + 1];
                var vz = normals[v1 + 2];
                var d = 1.0 / Math.sqrt(vx * vx + vy * vy + vz * vz);
                normals[v1] = vx * d;
                normals[v1 + 1] = vy * d;
                normals[v1 + 2] = vz * d;
                v1 += normalStride;
            }
            return normals;
        }

        /**
         * 计算顶点切线数据
         * @param indices 顶点索引
         * @param positions 顶点数据
         * @param uvs uv数据
         * @param useFaceWeights 是否使用面权重计算切线数据
         */
        createVertexTangents(indices: number[], positions: number[], uvs: number[], useFaceWeights = false)
        {
            var faceTangentsResult = this.createFaceTangents(indices, positions, uvs, useFaceWeights);
            var faceWeights = faceTangentsResult.faceWeights;
            var faceTangents = faceTangentsResult.faceTangents;

            var i = 0;
            var lenV = positions.length;
            var tangentStride = 3;
            var tangentOffset = 0;
            var target = new Array<number>(lenV);
            i = tangentOffset;
            while (i < lenV)
            {
                target[i] = 0.0;
                target[i + 1] = 0.0;
                target[i + 2] = 0.0;
                i += tangentStride;
            }
            var k = 0;
            var lenI = indices.length;
            var index = 0;
            var weight = 0;
            var f1 = 0, f2 = 1, f3 = 2;
            i = 0;
            while (i < lenI)
            {
                weight = useFaceWeights ? faceWeights[k++] : 1;
                index = tangentOffset + indices[i++] * tangentStride;
                target[index++] += faceTangents[f1] * weight;
                target[index++] += faceTangents[f2] * weight;
                target[index] += faceTangents[f3] * weight;
                index = tangentOffset + indices[i++] * tangentStride;
                target[index++] += faceTangents[f1] * weight;
                target[index++] += faceTangents[f2] * weight;
                target[index] += faceTangents[f3] * weight;
                index = tangentOffset + indices[i++] * tangentStride;
                target[index++] += faceTangents[f1] * weight;
                target[index++] += faceTangents[f2] * weight;
                target[index] += faceTangents[f3] * weight;
                f1 += 3;
                f2 += 3;
                f3 += 3;
            }
            i = tangentOffset;
            while (i < lenV)
            {
                var vx = target[i];
                var vy = target[i + 1];
                var vz = target[i + 2];
                var d = 1.0 / Math.sqrt(vx * vx + vy * vy + vz * vz);
                target[i] = vx * d;
                target[i + 1] = vy * d;
                target[i + 2] = vz * d;
                i += tangentStride;
            }
            return target;
        }

        /**
         * 计算面切线数据
         * @param indices 顶点索引数据
         * @param positions 顶点数据
         * @param uvs uv数据
         * @param useFaceWeights 是否计算面权重
         */
        createFaceTangents(indices: number[], positions: number[], uvs: number[], useFaceWeights = false)
        {
            var i = 0, k = 0;
            var index1 = 0, index2 = 0, index3 = 0;
            var len = indices.length;
            var ui = 0, vi = 0;
            var v0 = 0;
            var dv1 = 0, dv2 = 0;
            var denom = 0;
            var x0 = 0, y0 = 0, z0 = 0;
            var dx1 = 0, dy1 = 0, dz1 = 0;
            var dx2 = 0, dy2 = 0, dz2 = 0;
            var cx = 0, cy = 0, cz = 0;
            var posStride = 3;
            var posOffset = 0;
            var texStride = 2;
            var texOffset = 0;
            var faceTangents = new Array<number>(indices.length);
            var faceWeights: number[] = [];
            while (i < len)
            {
                index1 = indices[i];
                index2 = indices[i + 1];
                index3 = indices[i + 2];
                ui = texOffset + index1 * texStride + 1;
                v0 = uvs[ui];
                ui = texOffset + index2 * texStride + 1;
                dv1 = uvs[ui] - v0;
                ui = texOffset + index3 * texStride + 1;
                dv2 = uvs[ui] - v0;
                vi = posOffset + index1 * posStride;
                x0 = positions[vi];
                y0 = positions[vi + 1];
                z0 = positions[vi + 2];
                vi = posOffset + index2 * posStride;
                dx1 = positions[vi] - x0;
                dy1 = positions[vi + 1] - y0;
                dz1 = positions[vi + 2] - z0;
                vi = posOffset + index3 * posStride;
                dx2 = positions[vi] - x0;
                dy2 = positions[vi + 1] - y0;
                dz2 = positions[vi + 2] - z0;
                cx = dv2 * dx1 - dv1 * dx2;
                cy = dv2 * dy1 - dv1 * dy2;
                cz = dv2 * dz1 - dv1 * dz2;
                denom = Math.sqrt(cx * cx + cy * cy + cz * cz);
                if (useFaceWeights)
                {
                    var w = denom * 10000;
                    if (w < 1)
                        w = 1;
                    faceWeights[k++] = w;
                }
                denom = 1 / denom;
                faceTangents[i++] = denom * cx;
                faceTangents[i++] = denom * cy;
                faceTangents[i++] = denom * cz;
            }
            return { faceTangents: faceTangents, faceWeights: faceWeights };
        }

        /**
         * 计算面法线数据
         * @param indices 顶点索引数据
         * @param positions 顶点数据
         * @param useFaceWeights 是否计算面权重
         */
        createFaceNormals(indices: number[], positions: number[], useFaceWeights = false)
        {
            var i = 0, j = 0, k = 0;
            var index = 0;
            var len = indices.length;
            var x1 = 0, x2 = 0, x3 = 0;
            var y1 = 0, y2 = 0, y3 = 0;
            var z1 = 0, z2 = 0, z3 = 0;
            var dx1 = 0, dy1 = 0, dz1 = 0;
            var dx2 = 0, dy2 = 0, dz2 = 0;
            var cx = 0, cy = 0, cz = 0;
            var d = 0;
            var posStride = 3;
            var faceNormals = new Array<number>(len);
            var faceWeights: number[] = [];
            while (i < len)
            {
                index = indices[i++] * posStride;
                x1 = positions[index];
                y1 = positions[index + 1];
                z1 = positions[index + 2];
                index = indices[i++] * posStride;
                x2 = positions[index];
                y2 = positions[index + 1];
                z2 = positions[index + 2];
                index = indices[i++] * posStride;
                x3 = positions[index];
                y3 = positions[index + 1];
                z3 = positions[index + 2];
                dx1 = x3 - x1;
                dy1 = y3 - y1;
                dz1 = z3 - z1;
                dx2 = x2 - x1;
                dy2 = y2 - y1;
                dz2 = z2 - z1;
                cx = dz1 * dy2 - dy1 * dz2;
                cy = dx1 * dz2 - dz1 * dx2;
                cz = dy1 * dx2 - dx1 * dy2;
                d = Math.sqrt(cx * cx + cy * cy + cz * cz);
                if (useFaceWeights)
                {
                    var w = d * 10000;
                    if (w < 1)
                        w = 1;
                    faceWeights[k++] = w;
                }
                d = 1 / d;
                faceNormals[j++] = cx * d;
                faceNormals[j++] = cy * d;
                faceNormals[j++] = cz * d;
            }
            return { faceNormals: faceNormals, faceWeights: faceWeights };
        }

        /**
         * 应用变换矩阵
         * @param matrix 变换矩阵
         * @param positions 顶点数据
         * @param normals 顶点法线数据
         * @param tangents 顶点切线数据
         */
        applyTransformation(matrix: Matrix4x4, positions: number[], normals?: number[], tangents?: number[])
        {
            var posStride = 3;
            var normalStride = 3;
            var tangentStride = 3;

            var len = positions.length / posStride;
            var i: number, i1: number, i2: number;
            var vector = new Vector3();

            var bakeNormals = normals != null;
            var bakeTangents = tangents != null;
            var invTranspose = new Matrix4x4();

            if (bakeNormals || bakeTangents)
            {
                invTranspose.copy(matrix);
                invTranspose.invert();
                invTranspose.transpose();
            }

            var vi0 = 0;
            var ni0 = 0;
            var ti0 = 0;

            for (i = 0; i < len; ++i)
            {
                i1 = vi0 + 1;
                i2 = vi0 + 2;

                // bake position
                vector.x = positions[vi0];
                vector.y = positions[i1];
                vector.z = positions[i2];
                vector = matrix.transformPoint3(vector);
                positions[vi0] = vector.x;
                positions[i1] = vector.y;
                positions[i2] = vector.z;
                vi0 += posStride;

                // bake normal
                if (bakeNormals)
                {
                    i1 = ni0 + 1;
                    i2 = ni0 + 2;
                    vector.x = normals[ni0];
                    vector.y = normals[i1];
                    vector.z = normals[i2];
                    vector = invTranspose.transformVector3(vector);
                    vector.normalize();
                    normals[ni0] = vector.x;
                    normals[i1] = vector.y;
                    normals[i2] = vector.z;
                    ni0 += normalStride;
                }

                // bake tangent
                if (bakeTangents)
                {
                    i1 = ti0 + 1;
                    i2 = ti0 + 2;
                    vector.x = tangents[ti0];
                    vector.y = tangents[i1];
                    vector.z = tangents[i2];
                    vector = invTranspose.transformVector3(vector);
                    vector.normalize();
                    tangents[ti0] = vector.x;
                    tangents[i1] = vector.y;
                    tangents[i2] = vector.z;
                    ti0 += tangentStride;
                }
            }
        }

        /**
         * 合并几何体
         * @param geometrys 几何体列表
         */
        mergeGeometry(geometrys: { indices: number[], positions: number[], uvs?: number[], normals?: number[], tangents?: number[] }[])
        {
            // 此处存在隐患。
            // 优化方案，遍历所有几何体，找到所有共有属性后进行合并。
            var result: { indices: number[], positions: number[], uvs?: number[], normals?: number[], tangents?: number[] } = <any>{};
            for (let i = 0; i < geometrys.length; i++)
            {
                var geometry = geometrys[i];
                if (i == 0)
                {
                    result.indices = geometry.indices.concat();
                    result.positions = geometry.positions.concat();
                    geometry.uvs && (result.uvs = geometry.uvs.concat());
                    geometry.normals && (result.normals = geometry.normals.concat());
                    geometry.tangents && (result.tangents = geometry.tangents.concat());
                } else
                {
                    var startIndex = result.positions.length / 3;
                    geometry.indices.forEach(v => result.indices.push(v + startIndex));
                    geometry.positions.forEach(v => result.positions.push(v));
                    result.uvs && geometry.uvs.forEach(v => result.uvs.push(v));
                    result.normals && geometry.normals.forEach(v => result.normals.push(v));
                    result.tangents && geometry.tangents.forEach(v => result.tangents.push(v));
                }
            }
            return result;
        }

        /**
         * 射线投影几何体
         * @param ray                           射线
         * @param shortestCollisionDistance     当前最短碰撞距离
         * @param cullFace                      裁剪面枚举
         * 
         * @todo
         * @see 3D数学基础：图形与游戏开发 P278 是否可用该内容优化运算效率？
         * 
         * @see 优化参考 three.js Ray.intersectTriangle
         */
        raycast(ray: Ray3, indices: number[], positions: number[], uvs: number[], shortestCollisionDistance = Number.MAX_VALUE, cullFace = CullFace.NONE)
        {
            if (cullFace == CullFace.FRONT_AND_BACK) return null;

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
                nl = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz); // normalize n 此处使用了开平方根，性能很差
                nx *= nl;
                ny *= nl;
                nz *= nl;

                //初始化射线数据
                var rayPosition: Vector3 = ray.origin;
                var rayDirection: Vector3 = ray.direction;

                //计算射线与法线的点积，不等于零表示射线所在直线与三角面相交
                nDotV = nx * rayDirection.x + ny * rayDirection.y + nz * rayDirection.z; // rayDirection . normal
                //判断射线是否与三角面相交
                if ((cullFace == CullFace.FRONT && nDotV > 0.0) || (cullFace == CullFace.BACK && nDotV < 0.0) || (cullFace == CullFace.NONE && nDotV != 0.0))
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
                    if (v < 0)
                        continue;
                    w = coeff * (-Q1Q2 * RQ1 + Q1Q1 * RQ2);
                    if (w < 0)
                        continue;
                    u = 1 - v - w;
                    //u v w都大于0表示点在三角形内 射线的坐标t大于0表示射线朝向三角面
                    if (u >= 0 && t >= 0 && t < shortestCollisionDistance)
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
                        result.index = index;
                    }
                }
            }

            if (collisionTriangleIndex >= 0)
                return result;

            return null;

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
            function getCollisionUV(indices: number[], uvs: number[], triangleIndex: number, v: number, w: number, u: number)
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

        /**
         * 获取包围盒
         * @param positions 顶点数据
         */
        getAABB(positions: number[])
        {
            return Box3.formPositions(positions);
        }

    }

    geometryUtils = new GeometryUtils();
}