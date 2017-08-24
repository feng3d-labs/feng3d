declare namespace feng3d {
    interface AttributeRenderDataStuct {
        /**
         * 坐标
         */
        a_position: AttributeRenderData;
        /**
         * 颜色
         */
        a_color: AttributeRenderData;
        /**
         * 法线
         */
        a_normal: AttributeRenderData;
        /**
         * 切线
         */
        a_tangent: AttributeRenderData;
        /**
         * uv（纹理坐标）
         */
        a_uv: AttributeRenderData;
        /**
         * 关节索引
         */
        a_jointindex0: AttributeRenderData;
        /**
         * 关节权重
         */
        a_jointweight0: AttributeRenderData;
        /**
         * 关节索引
         */
        a_jointindex1: AttributeRenderData;
        /**
         * 关节权重
         */
        a_jointweight1: AttributeRenderData;
    }
    /**
     * 属性渲染数据
     * @author feng 2014-8-14
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer}
     */
    class AttributeRenderData extends RenderElement {
        name: string;
        /**
         * 属性数据
         */
        data: Float32Array;
        private _data;
        /**
         * 数据尺寸
         *
         * A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
         */
        size: number;
        private _size;
        /**
         *  A GLenum specifying the data type of each component in the array. Possible values:
                - gl.BYTE: signed 8-bit integer, with values in [-128, 127]
                - gl.SHORT: signed 16-bit integer, with values in [-32768, 32767]
                - gl.UNSIGNED_BYTE: unsigned 8-bit integer, with values in [0, 255]
                - gl.UNSIGNED_SHORT: unsigned 16-bit integer, with values in [0, 65535]
                - gl.FLOAT: 32-bit floating point number
            When using a WebGL 2 context, the following values are available additionally:
               - gl.HALF_FLOAT: 16-bit floating point number
         */
        type: number;
        /**
         * A GLboolean specifying whether integer data values should be normalized when being casted to a float.
              -  If true, signed integers are normalized to [-1, 1].
              -  If true, unsigned integers are normalized to [0, 1].
              -  For types gl.FLOAT and gl.HALF_FLOAT, this parameter has no effect.
         */
        normalized: boolean;
        /**
         * A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes. Cannot be larger than 255.
         */
        stride: number;
        /**
         * A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of type.
         */
        offset: number;
        /**
         * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
         *
         * A GLuint specifying the number of instances that will pass between updates of the generic attribute.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/vertexAttribDivisorANGLE
         */
        divisor: number;
        _divisor: number;
        updateGrometry: Function;
        /**
         * 顶点数据缓冲
         */
        private _indexBufferMap;
        /**
         * 是否失效
         */
        private _invalid;
        constructor(name: string, data?: Float32Array, size?: number, divisor?: number);
        /**
         * 使数据缓冲失效
         */
        invalidate(): void;
        /**
         *
         * @param gl
         * @param location A GLuint specifying the index of the vertex attribute that is to be modified.
         */
        active(gl: GL, location: number): void;
        /**
         * 获取缓冲
         */
        private getBuffer(gl);
        /**
         * 清理缓冲
         */
        private clear();
        /**
         * 克隆
         */
        clone(): this;
    }
}
