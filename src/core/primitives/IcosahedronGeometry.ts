import { Node3D } from '../../3d/Node3D';
import { oav } from '../../objectview/ObjectView';
import { gPartial } from '../../polyfill/Types';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Geometry, RegisterGeometry } from '../geometry/Geometry';
import { geometryUtils } from '../geometry/GeometryUtils';
import { PolyhedronGeometry } from './PolyhedronGeometry';

declare module '../geometry/Geometry'
{
    export interface GeometryMap { IcosahedronGeometry: IcosahedronGeometry }

    export interface DefaultGeometryMap { Icosahedron: IcosahedronGeometry; }
}

declare module '../../3d/Node3D' { interface PrimitiveNode3D { Icosahedron: Node3D; } }

/**
 * 二十面体
 *
 * @see https://github.com/mrdoob/three.js/blob/dev/src/geometries/IcosahedronGeometry.js
 */
@RegisterGeometry('IcosahedronGeometry')
export class IcosahedronGeometry extends Geometry
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

    constructor(param?: gPartial<IcosahedronGeometry>)
    {
        super();
        Object.assign(this, param);
        watcher.watch(this as IcosahedronGeometry, 'radius', this.invalidateGeometry, this);
        watcher.watch(this as IcosahedronGeometry, 'detail', this.invalidateGeometry, this);
    }

    /**
     * 构建几何体数据
     */
    protected buildGeometry()
    {
        const t = (1 + Math.sqrt(5)) / 2;
        const vertices = [
            -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0,
            0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t,
            t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1
        ];

        const indices = [
            0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
            1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
            3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
            4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1
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
