module feng3d
{

    /**
     * 对象池
     * @author feng 2016-04-26
     */
    export class RenderBufferPool
    {

        /**
         * @param gl     3D环境
         */
        private getContext3DBufferPool(gl: GL)
        {
            //获取3D环境唯一标识符
            var context3DUID = UIDUtils.getUID(gl);
            return this.context3DBufferPools[context3DUID] = this.context3DBufferPools[context3DUID] || new Context3DBufferPool(gl);
        }

        /**
         * 获取渲染程序
         * @param gl     3D环境
         * @param vertexCode    顶点着色器代码
         * @param fragmentCode  片段着色器代码
         * @return  渲染程序
         */
        public getWebGLProgram(gl: GL, vertexCode: string, fragmentCode: string): WebGLProgram
        {
            return this.getContext3DBufferPool(gl).getWebGLProgram(vertexCode, fragmentCode);
        }

	    /**
         * 获取顶点渲染程序
         * @param gl         3D环境
         * @param vertexCode        顶点渲染代码
         * @return                  顶点渲染程序
         */
        public getVertexShader(gl: GL, vertexCode: string)
        {
            return this.getContext3DBufferPool(gl).getVertexShader(vertexCode);
        }

	    /**
         * 获取顶点渲染程序
         * @param gl         3D环境
         * @param fragmentCode      顶点渲染代码
         * @return                  顶点渲染程序
         */
        public getFragmentShader(gl: GL, fragmentCode: string)
        {
            return this.getContext3DBufferPool(gl).getFragmentShader(fragmentCode);
        }

        /**
         * 获取索引缓冲
         */
        public getIndexBuffer(gl: GL, indices: Uint16Array)
        {
            return this.getContext3DBufferPool(gl).getIndexBuffer(indices);
        }

        /**
         * 获取顶点属性缓冲
         * @param data  数据 
         */
        public getVABuffer(gl: GL, data: Float32Array): WebGLBuffer
        {
            return this.getContext3DBufferPool(gl).getVABuffer(data);
        }

        /**
         * 3D环境缓冲池
         */
        private context3DBufferPools: { [context3DUID: string]: Context3DBufferPool } = {};
    }

    /**
     * 3D环境缓冲池
     */
    class Context3DBufferPool
    {

        /**
         * 3D环境
         */
        private gl: GL;

        /**
         * 构建3D环境缓冲池
         * @param gl         3D环境
         */
        constructor(gl: GL)
        {
            this.gl = gl;
        }

	    /**
         * 获取渲染程序
         * @param vertexCode    顶点着色器代码
         * @param fragmentCode  片段着色器代码
         * @return  渲染程序
         */
        public getWebGLProgram(vertexCode: string, fragmentCode: string): WebGLProgram
        {
            //获取3D环境唯一标识符
            var shaderCode = [vertexCode, fragmentCode].join("\n--- shaderCode ---\n");
            //获取3D环境中的渲染程序对象池
            return this._webGLProgramPool[shaderCode] = this._webGLProgramPool[shaderCode] || getWebGLProgram(this.gl, vertexCode, fragmentCode);
        }

        /**
         * 获取顶点渲染程序
         * @param vertexCode        顶点渲染代码
         * @return                  顶点渲染程序
         */
        public getVertexShader(vertexCode: string)
        {
            return this._vertexShaderPool[vertexCode] = this._vertexShaderPool[vertexCode] || getVertexShader(this.gl, vertexCode);
        }

        /**
         * 获取顶点渲染程序
         * @param fragmentCode      顶点渲染代码
         * @return                  顶点渲染程序
         */
        public getFragmentShader(fragmentCode: string)
        {
            return this._fragmentShaderPool[fragmentCode] = this._fragmentShaderPool[fragmentCode] || getFragmentShader(this.gl, fragmentCode);
        }

        /**
         * 获取索引缓冲
         */
        public getIndexBuffer(indices: Uint16Array)
        {
            var indexBuffer = this.getBuffer(indices, GL.ELEMENT_ARRAY_BUFFER);
            return indexBuffer;
        }

        /**
         * 获取顶点属性缓冲
         * @param data  数据 
         */
        public getVABuffer(data: Float32Array): WebGLBuffer
        {
            var buffer = this.getBuffer(data, GL.ARRAY_BUFFER);
            return buffer;
        }

