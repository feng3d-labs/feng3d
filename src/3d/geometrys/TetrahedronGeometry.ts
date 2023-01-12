import { oav } from '../../objectview/ObjectView';
import { gPartial } from '../../polyfill/Types';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Node3D } from '../core/Node3D';
import { Geometry, RegisterGeometry } from '../geometrys/Geometry';
import { geometryUtils } from '../geometrys/GeometryUtils';
import { PolyhedronGeometry } from './PolyhedronGeometry';

declare module './Geometry'
{
    interface GeometryMap { TetrahedronGeometry: TetrahedronGeometry }

    interface DefaultGeometryMap { Tetrahedron: TetrahedronGeometry; }
}

declare module '../core/Node3D' { interface PrimitiveNode3D { Tetrahedron: Node3D; } }

/**
 * 四面体
 *
 * @see https://github.com/mrdoob/three.js/blob/dev/src/geometries/TetrahedronGeometry.js
 */
@RegisterGeometry('TetrahedronGeometry')
export class TetrahedronGeometry extends Geometry
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

    constructor(param?: gPartial<TetrahedronGeometry>)
    {
        super();
        Object.assign(this, param);
        watcher.watch(this as TetrahedronGeometry, 'radius', this.invalidateGeometry, this);
        watcher.watch(this as TetrahedronGeometry, 'detail', this.invalidateGeometry, this);
    }

    /**
     * 构建几何体数据
     */
    protected buildGeometry()
    {
        const vertices = [
            1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1
        ];

        const indices = [
            2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1
        ];
        const { positions, normals, uvs } = PolyhedronGeometry.buildGeometry({ vertices, indices, radius: this.radius, detail: this.detail });
        const _indices = geometryUtils.createIndices(positions);
        const tangents = geometryUtils.createVertexTangents(_indices, positions, uvs);

        this.indexBuffer = { array: _indices };
        this.attributes.a_position = { array: positions, itemSize: 3 };
        this.attributes.a_normal = { array: normals, itemSize: 3 };
        this.attributes.a_tangent = { array: tangents, itemSize: 3 };
        this.attributes.a_uv = { array: uvs, itemSize: 2 };
    }
}
