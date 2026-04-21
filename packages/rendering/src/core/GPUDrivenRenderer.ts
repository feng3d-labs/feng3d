import { computed, reactive, type Computed } from '@feng3d/reactivity';
import type {
    Camera,
    CameraData,
    DrawIndexedIndirect as DrawIndexedIndirectData,
    Material,
    ObjectData,
    GPUDrivenRendererOptions,
} from './types.js';
import {
    OBJECT_DATA_SIZE,
    MATERIAL_DATA_SIZE,
    CAMERA_DATA_SIZE,
    FRUSTUM_DATA_SIZE,
    DRAW_INDEXED_INDIRECT_SIZE,
} from './types.js';
import type {
    Submit,
    Buffer,
    BufferBinding,
    RenderPipeline,
    RenderPass,
    RenderPassColorAttachment,
    RenderPassDepthStencilAttachment,
    RenderObject,
    DrawIndexedIndirect,
    VertexAttributes,
    IndicesDataTypes,
    ComputePass,
} from '@feng3d/webgpu';
import { Buffer as BufferClass } from '@feng3d/webgpu';
import { code as commandGeneratorShaderCode } from '../compute/CommandGenerator.wgsl.js';

// 导入着色器内容
const COMMAND_GENERATOR_SHADER = commandGeneratorShaderCode;

/**
 * GPU驱动渲染器
 *
 * 使用声明式 BufferBinding 接口，@feng3d/webgpu 自动管理 GPU 资源生命周期。
 * 数据变化时，通过 reactive 更新数据，Submit 结构自动响应更新。
 */
export class GPUDrivenRenderer
{
    /**
     * 渲染器配置
     */
    readonly options: Readonly<GPUDrivenRendererOptions>;

    // ==================== BufferBinding ====================

    /**
     * 物体缓冲区绑定
     */
    readonly objectsBuffer: BufferBinding<readonly ObjectData[]>;

    /**
     * 材质缓冲区绑定
     */
    readonly materialsBuffer: BufferBinding<readonly Material[]>;

    /**
     * 相机缓冲区绑定
     */
    readonly cameraBuffer: BufferBinding<CameraData>;

    /**
     * 视锥体缓冲区绑定
     */
    readonly frustumBuffer: BufferBinding<{ planes: readonly (readonly number[])[] }>;

    /**
     * 物体计数缓冲区绑定
     */
    readonly objectCountBuffer: BufferBinding<{ count: number }>;

    /**
     * 不透明命令缓冲区
     */
    readonly opaqueCmdsBuffer: BufferBinding<readonly DrawIndexedIndirectData[]>;

    /**
     * 不透明计数器缓冲区绑定
     */
    readonly opaqueCountersBuffer: BufferBinding<readonly number[]>;

    /**
     * 透明命令缓冲区
     */
    readonly transparentCmdsBuffer: BufferBinding<readonly DrawIndexedIndirectData[]>;

    /**
     * 透明计数器缓冲区绑定
     */
    readonly transparentCounterBuffer: BufferBinding<{ count: number }>;

    // ==================== 其他状态 ====================

    /**
     * 最大材质数量
     */
    readonly maxMaterials: number;

    /**
     * 最大透明物体数量
     */
    readonly maxTransparentObjects: number;

    /**
     * 最大不透明物体数量
     */
    readonly maxOpaqueObjects: number;

    /**
     * 渲染管线
     */
    private _renderPipeline: RenderPipeline | null = null;

    /**
     * 颜色附件
     */
    private _colorAttachment: RenderPassColorAttachment | null = null;

    /**
     * 深度模板附件
     */
    private _depthStencilAttachment: RenderPassDepthStencilAttachment | null = null;

    /**
     * 顶点属性数据
     */
    private _vertices: VertexAttributes | null = null;

    /**
     * 索引数据
     */
    private _indices: IndicesDataTypes | null = null;

    /**
     * 绑定资源
     */
    private _bindingResources: Record<string, unknown> | null = null;

    /**
     * 计算属性：Submit 结构
     */
    readonly submit: Computed<Submit>;

    /**
     * 调试模式
     */
    readonly debug: boolean;

