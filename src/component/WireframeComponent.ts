namespace feng3d
{

    export interface ComponentMap { WireframeComponent: WireframeComponent; }

    /**
     * 线框组件，将会对拥有该组件的对象绘制线框
     */
    export class WireframeComponent extends Component
    {

        __class__: "feng3d.WireframeComponent" = "feng3d.WireframeComponent";

        @oav()
        color = new Color4(125 / 255, 176 / 255, 250 / 255);
    }
}