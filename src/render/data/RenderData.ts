module feng3d {

    /**
     * 3D对象渲染数据
     * @author feng 2016-06-20
     */
    export class RenderData {

        /**
         * 顶点索引缓冲
         */
        indexBuffer: IndexRenderData;

        /**
         * 渲染程序缓存
         */
        programBuffer: ProgramRenderData;

        /**
         * 属性数据列表
         */
        attributes: { [name: string]: AttributeRenderData } = {};

        /**
         * 常量数据列表
         */
        uniforms: { [name: string]: Matrix3D | Vector3D; } = {};

        /**
         * 渲染模式
         */
        renderMode = RenderMode.TRIANGLES;

        private renderBufferMap = new Map<WebGLRenderingContext, RenderBuffer>();

        public getRenderBuffer(context3D: WebGLRenderingContext) {

            var renderBuffer = this.renderBufferMap.get(context3D);
            if (!renderBuffer) {
                renderBuffer = new RenderBuffer(context3D, this);
                this.renderBufferMap.push(context3D, renderBuffer);
            }
            return renderBuffer;
        }

        /**
         * 绘制  
         */
        public draw(context3D: WebGLRenderingContext) {

            var object3DBuffer = this.getRenderBuffer(context3D);
            object3DBuffer.active();
        }
    }
}