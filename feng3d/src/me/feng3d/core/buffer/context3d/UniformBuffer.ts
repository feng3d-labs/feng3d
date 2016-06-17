module me.feng3d {

    /**
     * 常量缓冲
     */
    export class UniformBuffer extends Component {

        /**
         * 常量缓冲名称
         */
        name: string;

        matrix: Matrix3D;

        /**
         * 构建常量缓冲
         */
        constructor() {

            super();
            this.addEventListener(Context3DBufferEvent.GET_UNIFORMBUFFER, this.onGetUniformBuffer, this)
        }

        /**
         * 处理获取缓冲事件
         */
        private onGetUniformBuffer(event: Context3DBufferEvent) {

            var eventData: GetUniformBufferEventData = event.data;
            if (eventData.name == this.name)
                eventData.buffer = this;
        }

        /**
         * 激活缓冲
         * @param context3D     3D渲染环境
         * @param location      缓冲gpu地址
         */
        public active(context3D: WebGLRenderingContext, location: WebGLUniformLocation) {

            context3D.uniformMatrix4fv(location, false, this.matrix.rawData);
        }
    }
}