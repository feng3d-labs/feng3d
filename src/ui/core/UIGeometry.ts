import { Geometry } from '../../core/geometry/Geometry';
import { geometryUtils } from '../../core/geometry/GeometryUtils';
import { decoratorRegisterClass } from '../../polyfill/ClassUtils';

declare global
{
    export interface MixinsGeometryTypes
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

        this.positions = [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0];
        this.uvs = [0, 0, 1, 0, 1, 1, 0, 1];
        this.indices = [0, 1, 2, 0, 2, 3];

        this.normals = geometryUtils.createVertexNormals(this.indices, this.positions, true);
        this.tangents = geometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, true);
    }
}

Geometry.setDefault('Default-UIGeometry', new UIGeometry());
