namespace feng3d
{
    export interface UniformRenderData
    {
        u_segmentColor: Lazy<Color>;
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
        public readonly color = new Color();

        /**
         * 构建线段材质
         */
        constructor()
        {
            super();
            this.setShader("segment");
            this.renderMode = RenderMode.LINES;
            this.createUniformData("u_segmentColor", () => this.color);
        }
    }
}