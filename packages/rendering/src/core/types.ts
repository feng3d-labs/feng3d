/**
 * GPU驱动渲染核心类型定义
 *
 * 定义了物体数据、材质、间接绘制命令等核心类型。
 */

/**
 * 间接绘制命令结构（WebGPU标准）
 *
 * 对应 WebGPU 的 drawIndexedIndirect 命令格式。
 */
export interface DrawIndexedIndirect
{
    /**
     * 索引数量
     */
    readonly indexCount: number;

    /**
     * 实例数量
     */
    readonly instanceCount: number;

    /**
     * 起始索引位置
     */
    readonly firstIndex: number;

    /**
     * 顶点偏移量
     */
    readonly vertexOffset: number;

    /**
     * 基础实例ID
     */
    readonly baseInstance: number;
}

/**
 * DrawIndexedIndirect 结构的字节大小（5个32位整数）
 */
export const DRAW_INDEXED_INDIRECT_SIZE = 20;

/**
 * 物体LOD级别数据
 */
export interface LODLevel
{
    /**
     * 该LOD级别的索引数量
     */
    readonly indexCount: number;

    /**
     * 该LOD级别的索引偏移
     */
    readonly indexOffset: number;
}

/**
 * 物体数据结构
 *
 * 存储在GPU缓冲区中的物体信息。
 */
export interface ObjectData
{
    /**
     * 物体世界矩阵（4x4，16个float）
     */
    readonly worldMatrix: readonly number[];

    /**
     * 物体边界球中心（xyz）
     */
    readonly boundsCenter: readonly [number, number, number];

    /**
     * 物体边界球半径
     */
    readonly boundsRadius: number;

    /**
     * 材质ID
     */
    readonly materialId: number;

    /**
     * 是否为透明物体
     */
    readonly isTransparent: boolean;

    /**
     * LOD级别数据数组
     */
    readonly lods: readonly LODLevel[];

    /**
     * 可见性标志（由GPU剔除系统更新）
     */
    readonly visible: boolean;
}

/**
 * 材质类型
 */
export enum MaterialType
{
    /**
     * 不透明材质
     */
    Opaque = 0,

    /**
     * 透明材质
     */
    Transparent = 1,
}

/**
 * 材质数据
 */
export interface Material
{
    /**
     * 材质ID
     */
    readonly id: number;

    /**
     * 材质类型
     */
    readonly type: MaterialType;

    /**
     * 基础颜色 (rgba)
     */
    readonly baseColor: readonly [number, number, number, number];

    /**
     * 金属度 (0-1)
     */
    readonly metallic: number;

    /**
     * 粗糙度 (0-1)
     */
    readonly roughness: number;

    /**
     * 自发光颜色
     */
    readonly emissive: readonly [number, number, number];
}

/**
 * 相机数据
 */
export interface Camera
{
    /**
     * 视图矩阵（4x4）
     */
    readonly viewMatrix: readonly number[];

    /**
     * 投影矩阵（4x4）
     */
    readonly projectionMatrix: readonly number[];

    /**
     * 视图投影矩阵（4x4）
     */
    readonly viewProjectionMatrix: readonly number[];

    /**
     * 相机世界位置
     */
    readonly position: readonly [number, number, number];

    /**
     * 近裁剪面距离
     */
    readonly near: number;

    /**
     * 远裁剪面距离
     */
    readonly far: number;
}

/**
 * 渲染统计信息
 */
export interface RenderStats
{
    /**
     * 渲染的物体数量
     */
    readonly objectCount: number;

    /**
     * 绘制调用次数
     */
    readonly drawCalls: number;

    /**
     * 渲染的三角形数量
     */
    readonly triangleCount: number;

    /**
     * GPU计算时间（毫秒）
     */
    readonly gpuTime: number;
}

/**
 * GPU驱动渲染器配置
 */
export interface GPUDrivenRendererOptions
{
    /**
     * 最大物体数量
     * @default 10000
     */
    readonly maxObjects?: number;

    /**
     * 最大材质数量
     * @default 128
     */
    readonly maxMaterials?: number;

    /**
     * 最大透明物体数量
     * @default 1000
     */
    readonly maxTransparentObjects?: number;

    /**
     * 每个物体的最大LOD级别
     * @default 4
     */
    readonly maxLODLevels?: number;

    /**
     * 是否使用MultiDraw优化
     * @default true
     */
    readonly useMultiDraw?: boolean;

    /**
     * 是否启用调试模式
     * @default false
     */
    readonly debug?: boolean;

    /**
     * 标签
     */
    readonly label?: string;
}

/**
 * 渲染结果
 */
export interface RenderResult
{
    /**
     * 渲染统计信息
     */
    readonly stats: RenderStats;

    /**
     * 命令缓冲区（用于调试）
     */
    readonly commandBuffers?: readonly {
        readonly opaque: readonly ArrayBuffer[];
        readonly transparent: readonly ArrayBuffer[];
    };
}
