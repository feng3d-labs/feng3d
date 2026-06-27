/**
 * 着色器类型枚举 (WebGL 兼容层)
 */
export enum ShaderType
{
    VERTEX = 'vertex',
    FRAGMENT = 'fragment',
    COMPUTE = 'compute',
}

/**
 * 着色器宏定义接口
 */
export interface ShaderMacro
{
    [key: string]: boolean | number | string;
}

/**
 * 着色器类 (WebGL 兼容层)
 */
export class Shader
{
    private static _idCounter = 0;

    /**
     * 着色器 ID
     */
    _id: number;

    /**
     * 着色器类型
     */
    _type: ShaderType = ShaderType.VERTEX;

    /**
     * 顶点着色器代码
     */
    vertex?: string;

    /**
     * 片段着色器代码
     */
    fragment?: string;

    /**
     * 计算着色器代码
     */
    compute?: string;

    /**
     * 着色器名称
     */
    shaderName?: string;

    /**
     * 宏定义
     */
    macros: ShaderMacro = {};

    /**
     * 缓存的顶点着色器模块
     */
    private _vertexModule?: GPUShaderModule;

    /**
     * 缓存的片段着色器模块
     */
    private _fragmentModule?: GPUShaderModule;

    constructor(options?: {
        vertex?: string;
        fragment?: string;
        compute?: string;
        shaderName?: string;
        macros?: ShaderMacro;
    })
    {
        this._id = Shader._idCounter++;
        if (options)
        {
            this.vertex = options.vertex;
            this.fragment = options.fragment;
            this.compute = options.compute;
            this.shaderName = options.shaderName;
            if (options.macros)
            {
                this.macros = options.macros;
            }
        }
    }

    /**
     * 获取顶点着色器模块
     */
    getVertexShaderModule(_device: GPUDevice): GPUShaderModule | undefined
    {
        return this._vertexModule;
    }

    /**
     * 获取片段着色器模块
     */
    getFragmentShaderModule(_device: GPUDevice): GPUShaderModule | undefined
    {
        return this._fragmentModule;
    }

    /**
     * 编译着色器
     */
    compile(_device: GPUDevice): void
    {
        // 占位 - 实际编译将在 WebGPU 渲染器中处理
    }

    /**
     * 克隆着色器
     */
    clone(): Shader
    {
        return new Shader({
            vertex: this.vertex,
            fragment: this.fragment,
            compute: this.compute,
            shaderName: this.shaderName,
            macros: { ...this.macros },
        });
    }
}