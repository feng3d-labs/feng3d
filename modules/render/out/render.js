var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var feng3d;
(function (feng3d) {
    /**
     * 渲染模式
     * A GLenum specifying the type primitive to render. Possible values are:
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
     */
    var RenderMode;
    (function (RenderMode) {
        /**
         * 点渲染
         * gl.POINTS: Draws a single dot.
         */
        RenderMode["POINTS"] = "POINTS";
        /**
         * gl.LINE_LOOP: Draws a straight line to the next vertex, and connects the last vertex back to the first.
         */
        RenderMode["LINE_LOOP"] = "LINE_LOOP";
        /**
         * gl.LINE_STRIP: Draws a straight line to the next vertex.
         */
        RenderMode["LINE_STRIP"] = "LINE_STRIP";
        /**
         * gl.LINES: Draws a line between a pair of vertices.
         */
        RenderMode["LINES"] = "LINES";
        /**
         * gl.TRIANGLES: Draws a triangle for a group of three vertices.
         */
        RenderMode["TRIANGLES"] = "TRIANGLES";
        /**
         * gl.TRIANGLE_STRIP
         * @see https://en.wikipedia.org/wiki/Triangle_strip
         */
        RenderMode["TRIANGLE_STRIP"] = "TRIANGLE_STRIP";
        /**
         * gl.TRIANGLE_FAN
         * @see https://en.wikipedia.org/wiki/Triangle_fan
         */
        RenderMode["TRIANGLE_FAN"] = "TRIANGLE_FAN";
    })(RenderMode = feng3d.RenderMode || (feng3d.RenderMode = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 纹理类型
     * A GLenum specifying the binding point (target). Possible values:
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
     */
    var TextureType;
    (function (TextureType) {
        /**
         * gl.TEXTURE_2D: A two-dimensional texture.
         */
        TextureType["TEXTURE_2D"] = "TEXTURE_2D";
        /**
         * gl.TEXTURE_CUBE_MAP: A cube-mapped texture.
         */
        TextureType["TEXTURE_CUBE_MAP"] = "TEXTURE_CUBE_MAP";
        // /**
        //  * using a WebGL 2 context
        //  * gl.TEXTURE_3D: A three-dimensional texture.
        //  */
        // TEXTURE_3D = "TEXTURE_3D",
        // /**
        //  * using a WebGL 2 context
        //  * gl.TEXTURE_2D_ARRAY: A two-dimensional array texture.
        //  */
        // TEXTURE_2D_ARRAY = "TEXTURE_2D_ARRAY",
    })(TextureType = feng3d.TextureType || (feng3d.TextureType = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 混合方法
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
     */
    var BlendEquation;
    (function (BlendEquation) {
        /**
         *  source + destination
         */
        BlendEquation["FUNC_ADD"] = "FUNC_ADD";
        /**
         * source - destination
         */
        BlendEquation["FUNC_SUBTRACT"] = "FUNC_SUBTRACT";
        /**
         * destination - source
         */
        BlendEquation["FUNC_REVERSE_SUBTRACT"] = "FUNC_REVERSE_SUBTRACT";
        // /**
        //  * When using the EXT_blend_minmax extension:
        //  * Minimum of source and destination
        //  */
        // MIN_EXT = "MIN_EXT",
        // /**
        //  * When using the EXT_blend_minmax extension:
        //  * Maximum of source and destination.
        //  */
        // MAX_EXT = "MAX_EXT",
        // /**
        //  * using a WebGL 2 context
        //  * Minimum of source and destination
        //  */
        // MIN = "MIN",
        // /**
        //  * using a WebGL 2 context
        //  * Maximum of source and destination.
        //  */
        // MAX = "MAX",
    })(BlendEquation = feng3d.BlendEquation || (feng3d.BlendEquation = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 混合因子（R分量系数，G分量系数，B分量系数）
     */
    var BlendFactor;
    (function (BlendFactor) {
        /**
         * 0.0  0.0 0.0
         */
        BlendFactor["ZERO"] = "ZERO";
        /**
         * 1.0  1.0 1.0
         */
        BlendFactor["ONE"] = "ONE";
        /**
         * Rs   Gs  Bs
         */
        BlendFactor["SRC_COLOR"] = "SRC_COLOR";
        /**
         * 1-Rs   1-Gs  1-Bs
         */
        BlendFactor["ONE_MINUS_SRC_COLOR"] = "ONE_MINUS_SRC_COLOR";
        /**
         * Rd   Gd  Bd
         */
        BlendFactor["DST_COLOR"] = "DST_COLOR";
        /**
         * 1-Rd   1-Gd  1-Bd
         */
        BlendFactor["ONE_MINUS_DST_COLOR"] = "ONE_MINUS_DST_COLOR";
        /**
         * As   As  As
         */
        BlendFactor["SRC_ALPHA"] = "SRC_ALPHA";
        /**
         * 1-As   1-As  1-As
         */
        BlendFactor["ONE_MINUS_SRC_ALPHA"] = "ONE_MINUS_SRC_ALPHA";
        /**
         * Ad   Ad  Ad
         */
        BlendFactor["DST_ALPHA"] = "DST_ALPHA";
        /**
         * 1-Ad   1-Ad  1-Ad
         */
        BlendFactor["ONE_MINUS_DST_ALPHA"] = "ONE_MINUS_DST_ALPHA";
        /**
         * min(As-Ad)   min(As-Ad)  min(As-Ad)
         */
        BlendFactor["SRC_ALPHA_SATURATE"] = "SRC_ALPHA_SATURATE";
    })(BlendFactor = feng3d.BlendFactor || (feng3d.BlendFactor = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 裁剪面枚举
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
     */
    var CullFace;
    (function (CullFace) {
        /**
         * 关闭裁剪面
         */
        CullFace["NONE"] = "NONE";
        /**
         * 正面
         */
        CullFace["FRONT"] = "FRONT";
        /**
         * 背面
         */
        CullFace["BACK"] = "BACK";
        /**
         * 正面与背面
         */
        CullFace["FRONT_AND_BACK"] = "FRONT_AND_BACK";
    })(CullFace = feng3d.CullFace || (feng3d.CullFace = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 决定给WebGLRenderingContext.colorMask何种参数。
     */
    var ColorMask;
    (function (ColorMask) {
        ColorMask[ColorMask["NONE"] = 0] = "NONE";
        ColorMask[ColorMask["R"] = 1] = "R";
        ColorMask[ColorMask["G"] = 2] = "G";
        ColorMask[ColorMask["B"] = 4] = "B";
        ColorMask[ColorMask["A"] = 8] = "A";
        ColorMask[ColorMask["RGB"] = 7] = "RGB";
        /**
         *
         */
        ColorMask[ColorMask["RGBA"] = 15] = "RGBA";
    })(ColorMask = feng3d.ColorMask || (feng3d.ColorMask = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 正面方向枚举
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace
     */
    var FrontFace;
    (function (FrontFace) {
        /**
         * Clock-wise winding.
         */
        FrontFace["CW"] = "CW";
        /**
         *  Counter-clock-wise winding.
         */
        FrontFace["CCW"] = "CCW";
    })(FrontFace = feng3d.FrontFace || (feng3d.FrontFace = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 纹理颜色格式
     * A GLint specifying the color components in the texture
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    var TextureFormat;
    (function (TextureFormat) {
        /**
         * Discards the red, green and blue components and reads the alpha component.
         */
        TextureFormat["ALPHA"] = "ALPHA";
        /**
         *  Discards the alpha components and reads the red, green and blue components.
         */
        TextureFormat["RGB"] = "RGB";
        /**
         * Red, green, blue and alpha components are read from the color buffer.
         */
        TextureFormat["RGBA"] = "RGBA";
        /**
         * Each color component is a luminance component, alpha is 1.0.
         */
        TextureFormat["LUMINANCE"] = "LUMINANCE";
        /**
         * Each component is a luminance/alpha component.
         */
        TextureFormat["LUMINANCE_ALPHA"] = "LUMINANCE_ALPHA";
        // /**
        //  * When using the WEBGL_depth_texture extension:
        //  */
        // DEPTH_COMPONENT = "DEPTH_COMPONENT",
        // /**
        //  * When using the WEBGL_depth_texture extension:
        //  */
        // DEPTH_STENCIL = "DEPTH_STENCIL",
        // /**
        //  * When using the EXT_sRGB extension:
        //  */
        // SRGB_EXT = "SRGB_EXT",
        // /**
        //  * When using the EXT_sRGB extension:
        //  */
        // SRGB_ALPHA_EXT = "SRGB_ALPHA_EXT",
        // /**
        //  * using a WebGL 2 context
        //  */
        // R8 = "R8",
        // /**
        //  * using a WebGL 2 context
        //  */
        // R16F = "R16F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // R32F = "R32F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // R8UI = "R8UI",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RG8 = "RG8",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RG16F = "RG16F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RG32F = "RG32F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RG8UI = "RG8UI",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RG16UI = "RG16UI",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RG32UI = "RG32UI",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB8 = "RGB8",
        // /**
        //  * using a WebGL 2 context
        //  */
        // SRGB8 = "SRGB8",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB565 = "RGB565",
        // /**
        //  * using a WebGL 2 context
        //  */
        // R11F_G11F_B10F = "R11F_G11F_B10F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB9_E5 = "RGB9_E5",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB16F = "RGB16F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB32F = "RGB32F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB8UI = "RGB8UI",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGBA8 = "RGBA8",
        // /**
        //  * using a WebGL 2 context
        //  */
        // // SRGB8_APLHA8,
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB5_A1 = "RGB5_A1",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB10_A2 = "RGB10_A2",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGBA4 = "RGBA4",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGBA16F = "RGBA16F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGBA32F = "RGBA32F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGBA8UI = "RGBA8UI",
    })(TextureFormat = feng3d.TextureFormat || (feng3d.TextureFormat = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 纹理数据类型
     * A GLenum specifying the data type of the texel data
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    var TextureDataType;
    (function (TextureDataType) {
        /**
         * 8 bits per channel for gl.RGBA
         */
        TextureDataType["UNSIGNED_BYTE"] = "UNSIGNED_BYTE";
        /**
         * 5 red bits, 6 green bits, 5 blue bits.
         */
        TextureDataType["UNSIGNED_SHORT_5_6_5"] = "UNSIGNED_SHORT_5_6_5";
        /**
         * 4 red bits, 4 green bits, 4 blue bits, 4 alpha bits.
         */
        TextureDataType["UNSIGNED_SHORT_4_4_4_4"] = "UNSIGNED_SHORT_4_4_4_4";
        /**
         * 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
         */
        TextureDataType["UNSIGNED_SHORT_5_5_5_1"] = "UNSIGNED_SHORT_5_5_5_1";
        // /**
        //  * When using the WEBGL_depth_texture extension:
        //  */
        // UNSIGNED_SHORT = "UNSIGNED_SHORT",
        // /**
        //  * When using the WEBGL_depth_texture extension:
        //  */
        // UNSIGNED_INT = "UNSIGNED_INT",
        // /**
        //  * When using the WEBGL_depth_texture extension:
        //  *  (constant provided by the extension)
        //  */
        // UNSIGNED_INT_24_8_WEBGL = "UNSIGNED_INT_24_8_WEBGL",
        // //When using the OES_texture_half_float extension:
        // /**
        //  * When using the OES_texture_float extension:
        //  */
        // FLOAT = "FLOAT",
        // /**
        //  * When using the OES_texture_half_float extension:
        //  *  (constant provided by the extension)
        //  */
        // HALF_FLOAT_OES = "HALF_FLOAT_OES",
        // // When using a WebGL 2 context, the following values are available additionally:
        // /**
        //  * using a WebGL 2 context
        //  */
        // BYTE = "BYTE",
        // // UNSIGNED_SHORT   // 与上面合并处理
        // /**
        //  * using a WebGL 2 context
        //  */
        // SHORT = "SHORT",
        // // UNSIGNED_INT     // 与上面合并处理
        // /**
        //  * using a WebGL 2 context
        //  */
        // INT = "INT",
        // /**
        //  * using a WebGL 2 context
        //  */
        // HALF_FLOAT = "HALF_FLOAT",
        // // FLOAT               // 与上面合并处理
        // /**
        //  * using a WebGL 2 context
        //  */
        // UNSIGNED_INT_2_10_10_10_REV = "UNSIGNED_INT_2_10_10_10_REV",
        // /**
        //  * using a WebGL 2 context
        //  */
        // UNSIGNED_INT_10F_11F_11F_REV = "UNSIGNED_INT_10F_11F_11F_REV",
        // /**
        //  * using a WebGL 2 context
        //  */
        // UNSIGNED_INT_5_9_9_9_REV = "UNSIGNED_INT_5_9_9_9_REV",
        // /**
        //  * using a WebGL 2 context
        //  */
        // UNSIGNED_INT_24_8 = "UNSIGNED_INT_24_8",
        // /**
        //  * using a WebGL 2 context
        //  *  (pixels must be null)
        //  */
        // FLOAT_32_UNSIGNED_INT_24_8_REV = "FLOAT_32_UNSIGNED_INT_24_8_REV",
    })(TextureDataType = feng3d.TextureDataType || (feng3d.TextureDataType = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 纹理缩小过滤器
     * Texture minification filter
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    var TextureMinFilter;
    (function (TextureMinFilter) {
        TextureMinFilter["LINEAR"] = "LINEAR";
        TextureMinFilter["NEAREST"] = "NEAREST";
        TextureMinFilter["NEAREST_MIPMAP_NEAREST"] = "NEAREST_MIPMAP_NEAREST";
        TextureMinFilter["LINEAR_MIPMAP_NEAREST"] = "LINEAR_MIPMAP_NEAREST";
        /**
         *  (default value)
         */
        TextureMinFilter["NEAREST_MIPMAP_LINEAR"] = "NEAREST_MIPMAP_LINEAR";
        TextureMinFilter["LINEAR_MIPMAP_LINEAR"] = "LINEAR_MIPMAP_LINEAR";
    })(TextureMinFilter = feng3d.TextureMinFilter || (feng3d.TextureMinFilter = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 纹理放大滤波器
     * Texture magnification filter
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    var TextureMagFilter;
    (function (TextureMagFilter) {
        /**
         *  (default value)
         */
        TextureMagFilter["LINEAR"] = "LINEAR";
        TextureMagFilter["NEAREST"] = "NEAREST";
    })(TextureMagFilter = feng3d.TextureMagFilter || (feng3d.TextureMagFilter = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 纹理坐标s包装函数枚举
     * Wrapping function for texture coordinate s
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    var TextureWrap;
    (function (TextureWrap) {
        /**
         * (default value)
         */
        TextureWrap["REPEAT"] = "REPEAT";
        TextureWrap["CLAMP_TO_EDGE"] = "CLAMP_TO_EDGE";
        TextureWrap["MIRRORED_REPEAT"] = "MIRRORED_REPEAT";
    })(TextureWrap = feng3d.TextureWrap || (feng3d.TextureWrap = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * GL 数组数据类型
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     */
    var GLArrayType;
    (function (GLArrayType) {
        /**
         * signed 8-bit integer, with values in [-128, 127]
         */
        GLArrayType["BYTE"] = "BYTE";
        /**
         *  signed 16-bit integer, with values in [-32768, 32767]
         */
        GLArrayType["SHORT"] = "SHORT";
        /**
         * unsigned 8-bit integer, with values in [0, 255]
         */
        GLArrayType["UNSIGNED_BYTE"] = "UNSIGNED_BYTE";
        /**
         * unsigned 16-bit integer, with values in [0, 65535]
         */
        GLArrayType["UNSIGNED_SHORT"] = "UNSIGNED_SHORT";
        /**
         * 32-bit floating point number
         */
        GLArrayType["FLOAT"] = "FLOAT";
        // /**
        //  * using a WebGL 2 context
        //  * 16-bit floating point number
        //  */
        // HALF_FLOAT = "HALF_FLOAT",
    })(GLArrayType = feng3d.GLArrayType || (feng3d.GLArrayType = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * A GLenum specifying the intended usage pattern of the data store for optimization purposes.
     *
     * 指定数据存储区的使用方法。
     *
     * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     */
    var AttributeUsage;
    (function (AttributeUsage) {
        /**
         * The contents are intended to be specified once by the application, and used many times as the source for WebGL drawing and image specification commands.
         *
         * 内容由应用程序指定一次，并多次用作WebGL绘图和图像规范命令的源。
         *
         * 缓冲区的内容可能经常使用，而不会经常更改。内容被写入缓冲区，但不被读取。
         */
        AttributeUsage["STATIC_DRAW"] = "STATIC_DRAW";
        /**
         * The contents are intended to be respecified repeatedly by the application, and used many times as the source for WebGL drawing and image specification commands.
         *
         * 这些内容将由应用程序反复重新指定，并多次用作WebGL绘图和图像规范命令的源。
         */
        AttributeUsage["DYNAMIC_DRAW"] = "DYNAMIC_DRAW";
        /**
         * The contents are intended to be specified once by the application, and used at most a few times as the source for WebGL drawing and image specification commands.
         *
         * 内容由应用程序指定一次，最多几次用作WebGL绘图和图像规范命令的源。
         */
        AttributeUsage["STREAM_DRAW"] = "STREAM_DRAW";
    })(AttributeUsage = feng3d.AttributeUsage || (feng3d.AttributeUsage = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 深度检测方法枚举
     * A GLenum specifying the depth comparison function, which sets the conditions under which the pixel will be drawn. The default value is gl.LESS.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
     */
    var DepthFunc;
    (function (DepthFunc) {
        /**
         * (never pass)
         */
        DepthFunc["NEVER"] = "NEVER";
        /**
         *  (pass if the incoming value is less than the depth buffer value)
         */
        DepthFunc["LESS"] = "LESS";
        /**
         *  (pass if the incoming value equals the the depth buffer value)
         */
        DepthFunc["EQUAL"] = "EQUAL";
        /**
         *  (pass if the incoming value is less than or equal to the depth buffer value)
         */
        DepthFunc["LEQUAL"] = "LEQUAL";
        /**
         * (pass if the incoming value is greater than the depth buffer value)
         */
        DepthFunc["GREATER"] = "GREATER";
        /**
         * (pass if the incoming value is not equal to the depth buffer value)
         */
        DepthFunc["NOTEQUAL"] = "NOTEQUAL";
        /**
         * (pass if the incoming value is greater than or equal to the depth buffer value)
         */
        DepthFunc["GEQUAL"] = "GEQUAL";
        /**
         *  (always pass)
         */
        DepthFunc["ALWAYS"] = "ALWAYS";
    })(DepthFunc = feng3d.DepthFunc || (feng3d.DepthFunc = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var GL = /** @class */ (function () {
        function GL() {
        }
        /**
         * 获取 GL 实例
         * @param canvas 画布
         * @param contextAttributes
         */
        GL.getGL = function (canvas, contextAttributes) {
            // var contextIds = ["webgl2", "webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
            var contextIds = ["webgl"];
            var gl = null;
            for (var i = 0; i < contextIds.length; ++i) {
                try {
                    gl = canvas.getContext(contextIds[i], contextAttributes);
                    gl.contextId = contextIds[i];
                    gl.contextAttributes = contextAttributes;
                    break;
                }
                catch (e) { }
            }
            if (!gl)
                throw "无法初始化WEBGL";
            //
            new feng3d.GLCache(gl);
            new feng3d.GLExtension(gl);
            new feng3d.GLCapabilities(gl);
            new feng3d.Renderer(gl);
            //
            gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
            gl.clearDepth(1.0); // Clear everything
            gl.enable(gl.DEPTH_TEST); // Enable depth testing
            gl.depthFunc(gl.LEQUAL); // Near things obscure far things
            this.glList.push(gl);
            return gl;
        };
        GL.glList = [];
        return GL;
    }());
    feng3d.GL = GL;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * GL 缓存
     */
    var GLCache = /** @class */ (function () {
        function GLCache(gl) {
            this.compileShaderResults = {};
            /**
             * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
             */
            this.textures = new Map();
            /**
             * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
             */
            this.attributes = new Map();
            gl.cache = this;
            this._gl = gl;
        }
        return GLCache;
    }());
    feng3d.GLCache = GLCache;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * GL扩展
     */
    var GLExtension = /** @class */ (function () {
        function GLExtension(gl) {
            console.assert(!gl.extensions, gl + " " + gl.extensions + " \u5B58\u5728\uFF01");
            gl.extensions = this;
            this.initExtensions(gl);
            this.cacheGLQuery(gl);
            this.wrap(gl);
        }
        GLExtension.prototype.initExtensions = function (gl) {
            this.ANGLE_instanced_arrays = gl.getExtension("ANGLE_instanced_arrays");
            this.EXT_blend_minmax = gl.getExtension("EXT_blend_minmax");
            this.EXT_color_buffer_half_float = gl.getExtension("EXT_color_buffer_half_float");
            this.EXT_frag_depth = gl.getExtension("EXT_frag_depth");
            this.EXT_sRGB = gl.getExtension("EXT_sRGB");
            this.EXT_shader_texture_lod = gl.getExtension("EXT_shader_texture_lod");
            this.EXT_texture_filter_anisotropic = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('MOZ_EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
            this.OES_element_index_uint = gl.getExtension("OES_element_index_uint");
            this.OES_standard_derivatives = gl.getExtension("OES_standard_derivatives");
            this.OES_texture_float = gl.getExtension("OES_texture_float");
            this.OES_texture_float_linear = gl.getExtension("OES_texture_float_linear");
            this.OES_texture_half_float = gl.getExtension("OES_texture_half_float");
            this.OES_texture_half_float_linear = gl.getExtension("OES_texture_half_float_linear");
            this.OES_vertex_array_object = gl.getExtension("OES_vertex_array_object");
            this.WEBGL_color_buffer_float = gl.getExtension("WEBGL_color_buffer_float");
            this.WEBGL_compressed_texture_atc = gl.getExtension("WEBGL_compressed_texture_atc") || gl.getExtension("WEBKIT_WEBGL_compressed_texture_atc");
            this.WEBGL_compressed_texture_etc1 = gl.getExtension("WEBGL_compressed_texture_etc1");
            this.WEBGL_compressed_texture_pvrtc = gl.getExtension('WEBGL_compressed_texture_pvrtc') || gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc');
            this.WEBGL_compressed_texture_s3tc = gl.getExtension('WEBGL_compressed_texture_s3tc') || gl.getExtension('MOZ_WEBGL_compressed_texture_s3tc') || gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc');
            this.WEBGL_debug_renderer_info = gl.getExtension("WEBGL_debug_renderer_info");
            this.WEBGL_debug_shaders = gl.getExtension("WEBGL_debug_shaders");
            this.WEBGL_depth_texture = gl.getExtension('WEBGL_depth_texture') || gl.getExtension('MOZ_WEBGL_depth_texture') || gl.getExtension('WEBKIT_WEBGL_depth_texture');
            this.WEBGL_draw_buffers = gl.getExtension("WEBGL_draw_buffers");
            this.WEBGL_lose_context = gl.getExtension("WEBGL_lose_context") || gl.getExtension("WEBKIT_WEBGL_lose_context") || gl.getExtension("MOZ_WEBGL_lose_context");
        };
        /**
         * 缓存GL查询
         * @param gl GL实例
         */
        GLExtension.prototype.cacheGLQuery = function (gl) {
            var oldGetExtension = gl.getExtension;
            gl.getExtension = function (name) {
                gl.extensions[name] = gl.extensions[name] || oldGetExtension.apply(gl, arguments);
                return gl.extensions[name];
            };
        };
        GLExtension.prototype.wrap = function (gl) {
            if (!gl.texParameterfAnisotropy) {
                gl.texParameterfAnisotropy = function (target, anisotropy) {
                    if (anisotropy <= 0)
                        return;
                    if (gl.extensions.EXT_texture_filter_anisotropic) {
                        if (anisotropy > gl.capabilities.maxAnisotropy) {
                            anisotropy = gl.capabilities.maxAnisotropy;
                            console.warn(anisotropy + " \u8D85\u51FA maxAnisotropy \u7684\u6700\u5927\u503C " + gl.capabilities.maxAnisotropy + " \uFF01,\u4F7F\u7528\u6700\u5927\u503C\u66FF\u6362\u3002");
                        }
                        gl.texParameterf(target, gl.extensions.EXT_texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
                    }
                    else {
                        console.warn("浏览器不支持各向异性过滤（anisotropy）特性！");
                    }
                };
            }
            //
            if (!gl.vertexAttribDivisor) {
                gl.vertexAttribDivisor = function (index, divisor) {
                    if (gl.extensions.ANGLE_instanced_arrays) {
                        gl.extensions.ANGLE_instanced_arrays.vertexAttribDivisorANGLE(index, divisor);
                    }
                    else {
                        console.warn("\u6D4F\u89C8\u5668 \u4E0D\u652F\u6301 drawElementsInstanced \uFF01");
                    }
                };
            }
            if (!gl.drawElementsInstanced) {
                gl.drawElementsInstanced = function (mode, count, type, offset, instanceCount) {
                    if (gl.extensions.ANGLE_instanced_arrays) {
                        gl.extensions.ANGLE_instanced_arrays.drawElementsInstancedANGLE(mode, count, type, offset, instanceCount);
                    }
                    else {
                        console.warn("\u6D4F\u89C8\u5668 \u4E0D\u652F\u6301 drawElementsInstanced \uFF01");
                    }
                };
            }
            if (!gl.drawArraysInstanced) {
                gl.drawArraysInstanced = function (mode, first, count, instanceCount) {
                    if (gl.extensions.ANGLE_instanced_arrays) {
                        gl.extensions.ANGLE_instanced_arrays.drawArraysInstancedANGLE(mode, first, count, instanceCount);
                    }
                    else {
                        console.warn("\u6D4F\u89C8\u5668 \u4E0D\u652F\u6301 drawArraysInstanced \uFF01");
                    }
                };
            }
        };
        return GLExtension;
    }());
    feng3d.GLExtension = GLExtension;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * WEBGL 支持功能
     *
     * @see https://webglreport.com
     * @see http://html5test.com
     */
    var GLCapabilities = /** @class */ (function () {
        function GLCapabilities(gl) {
            gl.capabilities = this;
            function getMaxPrecision(precision) {
                if (precision === 'highp') {
                    if (gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT).precision > 0 &&
                        gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision > 0) {
                        return 'highp';
                    }
                    precision = 'mediump';
                }
                if (precision === 'mediump') {
                    if (gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT).precision > 0 &&
                        gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT).precision > 0) {
                        return 'mediump';
                    }
                }
                return 'lowp';
            }
            this.isWebGL2 = false;
            var gl2 = null;
            if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
                gl2 = gl;
                this.isWebGL2 = true;
            }
            if (gl.extensions.EXT_texture_filter_anisotropic) {
                this.maxAnisotropy = gl.getParameter(gl.extensions.EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            }
            else {
                this.maxAnisotropy = 0;
            }
            this.maxPrecision = getMaxPrecision('highp');
            this.maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
            this.maxVertexTextures = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
            this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            this.maxCubemapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
            this.maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
            this.maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
            this.maxVaryings = gl.getParameter(gl.MAX_VARYING_VECTORS);
            this.maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
            this.vertexTextures = this.maxVertexTextures > 0;
            this.floatFragmentTextures = this.isWebGL2 || !!gl.getExtension('OES_texture_float');
            this.floatVertexTextures = this.vertexTextures && this.floatFragmentTextures;
            this.maxSamples = this.isWebGL2 ? gl.getParameter(gl2.MAX_SAMPLES) : 0;
        }
        return GLCapabilities;
    }());
    feng3d.GLCapabilities = GLCapabilities;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * shader
     */
    var Shader = /** @class */ (function () {
        function Shader(shaderName) {
            /**
             * shader 中的 宏
             */
            this.shaderMacro = {};
            this.shaderName = shaderName;
        }
        /**
         * 激活渲染程序
         */
        Shader.prototype.activeShaderProgram = function (gl) {
            this.updateShaderCode();
            var shaderKey = this.vertex + this.fragment;
            var result = gl.cache.compileShaderResults[shaderKey];
            if (result)
                return result;
            //渲染程序
            try {
                result = gl.cache.compileShaderResults[shaderKey] = this.compileShaderProgram(gl, this.vertex, this.fragment);
            }
            catch (error) {
                console.error(this.shaderName + " \u7F16\u8BD1\u5931\u8D25\uFF01\n" + error);
                return null;
            }
            return result;
        };
        /**
         * 更新渲染代码
         */
        Shader.prototype.updateShaderCode = function () {
            // 获取着色器代码
            var result = feng3d.shaderlib.getShader(this.shaderName);
            var vMacroCode = this.getMacroCode(result.vertexMacroVariables, this.shaderMacro);
            this.vertex = vMacroCode + result.vertex;
            var fMacroCode = this.getMacroCode(result.fragmentMacroVariables, this.shaderMacro);
            this.fragment = fMacroCode + result.fragment;
        };
        /**
         * 编译着色器代码
         * @param gl GL上下文
         * @param type 着色器类型
         * @param code 着色器代码
         * @return 编译后的着色器对象
         */
        Shader.prototype.compileShaderCode = function (gl, type, code) {
            var shader = gl.createShader(type);
            if (shader == null) {
                debugger;
                throw 'unable to create shader';
            }
            gl.shaderSource(shader, code);
            gl.compileShader(shader);
            // 检查编译结果
            var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!compiled) {
                var error = gl.getShaderInfoLog(shader);
                gl.deleteShader(shader);
                debugger;
                throw 'Failed to compile shader: ' + error;
            }
            return shader;
        };
        Shader.prototype.createLinkProgram = function (gl, vertexShader, fragmentShader) {
            // 创建程序对象
            var program = gl.createProgram();
            if (!program) {
                debugger;
                throw "创建 WebGLProgram 失败！";
            }
            // 添加着色器
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            // 链接程序
            gl.linkProgram(program);
            // 检查结果
            var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (!linked) {
                var error = gl.getProgramInfoLog(program);
                gl.deleteProgram(program);
                gl.deleteShader(fragmentShader);
                gl.deleteShader(vertexShader);
                debugger;
                throw 'Failed to link program: ' + error;
            }
            return program;
        };
        Shader.prototype.compileShaderProgram = function (gl, vshader, fshader) {
            // 创建着色器程序
            // 编译顶点着色器
            var vertexShader = this.compileShaderCode(gl, gl.VERTEX_SHADER, vshader);
            // 编译片段着色器
            var fragmentShader = this.compileShaderCode(gl, gl.FRAGMENT_SHADER, fshader);
            // 创建着色器程序
            var shaderProgram = this.createLinkProgram(gl, vertexShader, fragmentShader);
            //获取属性信息
            var numAttributes = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
            var attributes = {};
            var i = 0;
            while (i < numAttributes) {
                var activeInfo = gl.getActiveAttrib(shaderProgram, i++);
                attributes[activeInfo.name] = { name: activeInfo.name, size: activeInfo.size, type: activeInfo.type, location: gl.getAttribLocation(shaderProgram, activeInfo.name) };
            }
            //获取uniform信息
            var numUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
            var uniforms = {};
            var i = 0;
            var textureID = 0;
            while (i < numUniforms) {
                var activeInfo = gl.getActiveUniform(shaderProgram, i++);
                var reg = /(\w+)/g;
                var name = activeInfo.name;
                var names = [name];
                if (activeInfo.size > 1) {
                    console.assert(name.substr(-3, 3) == "[0]");
                    var baseName = name.substring(0, name.length - 3);
                    for (var j = 1; j < activeInfo.size; j++) {
                        names[j] = baseName + ("[" + j + "]");
                    }
                }
                for (var j_1 = 0; j_1 < names.length; j_1++) {
                    name = names[j_1];
                    var result;
                    var paths = [];
                    while (result = reg.exec(name)) {
                        paths.push(result[1]);
                    }
                    uniforms[name] = { name: paths[0], paths: paths, size: activeInfo.size, type: activeInfo.type, location: gl.getUniformLocation(shaderProgram, name), textureID: textureID };
                    if (activeInfo.type == gl.SAMPLER_2D || activeInfo.type == gl.SAMPLER_CUBE) {
                        textureID++;
                    }
                }
            }
            return { program: shaderProgram, vertex: vertexShader, fragment: fragmentShader, attributes: attributes, uniforms: uniforms };
        };
        Shader.prototype.getMacroCode = function (variables, valueObj) {
            var macroHeader = "";
            variables.forEach(function (macroName) {
                var value = valueObj[macroName];
                if (typeof value == "boolean") {
                    value && (macroHeader += "#define " + macroName + "\n");
                }
                else if (typeof value == "number") {
                    macroHeader += "#define " + macroName + " " + value + "\n";
                }
            });
            return macroHeader + "\n";
        };
        return Shader;
    }());
    feng3d.Shader = Shader;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染参数
     */
    var RenderParams = /** @class */ (function () {
        function RenderParams(raw) {
            /**
            * 渲染模式，默认RenderMode.TRIANGLES
            */
            this.renderMode = feng3d.RenderMode.TRIANGLES;
            /**
             * 剔除面
             * 参考：http://www.jianshu.com/p/ee04165f2a02
             * 默认情况下，逆时针的顶点连接顺序被定义为三角形的正面。
             * 使用gl.frontFace(gl.CW);调整顺时针为正面
             */
            this.cullFace = feng3d.CullFace.BACK;
            this.frontFace = feng3d.FrontFace.CW;
            /**
             * 是否开启混合
             * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
             */
            this.enableBlend = false;
            /**
             * 混合方式，默认BlendEquation.FUNC_ADD
             */
            this.blendEquation = feng3d.BlendEquation.FUNC_ADD;
            /**
             * 源混合因子，默认BlendFactor.SRC_ALPHA
             */
            this.sfactor = feng3d.BlendFactor.SRC_ALPHA;
            /**
             * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
             */
            this.dfactor = feng3d.BlendFactor.ONE_MINUS_SRC_ALPHA;
            /**
             * 是否开启深度检查
             */
            this.depthtest = true;
            this.depthFunc = feng3d.DepthFunc.LESS;
            /**
             * 是否开启深度标记
             */
            this.depthMask = true;
            /**
             * 控制那些颜色分量是否可以被写入到帧缓冲器。
             *
             * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask
             */
            this.colorMask = feng3d.ColorMask.RGBA;
            /**
             * 绘制在画布上的区域
             */
            // @oav({ tooltip: "绘制在画布上的区域" })
            this.viewRect = { x: 0, y: 0, width: 100, height: 100 };
            /**
             * 是否使用 viewRect
             */
            // @oav({ tooltip: "是否使用 viewRect" })
            this.useViewRect = false;
            Object.assign(this, raw);
        }
        __decorate([
            feng3d.serialize,
            feng3d.oav({ component: "OAVEnum", tooltip: "渲染模式，默认RenderMode.TRIANGLES", componentParam: { enumClass: feng3d.RenderMode } })
        ], RenderParams.prototype, "renderMode", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav({ component: "OAVEnum", tooltip: "剔除面", componentParam: { enumClass: feng3d.CullFace } })
        ], RenderParams.prototype, "cullFace", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav({ component: "OAVEnum", tooltip: "正面方向，默认FrontFace.CW 顺时针为正面", componentParam: { enumClass: feng3d.FrontFace } })
        ], RenderParams.prototype, "frontFace", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav({ tooltip: "是否开启混合" })
        ], RenderParams.prototype, "enableBlend", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav({ component: "OAVEnum", tooltip: "混合方式，默认BlendEquation.FUNC_ADD", componentParam: { enumClass: feng3d.BlendEquation } })
        ], RenderParams.prototype, "blendEquation", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav({ component: "OAVEnum", tooltip: "源混合因子，默认BlendFactor.SRC_ALPHA", componentParam: { enumClass: feng3d.BlendFactor } })
        ], RenderParams.prototype, "sfactor", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav({ component: "OAVEnum", tooltip: "目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA", componentParam: { enumClass: feng3d.BlendFactor } })
        ], RenderParams.prototype, "dfactor", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav({ tooltip: "是否开启深度检查" })
        ], RenderParams.prototype, "depthtest", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav({ component: "OAVEnum", tooltip: "深度检测方法", componentParam: { enumClass: feng3d.DepthFunc } })
        ], RenderParams.prototype, "depthFunc", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav({ tooltip: "是否开启深度标记" })
        ], RenderParams.prototype, "depthMask", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav({ component: "OAVEnum", tooltip: "深度检测方法", componentParam: { enumClass: feng3d.ColorMask } })
        ], RenderParams.prototype, "colorMask", void 0);
        __decorate([
            feng3d.serialize
        ], RenderParams.prototype, "viewRect", void 0);
        __decorate([
            feng3d.serialize
        ], RenderParams.prototype, "useViewRect", void 0);
        return RenderParams;
    }());
    feng3d.RenderParams = RenderParams;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     */
    var RenderAtomic = /** @class */ (function () {
        function RenderAtomic() {
            /**
             * 属性数据列表
             */
            this.attributes = {};
            /**
             * Uniform渲染数据
             */
            this.uniforms = {};
            /**
             * shader 中的 宏
             */
            this.shaderMacro = {};
            /**
             * 渲染参数
             */
            this.renderParams = {};
        }
        RenderAtomic.prototype.getIndexBuffer = function () {
            if (this.indexBuffer != undefined)
                return this.indexBuffer;
            return (this.next && this.next.getIndexBuffer());
        };
        RenderAtomic.prototype.getAttributes = function (attributes) {
            if (attributes === void 0) { attributes = {}; }
            this.next && this.next.getAttributes(attributes);
            Object.assign(attributes, this.attributes);
            return attributes;
        };
        RenderAtomic.prototype.getAttributeByKey = function (key) {
            if (this.attributes[key] != undefined)
                return this.attributes[key];
            return (this.next && this.next.getAttributeByKey(key));
        };
        RenderAtomic.prototype.getUniforms = function (uniforms) {
            if (uniforms === void 0) { uniforms = {}; }
            this.next && this.next.getUniforms(uniforms);
            Object.assign(uniforms, this.uniforms);
            return uniforms;
        };
        RenderAtomic.prototype.getUniformByKey = function (key) {
            if (this.uniforms[key] != undefined)
                return feng3d.lazy.getvalue(this.uniforms[key]);
            return (this.next && this.next.getUniformByKey(key));
        };
        RenderAtomic.prototype.getInstanceCount = function () {
            if (this.instanceCount != undefined)
                return feng3d.lazy.getvalue(this.instanceCount);
            return this.next && this.next.getInstanceCount();
        };
        RenderAtomic.prototype.getShader = function () {
            if (this.shader != undefined)
                return this.shader;
            return this.next && this.next.getShader();
        };
        RenderAtomic.prototype.getRenderParams = function (renderParams) {
            if (renderParams === void 0) { renderParams = new feng3d.RenderParams(); }
            this.next && this.next.getRenderParams(renderParams);
            Object.assign(renderParams, this.renderParams);
            return renderParams;
        };
        RenderAtomic.prototype.getShaderMacro = function (shaderMacro) {
            if (shaderMacro === void 0) { shaderMacro = {}; }
            this.next && this.next.getShaderMacro(shaderMacro);
            Object.assign(shaderMacro, this.shaderMacro);
            return shaderMacro;
        };
        return RenderAtomic;
    }());
    feng3d.RenderAtomic = RenderAtomic;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 索引渲染数据

     */
    var Index = /** @class */ (function () {
        function Index() {
            /**
             * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
             */
            this.type = feng3d.GLArrayType.UNSIGNED_SHORT;
            /**
             * 索引偏移
             */
            this.offset = 0;
            /**
             * 缓冲
             */
            this._indexBufferMap = new Map();
            /**
             * 是否失效
             */
            this.invalid = true;
        }
        Object.defineProperty(Index.prototype, "indices", {
            /**
             * 索引数据
             */
            get: function () {
                return this._indices;
            },
            set: function (v) {
                if (this._indices == v)
                    return;
                this._indices = v;
                this.invalidate();
            },
            enumerable: true,
            configurable: true
        });
        Index.prototype.invalidate = function () {
            this.invalid = true;
        };
        Object.defineProperty(Index.prototype, "count", {
            /**
             * 渲染数量
             */
            get: function () {
                if (!this.indices)
                    return 0;
                return this.indices.length;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 激活缓冲
         * @param gl
         */
        Index.prototype.active = function (gl) {
            if (this.invalid) {
                this.clear();
                this.invalid = false;
            }
            var buffer = this.getBuffer(gl);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        };
        /**
         * 获取缓冲
         */
        Index.prototype.getBuffer = function (gl) {
            var buffer = this._indexBufferMap.get(gl);
            if (!buffer) {
                buffer = gl.createBuffer();
                if (!buffer) {
                    console.error("createBuffer 失败！");
                    throw "";
                }
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
                this._indexBufferMap.set(gl, buffer);
            }
            return buffer;
        };
        /**
         * 清理缓冲
         */
        Index.prototype.clear = function () {
            this._indexBufferMap.forEach(function (value, key) {
                key.deleteBuffer(value);
            });
            this._indexBufferMap.clear();
        };
        return Index;
    }());
    feng3d.Index = Index;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 属性渲染数据
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     */
    var Attribute = /** @class */ (function () {
        function Attribute(name, data, size, divisor) {
            if (size === void 0) { size = 3; }
            if (divisor === void 0) { divisor = 0; }
            /**
             * 数据尺寸
             *
             * A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
             */
            this.size = 3;
            /**
             *  A GLenum specifying the data type of each component in the array. Possible values:
                    - gl.BYTE: signed 8-bit integer, with values in [-128, 127]
                    - gl.SHORT: signed 16-bit integer, with values in [-32768, 32767]
                    - gl.UNSIGNED_BYTE: unsigned 8-bit integer, with values in [0, 255]
                    - gl.UNSIGNED_SHORT: unsigned 16-bit integer, with values in [0, 65535]
                    - gl.FLOAT: 32-bit floating point number
                When using a WebGL 2 context, the following values are available additionally:
                   - gl.HALF_FLOAT: 16-bit floating point number
             */
            this.type = feng3d.GLArrayType.FLOAT;
            /**
             * A GLboolean specifying whether integer data values should be normalized when being casted to a float.
                  -  If true, signed integers are normalized to [-1, 1].
                  -  If true, unsigned integers are normalized to [0, 1].
                  -  For types gl.FLOAT and gl.HALF_FLOAT, this parameter has no effect.
             */
            this.normalized = false;
            /**
             * A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes. Cannot be larger than 255.
             */
            this.stride = 0;
            /**
             * A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of type.
             */
            this.offset = 0;
            /**
             * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
             *
             * A GLuint specifying the number of instances that will pass between updates of the generic attribute.
             * @see https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/vertexAttribDivisorANGLE
             */
            this.divisor = 0;
            // /**
            //  * A GLenum specifying the intended usage pattern of the data store for optimization purposes. 
            //  * 
            //  * 为优化目的指定数据存储的预期使用模式的GLenum。
            //  * 
            //  * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
            //  */
            // @serialize
            // usage = AttributeUsage.STATIC_DRAW;
            /**
             * 是否失效
             */
            this.invalid = true;
            this.name = name;
            this.data = data;
            this.size = size;
            this.divisor = divisor;
        }
        Object.defineProperty(Attribute.prototype, "data", {
            /**
             * 属性数据
             */
            get: function () {
                return this._data;
            },
            set: function (v) {
                this._data = v;
                this.invalidate();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 使数据失效
         */
        Attribute.prototype.invalidate = function () {
            this.invalid = true;
        };
        /**
         *
         * @param gl
         * @param location A GLuint specifying the index of the vertex attribute that is to be modified.
         */
        Attribute.active = function (gl, location, attribute) {
            gl.enableVertexAttribArray(location);
            var buffer = Attribute.getBuffer(gl, attribute);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(location, attribute.size, gl[attribute.type], attribute.normalized, attribute.stride, attribute.offset);
            gl.vertexAttribDivisor(location, attribute.divisor);
        };
        /**
         * 获取缓冲
         */
        Attribute.getBuffer = function (gl, attribute) {
            if (attribute.invalid) {
                this.clear(attribute);
                attribute.invalid = false;
            }
            var buffer = gl.cache.attributes.get(attribute);
            if (!buffer) {
                var buffer = gl.createBuffer();
                if (!buffer) {
                    console.error("createBuffer 失败！");
                    throw "";
                }
                gl.cache.attributes.set(attribute, buffer);
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attribute.data), gl.STATIC_DRAW);
            }
            return buffer;
        };
        /**
         * 清理缓冲
         */
        Attribute.clear = function (attribute) {
            feng3d.GL.glList.forEach(function (gl) {
                var buffer = gl.cache.attributes.get(attribute);
                if (buffer) {
                    gl.deleteBuffer(buffer);
                    gl.cache.attributes.delete(attribute);
                }
            });
        };
        __decorate([
            feng3d.serialize
        ], Attribute.prototype, "name", void 0);
        __decorate([
            feng3d.serialize
        ], Attribute.prototype, "data", null);
        __decorate([
            feng3d.serialize
        ], Attribute.prototype, "size", void 0);
        __decorate([
            feng3d.serialize
        ], Attribute.prototype, "divisor", void 0);
        return Attribute;
    }());
    feng3d.Attribute = Attribute;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var Texture = /** @class */ (function () {
        function Texture() {
        }
        Texture.active = function (gl, data) {
            var texture = this.getTexture(gl, data);
            var textureType = gl[data.textureType];
            //绑定纹理
            gl.bindTexture(textureType, texture);
            //设置纹理参数
            gl.texParameteri(textureType, gl.TEXTURE_MIN_FILTER, gl[data.minFilter]);
            gl.texParameteri(textureType, gl.TEXTURE_MAG_FILTER, gl[data.magFilter]);
            gl.texParameteri(textureType, gl.TEXTURE_WRAP_S, gl[data.wrapS]);
            gl.texParameteri(textureType, gl.TEXTURE_WRAP_T, gl[data.wrapT]);
            //
            gl.texParameterfAnisotropy(textureType, data.anisotropy);
            return texture;
        };
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        Texture.getTexture = function (gl, data) {
            if (data.invalid) {
                this.clear(data);
                data.invalid = false;
            }
            var texture = gl.cache.textures.get(data);
            if (!texture) {
                texture = gl.createTexture(); // Create a texture object
                if (!texture) {
                    console.error("createTexture 失败！");
                    throw "";
                }
                gl.cache.textures.set(data, texture);
                //
                var textureType = gl[data.textureType];
                var format = gl[data.format];
                var type = gl[data.type];
                //设置图片y轴方向
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, data.flipY ? 1 : 0);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, data.premulAlpha ? 1 : 0);
                //绑定纹理
                gl.bindTexture(textureType, texture);
                //设置纹理图片
                switch (textureType) {
                    case gl.TEXTURE_CUBE_MAP:
                        var pixels = data.activePixels;
                        var faces = [
                            gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                            gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                        ];
                        for (var i = 0; i < faces.length; i++) {
                            if (data.isRenderTarget) {
                                gl.texImage2D(faces[i], 0, format, data.OFFSCREEN_WIDTH, data.OFFSCREEN_HEIGHT, 0, format, type, null);
                            }
                            else {
                                gl.texImage2D(faces[i], 0, format, format, type, pixels[i]);
                            }
                        }
                        break;
                    case gl.TEXTURE_2D:
                        var _pixel = data.activePixels;
                        if (data.isRenderTarget) {
                            gl.texImage2D(textureType, 0, format, data.OFFSCREEN_WIDTH, data.OFFSCREEN_HEIGHT, 0, format, type, null);
                        }
                        else {
                            gl.texImage2D(textureType, 0, format, format, type, _pixel);
                        }
                        break;
                    default:
                        throw "";
                }
                if (data.generateMipmap) {
                    gl.generateMipmap(textureType);
                }
            }
            return texture;
        };
        /**
         * 清除纹理
         *
         * @param data
         */
        Texture.clear = function (data) {
            feng3d.GL.glList.forEach(function (gl) {
                var tex = gl.cache.textures.get(data);
                if (tex) {
                    gl.deleteTexture(tex);
                    gl.cache.textures.delete(data);
                }
            });
        };
        return Texture;
    }());
    feng3d.Texture = Texture;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var FrameBuffer = /** @class */ (function () {
        function FrameBuffer() {
            this._framebufferMap = new Map();
            /**
             * 是否失效
             */
            this._invalid = true;
        }
        FrameBuffer.prototype.active = function (gl) {
            if (this._invalid) {
                this._invalid = false;
                this.clear();
            }
            // Create a framebuffer object (FBO)
            var framebuffer = this._framebufferMap.get(gl);
            if (!framebuffer) {
                framebuffer = gl.createFramebuffer();
                if (!framebuffer) {
                    alert('Failed to create frame buffer object');
                    return null;
                }
                this._framebufferMap.set(gl, framebuffer);
            }
            return framebuffer;
        };
        /**
         * 清理缓存
         */
        FrameBuffer.prototype.clear = function () {
            this._framebufferMap.forEach(function (v, k) {
                k.deleteFramebuffer(v);
            });
            this._framebufferMap.clear();
        };
        return FrameBuffer;
    }());
    feng3d.FrameBuffer = FrameBuffer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var RenderBuffer = /** @class */ (function () {
        function RenderBuffer() {
            this._OFFSCREEN_WIDTH = 1024;
            this._OFFSCREEN_HEIGHT = 1024;
            this._depthBufferMap = new Map();
            /**
             * 是否失效
             */
            this._invalid = true;
        }
        Object.defineProperty(RenderBuffer.prototype, "OFFSCREEN_WIDTH", {
            get: function () {
                return this._OFFSCREEN_WIDTH;
            },
            set: function (v) {
                if (this._OFFSCREEN_WIDTH == v)
                    return;
                this._OFFSCREEN_WIDTH = v;
                this.invalidate();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderBuffer.prototype, "OFFSCREEN_HEIGHT", {
            get: function () {
                return this._OFFSCREEN_HEIGHT;
            },
            set: function (v) {
                if (this._OFFSCREEN_HEIGHT == v)
                    return;
                this._OFFSCREEN_HEIGHT = v;
                this.invalidate();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 使失效
         */
        RenderBuffer.prototype.invalidate = function () {
            this._invalid = true;
        };
        /**
         * 激活
         * @param gl
         */
        RenderBuffer.prototype.active = function (gl) {
            if (this._invalid) {
                this.clear();
                this._invalid = false;
            }
            var depthBuffer = this._depthBufferMap.get(gl);
            if (!depthBuffer) {
                // Create a renderbuffer object and Set its size and parameters
                depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
                if (!depthBuffer) {
                    alert('Failed to create renderbuffer object');
                    return;
                }
                this._depthBufferMap.set(gl, depthBuffer);
                gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT);
            }
            return depthBuffer;
        };
        /**
         * 清理纹理
         */
        RenderBuffer.prototype.clear = function () {
            this._depthBufferMap.forEach(function (v, k) {
                k.deleteRenderbuffer(v);
            });
            this._depthBufferMap.clear();
        };
        return RenderBuffer;
    }());
    feng3d.RenderBuffer = RenderBuffer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var shaderMacroKeys = ["if", "ifdef", "defined"];
    var ShaderMacroUtils = /** @class */ (function () {
        function ShaderMacroUtils() {
        }
        /**
         * 从着色器代码中获取宏变量列表
         * @param vertex
         * @param fragment
         */
        ShaderMacroUtils.prototype.getMacroVariablesFromShaderCode = function (vertex, fragment) {
            var variables0 = this.getMacroVariablesFromCode(vertex);
            var variables1 = this.getMacroVariablesFromCode(fragment);
            for (var i = 0; i < variables1.length; i++) {
                var element = variables1[i];
                if (variables0.indexOf(element) == -1)
                    variables0.push(element);
            }
            return variables0;
        };
        /**
         * 从着色器代码中获取宏变量列表
         * @param code
         */
        ShaderMacroUtils.prototype.getMacroVariablesFromCode = function (code) {
            var variables = [];
            var lines = code.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.indexOf("#if") != -1) {
                    var reg = /(\w+)/g;
                    var result;
                    while (result = reg.exec(line)) {
                        var key = result[1];
                        if (key != null && isNaN(Number(key)) && shaderMacroKeys.indexOf(key) == -1 && variables.indexOf(key) == -1)
                            variables.push(key);
                    }
                }
            }
            return variables;
        };
        return ShaderMacroUtils;
    }());
    feng3d.ShaderMacroUtils = ShaderMacroUtils;
    feng3d.shaderMacroUtils = new ShaderMacroUtils();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染代码库

     */
    var ShaderLib = /** @class */ (function () {
        function ShaderLib() {
            this._shaderCache = {};
        }
        Object.defineProperty(ShaderLib.prototype, "shaderConfig", {
            get: function () {
                this._shaderConfig = this._shaderConfig || feng3d.shaderConfig;
                return this._shaderConfig;
            },
            set: function (v) {
                this._shaderConfig = v;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 获取shaderCode
         */
        ShaderLib.prototype.getShader = function (shaderName) {
            if (this._shaderCache[shaderName])
                return this._shaderCache[shaderName];
            var shader = feng3d.shaderlib.shaderConfig.shaders[shaderName];
            //
            var vertex = feng3d.shaderlib.uninclude(shader.vertex);
            //
            var fragment = feng3d.shaderlib.uninclude(shader.fragment);
            var vertexMacroVariables = feng3d.shaderMacroUtils.getMacroVariablesFromCode(vertex);
            var fragmentMacroVariables = feng3d.shaderMacroUtils.getMacroVariablesFromCode(fragment);
            this._shaderCache[shaderName] = { vertex: vertex, fragment: fragment, vertexMacroVariables: vertexMacroVariables, fragmentMacroVariables: fragmentMacroVariables };
            return this._shaderCache[shaderName];
        };
        /**
         * 展开 include
         */
        ShaderLib.prototype.uninclude = function (shaderCode) {
            //#include 正则表达式
            var includeRegExp = /#include<(.+)>/g;
            //
            var match = includeRegExp.exec(shaderCode);
            while (match != null) {
                var moduleshader = this.shaderConfig.modules[match[1]];
                if (!moduleshader) {
                    debugger;
                    console.error("\u65E0\u6CD5\u627E\u5230\u7740\u8272\u5668 " + match[1]);
                }
                moduleshader = this.uninclude(moduleshader);
                shaderCode = shaderCode.replace(match[0], moduleshader);
                includeRegExp.lastIndex = 0;
                match = includeRegExp.exec(shaderCode);
            }
            return shaderCode;
        };
        /**
         * 获取shader列表
         */
        ShaderLib.prototype.getShaderNames = function () {
            return Object.keys(this.shaderConfig.shaders);
        };
        /**
         * 清除缓存
         */
        ShaderLib.prototype.clearCache = function () {
            this._shaderCache = {};
        };
        return ShaderLib;
    }());
    feng3d.ShaderLib = ShaderLib;
    feng3d.shaderlib = new ShaderLib();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染器
     * 所有渲染都由该渲染器执行
     */
    var Renderer = /** @class */ (function () {
        function Renderer(gl) {
            console.assert(!gl.render, gl + " " + gl.render + " \u5B58\u5728\uFF01");
            var preActiveAttributes = [];
            gl.render = function (renderAtomic1) {
                var instanceCount = renderAtomic1.getInstanceCount();
                if (instanceCount == 0)
                    return;
                var shaderMacro = renderAtomic1.getShaderMacro();
                var shader = renderAtomic1.getShader();
                shader.shaderMacro = shaderMacro;
                var shaderResult = shader.activeShaderProgram(gl);
                if (!shaderResult)
                    return;
                //
                var renderAtomic = checkRenderData(renderAtomic1);
                if (!renderAtomic)
                    return;
                //
                gl.useProgram(shaderResult.program);
                activeShaderParams(renderAtomic.renderParams);
                activeAttributes(renderAtomic, shaderResult.attributes);
                activeUniforms(renderAtomic, shaderResult.uniforms);
                draw(renderAtomic, gl[renderAtomic.renderParams.renderMode]);
            };
            function checkRenderData(renderAtomic) {
                var shader = renderAtomic.getShader();
                var shaderResult = shader.activeShaderProgram(gl);
                if (!shaderResult) {
                    console.warn("\u7F3A\u5C11\u7740\u8272\u5668\uFF0C\u65E0\u6CD5\u6E32\u67D3!");
                    return null;
                }
                var attributes = {};
                for (var key_1 in shaderResult.attributes) {
                    var attribute = renderAtomic.getAttributeByKey(key_1);
                    if (attribute == undefined) {
                        console.warn("\u7F3A\u5C11\u9876\u70B9 attribute \u6570\u636E " + key_1 + " \uFF0C\u65E0\u6CD5\u6E32\u67D3!");
                        return null;
                    }
                    attributes[key_1] = attribute;
                }
                var uniforms = {};
                for (var key in shaderResult.uniforms) {
                    var activeInfo = shaderResult.uniforms[key];
                    if (activeInfo.name) {
                        key = activeInfo.name;
                    }
                    var uniform = renderAtomic.getUniformByKey(key);
                    if (uniform == undefined) {
                        console.warn("\u7F3A\u5C11 uniform \u6570\u636E " + key + " ,\u65E0\u6CD5\u6E32\u67D3\uFF01");
                        return null;
                    }
                    uniforms[key] = uniform;
                }
                var indexBuffer = renderAtomic.getIndexBuffer();
                if (!indexBuffer) {
                    console.warn("\u786E\u5B9E\u9876\u70B9\u7D22\u5F15\u6570\u636E\uFF0C\u65E0\u6CD5\u6E32\u67D3\uFF01");
                    return null;
                }
                return {
                    shader: shader,
                    attributes: attributes,
                    uniforms: uniforms,
                    renderParams: renderAtomic.getRenderParams(),
                    indexBuffer: indexBuffer,
                    instanceCount: renderAtomic.getInstanceCount(),
                };
            }
            function activeShaderParams(shaderParams) {
                var cullfaceEnum = shaderParams.cullFace;
                var blendEquation = gl[shaderParams.blendEquation];
                var sfactor = gl[shaderParams.sfactor];
                var dfactor = gl[shaderParams.dfactor];
                var cullFace = gl[shaderParams.cullFace];
                var frontFace = gl[shaderParams.frontFace];
                var enableBlend = shaderParams.enableBlend;
                var depthtest = shaderParams.depthtest;
                var depthMask = shaderParams.depthMask;
                var depthFunc = gl[shaderParams.depthFunc];
                var viewRect = shaderParams.viewRect;
                var useViewRect = shaderParams.useViewRect;
                var colorMask = shaderParams.colorMask;
                var colorMaskB = [feng3d.ColorMask.R, feng3d.ColorMask.G, feng3d.ColorMask.B, feng3d.ColorMask.A].map(function (v) { return !!(colorMask & v); });
                if (!useViewRect) {
                    viewRect = { x: 0, y: 0, width: gl.canvas.width, height: gl.canvas.height };
                }
                if (cullfaceEnum != feng3d.CullFace.NONE) {
                    gl.enable(gl.CULL_FACE);
                    gl.cullFace(cullFace);
                    gl.frontFace(frontFace);
                }
                else {
                    gl.disable(gl.CULL_FACE);
                }
                if (enableBlend) {
                    //
                    gl.enable(gl.BLEND);
                    gl.blendEquation(blendEquation);
                    gl.blendFunc(sfactor, dfactor);
                }
                else {
                    gl.disable(gl.BLEND);
                }
                if (depthtest) {
                    gl.enable(gl.DEPTH_TEST);
                    gl.depthFunc(depthFunc);
                }
                else
                    gl.disable(gl.DEPTH_TEST);
                gl.depthMask(depthMask);
                gl.colorMask(colorMaskB[0], colorMaskB[1], colorMaskB[2], colorMaskB[3]);
                gl.viewport(viewRect.x, viewRect.y, viewRect.width, viewRect.height);
            }
            /**
             * 激活属性
             */
            function activeAttributes(renderAtomic, attributeInfos) {
                var activeAttributes = [];
                for (var name in attributeInfos) {
                    var activeInfo = attributeInfos[name];
                    var buffer = renderAtomic.attributes[name];
                    feng3d.Attribute.active(gl, activeInfo.location, buffer);
                    activeAttributes.push(activeInfo.location);
                    Array.delete(preActiveAttributes, activeInfo.location);
                }
                preActiveAttributes.forEach(function (location) {
                    gl.disableVertexAttribArray(location);
                });
                preActiveAttributes = activeAttributes;
            }
            /**
             * 激活常量
             */
            function activeUniforms(renderAtomic, uniformInfos) {
                var uniforms = renderAtomic.uniforms;
                for (var name in uniformInfos) {
                    var activeInfo = uniformInfos[name];
                    var paths = activeInfo.paths;
                    var uniformData = uniforms[paths[0]];
                    for (var i = 1; i < paths.length; i++) {
                        uniformData = uniformData[paths[i]];
                    }
                    setContext3DUniform(activeInfo, uniformData);
                }
            }
            /**
             * 设置环境Uniform数据
             */
            function setContext3DUniform(activeInfo, data) {
                var vec = data;
                if (data.toArray)
                    vec = data.toArray();
                var location = activeInfo.location;
                switch (activeInfo.type) {
                    case gl.INT:
                        gl.uniform1i(location, data);
                        break;
                    case gl.FLOAT_MAT3:
                        gl.uniformMatrix3fv(location, false, vec);
                        break;
                    case gl.FLOAT_MAT4:
                        gl.uniformMatrix4fv(location, false, vec);
                        break;
                    case gl.FLOAT:
                        gl.uniform1f(location, data);
                        break;
                    case gl.FLOAT_VEC2:
                        gl.uniform2f(location, vec[0], vec[1]);
                        break;
                    case gl.FLOAT_VEC3:
                        gl.uniform3f(location, vec[0], vec[1], vec[2]);
                        break;
                    case gl.FLOAT_VEC4:
                        gl.uniform4f(location, vec[0], vec[1], vec[2], vec[3]);
                        break;
                    case gl.SAMPLER_2D:
                    case gl.SAMPLER_CUBE:
                        var textureInfo = data;
                        //激活纹理编号
                        gl.activeTexture(gl["TEXTURE" + activeInfo.textureID]);
                        feng3d.Texture.active(gl, textureInfo);
                        //设置纹理所在采样编号
                        gl.uniform1i(location, activeInfo.textureID);
                        break;
                    default:
                        console.error("\u65E0\u6CD5\u8BC6\u522B\u7684uniform\u7C7B\u578B " + activeInfo.name + " " + data);
                }
            }
            /**
             */
            function draw(renderAtomic, renderMode) {
                var instanceCount = ~~feng3d.lazy.getvalue(renderAtomic.instanceCount);
                var indexBuffer = renderAtomic.indexBuffer;
                var vertexNum = 0;
                if (indexBuffer) {
                    indexBuffer.active(gl);
                    var arrayType = gl[indexBuffer.type];
                    if (indexBuffer.count == 0) {
                        // console.warn(`顶点索引为0，不进行渲染！`);
                        return;
                    }
                    if (instanceCount > 1) {
                        gl.drawElementsInstanced(renderMode, indexBuffer.count, arrayType, indexBuffer.offset, instanceCount);
                    }
                    else {
                        gl.drawElements(renderMode, indexBuffer.count, arrayType, indexBuffer.offset);
                    }
                }
                else {
                    var vertexNum = (function (attributes) {
                        for (var attr in attributes) {
                            if (attributes.hasOwnProperty(attr)) {
                                var attribute = attributes[attr];
                                return attribute.data.length / attribute.size;
                            }
                        }
                        return 0;
                    })(renderAtomic.attributes);
                    if (vertexNum == 0) {
                        console.warn("\u9876\u70B9\u6570\u91CF\u4E3A0\uFF0C\u4E0D\u8FDB\u884C\u6E32\u67D3\uFF01");
                        return;
                    }
                    if (instanceCount > 1) {
                        gl.drawArraysInstanced(renderMode, 0, vertexNum, instanceCount);
                    }
                    else {
                        gl.drawArrays(renderMode, 0, vertexNum);
                    }
                }
            }
        }
        return Renderer;
    }());
    feng3d.Renderer = Renderer;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=render.js.map