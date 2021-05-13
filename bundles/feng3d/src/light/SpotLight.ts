import { PerspectiveLens } from "../cameras/lenses/PerspectiveLens";
import { RegisterComponent } from "../component/Component";
import { Entity } from "../core/Entity";
import { oav } from "@feng3d/objectview";
import { serialize } from "@feng3d/serialization";
import { watch } from "../utils/Watcher";
import { Light } from "./Light";
import { LightType } from "./LightType";

declare module "../core/Entity"
{
    export interface PrimitiveEntity
    {
        "Spot light": Entity;
    }
}
declare module "../component/Component"
{
    export interface ComponentMap { SpotLight: SpotLight; }
}

/**
 * 聚光灯光源
 */
@RegisterComponent()
export class SpotLight extends Light
{
    lightType = LightType.Spot;

    /**
     * 光照范围
     */
    @oav()
    @serialize
    @watch("_invalidRange")
    range = 10;

    /**
     * 
     */
    @oav()
    @serialize
    @watch("_invalidAngle")
    angle = 60;

    /**
     * 半影.
     */
    @oav()
    @serialize
    penumbra = 0;

    /**
     * 椎体cos值
     */
    get coneCos()
    {
        return Math.cos(this.angle * 0.5 * Math.DEG2RAD);
    }

    get penumbraCos()
    {
        return Math.cos(this.angle * 0.5 * Math.DEG2RAD * (1 - this.penumbra));
    }

    private perspectiveLens: PerspectiveLens;

    constructor()
    {
        super();
        this.perspectiveLens = this.shadowCamera.lens = new PerspectiveLens(this.angle, 1, 0.1, this.range);
    }

    private _invalidRange()
    {
        if (this.shadowCamera)
            this.shadowCamera.lens.far = this.range;
    }

    private _invalidAngle()
    {
        if (this.perspectiveLens)
            this.perspectiveLens.fov = this.angle;
    }
}

Entity.registerPrimitive("Spot light", (g) =>
{
    g.addComponent(SpotLight);
});