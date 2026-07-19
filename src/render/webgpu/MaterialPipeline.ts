import {
    Sampler,
    Texture,
    TextureView,
} from '@feng3d/webgpu';

/**
 * 默认 webgpu `Sampler`（与旧 TextureInfo 默认值等价的"线性 + repeat"配置）。
 *
 * sampler 配置已上移到 material.samplers，纹理本身不再携带 wrap/filter 元数据；
 * 调用方需要覆盖时在 material 上写 `samplers.<key>Sampler = { ... }` 即可。
 */
export const defaultSampler: Sampler = {
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    maxAnisotropy: 1,
};

/**
 * 从纹理构建 webgpu `TextureView`。
 *
 * cube / cube-array 维度的纹理自动使用 cube 视图（6 层），其余按默认 2D 视图。
 *
 * @param texture webgpu 纹理
 */
export function buildTextureView(texture: Texture): TextureView
{
    const dimension = texture.descriptor?.dimension;
    if (dimension === 'cube' || dimension === 'cube-array')
    {
        return {
            texture: texture as unknown as TextureView['texture'],
            dimension: 'cube',
            arrayLayerCount: 6,
        };
    }

    return {
        texture: texture as unknown as TextureView['texture'],
        dimension: '2d',
    };
}
