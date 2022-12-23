import { oav } from '../../objectview/ObjectView';
import { gPartial } from '../../polyfill/Types';
import { serializable } from '../../serialization/serializable';
import { serialize } from '../../serialization/serialize';
import { watcher } from '../../watcher/watcher';
import { Object3D } from '../core/Object3D';
import { Geometry } from '../geometry/Geometry';
import { geometryUtils } from '../geometry/GeometryUtils';
import { PolyhedronGeometry } from './PolyhedronGeometry';

declare global
{
    export interface MixinsGeometryMap
    {
        OctahedronGeometry: OctahedronGeometry
    }

    export interface MixinsDefaultGeometry
    {
        Octahedron: OctahedronGeometry;
    }

    export interface MixinsPrimitiveObject3D
    {
        Octahedron: Object3D;
    }
}

/**
 * 八面体
 *
 * @see https://github.com/mrdoob/three.js/blob/dev/src/geometries/OctahedronGeometry.js
 */
@serializable()
export class OctahedronGeometry extends Geometry
{
    __class__: 'IcosahedronGeometry' = 'IcosahedronGeometry';

    /**
     * 半径
     */
    @serialize
    @oav()
    radius = 1;

    /**
     * 细节程度
     */
    @serialize
    @oav()
    detail = 0;

    constructor(param?: gPartial<OctahedronGeometry>)
    {
        super();
        Object.assign(this, param);
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
