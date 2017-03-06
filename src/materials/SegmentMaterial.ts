module feng3d
{

    /**
	 * 线段材质
     * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
	 * @author feng 2016-10-15
	 */
    export class SegmentMaterial extends Material
    {
        /**
         * 构建线段材质
         */
        constructor()
        {
            super();
            this.shaderName = "segment";
            this.renderMode = RenderMode.LINES;
        }
    }
}