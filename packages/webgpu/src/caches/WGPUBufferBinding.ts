import { computed, Computed, reactive, UnReadonly } from '@feng3d/reactivity';
import { Buffer } from '../data/Buffer';
import { BufferBinding } from '../data/BufferBinding';
import { BufferBindingInfo } from '../internal/BufferBindingInfo';
import { ChainMap } from '../utils/ChainMap';
import { ArrayInfo, StructInfo, TemplateInfo, TypeInfo } from 'wgsl_reflect';
import { ReactiveObject } from '../ReactiveObject';
import { convertToAlignedFormat } from '../utils/convertToAlignedFormat';
import { WGPUBuffer } from './WGPUBuffer';

export class WGPUBufferBinding extends ReactiveObject
{
    get gpuBufferBinding()
    {
        return this._computedGpuBufferBinding.value;
    }

    private _computedGpuBufferBinding: Computed<GPUBufferBinding>;

    constructor(device: GPUDevice, bufferBinding: BufferBinding, type: TypeInfo)
    {
        super();

        this._onCreate(device, bufferBinding, type);
        //
        WGPUBufferBinding.map.set([device, bufferBinding, type], this);
        this.destroyCall(() =>
        {
            WGPUBufferBinding.map.delete([device, bufferBinding, type]);
        });
    }

    private _onCreate(device: GPUDevice, bufferBinding: BufferBinding, type: TypeInfo)
    {
        const r_bufferBinding = reactive(bufferBinding);

        const bufferBindingInfo = getBufferBindingInfo(type);

        // 是否存在默认值。
        const hasDefautValue = !!bufferBinding.bufferView;

        if (!hasDefautValue)
        {
            (bufferBinding as UnReadonly<BufferBinding>).bufferView = new Uint8Array(bufferBindingInfo.size);
        }

        // 更新缓冲区绑定的数据。
        this.updateBufferBinding(bufferBinding, hasDefautValue, bufferBindingInfo);

        this._computedGpuBufferBinding = computed(() =>
        {
            // 监听

            r_bufferBinding?.bufferView;

            const bufferView = bufferBinding.bufferView;
            //
            const gbuffer = Buffer.getBuffer(bufferView.buffer);

            (gbuffer as any).label = gbuffer.label || (`BufferBinding ${type.name}`);
            //
            const buffer = WGPUBuffer.getInstance(device, gbuffer).gpuBuffer;

            const offset = bufferView.byteOffset;
            const size = bufferView.byteLength;

            const gpuBufferBinding: GPUBufferBinding = {
                buffer,
                offset,
                size,
            };

            return gpuBufferBinding;
        });
    }

    /**
     * 初始化缓冲区绑定。
     *
     * @param variableInfo
     * @param bufferBinding
     * @returns
     */
    private updateBufferBinding(bufferBinding: BufferBinding, hasDefautValue: boolean, bufferBindingInfo: BufferBindingInfo)
    {
        const buffer = Buffer.getBuffer(bufferBinding.bufferView.buffer);
        const offset = bufferBinding.bufferView.byteOffset;

        const r_bufferBinding = reactive(bufferBinding);

        for (let i = 0; i < bufferBindingInfo.items.length; i++)
        {
            const { paths, offset: itemInfoOffset, size: itemInfoSize, Cls, typeName } = bufferBindingInfo.items[i];

            // 更新数据
            this.effect(() =>
            {
                let value: any = bufferBinding.value;
                let r_value: any = r_bufferBinding.value; // 监听

                if (value === undefined) return;

                for (let i = 0; i < paths.length; i++)
                {
                    value = value[paths[i]];
                    r_value = r_value[paths[i]]; // 监听
                    if (value === undefined)
                    {
                        if (!hasDefautValue)
                        {
                            console.warn(`没有找到 统一块变量属性 ${paths.join('.')} 的值！`);
                        }

                        return;
                    }
                }

                // 更新数据
                let data: Float32Array | Int32Array | Uint32Array | Int16Array;

                if (typeof value === 'number')
                {
                    data = new Cls([value]);
                }
                else if (value.constructor.name !== Cls.name)
                {
                    data = new Cls(value as ArrayLike<number>);
                }
                else
                {
                    data = value as any;
                }

                // 检查是否需要对齐转换（mat*x3 类型，每列 vec3 需要按 vec4 对齐）
                if (typeName)
                {
                    data = convertToAlignedFormat(data, typeName);
                }

                const writeBuffers = buffer.writeBuffers ?? [];

                writeBuffers.push({ bufferOffset: offset + itemInfoOffset, data: data, size: Math.min(itemInfoSize, data.byteLength) / data.BYTES_PER_ELEMENT });
                reactive(buffer).writeBuffers = writeBuffers;
            });
        }
    }

