import { computed, Computed, ComputedReactivity, isRef, reactive, Ref, UnReadonly } from '@feng3d/reactivity';
import { Buffer } from '../data/Buffer';
import { BufferBinding } from '../data/BufferBinding';
import { BufferBindingInfo } from '../internal/BufferBindingInfo';
import { ChainMap } from '../utils/ChainMap';
import { ArrayInfo, StructInfo, TemplateInfo, TypeInfo } from 'wgsl_reflect';
import { ReactiveObject } from '../ReactiveObject';
import { convertToAlignedFormat } from '../utils/convertToAlignedFormat';
import { GpuUploadTask, registerUploadTask } from '../utils/GpuUploadRegistry';
// 触发 Color4 logic 注册（registerLogic 副作用；纯数据 Color4 的转换在 uniformValueToData 里）
import './color4Logic';
import { WGPUBuffer } from './WGPUBuffer';
import { uniformValueToData } from '../utils/uniformValueToData';

export class WGPUBufferBinding extends ReactiveObject
{
    get gpuBufferBinding()
    {
        return this._computedGpuBufferBinding.value;
    }

    private _computedGpuBufferBinding: Computed<GPUBufferBinding>;

    /** 关联 device（pull 上传时访问 queue） */
    private readonly _device: GPUDevice;

    /**
     * 拉取上传任务（pull 模型）。**binding 必须强引用持有**——注册表只持
     * WeakRef（不延长生命周期），无强引用的任务会被 GC，pull 永不执行。
     */
    private _uploadTask: GpuUploadTask | null = null;

    constructor(device: GPUDevice, bufferBinding: BufferBinding, type: TypeInfo)
    {
        super();
        this._device = device;

        this._onCreate(device, bufferBinding, type);
        //
        WGPUBufferBinding.map.set([device, bufferBinding, type], this);
        const uploadTask = this._uploadTask;   // updateBufferBinding 内创建

        this.destroyCall(() =>
        {
            WGPUBufferBinding.map.delete([device, bufferBinding, type]);
            uploadTask?.dispose();
            this._uploadTask = null;
        });
    }

