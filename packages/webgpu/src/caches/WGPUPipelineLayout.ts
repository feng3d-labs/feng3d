import { ChainMap } from '../utils/ChainMap';
import { WGPUBindGroupLayout } from './WGPUBindGroupLayout';
import { GPUBindGroupLayoutEntryMap, WGPUShaderReflect } from './WGPUShaderReflect';

/**
 * 管线布局描述符接口
 *
 * 定义管线布局的配置信息，包含绑定组布局列表和标识符。
 * 用于描述渲染管线或计算管线的资源绑定结构。
 */
export interface PipelineLayoutDescriptor
{
    /**
     * 绑定组布局列表
     *
     * 定义管线中所有绑定组的布局信息，每个绑定组包含一组资源的绑定配置。
     * 这些布局信息决定了着色器如何访问GPU资源。
     */
    bindGroupLayouts: BindGroupLayoutDescriptor[];

    /**
     * 管线布局标识符
     *
     * 用于唯一标识管线布局的字符串，通常由绑定组布局的标识符组合而成。
     * 用于缓存和复用相同的管线布局，避免重复创建。
     */
    label?: string;
}

/**
 * 绑定组布局描述符接口
 *
 * 定义单个绑定组的布局信息，包含该绑定组中所有资源的绑定配置。
 * 每个绑定组对应着色器中的一个@group装饰器。
 */
export interface BindGroupLayoutDescriptor
{
    /**
     * 绑定组布局入口列表
     *
     * 定义绑定组中所有资源的绑定信息，包括资源类型、绑定索引等。
     * 在WGSL着色器反射过程中会被引擎自动赋值。
     */
    entries: GPUBindGroupLayoutEntry[];

    /**
     * 绑定组布局标识符
     *
     * 用于唯一标识绑定组布局的字符串，通常由入口的键名组合而成。
     * 在WGSL着色器反射过程中会被引擎自动赋值。
     */
    label?: string;
}

/**
 * WebGPU管线布局缓存管理器
 *
 * 负责管理WebGPU管线布局的完整生命周期，包括：
 * - 管线布局的创建和配置
 * - 着色器反射和资源绑定分析
 * - 绑定组布局的自动生成和管理
 * - 管线布局实例的缓存和复用
 * - 资源清理和内存管理
 *
 * 主要功能：
 * 1. **着色器反射** - 自动分析WGSL着色器代码，提取资源绑定信息
 * 2. **绑定组管理** - 自动生成和管理绑定组布局
 * 3. **冲突检测** - 检测着色器中的资源绑定冲突和重复定义
 * 4. **布局优化** - 自动优化和复用相同的管线布局
 * 5. **实例缓存** - 使用缓存机制避免重复创建相同的管线布局
 * 6. **资源管理** - 自动处理管线布局相关资源的清理
 *
 * 使用场景：
 * - 渲染管线的资源绑定配置
 * - 计算管线的资源绑定配置
 * - 着色器资源的自动管理
 * - 管线布局的优化和复用
 * - 多着色器管线的统一管理
 */
