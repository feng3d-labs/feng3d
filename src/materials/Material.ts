namespace feng3d
{

    /**
     * 材质
     * @author feng 2016-05-02
     */
    // @ov({ component: "OVMaterial" })
    export class Material extends EventDispatcher
    {
        @oav({ component: "OAVMaterialName" })
        @watch("onShaderChanged")
        shaderName: string;

        /**
         * 点绘制时点的尺寸
         */
        @serialize(1)
        @oav()
        pointSize = 1;

        @serialize()
        // @oav({ component: "OAVMaterialData" })
        @oav()
        uniforms = {};

        /**
         * 渲染参数
         */
        @serialize()
        @oav({ block: "渲染参数" })
        renderParams = new RenderParams();

        /**
         * 渲染程序
         */
        shader: Shader;

        constructor()
        {
            super();

            this.shader = new Shader();
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.u_PointSize = () => this.pointSize;

            this.shader.shaderName = this.shaderName;

            for (const key in this.uniforms)
            {
                if (this.uniforms.hasOwnProperty(key))
                {
                    renderAtomic.uniforms[key] = this.uniforms[key];
                }
            }
        }

        private onShaderChanged()
        {
            var shader = shaderlib.getShader(this.shaderName);

            var cls = shaderConfig.shaders[this.shaderName].cls
            if (cls)
            {
                if (this.uniforms instanceof cls)
                    return;
                this.uniforms = new cls();
                return;
            }

            if (!shader)
            {
                this.uniforms = <any>{};
                return;
            }

            //渲染程序
            var gl = GL.getToolGL();
            var shaderProgram = gl.createProgram(shader.vertex, shader.fragment);
            var uniformInfos = shaderProgram.uniforms;
            var uniforms = initUniforms(this.uniforms);
            shaderProgram.destroy();

            function initUniforms(uniforms)
            {
                for (var name in uniformInfos)
                {
                    if (uniformInfos.hasOwnProperty(name))
                    {
                        var activeInfo = uniformInfos[name];
                        if (activeInfo.uniformBaseName)
                        {
                            var baseName = activeInfo.uniformBaseName;
                            uniforms[baseName] = [];
                            //处理数组
                            for (var j = 0; j < activeInfo.size; j++)
                            {
                                uniforms[baseName][j] = setContext3DUniform({ name: baseName + `[${j}]`, type: activeInfo.type, uniformLocation: activeInfo.uniformLocation[j], textureID: activeInfo.textureID });
                            }
                        } else
                        {
                            uniforms[activeInfo.name] = setContext3DUniform(activeInfo);
                        }
                    }
                }
                return uniforms;
            }

            /**
             * 设置环境Uniform数据
             */
            function setContext3DUniform(activeInfo: { name: string; uniformLocation: WebGLUniformLocation, type: number; textureID: number })
            {
                var location = activeInfo.uniformLocation;
                var value = null;
                switch (activeInfo.type)
                {
                    case gl.INT:
                        value = 0;
                        break;
                    case gl.FLOAT_MAT4:
                        value = new Matrix4x4();
                        break;
                    case gl.FLOAT:
                        value = 0;
                        break;
                    case gl.FLOAT_VEC2:
                        value = new Vector2();
                        break;
                    case gl.FLOAT_VEC3:
                        value = new Vector3();
                        break;
                    case gl.FLOAT_VEC4:
                        value = new Vector4();
                        break;
                    case gl.SAMPLER_2D:
                        value = new Texture2D();
                        break;
                    case gl.SAMPLER_CUBE:
                        value = new TextureCube();
                        break;
                    default:
                        throw `无法识别的uniform类型 ${activeInfo.name}`;
                }
                return value;
            }
        }
    }
}
