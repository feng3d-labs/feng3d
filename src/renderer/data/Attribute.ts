namespace feng3d
{
    /**
     * 属性渲染数据
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     */
    export class Attribute
    {
        name: string;

        /**
         * 属性数据
         */
        get data()
        {
            return this._data;
        }
        set data(v)
        {
            this._data = v;
            this.invalidate();
        }
        private _data: number[];

        /**
         * 数据尺寸
         * 
         * A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
         */
        size = 3;

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
        type: "BYTE" | "SHORT" | "UNSIGNED_BYTE" | "UNSIGNED_SHORT" | "FLOAT" | "UNSIGNED_INT" | "UNSIGNED_INT" | "HALF_FLOAT" = GLArrayType.FLOAT;

        /**
         * A GLboolean specifying whether integer data values should be normalized when being casted to a float.
              -  If true, signed integers are normalized to [-1, 1].
              -  If true, unsigned integers are normalized to [0, 1].
              -  For types gl.FLOAT and gl.HALF_FLOAT, this parameter has no effect.
         */
        normalized = false;
        /**
         * A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes. Cannot be larger than 255.
         */
        stride = 0;
        /**
         * A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of type.
         */
        offset = 0;

        /**
         * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
         * 
         * A GLuint specifying the number of instances that will pass between updates of the generic attribute.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/vertexAttribDivisorANGLE
         */
        divisor = 0;

        /**
         * A GLenum specifying the intended usage pattern of the data store for optimization purposes. 
         * 
         * 为优化目的指定数据存储的预期使用模式的GLenum。
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
         */
        usage = AttributeUsage.STATIC_DRAW;

        /**
         * 是否失效
         */
        invalid = true;

        constructor(source?: gPartial<Attribute>)
        {
            Object.assign(this, source);
        }

        /**
         * 使数据失效
         */
        invalidate()
        {
            this.invalid = true;
        }

        /**
         * 
         * @param gl 
         * @param location A GLuint specifying the index of the vertex attribute that is to be modified.
         */
        active(gl: GL, location: number)
        {
            gl.enableVertexAttribArray(location);
            var buffer = this.getBuffer(gl);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(location, this.size, gl[this.type], this.normalized, this.stride, this.offset);

            gl.vertexAttribDivisor(location, this.divisor);
        }

        /**
         * 获取缓冲
         */
        getBuffer(gl: GL)
        {
            if (this.invalid)
            {
                this.clear(this);
                this.invalid = false;
            }
            var buffer = gl.cache.attributes.get(this);
            if (!buffer)
            {
                var buffer = gl.createBuffer();
                if (!buffer)
                {
                    console.error("createBuffer 失败！");
                    throw "";
                }
                gl.cache.attributes.set(this, buffer);

                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data), gl[this.usage]);
            }
            return buffer;
        }

        /**
         * 清理缓冲
         */
        clear(attribute: Attribute)
        {
            WebGLRenderer.glList.forEach(gl =>
            {
                var buffer = gl.cache.attributes.get(attribute);
                if (buffer)
                {
                    gl.deleteBuffer(buffer);
                    gl.cache.attributes.delete(attribute);
                }
            });
        }
    }
}