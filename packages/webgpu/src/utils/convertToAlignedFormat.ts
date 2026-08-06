/**
 * 将紧凑格式矩阵数据转换为 WebGPU uniform buffer 对齐格式。
 *
 * WebGPU uniform buffer 中 mat*x3 类型的每列（vec3）需要按 vec4 对齐（16 字节）。
 * - mat2x3: 紧凑 6 float -> 对齐 8 float
 * - mat3x3: 紧凑 9 float -> 对齐 12 float
 * - mat4x3: 紧凑 12 float -> 对齐 16 float
 *
 * @param data 原始数据
 * @param typeName WGSL 类型名称
 * @returns 对齐后的数据（如果不需要转换则返回原数据）
 */
export function convertToAlignedFormat<T extends Float32Array | Int32Array | Uint32Array | Int16Array>(
    data: T,
    typeName: string,
): T
{
    // 检查是否是 mat*x3 类型（需要对齐的矩阵类型）
    const mat2x3Match = /^mat2x3[fhiu]?$/.test(typeName);
    const mat3x3Match = /^mat3x3[fhiu]?$/.test(typeName);
    const mat4x3Match = /^mat4x3[fhiu]?$/.test(typeName);

    if (!mat2x3Match && !mat3x3Match && !mat4x3Match)
    {
        // 不需要对齐转换
        return data;
    }

    // 确定列数
    let cols = 0;

    if (mat2x3Match) cols = 2;
    else if (mat3x3Match) cols = 3;
    else if (mat4x3Match) cols = 4;

    const compactSize = cols * 3; // 紧凑格式大小
    const alignedSize = cols * 4; // 对齐格式大小

    // 如果数据已经是对齐格式，直接返回
    if (data.length === alignedSize)
    {
        return data;
    }

    // 如果数据是紧凑格式，转换为对齐格式
    if (data.length === compactSize)
    {
        const Ctor = data.constructor as new (length: number) => T;
        const aligned = new Ctor(alignedSize);

        for (let i = 0; i < cols; i++)
        {
            // 复制每列的 3 个元素，第 4 个元素（padding）保持为 0
            aligned[i * 4 + 0] = data[i * 3 + 0];
            aligned[i * 4 + 1] = data[i * 3 + 1];
            aligned[i * 4 + 2] = data[i * 3 + 2];
            // aligned[i * 4 + 3] = 0; // padding，默认为 0
        }

        return aligned;
    }

    // 数据大小不匹配，返回原数据
    console.warn(`[WebGPU] ${typeName} 数据大小 (${data.length}) 不匹配，期望紧凑格式 (${compactSize}) 或对齐格式 (${alignedSize})`);

    return data;
}
