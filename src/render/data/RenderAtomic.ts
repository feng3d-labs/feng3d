module feng3d {

    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    export class RenderAtomic {

        /**
         * 顶点索引缓冲
         */
        public indexBuffer: IndexRenderData;

        /**
         * 渲染程序缓存
         */
        public programBuffer: ProgramRenderData;

        /**
         * 属性数据列表
         */
        public attributes: { [name: string]: AttributeRenderData } = {};

        /**
         * 常量数据列表
         */
        public uniforms: { [name: string]: Matrix3D | Vector3D; } = {};

        /**
         * 渲染参数
         */
        public shaderParams = new ShaderParams();

        /**
         * 绘制  
         */
        public draw(context3D: WebGLRenderingContext) {

            this.activeProgram(context3D);
            this.activeAttributes(context3D);
            this.activeUniforms(context3D);
            this.dodraw(context3D);
        }

        /**
        * 激活程序
        */
        private activeProgram(context3D: WebGLRenderingContext) {

            var programBuffer = this.programBuffer;
            var shaderProgram = context3DPool.getWebGLProgram(context3D, programBuffer.vertexCode, programBuffer.fragmentCode);
            context3D.useProgram(shaderProgram);
        }

        /**
         * 激活属性
         */
        private activeAttributes(context3D: WebGLRenderingContext) {

            var attributes = this.attributes;
            var locations = ShaderCodeUtils.getAttribLocations(context3D, this.programBuffer.vertexCode, this.programBuffer.fragmentCode);

            for (var name in locations) {
                if (locations.hasOwnProperty(name)) {
                    var element = locations[name];
                    var buffer = attributes[name];

                    var squareVerticesBuffer = context3DPool.getVABuffer(context3D, buffer.data);

                    context3D.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, squareVerticesBuffer);
                    context3D.vertexAttribPointer(element.location, 3, WebGLRenderingContext.FLOAT, false, 0, 0);
                }
            }
        }

        /**
         * 激活常量
         */
        private activeUniforms(context3D: WebGLRenderingContext) {

            var uniforms = this.uniforms;

            //获取属性在gpu中地址
            var programBuffer = this.programBuffer;
            var shaderProgram = context3DPool.getWebGLProgram(context3D, programBuffer.vertexCode, programBuffer.fragmentCode);

            for (var name in uniforms) {
                if (uniforms.hasOwnProperty(name)) {
                    var data = uniforms[name];
                    var location = context3D.getUniformLocation(shaderProgram, name);

                    if (as(data, Matrix3D) != null) {
                        var mat4: Matrix3D = as(data, Matrix3D);
                        context3D.uniformMatrix4fv(location, false, (<Matrix3D>data).rawData);
                    } else if (as(data, Vector3D) != null) {
                        var vec4: Vector3D = as(data, Vector3D);
                        context3D.uniform4f(location, vec4.x, vec4.y, vec4.z, vec4.w);
                    } else {
                        throw `无法识别的uniform类型 ${name} ${uniforms[name]}`;
                    }

                }
            }
        }

        /**
         */
        private dodraw(context3D: WebGLRenderingContext) {

            var indexBuffer = this.indexBuffer;
            var buffer = context3DPool.getIndexBuffer(context3D, indexBuffer.indices);
            context3D.bindBuffer(indexBuffer.target, buffer);
            context3D.lineWidth(1);
            context3D.drawElements(this.shaderParams.renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset);
        }
    }
}