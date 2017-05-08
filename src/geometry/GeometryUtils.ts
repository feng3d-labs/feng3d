module feng3d
{
    export class GeometryUtils
    {
        public static createFaceNormals(indices: number[] | Uint16Array, positions: number[] | Float32Array, useFaceWeights = false)
        {
            var i: number = 0, j: number = 0, k: number = 0;
            var index: number = 0;
            var len: number = indices.length;
            var x1: number = 0, x2: number = 0, x3: number = 0;
            var y1: number = 0, y2: number = 0, y3: number = 0;
            var z1: number = 0, z2: number = 0, z3: number = 0;
            var dx1: number = 0, dy1: number = 0, dz1: number = 0;
            var dx2: number = 0, dy2: number = 0, dz2: number = 0;
            var cx: number = 0, cy: number = 0, cz: number = 0;
            var d: number = 0;
            var posStride: number = 3;
            var faceNormals = new Array<number>(len);
            if (useFaceWeights)
                var faceWeights = new Array<number>(len / 3);
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
                    var w: number = d * 10000;
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

        public static createVertexNormals(_indices: number[] | Uint16Array, positions: number[] | Float32Array, useFaceWeights = false)
        {
            var faceNormalsResult = GeometryUtils.createFaceNormals(_indices, positions, useFaceWeights);
            var faceWeights = faceNormalsResult.faceWeights;
            var faceNormals = faceNormalsResult.faceNormals;

            var v1: number = 0;
            var f1: number = 0, f2: number = 1, f3: number = 2;
            var lenV: number = positions.length;
            var normalStride: number = 3;
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
            var i: number = 0, k: number = 0;
            var lenI: number = _indices.length;
            var index: number = 0;
            var weight: number = 0;
            while (i < lenI)
            {
                weight = useFaceWeights ? faceWeights[k++] : 1;
                index = normalOffset + _indices[i++] * normalStride;
                normals[index++] += faceNormals[f1] * weight;
                normals[index++] += faceNormals[f2] * weight;
                normals[index] += faceNormals[f3] * weight;
                index = normalOffset + _indices[i++] * normalStride;
                normals[index++] += faceNormals[f1] * weight;
                normals[index++] += faceNormals[f2] * weight;
                normals[index] += faceNormals[f3] * weight;
                index = normalOffset + _indices[i++] * normalStride;
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
                var vx: number = normals[v1];
                var vy: number = normals[v1 + 1];
                var vz: number = normals[v1 + 2];
                var d: number = 1.0 / Math.sqrt(vx * vx + vy * vy + vz * vz);
                normals[v1] = vx * d;
                normals[v1 + 1] = vy * d;
                normals[v1 + 2] = vz * d;
                v1 += normalStride;
            }
            return normals;
        }

        public static createVertexTangents(indices: number[] | Uint16Array, positions: number[] | Float32Array, uvs: number[] | Float32Array, _useFaceWeights = false): Array<number>
        {
            var faceTangentsResult = GeometryUtils.createFaceTangents(indices, positions, uvs);
            var faceWeights = faceTangentsResult.faceWeights;
            var faceTangents = faceTangentsResult.faceTangents;

            var i: number = 0;
            var lenV: number = positions.length;
            var tangentStride: number = 3;
            var tangentOffset: number = 0;
            var target = new Array<number>(lenV);
            i = tangentOffset;
            while (i < lenV)
            {
                target[i] = 0.0;
                target[i + 1] = 0.0;
                target[i + 2] = 0.0;
                i += tangentStride;
            }
            var k: number = 0;
            var lenI: number = indices.length;
            var index: number = 0;
            var weight: number = 0;
            var f1: number = 0, f2: number = 1, f3: number = 2;
            i = 0;
            while (i < lenI)
            {
                weight = _useFaceWeights ? faceWeights[k++] : 1;
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
                var vx: number = target[i];
                var vy: number = target[i + 1];
                var vz: number = target[i + 2];
                var d: number = 1.0 / Math.sqrt(vx * vx + vy * vy + vz * vz);
                target[i] = vx * d;
                target[i + 1] = vy * d;
                target[i + 2] = vz * d;
                i += tangentStride;
            }
            return target;
        }

        protected static createFaceTangents(indices: number[] | Uint16Array, positions: number[] | Float32Array, uvs: number[] | Float32Array, useFaceWeights = false)
        {
            var i: number = 0, k: number = 0;
            var index1: number = 0, index2: number = 0, index3: number = 0;
            var len: number = indices.length;
            var ui: number = 0, vi: number = 0;
            var v0: number = 0;
            var dv1: number = 0, dv2: number = 0;
            var denom: number = 0;
            var x0: number = 0, y0: number = 0, z0: number = 0;
            var dx1: number = 0, dy1: number = 0, dz1: number = 0;
            var dx2: number = 0, dy2: number = 0, dz2: number = 0;
            var cx: number = 0, cy: number = 0, cz: number = 0;
            var posStride: number = 3;
            var posOffset: number = 0;
            var texStride: number = 2;
            var texOffset: number = 0;
            var faceTangents = new Array<number>(indices.length);
            if (useFaceWeights)
                var faceWeights = new Array<number>(len / 3);
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
                    var w: number = denom * 10000;
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
    }
}