import { reactive, computed, type Computed } from '@feng3d/reactivity';
import type { Camera, Material, ObjectData, GPUDrivenRendererOptions } from './types.js';
import type {
    Submit,
    Buffer as WGPUBufferInterface,
    RenderPipeline,
    RenderPass,
    RenderPassColorAttachment,
    RenderPassDepthStencilAttachment,
    RenderObject,
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
            size: this.options.maxObjects * 128, // STRIDE = 128
        };

        this.materialBufferDesc = {
            label: `${this.options.label}-MaterialBuffer`,
            size: this.options.maxMaterials * 48, // STRIDE = 48
        };

        this.cameraBufferDesc = {
            label: `${this.options.label}-CameraBuffer`,
            size: 144,
        };

        this.frustumBufferDesc = {
            label: `${this.options.label}-FrustumBuffer`,
            size: 96,
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
                size: this.maxDrawsPerMaterial * 20, // DRAW_INDEXED_INDIRECT_SIZE = 20
            });
        }
        this.indirectBufferDescs.push({
            label: `${this.options.label}-IndirectBuffer-transparent`,
            size: this.maxTransparentObjects * 20,
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
     */
    private _setupWatchers(): void
    {
        // 监听相机变化
        computed(() => {
            const camera = this.state.camera;
            if (camera)
            {
                // 更新相机缓冲区数据
                (this.cameraBufferDesc as any).data = this.serializeCamera(camera);
                // 更新视锥体数据
                (this.frustumBufferDesc as any).data = this.extractFrustumPlanes(camera);
            }
        });

        // 监听物体变化
        computed(() => {
            const objects = this.state.objects;
            // 序列化物体数据
            const data = this.serializeObjects(objects);
            // 更新物体缓冲区数据
            (this.objectBufferDesc as any).data = data;
            // 更新物体计数
            (this.objectCountBufferDesc as any).data = new Uint32Array([objects.length]);
        });

        // 监听材质变化
        computed(() => {
            const materials = this.state.materials;
            // 序列化材质数据
            const data = this.serializeMaterials(materials);
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
            objects.push({
                __type__: 'RenderObject',
                pipeline,
                draw: {
                    __type__: 'DrawIndexedIndirect',
                    buffer: this.indirectBuffers[i].gpuBuffer,
                    offset: 0,
                } as any, // TODO: 等待 @feng3d/webgpu 添加间接绘制类型
            });
        }

        // 透明物体
        objects.push({
            __type__: 'RenderObject',
            pipeline,
            draw: {
                __type__: 'DrawIndexedIndirect',
                buffer: this.indirectBuffers[this.maxMaterials].gpuBuffer,
                offset: 0,
            } as any, // TODO: 等待 @feng3d/webgpu 添加间接绘制类型
        });

        return objects;
    }

    /**
     * 序列化物体数据
     */
    private serializeObjects(objects: readonly ObjectData[]): ArrayBuffer
    {
        const STRIDE = 128;
        const buffer = new ArrayBuffer(objects.length * STRIDE);
        const view = new DataView(buffer);
        const float32 = new Float32Array(buffer);
        const uint32 = new Uint32Array(buffer);

        for (let i = 0; i < objects.length; i++)
        {
            const obj = objects[i];
            const offset = i * STRIDE;

            // worldMatrix (16 floats)
            for (let j = 0; j < 16; j++)
            {
                float32[offset / 4 + j] = obj.worldMatrix[j] ?? 0;
            }

            // boundsCenter (3 floats)
            view.setFloat32(offset + 64, obj.boundsCenter[0], true);
            view.setFloat32(offset + 68, obj.boundsCenter[1], true);
            view.setFloat32(offset + 72, obj.boundsCenter[2], true);

            // boundsRadius (1 float)
            view.setFloat32(offset + 76, obj.boundsRadius, true);

            // materialId (1 uint)
            uint32[offset / 4 + 20] = obj.materialId;

            // isTransparent (1 uint)
            uint32[offset / 4 + 21] = obj.isTransparent ? 1 : 0;

            // LODs (4 levels)
            for (let j = 0; j < 4; j++)
            {
                const lod = obj.lods[j] || { indexCount: 0, indexOffset: 0 };
                uint32[offset / 4 + 24 + j * 2] = lod.indexCount;
                uint32[offset / 4 + 25 + j * 2] = lod.indexOffset;
            }
        }

        return buffer;
    }

    /**
     * 序列化材质数据
     */
    private serializeMaterials(materials: readonly Material[]): ArrayBuffer
    {
        const STRIDE = 48;
        const buffer = new ArrayBuffer(materials.length * STRIDE);
        const view = new DataView(buffer);

        for (let i = 0; i < materials.length; i++)
        {
            const mat = materials[i];
            const offset = i * STRIDE;

            // baseColor (4 floats)
            view.setFloat32(offset, mat.baseColor[0], true);
            view.setFloat32(offset + 4, mat.baseColor[1], true);
            view.setFloat32(offset + 8, mat.baseColor[2], true);
            view.setFloat32(offset + 12, mat.baseColor[3], true);

            // metallic (1 float)
            view.setFloat32(offset + 16, mat.metallic, true);

            // roughness (1 float)
            view.setFloat32(offset + 20, mat.roughness, true);

            // emissive (3 floats)
            view.setFloat32(offset + 24, mat.emissive[0], true);
            view.setFloat32(offset + 28, mat.emissive[1], true);
            view.setFloat32(offset + 32, mat.emissive[2], true);

            // type (1 uint)
            new Uint32Array(buffer, offset + 36, 1)[0] = mat.type;
        }

        return buffer;
    }

    /**
     * 从相机矩阵提取视锥体平面
     */
    private extractFrustumPlanes(camera: Camera): Float32Array
    {
        const viewProj = camera.viewProjectionMatrix as number[];
        const planes = new Float32Array(24);

        planes[0] = viewProj[3] + viewProj[0];
        planes[1] = viewProj[7] + viewProj[4];
        planes[2] = viewProj[11] + viewProj[8];
        planes[3] = viewProj[15] + viewProj[12];

        planes[4] = viewProj[3] - viewProj[0];
        planes[5] = viewProj[7] - viewProj[4];
        planes[6] = viewProj[11] - viewProj[8];
        planes[7] = viewProj[15] - viewProj[12];

        planes[8] = viewProj[3] - viewProj[1];
        planes[9] = viewProj[7] - viewProj[5];
        planes[10] = viewProj[11] - viewProj[9];
        planes[11] = viewProj[15] - viewProj[13];

        planes[12] = viewProj[3] + viewProj[1];
        planes[13] = viewProj[7] + viewProj[5];
        planes[14] = viewProj[11] + viewProj[9];
        planes[15] = viewProj[15] + viewProj[13];

        planes[16] = viewProj[3] + viewProj[2];
        planes[17] = viewProj[7] + viewProj[6];
        planes[18] = viewProj[11] + viewProj[10];
        planes[19] = viewProj[15] + viewProj[14];

        planes[20] = viewProj[3] - viewProj[2];
        planes[21] = viewProj[7] - viewProj[6];
        planes[22] = viewProj[11] - viewProj[10];
        planes[23] = viewProj[15] - viewProj[14];

        for (let i = 0; i < 6; i++)
        {
            const offset = i * 4;
            const len = Math.sqrt(
                planes[offset] ** 2 +
                planes[offset + 1] ** 2 +
                planes[offset + 2] ** 2,
            );
            planes[offset] /= len;
            planes[offset + 1] /= len;
            planes[offset + 2] /= len;
            planes[offset + 3] /= len;
        }

        return planes;
    }

    /**
     * 序列化相机数据
     */
    private serializeCamera(camera: Camera): ArrayBuffer
    {
        const buffer = new ArrayBuffer(144);
        const float32 = new Float32Array(buffer);

        for (let i = 0; i < 16; i++)
        {
            float32[i] = camera.viewMatrix[i] ?? 0;
        }

        for (let i = 0; i < 16; i++)
        {
            float32[16 + i] = camera.projectionMatrix[i] ?? 0;
        }

        for (let i = 0; i < 16; i++)
        {
            float32[32 + i] = camera.viewProjectionMatrix[i] ?? 0;
        }

        return buffer;
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
