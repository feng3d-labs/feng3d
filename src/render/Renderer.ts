module feng3d {

    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    export class Renderer {

        private renderData = new RenderAtomic();

        /**
		 * 渲染
		 */
        public render(context3D: WebGLRenderingContext, scene: Scene3D, camera: Camera3D) {
            context3D.clear(context3D.COLOR_BUFFER_BIT | context3D.DEPTH_BUFFER_BIT);

            //绘制对象
            camera.activate(this.renderData, camera);

            var renderables = scene.getRenderables();
            renderables.forEach(element => {
                this.drawObject3D(element, context3D, camera);
            });

            camera.deactivate(this.renderData);
        }

        /**
         * 绘制3D对象
         */
        private drawObject3D(object3D: Object3D, context3D: WebGLRenderingContext, camera: Camera3D) {

            object3D.activate(this.renderData, camera);
            //
            var shaderData = shaderMap[this.renderData.shaderName] = shaderMap[this.renderData.shaderName] || new ShaderData(this.renderData.shaderName);
            if (!shaderData.isOk)
                return;
            //应用宏
            var vertexCode = ShaderLib.applyMacro(shaderData.vertexCode, this.renderData.shaderMacro);
            var fragmentCode = ShaderLib.applyMacro(shaderData.fragmentCode, this.renderData.shaderMacro);
            //渲染程序
            var shaderProgram = context3DPool.getWebGLProgram(context3D, vertexCode, fragmentCode);
            context3D.useProgram(shaderProgram);
            //
            activeAttributes(context3D, shaderProgram, this.renderData.attributes);
            activeUniforms(context3D, shaderProgram, this.renderData.uniforms);
            dodraw(context3D, this.renderData.shaderParams, this.renderData.indexBuffer);
            //
            object3D.deactivate(this.renderData);
        }
    }

    /**
     * 激活属性
     */
    function activeAttributes(context3D: WebGLRenderingContext, shaderProgram: WebGLProgram, attributes: { [name: string]: AttributeRenderData }) {

        var numAttributes = context3D.getProgramParameter(shaderProgram, context3D.ACTIVE_ATTRIBUTES);
        var i = 0;
        while (i < numAttributes) {
            var activeInfo = context3D.getActiveAttrib(shaderProgram, i++);
            var buffer = attributes[activeInfo.name];
            setContext3DAttribute(context3D, shaderProgram, activeInfo, buffer.data);
        }
    }

    /**
     * 激活常量
     */
    function activeUniforms(context3D: WebGLRenderingContext, shaderProgram: WebGLProgram, uniforms: { [name: string]: Matrix3D | Vector3D | TextureInfo; }) {

        var numUniforms = context3D.getProgramParameter(shaderProgram, context3D.ACTIVE_UNIFORMS);
        var i = 0;
        while (i < numUniforms) {
            var activeInfo = context3D.getActiveUniform(shaderProgram, i++);
            var data = uniforms[activeInfo.name];
            setContext3DUniform(context3D, shaderProgram, activeInfo, data);
        }
    }

    /**
     */
    function dodraw(context3D: WebGLRenderingContext, shaderParams: ShaderParams, indexBuffer: IndexRenderData) {

        var buffer = context3DPool.getIndexBuffer(context3D, indexBuffer.indices);
        context3D.bindBuffer(indexBuffer.target, buffer);
        context3D.lineWidth(1);
        context3D.drawElements(shaderParams.renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset);
    }

    /**
     * 设置环境属性数据
     */
    function setContext3DAttribute(context3D: WebGLRenderingContext, shaderProgram: WebGLProgram, activeInfo: WebGLActiveInfo, data) {

        var location = context3D.getAttribLocation(shaderProgram, activeInfo.name);
        context3D.enableVertexAttribArray(location);
        //
        var squareVerticesBuffer = context3DPool.getVABuffer(context3D, data);
        context3D.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, squareVerticesBuffer);
        switch (activeInfo.type) {
            case WebGLRenderingContext.FLOAT_VEC3:
                context3D.vertexAttribPointer(location, 3, WebGLRenderingContext.FLOAT, false, 0, 0);
                break;
            case WebGLRenderingContext.FLOAT_VEC2:
                context3D.vertexAttribPointer(location, 2, WebGLRenderingContext.FLOAT, false, 0, 0);
                break;
            default:
                throw `无法识别的attribute类型 ${activeInfo.name} ${data}`;
        }
    }

    /**
     * 设置环境Uniform数据
     */
    function setContext3DUniform(context3D: WebGLRenderingContext, shaderProgram: WebGLProgram, activeInfo: WebGLActiveInfo, data) {

        var location = context3D.getUniformLocation(shaderProgram, activeInfo.name);
        switch (activeInfo.type) {
            case WebGLRenderingContext.FLOAT_MAT4:
                context3D.uniformMatrix4fv(location, false, data.rawData);
                break;
            case WebGLRenderingContext.FLOAT_VEC3:
                context3D.uniform3f(location, data.x, data.y, data.z);
                break;
            case WebGLRenderingContext.FLOAT_VEC4:
                context3D.uniform4f(location, data.x, data.y, data.z, data.w);
                break;
            case WebGLRenderingContext.SAMPLER_2D:
            case WebGLRenderingContext.SAMPLER_CUBE:

                var textureData: TextureInfo = <TextureInfo>data;
                var texture = context3DPool.getTexture(context3D, textureData);

                // Enable texture unit0
                context3D.activeTexture(WebGLRenderingContext.TEXTURE0);
                // Bind the texture object to the target
                context3D.bindTexture(textureData.textureType, texture);

                context3D.pixelStorei(WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
                // Set the texture parameters
                context3D.texParameteri(textureData.textureType, WebGLRenderingContext.TEXTURE_MIN_FILTER, WebGLRenderingContext.LINEAR);
                // Set the texture unit 0 to the sampler
                context3D.uniform1i(location, 0);
                break;
            default:
                throw `无法识别的uniform类型 ${activeInfo.name} ${data}`;
        }
    }

    /**
     * 渲染所需数据
     * @author feng 2016-12-28
     */
    export interface IRenderData extends RenderAtomic { }

    //
    var shaderMap: { [name: string]: ShaderData } = {};
}