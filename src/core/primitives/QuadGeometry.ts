import { Serializable } from '../../serialization/Serializable';
import { MeshRenderer } from '../core/MeshRenderer';
import { Node3D } from '../core/Node3D';
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

    export interface MixinsPrimitiveNode3D
    {
        Quad: Node3D;
    }
}

/**
 * 四边形面皮几何体
 */
@Serializable()
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

Node3D.registerPrimitive('Quad', (g) =>
{
    g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Quad');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Quad',
        priority: -6,
        click: () =>
            Node3D.createPrimitive('Quad')
    }
);

