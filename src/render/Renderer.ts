module feng3d
{

    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    export class Renderer
    {

        /** 渲染原子 */
        protected renderAtomic = new RenderAtomic();

        /**
		 * 渲染
		 */
        public draw(context3D: Context3D, scene3D: Scene3D, camera: Camera3D)
        {

            var renderContext: RenderContext = new RenderContext();
            //初始化渲染环境
            renderContext.clear();
            renderContext.camera = camera;
            renderContext.lights = scene3D.lights;

            var renderables = scene3D.renderers;
            renderables.forEach(element =>
            {
                var object3D = element.object3D;
                //更新数据
                renderContext.updateRenderData(object3D);
                object3D.updateRenderData(renderContext);
                //收集数据
                renderContext.activate(this.renderAtomic);
                object3D.activate(this.renderAtomic);
                //绘制
                this.drawObject3D(context3D);            //
                //释放数据
                object3D.deactivate(this.renderAtomic);
                renderContext.deactivate(this.renderAtomic);
            });
        }

        /**
         * 绘制3D对象
         */
        protected drawObject3D(context3D: Context3D)
        {

            var shaderProgram = this.activeShaderProgram(context3D, this.renderAtomic.vertexCode, this.renderAtomic.fragmentCode);
            if (!shaderProgram)
                return;
            samplerIndex = 0;
            //
            try {
                
                activeAttributes(context3D, shaderProgram, this.renderAtomic.attributes);
                activeUniforms(context3D, shaderProgram, this.renderAtomic.uniforms);
                dodraw(context3D, this.renderAtomic.shaderParams, this.renderAtomic.indexBuffer, this.renderAtomic.instanceCount);
            } catch (error) {
                
            }
        }

        /**
         * 激活渲染程序
         */
        protected activeShaderProgram(context3D: Context3D, vertexCode: string, fragmentCode: string)
        {

            if (!vertexCode || !fragmentCode)
                return null;

            //应用宏
            var shaderMacro = ShaderLib.getMacroCode(this.renderAtomic.shaderMacro);
            vertexCode = vertexCode.replace(/#define\s+macros/, shaderMacro);
            fragmentCode = fragmentCode.replace(/#define\s+macros/, shaderMacro);
            //渲染程序
            var shaderProgram = context3DPool.getWebGLProgram(context3D, vertexCode, fragmentCode);
            context3D.useProgram(shaderProgram);
            return shaderProgram;
        }
    }

    var samplerIndex = 0;

    /**
     * 激活属性
     */
    function activeAttributes(context3D: Context3D, shaderProgram: WebGLProgram, attributes: { [name: string]: AttributeRenderData })
    {

        var numAttributes = context3D.getProgramParameter(shaderProgram, context3D.ACTIVE_ATTRIBUTES);
        var i = 0;
        while (i < numAttributes)
        {
            var activeInfo = context3D.getActiveAttrib(shaderProgram, i++);
            setContext3DAttribute(context3D, shaderProgram, activeInfo, attributes[activeInfo.name]);
        }
    }

    /**
     * 激活常量
     */
    function activeUniforms(context3D: Context3D, shaderProgram: WebGLProgram, uniforms: { [name: string]: number | number[] | Matrix3D | Vector3D | TextureInfo | Vector3D[] | Matrix3D[]; })
    {

        var numUniforms = context3D.getProgramParameter(shaderProgram, context3D.ACTIVE_UNIFORMS);
        var i = 0;
        while (i < numUniforms)
        {
            var activeInfo = context3D.getActiveUniform(shaderProgram, i++);
            if (activeInfo.name.indexOf("[") != -1)
            {
                //处理数组
                var baseName = activeInfo.name.substring(0, activeInfo.name.indexOf("["));
                for (var j = 0; j < activeInfo.size; j++)
                {
                    setContext3DUniform(context3D, shaderProgram, { name: baseName + `[${j}]`, type: activeInfo.type }, uniforms[baseName][j]);
                }
            } else
            {
                setContext3DUniform(context3D, shaderProgram, activeInfo, uniforms[activeInfo.name]);
            }
        }
    }

    /**
     */
    function dodraw(context3D: Context3D, shaderParams: ShaderParams, indexBuffer: IndexRenderData, instanceCount: number = 1)
    {

        instanceCount = ~~instanceCount;
        var buffer = context3DPool.getIndexBuffer(context3D, indexBuffer.indices);
        context3D.bindBuffer(indexBuffer.target, buffer);
        context3D.lineWidth(1);
        if (instanceCount > 1)
        {
            context3D.drawElementsInstanced(shaderParams.renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset, instanceCount)
        }
        else
        {
            context3D.drawElements(shaderParams.renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset);
        }
    }

    /**
     * 设置环境属性数据
     */
    function setContext3DAttribute(context3D: Context3D, shaderProgram: WebGLProgram, activeInfo: WebGLActiveInfo, buffer: AttributeRenderData)
    {

        var location = context3D.getAttribLocation(shaderProgram, activeInfo.name);
        context3D.enableVertexAttribArray(location);
        //
        var squareVerticesBuffer = context3DPool.getVABuffer(context3D, buffer.data);
        context3D.bindBuffer(Context3D.ARRAY_BUFFER, squareVerticesBuffer);
        switch (activeInfo.type)
        {
            case Context3D.FLOAT:
                context3D.vertexAttribPointer(location, 1, Context3D.FLOAT, false, 0, 0);
                break;
            case Context3D.FLOAT_VEC2:
                context3D.vertexAttribPointer(location, 2, Context3D.FLOAT, false, 0, 0);
                break;
            case Context3D.FLOAT_VEC3:
                context3D.vertexAttribPointer(location, 3, Context3D.FLOAT, false, 0, 0);
                break;
            case Context3D.FLOAT_VEC4:
                context3D.vertexAttribPointer(location, 4, Context3D.FLOAT, false, 0, 0);
                break;
            default:
                throw `无法识别的attribute类型 ${activeInfo.name} ${buffer.data}`;
        }
        if (buffer.divisor > 0)
            context3D.vertexAttribDivisor(location, buffer.divisor);
    }

    /**
     * 设置环境Uniform数据
     */
    function setContext3DUniform(context3D: Context3D, shaderProgram: WebGLProgram, activeInfo: { name: string; type: number; }, data)
    {

        var location = context3D.getUniformLocation(shaderProgram, activeInfo.name);
        switch (activeInfo.type)
        {
            case Context3D.UNSIGNED_INT:
                context3D.uniform1ui(location, data);
                break;
            case Context3D.FLOAT_MAT4:
                context3D.uniformMatrix4fv(location, false, data.rawData);
                break;
            case Context3D.FLOAT:
                context3D.uniform1f(location, data);
                break;
            case Context3D.FLOAT_VEC3:
                context3D.uniform3f(location, data.x, data.y, data.z);
                break;
            case Context3D.FLOAT_VEC4:
                context3D.uniform4f(location, data.x, data.y, data.z, data.w);
                break;
            case Context3D.SAMPLER_2D:
            case Context3D.SAMPLER_CUBE:

                var textureInfo = <TextureInfo>data;
                var texture = context3DPool.getTexture(context3D, textureInfo);
                //激活纹理编号
                context3D.activeTexture(Context3D["TEXTURE" + samplerIndex]);
                //绑定纹理
                context3D.bindTexture(textureInfo.textureType, texture);
                //设置图片y轴方向
                context3D.pixelStorei(Context3D.UNPACK_FLIP_Y_WEBGL, textureInfo.flipY);
                //设置纹理参数
                context3D.texParameteri(textureInfo.textureType, Context3D.TEXTURE_MIN_FILTER, textureInfo.minFilter);
                context3D.texParameteri(textureInfo.textureType, Context3D.TEXTURE_MAG_FILTER, textureInfo.magFilter);
                context3D.texParameteri(textureInfo.textureType, Context3D.TEXTURE_WRAP_S, textureInfo.wrapS);
                context3D.texParameteri(textureInfo.textureType, Context3D.TEXTURE_WRAP_T, textureInfo.wrapT);
                //设置纹理所在采样编号
                context3D.uniform1i(location, samplerIndex);
                samplerIndex++;
                break;
            default:
                throw `无法识别的uniform类型 ${activeInfo.name} ${data}`;
        }
    }
}