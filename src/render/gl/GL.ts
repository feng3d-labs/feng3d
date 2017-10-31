module feng3d
{
    export var GL = WebGLRenderingContext;
    export interface GL extends WebGLRenderingContext
    {
        webgl2: boolean;

        drawElementsInstanced(mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei);

        vertexAttribDivisor(index: GLuint, divisor: GLuint);

        drawArraysInstanced(mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei);
    }

    export function getGL(canvas: HTMLCanvasElement, options?: { preferWebGl2?: boolean })
    {
        options = options || {};
        options.preferWebGl2 = false;
        var gl = getWebGLContext(canvas, options);
        //
        gl.webgl2 = !!gl.drawArraysInstanced;
        //
        new GLExtension(gl);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(GL.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(GL.LEQUAL);            // Near things obscure far things
        return gl;
    }

    /** 
     * Initialize and get the rendering for WebGL
     * @param canvas <cavnas> element
     * @param opt_debug flag to initialize the context for debugging
     * @return the rendering context for WebGL
     */
    function getWebGLContext(canvas: HTMLCanvasElement, options?: { preferWebGl2?: boolean })
    {
        var preferWebGl2 = (options && options.preferWebGl2 !== undefined) ? options.preferWebGl2 : true;
        // var names = preferWebGl2 ? ["webgl2", "experimental-webgl2", "webgl", "experimental-webgl"] : ["webgl", "experimental-webgl"];
        var names = ["webgl", "experimental-webgl"];
        for (var i = 0; i < names.length; ++i)
        {
            try
            {
                var gl: GL = <any>canvas.getContext(names[i], options);
                return gl;
            } catch (e) { }
        }
        throw "无法初始化WEBGL";
    }

    /**
     * 在iphone中WebGLRenderingContext中静态变量值值未定义，因此此处初始化来支持iphone
     * @param gl WebGL对象
     */
    function supportIphone()
    {
        var canvas = document.createElement("canvas");
        var gl = getWebGLContext(canvas);
        for (var key in gl)
        {
            var element = gl[key];
            if (typeof element == "number" && GL[key] == undefined)
            {
                GL[key] = element;
            }
        }
    };
    supportIphone();

    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    export class RenderMode
    {
        /**
         * 点渲染
         */
        static POINTS = GL.POINTS;
        static LINE_LOOP = GL.LINE_LOOP;
        static LINE_STRIP = GL.LINE_STRIP;
        static LINES = GL.LINES;
        static TRIANGLES = GL.TRIANGLES;
        static TRIANGLE_STRIP = GL.TRIANGLE_STRIP;
        static TRIANGLE_FAN = GL.TRIANGLE_FAN;
    }
    /**
     * 纹理类型
     */
    export class TextureType
    {
        static TEXTURE_2D = GL.TEXTURE_2D;
        static TEXTURE_CUBE_MAP = GL.TEXTURE_CUBE_MAP;
    }

    /**
     * 混合方法
     */
    export class BlendEquation
    {
        /**
         *  source + destination
         */
        static FUNC_ADD = GL.FUNC_ADD;
        /**
         * source - destination
         */
        static FUNC_SUBTRACT = GL.FUNC_SUBTRACT;
        /**
         * destination - source
         */
        static FUNC_REVERSE_SUBTRACT = GL.FUNC_REVERSE_SUBTRACT;
    }

    /**
     * 混合因子（R分量系数，G分量系数，B分量系数）
     */
    export class BlendFactor
    {
        /**
         * 0.0  0.0 0.0
         */
        static ZERO = GL.ZERO;
        /**
         * 1.0  1.0 1.0
         */
        static ONE = GL.ONE;
        /**
         * Rs   Gs  Bs
         */
        static SRC_COLOR = GL.SRC_COLOR;
        /**
         * 1-Rs   1-Gs  1-Bs
         */
        static ONE_MINUS_SRC_COLOR = GL.ONE_MINUS_SRC_COLOR;
        /**
         * Rd   Gd  Bd
         */
        static DST_COLOR = GL.DST_COLOR;
        /**
         * 1-Rd   1-Gd  1-Bd
         */
        static ONE_MINUS_DST_COLOR = GL.ONE_MINUS_DST_COLOR;
        /**
         * As   As  As
         */
        static SRC_ALPHA = GL.SRC_ALPHA;
        /**
         * 1-As   1-As  1-As
         */
        static ONE_MINUS_SRC_ALPHA = GL.ONE_MINUS_SRC_ALPHA;
        /**
         * Ad   Ad  Ad
         */
        static DST_ALPHA = GL.DST_ALPHA;
        /**
         * 1-Ad   1-Ad  1-Ad
         */
        static ONE_MINUS_DST_ALPHA = GL.ONE_MINUS_DST_ALPHA;
        /**
         * min(As-Ad)   min(As-Ad)  min(As-Ad)
         */
        static SRC_ALPHA_SATURATE = GL.SRC_ALPHA_SATURATE;
    }
}