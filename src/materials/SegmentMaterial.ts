namespace feng3d
{
    export interface Uniforms
    {
        u_segmentColor: Color;
    }

    /**
	 * 线段材质
     * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
	 * @author feng 2016-10-15
	 */
    export class SegmentMaterial extends Material
    {
        /**
         * 线段颜色
         */
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
        private _color = new Color();

        /**
         * 构建线段材质
         */
        constructor()
        {
            super();
            this.shaderName = "segment";
            this.renderMode = RenderMode.LINES;
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.u_segmentColor = () => this.color;

        }
    }
}