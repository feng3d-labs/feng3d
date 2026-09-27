/**
 * 类型转换工具
 *
 * 将 readonly 数组转换为可变数组，用于与 WebGPU API 兼容
 */

/**
 * 将 readonly 数组转换为可变数组
 */
export function toMutableArray<T>(arr: readonly T[]): T[]
{
    return arr as T[];
}

/**
 * 将 readonly 元组转换为可变数组
 */
export function toMutableTuple<T extends readonly unknown[]>(tuple: T): T[number][]
{
    return tuple as unknown as T[number][];
}

/**
 * 将 readonly 元组转换为可变数组（用于 GPUOrigin2D）
 */
export function toGPUOrigin2D(origin: readonly [x: number, y: number]): GPUOrigin2D
{
    return [origin[0], origin[1]];
}

/**
 * 将 readonly 元组转换为可变数组（用于 GPUOrigin3D）
 */
export function toGPUOrigin3D(origin: readonly [x: number, y: number, depthOrArrayLayers?: number]): GPUOrigin3D
{
    // origin 第三项在调用方省略时确实为 undefined（原实现即返回含 undefined 的三元组）；
    // 而 GPUOrigin3D 的 GPUIntegerCoordinate[] 形式不接受 undefined 分量，故断言到数组形式，保持原运行时值不变
    return [origin[0], origin[1], origin[2]] as GPUIntegerCoordinate[];
}

/**
 * 将 TextureSize 转换为 GPUExtent3D
 */
export function toGPUExtent3D(size: readonly [width: number, height: number, depthOrArrayLayers?: number]): GPUExtent3D
{
    return size as unknown as GPUExtent3D;
}
