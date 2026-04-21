import type { Camera, Material, ObjectData, GPUDrivenRendererOptions, RenderResult, RenderStats } from './types.js';
import { ObjectBuffer } from './ObjectBuffer.js';
import { MaterialBuffer } from './MaterialBuffer.js';
import { IndirectBuffer } from './IndirectBuffer.js';
import { code as commandGeneratorShaderCode } from '../compute/CommandGenerator.wgsl.js';

// 导入着色器内容
const COMMAND_GENERATOR_SHADER = commandGeneratorShaderCode;

/**
 * GPU驱动渲染器
 *
 * 实现全GPU驱动的渲染流程：
 * 1. GPU生成绘制命令
 * 2. CPU仅触发间接绘制
 * 3. 支持不透明/透明物体分类渲染
 */
export class GPUDrivenRenderer
{
    /**
     * GPU设备
     */
    readonly device: GPUDevice;

    /**
     * 渲染器配置
     */
    readonly options: Readonly<GPUDrivenRendererOptions>;

    /**
     * 物体缓冲管理器
     */
    readonly objectBuffer: ObjectBuffer;

    /**
     * 材质缓冲管理器
     */
    readonly materialBuffer: MaterialBuffer;

    /**
     * 间接绘制缓冲管理器
     */
    readonly indirectBuffer: IndirectBuffer;

    /**
     * 命令生成计算管线
     */
    private commandGeneratorPipeline: GPUComputePipeline;

    /**
     * 相机数据缓冲区
     */
    private cameraBuffer: GPUBuffer;

    /**
     * 视锥体数据缓冲区
     */
    private frustumBuffer: GPUBuffer;

    /**
     * 物体计数缓冲区
     */
    private objectCountBuffer: GPUBuffer;

    /**
     * 绑定组布局
     */
    private bindGroupLayout: GPUBindGroupLayout;

    /**
     * 当前绑定组
     */
    private bindGroup: GPUBindGroup | null;

    /**
     * 是否支持 MultiDraw 优化
     */
    readonly supportsMultiDraw: boolean;

    /**
     * 调试模式
     */
    readonly debug: boolean;

