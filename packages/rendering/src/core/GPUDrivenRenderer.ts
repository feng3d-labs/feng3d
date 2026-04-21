import { reactive, computed, type Computed } from '@feng3d/reactivity';
import {
    Camera,
    Material,
    ObjectData,
    GPUDrivenRendererOptions,
    OBJECT_DATA_SIZE,
    MATERIAL_DATA_SIZE,
    CAMERA_DATA_SIZE,
    FRUSTUM_DATA_SIZE,
    DRAW_INDEXED_INDIRECT_SIZE,
} from './types.js';
import {
    serializeCameraData,
    serializeFrustumData,
    serializeObjectTransform,
    serializeMaterialData,
} from './serialization.js';
import type {
    Submit,
    Buffer as WGPUBufferInterface,
    RenderPipeline,
    RenderPass,
    RenderPassColorAttachment,
    RenderPassDepthStencilAttachment,
    RenderObject,
    DrawIndexedIndirect,
} from '@feng3d/webgpu';
import { WGPUBuffer } from '@feng3d/webgpu';
import { code as commandGeneratorShaderCode } from '../compute/CommandGenerator.wgsl.js';

// 导入着色器内容
const COMMAND_GENERATOR_SHADER = commandGeneratorShaderCode;

/**
 * GPU驱动渲染器状态
 */
interface GPUDrivenRendererState
{
    /** 相机数据 */
    camera: Camera | null;
    /** 物体数据列表 */
    objects: readonly ObjectData[];
    /** 材质数据列表 */
    materials: readonly Material[];
    /** 渲染管线 */
    renderPipeline: RenderPipeline | null;
    /** 颜色附件 */
    colorAttachment: RenderPassColorAttachment | null;
    /** 深度模板附件 */
    depthStencilAttachment: RenderPassDepthStencilAttachment | null;
}

/**
 * GPU驱动渲染器
 *
 * 使用声明式 Buffer 接口，通过 @feng3d/webgpu 的 WGPUBuffer 自动管理资源。
 * 数据变化时，Submit 结构自动响应更新。
 */
export class GPUDrivenRenderer
{
    /**
     * GPU 设备（用于创建 WGPUBuffer）
     */
    private readonly device: GPUDevice;

    /**
     * GPU 队列
     */
    private readonly queue: GPUQueue;

    /**
     * 渲染器配置
     */
    readonly options: Readonly<GPUDrivenRendererOptions>;

    // ==================== 声明式 Buffer 接口 ====================

    /**
     * 物体缓冲区描述（声明式）
     */
    private readonly objectBufferDesc: WGPUBufferInterface;

    /**
     * 材质缓冲区描述（声明式）
     */
    private readonly materialBufferDesc: WGPUBufferInterface;

    /**
     * 相机缓冲区描述（声明式）
     */
    private readonly cameraBufferDesc: WGPUBufferInterface;

    /**
     * 视锥体缓冲区描述（声明式）
     */
    private readonly frustumBufferDesc: WGPUBufferInterface;

    /**
     * 物体计数缓冲区描述（声明式）
     */
    private readonly objectCountBufferDesc: WGPUBufferInterface;

    /**
     * 间接绘制缓冲区描述数组（声明式）
     */
    private readonly indirectBufferDescs: WGPUBufferInterface[];

    // ==================== WGPUBuffer 实例（由 @feng3d/webgpu 管理） ====================

    /**
     * 物体缓冲区
     */
    readonly objectBuffer: WGPUBuffer;

    /**
     * 材质缓冲区
     */
    readonly materialBuffer: WGPUBuffer;

    /**
     * 相机缓冲区
     */
    readonly cameraBuffer: WGPUBuffer;

    /**
     * 视锥体缓冲区
     */
    readonly frustumBuffer: WGPUBuffer;

    /**
     * 物体计数缓冲区
     */
    readonly objectCountBuffer: WGPUBuffer;

    /**
     * 间接绘制缓冲区数组
     */
    readonly indirectBuffers: WGPUBuffer[];

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
     * 每个材质的最大绘制命令数
     */
    readonly maxDrawsPerMaterial: number;

    /**
     * 响应式状态
     */
    private readonly state: GPUDrivenRendererState;

    /**
     * 计算属性：Submit 结构
     */
    readonly submit: Computed<Submit>;

