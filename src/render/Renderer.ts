module feng3d {

    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    export class Renderer extends Object3DComponent {

        /** 渲染原子 */
        private _renderAtomic = new RenderAtomic();

        /**
		 * 渲染
		 */
        public draw(context3D: WebGLRenderingContext, camera: Camera3D) {

            //更新数据
            this.object3D.updateRenderData(camera);
            //收集数据
            camera.activate(this._renderAtomic);
            this.object3D.activate(this._renderAtomic);
            //绘制
            this.drawObject3D(context3D, camera);            //
            //释放数据
            this.object3D.deactivate(this._renderAtomic);
            camera.deactivate(this._renderAtomic);
        }

        /**
         * 绘制3D对象
         */
        private drawObject3D(context3D: WebGLRenderingContext, camera: Camera3D) {

            if (!this._renderAtomic.shaderName)
                return;
            //
            var shaderData = shaderMap[this._renderAtomic.shaderName] = shaderMap[this._renderAtomic.shaderName] || new ShaderData(this._renderAtomic.shaderName);
            if (!shaderData.isOk)
                return;
            samplerIndex = 0;
            var vertexCode = shaderData.vertexCode;
            var fragmentCode = shaderData.fragmentCode;
            //应用宏
            vertexCode = ShaderLib.getMacroCode(this._renderAtomic.shaderMacro) + vertexCode;
            fragmentCode = ShaderLib.getMacroCode(this._renderAtomic.shaderMacro) + fragmentCode;
            //渲染程序
            var shaderProgram = context3DPool.getWebGLProgram(context3D, vertexCode, fragmentCode);
            context3D.useProgram(shaderProgram);
            //
            activeAttributes(context3D, shaderProgram, this._renderAtomic.attributes);
            activeUniforms(context3D, shaderProgram, this._renderAtomic.uniforms);
            dodraw(context3D, this._renderAtomic.shaderParams, this._renderAtomic.indexBuffer);
        }
    }

    var samplerIndex = 0;

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

                var textureInfo = <TextureInfo>data;
                var texture = context3DPool.getTexture(context3D, textureInfo);
                //激活纹理编号
                context3D.activeTexture(WebGLRenderingContext["TEXTURE" + samplerIndex]);
                //绑定纹理
                context3D.bindTexture(textureInfo.textureType, texture);
                //设置图片y轴方向
                context3D.pixelStorei(WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL, textureInfo.flipY);
                //设置纹理参数
                context3D.texParameteri(textureInfo.textureType, WebGLRenderingContext.TEXTURE_MIN_FILTER, textureInfo.minFilter);
                context3D.texParameteri(textureInfo.textureType, WebGLRenderingContext.TEXTURE_MAG_FILTER, textureInfo.magFilter);
                context3D.texParameteri(textureInfo.textureType, WebGLRenderingContext.TEXTURE_WRAP_S, textureInfo.wrapS);
                context3D.texParameteri(textureInfo.textureType, WebGLRenderingContext.TEXTURE_WRAP_T, textureInfo.wrapT);
                //设置纹理所在采样编号
                context3D.uniform1i(location, samplerIndex);
                samplerIndex++;
                break;
            default:
                throw `无法识别的uniform类型 ${activeInfo.name} ${data}`;
        }
    }

    //
    var shaderMap: { [name: string]: ShaderData } = {};
}