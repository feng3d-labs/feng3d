/**
 * 纹理维度。
 */
const TextureDimensionality = {
    '1D': '1D',
    '2D': '2D',
    '3D': '3D',
    Cube: 'Cube',
};

type TextureDimensionality = keyof typeof TextureDimensionality;

/**
 * 纹理为是否数组。
 */
const TextureArrayed = {
    No: false,
    Yes: true,
};

type TextureArrayed = keyof typeof TextureArrayed;

/**
 * 纹理第二类型，描述纹理维度以及是否为数组。
 */
type TextureSecondType = [TextureDimensionality, TextureArrayed, GPUTextureViewDimension];

/**
 * 采样纹理类型。
 *
 * @see https://gpuweb.github.io/gpuweb/wgsl/#sampled-texture-type
 */
export const SampledTextureType: {
    texture_1d: TextureSecondType;
    texture_2d: TextureSecondType;
    texture_2d_array: TextureSecondType;
    texture_3d: TextureSecondType;
    texture_cube: TextureSecondType;
    texture_cube_array: TextureSecondType;
} = {
    texture_1d: ['1D', 'No', '1d'],
    texture_2d: ['2D', 'No', '2d'],
    texture_2d_array: ['2D', 'Yes', '2d-array'],
    texture_3d: ['3D', 'No', '3d'],
    texture_cube: ['Cube', 'No', 'cube'],
    texture_cube_array: ['Cube', 'Yes', 'cube-array'],
};
export type SampledTextureType = keyof typeof SampledTextureType;

/**
 * 多重采样纹理类型。
 *
 * @see https://gpuweb.github.io/gpuweb/wgsl/#multisampled-texture-type
 */
export const MultisampledTextureType: {
    texture_multisampled_2d: TextureSecondType;
    texture_depth_multisampled_2d: TextureSecondType;
} = {
    texture_multisampled_2d: ['2D', 'No', '2d'],
    texture_depth_multisampled_2d: ['2D', 'No', '2d-array'],
};
export type MultisampledTextureType = keyof typeof MultisampledTextureType;

/**
 * 外部纹理类型。
 *
 * @see https://gpuweb.github.io/gpuweb/wgsl/#external-texture-type
 */
export const ExternalSampledTextureType: {
    texture_external: TextureSecondType;
} = {
    texture_external: ['2D', 'No', '2d'],
};
export type ExternalSampledTextureType = keyof typeof ExternalSampledTextureType;

/**
 * 存储纹理类型。
 *
 * @see https://gpuweb.github.io/gpuweb/wgsl/#texture-storage
 */
export const StorageTextureType: {
    texture_storage_1d: TextureSecondType;
    texture_storage_2d: TextureSecondType;
    texture_storage_2d_array: TextureSecondType;
    texture_storage_3d: TextureSecondType;
} = {
    texture_storage_1d: ['1D', 'No', '1d'],
    texture_storage_2d: ['2D', 'No', '2d'],
    texture_storage_2d_array: ['2D', 'Yes', '2d-array'],
    texture_storage_3d: ['3D', 'No', '3d'],
};
export type StorageTextureType = keyof typeof StorageTextureType;

/**
 * 深度纹理类型。
 */
export const DepthTextureType: {
    texture_depth_2d: TextureSecondType;
    texture_depth_2d_array: TextureSecondType;
    texture_depth_cube: TextureSecondType;
    texture_depth_cube_array: TextureSecondType;
} = {
    texture_depth_2d: ['2D', 'No', '2d'],
    texture_depth_2d_array: ['2D', 'Yes', '2d-array'],
    texture_depth_cube: ['Cube', 'No', 'cube'],
    texture_depth_cube_array: ['Cube', 'Yes', 'cube-array'],
};

/**
 * 所有纹理类型。
 */
export const TextureType = {
    ...SampledTextureType,
    ...MultisampledTextureType,
    ...ExternalSampledTextureType,
    ...StorageTextureType,
    ...DepthTextureType,
};
export type TextureType = keyof typeof TextureType;
