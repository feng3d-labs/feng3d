namespace feng3d
{

    export interface ComponentMap { CartoonComponent: CartoonComponent; }

    /**
     * 参考
     */
    @AddComponentMenu("Rendering/CartoonComponent")
    @RegisterComponent()
    export class CartoonComponent extends Component
    {

        __class__: "feng3d.CartoonComponent";

        @oav()
        @serialize
        outlineSize = 1;

        @oav()
        @serialize
        outlineColor = new Color4(0.2, 0.2, 0.2, 1.0);

        @oav()
        @serialize
        outlineMorphFactor = 0.0;

        /**
         * 半兰伯特值diff，分段值 4个(0.0,1.0)
         */
        @oav()
        @serialize
        diffuseSegment = new Vector4(0.1, 0.3, 0.6, 1.0);
        /**
         * 半兰伯特值diff，替换分段值 4个(0.0,1.0)
         */
        @oav()
        @serialize
        diffuseSegmentValue = new Vector4(0.1, 0.3, 0.6, 1.0);

        @oav()
        @serialize
        specularSegment = 0.5;

        @oav()
        @serialize
        get cartoon_Anti_aliasing()
        {
            return this._cartoon_Anti_aliasing;
        }
        set cartoon_Anti_aliasing(value)
        {
            this._cartoon_Anti_aliasing = value;
        }
        _cartoon_Anti_aliasing = false;

        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {
            renderAtomic.uniforms.u_diffuseSegment = this.diffuseSegment;
            renderAtomic.uniforms.u_diffuseSegmentValue = this.diffuseSegmentValue;
            renderAtomic.uniforms.u_specularSegment = this.specularSegment;
            //
            renderAtomic.uniforms.u_outlineSize = this.outlineSize;
            renderAtomic.uniforms.u_outlineColor = this.outlineColor;
            renderAtomic.uniforms.u_outlineMorphFactor = this.outlineMorphFactor;
        }

    }

    export interface Uniforms
    {
        u_diffuseSegment: Vector4;
        u_diffuseSegmentValue: Vector4;

        u_specularSegment: number;
    }
}