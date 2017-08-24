declare namespace feng3d {
    interface UniformRenderData {
        u_segmentColor: Lazy<Color>;
    }
    /**
     * 线段材质
     * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
     * @author feng 2016-10-15
     */
    class SegmentMaterial extends Material {
        /**
         * 线段颜色
         */
        readonly color: Color;
        /**
         * 构建线段材质
         */
        constructor();
    }
}
