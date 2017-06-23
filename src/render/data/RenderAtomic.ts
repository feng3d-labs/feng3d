namespace feng3d
{
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    export class RenderAtomic
    {
        private readonly elements: RenderElement[] = [];

        public addRenderElement(element: RenderElement | RenderElement[])
        {
            if (element instanceof RenderElement)
            {
                if (element instanceof UniformData)
                {
                    this.addUniform(element);
                } else if (element instanceof AttributeRenderData)
                {
                    this.addAttribute(element);
                } else if (element instanceof IndexRenderData)
                {
                    this.indexBuffer = element;
                } else if (element instanceof Macro)
                {
                    this.shader.addMacro(element);
                } else if (element instanceof ShaderCode)
                {
                    this.shader.setShaderCode(element);
                } else if (element instanceof RenderInstanceCount)
                {
                    this.instanceCount = element.data;
                } else if (element instanceof ShaderParam)
                {
                    this.shader.shaderParams[element.name] = element.value;
                } else
                {
                    throw "未知RenderElement！";
                }
                element.addEventListener(Event.CHANGE, this.onElementChange, this);
                this.elements.push(element);
            } else
            {
                for (var i = 0; i < element.length; i++)
                {
                    this.addRenderElement(element[i]);
                }
            }
        }

        public removeRenderElement(element: RenderElement | RenderElement[])
        {
            if (element instanceof RenderElement)
            {
                if (element instanceof UniformData)
                {
                    this.removeUniform(element);
                } else if (element instanceof AttributeRenderData)
                {
                    this.removeAttribute(element);
                } else if (element instanceof IndexRenderData)
                {
                    delete this.indexBuffer;
                } else if (element instanceof Macro)
                {
                    this.shader.removeMacro(element);
                } else if (element instanceof ShaderCode)
                {
                    this.shader.setShaderCode(null);
                } else if (element instanceof RenderInstanceCount)
                {
                    delete this.instanceCount;
                } else if (element instanceof ShaderParam)
                {
                    delete this.shader.shaderParams[element.name];
                } else
                {
                    throw "未知RenderElement！";
                }
                element.removeEventListener(Event.CHANGE, this.onElementChange, this);
            } else
            {
                for (var i = 0; i < element.length; i++)
                {
                    this.removeRenderElement(element[i]);
                }
            }
        }

        private onElementChange(event: Event)
        {
            var element = <RenderElement>event.target;
            if (element instanceof UniformData)
            {
            } else if (element instanceof AttributeRenderData)
            {
            } else if (element instanceof IndexRenderData)
            {
            } else if (element instanceof Macro)
            {
                this.shader.invalidate();
            } else if (element instanceof ShaderCode)
            {
                this.shader.invalidate();
            } else if (element instanceof RenderInstanceCount)
            {
            } else if (element instanceof ShaderParam)
            {
            } else
            {
                throw "未知RenderElement！";
            }
        }

        public addUniform(uniformData: UniformData)
        {
            this.uniforms[uniformData.name] = uniformData;
        }

        public removeUniform(uniformData: UniformData)
        {
            delete this.uniforms[uniformData.name];
        }

        public addAttribute(attributeData: AttributeRenderData)
        {
            this.attributes[attributeData.name] = attributeData;
        }

        public removeAttribute(attributeData: AttributeRenderData)
        {
            delete this.attributes[attributeData.name];
        }

        public setIndexBuffer(indexBuffer: IndexRenderData)
        {
            this.indexBuffer = indexBuffer;
        }

        /**
         * 顶点索引缓冲
         */
        private indexBuffer: IndexRenderData;

        /**
         * 渲染程序
         */
        public shader = new ShaderRenderData();

        /**
         * 属性数据列表
         */
        private attributes: AttributeRenderDataStuct = <any>{};

        /**
         * Uniform渲染数据
         */
        private uniforms: UniformRenderData = <any>{};

        /**
         * 渲染实例数量
         */
        public instanceCount: number | (() => number);

        constructor() { }

        public invalidateShader()
        {
            this.shader.invalidate();
        }

        /**
         * 激活属性
         */
        public activeAttributes(gl: GL, attributeInfos: WebGLActiveInfo[])
        {
            for (var i = 0; i < attributeInfos.length; i++)
            {
                var activeInfo = attributeInfos[i];
                var buffer: AttributeRenderData = this.attributes[activeInfo.name];
                buffer.active(gl, activeInfo.location);
            }
        }

        /**
         * 激活常量
         */
        public activeUniforms(gl: GL, uniformInfos: WebGLActiveInfo[])
        {
            for (var o = 0; o < uniformInfos.length; o++)
            {
                var activeInfo = uniformInfos[o];
                if (activeInfo.uniformBaseName)
                {
                    var baseName = activeInfo.uniformBaseName;
                    var uniformData = this.uniforms[baseName];
                    if (uniformData instanceof UniformData)
                    {
                        uniformData = uniformData.data;
                    }
                    if (uniformData instanceof Function)
                    {
                        uniformData = uniformData();
                    }
                    //处理数组
                    for (var j = 0; j < activeInfo.size; j++)
                    {
                        this.setContext3DUniform(gl, { name: baseName + `[${j}]`, type: activeInfo.type, uniformLocation: activeInfo.uniformLocation[j], textureID: activeInfo.textureID }, uniformData[j]);
                    }
                } else
                {
                    var uniformData = this.uniforms[activeInfo.name];
                    if (uniformData instanceof UniformData)
                    {
                        uniformData = uniformData.data;
                    }
                    if (uniformData instanceof Function)
                    {
                        uniformData = uniformData();
                    }
                    this.setContext3DUniform(gl, activeInfo, uniformData);
                }
            }
        }

        /**
         * 设置环境Uniform数据
         */
        private setContext3DUniform(gl: GL, activeInfo: { name: string; uniformLocation: WebGLUniformLocation, type: number; textureID: number }, data)
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
                    gl.uniform3f(location, data.x, data.y, data.z);
                    break;
                case GL.FLOAT_VEC4:
                    gl.uniform4f(location, data.x, data.y, data.z, data.w);
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
        public dodraw(gl: GL)
        {
            var instanceCount = this.instanceCount;
            if (instanceCount instanceof Function)
            {
                instanceCount = instanceCount();
            }
            instanceCount = ~~instanceCount;
            var indexBuffer = this.indexBuffer;
            var shaderParams = this.shader.shaderParams;

            indexBuffer.active(gl);

            var renderMode = shaderParams.renderMode;
            if (renderMode instanceof Function)
                renderMode = renderMode();
            if (instanceCount > 1)
            {
                gl.drawElementsInstanced(renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset, instanceCount);
            }
            else
            {
                gl.drawElements(renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset);
            }
        }
    }
}