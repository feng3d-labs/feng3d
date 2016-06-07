module me.feng3d {

    /**
     * 顶点索引缓冲
     */
    export class IndexBuffer extends Component {

        /**
         * 索引数据
         */
        indices: Uint16Array;

        /**
         * 获取缓冲
         * @param context3D    3D渲染环境
         */
        getBuffer(context3D: WebGLRenderingContext) {

            var indexBuffer = Context3DBufferCenter.getInstance(context3D)//
                .getIndexBuffer(this.indices);
            return indexBuffer;
        }
    }
}