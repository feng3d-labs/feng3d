module me.feng3d {

    /**
     * 顶点索引缓冲
     */
    export class IndexBuffer {

        /**
         * 索引数据
         */
        indices: Uint16Array;

        getBuffer(context3D: WebGLRenderingContext) {

            var indexBuffer = context3DBufferCenter.getIndexBuffer(context3D, this.indices);
            return indexBuffer;
        }
    }
}