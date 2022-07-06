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

        get gl()
        {
            return this._gl;
        }

        private _gl: GL;
        private preActiveAttributes: number[] = [];

        /**
         * 获取 GL 实例
         * @param canvas 画布
         * @param contextAttributes 
         */
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
            this._gl = gl;
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
        }

        render(renderAtomic1: RenderAtomic)
        {
            const gl = this.gl;

            var instanceCount = renderAtomic1.getInstanceCount();
            if (instanceCount == 0) return;
            var shaderMacro = renderAtomic1.getShaderMacro();
            var shader = renderAtomic1.getShader();
            shader.shaderMacro = shaderMacro;
            var shaderResult = shader.activeShaderProgram(gl);
            if (!shaderResult) return;
            //
            var renderAtomic: RenderAtomicData = this.checkRenderData(renderAtomic1);
            if (!renderAtomic) return;
            //
            gl.useProgram(shaderResult.program);
            this.activeShaderParams(renderAtomic.renderParams);
            this.activeAttributes(renderAtomic, shaderResult.attributes);
            this.activeUniforms(renderAtomic, shaderResult.uniforms);
            this.draw(renderAtomic, gl[renderAtomic.renderParams.renderMode]);
        }

        checkRenderData(renderAtomic: RenderAtomic)
        {
            const gl = this.gl;

            var shader = renderAtomic.getShader();
            var shaderResult = shader.activeShaderProgram(gl);
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
                console.warn(`确实顶点索引数据，无法渲染！`);
                return null;
            }
            return {
                shader: shader,
                attributes: attributes,
                uniforms: uniforms,
                renderParams: renderAtomic.getRenderParams(),
                indexBuffer: indexBuffer,
                instanceCount: renderAtomic.getInstanceCount(),
            };
        }

        activeShaderParams(shaderParams: RenderParams)
        {
            const gl = this.gl;

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
            var viewPort = shaderParams.viewPort;
            var useViewPort = shaderParams.useViewPort;
            var useScissor = shaderParams.useScissor;
            var scissor = shaderParams.scissor;
            var colorMask = shaderParams.colorMask;
            var colorMaskB = [ColorMask.R, ColorMask.G, ColorMask.B, ColorMask.A].map(v => !!(colorMask & v));

            var usePolygonOffset = shaderParams.usePolygonOffset;
            var polygonOffsetFactor = shaderParams.polygonOffsetFactor;
            var polygonOffsetUnits = shaderParams.polygonOffsetUnits;

            const useStencil = shaderParams.useStencil;
            const stencilFunc = gl[shaderParams.stencilFunc];
            const stencilFuncRef = shaderParams.stencilFuncRef;
            const stencilFuncMask = shaderParams.stencilFuncMask;
            const stencilOpFail = gl[shaderParams.stencilOpFail];
            const stencilOpZFail = gl[shaderParams.stencilOpZFail];
            const stencilOpZPass = gl[shaderParams.stencilOpZPass];
            const stencilMask = shaderParams.stencilMask;

            if (!useViewPort)
            {
                viewPort = { x: 0, y: 0, width: gl.canvas.width, height: gl.canvas.height };
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
            {
                gl.disable(gl.DEPTH_TEST);
            }
            gl.depthMask(depthMask);

            gl.colorMask(colorMaskB[0], colorMaskB[1], colorMaskB[2], colorMaskB[3]);

            gl.viewport(viewPort.x, viewPort.y, viewPort.width, viewPort.height);

            if (usePolygonOffset)
            {
                gl.enable(gl.POLYGON_OFFSET_FILL);
                gl.polygonOffset(polygonOffsetFactor, polygonOffsetUnits);
            }
            else
            {
                gl.disable(gl.POLYGON_OFFSET_FILL);
            }

            if (useScissor)
            {
                gl.enable(gl.SCISSOR_TEST);
                gl.scissor(scissor.x, scissor.y, scissor.width, scissor.height);
            } else
            {
                gl.disable(gl.SCISSOR_TEST);
            }

            if (useStencil)
            {
                if (gl.capabilities.stencilBits === 0)
                {
                    console.warn(`${gl} 不支持 stencil，参考 https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext WebGL context attributes: stencil`);
                }
                gl.enable(gl.STENCIL_TEST);
                gl.stencilFunc(stencilFunc, stencilFuncRef, stencilFuncMask);
                gl.stencilOp(stencilOpFail, stencilOpZFail, stencilOpZPass);
                gl.stencilMask(stencilMask);
            } else
            {
                gl.disable(gl.STENCIL_TEST);
            }
        }

        /**
         * 激活属性
         */
        activeAttributes(renderAtomic: RenderAtomicData, attributeInfos: { [name: string]: AttributeInfo })
        {
            const gl = this.gl;
            const preActiveAttributes = this.preActiveAttributes;
            var activeAttributes: number[] = [];
            for (var name in attributeInfos)
            {
                var activeInfo = attributeInfos[name];
                var buffer: Attribute = renderAtomic.attributes[name];
                Attribute.active(gl, activeInfo.location, buffer);
                activeAttributes.push(activeInfo.location);
                Array.delete(preActiveAttributes, activeInfo.location);
            }
            preActiveAttributes.forEach(location =>
            {
                gl.disableVertexAttribArray(location);
            });
            this.preActiveAttributes = activeAttributes;
        }

        /**
         * 激活常量
         */
        activeUniforms(renderAtomic: RenderAtomicData, uniformInfos: { [name: string]: UniformInfo })
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
        setContext3DUniform(activeInfo: UniformInfo, data)
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
         * 绘制
         * @param renderAtomic  渲染原子
         */
        draw(renderAtomic: RenderAtomicData, renderMode: number)
        {
            const gl = this.gl;
            var instanceCount = ~~lazy.getvalue(renderAtomic.instanceCount);

            var indexBuffer = renderAtomic.indexBuffer;
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