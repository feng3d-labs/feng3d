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
            feng3dDispatcher.on("assets.shaderChanged", this.onShaderChanged, this);
        }

        private onShaderChanged()
        {
            this.vertex = this.fragment = null;
        }

        /**
         * 更新渲染代码
         */
        private updateShaderCode()
        {
            // 获取着色器代码
            if (this.vertex == null || this.fragment == null)
            {
                var result = shaderlib.getShader(this.shaderName);
                //
                this.resultVertexCode = this.vertex = result.vertex;
                //
                this.resultFragmentCode = this.fragment = result.fragment;
                this.vertexMacroVariables = result.vertexMacroVariables;
                this.fragmentMacroVariables = result.fragmentMacroVariables;
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
        }

        /**
         * 编译着色器代码
         * @param gl GL上下文
         * @param type 着色器类型
         * @param code 着色器代码
         * @return 编译后的着色器对象
         */
        private compileShaderCode(gl: GL, type: number, code: string)
        {
            var shader = gl.createShader(type);
            if (shader == null)
            {
                debuger && alert('unable to create shader');
                return null;
            }

            gl.shaderSource(shader, code);
            gl.compileShader(shader);

            // 检查编译结果
            var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!compiled)
            {
                var error = gl.getShaderInfoLog(shader);
                debuger && alert('Failed to compile shader: ' + error);
                gl.deleteShader(shader);
                return null;
            }

            return shader;
        }

        private createLinkProgram(gl: GL, vertexShader: WebGLShader, fragmentShader: WebGLShader)
        {
            // 创建程序对象
            var program = gl.createProgram();
            if (!program)
            {
                return null;
            }

            // 添加着色器
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);

            // 链接程序
            gl.linkProgram(program);

            // 检查结果
            var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (!linked)
            {
                var error = gl.getProgramInfoLog(program);
                debuger && alert('Failed to link program: ' + error);
                gl.deleteProgram(program);
                gl.deleteShader(fragmentShader);
                gl.deleteShader(vertexShader);
                return null;
            }
            return program;
        }

        /**
         * Create the linked program object
         * @param gl GL context
         * @param vshader a vertex shader program (string)
         * @param fshader a fragment shader program (string)
         * @return created program object, or null if the creation has failed
         */
        private createProgram(gl: GL, vshader: string, fshader: string)
        {
            // 编译顶点着色器
            var vertexShader = this.compileShaderCode(gl, gl.VERTEX_SHADER, vshader);
            if (!vertexShader) return null;

            // 编译片段着色器
            var fragmentShader = this.compileShaderCode(gl, gl.FRAGMENT_SHADER, fshader);
            if (!vertexShader) return null;

            // 创建着色器程序
            var shaderProgram = this.createLinkProgram(gl, vertexShader, fragmentShader);
            return shaderProgram;
        }

        private compileShaderProgram(gl: GL, vshader: string, fshader: string)
        {
            // 创建着色器程序
            // 编译顶点着色器
            var vertexShader = this.compileShaderCode(gl, gl.VERTEX_SHADER, vshader);
            if (!vertexShader) return null;

            // 编译片段着色器
            var fragmentShader = this.compileShaderCode(gl, gl.FRAGMENT_SHADER, fshader);
            if (!vertexShader) return null;

            // 创建着色器程序
            var shaderProgram = this.createLinkProgram(gl, vertexShader, fragmentShader);
            if (!shaderProgram) return null;

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

            return { program: shaderProgram, vertex: vertexShader, fragment: fragmentShader, attributes: attributes, uniforms: uniforms };
        }

        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL)
        {
            this.updateShaderCode();

            //渲染程序
            if (this.map.has(gl))
                return this.map.get(gl);

            var result = this.compileShaderProgram(gl, this.resultVertexCode, this.resultFragmentCode);
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