    constructor(options: GPUDrivenRendererOptions = {})
    {
        this.debug = options.debug ?? false;

        // 默认配置
        const defaultOptions: Required<GPUDrivenRendererOptions> = {
            maxObjects: 10000,
            maxMaterials: 128,
            maxTransparentObjects: 1000,
            maxLODLevels: 4,
            useMultiDraw: true,
            debug: false,
            label: 'GPUDrivenRenderer',
        };

        this.options = { ...defaultOptions, ...options };
        this.maxMaterials = this.options.maxMaterials;
        this.maxTransparentObjects = this.options.maxTransparentObjects;
        // 确保 maxOpaqueObjects 至少为 maxObjects 的一半，或者由 maxTransparentObjects 限制
        const maxAllowedTransparent = Math.floor(this.options.maxObjects / 2);
        const actualTransparentObjects = Math.min(this.maxTransparentObjects, maxAllowedTransparent);
        this.maxOpaqueObjects = this.options.maxObjects - actualTransparentObjects;
        this.maxTransparentObjects = actualTransparentObjects;

        // 创建 BufferBinding
        // 物体缓冲区
        this.objectsBuffer = {
            bufferView: new Uint8Array(this.options.maxObjects * OBJECT_DATA_SIZE),
        };

        // 材质缓冲区
        this.materialsBuffer = {
            bufferView: new Uint8Array(this.maxMaterials * MATERIAL_DATA_SIZE),
        };

        // 相机缓冲区
        this.cameraBuffer = {
            bufferView: new Uint8Array(CAMERA_DATA_SIZE),
            value: { viewMatrix: undefined, projectionMatrix: undefined },
        };

        // 视锥体缓冲区
        this.frustumBuffer = {
            bufferView: new Uint8Array(FRUSTUM_DATA_SIZE),
            value: { planes: undefined },
        };

        // 物体计数缓冲区
        this.objectCountBuffer = {
            bufferView: new Uint32Array(1),
            value: { count: undefined },
        };

        // 不透明命令缓冲区
        this.opaqueCmdsBuffer = {
            bufferView: new Uint8Array(this.maxOpaqueObjects * DRAW_INDEXED_INDIRECT_SIZE),
        };
        if (this.debug)
        {
            console.info('[GPUDrivenRenderer] Buffer sizes:', {
                maxOpaqueObjects: this.maxOpaqueObjects,
                maxTransparentObjects: this.maxTransparentObjects,
                opaqueCmdsSize: this.maxOpaqueObjects * DRAW_INDEXED_INDIRECT_SIZE,
                transparentCmdsSize: this.maxTransparentObjects * DRAW_INDEXED_INDIRECT_SIZE,
            });
        }

        // 不透明计数器缓冲区
        this.opaqueCountersBuffer = {
            bufferView: new Uint32Array(this.maxMaterials),
        };

        // 透明命令缓冲区
        this.transparentCmdsBuffer = {
            bufferView: new Uint8Array(this.maxTransparentObjects * DRAW_INDEXED_INDIRECT_SIZE),
        };

        // 透明计数器缓冲区
        this.transparentCounterBuffer = {
            bufferView: new Uint32Array(1),
            value: { count: undefined },
        };

        // 创建计算属性：自动响应状态变化的 Submit
        this.submit = computed(() => this._buildSubmit());

        if (this.debug)
        {
            console.info('[GPUDrivenRenderer] Initialized with options:', this.options);
        }
    }

    /**
     * 更新相机数据
     *
     * 使用 value 更新数据，引擎自动处理与着色器的映射。
     */
    setCamera(camera: Camera): void
    {
        // 通过响应式系统更新 value
        reactive(this.cameraBuffer).value = camera.data;
        reactive(this.frustumBuffer).value = camera.frustum;
    }

