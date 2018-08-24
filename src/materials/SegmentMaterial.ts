namespace feng3d
{
    export interface MaterialMap { SegmentMaterial: SegmentMaterial }

    /**
	 * 线段材质
     * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
	 */
    export class SegmentMaterial extends Material
    {
        __class__: "feng3d.SegmentMaterial" = "feng3d.SegmentMaterial";

        uniforms: SegmentUniforms;

        constructor()
        {
            super();
            this.shaderName = "segment";
            this.uniforms = new SegmentUniforms();
        }
    }

    export class SegmentUniforms
    {
        /** 
         * 颜色
         */
        @serialize
        @oav()
        u_segmentColor = new Color4();
    }

    shaderConfig.shaders["segment"].cls = SegmentUniforms;
}