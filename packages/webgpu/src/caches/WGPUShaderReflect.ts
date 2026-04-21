import { ResourceType, TemplateInfo, VariableInfo, WgslReflect } from 'wgsl_reflect';
import { DepthTextureType, ExternalSampledTextureType, MultisampledTextureType, TextureType } from '../types/TextureType';

/**
 * 全局类型声明
 *
 * 扩展WebGPU接口，添加自定义属性到绑定组布局入口中。
 * 这些属性用于存储WGSL着色器反射过程中提取的变量信息和布局标识符。
 */
declare global
{
    interface GPUBindGroupLayoutEntry
    {
        /**
         * 绑定资源变量信息
         *
         * 包含从WGSL着色器中提取的变量详细信息，如名称、类型、绑定索引等。
         * 在WGSL着色器反射过程中会被引擎自动赋值。
         */
        variableInfo: VariableInfo;

        /**
         * 绑定组布局标识符
         *
         * 用于唯一标识绑定组布局入口的字符串，包含绑定索引、名称、资源类型等信息。
         * 在WGSL着色器反射过程中会被引擎自动赋值。
         */
        key: string;
    }
}

/**
 * WebGPU着色器反射缓存管理器
 *
 * 负责管理WebGPU着色器反射的完整生命周期，包括：
 * - WGSL着色器代码的反射分析
 * - 资源绑定信息的自动提取
 * - 绑定组布局入口的自动生成
 * - 着色器反射信息的缓存和复用
 * - 资源清理和内存管理
 *
 * 主要功能：
 * 1. **着色器反射** - 自动分析WGSL着色器代码，提取资源绑定信息
 * 2. **资源类型识别** - 自动识别uniform、storage、texture、sampler等资源类型
 * 3. **布局生成** - 自动生成WebGPU绑定组布局入口配置
 * 4. **类型推断** - 自动推断纹理格式、采样类型、访问模式等
 * 5. **实例缓存** - 使用缓存机制避免重复分析相同的着色器代码
 * 6. **资源管理** - 自动处理着色器反射相关资源的清理
 *
 * 使用场景：
 * - 渲染管线的资源绑定配置
 * - 计算管线的资源绑定配置
 * - 着色器资源的自动管理
 * - 绑定组布局的自动生成
 * - 多着色器管线的统一管理
 */
export class WGPUShaderReflect
{
    /**
     * 从WGSL着色器代码中获取反射信息
     *
     * 通过分析WGSL着色器代码，提取其中的资源绑定信息。
     * 使用缓存机制避免重复分析相同的着色器代码。
     *
     * @param code WGSL着色器代码
     * @returns 着色器反射信息对象
     */
    static getWGSLReflectInfo(code: string): WgslReflect
    {
        // 检查缓存中是否已存在对应的反射信息
        let reflect = WGPUShaderReflect.reflectMap[code];

        if (reflect) return reflect;

        try
        {
            // 创建新的着色器反射信息并缓存
            reflect = WGPUShaderReflect.reflectMap[code] = new WgslReflect(code);
        }
        catch (e)
        {
            // 增强错误信息，明确指出是 WGSL 着色器解析错误
            const errorMessage = e instanceof Error ? e.message : String(e);
            const lines = code.split('\n');

            // 尝试从错误消息中提取行号
            const lineMatch = errorMessage.match(/line\s*(\d+)/i);
            const errorLine = lineMatch ? parseInt(lineMatch[1], 10) : null;

            // 构建详细错误输出
            const separator = '='.repeat(70);
            const errorOutput: string[] = [
                '',
                separator,
                '[WGSL Shader Parse Error]',
                `Error: ${errorMessage}`,
                separator,
            ];

            if (errorLine !== null)
            {
                errorOutput.push('Code context:');
                const startLine = Math.max(0, errorLine - 3);
                const endLine = Math.min(lines.length, errorLine + 2);

                for (let i = startLine; i < endLine; i++)
                {
                    const lineNumber = (i + 1).toString().padStart(4, ' ');
                    const marker = (i + 1 === errorLine) ? '>>>' : '   ';

                    errorOutput.push(`${marker} ${lineNumber} | ${lines[i]}`);
                }
            }
            else
            {
                errorOutput.push('Full WGSL code:');
                lines.forEach((line, i) =>
                {
                    const lineNumber = (i + 1).toString().padStart(4, ' ');

                    errorOutput.push(`    ${lineNumber} | ${line}`);
                });
            }

            errorOutput.push(separator);
            errorOutput.push('');

            console.error(errorOutput.join('\n'));

            // 重新抛出带有更明确信息的错误
            throw new Error(`[WGSL Parse Error] ${errorMessage}\n\nSee console for full shader code and context.`);
        }

        return reflect;
    }

