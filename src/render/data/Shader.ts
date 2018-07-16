namespace feng3d
{
    /**
     * shader
     */
    export class Shader
    {
        /**
         * 着色器名称
         */
        private shaderName: string;
        /**
         * 顶点着色器代码
         */
        private vertex: string;
        /**
         * 片段着色器代码
         */
        private fragment: string
        /**
         * 顶点着色器宏变量列表
         */
        private vertexMacroVariables: string[];
        /**
         * 片段着色器宏变量列表
         */
        private fragmentMacroVariables: string[];

        private macroValues = {};

        /**
         * shader 中的 宏
         */
        shaderMacro: ShaderMacro = <any>{};

        //
        resultVertexCode: string;
        resultFragmentCode: string;

        constructor(shaderName: string)
        {
            this.shaderName = shaderName;
        }

        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL)
        {
            // 获取着色器代码
            if (this.vertex == null || this.fragment == null)
            {
                var shader = shaderlib.shaderConfig.shaders[this.shaderName];
                this.resultVertexCode = this.vertex = shaderlib.uninclude(shader.vertex);
                this.resultFragmentCode = this.fragment = shaderlib.uninclude(shader.fragment);
                this.vertexMacroVariables = shaderMacroUtils.getMacroVariablesFromCode(this.vertex);
                this.fragmentMacroVariables = shaderMacroUtils.getMacroVariablesFromCode(this.fragment);
            }

            var vertexMacroInvalid = false;
            for (let i = 0; i < this.vertexMacroVariables.length; i++)
            {
                const macroVariable = this.vertexMacroVariables[i];
                var value = this.shaderMacro[macroVariable];
                if (this.macroValues[macroVariable] != value)
                {
                    this.macroValues[macroVariable] = value;
                    vertexMacroInvalid = true;
                }
            }
            var fragmentMacroInvalid = false;
            for (let i = 0; i < this.fragmentMacroVariables.length; i++)
            {
                const macroVariable = this.fragmentMacroVariables[i];
                var value = this.shaderMacro[macroVariable];
                if (this.macroValues[macroVariable] != value)
                {
                    this.macroValues[macroVariable] = value;
                    fragmentMacroInvalid = true;
                }
            }

            if (vertexMacroInvalid)
            {
                this.clear();
                this.resultVertexCode = this.vertex.replace(/#define\s+macros/, this.getMacroCode(this.vertexMacroVariables, this.macroValues));
            }

            if (fragmentMacroInvalid)
            {
                this.clear();
                this.resultFragmentCode = this.vertex.replace(/#define\s+macros/, this.getMacroCode(this.fragmentMacroVariables, this.macroValues));
            }

            //渲染程序
            var shaderProgram = this._webGLProgramMap.get(gl);
            if (!shaderProgram)
            {
                var vshader = this.resultVertexCode;
                var fshader = this.resultFragmentCode;

                // Create shader object
                var vertexShader = gl.createShader(gl.VERTEX_SHADER);
                if (vertexShader == null)
                {
                    debuger && alert('unable to create shader');
                    return null;
                }

                // Set the shader program
                gl.shaderSource(vertexShader, vshader);

                // Compile the shader
                gl.compileShader(vertexShader);

                // Check the result of compilation
                var compiled = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
                if (!compiled)
                {
                    var error = gl.getShaderInfoLog(vertexShader);
                    debuger && alert('Failed to compile shader: ' + error);
                    gl.deleteShader(vertexShader);
                    return null;
                }

                this._vertexShaderMap.set(gl, vertexShader);

                // Create shader object
                var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                if (fragmentShader == null)
                {
                    debuger && alert('unable to create shader');
                    return null;
                }

                // Set the shader program
                gl.shaderSource(fragmentShader, fshader);

                // Compile the shader
                gl.compileShader(fragmentShader);

                // Check the result of compilation
                var compiled = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
                if (!compiled)
                {
                    var error = gl.getShaderInfoLog(fragmentShader);
                    debuger && alert('Failed to compile shader: ' + error);
                    gl.deleteShader(fragmentShader);
                    return null;
                }

                this._fragmentShaderMap.set(gl, fragmentShader);

                // Create a program object
                var shaderProgram = gl.createProgram();
                if (!shaderProgram)
                {
                    return null;
                }

                // Attach the shader objects
                gl.attachShader(shaderProgram, vertexShader);
                gl.attachShader(shaderProgram, fragmentShader);

                // Link the program object
                gl.linkProgram(shaderProgram);

                // Check the result of linking
                var linked = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
                if (!linked)
                {
                    var error = gl.getProgramInfoLog(shaderProgram);
                    debuger && alert('Failed to link program: ' + error);
                    gl.deleteProgram(shaderProgram);
                    gl.deleteShader(fragmentShader);
                    gl.deleteShader(vertexShader);
                    return null;
                }
                //
                shaderProgram.gl = gl;
                shaderProgram.vertexShader = vertexShader;
                shaderProgram.fragmentShader = fragmentShader;

                //获取属性信息
                var numAttributes = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
                shaderProgram.attributes = {};
                var i = 0;
                while (i < numAttributes)
                {
                    var activeInfo = gl.getActiveAttrib(shaderProgram, i++);
                    if (activeInfo)
                    {
                        activeInfo.location = gl.getAttribLocation(shaderProgram, activeInfo.name);
                        shaderProgram.attributes[activeInfo.name] = activeInfo;
                    }
                }
                //获取uniform信息
                var numUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
                shaderProgram.uniforms = {};
                var i = 0;
                var textureID = 0;
                while (i < numUniforms)
                {
                    var activeInfo = gl.getActiveUniform(shaderProgram, i++);
                    if (activeInfo)
                    {
                        if (activeInfo.name.indexOf("[") != -1)
                        {
                            //处理数组
                            var baseName = activeInfo.name.substring(0, activeInfo.name.indexOf("["));
                            activeInfo.uniformBaseName = baseName;
                            var uniformLocationlist: WebGLUniformLocation[] = activeInfo.uniformLocation = [];
                            for (var j = 0; j < activeInfo.size; j++)
                            {
                                var location = gl.getUniformLocation(shaderProgram, baseName + `[${j}]`);
                                location && uniformLocationlist.push(location);
                            }
                        } else
                        {
                            var uniformLocation = gl.getUniformLocation(shaderProgram, activeInfo.name);
                            if (uniformLocation)
                            {
                                activeInfo.uniformLocation = uniformLocation;
                            }
                        }
                        if (activeInfo.type == gl.SAMPLER_2D || activeInfo.type == gl.SAMPLER_CUBE)
                        {
                            activeInfo.textureID = textureID;
                            textureID++;
                        }
                        shaderProgram.uniforms[activeInfo.name] = activeInfo;
                    }
                }

                if (!shaderProgram)
                    return null;
                this._webGLProgramMap.set(gl, shaderProgram);
            }
            gl.useProgram(shaderProgram);
            return shaderProgram;
        }

        /**
         * 着色器程序缓存
         */
        protected _webGLProgramMap = new Map<GL, WebGLProgram>();
        protected _vertexShaderMap = new Map<GL, WebGLShader>();
        protected _fragmentShaderMap = new Map<GL, WebGLShader>();

        private getMacroCode(variables: string[], valueObj: Object)
        {
            var macroHeader = "";
            variables.forEach(macroName =>
            {
                var value = valueObj[macroName];
                if (typeof value == "boolean")
                {
                    value && (macroHeader += `#define ${macroName}\n`);
                } else
                {
                    macroHeader += `#define ${macroName} ${value}\n`;
                }
            });
            return macroHeader;
        }

        private clear()
        {
            this._webGLProgramMap.forEach((value, gl) =>
            {
                gl.deleteProgram(value);
            });
            this._vertexShaderMap.forEach((value, gl) =>
            {
                gl.deleteShader(value);
            });
            this._fragmentShaderMap.forEach((value, gl) =>
            {
                gl.deleteShader(value);
            });
            this._webGLProgramMap.clear();
        }
    }
}