    private _onCreate(device: GPUDevice, bufferBinding: BufferBinding, type: TypeInfo)
    {
        const r_bufferBinding = reactive(bufferBinding);

        const bufferBindingInfo = getBufferBindingInfo(type);

        // 是否存在默认值。
        const hasDefaultValue = !!bufferBinding.bufferView;

        if (!hasDefaultValue)
        {
            (bufferBinding as UnReadonly<BufferBinding>).bufferView = new Uint8Array(bufferBindingInfo.size);
        }

        // 更新缓冲区绑定的数据。
        this.updateBufferBinding(bufferBinding, hasDefaultValue, bufferBindingInfo);

        this._computedGpuBufferBinding = computed(() =>
        {
            // 监听

            r_bufferBinding?.bufferView;

            // bufferView 缺失时，原实现在下一行的 bufferView.buffer 处即抛 TypeError；断言不改该行为
            const bufferView = bufferBinding.bufferView!;
            //
            const gbuffer = Buffer.getBuffer(bufferView.buffer);

            // label 为只读属性，通过 UnReadonly 转换后写入
            const writableGbuffer = gbuffer as UnReadonly<Buffer>;

            writableGbuffer.label = gbuffer.label || (`BufferBinding ${type.name}`);
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
    private updateBufferBinding(bufferBinding: BufferBinding, hasDefaultValue: boolean, bufferBindingInfo: BufferBindingInfo)
    {
        // 构造函数在 hasDefaultValue 为假时已经补过一个 bufferView（见上面的 `if (!hasDefaultValue)`），
        // 所以进到本方法时 bufferView 必然存在
        const buffer = Buffer.getBuffer(bufferBinding.bufferView!.buffer);
        const offset = bufferBinding.bufferView!.byteOffset;

        const r_bufferBinding = reactive(bufferBinding);

        // ---- pull 模型（设计 4.3）：每 uniform 项为惰性 computed ----
        // 不再用 effect 在数据写入时推送 writeBuffers：副作用收敛到提交时点
        // （runSubmit 编码前 pullUploads 统一拉取），无变化不重算不上传
        // （版本号判定），binding 未被提交时零成本。
        interface UploadItem
        {
            readonly compute: Computed<Float32Array | Int32Array | Uint32Array | Int16Array | undefined>;
            lastVersion: number;
            /** buffer 内偏移（字节） */
            readonly bufferOffset: number;
            /** WGSL 项大小（字节） */
            readonly itemSize: number;
        }
        const uploads: UploadItem[] = [];

        for (let i = 0; i < bufferBindingInfo.items.length; i++)
        {
            const { paths, offset: itemInfoOffset, size: itemInfoSize, Cls, typeName } = bufferBindingInfo.items[i];

            // 采样：读 value 各路径（经响应式代理建立依赖）并转换为上传数据
            const compute = computed(() =>
            {
                let value: UniformValue | undefined = bufferBinding.value as UniformValue | undefined;
                let r_value = r_bufferBinding.value as UniformValue | undefined; // 监听

                // 解包 Ref/Computed：cameraUniforms 等 value 可能是响应式 Computed，
                // 读取其 .value 建立依赖，使相机变换变化时本 computed 失效。
                if (isRef(value))
                {
                    const refValue: Ref<UniformValue> = value;

                    value = refValue.value;
                    r_value = (r_value as Ref<UniformValue>).value;
                }

                if (value === undefined) return undefined;

                for (let i = 0; i < paths.length; i++)
                {
                    // value 类型上可能为 null，而原实现在 `null[paths[i]]` 处会抛 TypeError；
                    // 这里用断言保持原行为（换成可选链会把抛错变成静默返回 undefined）
                    value = value![paths[i]] as UniformValue | undefined;
                    r_value = (r_value as UniformValueNode)?.[paths[i]] as UniformValue | undefined; // 监听
                    if (value === undefined)
                    {
                        if (!hasDefaultValue)
                        {
                            console.warn(`没有找到 统一块变量属性 ${paths.join('.')} 的值！`);
                        }

                        return undefined;
                    }
                }

                let data: Float32Array | Int32Array | Uint32Array | Int16Array;

                // 值 → 上传数据的转换抽到纯函数（阶段 C-e）：纯数据矩阵（`elements`）也在其中，
                // 没有 GPUDevice 也能被单测覆盖（见 `packages/webgpu/test/uniformValueToData.spec.ts`）
                data = uniformValueToData(value, Cls);

                // 检查是否需要对齐转换（mat*x3 类型，每列 vec3 需要按 vec4 对齐）
                if (typeName)
                {
                    data = convertToAlignedFormat(data, typeName);
                }

                return data;
            });

            uploads.push({ compute, lastVersion: -1, bufferOffset: offset + itemInfoOffset, itemSize: itemInfoSize });
        }

        // 拉取任务（binding 强引用持有，注册表只持 WeakRef）：runSubmit 编码前
        // 统一读取，版本变化才上传（首读必上传：初始版本 -1 ≠ 求值后版本，
        // 覆盖原 effect 创建即跑的初始上传）
        let _gpuBufferHolder: WGPUBuffer | null = null;

        const task: GpuUploadTask = {
            pull: (): void =>
            {
                if (!bufferBinding.bufferView) return;
                _gpuBufferHolder ||= WGPUBuffer.getInstance(this._device, buffer);
                const gpuBuffer = _gpuBufferHolder.gpuBuffer;

                if (!gpuBuffer) return;

                for (const item of uploads)
                {
                    const data = item.compute.value;   // 惰性：无变化不重算

                    if (data === undefined) continue;
                    // 版本号判定（devtools 同款访问）：clean 读取不重算不重上传
                    const version = (item.compute as unknown as ComputedReactivity)._version;

                    if (version === item.lastVersion) continue;

                    item.lastVersion = version;
                    const sizeByte = Math.min(item.itemSize, data.byteLength);

                    if (sizeByte === 0) continue;

                    this._device.queue.writeBuffer(gpuBuffer, item.bufferOffset, data.buffer, data.byteOffset, sizeByte);
                }
            },
            dispose: () =>
            { /* registerUploadTask 注入反注册 */ },
        };

        registerUploadTask(this._device, task);
        this._uploadTask = task;
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
    let result = getBufferBindingInfoMap().get(type);

    if (result) return result;
    result = _getBufferBindingInfo(type);

    getBufferBindingInfoMap().set(type, result);

    return result;
}
function createBufferBindingInfoMap()
{
    return new Map<TypeInfo, BufferBindingInfo>();
}

let bufferBindingInfoMap: ReturnType<typeof createBufferBindingInfoMap> | null = null;

/** 取 getBufferBindingInfoMap() 缓存（首次使用时创建；R2 零模块级副作用，issue #88） */
function getBufferBindingInfoMap(): ReturnType<typeof createBufferBindingInfoMap>
{
    if (!bufferBindingInfoMap)
    {
        bufferBindingInfoMap = createBufferBindingInfoMap();
    }

    return bufferBindingInfoMap;
}

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

            // 跳过 WGSL 显式填充字段（_pad 开头）：仅占位用，无对应 JS 数据
            if (memberInfo.name.startsWith('_pad')) continue;

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
            Cls: getTemplateDataCls(templateFormatName),
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

function getTemplateDataCls(templateFormatName: string | undefined)
{
    const dataCls = templateFormatName ? templateFormatDataCls[templateFormatName] : undefined;

    console.assert(!!dataCls, `templateFormatName必须为以下值 ${Object.keys(templateFormatDataCls)}`);

    return dataCls!;
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

/**
 * 统一块变量值在路径访问过程中可能出现的类型。
 *
 * 支持数值容器（TypedArray、number[]）、数值标量，以及可通过字符串/数字索引继续下钻的对象与数组。
 * `unknown` 用于放宽叶子节点（如 Color4、Vector3 等自带 toArray 的容器）以兼容外部数据结构。
 */
type UniformValueNode = number | string | boolean | Uint8Array
    | Int8Array
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
    | Float32Array
    | Float64Array
    | bigint
    | { [key: string]: UniformValue | undefined }
    | { [index: number]: UniformValue | undefined }
    | unknown;

type UniformValue = UniformValueNode | undefined;