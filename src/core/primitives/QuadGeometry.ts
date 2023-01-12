import { Node3D } from '../../3d/Node3D';
import { Geometry, RegisterGeometry } from '../geometry/Geometry';
import { geometryUtils } from '../geometry/GeometryUtils';
import { createNodeMenu } from '../menu/CreateNodeMenu';

declare module '../geometry/Geometry'
{
    interface GeometryMap { QuadGeometry: QuadGeometry }

    interface DefaultGeometryMap { Quad: QuadGeometry; }
}

declare module '../../3d/Node3D' { interface PrimitiveNode3D { Quad: Node3D; } }

/**
 * 四边形面皮几何体
 */
@RegisterGeometry('QuadGeometry')
export class QuadGeometry extends Geometry
{
    declare __class__: 'QuadGeometry';

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
    g.addComponent('Mesh3D').geometry = Geometry.getDefault('Quad');
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

