import { Uniform } from '../../variables/uniform';
import { Sampler } from '../sampler/sampler';

/**
 * 存储纹理（`texture_storage_2d<format, write>`）——compute 的输出目标。
 *
 * 与深度纹理同理：**只声明一个纹理变量**（不带配对 sampler），
 * 所以直接 override {@link Sampler.toWGSL}。
 *
 * 用法：`const out = storageTexture2D('output', uniform('output', 1, 2), 'rgba16float');`
 */
export class StorageTexture2D extends Sampler
{
    /** 纹理格式（如 rgba16float / rgba8unorm） */
    readonly format: string;

    /** 访问模式（默认 'write'） */
    readonly storageAccess: 'write' | 'read' | 'read_write';

    constructor(uniform: Uniform, format: string, storageAccess: 'write' | 'read' | 'read_write' = 'write')
    {
        // 存储纹理不需要 sampler，也不参与 sampler/texture 的成对展开
        super(uniform, true);
        this.format = format;
        this.storageAccess = storageAccess;
    }

    /** 纹理名（取自绑定点宿主） */
    get name(): string
    {
        return this.uniform.name;
    }

    /** @inheritdoc */
    protected getGLSLSamplerType(): string
    {
        return 'sampler2D';
    }

    /** @inheritdoc */
    protected getWGSLTextureType(): string
    {
        return `texture_storage_2d<${this.format}, ${this.storageAccess}>`;
    }

    /**
     * 生成 WGSL 声明：`@group(x) @binding(y) var <name>: texture_storage_2d<format, access>;`
     */
    override toWGSL(): string
    {
        const group = this.uniform.getEffectiveGroup() ?? 0;
        const binding = this.uniform.getEffectiveBinding() ?? 0;

        return `@binding(${binding}) @group(${group}) var ${this.name}: texture_storage_2d<${this.format}, ${this.storageAccess}>;`;
    }
}

/**
 * 创建存储纹理（compute 的输出目标）。
 *
 * @param uniform 绑定点宿主
 * @param format 纹理格式（如 'rgba16float'）
 * @param storageAccess 访问模式（默认 'write'）
 * @returns StorageTexture2D
 */
export function storageTexture2D(uniform: Uniform, format: string, storageAccess: 'write' | 'read' | 'read_write' = 'write'): StorageTexture2D
{
    return new StorageTexture2D(uniform, format, storageAccess);
}
