namespace feng3d
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
        private _indices: number[];

        /**
         * 渲染数量
         */
        get count()
        {
            if (!this._indices)
                return 0;
            return this._indices.length;
        }

        /**
         * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
         */
        type = GLArrayType.UNSIGNED_SHORT;

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
            }
            var buffer = this.getBuffer(gl);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        }

        /**
         * 获取缓冲
         */
        private getBuffer(gl: GL)
        {
            var buffer = this._indexBufferMap.get(gl);
            if (!buffer)
            {
                buffer = <any>gl.createBuffer();
                if (!buffer)
                {
                    error("createBuffer 失败！");
                    throw "";
                }
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indices), gl.STATIC_DRAW);
                this._indexBufferMap.set(gl, buffer);
            }
            return buffer;
        }

        /**
         * 清理缓冲
         */
        private clear()
        {
            this._indexBufferMap.forEach((value, key) =>
            {
                key.deleteBuffer(value);
            });
            this._indexBufferMap.clear();
        }
    }
}