module me.feng3d {

    /**
     * 对象池
     * @author feng 2016-04-26
     */
    export class RenderBufferPool {

        /**
         * @param context3D     3D环境
         */
        private getContext3DBufferPool(context3D: WebGLRenderingContext) {

            //获取3D环境唯一标识符
            var context3DUID = getUID(context3D);
            return this.context3DBufferPools[context3DUID] = this.context3DBufferPools[context3DUID] || new Context3DBufferPool(context3D);
        }

        /**
         * 获取渲染程序
         * @param context3D     3D环境
         * @param vertexCode    顶点着色器代码
         * @param fragmentCode  片段着色器代码
         * @return  渲染程序
         */
        getWebGLProgram(context3D: WebGLRenderingContext, vertexCode: string, fragmentCode: string): WebGLProgram {

            var shaderCode = [vertexCode, fragmentCode].join("\n--- shaderCode ---\n");
            return this.getContext3DBufferPool(context3D).getWebGLProgram(vertexCode, fragmentCode);
        }

	    /**
         * 获取顶点渲染程序
         * @param context3D         3D环境
         * @param vertexCode        顶点渲染代码
         * @return                  顶点渲染程序
         */
        getVertexShader(context3D: WebGLRenderingContext, vertexCode: string) {

            return this.getContext3DBufferPool(context3D).getVertexShader(vertexCode);
        }

	    /**
         * 获取顶点渲染程序
         * @param context3D         3D环境
         * @param fragmentCode      顶点渲染代码
         * @return                  顶点渲染程序
         */
        getFragmentShader(context3D: WebGLRenderingContext, fragmentCode: string) {

            return this.getContext3DBufferPool(context3D).getFragmentShader(fragmentCode);
        }

        /**
         * 3D环境缓冲池
         */
        private context3DBufferPools: { [context3DUID: string]: Context3DBufferPool } = {};
    }

    /**
     * 3D环境缓冲池
     */
    class Context3DBufferPool {

        /**
         * 3D环境
         */
        private context3D: WebGLRenderingContext;

        /**
         * 构建3D环境缓冲池
         * @param context3D         3D环境
         */
        constructor(context3D: WebGLRenderingContext) {
            this.context3D = context3D;
        }

	    /**
         * 获取渲染程序
         * @param vertexCode    顶点着色器代码
         * @param fragmentCode  片段着色器代码
         * @return  渲染程序
         */
        getWebGLProgram(vertexCode: string, fragmentCode: string): WebGLProgram {

            //获取3D环境唯一标识符
            var shaderCode = [vertexCode, fragmentCode].join("\n--- shaderCode ---\n");
            //获取3D环境中的渲染程序对象池
            return this.webGLProgramPool[shaderCode] = this.webGLProgramPool[shaderCode] || ShaderCodeUtils.getWebGLProgram(this.context3D, vertexCode, fragmentCode);
        }

        /**
         * 获取顶点渲染程序
         * @param vertexCode        顶点渲染代码
         * @return                  顶点渲染程序
         */
        getVertexShader(vertexCode: string) {

            return this.vertexShaderPool[vertexCode] = this.vertexShaderPool[vertexCode] || ShaderCodeUtils.getVertexShader(this.context3D, vertexCode);
        }

        /**
         * 获取顶点渲染程序
         * @param fragmentCode      顶点渲染代码
         * @return                  顶点渲染程序
         */
        getFragmentShader(fragmentCode: string) {

            return this.fragmentShaderPool[fragmentCode] = this.fragmentShaderPool[fragmentCode] || ShaderCodeUtils.getFragmentShader(this.context3D, fragmentCode);
        }

        /** 渲染程序对象池 */
        private webGLProgramPool: { [shaderCode: string]: WebGLProgram } = {};

        /** 顶点渲染程序对象池 */
        private vertexShaderPool: { [vertexCode: string]: WebGLShader } = {};

        /** 顶点渲染程序对象池 */
        private fragmentShaderPool: { [fragmentCode: string]: WebGLShader } = {};
    }

    /**
     * 3D环境对象池
     */
    export var context3DPool = new RenderBufferPool();
}