    constructor(device: GPUDevice, options: GPUDrivenRendererOptions = {})
    {
        this.device = device;
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

        // 检测 MultiDraw 支持
        this.supportsMultiDraw = this.options.useMultiDraw &&
            device.features.has('indirect-first-instance');

        // 创建缓冲区管理器
        this.objectBuffer = new ObjectBuffer(device, {
            maxObjects: this.options.maxObjects,
            label: `${this.options.label}-ObjectBuffer`,
        });

        this.materialBuffer = new MaterialBuffer(device, {
            maxMaterials: this.options.maxMaterials,
            label: `${this.options.label}-MaterialBuffer`,
        });

        this.indirectBuffer = new IndirectBuffer(device, {
            maxMaterials: this.options.maxMaterials,
            maxTransparentObjects: this.options.maxTransparentObjects,
            maxDrawsPerMaterial: Math.ceil(this.options.maxObjects / this.options.maxMaterials),
            label: `${this.options.label}-IndirectBuffer`,
        });

        // 创建相机和视锥体缓冲区
        this.cameraBuffer = device.createBuffer({
            label: `${this.options.label}-CameraBuffer`,
            size: 144, // mat4x4 * 3 + vec3 + f32 * 2 + padding
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.frustumBuffer = device.createBuffer({
            label: `${this.options.label}-FrustumBuffer`,
            size: 96, // 6 planes * 4 components * 4 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.objectCountBuffer = device.createBuffer({
            label: `${this.options.label}-ObjectCountBuffer`,
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // 创建计算管线
        this.commandGeneratorPipeline = device.createComputePipeline({
            label: `${this.options.label}-CommandGeneratorPipeline`,
            compute: {
                module: device.createShaderModule({
                    label: `${this.options.label}-CommandGeneratorShader`,
                    code: COMMAND_GENERATOR_SHADER,
                }),
                entryPoint: 'main',
            },
            layout: 'auto',
        });

        // 获取绑定组布局
        this.bindGroupLayout = this.commandGeneratorPipeline.getBindGroupLayout(0);
        this.bindGroup = null;

        if (this.debug)
        {
            console.info('[GPUDrivenRenderer] Initialized with options:', this.options);
            console.info('[GPUDrivenRenderer] MultiDraw support:', this.supportsMultiDraw);
        }
    }

    /**
     * 更新物体数据
     *
     * @param objects 物体数据数组
     */
    updateObjects(objects: readonly ObjectData[]): void
    {
        this.objectBuffer.updateObjects(this.device.queue, 0, objects);

        // 更新物体计数
        const countData = new Uint32Array([objects.length]);
        this.device.queue.writeBuffer(this.objectCountBuffer, 0, countData);

        // 重新创建绑定组
        this._createBindGroup();
    }

    /**
     * 更新单个物体数据
     *
     * @param index 物体索引
     * @param object 物体数据
     */
    updateObject(index: number, object: ObjectData): void
    {
        this.objectBuffer.updateObject(this.device.queue, index, object);
    }

    /**
     * 添加材质
     *
     * @param material 材质数据
     * @returns 材质索引
     */
    addMaterial(material: Material): number
    {
        const index = this.materialBuffer.addMaterial(this.device.queue, material);

        // 重新创建绑定组
        this._createBindGroup();

        return index;
    }

    /**
     * 更新相机数据
     *
     * @param camera 相机数据
     */
    updateCamera(camera: Camera): void
    {
        // 提取视锥体平面
        const frustumPlanes = this.extractFrustumPlanes(camera);

        // 写入相机缓冲区
        this.device.queue.writeBuffer(this.cameraBuffer, 0, this.serializeCamera(camera));

        // 写入视锥体缓冲区
        this.device.queue.writeBuffer(this.frustumBuffer, 0, frustumPlanes);
    }

    /**
     * 渲染一帧
     *
     * @param colorAttachment 颜色附件
     * @param depthStencilAttachment 深度模板附件
     * @param renderPipeline 渲染管线
     * @returns 渲染结果
     */
    render(
        colorAttachment: GPURenderPassColorAttachment,
        depthStencilAttachment: GPURenderPassDepthStencilAttachment,
        renderPipeline: GPURenderPipeline,
    ): RenderResult
    {
        const startTime = performance.now();

        const encoder = this.device.createCommandEncoder({
            label: `${this.options.label}-CommandEncoder`,
        });

        // 1. 生成绘制命令（计算着色器）
        this.generateCommands(encoder);

        // 2. 渲染
        const stats = this.renderPass(
            encoder,
            colorAttachment,
            depthStencilAttachment,
            renderPipeline,
        );

        // 提交命令
        this.device.queue.submit([encoder.finish()]);

        const gpuTime = performance.now() - startTime;

        return { stats: { ...stats, gpuTime } };
    }

    /**
     * 生成绘制命令（计算着色器）
     */
    private generateCommands(encoder: GPUCommandEncoder): void
    {
        // 重置计数器
        this.indirectBuffer.resetCounters(this.device.queue);

        const computePass = encoder.beginComputePass({
            label: `${this.options.label}-CommandGeneratorPass`,
        });

        computePass.setPipeline(this.commandGeneratorPipeline);
        computePass.setBindGroup(0, this._getBindGroup());

        // 调度计算着色器
        const workgroupCount = Math.ceil(this.objectBuffer.objectCount / 64);
        computePass.dispatchWorkgroups(workgroupCount);

        computePass.end();
    }

    /**
     * 渲染通道
     */
    private renderPass(
        encoder: GPUCommandEncoder,
        colorAttachment: GPURenderPassColorAttachment,
        depthStencilAttachment: GPURenderPassDepthStencilAttachment,
        renderPipeline: GPURenderPipeline,
    ): RenderStats
    {
        const renderPass = encoder.beginRenderPass({
            label: `${this.options.label}-RenderPass`,
            colorAttachments: [colorAttachment],
            depthStencilAttachment,
        });

        renderPass.setPipeline(renderPipeline);

        // TODO: 设置顶点缓冲区、索引缓冲区等
        // renderPass.setVertexBuffer(0, vertexBuffer);
        // renderPass.setIndexBuffer(indexBuffer, 'uint32');
        // renderPass.setBindGroup(0, renderBindGroup);

        // 不透明物体渲染
        const opaqueDrawCalls = this.renderOpaque(renderPass);

        // 透明物体渲染
        const transparentDrawCalls = this.renderTransparent(renderPass);

        renderPass.end();

        return {
            objectCount: this.objectBuffer.objectCount,
            drawCalls: opaqueDrawCalls + transparentDrawCalls,
            triangleCount: 0, // TODO: 统计三角形数量
            gpuTime: 0,
        };
    }

    /**
     * 渲染不透明物体
     */
    private renderOpaque(renderPass: GPURenderPass): number
    {
        let drawCalls = 0;

        if (this.supportsMultiDraw)
        {
            // 使用 MultiDraw 优化（需要 WebGL 扩展或 WebGPU 特性支持）
            // 注意：WebGPU 的 multiDrawIndexedIndirect 需要特定特性
            // 这里简化实现，使用循环
            for (let i = 0; i < this.indirectBuffer.maxMaterials; i++)
            {
                renderPass.drawIndexedIndirect(
                    this.indirectBuffer.opaqueBuffers[i],
                    0,
                );
                drawCalls++;
            }
        }
        else
        {
            // Fallback: 循环绘制
            for (let i = 0; i < this.indirectBuffer.maxMaterials; i++)
            {
                renderPass.drawIndexedIndirect(
                    this.indirectBuffer.opaqueBuffers[i],
                    0,
                );
                drawCalls++;
            }
        }

        return drawCalls;
    }

    /**
     * 渲染透明物体
     */
    private renderTransparent(renderPass: GPURenderPass): number
    {
        // TODO: 先排序透明物体，然后绘制
        renderPass.drawIndexedIndirect(this.indirectBuffer.transparentBuffer, 0);
        return 1;
    }

    /**
     * 创建绑定组
     */
    private _createBindGroup(): void
    {
        this.bindGroup = this.device.createBindGroup({
            label: `${this.options.label}-BindGroup`,
            layout: this.bindGroupLayout,
            entries: [
                // 物体缓冲区
                {
                    binding: 0,
                    resource: { buffer: this.objectBuffer.buffer },
                },
                // 材质缓冲区
                {
                    binding: 1,
                    resource: { buffer: this.materialBuffer.buffer },
                },
                // 相机缓冲区
                {
                    binding: 2,
                    resource: { buffer: this.cameraBuffer },
                },
                // 视锥体缓冲区
                {
                    binding: 3,
                    resource: { buffer: this.frustumBuffer },
                },
                // 物体计数缓冲区
                {
                    binding: 4,
                    resource: { buffer: this.objectCountBuffer },
                },
                // 不透明命令缓冲区
                {
                    binding: 5,
                    resource: { buffer: this.indirectBuffer.opaqueBuffers[0] },
                },
                // 不透明计数器
                {
                    binding: 6,
                    resource: { buffer: this.indirectBuffer.opaqueCounters[0] },
                },
                // 透明命令缓冲区
                {
                    binding: 7,
                    resource: { buffer: this.indirectBuffer.transparentBuffer },
                },
                // 透明计数器
                {
                    binding: 8,
                    resource: { buffer: this.indirectBuffer.transparentCounter },
                },
            ],
        });
    }

    /**
     * 获取绑定组
     */
    private _getBindGroup(): GPUBindGroup
    {
        if (!this.bindGroup)
        {
            this._createBindGroup();
        }
        return this.bindGroup!;
    }

    /**
     * 从相机矩阵提取视锥体平面
     */
    private extractFrustumPlanes(camera: Camera): Float32Array
    {
        const viewProj = camera.viewProjectionMatrix as number[];
        const planes = new Float32Array(24); // 6 planes * 4 components

        // Left plane: row3 + row0
        planes[0] = viewProj[3] + viewProj[0];
        planes[1] = viewProj[7] + viewProj[4];
        planes[2] = viewProj[11] + viewProj[8];
        planes[3] = viewProj[15] + viewProj[12];

        // Right plane: row3 - row0
        planes[4] = viewProj[3] - viewProj[0];
        planes[5] = viewProj[7] - viewProj[4];
        planes[6] = viewProj[11] - viewProj[8];
        planes[7] = viewProj[15] - viewProj[12];

        // Top plane: row3 - row1
        planes[8] = viewProj[3] - viewProj[1];
        planes[9] = viewProj[7] - viewProj[5];
        planes[10] = viewProj[11] - viewProj[9];
        planes[11] = viewProj[15] - viewProj[13];

        // Bottom plane: row3 + row1
        planes[12] = viewProj[3] + viewProj[1];
        planes[13] = viewProj[7] + viewProj[5];
        planes[14] = viewProj[11] + viewProj[9];
        planes[15] = viewProj[15] + viewProj[13];

        // Near plane: row3 + row2
        planes[16] = viewProj[3] + viewProj[2];
        planes[17] = viewProj[7] + viewProj[6];
        planes[18] = viewProj[11] + viewProj[10];
        planes[19] = viewProj[15] + viewProj[14];

        // Far plane: row3 - row2
        planes[20] = viewProj[3] - viewProj[2];
        planes[21] = viewProj[7] - viewProj[6];
        planes[22] = viewProj[11] - viewProj[10];
        planes[23] = viewProj[15] - viewProj[14];

        // 归一化平面方程
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

        // viewMatrix (16 floats)
        for (let i = 0; i < 16; i++)
        {
            float32[i] = camera.viewMatrix[i] ?? 0;
        }

        // projectionMatrix (16 floats)
        for (let i = 0; i < 16; i++)
        {
            float32[16 + i] = camera.projectionMatrix[i] ?? 0;
        }

        // viewProjectionMatrix (16 floats)
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
        this.indirectBuffer.destroy();
        this.cameraBuffer.destroy();
        this.frustumBuffer.destroy();
        this.objectCountBuffer.destroy();
    }
}
