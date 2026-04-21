/**
 * 序列化工具函数
 *
 * 将结构化数据转换为 GPU Buffer 所需的二进制格式。
 */

import {
    OBJECT_DATA_SIZE,
    MATERIAL_DATA_SIZE,
    CAMERA_DATA_SIZE,
    FRUSTUM_DATA_SIZE,
    type CameraData,
    type FrustumData,
    type ObjectTransform,
    type MaterialData,
} from './types.js';

// ==================== 相机序列化 ====================

/**
 * 序列化相机数据
 *
 * @param data - 相机数据结构
 * @returns 144 字节的 ArrayBuffer
 */
export function serializeCameraData(data: CameraData): ArrayBuffer
{
    const buffer = new ArrayBuffer(CAMERA_DATA_SIZE);
    const view = new Float32Array(buffer);

    // viewMatrix (64 bytes)
    view.set(data.viewMatrix, 0);

    // projectionMatrix (64 bytes)
    view.set(data.projectionMatrix, 16);

    // padding (16 bytes) - 保持为零

    return buffer;
}

/**
 * 反序列化相机数据
 *
 * @param buffer - 144 字节的 ArrayBuffer
 * @returns 相机数据结构
 */
export function deserializeCameraData(buffer: ArrayBuffer): CameraData
{
    const view = new Float32Array(buffer);

    return {
        viewMatrix: view.slice(0, 16) as Float32Array,
        projectionMatrix: view.slice(16, 32) as Float32Array,
    };
}

// ==================== 视锥体序列化 ====================

/**
 * 序列化视锥体数据
 *
 * @param frustum - 视锥体数据结构
 * @returns 96 字节的 Float32Array
 */
export function serializeFrustumData(frustum: FrustumData): Float32Array
{
    const buffer = new Float32Array(FRUSTUM_DATA_SIZE / 4);

    for (let i = 0; i < 6; i++)
    {
        buffer[i * 4 + 0] = frustum.planes[i][0]; // nx
        buffer[i * 4 + 1] = frustum.planes[i][1]; // ny
        buffer[i * 4 + 2] = frustum.planes[i][2]; // nz
        buffer[i * 4 + 3] = frustum.planes[i][3]; // d
    }

    return buffer;
}

/**
 * 反序列化视锥体数据
 *
 * @param buffer - 96 字节的 Float32Array
 * @returns 视锥体数据结构
 */
export function deserializeFrustumData(buffer: Float32Array): FrustumData
{
    const plane0: [number, number, number, number] = [buffer[0], buffer[1], buffer[2], buffer[3]];
    const plane1: [number, number, number, number] = [buffer[4], buffer[5], buffer[6], buffer[7]];
    const plane2: [number, number, number, number] = [buffer[8], buffer[9], buffer[10], buffer[11]];
    const plane3: [number, number, number, number] = [buffer[12], buffer[13], buffer[14], buffer[15]];
    const plane4: [number, number, number, number] = [buffer[16], buffer[17], buffer[18], buffer[19]];
    const plane5: [number, number, number, number] = [buffer[20], buffer[21], buffer[22], buffer[23]];

    return {
        planes: [plane0, plane1, plane2, plane3, plane4, plane5],
    };
}

// ==================== 物体序列化 ====================

/**
 * 序列化物体变换数据
 *
 * @param transform - 物体变换数据结构
 * @returns 128 字节的 ArrayBuffer
 */
export function serializeObjectTransform(transform: ObjectTransform): ArrayBuffer
{
    const buffer = new ArrayBuffer(OBJECT_DATA_SIZE);
    const floatView = new Float32Array(buffer);
    const uintView = new Uint32Array(buffer);

    // modelMatrix (64 bytes)
    floatView.set(transform.modelMatrix, 0);

    // worldPosition (12 bytes, offset 16)
    floatView[16] = transform.worldPosition[0];
    floatView[17] = transform.worldPosition[1];
    floatView[18] = transform.worldPosition[2];

    // materialId (4 bytes, offset 19)
    uintView[19] = 0; // 将在序列化物体时设置

    // lodLevel (4 bytes, offset 20)
    uintView[20] = transform.lodLevel;

    // padding (44 bytes) - 保持为零

    return buffer;
}

/**
 * 反序列化物体变换数据
 *
 * @param buffer - 128 字节的 ArrayBuffer
 * @returns 物体变换数据结构
 */
export function deserializeObjectTransform(buffer: ArrayBuffer): ObjectTransform
{
    const floatView = new Float32Array(buffer);
    const uintView = new Uint32Array(buffer);

    return {
        modelMatrix: floatView.slice(0, 16) as Float32Array,
        worldPosition: [
            floatView[16],
            floatView[17],
            floatView[18],
        ],
        lodLevel: uintView[20],
    };
}

// ==================== 材质序列化 ====================

/**
 * 序列化材质数据
 *
 * @param data - 材质数据结构
 * @returns 48 字节的 ArrayBuffer
 */
export function serializeMaterialData(data: MaterialData): ArrayBuffer
{
    const buffer = new ArrayBuffer(MATERIAL_DATA_SIZE);
    const floatView = new Float32Array(buffer);

    // albedo (16 bytes)
    floatView[0] = data.albedo[0];
    floatView[1] = data.albedo[1];
    floatView[2] = data.albedo[2];
    floatView[3] = data.albedo[3];

    // metallic (4 bytes, offset 4)
    floatView[4] = data.metallic;

    // roughness (4 bytes, offset 5)
    floatView[5] = data.roughness;

    // normalScale (4 bytes, offset 6)
    floatView[6] = data.normalScale;

    // occlusionStrength (4 bytes, offset 7)
    floatView[7] = data.occlusionStrength;

    // emissive (16 bytes, offset 8)
    floatView[8] = data.emissive[0];
    floatView[9] = data.emissive[1];
    floatView[10] = data.emissive[2];
    floatView[11] = data.emissive[3];

    // padding (8 bytes) - 保持为零

    return buffer;
}

/**
 * 反序列化材质数据
 *
 * @param buffer - 48 字节的 ArrayBuffer
 * @returns 材质数据结构
 */
export function deserializeMaterialData(buffer: ArrayBuffer): MaterialData
{
    const floatView = new Float32Array(buffer);

    return {
        albedo: [
            floatView[0],
            floatView[1],
            floatView[2],
            floatView[3],
        ],
        metallic: floatView[4],
        roughness: floatView[5],
        normalScale: floatView[6],
        occlusionStrength: floatView[7],
        emissive: [
            floatView[8],
            floatView[9],
            floatView[10],
            floatView[11],
        ],
    };
}
