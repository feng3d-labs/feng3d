import { Geometry } from '../../core/geometry/Geometry';
import { geometryUtils } from '../../core/geometry/GeometryUtils';
import { Serializable } from '../../serialization/Serializable';

declare global
{
    export interface MixinsGeometryMap
    {
        UIGeometry: UIGeometry
    }

    export interface MixinsDefaultGeometry
    {
        'Default-UIGeometry': UIGeometry;
    }
}

/**
 * UI几何体
 */
@Serializable('UIGeometry')
export class UIGeometry extends Geometry
{
    declare __class__: 'UIGeometry';

    constructor()
    {
        super();

        const positions = [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0];
        const uvs = [0, 0, 1, 0, 1, 1, 0, 1];
        const indices = [0, 1, 2, 0, 2, 3];

        const normals = geometryUtils.createVertexNormals(indices, positions, true);
        const tangents = geometryUtils.createVertexTangents(indices, positions, uvs, true);

        this.indexBuffer = { array: indices };
        this.attributes.a_position = { array: positions, itemSize: 3 };
        this.attributes.a_uv = { array: uvs, itemSize: 2 };
        this.attributes.a_normal = { array: normals, itemSize: 3 };
        this.attributes.a_tangent = { array: tangents, itemSize: 3 };
    }
}

Geometry.setDefault('Default-UIGeometry', new UIGeometry());
