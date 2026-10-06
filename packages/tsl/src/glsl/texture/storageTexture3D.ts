import { Uniform } from '../../variables/uniform';
import { Sampler } from '../sampler/sampler';

/**
 * 3D 存储纹理（`texture_storage_3d<format, write>`）——compute 写 3D 纹理用的输出目标。
 *
 * 与 {@link StorageTexture2D} 同理：**只声明一个纹理变量**（不带配对 sampler）。
 *
 * 用法：`const out = storageTexture3D(uniform('outputTexture', 0, 1), 'rgba8unorm');`
 */
export class StorageTexture3D extends Sampler
{
    /** 纹理格式（如 rgba8unorm / rgba16float） */
    readonly format: string;

    /** 访问模式（默认 'write'） */
    readonly storageAccess: 'write' | 'read' | 'read_write';

    constructor(uniform: Uniform, format: string, storageAccess: 'write' | 'read' | 'read_write' = 'write')
    {
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
        return 'sampler3D';
    }

    /** @inheritdoc */
    protected getWGSLTextureType(): string
    {
        return `texture_storage_3d<${this.format}, ${this.storageAccess}>`;
    }

    /**
     * 生成 WGSL 声明：`var <name>: texture_storage_3d<format, access>;`
     */
    override toWGSL(): string
    {
        return `@binding(${this.uniform.getEffectiveBinding() ?? 0}) @group(${this.uniform.getEffectiveGroup() ?? 0}) var ${this.name}: ${this.getWGSLTextureType()};`;
    }
}

/**
 * 创建 3D 存储纹理（compute 的输出目标）。
 *
 * @param uniform 绑定点宿主
 * @param format 纹理格式（如 'rgba8unorm'）
 * @param storageAccess 访问模式（默认 'write'）
 * @returns StorageTexture3D
 */
export function storageTexture3D(uniform: Uniform, format: string, storageAccess: 'write' | 'read' | 'read_write' = 'write'): StorageTexture3D
{
    return new StorageTexture3D(uniform, format, storageAccess);
}
