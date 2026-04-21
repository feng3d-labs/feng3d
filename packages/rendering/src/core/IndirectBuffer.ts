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
