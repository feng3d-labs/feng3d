import { oav } from '@feng3d/objectview';
import { gPartial } from '@feng3d/polyfill';
import { decoratorRegisterClass, serialize } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { Object3D } from '../core/Object3D';
import { Geometry } from '../geometry/Geometry';
import { geometryUtils } from '../geometry/GeometryUtils';
import { PolyhedronGeometry } from './PolyhedronGeometry';

declare global
{
    export interface MixinsGeometryTypes
    {
        TetrahedronGeometry: TetrahedronGeometry
    }

    export interface MixinsDefaultGeometry
    {
        Tetrahedron: TetrahedronGeometry;
    }

    export interface MixinsPrimitiveObject3D
    {
        Tetrahedron: Object3D;
    }
}

/**
 * 四面体
 *
 * @see https://github.com/mrdoob/three.js/blob/dev/src/geometries/TetrahedronGeometry.js
 */
@decoratorRegisterClass()
export class TetrahedronGeometry extends Geometry
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
