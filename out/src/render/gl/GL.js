var feng3d;
(function (feng3d) {
    feng3d.GL = WebGLRenderingContext;
    function getGL(canvas, options) {
        if (options === void 0) { options = null; }
        options = options || {};
        options.preferWebGl2 = false;
        var gl = getWebGLContext(canvas, options);
        //
        gl.uuid = Math.generateUUID();
        gl.webgl2 = !!gl.drawArraysInstanced;
        gl.programs = {};
        //
        new feng3d.GLExtension(gl);
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        gl.clearDepth(1.0); // Clear everything
        gl.enable(feng3d.GL.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(feng3d.GL.LEQUAL); // Near things obscure far things
        return gl;
    }
    feng3d.getGL = getGL;
    /**
     * Initialize and get the rendering for WebGL
     * @param canvas <cavnas> element
     * @param opt_debug flag to initialize the context for debugging
     * @return the rendering context for WebGL
     */
    function getWebGLContext(canvas, options) {
        if (options === void 0) { options = null; }
        var preferWebGl2 = (options && options.preferWebGl2 !== undefined) ? options.preferWebGl2 : true;
        // var names = preferWebGl2 ? ["webgl2", "experimental-webgl2", "webgl", "experimental-webgl"] : ["webgl", "experimental-webgl"];
        var names = ["webgl", "experimental-webgl"];
        var gl = null;
        for (var i = 0; i < names.length; ++i) {
            try {
                gl = canvas.getContext(names[i], options);
            }
            catch (e) { }
            if (gl) {
                break;
            }
        }
        if (!gl) {
            throw "无法初始化WEBGL";
        }
        return gl;
    }
    /**
     * 在iphone中WebGLRenderingContext中静态变量值值未定义，因此此处初始化来支持iphone
     * @param gl WebGL对象
     */
    function supportIphone() {
        var canvas = document.createElement("canvas");
        var gl = getWebGLContext(canvas);
        for (var key in gl) {
            var element = gl[key];
            if (typeof element == "number" && feng3d.GL[key] == undefined) {
                feng3d.GL[key] = element;
            }
        }
    }
    ;
    supportIphone();
    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    var RenderMode = (function () {
        function RenderMode() {
        }
        return RenderMode;
    }());
    /**
     * 点渲染
     */
    RenderMode.POINTS = feng3d.GL.POINTS;
    RenderMode.LINE_LOOP = feng3d.GL.LINE_LOOP;
    RenderMode.LINE_STRIP = feng3d.GL.LINE_STRIP;
    RenderMode.LINES = feng3d.GL.LINES;
    RenderMode.TRIANGLES = feng3d.GL.TRIANGLES;
    RenderMode.TRIANGLE_STRIP = feng3d.GL.TRIANGLE_STRIP;
    RenderMode.TRIANGLE_FAN = feng3d.GL.TRIANGLE_FAN;
    feng3d.RenderMode = RenderMode;
    /**
     * 纹理类型
     */
    var TextureType = (function () {
        function TextureType() {
        }
        return TextureType;
    }());
    TextureType.TEXTURE_2D = feng3d.GL.TEXTURE_2D;
    TextureType.TEXTURE_CUBE_MAP = feng3d.GL.TEXTURE_CUBE_MAP;
    feng3d.TextureType = TextureType;
    /**
     * 混合方法
     */
    var BlendEquation = (function () {
        function BlendEquation() {
        }
        return BlendEquation;
    }());
    /**
     *  source + destination
     */
    BlendEquation.FUNC_ADD = feng3d.GL.FUNC_ADD;
    /**
     * source - destination
     */
    BlendEquation.FUNC_SUBTRACT = feng3d.GL.FUNC_SUBTRACT;
    /**
     * destination - source
     */
    BlendEquation.FUNC_REVERSE_SUBTRACT = feng3d.GL.FUNC_REVERSE_SUBTRACT;
    feng3d.BlendEquation = BlendEquation;
    /**
     * 混合因子（R分量系数，G分量系数，B分量系数）
     */
    var BlendFactor = (function () {
        function BlendFactor() {
        }
        return BlendFactor;
    }());
    /**
     * 0.0  0.0 0.0
     */
    BlendFactor.ZERO = feng3d.GL.ZERO;
    /**
     * 1.0  1.0 1.0
     */
    BlendFactor.ONE = feng3d.GL.ONE;
    /**
     * Rs   Gs  Bs
     */
    BlendFactor.SRC_COLOR = feng3d.GL.SRC_COLOR;
    /**
     * 1-Rs   1-Gs  1-Bs
     */
    BlendFactor.ONE_MINUS_SRC_COLOR = feng3d.GL.ONE_MINUS_SRC_COLOR;
    /**
     * Rd   Gd  Bd
     */
    BlendFactor.DST_COLOR = feng3d.GL.DST_COLOR;
    /**
     * 1-Rd   1-Gd  1-Bd
     */
    BlendFactor.ONE_MINUS_DST_COLOR = feng3d.GL.ONE_MINUS_DST_COLOR;
    /**
     * As   As  As
     */
    BlendFactor.SRC_ALPHA = feng3d.GL.SRC_ALPHA;
    /**
     * 1-As   1-As  1-As
     */
    BlendFactor.ONE_MINUS_SRC_ALPHA = feng3d.GL.ONE_MINUS_SRC_ALPHA;
    /**
     * Ad   Ad  Ad
     */
    BlendFactor.DST_ALPHA = feng3d.GL.DST_ALPHA;
    /**
     * 1-Ad   1-Ad  1-Ad
     */
    BlendFactor.ONE_MINUS_DST_ALPHA = feng3d.GL.ONE_MINUS_DST_ALPHA;
    /**
     * min(As-Ad)   min(As-Ad)  min(As-Ad)
     */
    BlendFactor.SRC_ALPHA_SATURATE = feng3d.GL.SRC_ALPHA_SATURATE;
    feng3d.BlendFactor = BlendFactor;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=GL.js.map