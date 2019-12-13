declare namespace feng3d {
    class RenderBuffer {
        OFFSCREEN_WIDTH: number;
        OFFSCREEN_HEIGHT: number;
        /**
         * 是否失效
         */
        private _invalid;
        /**
         * 使失效
         */
        protected invalidate(): void;
        /**
         * 激活
         * @param gl
         */
        static active(gl: GL, renderBuffer: RenderBuffer): WebGLBuffer;
        /**
         * 清理纹理
         */
        static clear(renderBuffer: RenderBuffer): void;
    }
}
declare namespace feng3d {
    interface Attributes {
        /**
         * 坐标
         */
        a_position: Attribute;
        /**
         * 颜色
         */
        a_color: Attribute;
        /**
         * 法线
         */
        a_normal: Attribute;
        /**
         * 切线
         */
        a_tangent: Attribute;
        /**
         * uv（纹理坐标）
         */
        a_uv: Attribute;
        /**
         * 关节索引
         */
        a_jointindex0: Attribute;
        /**
         * 关节权重
         */
        a_jointweight0: Attribute;
        /**
         * 关节索引
         */
        a_jointindex1: Attribute;
        /**
         * 关节权重
         */
        a_jointweight1: Attribute;
    }
    /**
     * 属性渲染数据
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     */
    class Attribute {
        name: string;
        /**
         * 属性数据
         */
        data: number[];
        /**
         * 数据尺寸
         *
         * A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
         */
        size: number;
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
        type: GLArrayType;
        /**
         * A GLboolean specifying whether integer data values should be normalized when being casted to a float.
              -  If true, signed integers are normalized to [-1, 1].
              -  If true, unsigned integers are normalized to [0, 1].
              -  For types gl.FLOAT and gl.HALF_FLOAT, this parameter has no effect.
         */
        normalized: boolean;
        /**
         * A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes. Cannot be larger than 255.
         */
        stride: number;
        /**
         * A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of type.
         */
        offset: number;
        /**
         * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
         *
         * A GLuint specifying the number of instances that will pass between updates of the generic attribute.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/vertexAttribDivisorANGLE
         */
        divisor: number;
        /**
         * 是否失效
         */
        invalid: boolean;
        constructor(name: string, data: number[], size?: number, divisor?: number);
        /**
         * 使数据失效
         */
        invalidate(): void;
        /**
         *
         * @param gl
         * @param location A GLuint specifying the index of the vertex attribute that is to be modified.
         */
        static active(gl: GL, location: number, attribute: Attribute): void;
        /**
         * 获取缓冲
         */
        static getBuffer(gl: GL, attribute: Attribute): WebGLBuffer;
        /**
         * 清理缓冲
         */
        static clear(attribute: Attribute): void;
    }
}
declare namespace feng3d {
    class FrameBuffer {
        /**
         * 是否失效
         */
        private _invalid;
        static active(gl: GL, frameBuffer: FrameBuffer): WebGLFramebuffer;
        /**
         * 清理缓存
         */
        static clear(frameBuffer: FrameBuffer): void;
    }
}
declare namespace feng3d {
    /**
     * 索引渲染数据

     */
    class Index {
        /**
         * 索引数据
         */
        indices: number[];
        invalidate(): void;
        /**
         * 渲染数量
         */
        get count(): number;
        /**
         * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
         */
        type: GLArrayType;
        /**
         * 索引偏移
         */
        offset: number;
        /**
         * 是否失效
         */
        private _invalid;
        /**
         * 激活缓冲
         * @param gl
         */
        static active(gl: GL, index: Index): void;
        /**
         * 获取缓冲
         */
        static getBuffer(gl: GL, index: Index): WebGLBuffer;
        /**
         * 清理缓冲
         */
        static clear(index: Index): void;
    }
}
declare namespace feng3d {
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     */
    class RenderAtomic {
        /**
         * 下一个结点
         */
        next: RenderAtomic;
        /**
         * 顶点索引缓冲
         */
        indexBuffer: Index;
        /**
         * 属性数据列表
         */
        attributes: Attributes;
        /**
         * Uniform渲染数据
         */
        uniforms: LazyUniforms;
        /**
         * 渲染实例数量
         */
        instanceCount: Lazy<number>;
        /**
         * 渲染程序
         */
        shader: Shader;
        /**
         * shader 中的 宏
         */
        shaderMacro: ShaderMacro;
        /**
         * 渲染参数
         */
        renderParams: Partial<RenderParams>;
        getIndexBuffer(): Index;
        getAttributes(attributes?: Attributes): Attributes;
        getAttributeByKey(key: string): Attribute;
        getUniforms(uniforms?: LazyUniforms): LazyObject<Uniforms>;
        getUniformByKey(key: string): Uniforms;
        getInstanceCount(): number;
        getShader(): Shader;
        getRenderParams(renderParams?: RenderParams): RenderParams;
        getShaderMacro(shaderMacro?: ShaderMacro): ShaderMacro;
    }
    interface RenderAtomicData {
        shader: Shader;
        attributes: {
            [name: string]: Attribute;
        };
        uniforms: {
            [name: string]: Uniforms;
        };
        renderParams: RenderParams;
        indexBuffer: Index;
        instanceCount: number;
    }
}
declare namespace feng3d {
    /**
     * 正面方向枚举
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace
     */
    enum FrontFace {
        /**
         * Clock-wise winding.
         */
        CW = "CW",
        /**
         *  Counter-clock-wise winding.
         */
        CCW = "CCW"
    }
}
declare namespace feng3d {
    /**
     * 决定给WebGLRenderingContext.colorMask何种参数。
     */
    enum ColorMask {
        NONE = 0,
        R = 1,
        G = 2,
        B = 4,
        A = 8,
        RGB = 7,
        /**
         *
         */
        RGBA = 15
    }
}
declare namespace feng3d {
    /**
     * 混合因子（R分量系数，G分量系数，B分量系数）
     */
    enum BlendFactor {
        /**
         * 0.0  0.0 0.0
         */
        ZERO = "ZERO",
        /**
         * 1.0  1.0 1.0
         */
        ONE = "ONE",
        /**
         * Rs   Gs  Bs
         */
        SRC_COLOR = "SRC_COLOR",
        /**
         * 1-Rs   1-Gs  1-Bs
         */
        ONE_MINUS_SRC_COLOR = "ONE_MINUS_SRC_COLOR",
        /**
         * Rd   Gd  Bd
         */
        DST_COLOR = "DST_COLOR",
        /**
         * 1-Rd   1-Gd  1-Bd
         */
        ONE_MINUS_DST_COLOR = "ONE_MINUS_DST_COLOR",
        /**
         * As   As  As
         */
        SRC_ALPHA = "SRC_ALPHA",
        /**
         * 1-As   1-As  1-As
         */
        ONE_MINUS_SRC_ALPHA = "ONE_MINUS_SRC_ALPHA",
        /**
         * Ad   Ad  Ad
         */
        DST_ALPHA = "DST_ALPHA",
        /**
         * 1-Ad   1-Ad  1-Ad
         */
        ONE_MINUS_DST_ALPHA = "ONE_MINUS_DST_ALPHA",
        /**
         * min(As-Ad)   min(As-Ad)  min(As-Ad)
         */
        SRC_ALPHA_SATURATE = "SRC_ALPHA_SATURATE"
    }
}
declare namespace feng3d {
    /**
     * 混合方法
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
     */
    enum BlendEquation {
        /**
         *  source + destination
         */
        FUNC_ADD = "FUNC_ADD",
        /**
         * source - destination
         */
        FUNC_SUBTRACT = "FUNC_SUBTRACT",
        /**
         * destination - source
         */
        FUNC_REVERSE_SUBTRACT = "FUNC_REVERSE_SUBTRACT"
    }
}
declare namespace feng3d {
    /**
     * 深度检测方法枚举
     * A GLenum specifying the depth comparison function, which sets the conditions under which the pixel will be drawn. The default value is gl.LESS.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
     */
    enum DepthFunc {
        /**
         * (never pass)
         */
        NEVER = "NEVER",
        /**
         *  (pass if the incoming value is less than the depth buffer value)
         */
        LESS = "LESS",
        /**
         *  (pass if the incoming value equals the the depth buffer value)
         */
        EQUAL = "EQUAL",
        /**
         *  (pass if the incoming value is less than or equal to the depth buffer value)
         */
        LEQUAL = "LEQUAL",
        /**
         * (pass if the incoming value is greater than the depth buffer value)
         */
        GREATER = "GREATER",
        /**
         * (pass if the incoming value is not equal to the depth buffer value)
         */
        NOTEQUAL = "NOTEQUAL",
        /**
         * (pass if the incoming value is greater than or equal to the depth buffer value)
         */
        GEQUAL = "GEQUAL",
        /**
         *  (always pass)
         */
        ALWAYS = "ALWAYS"
    }
}
declare namespace feng3d {
    /**
     * 渲染模式
     * A GLenum specifying the type primitive to render. Possible values are:
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
     */
    enum RenderMode {
        /**
         * 点渲染
         * gl.POINTS: Draws a single dot.
         */
        POINTS = "POINTS",
        /**
         * gl.LINE_LOOP: Draws a straight line to the next vertex, and connects the last vertex back to the first.
         */
        LINE_LOOP = "LINE_LOOP",
        /**
         * gl.LINE_STRIP: Draws a straight line to the next vertex.
         */
        LINE_STRIP = "LINE_STRIP",
        /**
         * gl.LINES: Draws a line between a pair of vertices.
         */
        LINES = "LINES",
        /**
         * gl.TRIANGLES: Draws a triangle for a group of three vertices.
         */
        TRIANGLES = "TRIANGLES",
        /**
         * gl.TRIANGLE_STRIP
         * @see https://en.wikipedia.org/wiki/Triangle_strip
         */
        TRIANGLE_STRIP = "TRIANGLE_STRIP",
        /**
         * gl.TRIANGLE_FAN
         * @see https://en.wikipedia.org/wiki/Triangle_fan
         */
        TRIANGLE_FAN = "TRIANGLE_FAN"
    }
}
declare namespace feng3d {
    /**
     * 裁剪面枚举
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
     */
    enum CullFace {
        /**
         * 关闭裁剪面
         */
        NONE = "NONE",
        /**
         * 正面
         */
        FRONT = "FRONT",
        /**
         * 背面
         */
        BACK = "BACK",
        /**
         * 正面与背面
         */
        FRONT_AND_BACK = "FRONT_AND_BACK"
    }
}
declare namespace feng3d {
    /**
     * 渲染参数
     */
    class RenderParams {
        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        renderMode: RenderMode;
        /**
         * 剔除面
         * 参考：http://www.jianshu.com/p/ee04165f2a02
         * 默认情况下，逆时针的顶点连接顺序被定义为三角形的正面。
         * 使用gl.frontFace(gl.CW);调整顺时针为正面
         */
        cullFace: CullFace;
        frontFace: FrontFace;
        /**
         * 是否开启混合
         * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
         */
        enableBlend: boolean;
        /**
         * 混合方式，默认BlendEquation.FUNC_ADD
         */
        blendEquation: BlendEquation;
        /**
         * 源混合因子，默认BlendFactor.SRC_ALPHA
         */
        sfactor: BlendFactor;
        /**
         * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
         */
        dfactor: BlendFactor;
        /**
         * 是否开启深度检查
         */
        depthtest: boolean;
        depthFunc: DepthFunc;
        /**
         * 是否开启深度标记
         */
        depthMask: boolean;
        /**
         * 控制那些颜色分量是否可以被写入到帧缓冲器。
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask
         */
        colorMask: ColorMask;
        /**
         * 绘制在画布上的区域
         */
        viewRect: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        /**
         * 是否使用 viewRect
         */
        useViewRect: boolean;
        constructor(raw?: Partial<RenderParams>);
    }
    interface RenderParams {
        viewRect: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }
}
declare namespace feng3d {
    /**
     * shader
     */
    class Shader {
        /**
         * shader 中的 宏
         */
        shaderMacro: ShaderMacro;
        constructor(shaderName: string);
        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL): CompileShaderResult;
        /**
         * 着色器名称
         */
        private shaderName;
        /**
         * 顶点着色器代码
         */
        private vertex;
        /**
         * 片段着色器代码
         */
        private fragment;
        /**
         * 更新渲染代码
         */
        private updateShaderCode;
        /**
         * 编译着色器代码
         * @param gl GL上下文
         * @param type 着色器类型
         * @param code 着色器代码
         * @return 编译后的着色器对象
         */
        private compileShaderCode;
        private createLinkProgram;
        private compileShaderProgram;
        private getMacroCode;
    }
    interface CompileShaderResult {
        program: WebGLProgram;
        vertex: WebGLShader;
        fragment: WebGLShader;
        /**
         * 属性信息列表
         */
        attributes: {
            [name: string]: AttributeInfo;
        };
        /**
         * uniform信息列表
         */
        uniforms: {
            [name: string]: UniformInfo;
        };
    }
    /**
     * WebGL渲染程序有效信息
     */
    interface UniformInfo {
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
    interface AttributeInfo {
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
declare namespace feng3d {
    interface Texture {
        /**
         * 纹理类型
         */
        textureType: TextureType;
        /**
         * 格式
         */
        format: TextureFormat;
        /**
         * 数据类型
         */
        type: TextureDataType;
        /**
         * 是否生成mipmap
         */
        generateMipmap: boolean;
        /**
         * 对图像进行Y轴反转。默认值为false
         */
        flipY: boolean;
        /**
         * 将图像RGB颜色值得每一个分量乘以A。默认为false
         */
        premulAlpha: boolean;
        minFilter: TextureMinFilter;
        magFilter: TextureMagFilter;
        /**
         * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
         */
        wrapS: TextureWrap;
        /**
         * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
         */
        wrapT: TextureWrap;
        /**
         * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
         */
        anisotropy: number;
        /**
         * 当前使用的贴图数据
         */
        activePixels: TexImageSource | TexImageSource[];
        /**
         * 是否为渲染目标纹理
         */
        isRenderTarget: boolean;
        OFFSCREEN_WIDTH: number;
        OFFSCREEN_HEIGHT: number;
        /**
         * 是否失效，值为true时重新创建 WebGLTexture
         */
        invalid: boolean;
    }
    class Texture {
        static active(gl: GL, data: Texture): WebGLTexture;
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        static getTexture(gl: GL, data: Texture): WebGLTexture;
        /**
         * 清除纹理
         *
         * @param data
         */
        static clear(data: Texture): void;
    }
}
declare namespace feng3d {
    type LazyUniforms = LazyObject<Uniforms>;
    interface Uniforms {
    }
}
declare namespace feng3d {
    /**
     * 扩展（封装，包装）WebGL
     */
    interface GL extends WebGLRenderingContext {
        /**
         * The WebGL2RenderingContext.vertexAttribDivisor() method of the WebGL 2 API modifies the rate at which generic vertex attributes advance when rendering multiple instances of primitives with gl.drawArraysInstanced() and gl.drawElementsInstanced().
         *
         * WebGL2 API的WebGL2RenderingContext.vertexAttribDivisor()方法在使用gl. drawarraysinstated()和gl. drawelementsinstated()呈现多个原语实例时，修改了通用顶点属性的提升速度。
         *
         * @param index A GLuint specifying the index of the generic vertex attributes. 指定一般顶点属性的索引的GLuint。
         * @param divisor 指定将在通用属性的更新之间传递的实例数的GLuint。
         *
         * @see WebGL2RenderingContextBase.vertexAttribDivisor
         * @see ANGLE_instanced_arrays.vertexAttribDivisorANGLE
         * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor
         */
        vertexAttribDivisor(index: GLuint, divisor: GLuint): void;
        /**
         * The WebGL2RenderingContext.drawElementsInstanced() method of the WebGL 2 API renders primitives from array data like the gl.drawElements() method. In addition, it can execute multiple instances of a set of elements.
         *
         * WebGL2 API的webgl2renderingcontext . drawelementsinstance()方法呈现来自数组数据的原语，如gl.drawElements()方法。此外，它可以执行一组元素的多个实例。
         *
         * @param mode A GLenum specifying the type primitive to render. 指定要呈现的类型基元的GLenum。
         * @param count A GLsizei specifying the number of elements to be rendered. 指定要呈现的元素数量的GLsizei。
         * @param type A GLenum specifying the type of the values in the element array buffer. 指定元素数组缓冲区中值的类型的GLenum。
         * @param offset A GLintptr specifying an offset in the element array buffer. Must be a valid multiple of the size of the given type. 指定元素数组缓冲区中的偏移量的GLintptr。必须是给定类型大小的有效倍数。
         * @param instanceCount A GLsizei specifying the number of instances of the set of elements to execute. 指定要执行的元素集的实例数的GLsizei。
         *
         * @see WebGL2RenderingContextBase.drawElementsInstanced
         */
        drawElementsInstanced(mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei): void;
        /**
         * The WebGL2RenderingContext.drawArraysInstanced() method of the WebGL 2 API renders primitives from array data like the gl.drawArrays() method. In addition, it can execute multiple instances of the range of elements.
         *
         * WebGL2 API的webgl2renderingcontext . drawarraysinstance()方法呈现来自数组数据的原语，比如gl.drawArrays()方法。此外，它可以执行元素范围的多个实例。
         *
         * @param mode A GLenum specifying the type primitive to render. 指定要呈现的类型基元的GLenum。
         * @param first A GLint specifying the starting index in the array of vector points. 在向量点数组中指定起始索引的位置。
         * @param count A GLsizei specifying the number of indices to be rendered. 指定要呈现的索引数量的GLsizei。
         * @param instanceCount A GLsizei specifying the number of instances of the range of elements to execute. 指定要执行的元素集的实例数的GLsizei。
         */
        drawArraysInstanced(mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei): void;
        /**
         * 设置纹理最大向异性。 (相当于texParameterf(textureType, ext.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);)
         *
         * @param target A GLenum specifying the binding point (target).  GLenum 指定绑定点(目标)
         * @param param Maximum anisotropy for a texture. 纹理最大向异性值
         *
         * @see WebGLRenderingContextBase.texParameterf
         * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/texParameter
         */
        texParameterfAnisotropy(target: GLenum, anisotropy: GLfloat): void;
        /**
         * 上下文属性
         */
        contextAttributes: WebGLContextAttributes | undefined;
        /**
         * 上下文名称
         */
        contextId: string;
        /**
         * GL 扩展
         */
        extensions: GLExtension;
        /**
         * 渲染
         *
         * @param renderAtomic 渲染数据
         */
        render(renderAtomic: RenderAtomic): void;
        /**
         * WEBGL 支持能力
         */
        capabilities: GLCapabilities;
        /**
         * 缓存
         */
        cache: GLCache;
    }
    class GL {
        static glList: GL[];
        /**
         * 获取 GL 实例
         * @param canvas 画布
         * @param contextAttributes
         */
        static getGL(canvas: HTMLCanvasElement, contextAttributes?: WebGLContextAttributes): GL;
    }
}
declare namespace feng3d {
    /**
     * GL 缓存
     */
    class GLCache {
        compileShaderResults: {
            [key: string]: CompileShaderResult;
        };
        private _gl;
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        textures: Map<Texture, WebGLTexture>;
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        attributes: Map<Attribute, WebGLBuffer>;
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        indices: Map<Index, WebGLBuffer>;
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        renderBuffers: Map<RenderBuffer, WebGLBuffer>;
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        frameBuffers: Map<FrameBuffer, WebGLFramebuffer>;
        constructor(gl: GL);
    }
}
declare namespace feng3d {
    /**
     * WEBGL 支持功能
     *
     * @see https://webglreport.com
     * @see http://html5test.com
     */
    class GLCapabilities {
        /**
         * 是否为 WebGL2
         */
        isWebGL2: boolean;
        /**
         * 纹理各向异性过滤最大值
         */
        maxAnisotropy: number;
        /**
         * 支持最大纹理数量
         */
        maxTextures: number;
        /**
         * 支持最大顶点纹理数量
         */
        maxVertexTextures: number;
        /**
         * 支持最大纹理尺寸
         */
        maxTextureSize: number;
        /**
         * 支持最大立方体贴图尺寸
         */
        maxCubemapSize: number;
        /**
         * 支持属性数量
         */
        maxAttributes: number;
        /**
         * 顶点着色器支持最大 Uniform 数量
         */
        maxVertexUniforms: number;
        /**
         * 支持最大shader之间传递的变量数
         */
        maxVaryings: number;
        /**
         * 片段着色器支持最大 Uniform 数量
         */
        maxFragmentUniforms: number;
        /**
         * 是否支持顶点纹理
         */
        vertexTextures: boolean;
        /**
         * 是否支持浮点类型片段着色器纹理
         */
        floatFragmentTextures: boolean;
        /**
         * 是否支持浮点类型顶点着色器纹理
         */
        floatVertexTextures: boolean;
        /**
         * Shader中支持浮点类型的最高精度
         */
        maxPrecision: "highp" | "mediump" | "lowp";
        /**
         *
         */
        maxSamples: number;
        constructor(gl: GL);
    }
}
declare namespace feng3d {
    /**
     * GL扩展
     */
    class GLExtension {
        ANGLE_instanced_arrays: ANGLE_instanced_arrays;
        EXT_blend_minmax: EXT_blend_minmax;
        EXT_color_buffer_half_float: any;
        EXT_frag_depth: EXT_frag_depth;
        EXT_sRGB: EXT_sRGB;
        EXT_shader_texture_lod: EXT_shader_texture_lod;
        EXT_texture_filter_anisotropic: EXT_texture_filter_anisotropic;
        OES_element_index_uint: OES_element_index_uint;
        OES_standard_derivatives: OES_standard_derivatives;
        OES_texture_float: OES_texture_float;
        OES_texture_float_linear: OES_texture_float_linear;
        OES_texture_half_float: OES_texture_half_float;
        OES_texture_half_float_linear: OES_texture_half_float_linear;
        OES_vertex_array_object: OES_vertex_array_object;
        WEBGL_color_buffer_float: WEBGL_color_buffer_float;
        WEBGL_compressed_texture_atc: any;
        WEBGL_compressed_texture_etc1: any;
        WEBGL_compressed_texture_pvrtc: any;
        WEBGL_compressed_texture_s3tc: WEBGL_compressed_texture_s3tc;
        WEBGL_debug_renderer_info: WEBGL_debug_renderer_info;
        WEBGL_debug_shaders: WEBGL_debug_shaders;
        WEBGL_depth_texture: WEBGL_depth_texture;
        WEBGL_draw_buffers: WEBGL_draw_buffers;
        WEBGL_lose_context: any;
        constructor(gl: GL);
        private initExtensions;
        /**
         * 缓存GL查询
         * @param gl GL实例
         */
        private cacheGLQuery;
        private wrap;
    }
}
declare namespace feng3d {
    /**
     * A GLenum specifying the intended usage pattern of the data store for optimization purposes.
     *
     * 指定数据存储区的使用方法。
     *
     * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     */
    enum AttributeUsage {
        /**
         * The contents are intended to be specified once by the application, and used many times as the source for WebGL drawing and image specification commands.
         *
         * 内容由应用程序指定一次，并多次用作WebGL绘图和图像规范命令的源。
         *
         * 缓冲区的内容可能经常使用，而不会经常更改。内容被写入缓冲区，但不被读取。
         */
        STATIC_DRAW = "STATIC_DRAW",
        /**
         * The contents are intended to be respecified repeatedly by the application, and used many times as the source for WebGL drawing and image specification commands.
         *
         * 这些内容将由应用程序反复重新指定，并多次用作WebGL绘图和图像规范命令的源。
         */
        DYNAMIC_DRAW = "DYNAMIC_DRAW",
        /**
         * The contents are intended to be specified once by the application, and used at most a few times as the source for WebGL drawing and image specification commands.
         *
         * 内容由应用程序指定一次，最多几次用作WebGL绘图和图像规范命令的源。
         */
        STREAM_DRAW = "STREAM_DRAW"
    }
}
declare namespace feng3d {
    /**
     * GL 数组数据类型
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     */
    enum GLArrayType {
        /**
         * signed 8-bit integer, with values in [-128, 127]
         */
        BYTE = "BYTE",
        /**
         *  signed 16-bit integer, with values in [-32768, 32767]
         */
        SHORT = "SHORT",
        /**
         * unsigned 8-bit integer, with values in [0, 255]
         */
        UNSIGNED_BYTE = "UNSIGNED_BYTE",
        /**
         * unsigned 16-bit integer, with values in [0, 65535]
         */
        UNSIGNED_SHORT = "UNSIGNED_SHORT",
        /**
         * 32-bit floating point number
         */
        FLOAT = "FLOAT"
    }
}
declare namespace feng3d {
    /**
     * 纹理数据类型
     * A GLenum specifying the data type of the texel data
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    enum TextureDataType {
        /**
         * 8 bits per channel for gl.RGBA
         */
        UNSIGNED_BYTE = "UNSIGNED_BYTE",
        /**
         * 5 red bits, 6 green bits, 5 blue bits.
         */
        UNSIGNED_SHORT_5_6_5 = "UNSIGNED_SHORT_5_6_5",
        /**
         * 4 red bits, 4 green bits, 4 blue bits, 4 alpha bits.
         */
        UNSIGNED_SHORT_4_4_4_4 = "UNSIGNED_SHORT_4_4_4_4",
        /**
         * 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
         */
        UNSIGNED_SHORT_5_5_5_1 = "UNSIGNED_SHORT_5_5_5_1"
    }
}
declare namespace feng3d {
    /**
     * 纹理颜色格式
     * A GLint specifying the color components in the texture
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    enum TextureFormat {
        /**
         * Discards the red, green and blue components and reads the alpha component.
         */
        ALPHA = "ALPHA",
        /**
         *  Discards the alpha components and reads the red, green and blue components.
         */
        RGB = "RGB",
        /**
         * Red, green, blue and alpha components are read from the color buffer.
         */
        RGBA = "RGBA",
        /**
         * Each color component is a luminance component, alpha is 1.0.
         */
        LUMINANCE = "LUMINANCE",
        /**
         * Each component is a luminance/alpha component.
         */
        LUMINANCE_ALPHA = "LUMINANCE_ALPHA"
    }
}
declare namespace feng3d {
    /**
     * 纹理放大滤波器
     * Texture magnification filter
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    enum TextureMagFilter {
        /**
         *  (default value)
         */
        LINEAR = "LINEAR",
        NEAREST = "NEAREST"
    }
}
declare namespace feng3d {
    /**
     * 纹理缩小过滤器
     * Texture minification filter
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    enum TextureMinFilter {
        LINEAR = "LINEAR",
        NEAREST = "NEAREST",
        NEAREST_MIPMAP_NEAREST = "NEAREST_MIPMAP_NEAREST",
        LINEAR_MIPMAP_NEAREST = "LINEAR_MIPMAP_NEAREST",
        /**
         *  (default value)
         */
        NEAREST_MIPMAP_LINEAR = "NEAREST_MIPMAP_LINEAR",
        LINEAR_MIPMAP_LINEAR = "LINEAR_MIPMAP_LINEAR"
    }
}
declare namespace feng3d {
    /**
     * 纹理类型
     * A GLenum specifying the binding point (target). Possible values:
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
     */
    enum TextureType {
        /**
         * gl.TEXTURE_2D: A two-dimensional texture.
         */
        TEXTURE_2D = "TEXTURE_2D",
        /**
         * gl.TEXTURE_CUBE_MAP: A cube-mapped texture.
         */
        TEXTURE_CUBE_MAP = "TEXTURE_CUBE_MAP"
    }
}
declare namespace feng3d {
    /**
     * 纹理坐标s包装函数枚举
     * Wrapping function for texture coordinate s
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    enum TextureWrap {
        /**
         * (default value)
         */
        REPEAT = "REPEAT",
        CLAMP_TO_EDGE = "CLAMP_TO_EDGE",
        MIRRORED_REPEAT = "MIRRORED_REPEAT"
    }
}
declare namespace feng3d {
    /**
     * 渲染器
     * 所有渲染都由该渲染器执行
     */
    class Renderer {
        /**
         * 绘制
         * @param renderAtomic  渲染原子
         */
        readonly draw: (renderAtomic: RenderAtomic) => void;
        constructor(gl: GL);
    }
}
declare namespace feng3d {
    /**
     * 着色器宏定义
     */
    interface ShaderMacro {
        /**
         * UV中的U缩放
         */
        SCALEU: number;
        /**
         * UV中的V放
         */
        SCALEV: number;
        /**
         * 光源数量
         */
        NUM_LIGHT: number;
        /**
         * 点光源数量
         */
        NUM_POINTLIGHT: number;
        /**
         * 方向光源数量
         */
        NUM_DIRECTIONALLIGHT: number;
        /**
         * 生成投影的方向光源数量
         */
        NUM_DIRECTIONALLIGHT_CASTSHADOW: number;
        /**
         * 生成投影的点光源数量
         */
        NUM_POINTLIGHT_CASTSHADOW: number;
        /**
         * 聚光灯光源数量
         */
        NUM_SPOT_LIGHTS: number;
        /**
         * 生成投影的聚光灯光源数量
         */
        NUM_SPOT_LIGHTS_CASTSHADOW: number;
        /**
         * 骨骼关节数量
         */
        NUM_SKELETONJOINT: number;
        /**
         *
         */
        RotationOrder: number;
        /**
         * 是否有漫反射贴图
         */
        HAS_DIFFUSE_SAMPLER: boolean;
        /**
         * 是否有法线贴图
         */
        HAS_NORMAL_SAMPLER: boolean;
        /**
         * 是否有镜面反射光泽图
         */
        HAS_SPECULAR_SAMPLER: boolean;
        /**
         * 是否有环境贴图
         */
        HAS_AMBIENT_SAMPLER: boolean;
        /**
         * 是否有骨骼动画
         */
        HAS_SKELETON_ANIMATION: boolean;
        /**
         * 是否有粒子动画
         */
        HAS_PARTICLE_ANIMATOR: boolean;
        /**
         * 是否为点渲染模式
         */
        IS_POINTS_MODE: boolean;
        /**
         * 是否有地形方法
         */
        HAS_TERRAIN_METHOD: boolean;
        /**
         * 使用合并地形贴图
         */
        USE_TERRAIN_MERGE: boolean;
        /**
         * 环境映射函数
         */
        HAS_ENV_METHOD: boolean;
        /**
         * 是否卡通渲染
         */
        IS_CARTOON: Boolean;
        /**
         * 是否抗锯齿
         */
        cartoon_Anti_aliasing: Boolean;
        /**
         * 是否启用粒子系统纹理表动画模块
         */
        ENABLED_PARTICLE_SYSTEM_textureSheetAnimation: Boolean;
    }
}
declare namespace feng3d {
    var shaderConfig: ShaderConfig;
    /**
     * shader 库
     */
    var shaderlib: ShaderLib;
    /**
     * 着色器库，由shader.ts初始化
     */
    interface ShaderConfig {
        shaders: {
            [shaderName: string]: {
                /**
                 * 从glsl读取的vertex shader
                 */
                vertex: string;
                /**
                 * 从glsl读取的fragment shader
                 */
                fragment: string;
                cls?: new (...arg: any[]) => any;
                renderParams?: gPartial<RenderParams>;
            };
        };
        /**
         * shader 模块
         */
        modules: {
            [moduleName: string]: string;
        };
    }
    /**
     * 渲染代码库

     */
    class ShaderLib {
        get shaderConfig(): ShaderConfig;
        set shaderConfig(v: ShaderConfig);
        private _shaderConfig;
        private _shaderCache;
        /**
         * 获取shaderCode
         */
        getShader(shaderName: string): {
            vertex: string;
            fragment: string;
            vertexMacroVariables: string[];
            fragmentMacroVariables: string[];
        };
        /**
         * 展开 include
         */
        uninclude(shaderCode: string): string;
        /**
         * 获取shader列表
         */
        getShaderNames(): string[];
        /**
         * 清除缓存
         */
        clearCache(): void;
    }
}
declare namespace feng3d {
    /**
     * 着色器代码宏工具
     */
    var shaderMacroUtils: ShaderMacroUtils;
    class ShaderMacroUtils {
        /**
         * 从着色器代码中获取宏变量列表
         * @param vertex
         * @param fragment
         */
        getMacroVariablesFromShaderCode(vertex: string, fragment: string): string[];
        /**
         * 从着色器代码中获取宏变量列表
         * @param code
         */
        getMacroVariablesFromCode(code: string): string[];
    }
}
//# sourceMappingURL=render.d.ts.map