    /**
     * 更新物体数据
     *
     * 使用 value 更新数据，引擎自动处理与着色器的映射。
     */
    setObjects(objects: readonly ObjectData[]): void
    {
        // 创建序列化后的数据数组
        const data = new Float32Array(this.options.maxObjects * OBJECT_DATA_SIZE / 4);
        const uintView = new Uint32Array(data.buffer);

        for (let i = 0; i < objects.length; i++)
        {
            const obj = objects[i];
            const transform = obj.transform;
            const offset = i * (OBJECT_DATA_SIZE / 4);

            // worldMatrix (64 bytes, 16 floats)
            data.set(transform.modelMatrix, offset);

            // boundsCenter (12 bytes, 3 floats, 从偏移 16 开始)
            data[offset + 16] = transform.worldPosition[0];
            data[offset + 17] = transform.worldPosition[1];
            data[offset + 18] = transform.worldPosition[2];

            // boundsRadius (4 bytes, 1 float, 从偏移 19 开始)
            data[offset + 19] = 1.0;

            // materialId (4 bytes, 1 uint, 从偏移 20 开始)
            uintView[offset + 20] = obj.materialId;

            // isTransparent (4 bytes, 1 uint, 从偏移 21 开始)
            uintView[offset + 21] = obj.isTransparent ? 1 : 0;

            // lodLevel (4 bytes, 写入 lods[0].indexCount 位置，偏移 24)
            uintView[offset + 24] = 36;
            // lods[0].indexOffset (偏移 25)
            uintView[offset + 25] = 0;
        }

        // 通过响应式系统更新 value
        reactive(this.objectsBuffer).value = data as any;

        // 更新物体计数
        reactive(this.objectCountBuffer).value = { count: objects.length };
    }

    /**
     * 更新材质数据
     *
     * 使用 value 更新数据，引擎自动处理与着色器的映射。
     */
    setMaterials(materials: readonly Material[]): void
    {
        // 创建序列化后的数据数组
        const data = new Float32Array(this.maxMaterials * MATERIAL_DATA_SIZE / 4);
        const uintView = new Uint32Array(data.buffer);

        for (let i = 0; i < materials.length; i++)
        {
            const materialData = materials[i].data;
            const offset = i * (MATERIAL_DATA_SIZE / 4);

            // baseColor (16 bytes, 4 floats)
            data[offset + 0] = materialData.albedo[0];
            data[offset + 1] = materialData.albedo[1];
            data[offset + 2] = materialData.albedo[2];
            data[offset + 3] = materialData.albedo[3];

            // metallic (4 bytes, offset 4)
            data[offset + 4] = materialData.metallic;

            // roughness (4 bytes, offset 5)
            data[offset + 5] = materialData.roughness;

            // emissive (12 bytes, 3 floats, offset 6-8)
            data[offset + 6] = materialData.emissive[0];
            data[offset + 7] = materialData.emissive[1];
            data[offset + 8] = materialData.emissive[2];

            // materialType (4 bytes, 1 uint, offset 9)
            uintView[offset + 9] = materialData.type ?? 0;
        }

        // 通过响应式系统更新 value
        reactive(this.materialsBuffer).value = data as any;
    }

    /**
     * 设置顶点数据
     */
    setVertices(vertices: VertexAttributes): void
    {
        this._vertices = vertices;
    }

    /**
     * 设置索引数据
     */
    setIndices(indices: IndicesDataTypes): void
    {
        this._indices = indices;
    }

    /**
     * 设置绑定资源
     */
    setBindingResources(resources: Record<string, unknown>): void
    {
        this._bindingResources = resources;
    }

    /**
     * 设置渲染管线
     */
    setRenderPipeline(pipeline: RenderPipeline): void
    {
        this._renderPipeline = pipeline;
    }

    /**
     * 设置颜色附件
     */
    setColorAttachment(attachment: RenderPassColorAttachment): void
    {
        this._colorAttachment = attachment;
    }

    /**
     * 设置深度模板附件
     */
    setDepthStencilAttachment(attachment: RenderPassDepthStencilAttachment): void
    {
        this._depthStencilAttachment = attachment;
    }