export class WGPUPipelineLayout
{
    /**
     * 从着色器代码中获取管线布局描述符
     *
     * 通过分析WGSL着色器代码，自动提取资源绑定信息并生成管线布局描述符。
     * 支持顶点/片段着色器和计算着色器两种模式。
     * 自动检测和处理资源绑定冲突。
     *
     * @param shader 着色器配置对象，包含顶点/片段着色器或计算着色器代码
     * @returns 管线布局描述符
     */
    static getPipelineLayout(shader: { vertex: string, fragment: string } | { compute: string })
    {
        // 生成着色器的唯一标识符，用于缓存查找
        const shaderKey = getShaderKey(shader);

        if (WGPUPipelineLayout._pipelineLayoutMap.has(shaderKey)) return WGPUPipelineLayout._pipelineLayoutMap.get(shaderKey);

        let entryMap: GPUBindGroupLayoutEntryMap;

        // 根据着色器类型获取资源绑定信息
        if ('compute' in shader)
        {
            // 计算着色器模式：只分析计算着色器代码
            entryMap = WGPUShaderReflect.getIGPUBindGroupLayoutEntryMap(shader.compute);
        }
        else
        {
            // 渲染管线模式：先分析顶点着色器
            entryMap = WGPUShaderReflect.getIGPUBindGroupLayoutEntryMap(shader.vertex);

            // 如果存在片段着色器，合并其资源绑定信息
            if ('fragment' in shader)
            {
                const fragmentEntryMap = WGPUShaderReflect.getIGPUBindGroupLayoutEntryMap(shader.fragment);

                // 遍历片段着色器的所有资源
                for (const resourceName in fragmentEntryMap)
                {
                    // 检测相同名称的资源是否在多个着色器中定义
                    if (entryMap[resourceName])
                    {
                        const preEntry = entryMap[resourceName].variableInfo;
                        const currentEntry = fragmentEntryMap[resourceName].variableInfo;

                        // 检查绑定信息是否一致
                        if (preEntry.group !== currentEntry.group
                            || preEntry.binding !== currentEntry.binding
                            || preEntry.resourceType !== currentEntry.resourceType
                        )
                        {
                            console.warn(`分别在 着色器 @group(${preEntry.group}) @binding(${preEntry.binding}) 与 @group(${currentEntry.group}) @binding(${currentEntry.binding}) 处存在相同名称的变量 ${currentEntry.name} 。`);
                        }
                    }
                    // 将片段着色器的资源绑定信息合并到主映射中
                    entryMap[resourceName] = fragmentEntryMap[resourceName];
                }
            }
        }

        // 创建绑定组布局描述符列表
        const bindGroupLayoutDescriptors: BindGroupLayoutDescriptor[] = [];

        // 遍历所有资源绑定信息，按绑定组分组
        for (const resourceName in entryMap)
        {
            const bindGroupLayoutEntry = entryMap[resourceName];
            const { group, binding } = bindGroupLayoutEntry.variableInfo;

            // 获取或创建对应绑定组的布局描述符
            const bindGroupLayoutDescriptor = bindGroupLayoutDescriptors[group] ??= { entries: [] };

            // 检测相同绑定位置是否存在多个资源定义
            if (bindGroupLayoutDescriptor.entries[binding])
            {
                // 存在重复定义时，输出错误信息
                const preEntry = bindGroupLayoutDescriptor.entries[binding];

                console.error(`在管线中 @group(${group}) @binding(${binding}) 处存在多个定义 ${preEntry.variableInfo.name} ${resourceName} ！`);
            }

            // 将资源绑定信息添加到对应绑定组的指定位置
            bindGroupLayoutDescriptor.entries[binding] = bindGroupLayoutEntry;
        }

        // 生成绑定组布局列表，并进行缓存优化
        const bindGroupLayouts = bindGroupLayoutDescriptors.map((descriptor) =>
        {
            // 过滤掉undefined元素，确保数组的连续性
            const entries = (descriptor.entries as GPUBindGroupLayoutEntry[]).filter((v) => !!v);
            const label = entries.map((v) => v.key).join(',');

            // 检查是否已存在相同的绑定组布局，避免重复创建
            let bindGroupLayout = this._bindGroupLayoutDescriptor[label];

            if (!bindGroupLayout)
            {
                // 创建新的绑定组布局描述符并缓存
                bindGroupLayout = this._bindGroupLayoutDescriptor[label] = { entries, label: label };
            }

            return bindGroupLayout;
        });

        // 生成管线布局的唯一标识符
        const pipelineLayoutKey = bindGroupLayouts.map((v, i) => `[${i}: ${v.label}]`).join(',');

        // 检查是否已存在相同的管线布局，避免重复创建
        let gpuPipelineLayout = this._pipelineLayoutDescriptorMap[pipelineLayoutKey];

        if (!gpuPipelineLayout)
        {
            // 创建新的管线布局描述符并缓存
            gpuPipelineLayout = this._pipelineLayoutDescriptorMap[pipelineLayoutKey] = {
                bindGroupLayouts,
                label: pipelineLayoutKey,
            };
            gpuPipelineLayout.bindGroupLayouts = bindGroupLayouts;
        }

        WGPUPipelineLayout._pipelineLayoutMap.set(shaderKey, gpuPipelineLayout);

        return gpuPipelineLayout;
    }

