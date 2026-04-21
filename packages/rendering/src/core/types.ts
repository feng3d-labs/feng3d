/**
 * GPU驱动渲染核心类型定义
 *
 * 定义了物体数据、材质、间接绘制命令等核心类型。
 */

// ==================== GPU 数据布局常量 ====================

/**
 * 物体数据字节大小（128 字节）
 *
 * 数据布局：
 * - modelMatrix (4x4 matrix): 64 bytes
 * - worldPosition: 12 bytes
 * - materialId: 4 bytes
 * - LOD level: 4 bytes
 * - padding: 44 bytes
 */
export const OBJECT_DATA_SIZE = 128;

/**
 * 材质数据字节大小（48 字节）
 *
 * 数据布局：
 * - albedo: 16 bytes (vec4 + factor)
 * - metallic: 4 bytes
 * - roughness: 4 bytes
 * - normalScale: 4 bytes
 * - occlusionStrength: 4 bytes
 * - emissive: 16 bytes (vec3 + factor)
 * - padding: 8 bytes
 */
export const MATERIAL_DATA_SIZE = 48;

/**
 * 相机数据字节大小（144 字节）
 *
 * 数据布局：
 * - viewMatrix (4x4 matrix): 64 bytes
 * - projectionMatrix (4x4 matrix): 64 bytes
 * - padding: 16 bytes
 */
export const CAMERA_DATA_SIZE = 144;

/**
 * 视锥体数据字节大小（96 字节）
 *
 * 数据布局：
 * - 6个平面，每个平面 16 bytes (nx, ny, nz, d)
 */
export const FRUSTUM_DATA_SIZE = 96;

// ==================== 结构化数据类型（序列化前） ====================

/**
 * 相机数据结构
 *
 * 由 @feng3d/core 提供，@feng3d/rendering 通过响应式系统自动序列化。
 */
export interface CameraData
{
    /**
     * 视图矩阵（4x4，列主序）
     */
    readonly viewMatrix: Readonly<Float32Array>;

    /**
     * 投影矩阵（4x4，列主序）
     */
    readonly projectionMatrix: Readonly<Float32Array>;
}

/**
 * 视锥体平面数据
 *
 * 由 @feng3d/core 提供，@feng3d/rendering 通过响应式系统自动序列化。
 */
export interface FrustumData
{
    /**
     * 6个视锥体平面，每个平面包含 [nx, ny, nz, d]
     *
     * 平面顺序：左、右、上、下、近、远
     */
    readonly planes: readonly [
        readonly [number, number, number, number], // left
        readonly [number, number, number, number], // right
        readonly [number, number, number, number], // top
        readonly [number, number, number, number], // bottom
        readonly [number, number, number, number], // near
        readonly [number, number, number, number], // far
    ];
}

/**
 * 物体数据结构
 *
 * 由 @feng3d/core 提供，@feng3d/rendering 通过响应式系统自动序列化。
 */
export interface ObjectTransform
{
    /**
     * 模型矩阵（4x4，列主序）
     */
    readonly modelMatrix: Readonly<Float32Array>;

    /**
     * 世界位置
     */
    readonly worldPosition: readonly [number, number, number];

    /**
     * LOD 级别
     */
    readonly lodLevel: number;
}

// ==================== 间接绘制命令 ====================

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
 * 由 @feng3d/core 提供，@feng3d/rendering 通过响应式系统自动序列化。
 */
export interface ObjectData
{
    /**
     * 物体变换数据
     */
    readonly transform: ObjectTransform;

    /**
     * 材质ID
     */
    readonly materialId: number;

    /**
     * 是否为透明物体
     */
    readonly isTransparent: boolean;

    /**
     * 可见性标志
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
 * 材质数据结构
 *
 * 由 @feng3d/core 提供，@feng3d/rendering 通过响应式系统自动序列化。
 */
export interface MaterialData
{
    /**
     * 反照率颜色 [r, g, b, a]
     */
    readonly albedo: readonly [number, number, number, number];

    /**
     * 金属性（0-1）
     */
    readonly metallic: number;

    /**
     * 粗糙度（0-1）
     */
    readonly roughness: number;

    /**
     * 法线缩放
     */
    readonly normalScale: number;

    /**
     * 遮挡强度
     */
    readonly occlusionStrength: number;

    /**
     * 自发光颜色 [r, g, b, intensity]
     */
    readonly emissive: readonly [number, number, number, number];
}

/**
 * 相机数据
 *
 * 由 @feng3d/core 提供，@feng3d/rendering 通过响应式系统自动序列化。
 */
export interface Camera
{
    /**
     * 相机数据
     */
    readonly data: CameraData;

    /**
     * 视锥体数据
     */
    readonly frustum: FrustumData;

    /**
     * 物体数量
     */
    readonly objectCount: number;
}

/**
 * 材质数据
 *
 * 由 @feng3d/core 提供，@feng3d/rendering 通过响应式系统自动序列化。
 */
export interface Material
{
    /**
     * 材质ID
     */
    readonly id: number;

    /**
     * 材质数据
     */
    readonly data: MaterialData;
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
    readonly commandBuffers?: Readonly<{
        readonly opaque: readonly ArrayBuffer[];
        readonly transparent: readonly ArrayBuffer[];
    }>;
}
