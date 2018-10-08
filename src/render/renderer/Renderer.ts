namespace feng3d
{
    /**
     * 渲染器
     * 所有渲染都由该渲染器执行
     */
    export class Renderer
    {
        /**
         * 绘制
         * @param renderAtomic  渲染原子
         */
        readonly draw: (renderAtomic: RenderAtomic) => void;

        constructor(gl: GL)
        {
            assert(!gl.renderer, `${gl} ${gl.renderer} 存在！`);

            gl.renderer = this;

            this.draw = (renderAtomic1: RenderAtomic) =>
            {
                var instanceCount = renderAtomic1.getInstanceCount();
                if (instanceCount == 0) return;
                var shaderMacro = renderAtomic1.getShaderMacro();
                var shader = renderAtomic1.getShader();
                shader.shaderMacro = shaderMacro;
                var shaderResult = shader.activeShaderProgram(gl);
                if (!shaderResult) return;

                var renderAtomic = checkRenderData(renderAtomic1);
                if (!renderAtomic) return;
                //
                gl.useProgram(shaderResult.program);
                activeShaderParams(renderAtomic.renderParams);
                activeAttributes(renderAtomic, shaderResult.attributes);
                activeUniforms(renderAtomic, shaderResult.uniforms);
                dodraw(renderAtomic, gl[renderAtomic.renderParams.renderMode]);
                disableAttributes(shaderResult.attributes);
            }

            function checkRenderData(renderAtomic: RenderAtomic)
            {
                var atomic = new RenderAtomic();

                var shader = renderAtomic.getShader();
                var shaderResult = shader.activeShaderProgram(gl);
                if (!shaderResult)
                {
                    warn(`缺少着色器，无法渲染!`)
                    return null;
                }
                atomic.shader = shader;

                for (const key in shaderResult.attributes)
                {
                    var attribute = renderAtomic.getAttributeByKey(key);
                    if (attribute == undefined)
                    {
                        warn(`缺少顶点 attribute 数据 ${key} ，无法渲染!`)
                        return null;
                    }
                    atomic.attributes[key] = attribute;
                }

                for (var key in shaderResult.uniforms)
                {
                    var activeInfo = shaderResult.uniforms[key];
                    if (activeInfo.name)
                    {
                        key = activeInfo.name;
                    }
                    var uniform = renderAtomic.getUniformByKey(key);
                    if (uniform == undefined)
                    {
                        warn(`缺少 uniform 数据 ${key} ,无法渲染！`)
                        return null;
                    }
                    atomic.uniforms[key] = uniform;
                }

                atomic.renderParams = renderAtomic.getRenderParams();

                atomic.indexBuffer = renderAtomic.getIndexBuffer();
                if (!atomic.indexBuffer) 
                {
                    warn(`确实顶点索引数据，无法渲染！`);
                    return null;
                }
                atomic.instanceCount = renderAtomic.getInstanceCount();

                return atomic;
            }

            function activeShaderParams(shaderParams: RenderParams)
            {
                var cullfaceEnum = shaderParams.cullFace;
                var blendEquation = gl[shaderParams.blendEquation];
                var sfactor = gl[shaderParams.sfactor];
                var dfactor = gl[shaderParams.dfactor];
                var cullFace = gl[shaderParams.cullFace];
                var frontFace = gl[shaderParams.frontFace];
                var enableBlend = shaderParams.enableBlend;
                var depthtest = shaderParams.depthtest;
                var depthMask = shaderParams.depthMask;
                var depthFunc = gl[shaderParams.depthFunc];
                var viewRect = shaderParams.viewRect;
                var useViewRect = shaderParams.useViewRect;
                if (!useViewRect)
                {
                    viewRect = new Rectangle(0, 0, gl.canvas.width, gl.canvas.height);
                }

                if (cullfaceEnum != CullFace.NONE)
                {
                    gl.enable(gl.CULL_FACE);
                    gl.cullFace(cullFace);
                    gl.frontFace(frontFace);
                } else
                {
                    gl.disable(gl.CULL_FACE);
                }

                if (enableBlend)
                {
                    //
                    gl.enable(gl.BLEND);
                    gl.blendEquation(blendEquation);
                    gl.blendFunc(sfactor, dfactor);
                } else
                {
                    gl.disable(gl.BLEND);
                }

                if (depthtest)
                {
                    gl.enable(gl.DEPTH_TEST);
                    gl.depthFunc(depthFunc);
                }
                else
                    gl.disable(gl.DEPTH_TEST);
                gl.depthMask(depthMask);

                gl.viewport(viewRect.x, viewRect.y, viewRect.width, viewRect.height);
            }

            /**
             * 激活属性
             */
            function activeAttributes(renderAtomic: RenderAtomic, attributeInfos: { [name: string]: AttributeInfo })
            {
                for (var name in attributeInfos)
                {
                    var activeInfo = attributeInfos[name];
                    var buffer: Attribute = renderAtomic.attributes[name];
                    buffer.active(gl, activeInfo.location);
                }
            }

            /**
             * 激活属性
             */
            function disableAttributes(attributeInfos: { [name: string]: AttributeInfo })
            {
                for (var name in attributeInfos)
                {
                    var activeInfo = attributeInfos[name];
                    gl.disableVertexAttribArray(activeInfo.location);
                }
            }

            /**
             * 激活常量
             */
            function activeUniforms(renderAtomic: RenderAtomic, uniformInfos: { [name: string]: UniformInfo })
            {
                var uniforms = renderAtomic.uniforms;
                for (var name in uniformInfos)
                {
                    var activeInfo = uniformInfos[name];
                    var paths = activeInfo.paths;
                    var uniformData = uniforms[paths[0]];
                    for (let i = 1; i < paths.length; i++)
                    {
                        uniformData = uniformData[paths[i]];
                    }
                    setContext3DUniform(activeInfo, uniformData);
                }
            }

            /**
             * 设置环境Uniform数据
             */
            function setContext3DUniform(activeInfo: UniformInfo, data)
            {
                var location = activeInfo.location;
                switch (activeInfo.type)
                {
                    case gl.INT:
                        gl.uniform1i(location, data);
                        break;
                    case gl.FLOAT_MAT4:
                        gl.uniformMatrix4fv(location, false, data.rawData);
                        break;
                    case gl.FLOAT:
                        gl.uniform1f(location, data);
                        break;
                    case gl.FLOAT_VEC2:
                        gl.uniform2f(location, data.x, data.y);
                        break;
                    case gl.FLOAT_VEC3:
                        if (data instanceof Color3)
                        {
                            gl.uniform3f(location, data.r, data.g, data.b);
                        } else if (data instanceof Vector3)
                        {
                            gl.uniform3f(location, data.x, data.y, data.z);
                        } else
                        {
                            throw `无法处理 uniform数据 ${activeInfo.name} ${data}`;
                        }
                        break;
                    case gl.FLOAT_VEC4:
                        if (data instanceof Color4)
                        {
                            gl.uniform4f(location, data.r, data.g, data.b, data.a);
                        } else if (data instanceof Vector4)
                        {
                            gl.uniform4f(location, data.x, data.y, data.z, data.w);
                        } else
                        {
                            throw `无法处理 uniform数据 ${activeInfo.name} ${data}`;
                        }
                        break;
                    case gl.SAMPLER_2D:
                    case gl.SAMPLER_CUBE:
                        var textureInfo = <TextureInfo>data;
                        //激活纹理编号
                        gl.activeTexture(gl["TEXTURE" + activeInfo.textureID]);
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
            function dodraw(renderAtomic: RenderAtomic, renderMode: number)
            {
                var instanceCount = ~~lazy.getvalue(renderAtomic.instanceCount);

                var indexBuffer = renderAtomic.indexBuffer;
                var vertexNum = 0;
                if (indexBuffer)
                {
                    indexBuffer.active(gl);
                    var arrayType = gl[indexBuffer.type];
                    if (indexBuffer.count == 0)
                    {
                        warn(`顶点索引为0，不进行渲染！`);
                        return;
                    }
                    if (instanceCount > 1)
                    {
                        if (gl.webgl2)
                        {
                            var gl2: WebGL2RenderingContext = <any>gl;
                            gl2.drawElementsInstanced(renderMode, indexBuffer.count, arrayType, indexBuffer.offset, instanceCount);
                        } else if (!!gl.extensions.aNGLEInstancedArrays)
                        {
                            gl.extensions.aNGLEInstancedArrays.drawElementsInstancedANGLE(renderMode, indexBuffer.count, arrayType, indexBuffer.offset, instanceCount);
                        } else
                        {
                            warn(`浏览器 不支持 drawElementsInstanced ！`);
                        }
                    } else
                    {
                        gl.drawElements(renderMode, indexBuffer.count, arrayType, indexBuffer.offset);
                    }
                }
                else
                {
                    var vertexNum = ((attributes) =>
                    {
                        for (const attr in attributes)
                        {
                            if (attributes.hasOwnProperty(attr))
                            {
                                var attribute: Attribute = attributes[attr];
                                return attribute.data.length / attribute.size;
                            }
                        }
                        return 0;
                    })(renderAtomic.attributes);
                    if (vertexNum == 0)
                    {
                        warn(`顶点数量为0，不进行渲染！`);
                        return;
                    }
                    if (instanceCount > 1)
                    {
                        if (gl.webgl2)
                        {
                            var gl2: WebGL2RenderingContext = <any>gl;
                            gl2.drawArraysInstanced(renderMode, 0, vertexNum, instanceCount);
                        } else if (!!gl.extensions.aNGLEInstancedArrays)
                        {
                            gl.extensions.aNGLEInstancedArrays.drawArraysInstancedANGLE(renderMode, 0, vertexNum, instanceCount);
                        } else
                        {
                            warn(`浏览器 不支持 drawArraysInstanced ！`);
                        }
                    }
                    else
                    {
                        gl.drawArrays(renderMode, 0, vertexNum);
                    }
                }
            }
        }
    }
}