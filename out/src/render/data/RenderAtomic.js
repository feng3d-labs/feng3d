var feng3d;
(function (feng3d) {
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    var RenderAtomic = (function () {
        function RenderAtomic() {
            /**
             * 渲染程序
             */
            this.shader = new feng3d.ShaderRenderData();
            /**
             * 属性数据列表
             */
            this.attributes = {};
            /**
             * Uniform渲染数据
             */
            this.uniforms = {};
        }
        RenderAtomic.prototype.addRenderElement = function (element) {
            if (element instanceof feng3d.RenderElement) {
                if (element instanceof feng3d.UniformData) {
                    this.addUniform(element);
                }
                else if (element instanceof feng3d.AttributeRenderData) {
                    this.addAttribute(element);
                }
                else if (element instanceof feng3d.IndexRenderData) {
                    this.indexBuffer = element;
                }
                else if (element instanceof feng3d.Macro) {
                    this.shader.addMacro(element);
                }
                else if (element instanceof feng3d.ShaderCode) {
                    this.shader.setShaderCode(element);
                }
                else if (element instanceof feng3d.RenderInstanceCount) {
                    this.instanceCount = element.data;
                }
                else if (element instanceof feng3d.ShaderParam) {
                    this.shader.shaderParams[element.name] = element.value;
                }
                else {
                    throw "未知RenderElement！";
                }
                element.on("change", this.onElementChange, this);
            }
            else {
                for (var i = 0; i < element.length; i++) {
                    this.addRenderElement(element[i]);
                }
            }
        };
        RenderAtomic.prototype.removeRenderElement = function (element) {
            if (element instanceof feng3d.RenderElement) {
                if (element instanceof feng3d.UniformData) {
                    this.removeUniform(element);
                }
                else if (element instanceof feng3d.AttributeRenderData) {
                    this.removeAttribute(element);
                }
                else if (element instanceof feng3d.IndexRenderData) {
                    delete this.indexBuffer;
                }
                else if (element instanceof feng3d.Macro) {
                    this.shader.removeMacro(element);
                }
                else if (element instanceof feng3d.ShaderCode) {
                    this.shader.setShaderCode(null);
                }
                else if (element instanceof feng3d.RenderInstanceCount) {
                    delete this.instanceCount;
                }
                else if (element instanceof feng3d.ShaderParam) {
                    delete this.shader.shaderParams[element.name];
                }
                else {
                    throw "未知RenderElement！";
                }
                element.off("change", this.onElementChange, this);
            }
            else {
                for (var i = 0; i < element.length; i++) {
                    this.removeRenderElement(element[i]);
                }
            }
        };
        RenderAtomic.prototype.onElementChange = function (event) {
            var element = event.target;
            if (element instanceof feng3d.UniformData) {
            }
            else if (element instanceof feng3d.AttributeRenderData) {
            }
            else if (element instanceof feng3d.IndexRenderData) {
            }
            else if (element instanceof feng3d.Macro) {
                this.shader.invalidate();
            }
            else if (element instanceof feng3d.ShaderCode) {
                this.shader.invalidate();
            }
            else if (element instanceof feng3d.RenderInstanceCount) {
            }
            else if (element instanceof feng3d.ShaderParam) {
            }
            else {
                throw "未知RenderElement！";
            }
        };
        RenderAtomic.prototype.addUniform = function (uniformData) {
            this.uniforms[uniformData.name] = uniformData;
        };
        RenderAtomic.prototype.removeUniform = function (uniformData) {
            delete this.uniforms[uniformData.name];
        };
        RenderAtomic.prototype.addAttribute = function (attributeData) {
            this.attributes[attributeData.name] = attributeData;
        };
        RenderAtomic.prototype.removeAttribute = function (attributeData) {
            delete this.attributes[attributeData.name];
        };
        RenderAtomic.prototype.invalidateShader = function () {
            this.shader.invalidate();
        };
        /**
         * 激活属性
         */
        RenderAtomic.prototype.activeAttributes = function (gl, attributeInfos) {
            for (var i = 0; i < attributeInfos.length; i++) {
                var activeInfo = attributeInfos[i];
                var buffer = this.attributes[activeInfo.name];
                buffer.active(gl, activeInfo.location);
            }
        };
        /**
         * 激活常量
         */
        RenderAtomic.prototype.activeUniforms = function (gl, uniformInfos) {
            for (var o = 0; o < uniformInfos.length; o++) {
                var activeInfo = uniformInfos[o];
                if (activeInfo.uniformBaseName) {
                    var baseName = activeInfo.uniformBaseName;
                    var uniformData = this.uniforms[baseName];
                    if (uniformData instanceof feng3d.UniformData) {
                        uniformData = uniformData.data;
                    }
                    if (uniformData instanceof Function) {
                        uniformData = uniformData();
                    }
                    //处理数组
                    for (var j = 0; j < activeInfo.size; j++) {
                        this.setContext3DUniform(gl, { name: baseName + ("[" + j + "]"), type: activeInfo.type, uniformLocation: activeInfo.uniformLocation[j], textureID: activeInfo.textureID }, uniformData[j]);
                    }
                }
                else {
                    var uniformData = this.uniforms[activeInfo.name];
                    if (uniformData instanceof feng3d.UniformData) {
                        uniformData = uniformData.data;
                    }
                    if (uniformData instanceof Function) {
                        uniformData = uniformData();
                    }
                    this.setContext3DUniform(gl, activeInfo, uniformData);
                }
            }
        };
        /**
         * 设置环境Uniform数据
         */
        RenderAtomic.prototype.setContext3DUniform = function (gl, activeInfo, data) {
            var location = activeInfo.uniformLocation;
            switch (activeInfo.type) {
                case feng3d.GL.INT:
                    gl.uniform1i(location, data);
                    break;
                case feng3d.GL.FLOAT_MAT4:
                    gl.uniformMatrix4fv(location, false, data.rawData);
                    break;
                case feng3d.GL.FLOAT:
                    gl.uniform1f(location, data);
                    break;
                case feng3d.GL.FLOAT_VEC2:
                    gl.uniform2f(location, data.x, data.y);
                    break;
                case feng3d.GL.FLOAT_VEC3:
                    gl.uniform3f(location, data.x, data.y, data.z);
                    break;
                case feng3d.GL.FLOAT_VEC4:
                    gl.uniform4f(location, data.x, data.y, data.z, data.w);
                    break;
                case feng3d.GL.SAMPLER_2D:
                case feng3d.GL.SAMPLER_CUBE:
                    var textureInfo = data;
                    //激活纹理编号
                    gl.activeTexture(feng3d.GL["TEXTURE" + activeInfo.textureID]);
                    textureInfo.active(gl);
                    //设置纹理所在采样编号
                    gl.uniform1i(location, activeInfo.textureID);
                    break;
                default:
                    throw "\u65E0\u6CD5\u8BC6\u522B\u7684uniform\u7C7B\u578B " + activeInfo.name + " " + data;
            }
        };
        /**
         */
        RenderAtomic.prototype.dodraw = function (gl) {
            var instanceCount = this.instanceCount;
            if (instanceCount instanceof Function) {
                instanceCount = instanceCount();
            }
            instanceCount = ~~instanceCount;
            var indexBuffer = this.indexBuffer;
            var shaderParams = this.shader.shaderParams;
            indexBuffer.active(gl);
            var renderMode = shaderParams.renderMode;
            if (renderMode instanceof Function)
                renderMode = renderMode();
            if (instanceCount > 1) {
                gl.drawElementsInstanced(renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset, instanceCount);
            }
            else {
                gl.drawElements(renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset);
            }
        };
        return RenderAtomic;
    }());
    feng3d.RenderAtomic = RenderAtomic;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=RenderAtomic.js.map