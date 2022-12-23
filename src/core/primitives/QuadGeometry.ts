import { serializable } from '../../serialization/ClassUtils';
import { MeshRenderer } from '../core/MeshRenderer';
import { Object3D } from '../core/Object3D';
import { Geometry } from '../geometry/Geometry';
import { geometryUtils } from '../geometry/GeometryUtils';
import { createNodeMenu } from '../menu/CreateNodeMenu';

declare global
{
    export interface MixinsGeometryMap
    {
        QuadGeometry: QuadGeometry
    }

    export interface MixinsDefaultGeometry
    {
        Quad: QuadGeometry;
    }

    export interface MixinsPrimitiveObject3D
    {
        Quad: Object3D;
    }
}

/**
 * 四边形面皮几何体
 */
@serializable()
export class QuadGeometry extends Geometry
{
    __class__: 'QuadGeometry';

    constructor()
    {
        super();
        const size = 0.5;

        const positions = [-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0];
        const uvs = [0, 0, 1, 0, 1, 1, 0, 1];
        const indices = [0, 1, 2, 0, 2, 3];

        const normals = geometryUtils.createVertexNormals(indices, positions, true);
        const tangents = geometryUtils.createVertexTangents(indices, positions, uvs, true);

        this.indexBuffer = { array: indices };
        this.attributes.a_position = { array: positions, itemSize: 3 };
        this.attributes.a_normal = { array: normals, itemSize: 3 };
        this.attributes.a_tangent = { array: tangents, itemSize: 3 };
        this.attributes.a_uv = { array: uvs, itemSize: 2 };
    }
}

Geometry.setDefault('Quad', new QuadGeometry());

Object3D.registerPrimitive('Quad', (g) =>
{
    g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Quad');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Quad',
        priority: -6,
        click: () =>
            Object3D.createPrimitive('Quad')
    }
);

