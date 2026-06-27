import { TextureDataType, TextureFormat, TextureMagFilter, TextureMinFilter, TextureType, TextureWrap } from './enums';

/**
 * 纹理数据接口。
 *
 * 描述 core 纹理（TextureInfo）应具备的采样与格式字段。
 * 原属 @feng3d/renderer（含 GL static active/getTexture/clear 方法），
 * 现迁移到 core 内部，仅保留纯数据接口（删除所有 WebGL 逻辑）。
 *
 * WebGPU 渲染路径下，采样参数由
 * {@link render/webgpu/MaterialPipeline.buildSamplerFromTextureInfo} 转换为 webgpu Sampler。
 */
export interface Texture
{
    /** 纹理类型。 */
    textureType: TextureType;
    /** 格式。 */
    format: TextureFormat;
    /** 数据类型。 */
    type: TextureDataType;
    /** 是否生成 mipmap。 */
    generateMipmap: boolean;
    /** 对图像进行 Y 轴反转。 */
    flipY: boolean;
    /** 将图像 RGB 颜色值的每一个分量乘以 A。 */
    premulAlpha: boolean;
    /** 缩小过滤器。 */
    minFilter: TextureMinFilter;
    /** 放大过滤器。 */
    magFilter: TextureMagFilter;
    /** x 轴纹理回环方式。 */
    wrapS: TextureWrap;
    /** y 轴纹理回环方式。 */
    wrapT: TextureWrap;
    /** 各向异性过滤。 */
    anisotropy: number;
    /** 当前使用的贴图数据。 */
    activePixels: TexImageSource | TexImageSource[];
    /** 是否为渲染目标纹理。 */
    isRenderTarget: boolean;
    /** 离屏宽度。 */
    OFFSCREEN_WIDTH: number;
    /** 离屏高度。 */
    OFFSCREEN_HEIGHT: number;
    /** 是否失效。 */
    invalid: boolean;
}
