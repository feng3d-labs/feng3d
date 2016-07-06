module me.feng3d {

    /**
     * 渲染程序数据
     * @author feng 2016-05-09
     */
    export class ProgramRenderData {

        /**
         * 顶点渲染程序代码
         */
        vertexCode: string;

        /**
         * 片段渲染程序代码
         */
        fragmentCode: string;

        /**
         * 获取属性gpu地址
         */
        getAttribLocations(context3D: WebGLRenderingContext) {

            var attributes: { [name: string]: { type: string, location?: number } } = ShaderCodeUtils.getAttributes(this.vertexCode);
            //获取属性在gpu中地址
            var shaderProgram = context3DPool.getWebGLProgram(context3D, this.vertexCode, this.fragmentCode);
            for (var name in attributes) {
                if (attributes.hasOwnProperty(name)) {
                    var element = attributes[name];
                    element.location = context3D.getAttribLocation(shaderProgram, name);
                    context3D.enableVertexAttribArray(element.location);
                }
            }
            return attributes;
        }

        /**
         * 获取属性列表
         */
        getAttributes() {

            var attributes: { [name: string]: { type: string } } = ShaderCodeUtils.getAttributes(this.vertexCode);
            return attributes;
        }

        /**
         * 获取常量
         */
        getUniforms() {

            var uniforms: { [name: string]: { type: string } } = ShaderCodeUtils.getUniforms(this.vertexCode);
            return uniforms;
        }
    }
}