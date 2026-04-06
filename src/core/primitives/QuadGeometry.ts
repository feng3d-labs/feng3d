import { GameObject } from '../core/GameObject';
import { MeshRenderer } from '../core/MeshRenderer';
import { Geometry } from '../geometry/Geometry';
import { geometryUtils } from '../geometry/GeometryUtils';
import { createNodeMenu } from '../menu/CreateNodeMenu';

declare global
{
    export interface MixinsGeometryTypes
    {
        QuadGeometry: QuadGeometry
    }

    export interface MixinsDefaultGeometry
    {
        Quad: QuadGeometry;
    }

    export interface MixinsPrimitiveGameObject
    {
        Quad: GameObject;
    }
}

/**
 * 四边形面皮几何体
 */
@decoratorRegisterClass()
export class QuadGeometry extends Geometry
{
    __class__: 'QuadGeometry';

    constructor()
    {
        super();
        const size = 0.5;

        this.positions = [-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0];
        this.uvs = [0, 0, 1, 0, 1, 1, 0, 1];
        this.indices = [0, 1, 2, 0, 2, 3];

        this.normals = geometryUtils.createVertexNormals(this.indices, this.positions, true);
        this.tangents = geometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, true);
    }
}

Geometry.setDefault('Quad', new QuadGeometry());

GameObject.registerPrimitive('Quad', (g) =>
{
    g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Quad');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Quad',
        priority: -6,
        click: () =>
            GameObject.createPrimitive('Quad')
    }
);

