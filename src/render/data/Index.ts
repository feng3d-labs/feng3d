module feng3d
{

	/**
	 * 索引渲染数据
     * @author feng 2017-01-04
	 */
    export class Index
    {
        /**
         * 索引数据
         */
        get indices()
        {
            return this._indices;
        }
        set indices(value)
        {
            if (this._indices == value)
                return;
            this._indices = value;
            this.invalid = true;
        }
        private _indices: Lazy<number[]>;
        private _value: Uint16Array;

        /**
         * 渲染数量
         */
        count: number;

        /**
         * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
         */
        type = GL.UNSIGNED_SHORT;

        /**
         * 索引偏移
         */
        offset = 0;
        /**
         * 缓冲
         */
        private _indexBufferMap = new Map<GL, WebGLBuffer>();
        /**
         * 是否失效
         */
        invalid = true;

        /**
         * 激活缓冲
         * @param gl 
         */
        active(gl: GL)
        {
            if (this.invalid)
            {
                this.clear();
                this.invalid = false;
                this._value = new Uint16Array(lazy.getvalue(this._indices));
                this.count = this._value.length;
            }
            var buffer = this.getBuffer(gl);
            gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, buffer);
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
                if (buffer)
                {
                    gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, buffer);
                    gl.bufferData(GL.ELEMENT_ARRAY_BUFFER, this._value, GL.STATIC_DRAW);
                    this._indexBufferMap.push(gl, buffer);
                }
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
    }
}