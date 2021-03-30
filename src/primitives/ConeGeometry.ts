namespace feng3d
{
	/**
	 * 圆锥体

	 */
    export class ConeGeometry extends CylinderGeometry
    {
        __class__: "feng3d.ConeGeometry" = "feng3d.ConeGeometry";

        name = "Cone";

        @AddEntityMenu("Node3D/Cone")
        create(name = "Cone")
        {
            var mesh = new Entity().addComponent(MeshRenderer);
            mesh.name = name;
            mesh.geometry = Geometry.getDefault("Cone");
            return mesh;
        }
        
        /**
         * 底部半径 private
         */
        topRadius = 0;

        /**
         * 顶部是否封口 private
         */
        topClosed = false;

        /**
         * 侧面是否封口 private
         */
        surfaceClosed = true;
    }

    export interface DefaultGeometry
    {
        Cone: ConeGeometry;
    }
    Geometry.setDefault("Cone", new ConeGeometry());

    Entity.registerPrimitive("Cone", (g) =>
    {
        g.addComponent(MeshRenderer).geometry = Geometry.getDefault("Cone");
    });

    export interface PrimitiveEntity
    {
        Cone: Entity;
    }
}