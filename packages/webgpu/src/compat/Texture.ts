/**
 * 纹理格式枚举 (WebGL 兼容层)
 */
export enum TextureFormat
{
    RGBA = 'rgba8unorm',
    RGB = 'rgba8unorm',
    ALPHA = 'r8unorm',
    LUMINANCE = 'r8unorm',
    LUMINANCE_ALPHA = 'rg8unorm',
    DEPTH_COMPONENT = 'depth24plus',
    DEPTH_STENCIL = 'depth24plus-stencil8',
}

/**
 * 纹理类型枚举 (WebGL 兼容层)
 */
export enum TextureType
{
    TEXTURE_2D = '2d',
    TEXTURE_CUBE_MAP = 'cube',
    TEXTURE_2D_ARRAY = '2d-array',
    TEXTURE_3D = '3d',
}

/**
 * 纹理放大过滤器 (WebGL 兼容层)
 */
export enum TextureMagFilter
{
    NEAREST = 'nearest',
    LINEAR = 'linear',
}

/**
 * 纹理缩小过滤器 (WebGL 兼容层)
 */
export enum TextureMinFilter
{
    NEAREST = 'nearest',
    LINEAR = 'linear',
    NEAREST_MIPMAP_NEAREST = 'nearest',
    NEAREST_MIPMAP_LINEAR = 'linear',
    LINEAR_MIPMAP_NEAREST = 'nearest',
    LINEAR_MIPMAP_LINEAR = 'linear',
}

/**
 * 纹理环绕模式 (WebGL 兼容层)
 */
export enum TextureWrap
{
    REPEAT = 'repeat',
    CLAMP_TO_EDGE = 'clamp-to-edge',
    MIRRORED_REPEAT = 'mirror-repeat',
}

/**
 * 纹理数据类型 (WebGL 兼容层)
 */
export enum TextureDataType
{
    UNSIGNED_BYTE = 'uint8',
    BYTE = 'sint8',
    UNSIGNED_SHORT = 'uint16',
    SHORT = 'sint16',
    UNSIGNED_INT = 'uint32',
    INT = 'sint32',
    FLOAT = 'float32',
}

/**
 * 纹理类 (WebGL 兼容层)
 */
export class Texture
{
    name = '';

    width = 0;
    height = 0;

    format: TextureFormat = TextureFormat.RGBA;
    textureType: TextureType = TextureType.TEXTURE_2D;
    type: TextureDataType = TextureDataType.UNSIGNED_BYTE;

    magFilter: TextureMagFilter = TextureMagFilter.LINEAR;
    minFilter: TextureMinFilter = TextureMinFilter.LINEAR;
    wrapS: TextureWrap = TextureWrap.CLAMP_TO_EDGE;
    wrapT: TextureWrap = TextureWrap.CLAMP_TO_EDGE;

    isRenderTarget = false;

    /**
     * GPU 纹理
     */
    _gpuTexture?: GPUTexture;

    /**
     * GPU 纹理视图
     */
    _gpuTextureView?: GPUTextureView;

    /**
     * GPU 采样器
     */
    _gpuSampler?: GPUSampler;

    /**
     * 激活纹理单元
     */
    static active(_gl: any, _texture: Texture | null): void
    {
        // WebGPU 中纹理绑定通过 bindGroup 处理
    }

    /**
     * 获取尺寸
     */
    getSize(): [number, number]
    {
        return [this.width, this.height];
    }

    /**
     * 获取宽度
     */
    getWidth(): number
    {
        return this.width;
    }

    /**
     * 获取高度
     */
    getHeight(): number
    {
        return this.height;
    }
}

/**
 * 帧缓冲 (WebGL 兼容层)
 */
export class FrameBuffer
{
    width = 0;
    height = 0;

    colorTextures: Texture[] = [];
    depthTexture?: Texture;

    _gpuTexture?: GPUTexture;
    _gpuTextureView?: GPUTextureView;

    /**
     * 检查帧缓冲状态
     */
    checkStatus(): boolean
    {
        return true;
    }
}

/**
 * 渲染缓冲 (WebGL 兼容层)
 */
export class RenderBuffer
{
    width = 0;
    height = 0;
    format: TextureFormat = TextureFormat.RGBA;

    _gpuBuffer?: GPUBuffer;
}

/**
 * WebGL 渲染器 (WebGL 兼容层)
 */
export class WebGLRenderer
{
    gl: any;

    constructor(_canvas?: HTMLCanvasElement)
    {
        // 占位
    }

    /**
     * 获取 WebGL 上下文
     */
    getContext(): any
    {
        return this.gl;
    }
}