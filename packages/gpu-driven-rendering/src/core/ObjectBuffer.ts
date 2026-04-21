import type { GPUDevice } from 'gpu';
import type { ObjectData } from './types.js';

/**
 * GPU物体缓冲管理器
 *
 * 负责管理物体数据在GPU端的存储和更新。
 */
export class ObjectBuffer
{
    /**
     * 物体数据缓冲区（结构化缓冲）
     *
     * 布局：
     * - worldMatrix: 16 * float (64 bytes)
     * - boundsCenter: 3 * float (12 bytes)
     * - boundsRadius: 1 * float (4 bytes)
     * - materialId: 1 * uint (4 bytes)
     * - isTransparent: 1 * uint (4 bytes)
     * - padding: 8 bytes
     * - lods: 4 * (indexCount + indexOffset) = 4 * 8 = 32 bytes
     * 总计：128 bytes per object
     */
    readonly buffer: GPUBuffer;

    /**
     * 最大物体数量
     */
    readonly maxObjects: number;

    /**
     * 当前物体数量
     */
    objectCount: number;

    /**
     * 每个物体的数据大小（字节）
     */
    static readonly STRIDE = 128;

    constructor(device: GPUDevice, options: { maxObjects: number; label?: string })
    {
        const { maxObjects, label = 'ObjectBuffer' } = options;
        this.maxObjects = maxObjects;
        this.objectCount = 0;

        this.buffer = device.createBuffer({
            label,
            size: maxObjects * ObjectBuffer.STRIDE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
    }

    /**
     * 更新物体数据
     *
     * @param queue GPU队列
     * @param objectIndex 物体索引
     * @param object 物体数据
     */
    updateObject(queue: GPUQueue, objectIndex: number, object: ObjectData): void
    {
        if (objectIndex < 0 || objectIndex >= this.maxObjects)
        {
            throw new Error(`Object index ${objectIndex} out of range [0, ${this.maxObjects})`);
        }

        const data = this.serializeObject(object);
        const offset = objectIndex * ObjectBuffer.STRIDE;

        queue.writeBuffer(this.buffer, offset, data);
    }

    /**
     * 批量更新物体数据
     *
     * @param queue GPU队列
     * @param startIndex 起始索引
     * @param objects 物体数据数组
     */
    updateObjects(queue: GPUQueue, startIndex: number, objects: readonly ObjectData[]): void
    {
        const endIndex = Math.min(startIndex + objects.length, this.maxObjects);

        for (let i = 0; i < objects.length && startIndex + i < endIndex; i++)
        {
            this.updateObject(queue, startIndex + i, objects[i]);
        }

        this.objectCount = Math.max(this.objectCount, endIndex);
    }

    /**
     * 获取物体数据的绑定组布局入口
     */
    static getBindGroupLayoutEntry(): GPUBindGroupLayoutEntry
    {
        return {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX,
            buffer: {
                type: 'read-only-storage',
                minBindingSize: ObjectBuffer.STRIDE,
            },
        };
    }

    /**
     * 序列化物体数据到字节缓冲区
     */
    private serializeObject(object: ObjectData): Uint8Array
    {
        const buffer = new ArrayBuffer(ObjectBuffer.STRIDE);
        const view = new DataView(buffer);
        const float32 = new Float32Array(buffer);
        const uint32 = new Uint32Array(buffer);

        let offset = 0;

        // worldMatrix (16 floats)
        for (let i = 0; i < 16; i++)
        {
            float32[i] = object.worldMatrix[i] ?? 0;
        }
        offset += 16 * 4;

        // boundsCenter (3 floats)
        view.setFloat32(offset, object.boundsCenter[0], true);
        view.setFloat32(offset + 4, object.boundsCenter[1], true);
        view.setFloat32(offset + 8, object.boundsCenter[2], true);
        offset += 12;

        // boundsRadius (1 float)
        view.setFloat32(offset, object.boundsRadius, true);
        offset += 4;

        // materialId (1 uint)
        uint32[offset / 4] = object.materialId;
        offset += 4;

        // isTransparent (1 uint, 作为bool)
        uint32[offset / 4] = object.isTransparent ? 1 : 0;
        offset += 4;

        // padding (8 bytes, skipped)
        offset += 8;

        // LODs (4 levels, each: indexCount + indexOffset)
        for (let i = 0; i < 4; i++)
        {
            const lod = object.lods[i] || { indexCount: 0, indexOffset: 0 };
            uint32[offset / 4] = lod.indexCount;
            uint32[offset / 4 + 1] = lod.indexOffset;
            offset += 8;
        }

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
 * WGSL 着色器中的物体数据结构定义
 */
export const OBJECT_DATA_WGSL = `
// 物体数据结构（128字节）
struct ObjectData {
    worldMatrix: mat4x4f,           // 64 bytes
    boundsCenter: vec3f,            // 12 bytes
    boundsRadius: f32,              // 4 bytes
    materialId: u32,                // 4 bytes
    isTransparent: u32,             // 4 bytes
    __padding: vec2u,               // 8 bytes (padding)
    lods: array<LODLevel, 4>,       // 32 bytes (4 levels * 8 bytes)
};

// LOD级别
struct LODLevel {
    indexCount: u32,
    indexOffset: u32,
};

// 物体缓冲
@group(0) @binding(0) var<storage, read> objects: array<ObjectData>;
`;
