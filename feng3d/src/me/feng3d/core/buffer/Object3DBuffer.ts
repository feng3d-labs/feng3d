module me.feng3d {

    /**
     * 3D对象缓冲
     * @author feng 2016-06-20
     */
    export class Object3DBuffer {

        /**
         * 3D上下文
         */
        private context3D: WebGLRenderingContext;

        /**
         * 渲染对象
         */
        private object3D: Object3D;

        /**
         * 渲染数据
         */
        private renderData: Object3DRenderData;

        constructor(context3D: WebGLRenderingContext, object3D: Object3D) {
            this.context3D = context3D;
            this.object3D = object3D;

            this.renderData = new Object3DRenderData(object3D);
        }

        /**
         * 激活缓冲
         */
        active() {

            this.renderData.prepare();

            this.activeProgram();
            this.activeAttributes();
            this.activeUniforms();
            this.draw();
        }

        /**
         * 激活程序
         */
        public activeProgram() {

            this.renderData.programBuffer.active(this.context3D);
        }

        /**
         * 激活属性
         */
        private activeAttributes() {

            var attributes = this.renderData.attributes;
            var locations = this.renderData.programBuffer.getAttribLocations(this.context3D);

            for (var name in locations) {
                if (locations.hasOwnProperty(name)) {
                    var element = locations[name];
                    var buffer = attributes[name].buffer;

                    var squareVerticesBuffer = Context3DBufferCenter.getInstance(this.context3D)//
                        .getVABuffer(buffer.data);
                    this.context3D.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, squareVerticesBuffer);
                    this.context3D.vertexAttribPointer(element.location, 3, WebGLRenderingContext.FLOAT, false, 0, 0);
                }
            }
        }

        /**
         * 激活常量
         */
        activeUniforms() {

            var uniforms = this.renderData.uniforms;

            //获取属性在gpu中地址
            var shaderProgram = this.renderData.programBuffer.getShaderProgram(this.context3D);

            for (var name in uniforms) {
                if (uniforms.hasOwnProperty(name)) {
                    var element = uniforms[name];
                    var location = this.context3D.getUniformLocation(shaderProgram, name);
                    this.context3D.uniformMatrix4fv(location, false, element.buffer.matrix.rawData);
                }
            }
        }

        /**
         * 绘制
         */
        private draw() {

            var indexBuffer = this.renderData.indexBuffer;

            var buffer = Context3DBufferCenter.getInstance(this.context3D)//
                .getIndexBuffer(indexBuffer.indices);

            var count = indexBuffer.indices.length;
            this.context3D.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, buffer);
            this.context3D.drawElements(WebGLRenderingContext.TRIANGLES, count, WebGLRenderingContext.UNSIGNED_SHORT, 0);
        }
    }
}