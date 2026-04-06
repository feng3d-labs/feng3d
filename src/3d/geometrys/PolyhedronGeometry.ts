import { Vector2 } from '../../math/geom/Vector2';
import { Vector3 } from '../../math/geom/Vector3';
import { Geometry } from '../geometrys/Geometry';
import { geometryUtils } from '../geometrys/GeometryUtils';

export interface IPolyhedronGeometry
{
    /**
     * 顶点坐标数据
     */
    vertices: number[];

    /**
     * 索引数据
     */
    indices: number[];

    /**
     * 半径
     */
    radius: number;

    /**
     * 细节程度
     */
    detail: number;
}

/**
 * 多面体
 *
 * @see https://github.com/mrdoob/three.js/blob/dev/src/geometries/PolyhedronGeometry.js
 */
export class PolyhedronGeometry extends Geometry
{
    /**
     * 构建多面体
     *
     * @param vertices 顶点坐标数据
     * @param indices 索引数据
     * @param radius 半径
     * @param detail 细节程度
     */
    constructor(vertices: number[] = [], indices: number[] = [], radius = 1, detail = 0)
    {
        super();
        const { positions, normals, uvs } = PolyhedronGeometry.buildGeometry({ vertices, indices, radius, detail });

        const _indices = geometryUtils.createIndices(positions);

        const tangents = geometryUtils.createVertexTangents(_indices, positions, uvs);

        this.indexBuffer = { array: _indices };
        this.attributes.a_position = { array: positions, itemSize: 3 };
        this.attributes.a_normal = { array: normals, itemSize: 3 };
        this.attributes.a_tangent = { array: tangents, itemSize: 3 };
        this.attributes.a_uv = { array: uvs, itemSize: 2 };
    }

