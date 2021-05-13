import { Entity } from "../core/Entity";
import { MeshRenderer } from "../core/MeshRenderer";
import { Geometry } from "../geometry/Geometry";
import { CylinderGeometry } from "./CylinderGeometry";

/**
 * 圆锥体

 */
export class ConeGeometry extends CylinderGeometry
{
    __class__: "feng3d.ConeGeometry" = "feng3d.ConeGeometry";

    protected _name = "Cone";

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

declare module "../geometry/Geometry"
{
    export interface DefaultGeometry
    {
        Cone: ConeGeometry;
    }
}

Geometry.setDefault("Cone", new ConeGeometry());

Entity.registerPrimitive("Cone", (g) =>
{
    g.addComponent(MeshRenderer).geometry = Geometry.getDefault("Cone");
});

declare module "../core/Entity"
{
    export interface PrimitiveEntity
    {
        Cone: Entity;
    }
}