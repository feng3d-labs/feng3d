import { Geometry, RegisterGeometry } from '../../3d/geometrys/Geometry';
import { geometryUtils } from '../../3d/geometrys/GeometryUtils';

declare module '../../3d/geometrys/Geometry'
{
    interface GeometryMap { UIGeometry: UIGeometry }
    interface DefaultGeometryMap { 'Default-UIGeometry': UIGeometry; }
}

/**
 * UI几何体
 */
@RegisterGeometry('UIGeometry')
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

Geometry.setDefault('Default-UIGeometry', () => new UIGeometry());
