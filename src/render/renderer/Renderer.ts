module feng3d
{

    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    export class Renderer
    {

        /**
		 * 渲染
		 */
        public draw(renderContext: RenderContext)
        {
            var scene3D = renderContext.scene3d;
            var renderers = scene3D.renderers;
            for (var i = 0; i < renderers.length; i++)
            {
                var element = renderers[i];
                this.drawRenderables(renderContext, element);
            }
        }

        protected drawRenderables(renderContext: RenderContext, meshRenderer: Model)
        {
            var object3D = meshRenderer.parentComponent;
            //更新数据
            object3D.updateRender(renderContext);
            var gl = renderContext.gl;
            try
            {
                //绘制
                var material = meshRenderer.material;
                if (material.enableBlend)
                {
                    gl.enable(GL.BLEND);
                    gl.blendEquation(material.blendEquation);
                    gl.depthMask(false);
                    gl.blendFunc(material.sfactor, material.dfactor);
                } else
                {
                    gl.disable(GL.BLEND);
                    gl.depthMask(true);
                }
                this.drawObject3D(gl, object3D.renderData);            //
            } catch (error)
            {
                console.log(error);
            }
        }

        /**
         * 绘制3D对象
         */
        protected drawObject3D(gl: GL, renderAtomic: RenderAtomic)
        {
            var shaderProgram = this.activeShaderProgram(gl, renderAtomic.vertexCode, renderAtomic.fragmentCode, renderAtomic.shaderMacro);
            if (!shaderProgram)
                return;
            _samplerIndex = 0;
            //
            activeAttributes(gl, shaderProgram.attributes, renderAtomic.attributes);
            activeUniforms(gl, shaderProgram.uniforms, renderAtomic.uniforms);
            dodraw(gl, renderAtomic.shaderParams, renderAtomic.indexBuffer, renderAtomic.instanceCount);
        }

        /**
         * 激活渲染程序
         */
        protected activeShaderProgram(gl: GL, vertexCode: string, fragmentCode: string, shaderMacro: ShaderMacro)
        {
            if (!vertexCode || !fragmentCode)
                return null;

            //应用宏
            var shaderMacroStr = ShaderLib.getMacroCode(shaderMacro);
            vertexCode = vertexCode.replace(/#define\s+macros/, shaderMacroStr);
            fragmentCode = fragmentCode.replace(/#define\s+macros/, shaderMacroStr);
            //渲染程序
            var shaderProgram = context3DPool.getWebGLProgram(gl, vertexCode, fragmentCode);
            gl.useProgram(shaderProgram);
            return shaderProgram;
        }
    }

    var _samplerIndex = 0;

    /**
     * 激活属性
     */
    function activeAttributes(gl: GL, attributeInfos: WebGLActiveInfo[], attributes: { [name: string]: AttributeRenderData })
    {
        for (var i = 0; i < attributeInfos.length; i++)
        {
            var activeInfo = attributeInfos[i];
            setContext3DAttribute(gl, activeInfo, attributes[activeInfo.name]);
        }
    }

    /**
     * 激活常量
     */
    function activeUniforms(gl: GL, uniformInfos: WebGLActiveInfo[], uniforms: { [name: string]: number | number[] | Matrix3D | Vector3D | TextureInfo | Vector3D[] | Matrix3D[]; })
    {
        for (var o = 0; o < uniformInfos.length; o++)
        {
            var activeInfo = uniformInfos[o];
            if (activeInfo.name.indexOf("[") != -1)
            {
                //处理数组
                var baseName = activeInfo.uniformBaseName;
                for (var j = 0; j < activeInfo.size; j++)
                {
                    setContext3DUniform(gl, { name: baseName + `[${j}]`, type: activeInfo.type, uniformLocation: activeInfo.uniformLocation[j] }, uniforms[baseName][j]);
                }
            } else
            {
                setContext3DUniform(gl, activeInfo, uniforms[activeInfo.name]);
            }
        }
    }

    /**
     */
    function dodraw(gl: GL, shaderParams: ShaderParams, indexBuffer: IndexRenderData, instanceCount: number = 1)
    {
        instanceCount = ~~instanceCount;

        indexBuffer.active(gl);

        var renderMode = getRenderModeValue(shaderParams.renderMode);
        if (instanceCount > 1)
        {
            var _ext = gl.getExtension('ANGLE_instanced_arrays');
            _ext.drawArraysInstancedANGLE(renderMode, 0, indexBuffer.count, instanceCount)
        }
        else
        {
            gl.drawElements(renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset);
        }
    }

    /**
     * 设置环境属性数据
     */
    function setContext3DAttribute(gl: GL, activeInfo: WebGLActiveInfo, buffer: AttributeRenderData)
    {
        buffer.active(gl, activeInfo.location);

        if (buffer.divisor > 0)
        {
            var _ext = gl.getExtension('ANGLE_instanced_arrays');
            _ext.vertexAttribDivisorANGLE(activeInfo.location, buffer.divisor);
        }
    }

    /**
     * 设置环境Uniform数据
     */
    function setContext3DUniform(gl: GL, activeInfo: { name: string; uniformLocation: WebGLUniformLocation, type: number; }, data)
    {
        var location = activeInfo.uniformLocation;
        switch (activeInfo.type)
        {
            case GL.INT:
                gl.uniform1i(location, data);
                break;
            case GL.FLOAT_MAT4:
                gl.uniformMatrix4fv(location, false, data.rawData);
                break;
            case GL.FLOAT:
                gl.uniform1f(location, data);
                break;
            case GL.FLOAT_VEC3:
                gl.uniform3f(location, data.x, data.y, data.z);
                break;
            case GL.FLOAT_VEC4:
                gl.uniform4f(location, data.x, data.y, data.z, data.w);
                break;
            case GL.SAMPLER_2D:
            case GL.SAMPLER_CUBE:
                var textureInfo = <TextureInfo>data;
                //激活纹理编号
                gl.activeTexture(GL["TEXTURE" + _samplerIndex]);
                textureInfo.active(gl);
                //设置纹理所在采样编号
                gl.uniform1i(location, _samplerIndex);
                _samplerIndex++;
                break;
            default:
                throw `无法识别的uniform类型 ${activeInfo.name} ${data}`;
        }
    }
}