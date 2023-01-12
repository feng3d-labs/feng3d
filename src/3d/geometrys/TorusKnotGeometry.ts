import { Node3D } from '../../3d/Node3D';
import { Vector3 } from '../../math/geom/Vector3';
import { gPartial } from '../../polyfill/Types';
import { watcher } from '../../watcher/watcher';
import { Geometry, RegisterGeometry } from '../geometrys/Geometry';
import { geometryUtils } from '../geometrys/GeometryUtils';

declare module './Geometry'
{
    interface GeometryMap { TorusKnotGeometry: TorusKnotGeometry }

    interface DefaultGeometryMap { TorusKnot: TorusKnotGeometry; }
}

declare module '../../3d/Node3D' { interface PrimitiveNode3D { TorusKnot: Node3D; } }

/**
 * 环形结
 *
 * @see https://github.com/mrdoob/three.js/blob/dev/src/geometries/TorusKnotGeometry.js
 */
@RegisterGeometry('TorusKnotGeometry')
export class TorusKnotGeometry extends Geometry
{
    declare __class__: 'TorusKnotGeometry';

    radius = 1;
    tube = 0.4;
    tubularSegments = 64;
    radialSegments = 8;
    p = 2;
    q = 3;

    constructor(param?: gPartial<TorusKnotGeometry>)
    {
        super();
        Object.assign(this, param);
        watcher.watch(this as TorusKnotGeometry, 'radius', this.invalidateGeometry, this);
        watcher.watch(this as TorusKnotGeometry, 'tube', this.invalidateGeometry, this);
        watcher.watch(this as TorusKnotGeometry, 'tubularSegments', this.invalidateGeometry, this);
        watcher.watch(this as TorusKnotGeometry, 'radialSegments', this.invalidateGeometry, this);
        watcher.watch(this as TorusKnotGeometry, 'p', this.invalidateGeometry, this);
        watcher.watch(this as TorusKnotGeometry, 'q', this.invalidateGeometry, this);
    }

    /**
     * 构建几何体数据
     */
    protected buildGeometry()
    {
        const { indices, positions, normals, uvs } = TorusKnotGeometry.buildGeometry(this);

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
    static buildGeometry({ radius, tube, tubularSegments, radialSegments, p, q }: TorusKnotGeometry)
    {
        tubularSegments = Math.floor(tubularSegments);
        radialSegments = Math.floor(radialSegments);

        // buffers
        const indices = [];
        const positions = [];
        const normals = [];
        const uvs = [];

        // helper variables
        const vertex = new Vector3();
        const normal = new Vector3();

        const P1 = new Vector3();
        const P2 = new Vector3();

        const B = new Vector3();
        const T = new Vector3();
        const N = new Vector3();

        // generate vertices, normals and uvs
        for (let i = 0; i <= tubularSegments; ++i)
        {
            // the radian "u" is used to calculate the position on the torus curve of the current tubular segment
            const u = i / tubularSegments * p * Math.PI * 2;

            // now we calculate two points. P1 is our current position on the curve, P2 is a little farther ahead.
            // these points are used to create a special "coordinate space", which is necessary to calculate the correct vertex positions
            calculatePositionOnCurve(u, p, q, radius, P1);
            calculatePositionOnCurve(u + 0.01, p, q, radius, P2);

            // calculate orthonormal basis
            P2.subTo(P1, T);
            P2.addTo(P1, N);
            T.crossTo(N, B);
            B.crossTo(T, N);

            // normalize B, N. T can be ignored, we don't use it
            B.normalize();
            N.normalize();

            for (let j = 0; j <= radialSegments; ++j)
            {
                // now calculate the vertices. they are nothing more than an extrusion of the torus curve.
                // because we extrude a shape in the xy-plane, there is no need to calculate a z-value.
                const v = j / radialSegments * Math.PI * 2;
                const cx = -tube * Math.cos(v);
                const cy = tube * Math.sin(v);

                // now calculate the final vertex position.
                // first we orient the extrusion with our basis vectors, then we add it to the current position on the curve

                vertex.x = P1.x + (cx * N.x + cy * B.x);
                vertex.y = P1.y + (cx * N.y + cy * B.y);
                vertex.z = P1.z + (cx * N.z + cy * B.z);

                positions.push(vertex.x, vertex.y, vertex.z);

                // normal (P1 is always the center/origin of the extrusion, thus we can use it to calculate the normal)
                vertex.subTo(P1, normal).normalize();

                normals.push(normal.x, normal.y, normal.z);

                // uv
                uvs.push(i / tubularSegments);
                uvs.push(j / radialSegments);
            }
        }

        // generate indices
        for (let j = 1; j <= tubularSegments; j++)
        {
            for (let i = 1; i <= radialSegments; i++)
            {
                // indices
                const a = (radialSegments + 1) * (j - 1) + (i - 1);
                const b = (radialSegments + 1) * j + (i - 1);
                const c = (radialSegments + 1) * j + i;
                const d = (radialSegments + 1) * (j - 1) + i;

                // faces
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        // build geometry
        return { indices, positions, normals, uvs };

        // this function calculates the current position on the torus curve

        function calculatePositionOnCurve(u, p, q, radius, position)
        {
            const cu = Math.cos(u);
            const su = Math.sin(u);
            const quOverP = q / p * u;
            const cs = Math.cos(quOverP);

            position.x = radius * (2 + cs) * 0.5 * cu;
            position.y = radius * (2 + cs) * su * 0.5;
            position.z = radius * Math.sin(quOverP) * 0.5;
        }
    }
}
