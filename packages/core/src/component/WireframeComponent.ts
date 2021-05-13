import { Color4 } from "@feng3d/math";
import { oav } from "@feng3d/objectview";
import { RegisterComponent } from "./Component";
import { Component3D } from "./Component3D";

declare module "../component/Component"
{
    export interface ComponentMap { WireframeComponent: WireframeComponent; }
}

/**
 * 线框组件，将会对拥有该组件的对象绘制线框
 */
@RegisterComponent()
export class WireframeComponent extends Component3D
{

    __class__: "feng3d.WireframeComponent";

    @oav()
    color = new Color4(125 / 255, 176 / 255, 250 / 255);
}
