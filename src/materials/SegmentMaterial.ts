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
        uniforms = new SegmentUniforms();

        /**
         * 构建线段材质
         */
        constructor()
        {
            super();
            this.shaderName = "segment";
            this.renderParams.renderMode = RenderMode.LINES;
        }
    }

    export class SegmentUniforms
    {
        /** 
         * 颜色
         */
        @serialize()
        @oav()
        u_segmentColor = new Color();
    }

    shaderConfig.shaders["segment"].cls = SegmentUniforms;
}