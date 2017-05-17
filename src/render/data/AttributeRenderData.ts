module feng3d
{
    export class AttributeRenderDataStuct
    {
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

        /**
         * 激活属性
         */
        public activeAttributes(gl: GL, attributeInfos: WebGLActiveInfo[])
        {
            for (var i = 0; i < attributeInfos.length; i++)
            {
                var activeInfo = attributeInfos[i];
                var buffer: AttributeRenderData = this[activeInfo.name];
                buffer.active(gl, activeInfo.location);
            }
        }
    }

	/**
	 * 属性渲染数据
	 * @author feng 2014-8-14
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer}
	 */
    export class AttributeRenderData
    {
        /**
         * 属性数据
         */
        public get data() { return this._data; }
        public set data(value) { this.invalidate(); this._data = value; }
        private _data: Float32Array;

        /**
         * 数据尺寸
         * 
         * A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
         */
        public get size() { return this._size; }
        public set size(value) { this.invalidate(); this._size = value; }
        private _size = 3;

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
        public type = GL.FLOAT;

        /**
         * A GLboolean specifying whether integer data values should be normalized when being casted to a float.
              -  If true, signed integers are normalized to [-1, 1].
              -  If true, unsigned integers are normalized to [0, 1].
              -  For types gl.FLOAT and gl.HALF_FLOAT, this parameter has no effect.
         */
        public normalized = false;
        /**
         * A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes. Cannot be larger than 255.
         */
        public stride = 0;
        /**
         * A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of type.
         */
        public offset = 0;

        /**
         * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
         * 
         * A GLuint specifying the number of instances that will pass between updates of the generic attribute.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/vertexAttribDivisorANGLE
         */
        public get divisor() { return this._divisor; }
        public set divisor(value) { this.invalidate(); this._divisor = value; }
        public _divisor = 0;

        /**
         * 顶点数据缓冲
         */
        private _indexBufferMap = new Map<GL, WebGLBuffer>();
        /**
         * 是否失效
         */
        private _invalid = true;

        constructor(data: Float32Array = null, stride: number = 3, divisor: number = 0)
        {
            this._data = data;
            this._size = stride;
            this._divisor = divisor;
            this._invalid = true;
        }

        /**
         * 使数据缓冲失效
         */
        public invalidate()
        {
            this._invalid = true;
        }

        /**
         * 
         * @param gl 
         * @param location A GLuint specifying the index of the vertex attribute that is to be modified.
         */
        public active(gl: GL, location: number)
        {
            if (this._invalid)
            {
                this.clear();
                this._invalid = false;
            }
            gl.enableVertexAttribArray(location);
            var buffer = this.getBuffer(gl);
            gl.bindBuffer(GL.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(location, this.size, this.type, this.normalized, this.stride, this.offset);

            if (this.divisor > 0)
            {
                var _ext = gl.getExtension('ANGLE_instanced_arrays');
                _ext.vertexAttribDivisorANGLE(location, this.divisor);
            }
        }

        /**
         * 获取缓冲
         */
        private getBuffer(gl: GL)
        {
            var buffer = this._indexBufferMap.get(gl);
            if (!buffer)
            {
                buffer = gl.createBuffer();
                gl.bindBuffer(GL.ARRAY_BUFFER, buffer);
                gl.bufferData(GL.ARRAY_BUFFER, this.data, GL.STATIC_DRAW);
                this._indexBufferMap.push(gl, buffer);
            }
            return buffer;
        }

        /**
         * 清理缓冲
         */
        private clear()
        {
            var gls = this._indexBufferMap.getKeys();
            for (var i = 0; i < gls.length; i++)
            {
                gls[i].deleteBuffer(this._indexBufferMap.get(gls[i]))
            }
            this._indexBufferMap.clear();
        }

        /**
         * 克隆
         */
        public clone()
        {
            var cls = <any>this.constructor;
            var ins: this = new cls();
            ins.data = new Float32Array(this.data.length);
            ins.data.set(this.data, 0);
            ins.size = this.size;
            ins.divisor = this.divisor;
            return ins;
        }
    }
}