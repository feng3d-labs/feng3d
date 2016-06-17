module me.feng3d {

    /**
     * 常量缓冲
     */
    export class UniformBuffer extends Component {

        /**
         * 常量缓冲名称
         */
        name: string;

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
    }
}