namespace feng3d
{
    export interface GeometryTypes { QuadGeometry: QuadGeometry }

    /**
     * 四边形面皮几何体
     */
    export class QuadGeometry extends Geometry
    {
        __class__: "feng3d.QuadGeometry";

        @AddEntityMenu("Node3D/Quad")
        create(name = "Quad")
        {
            var mesh = new Entity().addComponent(MeshRenderer);
            mesh.name = name;
            mesh.geometry = Geometry.getDefault("Quad");
            return mesh;
        }

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

    Entity.registerPrimitive("Quad", (g) =>
    {
        g.addComponent(MeshRenderer).geometry = Geometry.getDefault("Quad");
    });

    export interface PrimitiveEntity
    {
        Quad: Entity;
    }
}