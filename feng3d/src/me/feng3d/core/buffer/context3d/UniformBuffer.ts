module me.feng3d {

    /**
     * 常量缓冲
     */
    export class UniformBuffer extends Component {

        /**
         * 名称
         */
        name: string;

        /**
         * 常量数据
         */
        data: Float32Array;

        /**
         * 构建常量缓冲
         */
        constructor() {
            super();

            this.addEventListener(Context3DBufferEvent.GET_UNIFORMBUFFER, this.onGetUniformBuffer, this)
        }

        /**
         * 处理获取常量缓冲事件
         */
        private onGetUniformBuffer(event: Context3DBufferEvent) {

            var eventData: GetUniformBufferEventData = event.data;
            if (eventData.uniformLocation.name == this.name)
                eventData.uniformBuffer = this;
        }

        /**
         * 激活
         */
        active(context3D: WebGLRenderingContext, location: WebGLUniformLocation) {

            context3D.uniformMatrix4fv(location, false, this.data);
        }
    }
}