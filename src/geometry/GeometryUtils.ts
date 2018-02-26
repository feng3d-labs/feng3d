namespace feng3d
{
    export var GeometryUtils = {
        createIndices: createIndices,
        createUVs: createUVs,
        createVertexNormals: createVertexNormals,
        createVertexTangents: createVertexTangents,
    }

    function createIndices(positions: number[]): Array<number>
    {
        var vertexNum = positions.length / 3;
        var indices: number[] = [];
        for (var i = 0; i < vertexNum; i++)
        {
            indices[i] = i;
        }
        return indices;
    }

    function createUVs(positions: number[]): Array<number>
    {
        var idx = 0, uvIdx = 0;
        var stride = 2;
        var target = new Array<number>();
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

    function createVertexNormals(indices: number[] | Uint16Array, positions: number[], useFaceWeights = false)
    {
        var faceNormalsResult = createFaceNormals(indices, positions, useFaceWeights);
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

    function createVertexTangents(indices: number[] | Uint16Array, positions: number[], uvs: number[], useFaceWeights = false): Array<number>
    {
        var faceTangentsResult = createFaceTangents(indices, positions, uvs, useFaceWeights);
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

    function createFaceTangents(indices: number[] | Uint16Array, positions: number[], uvs: number[], useFaceWeights = false)
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

    function createFaceNormals(indices: number[] | Uint16Array, positions: number[], useFaceWeights = false)
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
}