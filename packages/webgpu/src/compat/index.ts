// 纹理兼容层 - 使用别名避免与 data 层冲突
export {
    Texture as CompatTexture,
    FrameBuffer,
    RenderBuffer,
    WebGLRenderer,
} from './Texture';
export type {
    TextureFormat as CompatTextureFormat,
    TextureType as CompatTextureType,
    TextureMagFilter as CompatTextureMagFilter,
    TextureMinFilter as CompatTextureMinFilter,
    TextureWrap as CompatTextureWrap,
    TextureDataType as CompatTextureDataType,
} from './Texture';

// GL 兼容层
export { GL } from './GL';

// 缓冲区兼容层 - 使用别名
export {
    Buffer as CompatBuffer,
} from './Buffer';
export type {
    BufferTarget,
    BufferUsage,
    BufferDataType,
} from './Buffer';

// 渲染参数兼容层 - 使用别名
export {
    RenderParamsClass,
} from './RenderParams';
export type {
    RenderMode,
    ColorMask,
    BlendEquation,
    BlendFactor as CompatBlendFactor,
    CullFace as CompatCullFace,
    FrontFace as CompatFrontFace,
    DepthFunc,
    StencilFunc,
    StencilOp,
    RenderParams,
} from './RenderParams';

// 着色器兼容层 - 使用别名
export {
    Shader as CompatShader,
} from './Shader';
export type {
    ShaderType,
    ShaderMacro,
} from './Shader';

// 着色器库兼容层
export { ShaderLib, shaderLib } from './ShaderLib';

// 几何数据兼容层
export { Index, GeometryData } from './GeometryData';
export type { Attribute, Attributes } from './GeometryData';