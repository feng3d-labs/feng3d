namespace feng3d
{

    /**
     * WEBGL 渲染器
     * 
     * 所有渲染都由该渲染器执行
     */
    export class WebGLRenderer
    {
        static glList: GL[] = [];

        gl: GL;
        private preActiveAttributes: number[] = [];

        constructor(canvas: HTMLCanvasElement, contextAttributes?: WebGLContextAttributes)
        {
            var contextIds = ["webgl2", "webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
            // var contextIds = ["webgl"];
            var gl: GL = <any>null;
            for (var i = 0; i < contextIds.length; ++i)
            {
                try
                {
                    gl = <any>canvas.getContext(contextIds[i], contextAttributes);
                    gl.contextId = contextIds[i];
                    gl.contextAttributes = contextAttributes;
                    break;
                } catch (e) { }
            }
            if (!gl)
                throw "无法初始化WEBGL";
            this.gl = gl;
            //
            new GLCache(gl);
            new GLExtension(gl);
            new GLCapabilities(gl);
            //
            gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
            gl.clearDepth(1.0);                 // Clear everything
            gl.enable(gl.DEPTH_TEST);           // Enable depth testing
            gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
            WebGLRenderer.glList.push(gl);

            console.assert(!gl.render, `${gl} ${gl.render} 存在！`);
        }

        render(renderAtomic: RenderAtomic) 
        {
            var instanceCount = renderAtomic.getInstanceCount();
            if (instanceCount == 0) return;
            var shaderMacro = renderAtomic.getShaderMacro();
            var shader = renderAtomic.getShader();
            shader.shaderMacro = shaderMacro;
            var shaderResult = shader.activeShaderProgram(this.gl);
            if (!shaderResult) return;
            //
            var checkedRenderAtomic: RenderAtomicData = this.checkRenderData(renderAtomic);
            if (!checkedRenderAtomic) return;
            //
            this.gl.useProgram(shaderResult.program);
            checkedRenderAtomic.renderParams.updateRenderParams(this.gl);
            this.activeAttributes(checkedRenderAtomic, shaderResult.attributes);
            this.activeUniforms(checkedRenderAtomic, shaderResult.uniforms);
            this.draw(checkedRenderAtomic, this.gl[checkedRenderAtomic.renderParams.renderMode]);
        }

        private checkRenderData(renderAtomic: RenderAtomic)
        {
            var shader = renderAtomic.getShader();
            var shaderResult = shader.activeShaderProgram(this.gl);
            if (!shaderResult)
            {
                console.warn(`缺少着色器，无法渲染!`)
                return null;
            }

            var attributes: { [name: string]: Attribute; } = {};
            for (const key in shaderResult.attributes)
            {
                var attribute = renderAtomic.getAttributeByKey(key);
                if (attribute == undefined)
                {
                    console.warn(`缺少顶点 attribute 数据 ${key} ，无法渲染!`)
                    return null;
                }
                attributes[key] = attribute;
            }

            var uniforms: { [name: string]: Uniforms; } = {};
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
                    console.warn(`缺少 uniform 数据 ${key} ,无法渲染！`)
                    return null;
                }
                uniforms[key] = uniform;
            }

            var indexBuffer = renderAtomic.getIndexBuffer();
            if (!indexBuffer) 
            {
                console.warn(`缺少顶点索引数据，无法渲染！`);
                return null;
            }

            const checkedRenderAtomic: RenderAtomicData =
            {
                shader: shader,
                attributes: attributes,
                uniforms: uniforms,
                renderParams: renderAtomic.getRenderParams(),
                index: indexBuffer,
                instanceCount: renderAtomic.getInstanceCount(),
            };
            return checkedRenderAtomic
        }

        /**
         * 激活属性
         */
        private activeAttributes(renderAtomic: RenderAtomicData, attributeInfos: { [name: string]: AttributeInfo })
        {
            const gl = this.gl;

            var activeAttributes: number[] = [];
            for (var name in attributeInfos)
            {
                var activeInfo = attributeInfos[name];
                var buffer: Attribute = renderAtomic.attributes[name];
                buffer.active(gl, activeInfo.location);
                activeAttributes.push(activeInfo.location);

                var index = this.preActiveAttributes.indexOf(activeInfo.location);
                if (index !== -1)
                {
                    this.preActiveAttributes.splice(index, 1);
                }
            }
            this.preActiveAttributes.forEach(location =>
            {
                gl.disableVertexAttribArray(location);
            });
            this.preActiveAttributes = activeAttributes;
        }

        /**
         * 激活常量
         */
        private activeUniforms(renderAtomic: RenderAtomicData, uniformInfos: { [name: string]: UniformInfo })
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
                this.setContext3DUniform(activeInfo, uniformData);
            }
        }

        /**
         * 设置环境Uniform数据
         */
        private setContext3DUniform(activeInfo: UniformInfo, data)
        {
            const gl = this.gl;

            var vec: number[] = data;
            if (data.toArray) vec = data.toArray();
            var location = activeInfo.location;
            switch (activeInfo.type)
            {
                case gl.INT:
                    gl.uniform1i(location, data);
                    break;
                case gl.FLOAT_MAT3:
                    gl.uniformMatrix3fv(location, false, vec);
                    break;
                case gl.FLOAT_MAT4:
                    gl.uniformMatrix4fv(location, false, vec);
                    break;
                case gl.FLOAT:
                    gl.uniform1f(location, data);
                    break;
                case gl.FLOAT_VEC2:
                    gl.uniform2f(location, vec[0], vec[1]);
                    break;
                case gl.FLOAT_VEC3:
                    gl.uniform3f(location, vec[0], vec[1], vec[2]);
                    break;
                case gl.FLOAT_VEC4:
                    gl.uniform4f(location, vec[0], vec[1], vec[2], vec[3]);
                    break;
                case gl.SAMPLER_2D:
                case gl.SAMPLER_CUBE:
                    var textureInfo = <Texture>data;
                    //激活纹理编号
                    gl.activeTexture(gl["TEXTURE" + activeInfo.textureID]);
                    Texture.active(gl, textureInfo);
                    //设置纹理所在采样编号
                    gl.uniform1i(location, activeInfo.textureID);
                    break;
                default:
                    console.error(`无法识别的uniform类型 ${activeInfo.name} ${data}`);
            }
        }

        /**
         */
        private draw(renderAtomic: RenderAtomicData, renderMode: number)
        {
            const gl = this.gl;

            var instanceCount = ~~lazy.getvalue(renderAtomic.instanceCount);

            var indexBuffer = renderAtomic.index;
            var vertexNum = 0;
            if (indexBuffer)
            {
                Index.active(gl, indexBuffer);
                var arrayType = gl[indexBuffer.type];
                if (indexBuffer.count == 0)
                {
                    // console.warn(`顶点索引为0，不进行渲染！`);
                    return;
                }
                if (instanceCount > 1)
                {
                    gl.drawElementsInstanced(renderMode, indexBuffer.count, arrayType, indexBuffer.offset, instanceCount);
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
                    console.warn(`顶点数量为0，不进行渲染！`);
                    return;
                }
                if (instanceCount > 1)
                {
                    gl.drawArraysInstanced(renderMode, 0, vertexNum, instanceCount);
                }
                else
                {
                    gl.drawArrays(renderMode, 0, vertexNum);
                }
            }
        }

    }
}