    /**
     * 构建几何体数据
     */
    static buildGeometry({ vertices, indices, radius, detail }: IPolyhedronGeometry)
    {
        // default buffer data
        const positions: number[] = [];
        const uvs: number[] = [];

        // the subdivision creates the vertex buffer data
        subdivide(detail);

        // all vertices should lie on a conceptual sphere with a given radius
        applyRadius(radius);

        // finally, create the uv data
        generateUVs();

        let normals = positions.concat();
        if (detail === 0)
        {
            normals = geometryUtils.createVertexNormals(indices, positions); // flat normals
        }
        else
        {
            geometryUtils.normalizeNormals(normals); // smooth normals
        }

        // build non-indexed geometry
        return { positions, normals, uvs };

        // helper functions
        function subdivide(detail: number)
        {
            const a = new Vector3();
            const b = new Vector3();
            const c = new Vector3();

            // iterate over all faces and apply a subdivison with the given detail value

            for (let i = 0; i < indices.length; i += 3)
            {
                // get the vertices of the face

                getVertexByIndex(indices[i + 0], a);
                getVertexByIndex(indices[i + 1], b);
                getVertexByIndex(indices[i + 2], c);

                // perform subdivision

                subdivideFace(a, b, c, detail);
            }
        }

        function subdivideFace(a: Vector3, b: Vector3, c: Vector3, detail: number)
        {
            const cols = detail + 1;

            // we use this multidimensional array as a data structure for creating the subdivision

            const v = [];

            // construct all of the vertices for this subdivision

            for (let i = 0; i <= cols; i++)
            {
                v[i] = [];

                const aj = a.clone().lerpNumber(c, i / cols);
                const bj = b.clone().lerpNumber(c, i / cols);

                const rows = cols - i;

                for (let j = 0; j <= rows; j++)
                {
                    if (j === 0 && i === cols)
                    {
                        v[i][j] = aj;
                    }
                    else
                    {
                        v[i][j] = aj.clone().lerpNumber(bj, j / rows);
                    }
                }
            }

            // construct all of the faces
            for (let i = 0; i < cols; i++)
            {
                for (let j = 0; j < 2 * (cols - i) - 1; j++)
                {
                    const k = Math.floor(j / 2);

                    if (j % 2 === 0)
                    {
                        pushVertex(v[i][k + 1]);
                        pushVertex(v[i + 1][k]);
                        pushVertex(v[i][k]);
                    }
                    else
                    {
                        pushVertex(v[i][k + 1]);
                        pushVertex(v[i + 1][k + 1]);
                        pushVertex(v[i + 1][k]);
                    }
                }
            }
        }

        function applyRadius(radius: number)
        {
            const vertex = new Vector3();

            // iterate over the entire buffer and apply the radius to each vertex

            for (let i = 0; i < positions.length; i += 3)
            {
                vertex.x = positions[i + 0];
                vertex.y = positions[i + 1];
                vertex.z = positions[i + 2];

                vertex.normalize().scaleNumber(radius);

                positions[i + 0] = vertex.x;
                positions[i + 1] = vertex.y;
                positions[i + 2] = vertex.z;
            }
        }

        function generateUVs()
        {
            const vertex = new Vector3();

            for (let i = 0; i < positions.length; i += 3)
            {
                vertex.x = positions[i + 0];
                vertex.y = positions[i + 1];
                vertex.z = positions[i + 2];

                const u = azimuth(vertex) / 2 / Math.PI + 0.5;
                const v = inclination(vertex) / Math.PI + 0.5;
                uvs.push(u, 1 - v);
            }

            correctUVs();

            correctSeam();
        }

        function correctSeam()
        {
            // handle case when face straddles the seam, see #3269

            for (let i = 0; i < uvs.length; i += 6)
            {
                // uv data of a single face

                const x0 = uvs[i + 0];
                const x1 = uvs[i + 2];
                const x2 = uvs[i + 4];

                const max = Math.max(x0, x1, x2);
                const min = Math.min(x0, x1, x2);

                // 0.9 is somewhat arbitrary

                if (max > 0.9 && min < 0.1)
                {
                    if (x0 < 0.2) uvs[i + 0] += 1;
                    if (x1 < 0.2) uvs[i + 2] += 1;
                    if (x2 < 0.2) uvs[i + 4] += 1;
                }
            }
        }

        function pushVertex(vertex: { x: number; y: number; z: number; })
        {
            positions.push(vertex.x, vertex.y, vertex.z);
        }

        function getVertexByIndex(index: number, vertex: Vector3)
        {
            const stride = index * 3;

            vertex.x = vertices[stride + 0];
            vertex.y = vertices[stride + 1];
            vertex.z = vertices[stride + 2];
        }

        function correctUVs()
        {
            const a = new Vector3();
            const b = new Vector3();
            const c = new Vector3();

            const centroid = new Vector3();

            const uvA = new Vector2();
            const uvB = new Vector2();
            const uvC = new Vector2();

            for (let i = 0, j = 0; i < positions.length; i += 9, j += 6)
            {
                a.set(positions[i + 0], positions[i + 1], positions[i + 2]);
                b.set(positions[i + 3], positions[i + 4], positions[i + 5]);
                c.set(positions[i + 6], positions[i + 7], positions[i + 8]);

                uvA.set(uvs[j + 0], uvs[j + 1]);
                uvB.set(uvs[j + 2], uvs[j + 3]);
                uvC.set(uvs[j + 4], uvs[j + 5]);

                centroid.copy(a).add(b).add(c).scaleNumber(3);

                const azi = azimuth(centroid);

                correctUV(uvA, j + 0, a, azi);
                correctUV(uvB, j + 2, b, azi);
                correctUV(uvC, j + 4, c, azi);
            }
        }

        function correctUV(uv: Vector2, stride: number, vector: Vector3, azimuth: number)
        {
            if ((azimuth < 0) && (uv.x === 1))
            {
                uvs[stride] = uv.x - 1;
            }

            if ((vector.x === 0) && (vector.z === 0))
            {
                uvs[stride] = azimuth / 2 / Math.PI + 0.5;
            }
        }

        // Angle around the Y axis, counter-clockwise when looking from above.
        function azimuth(vector: Vector3)
        {
            return Math.atan2(vector.z, -vector.x);
        }

        // Angle above the XZ plane.
        function inclination(vector: Vector3)
        {
            return Math.atan2(-vector.y, Math.sqrt((vector.x * vector.x) + (vector.z * vector.z)));
        }
    }
}
