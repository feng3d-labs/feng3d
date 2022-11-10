import { Vector2, Vector3 } from '@feng3d/math';
import { gPartial, mathUtil } from '@feng3d/polyfill';
import { decoratorRegisterClass } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { Object3D } from '../core/Object3D';
import { Geometry } from '../geometry/Geometry';
import { geometryUtils } from '../geometry/GeometryUtils';

declare global
{
    export interface MixinsGeometryTypes
    {
        LatheGeometry: LatheGeometry
    }

    export interface MixinsDefaultGeometry
    {
        Lathe: LatheGeometry;
    }

    export interface MixinsPrimitiveObject3D
    {
        Lathe: Object3D;
    }
}

/**
 * 旋转造型
 *
 * @see https://github.com/mrdoob/three.js/blob/dev/src/geometries/LatheGeometry.js
 */
@decoratorRegisterClass()
export class LatheGeometry extends Geometry
{
    __class__: 'LatheGeometry' = 'LatheGeometry';

    points = [new Vector2(0, -0.5), new Vector2(0.5, 0), new Vector2(0, 0.5)];
    segments = 12;
    phiStart = 0;
    phiLength = Math.PI * 2;

    constructor(param?: gPartial<LatheGeometry>)
    {
        super();
        Object.assign(this, param);
        watcher.watch(this as LatheGeometry, 'points', this.invalidateGeometry, this);
        watcher.watch(this as LatheGeometry, 'segments', this.invalidateGeometry, this);
        watcher.watch(this as LatheGeometry, 'phiStart', this.invalidateGeometry, this);
        watcher.watch(this as LatheGeometry, 'phiLength', this.invalidateGeometry, this);
    }

    /**
     * 构建几何体数据
     */
    protected buildGeometry()
    {
        const { indices, positions, uvs, normals } = LatheGeometry.buildGeometry(this);

        const tangents = geometryUtils.createVertexTangents(indices, positions, uvs);

        this.indexBuffer = { array: indices };
        this.attributes.a_position = { array: positions, itemSize: 3 };
        this.attributes.a_normal = { array: normals, itemSize: 3 };
        this.attributes.a_tangent = { array: tangents, itemSize: 3 };
        this.attributes.a_uv = { array: uvs, itemSize: 2 };
    }

    /**
     * 构建几何体数据
     */
    static buildGeometry({ points, segments, phiStart, phiLength }: LatheGeometry)
    {
        segments = Math.floor(segments);

        // clamp phiLength so it's in range of [ 0, 2PI ]
        phiLength = mathUtil.clamp(phiLength, 0, Math.PI * 2);

        // buffers
        const indices = [];
        const positions = [];
        const uvs = [];
        const initNormals = [];
        const normals = [];

        // helper variables
        const inverseSegments = 1.0 / segments;
        const vertex = new Vector3();
        const uv = new Vector2();
        const normal = new Vector3();
        const curNormal = new Vector3();
        const prevNormal = new Vector3();
        let dx = 0;
        let dy = 0;

        // pre-compute normals for initial "meridian"
        for (let j = 0; j <= (points.length - 1); j++)
        {
            switch (j)
            {
                case 0:				// special handling for 1st vertex on path
                    dx = points[j + 1].x - points[j].x;
                    dy = points[j + 1].y - points[j].y;

                    normal.x = Number(dy);
                    normal.y = -dx;
                    normal.z = dy * 0.0;

                    prevNormal.copy(normal);

                    normal.normalize();

                    initNormals.push(normal.x, normal.y, normal.z);
                    break;

                case (points.length - 1):	// special handling for last Vertex on path
                    initNormals.push(prevNormal.x, prevNormal.y, prevNormal.z);
                    break;

                default:			// default handling for all vertices in between
                    dx = points[j + 1].x - points[j].x;
                    dy = points[j + 1].y - points[j].y;

                    normal.x = Number(dy);
                    normal.y = -dx;
                    normal.z = dy * 0.0;

                    curNormal.copy(normal);

                    normal.x += prevNormal.x;
                    normal.y += prevNormal.y;
                    normal.z += prevNormal.z;

                    normal.normalize();

                    initNormals.push(normal.x, normal.y, normal.z);

                    prevNormal.copy(curNormal);
            }
        }

        // generate vertices, uvs and normals
        for (let i = 0; i <= segments; i++)
        {
            const phi = phiStart + i * inverseSegments * phiLength;

            const sin = Math.sin(phi);
            const cos = Math.cos(phi);

            for (let j = 0; j <= (points.length - 1); j++)
            {
                // vertex
                vertex.x = points[j].x * sin;
                vertex.y = points[j].y;
                vertex.z = points[j].x * cos;

                positions.push(vertex.x, vertex.y, vertex.z);

                // uv
                uv.x = i / segments;
                uv.y = j / (points.length - 1);

                uvs.push(uv.x, uv.y);

                // normal
                const x = initNormals[3 * j + 0] * sin;
                const y = initNormals[3 * j + 1];
                const z = initNormals[3 * j + 0] * cos;

                normals.push(x, y, z);
            }
        }

        // indices
        for (let i = 0; i < segments; i++)
        {
            for (let j = 0; j < (points.length - 1); j++)
            {
                const base = j + i * points.length;

                const a = base;
                const b = base + points.length;
                const c = base + points.length + 1;
                const d = base + 1;

                // faces
                indices.push(a, b, d);
                indices.push(c, d, b);
            }
        }

        // build geometry
        return { indices, positions, uvs, normals };
    }
}
