import { oav } from "@feng3d/objectview";
import { serialize } from "@feng3d/serialization";
import { watch } from "@feng3d/watcher";

import { LightType } from "./LightType";
import { Light } from "./Light";
import { RegisterComponent } from "../component/Component";
import { PerspectiveLens } from "../cameras/lenses/PerspectiveLens";
import { GameObject } from "../core/GameObject";


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

GameObject.registerPrimitive("Spot light", (g) =>
{
    g.addComponent("SpotLight");
});

export interface PrimitiveGameObject
{
    "Spot light": GameObject;
}
