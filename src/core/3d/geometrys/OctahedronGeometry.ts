import { oav } from '@feng3d/objectview';
import { SerializeProperty } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { Node3D } from '../core/Node3D';
import { Geometry, RegisterGeometry } from '../geometrys/Geometry';
import { geometryUtils } from '../geometrys/GeometryUtils';
import { PolyhedronGeometry } from './PolyhedronGeometry';

declare module './Geometry'
{
    interface GeometryMap { OctahedronGeometry: OctahedronGeometry }

    interface DefaultGeometryMap { Octahedron: OctahedronGeometry; }
}

declare module '../core/Node3D' { interface PrimitiveNode3D { Octahedron: Node3D; } }

/**
 * 八面体
 *
 * @see https://github.com/mrdoob/three.js/blob/dev/src/geometries/OctahedronGeometry.js
 */
@RegisterGeometry('OctahedronGeometry')
export class OctahedronGeometry extends Geometry
{
    declare __class__: 'IcosahedronGeometry';

    /**
     * 半径
     */
    @SerializeProperty()
    @oav()
    radius = 1;

    /**
     * 细节程度
     */
    @SerializeProperty()
    @oav()
    detail = 0;

    constructor()
    {
        super();
        watcher.watch(this as OctahedronGeometry, 'radius', this.invalidateGeometry, this);
        watcher.watch(this as OctahedronGeometry, 'detail', this.invalidateGeometry, this);
    }

    /**
     * 构建几何体数据
     */
    protected buildGeometry()
    {
        const vertices = [
            1, 0, 0, -1, 0, 0, 0, 1, 0,
            0, -1, 0, 0, 0, 1, 0, 0, -1
        ];

        const indices = [
            0, 2, 4, 0, 4, 3, 0, 3, 5,
            0, 5, 2, 1, 2, 5, 1, 5, 3,
            1, 3, 4, 1, 4, 2
        ];
        const { positions, normals, uvs } = PolyhedronGeometry.buildGeometry({ vertices, indices, radius: this.radius, detail: this.detail });

        const tangents = geometryUtils.createVertexTangents(indices, positions, uvs);

        this.indexBuffer = { array: indices };
        this.attributes.a_position = { array: positions, itemSize: 3 };
        this.attributes.a_normal = { array: normals, itemSize: 3 };
        this.attributes.a_tangent = { array: tangents, itemSize: 3 };
        this.attributes.a_uv = { array: uvs, itemSize: 2 };
    }
}
