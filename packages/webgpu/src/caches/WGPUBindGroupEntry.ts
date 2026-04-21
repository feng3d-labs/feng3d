import { computed, Computed, reactive } from '@feng3d/reactivity';
import { BindingResources } from '../data/BindingResources';
import { BufferBinding } from '../data/BufferBinding';
import { ChainMap } from '../utils/ChainMap';
import { Sampler } from '../data/Sampler';
import { Texture } from '../data/Texture';
import { TextureView } from '../data/TextureView';
import { ResourceType } from 'wgsl_reflect';
import { VideoTexture } from '../data/VideoTexture';
import { ReactiveObject } from '../ReactiveObject';
import { ExternalSampledTextureType } from '../types/TextureType';
import { WGPUBufferBinding } from './WGPUBufferBinding';
import { WGPUExternalTexture } from './WGPUExternalTexture';
import { WGPUSampler } from './WGPUSampler';
import { WGPUTextureView } from './WGPUTextureView';

/**
 * 检查对象是否是包含 texture 和 sampler 的纹理对象
 */
function isTextureSamplerObject(value: any): value is { texture: Texture; sampler: Sampler }
{
    return value && typeof value === 'object' && 'texture' in value && 'sampler' in value;
}

// 用于追踪已警告的纹理，避免重复警告
const warnedTextures = new WeakSet<Texture>();

/**
 * 根据纹理的 mip level 数量调整采样器配置
 * 当纹理只有单一 mip level 时，忽略 mipmapFilter 并限制 lodMaxClamp
 */
function adjustSamplerForTexture(texture: Texture | undefined, sampler: Sampler): Sampler
{
    if (!texture) return sampler;

    const descriptor = texture.descriptor;
    const hasMipmap = descriptor.generateMipmap || (descriptor.mipLevelCount && descriptor.mipLevelCount > 1);

    if (!hasMipmap && sampler.mipmapFilter)
    {
        // 只警告一次
        if (!warnedTextures.has(texture))
        {
            warnedTextures.add(texture);
            console.warn(
                `[WebGPU] 纹理没有 mipmap（generateMipmap: false），但采样器设置了 mipmapFilter: '${sampler.mipmapFilter}'。`
                + ` 已自动忽略 mipmapFilter 并将 lodMaxClamp 设为 0，以避免采样错误。`
                + ` 建议：设置 generateMipmap: true 或移除 mipmapFilter 配置。`,
            );
        }

        return {
            ...sampler,
            mipmapFilter: undefined,
            lodMaxClamp: 0,
        };
    }

    return sampler;
}

export class WGPUBindGroupEntry extends ReactiveObject
{
    get gpuBindGroupEntry()
    {
        return this._computedGpuBindGroupEntry.value;
    }

    private _computedGpuBindGroupEntry: Computed<GPUBindGroupEntry>;

    constructor(device: GPUDevice, bindGroupLayout: GPUBindGroupLayoutEntry, bindingResources: BindingResources)
    {
        super();

        this._onCreate(device, bindGroupLayout, bindingResources);
        //
        WGPUBindGroupEntry.map.set([device, bindGroupLayout, bindingResources], this);
        this.destroyCall(() =>
        {
            WGPUBindGroupEntry.map.delete([device, bindGroupLayout, bindingResources]);
        });
    }

