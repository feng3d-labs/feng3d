/**
 * GL 常量 (WebGL 兼容层)
 */
export const GL = {
    // 纹理目标
    TEXTURE_2D: 0x0DE1,
    TEXTURE_CUBE_MAP: 0x8513,
    TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515,
    TEXTURE_CUBE_MAP_NEGATIVE_X: 0x8516,
    TEXTURE_CUBE_MAP_POSITIVE_Y: 0x8517,
    TEXTURE_CUBE_MAP_NEGATIVE_Y: 0x8518,
    TEXTURE_CUBE_MAP_POSITIVE_Z: 0x8519,
    TEXTURE_CUBE_MAP_NEGATIVE_Z: 0x851A,

    // 纹理格式
    RGBA: 0x1908,
    RGB: 0x1907,
    ALPHA: 0x1906,
    LUMINANCE: 0x1909,
    LUMINANCE_ALPHA: 0x190A,
    DEPTH_COMPONENT: 0x1902,
    DEPTH_STENCIL: 0x84F9,

    // 数据类型
    UNSIGNED_BYTE: 0x1401,
    BYTE: 0x1400,
    UNSIGNED_SHORT: 0x1403,
    SHORT: 0x1402,
    UNSIGNED_INT: 0x1405,
    INT: 0x1404,
    FLOAT: 0x1406,

    // 纹理过滤器
    NEAREST: 0x2600,
    LINEAR: 0x2601,
    NEAREST_MIPMAP_NEAREST: 0x2700,
    LINEAR_MIPMAP_NEAREST: 0x2701,
    NEAREST_MIPMAP_LINEAR: 0x2702,
    LINEAR_MIPMAP_LINEAR: 0x2703,

    // 纹理环绕
    REPEAT: 0x2901,
    CLAMP_TO_EDGE: 0x812F,
    MIRRORED_REPEAT: 0x8370,

    // 帧缓冲
    FRAMEBUFFER: 0x8D40,
    RENDERBUFFER: 0x8D41,
    COLOR_ATTACHMENT0: 0x8CE0,
    DEPTH_ATTACHMENT: 0x8D00,
    DEPTH_STENCIL_ATTACHMENT: 0x821A,
    FRAMEBUFFER_COMPLETE: 0x8CD5,

    // 混合
    BLEND: 0x0BE2,
    SRC_ALPHA: 0x0302,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    SRC_COLOR: 0x0300,
    ONE_MINUS_SRC_COLOR: 0x0301,
    DST_COLOR: 0x0306,
    ONE_MINUS_DST_COLOR: 0x0307,
    DST_ALPHA: 0x0304,
    ONE_MINUS_DST_ALPHA: 0x0305,
    ONE: 1,
    ZERO: 0,
    FUNC_ADD: 0x8006,
    FUNC_SUBTRACT: 0x800A,
    FUNC_REVERSE_SUBTRACT: 0x800B,

    // 深度测试
    DEPTH_TEST: 0x0B71,
    DEPTH_WRITEMASK: 0x0B72,
    DEPTH_FUNC: 0x0B74,
    LESS: 0x0201,
    LEQUAL: 0x0203,
    EQUAL: 0x0202,
    GREATER: 0x0204,
    GEQUAL: 0x0206,
    NOTEQUAL: 0x0205,
    ALWAYS: 0x0207,
    NEVER: 0x0200,

    // 模板测试
    STENCIL_TEST: 0x0B90,
    KEEP: 0x1E00,
    REPLACE: 0x1E01,
    INCR: 0x1E02,
    DECR: 0x1E03,
    INVERT: 0x150A,
    INCR_WRAP: 0x8507,
    DECR_WRAP: 0x8508,

    // 多边形
    CULL_FACE: 0x0B44,
    FRONT: 0x0404,
    BACK: 0x0405,
    FRONT_AND_BACK: 0x0408,
    CW: 0x0900,
    CCW: 0x0901,

    // 绘制模式
    POINTS: 0x0000,
    LINES: 0x0001,
    LINE_STRIP: 0x0003,
    LINE_LOOP: 0x0002,
    TRIANGLES: 0x0004,
    TRIANGLE_STRIP: 0x0005,
    TRIANGLE_FAN: 0x0006,

    // 缓冲区
    ARRAY_BUFFER: 0x8892,
    ELEMENT_ARRAY_BUFFER: 0x8893,
    STATIC_DRAW: 0x88E4,
    DYNAMIC_DRAW: 0x88E8,
    STREAM_DRAW: 0x88E0,

    // 其他
    SCISSOR_TEST: 0x0C11,
    VIEWPORT: 0x0BA2,
    COLOR_BUFFER_BIT: 0x00004000,
    DEPTH_BUFFER_BIT: 0x00000100,
    STENCIL_BUFFER_BIT: 0x00000400,

    // 缓存
    cache: new Map<string, any>(),
    textureCache: new Map<string, any>(),
    bufferCache: new Map<string, any>(),

    // 方法
    createTexture(): any
    {
        return {};
    },

    bindTexture(_target: number, _texture: any): void
    {
        // 占位
    },

    texImage2D(
        _target: number,
        _level: number,
        _internalformat: number,
        _width: number,
        _height: number,
        _border: number,
        _format: number,
        _type: number,
        _pixels?: any
    ): void
    {
        // 占位
    },

    texParameteri(_target: number, _pname: number, _param: number): void
    {
        // 占位
    },

    createBuffer(): any
    {
        return {};
    },

    bindBuffer(_target: number, _buffer: any): void
    {
        // 占位
    },

    bufferData(_target: number, _data: any, _usage: number): void
    {
        // 占位
    },

    bindFramebuffer(_target: number, _framebuffer: any): void
    {
        // 占位
    },

    framebufferTexture2D(
        _target: number,
        _attachment: number,
        _textarget: number,
        _texture: any,
        _level: number
    ): void
    {
        // 占位
    },

    checkFramebufferStatus(_target: number): number
    {
        return GL.FRAMEBUFFER_COMPLETE;
    },

    readPixels(
        _x: number,
        _y: number,
        _width: number,
        _height: number,
        _format: number,
        _type: number,
        _pixels: any
    ): void
    {
        // 占位
    },
} as { [key: string]: any };