import { Geometry, geometryUtils } from '@feng3d/core';
import { decoratorRegisterClass } from '@feng3d/serialization';

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
@decoratorRegisterClass()
export class UIGeometry extends Geometry
{
    __class__: 'UIGeometry';

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
