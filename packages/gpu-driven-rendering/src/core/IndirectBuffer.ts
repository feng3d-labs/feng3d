import { DRAW_INDEXED_INDIRECT_SIZE } from './types.js';

/**
 * 间接绘制缓冲管理器
 *
 * 管理用于间接绘制的命令缓冲区和计数器。
 * 支持双缓冲以避免GPU-CPU同步。
 */
export class IndirectBuffer
{
    /**
     * 不透明物体命令缓冲区（按材质分组）
     *
     * 每个材质对应一个命令缓冲区
     */
    readonly opaqueBuffers: GPUBuffer[];

    /**
     * 透明物体命令缓冲区
     */
    readonly transparentBuffer: GPUBuffer;

    /**
     * 不透明物体计数器（每材质一个）
     */
    readonly opaqueCounters: GPUBuffer[];

    /**
     * 透明物体计数器
     */
    readonly transparentCounter: GPUBuffer;

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
     * 当前使用的缓冲区索引（用于双缓冲）
     */
    currentBufferIndex: number;

    constructor(device: GPUDevice, options: {
        maxMaterials: number;
        maxTransparentObjects: number;
        maxDrawsPerMaterial: number;
        label?: string;
    })
    {
        const {
            maxMaterials,
            maxTransparentObjects,
            maxDrawsPerMaterial,
            label = 'IndirectBuffer',
        } = options;

        this.maxMaterials = maxMaterials;
        this.maxTransparentObjects = maxTransparentObjects;
        this.maxDrawsPerMaterial = maxDrawsPerMaterial;
        this.currentBufferIndex = 0;

        // 创建不透明物体命令缓冲区（每个材质一个）
        this.opaqueBuffers = [];
        this.opaqueCounters = [];
        for (let i = 0; i < maxMaterials; i++)
        {
            const cmdBuffer = device.createBuffer({
                label: `${label}-opaque-${i}`,
                size: maxDrawsPerMaterial * DRAW_INDEXED_INDIRECT_SIZE,
                usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            });
            this.opaqueBuffers.push(cmdBuffer);

            // 计数器缓冲区（4字节 uint）
            const counterBuffer = device.createBuffer({
                label: `${label}-opaque-counter-${i}`,
                size: 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            });
            this.opaqueCounters.push(counterBuffer);
        }

        // 创建透明物体命令缓冲区
        this.transparentBuffer = device.createBuffer({
            label: `${label}-transparent`,
            size: maxTransparentObjects * DRAW_INDEXED_INDIRECT_SIZE,
            usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        // 创建透明物体计数器
        this.transparentCounter = device.createBuffer({
            label: `${label}-transparent-counter`,
            size: 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
    }

    /**
     * 重置所有计数器
     *
     * 在每帧开始时调用，清空计数器以便重新生成命令。
     */
    resetCounters(queue: GPUQueue): void
    {
        const zero = new Uint32Array([0]);

        for (const counter of this.opaqueCounters)
        {
            queue.writeBuffer(counter, 0, zero);
        }
        queue.writeBuffer(this.transparentCounter, 0, zero);
    }

    /**
     * 切换双缓冲索引
     */
    swapBuffers(): void
    {
        this.currentBufferIndex = (this.currentBufferIndex + 1) % 2;
    }

    /**
     * 获取不透明物体命令缓冲区的绑定组布局入口
     */
    static getOpaqueBindGroupLayoutEntries(maxMaterials: number): GPUBindGroupLayoutEntry[]
    {
        const entries: GPUBindGroupLayoutEntry[] = [];

        // 命令缓冲区
        for (let i = 0; i < maxMaterials; i++)
        {
            entries.push({
                binding: 1 + i,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'storage',
                    minBindingSize: DRAW_INDEXED_INDIRECT_SIZE,
                },
            });
        }

        // 计数器
        for (let i = 0; i < maxMaterials; i++)
        {
            entries.push({
                binding: 1 + maxMaterials + i,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'storage',
                    minBindingSize: 4,
                },
            });
        }

        return entries;
    }

    /**
     * 获取透明物体相关绑定组布局入口
     */
    static getTransparentBindGroupLayoutEntries(): GPUBindGroupLayoutEntry[]
    {
        return [
            {
                binding: 1, // 透明命令缓冲区
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'storage',
                    minBindingSize: DRAW_INDEXED_INDIRECT_SIZE,
                },
            },
            {
                binding: 2, // 透明计数器
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'storage',
                    minBindingSize: 4,
                },
            },
        ];
    }

    /**
     * 销毁所有缓冲区
     */
    destroy(): void
    {
        for (const buffer of this.opaqueBuffers)
        {
            buffer.destroy();
        }
        for (const counter of this.opaqueCounters)
        {
            counter.destroy();
        }
        this.transparentBuffer.destroy();
        this.transparentCounter.destroy();
    }
}

/**
 * WGSL 着色器中的间接绘制命令结构定义
 */
export const INDIRECT_DRAW_WGSL = `
// 间接绘制命令结构（20字节）
struct DrawIndexedIndirect {
    indexCount: u32,
    instanceCount: u32,
    firstIndex: u32,
    vertexOffset: i32,
    baseInstance: u32,
};

// 不透明物体命令缓冲区数组（按材质分组）
@group(0) @binding(1) var<storage, read_write> opaqueCmds: array<DrawIndexedIndirect>;

// 透明物体命令缓冲区
@group(0) @binding(2) var<storage, read_write> transparentCmds: array<DrawIndexedIndirect>;

// 不透明物体计数器数组（每材质一个）
@group(0) @binding(3) var<storage, read_write> opaqueCounters: array<atomic<u32>>;

// 透明物体计数器
@group(0) @binding(4) var<storage, read_write> transparentCounter: atomic<u32>;
`;

/**
 * 多材质版本的绑定定义
 */
export function getMultiMaterialIndirectDrawWGSL(maxMaterials: number): string
{
    let wgsl = `
// 间接绘制命令结构（20字节）
struct DrawIndexedIndirect {
    indexCount: u32,
    instanceCount: u32,
    firstIndex: u32,
    vertexOffset: i32,
    baseInstance: u32,
};

`;

    // 不透明命令缓冲区（每材质一个）
    for (let i = 0; i < maxMaterials; i++)
    {
        wgsl += `@group(0) @binding(${1 + i}) var<storage, read_write> opaqueCmds_${i}: array<DrawIndexedIndirect>;\n`;
    }

    // 不透明计数器（每材质一个）
    for (let i = 0; i < maxMaterials; i++)
    {
        wgsl += `@group(0) @binding(${1 + maxMaterials + i}) var<storage, read_write> opaqueCounter_${i}: atomic<u32>;\n`;
    }

    // 透明命令和计数器
    wgsl += `
@group(0) @binding(${1 + maxMaterials * 2}) var<storage, read_write> transparentCmds: array<DrawIndexedIndirect>;
@group(0) @binding(${2 + maxMaterials * 2}) var<storage, read_write> transparentCounter: atomic<u32>;
`;

    return wgsl;
}