    /**
     * 构建 Submit 结构
     */
    private _buildSubmit(): Submit
    {
        const pipeline = this._renderPipeline;
        const colorAttachment = this._colorAttachment;
        const depthStencilAttachment = this._depthStencilAttachment;

        // 访问 bufferView 以建立响应式依赖
        this.objectsBuffer.bufferView;
        this.materialsBuffer.bufferView;
        this.cameraBuffer.bufferView;
        this.frustumBuffer.bufferView;
        this.objectCountBuffer.bufferView;
        this.opaqueCountersBuffer.bufferView;
        this.transparentCounterBuffer.bufferView;

        if (!pipeline || !colorAttachment || !depthStencilAttachment)
        {
            return { commandEncoders: [] };
        }

        return {
            commandEncoders: [
                {
                    passEncoders: [
                        this._buildComputePass(),
                        this._buildRenderPass(pipeline, colorAttachment, depthStencilAttachment),
                    ],
                },
            ],
        };
    }

    /**
     * 构建计算着色器通道
     */
    private _buildComputePass(): ComputePass
    {
        return {
            __type__: 'ComputePass',
            computeObjects: [
                {
                    pipeline: {
                        compute: {
                            code: COMMAND_GENERATOR_SHADER,
                            entryPoint: 'main',
                        },
                    },
                    bindingResources: {
                        // 输入资源（名称必须与着色器中的变量名一致）
                        objects: this.objectsBuffer,
                        materials: this.materialsBuffer,
                        camera: this.cameraBuffer,
                        frustum: this.frustumBuffer,
                        objectCount: this.objectCountBuffer,
                        // 输出资源
                        opaqueCmds: this.opaqueCmdsBuffer,
                        opaqueCounters: this.opaqueCountersBuffer,
                        transparentCmds: this.transparentCmdsBuffer,
                        transparentCounter: this.transparentCounterBuffer,
                    },
                    workgroups: {
                        workgroupCountX: Math.ceil((this.objectCountBuffer.bufferView as Uint32Array)[0] / 64),
                        workgroupCountY: 1,
                        workgroupCountZ: 1,
                    },
                },
            ],
        };
    }

    /**
     * 构建渲染通道
     */
    private _buildRenderPass(
        pipeline: RenderPipeline,
        colorAttachment: RenderPassColorAttachment,
        depthStencilAttachment: RenderPassDepthStencilAttachment,
    ): RenderPass
    {
        return {
            __type__: 'RenderPass',
            descriptor: {
                colorAttachments: [
                    {
                        ...colorAttachment,
                        loadOp: 'clear',
                        storeOp: 'store',
                        clearValue: [0, 0, 0, 1],
                    },
                ],
                depthStencilAttachment,
            },
            renderPassObjects: this._buildRenderObjects(pipeline),
        };
    }

    /**
     * 构建渲染对象列表
     *
     * 使用计算着色器生成的间接绘制命令来绘制对象。
     */
    private _buildRenderObjects(pipeline: RenderPipeline): RenderObject[]
    {
        const objects: RenderObject[] = [];

        // 合并 bindingResources：将 objects 缓冲区和用户提供的 bindingResources 合并
        const bindingResources = {
            objects: this.objectsBuffer,
            ...this._bindingResources,
        };

        // 从 BufferBinding 创建 Buffer 对象用于间接绘制
        const opaqueBuffer: Buffer = BufferClass.getBuffer(this.opaqueCmdsBuffer.bufferView.buffer);
        const transparentBuffer: Buffer = BufferClass.getBuffer(this.transparentCmdsBuffer.bufferView.buffer);

        // 不透明物体 - 使用计算着色器生成的命令
        const opaqueDraw: DrawIndexedIndirect = {
            __type__: 'DrawIndexedIndirect',
            buffer: opaqueBuffer,
            offset: 0,
        };
        objects.push({
            __type__: 'RenderObject',
            pipeline,
            vertices: this._vertices ?? undefined,
            indices: this._indices ?? undefined,
            bindingResources,
            draw: opaqueDraw,
        });

        // 透明物体 - 使用计算着色器生成的命令
        const transparentDraw: DrawIndexedIndirect = {
            __type__: 'DrawIndexedIndirect',
            buffer: transparentBuffer,
            offset: 0,
        };
        objects.push({
            __type__: 'RenderObject',
            pipeline,
            vertices: this._vertices ?? undefined,
            indices: this._indices ?? undefined,
            bindingResources,
            draw: transparentDraw,
        });

        return objects;
    }
}
