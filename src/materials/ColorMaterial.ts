namespace feng3d
{
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    export class ColorMaterial extends Material
    {
        /** 
         * 颜色 
         */
        @serialize()
        @oav()
        get color()
        {
            return this._color;
        }
        set color(value)
        {
            if (this._color == value)
                return;
            this._color = value;
            if (this._color)
                this.enableBlend = this._color.a != 1;
        }
        private _color: Color;

        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color?: Color)
        {
            super();
            this.shaderName = "color";
            this.color = color || new Color();
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.u_diffuseInput = () => this.color;
        }
    }
}