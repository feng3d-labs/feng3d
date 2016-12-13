module feng3d {

    /**
     * 3D对象渲染数据
     * @author feng 2016-06-20
     */
    export class RenderData {

        object3D: Object3D

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
        uniforms: { [name: string]: Matrix3D | Vec4; } = {};

        /**
         * 渲染模式
         */
        renderMode = RenderMode.TRIANGLES;

        /**
         * 渲染数据字典
         */
        private static renderDataMap = new Map<Object3D, RenderData>();

        /**
         * 获取3D对象渲染数据实例
         */
        static getInstance(object3D: Object3D) {

            var renderData = this.renderDataMap.get(object3D);
            if (!renderData) {
                renderData = new RenderData(object3D);
                this.renderDataMap.push(object3D, renderData);
            }
            return renderData;
        }

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
         * 构建3D对象渲染数据
         */
        constructor(object3D: Object3D) {
            this.object3D = object3D;
        }

        /**
         * 准备数据
         */
        prepare() {

            this.object3D.activate(this);
        }
    }
}