module feng3d
{


    export class GeometryUtils
    {
        public static createFaceNormals(_indices: number[], vertices: number[], _useFaceWeights = false)
        {
            var i: number = 0, j: number = 0, k: number = 0;
            var index: number = 0;
            var len: number = _indices.length;
            var x1: number = 0, x2: number = 0, x3: number = 0;
            var y1: number = 0, y2: number = 0, y3: number = 0;
            var z1: number = 0, z2: number = 0, z3: number = 0;
            var dx1: number = 0, dy1: number = 0, dz1: number = 0;
            var dx2: number = 0, dy2: number = 0, dz2: number = 0;
            var cx: number = 0, cy: number = 0, cz: number = 0;
            var d: number = 0;
            var posStride: number = 3;
            var _faceNormals = new Array<number>(len);
            if (_useFaceWeights)
                var _faceWeights = new Array<number>(len / 3);
            while (i < len)
            {
                index = _indices[i++] * posStride;
                x1 = vertices[index];
                y1 = vertices[index + 1];
                z1 = vertices[index + 2];
                index = _indices[i++] * posStride;
                x2 = vertices[index];
                y2 = vertices[index + 1];
                z2 = vertices[index + 2];
                index = _indices[i++] * posStride;
                x3 = vertices[index];
                y3 = vertices[index + 1];
                z3 = vertices[index + 2];
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
                if (_useFaceWeights)
                {
                    var w: number = d * 10000;
                    if (w < 1)
                        w = 1;
                    _faceWeights[k++] = w;
                }
                d = 1 / d;
                _faceNormals[j++] = cx * d;
                _faceNormals[j++] = cy * d;
                _faceNormals[j++] = cz * d;
            }
            return { faceNormals: _faceNormals, faceWeights: _faceWeights };
        }

        public static createVertexNormals(_indices: number[], vertices: number[], _useFaceWeights = false)
        {
            var faceNormalsResult = GeometryUtils.createFaceNormals(_indices, vertices, _useFaceWeights);
            var _faceWeights = faceNormalsResult.faceWeights;
            var _faceNormals = faceNormalsResult.faceNormals;

            var v1: number = 0;
            var f1: number = 0, f2: number = 1, f3: number = 2;
            var lenV: number = vertices.length;
            var normalStride: number = 3;
            var normalOffset = 0;
            var normals = new Float32Array(lenV);
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
                weight = _useFaceWeights ? _faceWeights[k++] : 1;
                index = normalOffset + _indices[i++] * normalStride;
                normals[index++] += _faceNormals[f1] * weight;
                normals[index++] += _faceNormals[f2] * weight;
                normals[index] += _faceNormals[f3] * weight;
                index = normalOffset + _indices[i++] * normalStride;
                normals[index++] += _faceNormals[f1] * weight;
                normals[index++] += _faceNormals[f2] * weight;
                normals[index] += _faceNormals[f3] * weight;
                index = normalOffset + _indices[i++] * normalStride;
                normals[index++] += _faceNormals[f1] * weight;
                normals[index++] += _faceNormals[f2] * weight;
                normals[index] += _faceNormals[f3] * weight;
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
    }
}