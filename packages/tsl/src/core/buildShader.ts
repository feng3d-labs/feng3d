/**
 * 构建着色器的参数
 */
export interface BuildShaderParam
{
    /** 目标语言 */
    language: 'glsl' | 'wgsl';
    /** 着色器阶段 */
    stage: 'vertex' | 'fragment' | 'compute';
    /** 版本（GLSL 使用） */
    version: 1 | 2;
    /**
     * 是否转换深度值（仅 WGSL vertex shader 使用）
     * 将深度从 WebGL 的 [-1, 1] 转换为 WebGPU 的 [0, 1]
     * 公式: z_webgpu = (z_webgl + 1.0) * 0.5
     */
    convertDepth?: boolean;
    /**
     * 是否在生成辅助函数（如 ShaderFunc）
     * 辅助函数中的 return_ 应该生成普通的 return 语句，而不是着色器输出赋值
     */
    isHelperFunction?: boolean;
}

let buildParam: BuildShaderParam;

export function buildShader<T>(param: BuildShaderParam, callback: () => T): T
{
    const previousBuildParam = buildParam;

    buildParam = param;

    let result: T;

    try
    {
        result = callback();
    } catch (error)
    {
        result = undefined as unknown as T;
        console.error('Error in buildParam', error);
        throw new Error(`Error in buildParam: ${error.message}`);
    }

    buildParam = previousBuildParam;

    return result;
}

export function getBuildParam()
{
    return buildParam;
}