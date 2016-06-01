module me.feng3d {

    /**
     * 顶点索引缓冲
     */
    export class IndexBuffer {

        private _indices: Uint16Array;
        private _indexBuffer: WebGLBuffer;

        /**
         * 构建顶点索引缓冲
         */
        constructor(indices: Uint16Array) {

            this.indices = indices;
        }

        /**
         * 索引数据
         */
        get indices() {

            return this._indices;
        }

        set indices(value: Uint16Array) {

            this._indices = value;
            this._indexBuffer = null;
        }

        /**
         * 索引缓冲
         */
        get indexBuffer(): WebGLBuffer {

            // return this._indexBuffer = this._indexBuffer || getIndexBuffer(this._indices);
            return null;
        }
    }
}