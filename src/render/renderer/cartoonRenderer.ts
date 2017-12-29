namespace feng3d
{
    /**
     * 卡通渲染
     */
    export var cartoonRenderer = {};

    /**
     * 参考
     */
    export class CartoonComponent extends Component
    {
        @oav()
        @serialize()
        outlineSize = 1;

        @oav()
        @serialize()
        outlineColor = new Color(0.2, 0.2, 0.2, 1.0);

        @oav()
        @serialize()
        outlineMorphFactor = 0.0;

        /**
         * 半兰伯特值diff，分段值 4个(0.0,1.0)
         */
        @oav({ componentParam: { showw: true } })
        @serialize()
        diffuseSegment = new Vector3D(0.1, 0.3, 0.6, 1.0);
        /**
         * 半兰伯特值diff，替换分段值 4个(0.0,1.0)
         */
        @oav({ componentParam: { showw: true } })
        @serialize()
        diffuseSegmentValue = new Vector3D(0.1, 0.3, 0.6, 1.0);

        @oav()
        @serialize()
        specularSegment = 0.5;

        @oav()
        @serialize()
        get cartoon_Anti_aliasing()
        {
            return this._cartoon_Anti_aliasing;
        }
        set cartoon_Anti_aliasing(value)
        {
            this._cartoon_Anti_aliasing = value;
            this.createBoolMacro("cartoon_Anti_aliasing", value);
        }
        _cartoon_Anti_aliasing = false;

        init(gameObject: GameObject)
        {
            super.init(gameObject);

            this.createBoolMacro("IS_CARTOON", true);
            this.createUniformData("u_diffuseSegment", () => this.diffuseSegment);
            this.createUniformData("u_diffuseSegmentValue", () => this.diffuseSegmentValue);
            this.createUniformData("u_specularSegment", () => this.specularSegment);
            //
            this.createUniformData("u_outlineSize", () => this.outlineSize);
            this.createUniformData("u_outlineColor", () => this.outlineColor);
            this.createUniformData("u_outlineMorphFactor", () => this.outlineMorphFactor);
        }
    }

    export interface Uniforms
    {
        u_diffuseSegment: Vector3D;
        u_diffuseSegmentValue: Vector3D;

        u_specularSegment: number;
    }

    /**
     * Boolean类型宏
     * 没有默认值
     */
    export interface BoolMacros
    {
        /**
         * 是否卡通渲染
         */
        IS_CARTOON: Boolean;
        /**
         * 是否抗锯齿
         */
        cartoon_Anti_aliasing: Boolean;
    }
}