    private _onCreate(device: GPUDevice, v: GPUBindGroupLayoutEntry, bindingResources: BindingResources)
    {
        const r_bindingResources = reactive(bindingResources);

        const { name, type, resourceType, binding } = v.variableInfo;

        this._computedGpuBindGroupEntry = computed(() =>
        {
            // 监听当前名称
            r_bindingResources[name];

            // 如果变量名以 _texture 结尾，也需要监听基础名称（如 uSampler_texture -> uSampler）
            // 这样当基础名称变化时，也能触发响应式更新
            if (name.endsWith('_texture'))
            {
                const baseName = name.replace(/_texture$/, ''); // 移除 '_texture' 后缀

                r_bindingResources[baseName];
            }

            // 执行
            const entry: GPUBindGroupEntry = { binding, resource: null };

            //
            if (resourceType === ResourceType.Uniform || resourceType === ResourceType.Storage)
            {
                // 优先使用变量名查找，如果找不到则尝试使用结构体名
                let bufferBinding = bindingResources[name] as BufferBinding;

                if (!bufferBinding)
                {
                    // 监听结构体名
                    r_bindingResources[type.name];
                    bufferBinding = bindingResources[type.name] as BufferBinding;
                }
                if (!bufferBinding)
                {
                    throw new Error(`没有找到缓冲区绑定 '${name}'，同时尝试了 '${type.name}'`);
                }

                //
                const wgpuBufferBinding = WGPUBufferBinding.getInstance(device, bufferBinding, type);

                entry.resource = wgpuBufferBinding.gpuBufferBinding;
            }
            else if (ExternalSampledTextureType[type.name]) // 判断是否为外部纹理
            {
                const wgpuExternalTexture = WGPUExternalTexture.getInstance(device, bindingResources[name] as VideoTexture);

                entry.resource = wgpuExternalTexture.gpuExternalTexture;
            }
            else if (resourceType === ResourceType.Texture || resourceType === ResourceType.StorageTexture)
            {
                let textureView: TextureView | undefined;

                // 如果变量名以 _texture 结尾，说明是展开格式（如 uSampler_texture）
                if (name.endsWith('_texture'))
                {
                    // 先尝试直接获取展开格式
                    textureView = bindingResources[name] as TextureView | undefined;

                    // 如果没有找到，尝试从基础名称中提取（如 uSampler_texture -> uSampler）
                    if (!textureView)
                    {
                        const baseName = name.replace(/_texture$/, ''); // 移除 '_texture' 后缀
                        const value = bindingResources[baseName];

                        if (isTextureSamplerObject(value))
                        {
                            textureView = { texture: value.texture } as TextureView;
                        }
                    }
                }
                else
                {
                    // 检查是否是 texture+sampler 对象（如 { uSampler: { texture, sampler } }）
                    const value = bindingResources[name];

                    if (isTextureSamplerObject(value))
                    {
                        textureView = { texture: value.texture } as TextureView;
                    }
                    else
                    {
                        textureView = bindingResources[name] as TextureView | undefined;
                    }
                }

                if (!textureView)
                {
                    throw new Error(`没有找到纹理绑定 '${name}'`);
                }

                const wgpuTextureView = WGPUTextureView.getInstance(device, textureView);

                entry.resource = wgpuTextureView.textureView;
            }
            else
            {
                // 检查是否是 texture+sampler 对象
                let sampler: Sampler;
                let texture: Texture | undefined;
                const value = bindingResources[name];

                if (!value)
                {
                    throw new Error(`没有找到采样器绑定 '${name}'`);
                }

                if (isTextureSamplerObject(value))
                {
                    // 从 texture+sampler 对象中提取 sampler 和 texture
                    sampler = value.sampler;
                    texture = value.texture;
                }
                else
                {
                    sampler = value as Sampler;
                    // 尝试从展开格式获取对应的纹理（如 diffuse -> diffuse_texture）
                    const textureKey = `${name}_texture`;
                    const textureValue = bindingResources[textureKey];

                    if (textureValue && typeof textureValue === 'object' && 'texture' in textureValue)
                    {
                        texture = (textureValue as TextureView).texture as Texture;
                    }
                }

                // 检查纹理是否只有单一 mip level，如果是则调整采样器配置
                const adjustedSampler = adjustSamplerForTexture(texture, sampler);

                const wgpuSampler = WGPUSampler.getInstance(device, adjustedSampler);

                entry.resource = wgpuSampler.gpuSampler;
            }

            return entry;
        });

        this.destroyCall(() =>
        {
            this._computedGpuBindGroupEntry = null;
        });
    }

    static getInstance(device: GPUDevice, bindGroupLayout: GPUBindGroupLayoutEntry, bindingResources: BindingResources)
    {
        return this.map.get([device, bindGroupLayout, bindingResources]) || new WGPUBindGroupEntry(device, bindGroupLayout, bindingResources);
    }

    private static readonly map = new ChainMap<[GPUDevice, GPUBindGroupLayoutEntry, BindingResources], WGPUBindGroupEntry>();
}
