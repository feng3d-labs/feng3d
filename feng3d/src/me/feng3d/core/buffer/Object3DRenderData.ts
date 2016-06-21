module me.feng3d {

    /**
     * 3D对象渲染数据
     * @author feng 2016-06-20
     */
    export class Object3DRenderData {

        object3D: Object3D

        /**
         * 顶点索引缓冲
         */
        indexBuffer: IndexBuffer;

        /**
         * 渲染程序缓存
         */
        programBuffer: ProgramBuffer;

        /**
         * 属性数据列表
         */
        attributes: { [name: string]: { type: string, buffer?: AttributeBuffer } };

        /**
         * 常量数据列表
         */
        uniforms: { [name: string]: { type: string, buffer?: UniformBuffer } };

        /**
         * 渲染数据字典
         */
        private static renderDataMap = new Map<Object3D, Object3DRenderData>();

        /**
         * 获取3D对象渲染数据实例
         */
        static getInstance(object3D: Object3D) {

            var renderData = this.renderDataMap.get(object3D);
            if (!renderData) {
                renderData = new Object3DRenderData(object3D);
                this.renderDataMap.push(object3D, renderData);
            }
            return renderData;
        }

        private renderBufferMap = new Map<WebGLRenderingContext, Object3DBuffer>();

        getRenderBuffer(context3D: WebGLRenderingContext) {

            var renderBuffer = this.renderBufferMap.get(context3D);
            if (!renderBuffer) {
                renderBuffer = new Object3DBuffer(context3D, this);
                this.renderBufferMap.push(context3D, renderBuffer);
            }
            return renderBuffer;
        }

        /**
         * 构建3D对象渲染数据
         */
        constructor(object3D: Object3D) {
            this.object3D = object3D;
        }

        /**
         * 准备数据
         */
        prepare() {

            this.prepareProgram();
            this.prepareIndex();
            this.prepareAttributes();
            this.prepareUniforms();
        }

        /**
         * 准备程序
         */
        private prepareProgram() {

            //从Object3D中获取顶点缓冲
            var eventData: GetProgramBufferEventData = { buffer: null };
            this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_PROGRAMBUFFER, eventData), Number.MAX_VALUE);
            assert(eventData.buffer != null);
            this.programBuffer = eventData.buffer;
        }

        /**
         * 准备索引
         */
        private prepareIndex() {

            //从Object3D中获取顶点缓冲
            var eventData: GetIndexBufferEventData = { buffer: null };
            this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_INDEXBUFFER, eventData), Number.MAX_VALUE);
            assert(eventData.buffer != null);
            this.indexBuffer = eventData.buffer;
        }

        /**
         * 准备属性
         */
        private prepareAttributes() {

            this.attributes = this.programBuffer.getAttributes();
            for (var name in this.attributes) {
                //从Object3D中获取顶点缓冲
                var eventData: GetAttributeBufferEventData = { name: name, buffer: null };
                this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_ATTRIBUTEBUFFER, eventData), Number.MAX_VALUE);
                assert(eventData.buffer != null);

                this.attributes[name].buffer = eventData.buffer;
            }
        }

        /**
         * 准备常量
         */
        private prepareUniforms() {

            this.uniforms = this.programBuffer.getUniforms();

            for (var name in this.uniforms) {
                //从Object3D中获取顶点缓冲
                var eventData: GetUniformBufferEventData = { name: name, buffer: null };
                this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_UNIFORMBUFFER, eventData), Number.MAX_VALUE);
                assert(eventData.buffer != null);

                this.uniforms[name].buffer = eventData.buffer;
            }
        }
    }
}