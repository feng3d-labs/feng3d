namespace feng3d
{

	/**
	 * 索引渲染数据

	 */
    export class Index
    {
        /**
         * 索引数据
         */
        @watch("invalidate")
        indices: number[];

        invalidate()
        {
            this._invalid = true;
        }

        /**
         * 渲染数量
         */
        get count()
        {
            if (!this.indices)
                return 0;
            return this.indices.length;
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
        private _invalid = true;

        /**
         * 激活缓冲
         * @param gl 
         */
        active(gl: GL)
        {
            if (this._invalid)
            {
                this._clear();
                this._invalid = false;
            }
            var buffer = this._getBuffer(gl);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        }

        /**
         * 获取缓冲
         */
        private _getBuffer(gl: GL)
        {
            var buffer = this._indexBufferMap.get(gl);
            if (!buffer)
            {
                buffer = <any>gl.createBuffer();
                if (!buffer)
                {
                    console.error("createBuffer 失败！");
                    throw "";
                }
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
                this._indexBufferMap.set(gl, buffer);
            }
            return buffer;
        }

        /**
         * 清理缓冲
         */
        private _clear()
        {
            this._indexBufferMap.forEach((value, key) =>
            {
                key.deleteBuffer(value);
            });
            this._indexBufferMap.clear();
        }
    }
}