    static getInstance(device: GPUDevice, bufferBinding: BufferBinding, type: TypeInfo)
    {
        return this.map.get([device, bufferBinding, type]) || new WGPUBufferBinding(device, bufferBinding, type);
    }

    private static readonly map = new ChainMap<[GPUDevice, BufferBinding, TypeInfo], WGPUBufferBinding>();
}

/**
 * 获取缓冲区绑定信息。
 *
 * @param type 类型信息。
 * @returns
 */
function getBufferBindingInfo(type: TypeInfo)
{
    let result = bufferBindingInfoMap.get(type);

    if (result) return result;
    result = _getBufferBindingInfo(type);

    bufferBindingInfoMap.set(type, result);

    return result;
}
const bufferBindingInfoMap = new Map<TypeInfo, BufferBindingInfo>();

/**
 * 获取缓冲区绑定信息。
 *
 * @param type 类型信息。
 * @param paths 当前路径。
 * @param offset 当前编译。
 * @param bufferBindingInfo 缓冲区绑定信息。
 * @returns
 */
function _getBufferBindingInfo(type: TypeInfo, paths: string[] = [], offset = 0, bufferBindingInfo: BufferBindingInfo = { size: type.size, items: [] })
{
    if (type.isStruct)
    {
        const structInfo = type as StructInfo;

        for (let i = 0; i < structInfo.members.length; i++)
        {
            const memberInfo = structInfo.members[i];

            _getBufferBindingInfo(memberInfo.type, paths.concat(memberInfo.name), offset + memberInfo.offset, bufferBindingInfo);
        }
    }
    else if (type.isArray)
    {
        const arrayInfo = type as ArrayInfo;

        for (let i = 0; i < arrayInfo.count; i++)
        {
            _getBufferBindingInfo(arrayInfo.format, paths.concat(`${i}`), offset + i * arrayInfo.format.size, bufferBindingInfo);
        }
    }
    else if (type.isTemplate)
    {
        const templateInfo = type as TemplateInfo;
        const templateFormatName = templateInfo.format?.name;

        bufferBindingInfo.items.push({
            paths: paths.concat(),
            offset,
            size: templateInfo.size,
            Cls: getTemplateDataCls(templateFormatName as any),
            typeName: templateInfo.name,
        });
    }
    else
    {
        bufferBindingInfo.items.push({
            paths: paths.concat(),
            offset,
            size: type.size,
            Cls: getBaseTypeDataCls(type.name),
            typeName: type.name,
        });
    }

    return bufferBindingInfo;
}

function getTemplateDataCls(templateFormatName: 'i32' | 'u32' | 'f32' | 'f16')
{
    const dataCls = templateFormatDataCls[templateFormatName];

    console.assert(!!dataCls, `templateFormatName必须为以下值 ${Object.keys(templateFormatDataCls)}`);

    return dataCls;
}

const templateFormatDataCls: { [key: string]: DataCls } = {
    i32: Int32Array,
    u32: Uint32Array,
    f32: Float32Array,
    f16: Int16Array,
};

function getBaseTypeDataCls(baseTypeName: string)
{
    const dataCls = baseTypeDataCls[baseTypeName];

    console.assert(!!dataCls, `baseTypeName必须为以下值 ${Object.keys(baseTypeDataCls)}`);

    return dataCls;
}

/**
 * @see https://gpuweb.github.io/gpuweb/wgsl/#vec2i
 */
const baseTypeDataCls: { [key: string]: DataCls } = {
    i32: Int32Array,
    u32: Uint32Array,
    f32: Float32Array,
    f16: Int16Array,
    vec2i: Int32Array,
    vec3i: Int32Array,
    vec4i: Int32Array,
    vec2u: Uint32Array,
    vec3u: Uint32Array,
    vec4u: Uint32Array,
    vec2f: Float32Array,
    vec3f: Float32Array,
    vec4f: Float32Array,
    vec2h: Int16Array,
    vec3h: Int16Array,
    vec4h: Int16Array,
    mat2x2f: Float32Array,
    mat2x3f: Float32Array,
    mat2x4f: Float32Array,
    mat3x2f: Float32Array,
    mat3x3f: Float32Array,
    mat3x4f: Float32Array,
    mat4x2f: Float32Array,
    mat4x3f: Float32Array,
    mat4x4f: Float32Array,
    mat2x2h: Float32Array,
    mat2x3h: Float32Array,
    mat2x4h: Float32Array,
    mat3x2h: Float32Array,
    mat3x3h: Float32Array,
    mat3x4h: Float32Array,
    mat4x2h: Float32Array,
    mat4x3h: Float32Array,
    mat4x4h: Float32Array,
};

type DataCls = Float32ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | Int16ArrayConstructor;