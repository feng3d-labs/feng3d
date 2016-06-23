module me.feng3d {

    /**
     * 渲染代码工具
     * @author feng 2016-06-22
     */
    export class ShaderCodeUtils {

        /**
         * 获取程序属性列表
         */
        static getAttributes(code: string) {

            var attributeReg = /attribute\s+(\w+)\s+(\w+)/g;
            var result = attributeReg.exec(code);

            var attributes: { [name: string]: { type: string } } = {};//属性{类型，名称}
            while (result) {
                attributes[result[2]] = { type: result[1] };
                result = attributeReg.exec(code);
            }

            return attributes;
        }

        /**
         * 获取程序常量列表
         */
        static getUniforms(code: string) {

            var uniforms: { [name: string]: { type: string } } = {};

            var uniformReg = /uniform\s+(\w+)\s+(\w+)/g;
            var result = uniformReg.exec(code);

            while (result) {

                uniforms[result[2]] = { type: result[1] };
                result = uniformReg.exec(code);
            }

            return uniforms;
        }

        /**
         * 获取WebGLProgram
         * @param context3D     3D环境上下文
         * @param vertexCode    顶点着色器代码
         * @param fragmentCode  片段着色器代码
         * @return  WebGL程序
         */
        static getWebGLProgram(context3D: WebGLRenderingContext, vertexCode: string, fragmentCode: string) {

            var vertexShader = context3DPool.getVertexShader(context3D, vertexCode);
            var fragmentShader = context3DPool.getFragmentShader(context3D, fragmentCode);
            // 创建渲染程序
            var shaderProgram = context3D.createProgram();
            context3D.attachShader(shaderProgram, vertexShader);
            context3D.attachShader(shaderProgram, fragmentShader);
            context3D.linkProgram(shaderProgram);

            // 渲染程序创建失败时给出弹框
            if (!context3D.getProgramParameter(shaderProgram, context3D.LINK_STATUS)) {
                alert("无法初始化渲染程序。");
            }

            return shaderProgram;
        }

        /**
         * 获取顶点渲染程序
         * @param context3D         3D环境上下文
         * @param vertexCode        顶点渲染代码
         * @return                  顶点渲染程序
         */
        static getVertexShader(context3D: WebGLRenderingContext, vertexCode: string) {

            var shader = context3D.createShader(WebGLRenderingContext.VERTEX_SHADER);
            shader = ShaderCodeUtils.compileShader(context3D, shader, vertexCode);
            return shader;
        }

        /**
         * 获取片段渲染程序
         * @param context3D         3D环境上下文
         * @param fragmentCode      片段渲染代码
         * @return                  片段渲染程序
         */
        static getFragmentShader(context3D: WebGLRenderingContext, fragmentCode: string) {

            var shader = context3D.createShader(WebGLRenderingContext.FRAGMENT_SHADER);
            shader = ShaderCodeUtils.compileShader(context3D, shader, fragmentCode);
            return shader;
        }

        /**
         * 编译渲染程序
         * @param context3D         3D环境上下文
         * @param shader            渲染程序
         * @param shaderCode        渲染代码
         * @return                  完成编译的渲染程序
         */
        static compileShader(context3D: WebGLRenderingContext, shader: WebGLShader, shaderCode: string) {

            context3D.shaderSource(shader, shaderCode);
            context3D.compileShader(shader);
            if (!context3D.getShaderParameter(shader, context3D.COMPILE_STATUS)) {
                alert("编译渲染程序是发生错误: " + context3D.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        }

    }
}