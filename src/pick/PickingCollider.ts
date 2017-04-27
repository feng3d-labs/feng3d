module feng3d
{
    export class AS3PickingCollider
    {
        protected rayPosition: Vector3D;
        protected rayDirection: Vector3D;
        private _findClosestCollision: boolean = false;

        public constructor(findClosestCollision: boolean = false)
        {
            this._findClosestCollision = findClosestCollision;
        }

        public testSubMeshCollision(subMesh: Model, pickingCollisionVO: PickingCollisionVO, shortestCollisionDistance: number): boolean
        {
            var geometry = subMesh.geometry;
            var indexData = geometry.getIndexData().indices;
            var vertexData = geometry.getVAData(GLAttribute.a_position).data;
            var uvData = geometry.getVAData(GLAttribute.a_uv).data;

            var t: number = 0;
            var i0: number = 0, i1: number = 0, i2: number = 0;
            var rx: number = 0, ry: number = 0, rz: number = 0;
            var nx: number = 0, ny: number = 0, nz: number = 0;
            var cx: number = 0, cy: number = 0, cz: number = 0;
            var coeff: number = 0, u: number = 0, v: number = 0, w: number = 0;
            var p0x: number = 0, p0y: number = 0, p0z: number = 0;
            var p1x: number = 0, p1y: number = 0, p1z: number = 0;
            var p2x: number = 0, p2y: number = 0, p2z: number = 0;
            var s0x: number = 0, s0y: number = 0, s0z: number = 0;
            var s1x: number = 0, s1y: number = 0, s1z: number = 0;
            var nl: number = 0, nDotV: number = 0, D: number = 0, disToPlane: number = 0;
            var Q1Q2: number = 0, Q1Q1: number = 0, Q2Q2: number = 0, RQ1: number = 0, RQ2: number = 0;
            var collisionTriangleIndex: number = -1;
            var bothSides: boolean = (subMesh.material && subMesh.material["bothSides"]);
            var vertexStride: number = 3;
            var vertexOffset: number = 0;
            var uvStride: number = 2;
            var uvOffset: number = 0;
            var numIndices: number = indexData.length;
            for (var index: number = 0; index < numIndices; index += 3)
            {
                i0 = vertexOffset + indexData[index] * vertexStride;
                i1 = vertexOffset + indexData[index + 1] * vertexStride;
                i2 = vertexOffset + indexData[index + 2] * vertexStride;
                p0x = vertexData[i0];
                p0y = vertexData[i0 + 1];
                p0z = vertexData[i0 + 2];
                p1x = vertexData[i1];
                p1y = vertexData[i1 + 1];
                p1z = vertexData[i1 + 2];
                p2x = vertexData[i2];
                p2y = vertexData[i2 + 1];
                p2z = vertexData[i2 + 2];
                s0x = p1x - p0x;
                s0y = p1y - p0y;
                s0z = p1z - p0z;
                s1x = p2x - p0x;
                s1y = p2y - p0y;
                s1z = p2z - p0z;
                nx = s0y * s1z - s0z * s1y;
                ny = s0z * s1x - s0x * s1z;
                nz = s0x * s1y - s0y * s1x;
                nl = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
                nx *= nl;
                ny *= nl;
                nz *= nl;
                nDotV = nx * this.rayDirection.x + ny * +this.rayDirection.y + nz * this.rayDirection.z;
                if ((<any>!bothSides && nDotV < 0.0) || (bothSides && nDotV != 0.0))
                {
                    D = -(nx * p0x + ny * p0y + nz * p0z);
                    disToPlane = -(nx * this.rayPosition.x + ny * this.rayPosition.y + nz * this.rayPosition.z + D);
                    t = disToPlane / nDotV;
                    cx = this.rayPosition.x + t * this.rayDirection.x;
                    cy = this.rayPosition.y + t * this.rayDirection.y;
                    cz = this.rayPosition.z + t * this.rayDirection.z;
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
                    if (<any>!(u < 0) && t > 0 && t < shortestCollisionDistance)
                    {
                        shortestCollisionDistance = t;
                        collisionTriangleIndex = ~~(index / 3);
                        pickingCollisionVO.rayEntryDistance = t;
                        pickingCollisionVO.localPosition = new Vector3D(cx, cy, cz);
                        pickingCollisionVO.localNormal = new Vector3D(nx, ny, nz);
                        pickingCollisionVO.uv = this.getCollisionUV(indexData, uvData, index, v, w, u, uvOffset, uvStride);
                        pickingCollisionVO.index = index;
                        if (<any>!this._findClosestCollision)
                            return true;
                    }
                }
            }
            if (collisionTriangleIndex >= 0)
                return true;
            return false;
        }

        protected getCollisionNormal(indexData: Array<number>, vertexData: Array<number>, triangleIndex: number, normal: Vector3D = null): Vector3D
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
            if (<any>!normal)
                normal = new Vector3D();
            normal["x"] = side0y * side1z - side0z * side1y;
            normal["y"] = side0z * side1x - side0x * side1z;
            normal["z"] = side0x * side1y - side0y * side1x;
            normal["w"] = 1;
            normal["normalize"]();
            return normal;
        }

        protected getCollisionUV(indexData: Uint16Array, uvData: Float32Array, triangleIndex: number, v: number, w: number, u: number, uvOffset: number, uvStride: number, uv: Point = null)
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
            if (<any>!uv)
                uv = new Point();
            uv.x = u * uv0x + v * uv1x + w * uv2x;
            uv.y = u * uv0y + v * uv1y + w * uv2y;
            return uv;
        }

        public setLocalRay(localPosition: Vector3D, localDirection: Vector3D)
        {
            this.rayPosition = localPosition;
            this.rayDirection = localDirection;
        }
    }
}