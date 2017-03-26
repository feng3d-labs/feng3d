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
        public draw(gl: GL, scene3D: Scene3D, camera: Camera)
        {
            var renderContext = scene3D.renderContext;
            //初始化渲染环境
            renderContext.camera = camera;
            scene3D.renderers.forEach(element =>
            {
                this.drawRenderables(gl, renderContext, element);
            });
        }

        protected drawRenderables(gl: GL, renderContext: RenderContext, meshRenderer: Model)
        {
            var object3D = meshRenderer.parentComponent;
            //更新数据
            object3D.updateRender(renderContext);
            try
            {
                //绘制
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
            activeAttributes(gl, shaderProgram, renderAtomic.attributes);
            activeUniforms(gl, shaderProgram, renderAtomic.uniforms);
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
    function activeAttributes(gl: GL, shaderProgram: WebGLProgram, attributes: { [name: string]: AttributeRenderData })
    {
        var numAttributes = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
        var i = 0;
        while (i < numAttributes)
        {
            var activeInfo = gl.getActiveAttrib(shaderProgram, i++);
            setContext3DAttribute(gl, shaderProgram, activeInfo, attributes[activeInfo.name]);
        }
    }

    /**
     * 激活常量
     */
    function activeUniforms(gl: GL, shaderProgram: WebGLProgram, uniforms: { [name: string]: number | number[] | Matrix3D | Vector3D | TextureInfo | Vector3D[] | Matrix3D[]; })
    {
        var numUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
        var i = 0;
        while (i < numUniforms)
        {
            var activeInfo = gl.getActiveUniform(shaderProgram, i++);
            if (activeInfo.name.indexOf("[") != -1)
            {
                //处理数组
                var baseName = activeInfo.name.substring(0, activeInfo.name.indexOf("["));
                for (var j = 0; j < activeInfo.size; j++)
                {
                    setContext3DUniform(gl, shaderProgram, { name: baseName + `[${j}]`, type: activeInfo.type }, uniforms[baseName][j]);
                }
            } else
            {
                setContext3DUniform(gl, shaderProgram, activeInfo, uniforms[activeInfo.name]);
            }
        }
    }

    /**
     */
    function dodraw(gl: GL, shaderParams: ShaderParams, indexBuffer: IndexRenderData, instanceCount: number = 1)
    {
        instanceCount = ~~instanceCount;

        indexBuffer.active(gl);

        if (instanceCount > 1)
        {
            _ext = _ext || gl.getExtension('ANGLE_instanced_arrays');
            _ext.drawArraysInstancedANGLE(shaderParams.renderMode, 0, indexBuffer.count, instanceCount)
        }
        else
        {
            gl.drawElements(shaderParams.renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset);
        }
    }

    /**
     * 设置环境属性数据
     */
    function setContext3DAttribute(gl: GL, shaderProgram: WebGLProgram, activeInfo: WebGLActiveInfo, buffer: AttributeRenderData)
    {
        var location = gl.getAttribLocation(shaderProgram, activeInfo.name);

        buffer.active(gl, location);

        if (buffer.divisor > 0)
        {
            _ext = _ext || gl.getExtension('ANGLE_instanced_arrays');
            _ext.vertexAttribDivisorANGLE(location, buffer.divisor);
        }
    }

    /**
     * 设置环境Uniform数据
     */
    function setContext3DUniform(gl: GL, shaderProgram: WebGLProgram, activeInfo: { name: string; type: number; }, data)
    {
        var location = gl.getUniformLocation(shaderProgram, activeInfo.name);
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

    var _ext
}