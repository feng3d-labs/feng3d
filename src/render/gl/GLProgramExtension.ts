namespace feng3d
{
    export class GLProgramExtension
    {
        constructor(gl: GL)
        {
            var oldCreateProgram = gl.createProgram;
            gl.createProgram = function ()
            {
                if (arguments.length == 2)
                {
                    return createProgram(gl, arguments[0], arguments[1]);
                }
                var webGLProgram: WebGLProgram = oldCreateProgram.apply(gl, arguments);
                webGLProgram.destroy = function ()
                {
                    gl.deleteProgram(webGLProgram);
                    gl.deleteShader(webGLProgram.fragmentShader);
                    gl.deleteShader(webGLProgram.vertexShader);
                };
                return webGLProgram;
            };
        }
    }

    /**
     * Create the linked program object
     * @param gl GL context
     * @param vshader a vertex shader program (string)
     * @param fshader a fragment shader program (string)
     * @return created program object, or null if the creation has failed
     */
    function createProgram(gl: GL, vshader: string, fshader: string)
    {
        // Create shader object
        var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
        var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
        if (!vertexShader || !fragmentShader)
        {
            return null;
        }

        // Create a program object
        var program = gl.createProgram();
        if (!program)
        {
            return null;
        }

        // Attach the shader objects
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // Link the program object
        gl.linkProgram(program);

        // Check the result of linking
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
        program.gl = gl;
        program.vertexShader = vertexShader;
        program.fragmentShader = fragmentShader;
        initProgram(program);
        return program;
    }

    /**
     * 初始化渲染程序
     * @param shaderProgram WebGL渲染程序
     */
    function initProgram(shaderProgram: WebGLProgram)
    {
        var gl = shaderProgram.gl;
        //获取属性信息
        var numAttributes = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
        shaderProgram.attributes = [];
        var i = 0;
        while (i < numAttributes)
        {
            var activeInfo = gl.getActiveAttrib(shaderProgram, i++);
            activeInfo.location = gl.getAttribLocation(shaderProgram, activeInfo.name);
            shaderProgram.attributes.push(activeInfo);
        }
        //获取uniform信息
        var numUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
        shaderProgram.uniforms = [];
        var i = 0;
        var textureID = 0;
        while (i < numUniforms)
        {
            var activeInfo = gl.getActiveUniform(shaderProgram, i++);
            if (activeInfo.name.indexOf("[") != -1)
            {
                //处理数组
                var baseName = activeInfo.name.substring(0, activeInfo.name.indexOf("["));
                activeInfo.uniformBaseName = baseName;
                var uniformLocation: WebGLUniformLocation[] = activeInfo.uniformLocation = [];
                for (var j = 0; j < activeInfo.size; j++)
                {
                    var location = gl.getUniformLocation(shaderProgram, baseName + `[${j}]`);
                    uniformLocation.push(location);
                }
            } else
            {
                activeInfo.uniformLocation = gl.getUniformLocation(shaderProgram, activeInfo.name);
            }
            if (activeInfo.type == GL.SAMPLER_2D || activeInfo.type == GL.SAMPLER_CUBE)
            {
                activeInfo.textureID = textureID;
                textureID++;
            }
            shaderProgram.uniforms.push(activeInfo);
        }
    }

    /**
     * Create a shader object
     * @param gl GL context
     * @param type the type of the shader object to be created
     * @param source shader program (string)
     * @return created shader object, or null if the creation has failed.
     */
    function loadShader(gl: GL, type: number, source: string)
    {
        // Create shader object
        var shader = gl.createShader(type);
        if (shader == null)
        {
            debuger && alert('unable to create shader');
            return null;
        }

        // Set the shader program
        gl.shaderSource(shader, source);

        // Compile the shader
        gl.compileShader(shader);

        // Check the result of compilation
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
}