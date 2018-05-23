namespace feng3d
{
    /**
	 * 线段材质
     * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
	 * @author feng 2016-10-15
	 */
    export type SegmentMaterial = Material & { uniforms: SegmentUniforms; };
    export interface MaterialFactory
    {
        create(shader: "segment", raw?: gPartial<SegmentMaterial>): SegmentMaterial;
    }
    export interface MaterialRawMap
    {
        segment: gPartial<SegmentMaterial>
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