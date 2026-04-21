import { Computed, computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { VertexAttributes, VertexData } from '../data/VertexAttributes';
import { vertexFormatMap } from '../consts/vertexFormatMap';
import { VertexState } from '../data/VertexState';
import { FunctionInfo } from 'wgsl_reflect';
import { ReactiveObject } from '../ReactiveObject';
import { WGPUShaderReflect } from './WGPUShaderReflect';

/**
 * WebGPU顶点缓冲区布局缓存管理器
 *
 * 负责管理WebGPU顶点缓冲区布局的完整生命周期，包括：
 * - 顶点缓冲区布局的创建和配置
 * - 响应式监听顶点状态和顶点属性变化
 * - 自动重新创建顶点缓冲区布局当依赖变化时
 * - 着色器反射和顶点属性匹配
 * - 顶点缓冲区布局实例的缓存和复用
 * - 资源清理和内存管理
 *
 * 主要功能：
 * 1. **布局管理** - 自动创建和配置GPU顶点缓冲区布局
 * 2. **着色器反射** - 自动分析顶点着色器，提取输入属性信息
 * 3. **属性匹配** - 自动匹配顶点属性与着色器输入
 * 4. **格式验证** - 自动验证顶点数据格式与着色器类型匹配
 * 5. **响应式更新** - 监听顶点状态和属性变化，自动重新创建
 * 6. **实例缓存** - 使用嵌套WeakMap缓存布局实例，避免重复创建
 * 7. **资源管理** - 自动处理顶点缓冲区布局相关资源的清理
 *
 * 使用场景：
 * - 渲染管线中的顶点数据处理
 * - 顶点着色器输入属性配置
 * - 顶点数据格式验证和转换
 * - 多顶点格式的渲染管理
 * - 动态顶点属性更新
 */
export class WGPUVertexBufferLayout extends ReactiveObject
{
    /**
     * GPU顶点缓冲区布局数组
     *
     * 包含所有顶点缓冲区的布局配置信息，用于GPU渲染管线。
     * 当顶点状态或顶点属性发生变化时，此数组会自动重新创建。
     */
    get vertexBufferLayouts()
    {
        return this._computedGpuVertexBufferLayouts.value.vertexBufferLayouts;
    }

    /**
     * 顶点数据数组
     *
     * 包含所有顶点数据，与vertexBufferLayouts 中的布局一一对应。
     * 当顶点状态或顶点属性发生变化时，此数组会自动重新创建。
     */
    get vertexDatas()
    {
        return this._computedGpuVertexBufferLayouts.value.vertexDatas;
    }

    private _computedGpuVertexBufferLayouts: Computed<{ vertexBufferLayouts: GPUVertexBufferLayout[], vertexDatas: VertexData[] }>;

    /**
     * 构造函数
     *
     * 创建顶点缓冲区布局管理器实例，并设置响应式监听。
     *
     * @param vertexState 顶点状态配置对象，包含着色器代码和参数
     * @param vertices 顶点属性配置对象，定义顶点数据格式
     */
    constructor(vertexState: VertexState, vertices: VertexAttributes)
    {
        super();

        // 设置顶点缓冲区布局创建和更新逻辑
        this._onCreate(vertexState, vertices);

        //
        WGPUVertexBufferLayout.map.set([vertexState, vertices], this);
        this.destroyCall(() =>
        {
            WGPUVertexBufferLayout.map.delete([vertexState, vertices]);
        });
    }

    /**
     * 设置顶点缓冲区布局创建和更新逻辑
     *
     * 使用响应式系统监听顶点状态和顶点属性变化，自动重新创建顶点缓冲区布局。
     * 当顶点状态或顶点属性参数发生变化时，会触发顶点缓冲区布局的重新创建。
     * 自动处理着色器反射、属性匹配和格式验证。
     *
     * @param vertexState 顶点状态配置对象
     * @param vertices 顶点属性配置对象
     */
    private _onCreate(vertexState: VertexState, vertices: VertexAttributes)
    {
        const r_vertexState = reactive(vertexState);

        // 监听顶点状态和顶点属性变化，自动重新创建顶点缓冲区布局
        this._computedGpuVertexBufferLayouts = computed(() =>
        {
            // 触发响应式依赖，监听顶点状态的所有属性
            const code = r_vertexState.wgsl || r_vertexState.code;
            const entryPoint = r_vertexState.entryPoint;

            // 获取着色器反射信息
            const wgslReflect = WGPUShaderReflect.getWGSLReflectInfo(code);
            let vertexEntryFunctionInfo: FunctionInfo;

            // 获取顶点着色器入口函数信息
            if (entryPoint)
            {
                vertexEntryFunctionInfo = wgslReflect.entry.vertex.filter((v) => v.name === entryPoint)[0];
            }
            else
            {
                vertexEntryFunctionInfo = WGPUShaderReflect.getWGSLReflectInfo(code).entry.vertex[0];
            }

            // 初始化顶点缓冲区布局和缓冲区数组
            const vertexBufferLayouts: GPUVertexBufferLayout[] = [];
            const vertexDatas: VertexData[] = [];
            const bufferIndexMap = new Map<VertexData, number>();

            // 遍历顶点着色器的所有输入属性
            vertexEntryFunctionInfo.inputs.forEach((inputInfo) =>
            {
                // 跳过内置属性（如vertex_index、instance_index等）
                if (inputInfo.locationType === 'builtin') return;

                const shaderLocation = inputInfo.location as number;
                const attributeName = inputInfo.name;

                // 获取对应的顶点属性配置
                const vertexAttribute = vertices[attributeName];

                console.assert(!!vertexAttribute, `在提供的顶点属性数据中未找到 ${attributeName} 。`);

                // 监听每个顶点属性数据的变化
                const r_vertexAttribute = reactive(vertexAttribute);

                r_vertexAttribute.data;
                r_vertexAttribute.format;
                r_vertexAttribute.offset;
                r_vertexAttribute.arrayStride;
                r_vertexAttribute.stepMode;

                // 获取顶点属性配置信息
                const data = vertexAttribute.data;
                const attributeOffset = vertexAttribute.offset || 0;
                let arrayStride = vertexAttribute.arrayStride;
                const stepMode = vertexAttribute.stepMode ?? 'vertex';
                const format = vertexAttribute.format;

                // 验证顶点数据格式是否与着色器匹配
                // const wgslType = getWGSLType(v.type);
                // let possibleFormats = wgslVertexTypeMap[wgslType].possibleFormats;
                // console.assert(possibleFormats.indexOf(format) !== -1, `顶点${attributeName} 提供的数据格式 ${format} 与着色器中类型 ${wgslType} 不匹配！`);
                console.assert(data.constructor.name === vertexFormatMap[format].typedArrayConstructor.name,
                    `顶点${attributeName} 提供的数据类型 ${data.constructor.name} 与格式 ${format} 不匹配！请使用 ${data.constructor.name} 来组织数据或者更改数据格式。`);

                // 计算单个顶点的字节大小
                const vertexByteSize = vertexFormatMap[format].byteSize;

                // 如果没有指定数组步长，则使用单个顶点的字节大小
                if (!arrayStride)
                {
                    arrayStride = vertexByteSize;
                }
                // 验证偏移量和步长的合理性
                console.assert(attributeOffset + vertexByteSize <= arrayStride, `offset(${attributeOffset}) + vertexByteSize(${vertexByteSize}) 必须不超出 arrayStride(${arrayStride})。`);

                // 查找或创建对应的顶点缓冲区布局
                let index = bufferIndexMap.get(data);
                let gpuVertexBufferLayout: GPUVertexBufferLayout;

                if (index === undefined)
                {
                    // 创建新的顶点缓冲区布局
                    index = vertexBufferLayouts.length;
                    bufferIndexMap.set(data, index);

                    // 获取或创建顶点缓冲区实例
                    vertexDatas[index] = vertexAttribute.data;

                    // 创建GPU顶点缓冲区布局
                    gpuVertexBufferLayout = vertexBufferLayouts[index] = { stepMode, arrayStride, attributes: [] };
                }
                else
                {
                    // 使用现有的顶点缓冲区布局
                    gpuVertexBufferLayout = vertexBufferLayouts[index];
                    if (__DEV__)
                    {
                        // 验证同一顶点缓冲区中的步长和步进模式必须相同
                        console.assert(vertexBufferLayouts[index].arrayStride === arrayStride && vertexBufferLayouts[index].stepMode === stepMode, '要求同一顶点缓冲区中 arrayStride 与 stepMode 必须相同。');
                    }
                }
                // 添加顶点属性到布局中
                const attributes = gpuVertexBufferLayout.attributes as Array<GPUVertexAttribute>;

                attributes.push({ shaderLocation, offset: attributeOffset, format });
            });

            // 更新顶点缓冲区布局和缓冲区引用
            return { vertexBufferLayouts, vertexDatas };
        });
    }

    /**
     * 获取或创建顶点缓冲区布局实例
     *
     * 使用单例模式管理顶点缓冲区布局实例，避免重复创建相同的布局。
     * 如果缓存中已存在对应的实例，则直接返回；否则创建新实例并缓存。
     *
     * @param vertexState 顶点状态配置对象
     * @param vertices 顶点属性配置对象
     * @returns 顶点缓冲区布局实例
     */
    static getInstance(vertexState: VertexState, vertices: VertexAttributes)
    {
        // 尝试从缓存中获取现有实例，如果不存在则创建新实例
        return this.map.get([vertexState, vertices]) || new WGPUVertexBufferLayout(vertexState, vertices);
    }

    static readonly map = new ChainMap<[VertexState, VertexAttributes], WGPUVertexBufferLayout>();
}
