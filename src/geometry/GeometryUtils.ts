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
        createVertexNormals(indices: number[] | Uint16Array, positions: number[], useFaceWeights = false)
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
        createVertexTangents(indices: number[] | Uint16Array, positions: number[], uvs: number[], useFaceWeights = false)
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
        createFaceTangents(indices: number[] | Uint16Array, positions: number[], uvs: number[], useFaceWeights = false)
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
        createFaceNormals(indices: number[] | Uint16Array, positions: number[], useFaceWeights = false)
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
         * @param transform 变换矩阵
         * @param positions 顶点数据
         * @param normals 顶点法线数据
         * @param tangents 顶点切线数据
         */
        applyTransformation(transform: Matrix4x4, positions: number[], normals?: number[], tangents?: number[])
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
                invTranspose.copyFrom(transform);
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
                vector = transform.transformVector(vector);
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
                    vector = invTranspose.deltaTransformVector(vector);
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
                    vector = invTranspose.deltaTransformVector(vector);
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
            var result = Object.deepClone(geometry[0]);
            for (let i = 1; i < geometrys.length; i++)
            {
                var geometry = geometrys[i];
                var startIndex = result.positions.length / 3;
                geometry.indices.forEach(v => result.indices.push(v + startIndex));
                geometry.positions.forEach(v => result.positions.push(v));
                result.uvs && geometry.uvs.forEach(v => result.uvs.push(v));
                result.normals && geometry.normals.forEach(v => result.normals.push(v));
                result.tangents && geometry.tangents.forEach(v => result.tangents.push(v));
            }
            return result;
        }

    }

    geometryUtils = new GeometryUtils();
}