    /**
     * 着色器反射信息缓存映射表
     *
     * 用于缓存已分析的着色器反射信息，避免重复分析相同的着色器代码。
     * 键为着色器代码，值为反射信息对象。
     */
    private static readonly reflectMap: { [code: string]: WgslReflect } = {};

    /**
     * 从WGSL着色器代码中获取绑定组布局入口映射
     *
     * 通过分析WGSL着色器代码，自动提取资源绑定信息并生成WebGPU绑定组布局入口配置。
     * 支持uniform、storage、texture、sampler等多种资源类型的自动识别和配置。
     * 使用缓存机制避免重复分析相同的着色器代码。
     *
     * @param code WGSL着色器代码
     * @returns 绑定组布局入口映射表
     */
    static getIGPUBindGroupLayoutEntryMap(code: string): GPUBindGroupLayoutEntryMap
    {
        // 检查缓存中是否已存在对应的布局映射
        if (WGPUShaderReflect.shaderLayoutMap[code]) return WGPUShaderReflect.shaderLayoutMap[code];

        // 创建新的绑定组布局入口映射并缓存
        const entryMap: GPUBindGroupLayoutEntryMap = WGPUShaderReflect.shaderLayoutMap[code] = {};

        // 获取着色器反射信息
        const reflect = WGPUShaderReflect.getWGSLReflectInfo(code);

        // 处理uniform缓冲区资源
        for (const uniform of reflect.uniforms)
        {
            const { binding, name } = uniform;

            // 创建uniform缓冲区绑定布局
            const layout: GPUBufferBindingLayout = {
                type: 'uniform',
                minBindingSize: uniform.size,
            };

            // 添加到布局映射中
            entryMap[name] = {
                variableInfo: uniform,
                visibility: WGPUShaderReflect.Visibility_ALL, binding, buffer: layout,
                key: `[${binding}, ${name}, buffer, ${layout.type} , ${layout.minBindingSize}]`,
            };
        }

        // 处理storage存储资源
        for (const storage of reflect.storage)
        {
            const { group, binding, name } = storage;

            let layout: GPUBufferBindingLayout;

            if (storage.resourceType === ResourceType.Storage)
            {
                // 处理storage缓冲区
                const type: GPUBufferBindingType = storage.access === 'read_write' ? 'storage' : 'read-only-storage';

                // 无法确定storage中数据的尺寸，不设置minBindingSize属性
                layout = {
                    type,
                };

                // 添加到布局映射中
                entryMap[name] = {
                    variableInfo: storage,
                    visibility: type === 'storage' ? WGPUShaderReflect.Visibility_FRAGMENT_COMPUTE : WGPUShaderReflect.Visibility_ALL, binding, buffer: layout,
                    key: `[${binding}, ${name}, buffer, ${layout.type}]`,
                };
            }
            else if (storage.resourceType === ResourceType.StorageTexture)
            {
                // 处理storage纹理
                const textureSecondType = (storage.type as TemplateInfo)?.format?.name as GPUTextureFormat;

                const textureType = storage.type.name as TextureType;

                const viewDimension = TextureType[textureType][2];

                const access = (storage.type as TemplateInfo).access;

                console.assert(access === 'write');

                // 创建storage纹理绑定布局
                const layout: GPUStorageTextureBindingLayout = {
                    access: 'write-only',
                    format: textureSecondType as any,
                    viewDimension,
                };

                // 添加到布局映射中
                entryMap[name] = {
                    variableInfo: storage,
                    visibility: WGPUShaderReflect.Visibility_FRAGMENT_COMPUTE, binding, storageTexture: layout,
                    key: `[${binding}, ${name}, storageTexture, ${layout.access}, ${layout.format}, ${layout.viewDimension}]`,
                };
            }
            else
            {
                console.error(`遇到错误资源类型 ${storage.resourceType}，无法处理！`);
            }
        }

        // 处理纹理资源
        for (const texture of reflect.textures)
        {
            const { group, binding, name } = texture;

            const textureType = texture.type.name as TextureType;

            const viewDimension = TextureType[textureType][2];

            if (ExternalSampledTextureType[textureType])
            {
                // 处理外部采样纹理
                entryMap[name] = {
                    variableInfo: texture,
                    visibility: WGPUShaderReflect.Visibility_ALL, binding, externalTexture: {},
                    key: `[${binding}, ${name}, externalTexture]`,
                };
            }
            else
            {
                // 处理普通纹理
                const textureSecondType = (texture.type as TemplateInfo)?.format?.name as 'f32' | 'u32' | 'i32';

                let sampleType: GPUTextureSampleType;

                if (DepthTextureType[textureType])
                {
                    // 深度纹理
                    sampleType = 'depth';
                }
                else if (textureSecondType === 'f32')
                {
                    // 浮点纹理
                    sampleType = 'float';
                    // 判断是否使用textureLoad函数对当前纹理进行非过滤采样
                    const result = new RegExp(`\\s*textureLoad\\s*\\(\\s*${name}`).exec(code);

                    if (result)
                    {
                        sampleType = 'unfilterable-float';
                    }
                }
                else if (textureSecondType === 'u32')
                {
                    // 无符号整数纹理
                    sampleType = 'uint';
                }
                else if (textureSecondType === 'i32')
                {
                    // 有符号整数纹理
                    sampleType = 'sint';
                }
                else
                {
                    throw `无法识别纹理着色器类型 ${textureSecondType}`;
                }

                // 创建纹理绑定布局
                const layout: GPUTextureBindingLayout = {
                    sampleType,
                    viewDimension,
                };

                // 识别多重采样纹理
                if (MultisampledTextureType[textureType])
                {
                    layout.multisampled = true;
                }

                // 添加到布局映射中
                entryMap[name] = {
                    variableInfo: texture,
                    visibility: WGPUShaderReflect.Visibility_ALL, binding, texture: layout,
                    key: `[${binding}, ${name}, texture, ${layout.sampleType}, ${layout.viewDimension}, ${layout.multisampled}]`,
                };
            }
        }

        // 处理采样器资源
        for (const sampler of reflect.samplers)
        {
            const { group, binding, name } = sampler;

            // 创建采样器绑定布局
            const layout: GPUSamplerBindingLayout = {};

            if (sampler.type.name === 'sampler_comparison')
            {
                // 比较采样器
                layout.type = 'comparison';
            }

            // 添加到布局映射中
            entryMap[name] = {
                variableInfo: sampler,
                visibility: WGPUShaderReflect.Visibility_ALL, binding, sampler: layout,
                key: `[${binding}, ${name}, sampler, ${layout.type}]`,
            };
        }

        return entryMap;
    }

    /**
     * 着色器布局映射缓存表
     *
     * 用于缓存已生成的绑定组布局入口映射，避免重复分析相同的着色器代码。
     * 键为着色器代码，值为绑定组布局入口映射表。
     */
    private static readonly shaderLayoutMap: { [code: string]: GPUBindGroupLayoutEntryMap } = {};

    /**
     * 片段与计算着色器可见性标志
     *
     * 表示资源在片段着色器和计算着色器中可见，但不包括顶点着色器。
     * 值为 GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE = 6
     */
    static readonly Visibility_FRAGMENT_COMPUTE = 6; // GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;

    /**
     * 全部着色器可见性标志
     *
     * 表示资源在所有着色器阶段（顶点、片段、计算）中都可见。
     * 值为 GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE = 7
     */
    static readonly Visibility_ALL = 7; // GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;
}

/**
 * 绑定组布局入口映射类型
 *
 * 定义绑定组布局入口映射表的结构，键为资源名称，值为绑定组布局入口配置。
 * 用于存储从WGSL着色器中提取的所有资源绑定信息。
 */
export type GPUBindGroupLayoutEntryMap = { [name: string]: GPUBindGroupLayoutEntry; };
