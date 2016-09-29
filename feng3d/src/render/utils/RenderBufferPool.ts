module feng3d {

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
         * 获取索引缓冲
         */
        getIndexBuffer(context3D: WebGLRenderingContext, indices: Uint16Array) {

            return this.getContext3DBufferPool(context3D).getIndexBuffer(indices);
        }

        /**
         * 获取顶点属性缓冲
         * @param data  数据 
         */
        getVABuffer(context3D: WebGLRenderingContext, data: Float32Array): WebGLBuffer {

            return this.getContext3DBufferPool(context3D).getVABuffer(data);
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
            return this.webGLProgramPool[shaderCode] = this.webGLProgramPool[shaderCode] || getWebGLProgram(this.context3D, vertexCode, fragmentCode);
        }

        /**
         * 获取顶点渲染程序
         * @param vertexCode        顶点渲染代码
         * @return                  顶点渲染程序
         */
        getVertexShader(vertexCode: string) {

            return this.vertexShaderPool[vertexCode] = this.vertexShaderPool[vertexCode] || getVertexShader(this.context3D, vertexCode);
        }

        /**
         * 获取顶点渲染程序
         * @param fragmentCode      顶点渲染代码
         * @return                  顶点渲染程序
         */
        getFragmentShader(fragmentCode: string) {

            return this.fragmentShaderPool[fragmentCode] = this.fragmentShaderPool[fragmentCode] || getFragmentShader(this.context3D, fragmentCode);
        }

        /**
         * 获取索引缓冲
         */
        getIndexBuffer(indices: Uint16Array) {

            var indexBuffer = this.getBuffer(indices, WebGLRenderingContext.ELEMENT_ARRAY_BUFFER);
            return indexBuffer;
        }

        /**
         * 获取顶点属性缓冲
         * @param data  数据 
         */
        getVABuffer(data: Float32Array): WebGLBuffer {
            var buffer = this.getBuffer(data, WebGLRenderingContext.ARRAY_BUFFER);
            return buffer;
        }

        /**
         * 获取缓冲
         * @param data  数据
         */
        private getBuffer(data: ArrayBufferView | ArrayBuffer, target: number) {

            var context3D = this.context3D;
            var dataUID = getUID(data);
            var buffer = this.bufferMap[dataUID] = this.bufferMap[dataUID] || context3D.createBuffer();

            if (!version.equal(data, buffer)) {
                context3D.bindBuffer(target, buffer);
                context3D.bufferData(target, data, WebGLRenderingContext.STATIC_DRAW);
                version.setVersion(buffer, version.getVersion(data));

                //升级buffer和数据版本号一致
                var dataVersion = Math.max(0, version.getVersion(data));
                version.setVersion(data, dataVersion);
                version.setVersion(buffer, dataVersion);
            }

            return buffer;
        }

        /** 渲染程序对象池 */
        private webGLProgramPool: { [shaderCode: string]: WebGLProgram } = {};

        /** 顶点渲染程序对象池 */
        private vertexShaderPool: { [vertexCode: string]: WebGLShader } = {};

        /** 顶点渲染程序对象池 */
        private fragmentShaderPool: { [fragmentCode: string]: WebGLShader } = {};

        /**
         * 缓冲字典
         */
        private bufferMap: { [dataUID: string]: WebGLBuffer } = {};
    }

    /**
     * 获取WebGLProgram
     * @param context3D     3D环境上下文
     * @param vertexCode    顶点着色器代码
     * @param fragmentCode  片段着色器代码
     * @return  WebGL程序
     */
    function getWebGLProgram(context3D: WebGLRenderingContext, vertexCode: string, fragmentCode: string) {

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
    function getVertexShader(context3D: WebGLRenderingContext, vertexCode: string) {

        var shader = context3D.createShader(WebGLRenderingContext.VERTEX_SHADER);
        shader = compileShader(context3D, shader, vertexCode);
        return shader;
    }

    /**
     * 获取片段渲染程序
     * @param context3D         3D环境上下文
     * @param fragmentCode      片段渲染代码
     * @return                  片段渲染程序
     */
    function getFragmentShader(context3D: WebGLRenderingContext, fragmentCode: string) {

        var shader = context3D.createShader(WebGLRenderingContext.FRAGMENT_SHADER);
        shader = compileShader(context3D, shader, fragmentCode);
        return shader;
    }

    /**
     * 编译渲染程序
     * @param context3D         3D环境上下文
     * @param shader            渲染程序
     * @param shaderCode        渲染代码
     * @return                  完成编译的渲染程序
     */
    function compileShader(context3D: WebGLRenderingContext, shader: WebGLShader, shaderCode: string) {

        context3D.shaderSource(shader, shaderCode);
        context3D.compileShader(shader);
        if (!context3D.getShaderParameter(shader, context3D.COMPILE_STATUS)) {
            alert("编译渲染程序是发生错误: " + context3D.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    /**
     * 3D环境对象池
     */
    export var context3DPool = new RenderBufferPool();
}