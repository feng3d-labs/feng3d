module feng3d
{

    export var renderer = {
        activeAttributes: activeAttributes,
        disableAttributes: disableAttributes,
        activeUniforms: activeUniforms,
        dodraw: dodraw,
    };

    /**
     * 激活属性
     */
    function activeAttributes(renderAtomic: RenderAtomic, gl: GL, attributeInfos: { [name: string]: WebGLActiveInfo })
    {
        for (var name in attributeInfos)
        {
            if (attributeInfos.hasOwnProperty(name))
            {
                var activeInfo = attributeInfos[name];
                var buffer: Attribute = renderAtomic.attributes[name];
                buffer.active(gl, activeInfo.location);
            }
        }
    }

    /**
     * 激活属性
     */
    function disableAttributes(gl: GL, attributeInfos: { [name: string]: WebGLActiveInfo })
    {
        for (var name in attributeInfos)
        {
            if (attributeInfos.hasOwnProperty(name))
            {
                var activeInfo = attributeInfos[name];
                gl.disableVertexAttribArray(activeInfo.location);
            }
        }
    }

    /**
     * 激活常量
     */
    function activeUniforms(renderAtomic: RenderAtomic, gl: GL, uniformInfos: { [name: string]: WebGLActiveInfo })
    {
        for (var name in uniformInfos)
        {
            if (uniformInfos.hasOwnProperty(name))
            {
                var activeInfo = uniformInfos[name];
                if (activeInfo.uniformBaseName)
                {
                    var baseName = activeInfo.uniformBaseName;
                    var uniformData = lazy.getvalue(renderAtomic.uniforms[baseName]);
                    //处理数组
                    for (var j = 0; j < activeInfo.size; j++)
                    {
                        setContext3DUniform(gl, { name: baseName + `[${j}]`, type: activeInfo.type, uniformLocation: activeInfo.uniformLocation[j], textureID: activeInfo.textureID }, uniformData[j]);
                    }
                } else
                {
                    var uniformData = lazy.getvalue(renderAtomic.uniforms[activeInfo.name]);
                    setContext3DUniform(gl, activeInfo, uniformData);
                }
            }
        }
    }

    /**
     * 设置环境Uniform数据
     */
    function setContext3DUniform(gl: GL, activeInfo: { name: string; uniformLocation: WebGLUniformLocation, type: number; textureID: number }, data)
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
            case GL.FLOAT_VEC2:
                gl.uniform2f(location, data.x, data.y);
                break;
            case GL.FLOAT_VEC3:
                if (data instanceof Color)
                {
                    gl.uniform3f(location, data.r, data.g, data.b);
                } else if (data instanceof Vector3D)
                {
                    gl.uniform3f(location, data.x, data.y, data.z);
                } else
                {
                    throw `无法处理 uniform数据 ${activeInfo.name} ${data}`;
                }
                break;
            case GL.FLOAT_VEC4:
                if (data instanceof Color)
                {
                    gl.uniform4f(location, data.r, data.g, data.b, data.a);
                } else if (data instanceof Vector3D)
                {
                    gl.uniform4f(location, data.x, data.y, data.z, data.w);
                } else
                {
                    throw `无法处理 uniform数据 ${activeInfo.name} ${data}`;
                }
                break;
            case GL.SAMPLER_2D:
            case GL.SAMPLER_CUBE:
                var textureInfo = <TextureInfo>data;
                //激活纹理编号
                gl.activeTexture(GL["TEXTURE" + activeInfo.textureID]);
                textureInfo.active(gl);
                //设置纹理所在采样编号
                gl.uniform1i(location, activeInfo.textureID);
                break;
            default:
                throw `无法识别的uniform类型 ${activeInfo.name} ${data}`;
        }
    }

    /**
     */
    function dodraw(renderAtomic: RenderAtomic, gl: GL)
    {
        var instanceCount = ~~lazy.getvalue(renderAtomic.instanceCount);

        var indexBuffer = renderAtomic.indexBuffer;
        var vertexNum = 0;
        if (indexBuffer)
        {
            indexBuffer.active(gl);
        }
        else
        {
            var a_position = renderAtomic.attributes.a_position;
            var vertexNum = a_position.data.length / a_position.size;
        }

        var shaderParams = renderAtomic.shader.shaderParams;

        var renderMode = shaderParams.renderMode;
        if (renderMode instanceof Function)
            renderMode = renderMode();
        if (instanceCount > 1)
        {
            if (indexBuffer)
                gl.drawElementsInstanced(renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset, instanceCount);
            else
                gl.drawArraysInstanced(renderMode, 0, vertexNum, instanceCount);
        }
        else
        {
            if (indexBuffer)
                gl.drawElements(renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset);
            else
                gl.drawArrays(renderMode, 0, vertexNum);
        }
    }
}