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

        constructor(indices?: number[])
        {
            this.indices = indices;
        }

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
        type = GLArrayType.UNSIGNED_INT;

        /**
         * 索引偏移
         */
        offset = 0;

        /**
         * 是否失效
         */
        private _invalid = true;

        /**
         * 激活缓冲
         * @param gl 
         */
        static active(gl: GL, index: Index)
        {
            var buffer = Index.getBuffer(gl, index);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        }

        /**
         * 获取缓冲
         */
        static getBuffer(gl: GL, index: Index)
        {
            if (index._invalid)
            {
                this.clear(index);
                index._invalid = false;
            }
            var buffer = gl.cache.indices.get(index);
            if (!buffer)
            {
                buffer = <any>gl.createBuffer();
                if (!buffer)
                {
                    console.error("createBuffer 失败！");
                    throw "";
                }
                gl.cache.indices.set(index, buffer);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(index.indices), gl.STATIC_DRAW);
            }
            return buffer;
        }

        /**
         * 清理缓冲
         */
        static clear(index: Index)
        {
            GL.glList.forEach(gl =>
            {
                var buffer = gl.cache.indices.get(index);
                if (buffer)
                {
                    gl.deleteBuffer(buffer);
                    gl.cache.indices.delete(index);
                }
            });
        }
    }
}