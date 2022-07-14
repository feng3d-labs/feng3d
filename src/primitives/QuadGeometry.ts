namespace feng3d
{
    export interface GeometryTypes { QuadGeometry: QuadGeometry }

    /**
     * 四边形面皮几何体
     */
    export class QuadGeometry extends Geometry
    {
        __class__: "feng3d.QuadGeometry";

        constructor()
        {
            super();
            var size = 0.5;

            this.positions = [-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0];
            this.uvs = [0, 0, 1, 0, 1, 1, 0, 1];
            this.indices = [0, 1, 2, 0, 2, 3];

            this.normals = geometryUtils.createVertexNormals(this.indices, this.positions, true);
            this.tangents = geometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, true)
        }
    }

    export interface DefaultGeometry
    {
        Quad: QuadGeometry;
    }
    Geometry.setDefault("Quad", new QuadGeometry());

    GameObject.registerPrimitive("Quad", (g) =>
    {
        g.addComponent(MeshRenderer).geometry = Geometry.getDefault("Quad");
    });

    export interface PrimitiveGameObject
    {
        Quad: GameObject;
    }

    // 在 Hierarchy 界面新增右键菜单项
    createNodeMenu.push(
        {
            path: "3D Object/Quad",
            priority: -6,
            click: () =>
            {
                return GameObject.createPrimitive("Quad");
            }
        }
    );

}