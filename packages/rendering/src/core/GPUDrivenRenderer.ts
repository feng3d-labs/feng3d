import { computed, type Computed } from '@feng3d/reactivity';
import type {
    Camera,
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
    readonly objectsBuffer: BufferBinding;

    /**
     * 材质缓冲区绑定
     */
    readonly materialsBuffer: BufferBinding;

    /**
     * 相机缓冲区绑定
     */
    readonly cameraBuffer: BufferBinding;

    /**
     * 视锥体缓冲区绑定
     */
    readonly frustumBuffer: BufferBinding;

    /**
     * 物体计数缓冲区绑定
     */
    readonly objectCountBuffer: BufferBinding;

    /**
     * 不透明命令缓冲区
     */
    readonly opaqueCmdsBuffer: BufferBinding;

    /**
     * 不透明计数器缓冲区绑定
     */
    readonly opaqueCountersBuffer: BufferBinding;

    /**
     * 透明命令缓冲区
     */
    readonly transparentCmdsBuffer: BufferBinding;

    /**
     * 透明计数器缓冲区绑定
     */
    readonly transparentCounterBuffer: BufferBinding;

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
            value: { transform: undefined, materialId: undefined, visible: undefined, isTransparent: undefined, worldPosition: undefined, lodLevel: undefined },
        };

        // 材质缓冲区
        this.materialsBuffer = {
            bufferView: new Uint8Array(this.maxMaterials * MATERIAL_DATA_SIZE),
            value: { albedo: undefined, metallic: undefined, roughness: undefined, normalScale: undefined, occlusionStrength: undefined, emissive: undefined, type: undefined },
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
            value: { commands: undefined },
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
            value: { counters: undefined },
        };

        // 透明命令缓冲区
        this.transparentCmdsBuffer = {
            bufferView: new Uint8Array(this.maxTransparentObjects * DRAW_INDEXED_INDIRECT_SIZE),
            value: { commands: undefined },
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
     * 直接设置 bufferView 数据，WGPUBufferBinding 会根据类型信息自动处理。
     */
    setCamera(camera: Camera): void
    {
        const cameraView = new Float32Array(this.cameraBuffer.bufferView.buffer, this.cameraBuffer.bufferView.byteOffset, CAMERA_DATA_SIZE / 4);
        const frustumView = new Float32Array(this.frustumBuffer.bufferView.buffer, this.frustumBuffer.bufferView.byteOffset, FRUSTUM_DATA_SIZE / 4);

        // viewMatrix (64 bytes, 从偏移 0 开始)
        cameraView.set(camera.data.viewMatrix, 0);
        // projectionMatrix (64 bytes, 从偏移 16 开始)
        cameraView.set(camera.data.projectionMatrix, 16);

        // 视锥体 6 个平面
        for (let i = 0; i < 6; i++)
        {
            const plane = camera.frustum.planes[i];
            frustumView[i * 4 + 0] = plane[0]; // nx
            frustumView[i * 4 + 1] = plane[1]; // ny
            frustumView[i * 4 + 2] = plane[2]; // nz
            frustumView[i * 4 + 3] = plane[3]; // d
        }
    }

    /**
     * 更新物体数据
     *
     * 直接设置 bufferView 数据，WGPUBufferBinding 会根据类型信息自动处理。
     */
    setObjects(objects: readonly ObjectData[]): void
    {
        const bufferView = new Float32Array(this.objectsBuffer.bufferView.buffer, this.objectsBuffer.bufferView.byteOffset);
        const uintView = new Uint32Array(this.objectsBuffer.bufferView.buffer, this.objectsBuffer.bufferView.byteOffset);

        for (let i = 0; i < objects.length; i++)
        {
            const obj = objects[i];
            const transform = obj.transform;
            const offset = i * (OBJECT_DATA_SIZE / 4);

            // worldMatrix (64 bytes, 16 floats) - 对应着色器中的 worldMatrix
            bufferView.set(transform.modelMatrix, offset);

            // boundsCenter (12 bytes, 3 floats, 从偏移 16 开始)
            bufferView[offset + 16] = transform.worldPosition[0];
            bufferView[offset + 17] = transform.worldPosition[1];
            bufferView[offset + 18] = transform.worldPosition[2];

            // boundsRadius (4 bytes, 1 float, 从偏移 19 开始) - 设置为 1 以确保物体不被剔除
            bufferView[offset + 19] = 1.0;

            // materialId (4 bytes, 1 uint, 从偏移 20 开始)
            uintView[offset + 20] = obj.materialId;

            // isTransparent (4 bytes, 1 uint, 从偏移 21 开始)
            uintView[offset + 21] = obj.isTransparent ? 1 : 0;

            // lodLevel (4 bytes, 写入 lods[0].indexCount 位置，偏移 24)
            uintView[offset + 24] = 36; // 立方体有 36 个索引（12 个三角形 * 3）
            // lods[0].indexOffset (偏移 25)
            uintView[offset + 25] = 0;
        }

        // 更新物体计数
        (this.objectCountBuffer.bufferView as Uint32Array)[0] = objects.length;
    }

    /**
     * 更新材质数据
     *
     * 直接设置 bufferView 数据，WGPUBufferBinding 会根据类型信息自动处理。
     * 注意：着色器中的 MaterialData 结构与 types.ts 中的略有不同
     */
    setMaterials(materials: readonly Material[]): void
    {
        const bufferView = new Float32Array(this.materialsBuffer.bufferView.buffer, this.materialsBuffer.bufferView.byteOffset);
        const uintView = new Uint32Array(this.materialsBuffer.bufferView.buffer, this.materialsBuffer.bufferView.byteOffset);

        for (let i = 0; i < materials.length; i++)
        {
            const data = materials[i].data;
            const offset = i * (MATERIAL_DATA_SIZE / 4);

            // baseColor (16 bytes, 4 floats) - 对应着色器中的 baseColor
            bufferView[offset + 0] = data.albedo[0];
            bufferView[offset + 1] = data.albedo[1];
            bufferView[offset + 2] = data.albedo[2];
            bufferView[offset + 3] = data.albedo[3];

            // metallic (4 bytes, offset 4)
            bufferView[offset + 4] = data.metallic;

            // roughness (4 bytes, offset 5)
            bufferView[offset + 5] = data.roughness;

            // emissive (12 bytes, 3 floats, offset 6-8) - 着色器中是 vec3f
            bufferView[offset + 6] = data.emissive[0];
            bufferView[offset + 7] = data.emissive[1];
            bufferView[offset + 8] = data.emissive[2];

            // materialType (4 bytes, 1 uint, offset 9) - 对应着色器中的 materialType
            uintView[offset + 9] = data.type;
        }
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
    private _buildComputePass(): import('@feng3d/webgpu').ComputePass
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