    private static _pipelineLayoutMap = new Map<string, PipelineLayoutDescriptor>();

    /**
     * 绑定组布局描述符缓存映射表
     *
     * 用于缓存已创建的绑定组布局描述符，避免重复创建相同的布局。
     * 键为布局标识符，值为绑定组布局描述符。
     */
    private static readonly _bindGroupLayoutDescriptor: { [key: string]: BindGroupLayoutDescriptor } = {};

    /**
     * 管线布局描述符缓存映射表
     *
     * 用于缓存已创建的管线布局描述符，避免重复创建相同的布局。
     * 键为管线布局标识符，值为管线布局描述符。
     */
    private static readonly _pipelineLayoutDescriptorMap: { [key: string]: PipelineLayoutDescriptor } = {};

    /**
     * 获取或创建GPU管线布局实例
     *
     * 根据着色器代码获取或创建GPU管线布局实例。
     * 使用缓存机制避免重复创建相同的管线布局。
     * 自动处理着色器反射和绑定组布局的生成。
     *
     * @param device GPU设备实例
     * @param shader 着色器配置对象，包含顶点/片段着色器或计算着色器代码
     * @returns GPU管线布局实例
     */
    static getGPUPipelineLayout(device: GPUDevice, shader: { vertex: string, fragment: string } | { compute: string })
    {
        // 生成着色器的唯一标识符，用于缓存查找
        const shaderKey = getShaderKey(shader);

        // 检查设备缓存中是否已存在对应的管线布局
        let gpuPipelineLayout = WGPUPipelineLayout.map.get([device, shaderKey]);

        if (gpuPipelineLayout) return gpuPipelineLayout;

        // 获取管线布局描述符
        const pipelineLayout = WGPUPipelineLayout.getPipelineLayout(shader);

        // 创建GPU绑定组布局实例
        const bindGroupLayouts: GPUBindGroupLayout[] = pipelineLayout.bindGroupLayouts.map((v) =>
        {
            const gpuBindGroupLayout = WGPUBindGroupLayout.getGPUBindGroupLayout(device, v);

            return gpuBindGroupLayout;
        });

        // 创建GPU管线布局描述符
        const descriptor: GPUPipelineLayoutDescriptor = {
            bindGroupLayouts,
        };

        // 创建GPU管线布局实例
        gpuPipelineLayout = device.createPipelineLayout(descriptor);

        // 将管线布局实例缓存到设备中
        WGPUPipelineLayout.map.set([device, shaderKey], gpuPipelineLayout);

        return gpuPipelineLayout;
    }

    private static readonly map = new ChainMap<[GPUDevice, string], GPUPipelineLayout>();
}

function getShaderKey(shader: { vertex: string, fragment: string } | { compute: string })
{
    // 生成着色器的唯一标识符，用于缓存查找
    let shaderKey = '';

    if ('compute' in shader)
    {
        // 计算着色器模式：使用计算着色器代码作为键
        shaderKey += shader.compute;
    }
    else
    {
        // 渲染管线模式：组合顶点和片段着色器代码
        shaderKey += shader.vertex;
        if (shader.fragment) shaderKey += `\n// ------顶点与片段着色器分界--------\n${shader.fragment}`;
    }

    return shaderKey;
}