    /**
     * 调试模式
     */
    readonly debug: boolean;

    constructor(device: GPUDevice, options: GPUDrivenRendererOptions = {})
    {
        this.device = device;
        this.queue = device.queue;
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
        this.maxDrawsPerMaterial = Math.ceil(this.options.maxObjects / this.options.maxMaterials);

        // 创建响应式状态
        this.state = reactive<GPUDrivenRendererState>({
            camera: null,
            objects: [],
            materials: [],
            renderPipeline: null,
            colorAttachment: null,
            depthStencilAttachment: null,
        });

        // 创建声明式 Buffer 接口
        this.objectBufferDesc = {
            label: `${this.options.label}-ObjectBuffer`,
            size: this.options.maxObjects * OBJECT_DATA_SIZE,
        };

        this.materialBufferDesc = {
            label: `${this.options.label}-MaterialBuffer`,
            size: this.options.maxMaterials * MATERIAL_DATA_SIZE,
        };

        this.cameraBufferDesc = {
            label: `${this.options.label}-CameraBuffer`,
            size: CAMERA_DATA_SIZE,
        };

        this.frustumBufferDesc = {
            label: `${this.options.label}-FrustumBuffer`,
            size: FRUSTUM_DATA_SIZE,
        };

        this.objectCountBufferDesc = {
            label: `${this.options.label}-ObjectCountBuffer`,
            size: 4,
        };

        // 创建间接绘制缓冲区描述
        this.indirectBufferDescs = [];
        for (let i = 0; i < this.maxMaterials; i++)
        {
            this.indirectBufferDescs.push({
                label: `${this.options.label}-IndirectBuffer-opaque-${i}`,
                size: this.maxDrawsPerMaterial * DRAW_INDEXED_INDIRECT_SIZE,
            });
        }
        this.indirectBufferDescs.push({
            label: `${this.options.label}-IndirectBuffer-transparent`,
            size: this.maxTransparentObjects * DRAW_INDEXED_INDIRECT_SIZE,
        });

        // 使用 WGPUBuffer 包装（由 @feng3d/webgpu 管理实际 GPU 资源）
        this.objectBuffer = new WGPUBuffer(this.device, reactive(this.objectBufferDesc));
        this.materialBuffer = new WGPUBuffer(this.device, reactive(this.materialBufferDesc));
        this.cameraBuffer = new WGPUBuffer(this.device, reactive(this.cameraBufferDesc));
        this.frustumBuffer = new WGPUBuffer(this.device, reactive(this.frustumBufferDesc));
        this.objectCountBuffer = new WGPUBuffer(this.device, reactive(this.objectCountBufferDesc));

        this.indirectBuffers = this.indirectBufferDescs.map(desc =>
            new WGPUBuffer(this.device, reactive(desc)),
        );

        // 创建计算属性：自动响应状态变化的 Submit
        this.submit = computed(() => this._buildSubmit());

        // 监听状态变化，自动更新 Buffer 数据
        this._setupWatchers();

        if (this.debug)
        {
            console.info('[GPUDrivenRenderer] Initialized with options:', this.options);
        }
    }

    /**
     * 更新相机数据
     */
    setCamera(camera: Camera): void
    {
        this.state.camera = camera;
    }

    /**
     * 更新物体数据
     */
    setObjects(objects: readonly ObjectData[]): void
    {
        this.state.objects = objects;
    }

    /**
     * 更新材质数据
     */
    setMaterials(materials: readonly Material[]): void
    {
        this.state.materials = materials;
    }

    /**
     * 设置渲染管线
     */
    setRenderPipeline(pipeline: RenderPipeline): void
    {
        this.state.renderPipeline = pipeline;
    }

    /**
     * 设置颜色附件
     */
    setColorAttachment(attachment: RenderPassColorAttachment): void
    {
        this.state.colorAttachment = attachment;
    }

    /**
     * 设置深度模板附件
     */
    setDepthStencilAttachment(attachment: RenderPassDepthStencilAttachment): void
    {
        this.state.depthStencilAttachment = attachment;
    }

