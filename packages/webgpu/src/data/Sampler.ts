import { CompareFunction } from './StencilFaceState';

/**
 * 纹理采样器。
 *
 * {@link GPUSampler}
 *
 * {@link GPUSamplerDescriptor}
 *
 * @see https://www.orillusion.com/zh/webgpu.html#dictdef-gpusamplerdescriptor
 */
export interface Sampler
{
    /**
     * 标签。
     *
     * 用于调试。
     */
    readonly label?: string;

    /**
     * 用于指定纹理在水平方向（即S或U坐标轴）上的寻址模式。
     *
     * 默认 "repeat"。
     *
     * @see https://gpuweb.github.io/gpuweb/#dom-gpusamplerdescriptor-addressmodeu
     */
    readonly addressModeU?: IAddressMode;

    /**
     * 用于指定纹理在垂直方向（即T或V坐标轴）上的寻址模式。
     *
     * 默认 "repeat"。
     *
     * @see https://gpuweb.github.io/gpuweb/#dom-gpusamplerdescriptor-addressmodev
     */
    readonly addressModeV?: IAddressMode;

    /**
     * 用于指定纹理在深度方向（即R或W坐标轴）上的寻址模式。用于3D纹理或者纹理数组。
     *
     * 默认 "repeat"。
     *
     * @see https://gpuweb.github.io/gpuweb/#dom-gpusamplerdescriptor-addressmodew
     */
    readonly addressModeW?: IAddressMode;

    /**
     * 指定样本足迹小于或等于一个纹素时的采样行为
     *
     * 默认 "nearest"。
     *
     * @see https://www.orillusion.com/zh/webgpu.html#dom-gpusamplerdescriptor-magfilter
     */
    readonly magFilter?: IFilterMode;

    /**
     * 指定样本足迹大于一个纹素时的采样行为。
     *
     * 默认 "nearest"。
     *
     * @see https://www.orillusion.com/zh/webgpu.html#dom-gpusamplerdescriptor-minfilter
     */
    readonly minFilter?: IFilterMode;

    /**
     * 指定在 mipmap 级别之间进行采样的行为。
     *
     * 默认 "nearest"。
     *
     * @see https://www.orillusion.com/zh/webgpu.html#dom-gpusamplerdescriptor-mipmapfilter
     */
    readonly mipmapFilter?: IMipmapFilterMode;

    /**
     * 指定采样器使用的最大各向异性值夹具。
     * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为1。
     *
     * 仅当 minFilter 、magFilter 或 mipmapFilter 为 "linear" 时才有效，否则取 1。
     *
     * 默认 1。
     *
     * 注：大多数实现支持范围在1到16之间（包括1和16）的maxAnisotropy值。所使用的maxAnisotropy值将被限制在平台支持的最大值内
     *
     * @see https://www.orillusion.com/zh/webgpu.html#dom-gpusamplerdescriptor-maxanisotropy
     */
    readonly maxAnisotropy?: number;

    /**
     * 采样时使用的最小Lod等级。
     *
     * 默认 0。
     */
    readonly lodMinClamp?: number;

    /**
     * 采样时使用的最大Lod等级。
     *
     * 默认 16。当未设置 {@link mipmapFilter} 时默认为 0（不使用 mipmap）。
     */
    readonly lodMaxClamp?: number;

    /**
     * 涉及纹理比较操作时需提供，采样器将是具有指定 GPUCompareFunction 的比较采样器。
     *
     * 默认为 `undefined`，表示用于正常纹理采样，不用与纹理比较操作。
     *
     * 注：比较采样器可能会使用过滤，但采样结果将是 依赖于实现并且可能不同于正常的过滤规则。
     */
    readonly compare?: CompareFunction;
}

/**
 * 纹理坐标寻址模式。
 */
export type IAddressMode = 'clamp-to-edge' | 'repeat' | 'mirror-repeat';

/**
 * 描述采样器在采样足迹与一个纹素不完全匹配时的行为。
 */
export type IFilterMode = 'nearest' | 'linear';

/**
 * 描述采样器在采样足迹与mipmap层级不完全匹配时的行为。
 */
export type IMipmapFilterMode = 'nearest' | 'linear';

/**
 * 采样器默认值。
 */
export const defaultSampler: Sampler = {
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    addressModeW: 'repeat',
    magFilter: 'nearest',
    minFilter: 'nearest',
    mipmapFilter: 'nearest',
    lodMinClamp: 0,
    lodMaxClamp: 16,
    compare: undefined,
    maxAnisotropy: 1,
};
