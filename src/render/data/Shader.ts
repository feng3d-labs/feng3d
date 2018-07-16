namespace feng3d
{
    /**
     * WebGL渲染程序有效信息
     */
    export interface UniformInfo
    {
        /**
         * uniform名称
         */
        name: string;

        size: number;
        type: number;
        /**
         * uniform地址
         */
        location: WebGLUniformLocation;
        /**
         * texture索引
         */
        textureID: number;

        /**
         * Uniform数组索引，当Uniform数据为数组数据时生效
         */
        index?: number;
    }

    export interface AttributeInfo
    {
        /**
         * 名称
         */
        name: string;

        size: number;
        type: number;

        /**
         * 属性地址
         */
        location: number;

    }

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
                //
                this.resultVertexCode = this.vertex = shaderlib.uninclude(shader.vertex);
                //
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
            if (this.map.has(gl))
                return this.map.get(gl);

            // Create shader object
            var vertexShader = gl.createShader(gl.VERTEX_SHADER);
            if (vertexShader == null)
            {
                debuger && alert('unable to create shader');
                return null;
            }

            // Set the shader program
            gl.shaderSource(vertexShader, this.resultVertexCode);

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

            // Create shader object
            var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            if (fragmentShader == null)
            {
                debuger && alert('unable to create shader');
                return null;
            }

            // Set the shader program
            gl.shaderSource(fragmentShader, this.resultFragmentCode);

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

            //获取属性信息
            var numAttributes = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
            var attributes: { [name: string]: AttributeInfo } = {};
            var i = 0;
            while (i < numAttributes)
            {
                var activeInfo = gl.getActiveAttrib(shaderProgram, i++);
                attributes[activeInfo.name] = { name: activeInfo.name, size: activeInfo.size, type: activeInfo.type, location: gl.getAttribLocation(shaderProgram, activeInfo.name) };
            }
            //获取uniform信息
            var numUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
            var uniforms: { [name: string]: UniformInfo } = {};
            var i = 0;
            var textureID = 0;
            while (i < numUniforms)
            {
                var activeInfo = gl.getActiveUniform(shaderProgram, i++);
                var name = activeInfo.name;
                if (name.indexOf("[") != -1)
                {
                    //处理数组
                    var baseName = activeInfo.name.substring(0, name.indexOf("["));
                    for (var j = 0; j < activeInfo.size; j++)
                    {
                        name = baseName + `[${j}]`;

                        uniforms[name] = { index: j, name: baseName, size: activeInfo.size, type: activeInfo.type, location: gl.getUniformLocation(shaderProgram, name), textureID: textureID };
                        if (activeInfo.type == gl.SAMPLER_2D || activeInfo.type == gl.SAMPLER_CUBE)
                        {
                            textureID++;
                        }
                    }
                } else
                {
                    uniforms[name] = { name: name, size: activeInfo.size, type: activeInfo.type, location: gl.getUniformLocation(shaderProgram, name), textureID: textureID };
                    if (activeInfo.type == gl.SAMPLER_2D || activeInfo.type == gl.SAMPLER_CUBE)
                    {
                        textureID++;
                    }
                }
            }

            var result = { program: shaderProgram, vertex: vertexShader, fragment: fragmentShader, attributes: attributes, uniforms: uniforms };
            this.map.set(gl, result);
            return result;
        }

        protected map = new Map<GL, {
            program: WebGLProgram, vertex: WebGLShader, fragment: WebGLShader
            /**
             * 属性信息列表
             */
            attributes: { [name: string]: AttributeInfo };
            /**
             * uniform信息列表
             */
            uniforms: { [name: string]: UniformInfo };
        }>();

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
            this.map.forEach((value, gl) =>
            {
                gl.deleteProgram(value.program);
                gl.deleteShader(value.vertex);
                gl.deleteShader(value.fragment);
            });
            this.map.clear();
        }
    }
}