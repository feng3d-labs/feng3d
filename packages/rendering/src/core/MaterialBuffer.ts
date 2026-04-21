import type { Material } from './types.js';

/**
 * GPU材质缓冲管理器
 *
 * 负责管理材质数据在GPU端的存储。
 */
export class MaterialBuffer
{
    /**
     * 材质数据缓冲区
     *
     * 布局：
     * - baseColor: 4 * float (16 bytes)
     * - metallic: 1 * float (4 bytes)
     * - roughness: 1 * float (4 bytes)
     * - emissive: 3 * float (12 bytes)
     * - type: 1 * uint (4 bytes)
     * - padding: 4 bytes
     * 总计：48 bytes per material
     */
    readonly buffer: GPUBuffer;

    /**
     * 最大材质数量
     */
    readonly maxMaterials: number;

    /**
     * 当前材质数量
     */
    materialCount: number;

    /**
     * 材质ID到索引的映射
     */
    private readonly idToIndex: Map<number, number>;

    /**
     * 每个材质的数据大小（字节）
     */
    static readonly STRIDE = 48;

    constructor(device: GPUDevice, options: { maxMaterials: number; label?: string })
    {
        const { maxMaterials, label = 'MaterialBuffer' } = options;
        this.maxMaterials = maxMaterials;
        this.materialCount = 0;
        this.idToIndex = new Map();

        this.buffer = device.createBuffer({
            label,
            size: maxMaterials * MaterialBuffer.STRIDE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
    }

    /**
     * 添加材质并返回其索引
     *
     * @param queue GPU队列
     * @param material 材质数据
     * @returns 材质索引
     */
    addMaterial(queue: GPUQueue, material: Material): number
    {
        if (this.materialCount >= this.maxMaterials)
        {
            throw new Error(`Material buffer full (max: ${this.maxMaterials})`);
        }

        const index = this.materialCount++;
        this.idToIndex.set(material.id, index);

        this.updateMaterial(queue, index, material);
        return index;
    }

    /**
     * 更新材质数据
     *
     * @param queue GPU队列
     * @param index 材质索引
     * @param material 材质数据
     */
    updateMaterial(queue: GPUQueue, index: number, material: Material): void
    {
        if (index < 0 || index >= this.maxMaterials)
        {
            throw new Error(`Material index ${index} out of range [0, ${this.maxMaterials})`);
        }

        const data = this.serializeMaterial(material);
        const offset = index * MaterialBuffer.STRIDE;

        queue.writeBuffer(this.buffer, offset, data);
    }

    /**
     * 根据材质ID获取材质索引
     *
     * @param materialId 材质ID
     * @returns 材质索引，如果不存在返回 -1
     */
    getMaterialIndex(materialId: number): number
    {
        return this.idToIndex.get(materialId) ?? -1;
    }

    /**
     * 获取材质数据的绑定组布局入口
     */
    static getBindGroupLayoutEntry(): GPUBindGroupLayoutEntry
    {
        return {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
            buffer: {
                type: 'read-only-storage',
                minBindingSize: MaterialBuffer.STRIDE,
            },
        };
    }

    /**
     * 序列化材质数据到字节缓冲区
     */
    private serializeMaterial(material: Material): Uint8Array
    {
        const buffer = new ArrayBuffer(MaterialBuffer.STRIDE);
        const view = new DataView(buffer);

        let offset = 0;

        // baseColor (4 floats)
        view.setFloat32(offset, material.baseColor[0], true);
        view.setFloat32(offset + 4, material.baseColor[1], true);
        view.setFloat32(offset + 8, material.baseColor[2], true);
        view.setFloat32(offset + 12, material.baseColor[3], true);
        offset += 16;

        // metallic (1 float)
        view.setFloat32(offset, material.metallic, true);
        offset += 4;

        // roughness (1 float)
        view.setFloat32(offset, material.roughness, true);
        offset += 4;

        // emissive (3 floats)
        view.setFloat32(offset, material.emissive[0], true);
        view.setFloat32(offset + 4, material.emissive[1], true);
        view.setFloat32(offset + 8, material.emissive[2], true);
        offset += 12;

        // type (1 uint)
        new Uint32Array(buffer, offset, 1)[0] = material.type;

        // padding (4 bytes, skipped)
        // No need to write padding

        return new Uint8Array(buffer);
    }

    /**
     * 销毁缓冲区
     */
    destroy(): void
    {
        this.buffer.destroy();
    }
}

/**
 * WGSL 着色器中的材质数据结构定义
 */
export const MATERIAL_DATA_WGSL = `
// 材质类型
const MATERIAL_TYPE_OPAQUE: u32 = 0u;
const MATERIAL_TYPE_TRANSPARENT: u32 = 1u;

// 材质数据结构（48字节）
struct MaterialData {
    baseColor: vec4f,       // 16 bytes
    metallic: f32,          // 4 bytes
    roughness: f32,         // 4 bytes
    emissive: vec3f,        // 12 bytes
    type: u32,              // 4 bytes
    __padding: u32,         // 4 bytes (padding)
};

// 材质缓冲
@group(0) @binding(1) var<storage, read> materials: array<MaterialData>;

// 从材质ID获取材质数据的辅助函数
fn getMaterial(materialId: u32) -> MaterialData {
    return materials[materialId];
}

// 判断是否为透明材质
fn isTransparent(material: MaterialData) -> bool {
    return material.type == MATERIAL_TYPE_TRANSPARENT;
}
`;
