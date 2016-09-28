module me.feng3d {

    /**
     * 渲染缓冲
     * @author feng 2016-06-20
     */
    export class RenderBuffer {

        /**
         * 3D上下文
         */
        private context3D: WebGLRenderingContext;

        /**
         * 渲染数据
         */
        private renderData: RenderData;

        /**
         * 构建渲染缓冲
         * @param context3D     3D环境
         * @param renderData    渲染数据
         */
        constructor(context3D: WebGLRenderingContext, renderData: RenderData) {

            this.context3D = context3D;
            this.renderData = renderData;
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

            var programBuffer = this.renderData.programBuffer;
            var shaderProgram = context3DPool.getWebGLProgram(this.context3D, programBuffer.vertexCode, programBuffer.fragmentCode);
            this.context3D.useProgram(shaderProgram);
        }

        /**
         * 激活属性
         */
        private activeAttributes() {

            var attributes = this.renderData.attributes;
            var locations = ShaderCodeUtils.getAttribLocations(this.context3D, this.renderData.programBuffer.vertexCode, this.renderData.programBuffer.fragmentCode);

            for (var name in locations) {
                if (locations.hasOwnProperty(name)) {
                    var element = locations[name];
                    var buffer = attributes[name].buffer;

                    var squareVerticesBuffer = context3DPool.getVABuffer(this.context3D, buffer.data);

                    this.context3D.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, squareVerticesBuffer);
                    this.context3D.vertexAttribPointer(element.location, 3, WebGLRenderingContext.FLOAT, false, 0, 0);
                }
            }
        }

        /**
         * 激活常量
         */
        private activeUniforms() {

            var uniforms = this.renderData.uniforms;

            //获取属性在gpu中地址
            var programBuffer = this.renderData.programBuffer;
            var shaderProgram = context3DPool.getWebGLProgram(this.context3D, programBuffer.vertexCode, programBuffer.fragmentCode);

            for (var name in uniforms) {
                if (uniforms.hasOwnProperty(name)) {
                    var item = uniforms[name];
                    var data = item.buffer.data;
                    var type = item.type;
                    var location = this.context3D.getUniformLocation(shaderProgram, name);
                    switch (type) {
                        case "mat4":
                            this.context3D.uniformMatrix4fv(location, false, (<Matrix3D>data).rawData);
                            break;
                        case "vec4":
                            var vec4 = <Vec4>data;
                            this.context3D.uniform4f(location, vec4.x, vec4.y, vec4.z, vec4.w);
                            break;
                        default:
                            throw `无法识别的uniform类型 ${type}`;
                    }
                }
            }
        }

        /**
         * 绘制
         */
        private draw() {

            var indexBuffer = this.renderData.indexBuffer;

            var buffer = context3DPool.getIndexBuffer(this.context3D, indexBuffer.indices);

            var count = indexBuffer.indices.length;
            this.context3D.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, buffer);
            // this.context3D.drawElements(WebGLRenderingContext.POINTS, count, WebGLRenderingContext.UNSIGNED_SHORT, 0);
            this.context3D.drawElements(WebGLRenderingContext.LINE_LOOP, count, WebGLRenderingContext.UNSIGNED_SHORT, 0);
            // this.context3D.drawElements(WebGLRenderingContext.LINE_STRIP, count, WebGLRenderingContext.UNSIGNED_SHORT, 0);
            // this.context3D.drawElements(WebGLRenderingContext.LINES, count, WebGLRenderingContext.UNSIGNED_SHORT, 0);
            // this.context3D.drawElements(WebGLRenderingContext.TRIANGLES, count, WebGLRenderingContext.UNSIGNED_SHORT, 0);
            // this.context3D.drawElements(WebGLRenderingContext.TRIANGLE_STRIP, count, WebGLRenderingContext.UNSIGNED_SHORT, 0);
            // this.context3D.drawElements(WebGLRenderingContext.TRIANGLE_FAN, count, WebGLRenderingContext.UNSIGNED_SHORT, 0);
        }
    }
}