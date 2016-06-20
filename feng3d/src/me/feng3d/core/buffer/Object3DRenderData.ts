module me.feng3d {

    /**
     * 3D对象渲染数据
     * @author feng 2016-06-20
     */
    export class Object3DRenderData {

        object3D: Object3D

        /**
         * 渲染程序缓存
         */
        programBuffer: ProgramBuffer;

        /**
         * 属性数据列表
         */
        attributes: { [name: string]: { type: string, buffer?: AttributeBuffer } };

        constructor(object3D: Object3D) {
            this.object3D = object3D;
        }

        /**
         * 准备数据
         */
        prepare() {

            this.prepareProgram();
            this.prepareAttributes();
        }

        /**
         * 激活程序
         */
        private prepareProgram() {

            //从Object3D中获取顶点缓冲
            var eventData: GetProgramBufferEventData = { buffer: null };
            this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_PROGRAMBUFFER, eventData), Number.MAX_VALUE);
            assert(eventData.buffer != null);
            this.programBuffer = eventData.buffer;
        }

        /**
         * 激活属性
         */
        private prepareAttributes() {

            if (this.attributes == null) {

                this.attributes = this.programBuffer.getAttributes();
                for (var name in this.attributes) {
                    //从Object3D中获取顶点缓冲
                    var eventData: GetAttributeBufferEventData = { name: name, buffer: null };
                    this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_ATTRIBUTEBUFFER, eventData), Number.MAX_VALUE);
                    assert(eventData.buffer != null);

                    this.attributes[name].buffer = eventData.buffer;
                }
            }
        }
    }
}