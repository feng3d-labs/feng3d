module me.feng3d {

    /**
     * 索引缓冲
     */
    export class IndexBuffer extends Component {

        /**
         * 索引数据
         */
        indices: Uint16Array;

        /**
         * 索引缓冲
         */
        constructor() {

            super();
            this.addEventListener(Context3DBufferEvent.GET_INDEXBUFFER, this.onGetIndexBuffer, this)
        }

        /**
         * 绘制
         * @param context3D    3D渲染环境
         */
        draw(context3D: WebGLRenderingContext) {

            var indexBuffer = Context3DBufferCenter.getInstance(context3D)//
                .getIndexBuffer(this.indices);

            var count = this.indices.length;
            context3D.bindBuffer(context3D.ELEMENT_ARRAY_BUFFER, indexBuffer);
            context3D.drawElements(context3D.TRIANGLES, count, context3D.UNSIGNED_SHORT, 0);
        }

        /**
         * 处理获取索引缓冲事件
         */
        private onGetIndexBuffer(event: Context3DBufferEvent) {

            var eventData: GetIndexBufferEventData = event.data;
            eventData.buffer = this;
        }
    }
}