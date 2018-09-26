namespace feng3d
{
    /**
     * shader
     */
    export class Shader
    {

        /**
         * shader 中的 宏
         */
        shaderMacro: ShaderMacro = <any>{};

        constructor(shaderName: string)
        {
            this.shaderName = shaderName;
            feng3dDispatcher.on("assets.shaderChanged", this.onShaderChanged, this);
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

            try
            {
                var result = this.compileShaderProgram(gl, this.vertex, this.fragment);
                this.map.set(gl, result);
            } catch (error)
            {
                feng3d.error(`${this.shaderName} 编译失败！\n${error}`)
                return null;
            }
            return result;
        }

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

        private macroValues = {};

        private macroInvalid = true;

        private onShaderChanged()
        {
            this.macroInvalid = true;
        }

        /**
         * 更新渲染代码
         */
        private updateShaderCode()
        {
            // 获取着色器代码
            var result = shaderlib.getShader(this.shaderName);

            var macroVariables = result.vertexMacroVariables.concat(result.fragmentMacroVariables);
            for (let i = 0; i < macroVariables.length; i++)
            {
                const macroVariable = macroVariables[i];
                var value = this.shaderMacro[macroVariable];
                if (this.macroValues[macroVariable] != value)
                {
                    this.macroValues[macroVariable] = value;
                    this.macroInvalid = true;
                }
            }

            if (this.macroInvalid)
            {
                this.clear();
                var vMacroCode = this.getMacroCode(result.vertexMacroVariables, this.macroValues);
                this.vertex = vMacroCode + result.vertex;
                var fMacroCode = this.getMacroCode(result.fragmentMacroVariables, this.macroValues);
                this.fragment = fMacroCode + result.fragment;
                this.macroInvalid = false;
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
                debugger;
                throw 'unable to create shader';
            }

            gl.shaderSource(shader, code);
            gl.compileShader(shader);

            // 检查编译结果
            var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!compiled)
            {
                var error = gl.getShaderInfoLog(shader);
                gl.deleteShader(shader);
                debugger;
                throw 'Failed to compile shader: ' + error;
            }

            return shader;
        }

        private createLinkProgram(gl: GL, vertexShader: WebGLShader, fragmentShader: WebGLShader)
        {
            // 创建程序对象
            var program = gl.createProgram();
            if (!program)
            {
                debugger;
                throw "创建 WebGLProgram 失败！"
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
                gl.deleteProgram(program);
                gl.deleteShader(fragmentShader);
                gl.deleteShader(vertexShader);
                debugger;
                throw 'Failed to link program: ' + error;
            }
            return program;
        }

        private compileShaderProgram(gl: GL, vshader: string, fshader: string)
        {
            // 创建着色器程序
            // 编译顶点着色器
            var vertexShader = this.compileShaderCode(gl, gl.VERTEX_SHADER, vshader);

            // 编译片段着色器
            var fragmentShader = this.compileShaderCode(gl, gl.FRAGMENT_SHADER, fshader);

            // 创建着色器程序
            var shaderProgram = this.createLinkProgram(gl, vertexShader, fragmentShader);

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
                var reg = /(\w+)/g;

                var name = activeInfo.name;
                var names = [name];
                if (activeInfo.size > 1)
                {
                    assert(name.substr(-3, 3) == "[0]");
                    var baseName = name.substring(0, name.length - 3);
                    for (var j = 1; j < activeInfo.size; j++)
                    {
                        names[j] = baseName + `[${j}]`;
                    }
                }

                for (let j = 0; j < names.length; j++)
                {
                    name = names[j];
                    var result: RegExpExecArray;
                    var paths: string[] = [];
                    while (result = reg.exec(name))
                    {
                        paths.push(result[1]);
                    }
                    uniforms[name] = { name: paths[0], paths: paths, size: activeInfo.size, type: activeInfo.type, location: gl.getUniformLocation(shaderProgram, name), textureID: textureID };
                    if (activeInfo.type == gl.SAMPLER_2D || activeInfo.type == gl.SAMPLER_CUBE)
                    {
                        textureID++;
                    }
                }
            }

            return { program: shaderProgram, vertex: vertexShader, fragment: fragmentShader, attributes: attributes, uniforms: uniforms };
        }

        private map = new Map<GL, {
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
                } else if (typeof value == "number")
                {
                    macroHeader += `#define ${macroName} ${value}\n`;
                }
            });
            return macroHeader + "\n";
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
        paths: string[];
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
}