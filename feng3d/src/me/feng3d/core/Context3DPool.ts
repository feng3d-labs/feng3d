module me.feng3d {

    /**
     * 对象池
     * @author feng 2016-04-26
     */
    export class Context3DPool {

        /**
         * 获取渲染程序
         * @param context3D     3D环境
         * @param vertexCode    顶点着色器代码
         * @param fragmentCode  片段着色器代码
         * @return  渲染程序
         */
        getWebGLProgram(context3D: WebGLRenderingContext, vertexCode: string, fragmentCode: string): WebGLProgram {

            //获取3D环境唯一标识符
            var context3DUID = getUID(context3D);
            var shaderCode = [vertexCode, fragmentCode].join("\n--- shaderCode ---\n");

            //获取3D环境中的渲染程序对象池
            var context3DwebGLProgramPool = this.webGLProgramPool[context3DUID] = this.webGLProgramPool[context3DUID] || {};
            return context3DwebGLProgramPool[shaderCode] = context3DwebGLProgramPool[shaderCode] || ShaderCodeUtils.getWebGLProgram(context3D, vertexCode, fragmentCode);
        }

	    /**
         * 获取顶点渲染程序
         * @param context3D         3D环境上下文
         * @param vertexCode        顶点渲染代码
         * @return                  顶点渲染程序
         */
        static getVertexShader(context3D: WebGLRenderingContext, vertexCode: string) {

            // var shader = context3D.createShader(WebGLRenderingContext.VERTEX_SHADER);
            // shader = ShaderCodeUtils.compileShader(context3D, shader, vertexCode);
            // return vertexShaderPool;
        }

        /** WebGLProgram对象池 */
        private webGLProgramPool: { [context3DUID: string]: { [shaderCode: string]: WebGLProgram } } = {};

        /** 顶点渲染程序对象池 */
        private vertexShaderPool: { [context3DUID: string]: { [vertexCode: string]: WebGLShader } } = {};
    }

    /**
     * 3D环境对象池
     */
    export var context3DPool = new Context3DPool();
}