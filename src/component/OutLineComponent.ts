namespace feng3d
{
    export interface ComponentMap { OutLineComponent: OutLineComponent; }

    @AddComponentMenu("Rendering/OutLineComponent")
    @RegisterComponent()
    export class OutLineComponent extends Component
    {
        __class__: "feng3d.OutLineComponent";

        @oav()
        @serialize
        size = 1;

        @oav()
        @serialize
        color = new Color4(0.2, 0.2, 0.2, 1.0);

        @oav()
        @serialize
        outlineMorphFactor = 0.0;

        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {
            renderAtomic.uniforms.u_outlineSize = this.size;
            renderAtomic.uniforms.u_outlineColor = this.color;
            renderAtomic.uniforms.u_outlineMorphFactor = this.outlineMorphFactor;
        }
    }

    export interface Uniforms
    {
        /**
         * 描边宽度
         */
        u_outlineSize: number;
        /**
         * 描边颜色
         */
        u_outlineColor: Color4;
        /**
         * 描边形态因子
         * (0.0，1.0):0.0表示延法线方向，1.0表示延顶点方向
         */
        u_outlineMorphFactor: number;
    }
}