        /**
         * 获取缓冲
         * @param data  数据
         */
        private getBuffer(data: ArrayBufferView | ArrayBuffer, target: number)
        {
            var gl = this.gl;
            var dataUID = UIDUtils.getUID(data);
            var buffer = this._bufferMap[dataUID] = this._bufferMap[dataUID] || gl.createBuffer();

            if (!VersionUtils.equal(data, buffer))
            {
                gl.bindBuffer(target, buffer);
                gl.bufferData(target, data, GL.STATIC_DRAW);
                VersionUtils.setVersion(buffer, VersionUtils.getVersion(data));

                //升级buffer和数据版本号一致
                var dataVersion = Math.max(0, VersionUtils.getVersion(data));
                VersionUtils.setVersion(data, dataVersion);
                VersionUtils.setVersion(buffer, dataVersion);
            }

            return buffer;
        }

        /** 渲染程序对象池 */
        private _webGLProgramPool: { [shaderCode: string]: WebGLProgram } = {};

        /** 顶点渲染程序对象池 */
        private _vertexShaderPool: { [vertexCode: string]: WebGLShader } = {};

        /** 顶点渲染程序对象池 */
        private _fragmentShaderPool: { [fragmentCode: string]: WebGLShader } = {};

        /**
         * 缓冲字典
         */
        private _bufferMap: { [dataUID: string]: WebGLBuffer } = {};
    }

    /**
     * 获取WebGLProgram
     * @param gl     3D环境上下文
     * @param vertexCode    顶点着色器代码
     * @param fragmentCode  片段着色器代码
     * @return  WebGL程序
     */
    function getWebGLProgram(gl: GL, vertexCode: string, fragmentCode: string)
    {
        var vertexShader = context3DPool.getVertexShader(gl, vertexCode);
        var fragmentShader = context3DPool.getFragmentShader(gl, fragmentCode);

        if (!vertexShader || !fragmentShader)
        {
            return null;
        }
        // 创建渲染程序
        var program = gl.createProgram();
        if (!program)
        {
            return null;
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        // 渲染程序创建失败时给出弹框
        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked)
        {
            var error = gl.getProgramInfoLog(program);
            console.log('Failed to link program: ' + error + `\n${vertexCode}\n${fragmentCode}`);
            gl.deleteProgram(program);
            gl.deleteShader(fragmentShader);
            gl.deleteShader(vertexShader);
            return null;
        }

        return program;
    }

    /**
     * 获取顶点渲染程序
     * @param gl         3D环境上下文
     * @param vertexCode        顶点渲染代码
     * @return                  顶点渲染程序
     */
    function getVertexShader(gl: GL, vertexCode: string)
    {
        var shader = gl.createShader(GL.VERTEX_SHADER);
        if (shader == null)
        {
            console.log('unable to create shader');
            return null;
        }
        shader = compileShader(gl, shader, vertexCode);
        return shader;
    }

    /**
     * 获取片段渲染程序
     * @param gl         3D环境上下文
     * @param fragmentCode      片段渲染代码
     * @return                  片段渲染程序
     */
    function getFragmentShader(gl: GL, fragmentCode: string)
    {
        var shader = gl.createShader(GL.FRAGMENT_SHADER);
        if (shader == null)
        {
            console.log('unable to create shader');
            return null;
        }
        shader = compileShader(gl, shader, fragmentCode);
        return shader;
    }

    /**
     * 编译渲染程序
     * @param gl         3D环境上下文
     * @param shader            渲染程序
     * @param shaderCode        渲染代码
     * @return                  完成编译的渲染程序
     */
    function compileShader(gl: GL, shader: WebGLShader, shaderCode: string)
    {
        gl.shaderSource(shader, shaderCode);
        gl.compileShader(shader);
        // Check the result of compilation
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled)
        {
            var error = gl.getShaderInfoLog(shader);
            console.log(`编译渲染程序时发生错误: ${error} \n ${gl.getShaderInfoLog(shader)}\n${shaderCode}`);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    /**
     * 3D环境对象池
     */
    export var context3DPool = new RenderBufferPool();
}