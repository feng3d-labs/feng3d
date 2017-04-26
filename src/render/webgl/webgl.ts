module feng3d
{
    /**
     * 在iphone中WebGLRenderingContext中静态变量值值未定义，因此此处初始化来支持iphone
     * @param gl WebGL对象
     */
    function supportIphone(gl: GL)
    {
        for (var key in gl)
        {
            var element = gl[key];
            if (typeof element == "number")
            {
                GL[key] = element;
            }
        }
    }

    /**
     * Create the linked program object
     * @param gl GL context
     * @param vshader a vertex shader program (string)
     * @param fshader a fragment shader program (string)
     * @return created program object, or null if the creation has failed
     */
    export function createProgram(gl: GL, vshader: string, fshader: string)
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

    /** 
     * Initialize and get the rendering for WebGL
     * @param canvas <cavnas> element
     * @param opt_debug flag to initialize the context for debugging
     * @return the rendering context for WebGL
     */
    export function getWebGLContext(canvas: HTMLCanvasElement, opt_debug = null)
    {
        // Get the rendering context for WebGL
        var gl = WebGLUtils.setupWebGL(canvas);
        if (!gl) return null;

        // if opt_debug is explicitly false, create the context for debugging
        if (arguments.length < 2 || opt_debug)
        {
            gl = WebGLDebugUtils.makeDebugContext(gl);
        }

        supportIphone(gl);
        initWebGLExtension(gl);

        return gl;
    }

    /**
     * 初始化WebGL扩展
     * @param gl WebGL
     */
    function initWebGLExtension(gl: GL)
    {
        var anisotropicExt: EXTTextureFilterAnisotropic;
        gl.ext = {
            getAnisotropicExt: function ()
            {
                if (anisotropicExt !== undefined) return anisotropicExt;
                anisotropicExt =
                    (
                        gl.getExtension('EXT_texture_filter_anisotropic') ||
                        gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
                        gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
                    );
                initAnisotropicExt(gl, anisotropicExt);
                return anisotropicExt;
            }
        };
    }

    /**
     * 初始化纹理各向异性过滤扩展
     * @param gl WebGL
     * @param anisotropicExt 纹理各向异性过滤扩展
     */
    function initAnisotropicExt(gl: GL, anisotropicExt: EXTTextureFilterAnisotropic)
    {
        var maxAnisotropy: number;
        anisotropicExt.getMaxAnisotropy = () =>
        {
            if (maxAnisotropy !== undefined) return maxAnisotropy;
            maxAnisotropy = gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            return maxAnisotropy;
        }
    }
}