    /**
     * 设置监听器，自动更新 Buffer 数据
     *
     * 使用响应式系统，当输入数据变化时自动序列化并更新 GPU Buffer。
     */
    private _setupWatchers(): void
    {
        // 监听相机变化 - 自动序列化
        computed(() => {
            const camera = this.state.camera;
            if (camera)
            {
                // 响应式自动序列化相机数据
                (this.cameraBufferDesc as any).data = serializeCameraData(camera.data);
                // 响应式自动序列化视锥体数据
                (this.frustumBufferDesc as any).data = serializeFrustumData(camera.frustum);
            }
        });

        // 监听物体变化 - 自动序列化
        computed(() => {
            const objects = this.state.objects;
            const data = new ArrayBuffer(objects.length * OBJECT_DATA_SIZE);
            const view = new Uint8Array(data);
            for (let i = 0; i < objects.length; i++)
            {
                // 响应式自动序列化物体变换数据
                const objectData = serializeObjectTransform(objects[i].transform);
                // 写入材质ID到偏移 19 处（4字节）
                const materialIdView = new Uint32Array(objectData, 19 * 4, 1);
                materialIdView[0] = objects[i].materialId;
                // 合并到缓冲区
                view.set(new Uint8Array(objectData), i * OBJECT_DATA_SIZE);
            }
            // 更新物体缓冲区数据
            (this.objectBufferDesc as any).data = data;
            // 更新物体计数
            (this.objectCountBufferDesc as any).data = new Uint32Array([objects.length]);
        });

        // 监听材质变化 - 自动序列化
        computed(() => {
            const materials = this.state.materials;
            const data = new ArrayBuffer(materials.length * MATERIAL_DATA_SIZE);
            const view = new Uint8Array(data);
            for (let i = 0; i < materials.length; i++)
            {
                // 响应式自动序列化材质数据
                const materialData = serializeMaterialData(materials[i].data);
                view.set(new Uint8Array(materialData), i * MATERIAL_DATA_SIZE);
            }
            // 更新材质缓冲区数据
            (this.materialBufferDesc as any).data = data;
        });
    }

    /**
     * 构建 Submit 结构
     */
    private _buildSubmit(): Submit
    {
        const pipeline = this.state.renderPipeline;
        const colorAttachment = this.state.colorAttachment;
        const depthStencilAttachment = this.state.depthStencilAttachment;

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
                        objectBuffer: this.objectBuffer.gpuBuffer,
                        materialBuffer: this.materialBuffer.gpuBuffer,
                        cameraBuffer: this.cameraBuffer.gpuBuffer,
                        frustumBuffer: this.frustumBuffer.gpuBuffer,
                        objectCountBuffer: this.objectCountBuffer.gpuBuffer,
                        opaqueCommandBuffer: this.indirectBuffers[0].gpuBuffer,
                        opaqueCounter: this.indirectBuffers[this.maxMaterials].gpuBuffer,
                        transparentCommandBuffer: this.indirectBuffers[this.maxMaterials * 2].gpuBuffer,
                        transparentCounter: this.indirectBuffers[this.maxMaterials * 2 + 1].gpuBuffer,
                    },
                    workgroups: {
                        workgroupCountX: Math.ceil((this.state.objects.length || 0) / 64),
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
     */
    private _buildRenderObjects(pipeline: RenderPipeline): RenderObject[]
    {
        const objects: RenderObject[] = [];

        // 不透明物体（按材质分组）
        for (let i = 0; i < this.maxMaterials; i++)
        {
            const indirectDraw: DrawIndexedIndirect = {
                __type__: 'DrawIndexedIndirect',
                buffer: this.indirectBuffers[i].gpuBuffer,
                offset: 0,
            };
            objects.push({
                __type__: 'RenderObject',
                pipeline,
                draw: indirectDraw,
            });
        }

        // 透明物体
        const transparentDraw: DrawIndexedIndirect = {
            __type__: 'DrawIndexedIndirect',
            buffer: this.indirectBuffers[this.maxMaterials].gpuBuffer,
            offset: 0,
        };
        objects.push({
            __type__: 'RenderObject',
            pipeline,
            draw: transparentDraw,
        });

        return objects;
    }

    /**
     * 销毁渲染器
     */
    destroy(): void
    {
        this.objectBuffer.destroy();
        this.materialBuffer.destroy();
        this.cameraBuffer.destroy();
        this.frustumBuffer.destroy();
        this.objectCountBuffer.destroy();
        for (const buffer of this.indirectBuffers)
        {
            buffer.destroy();
        }
    }
}
