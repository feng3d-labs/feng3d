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
        public get color()
        {
            return this._color;
        }
        public set color(value)
        {
            if (this._color == value)
                return;
            this._color = value;
        }
        private _color: Color;

        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color: Color = null)
        {
            super();
            this.setShader("color");
            this.color = color || new Color();
            //
            this.createUniformData("u_diffuseInput", () => this.color);
        }
    }
}