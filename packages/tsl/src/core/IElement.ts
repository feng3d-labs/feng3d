export interface IElement
{
    dependencies: IElement[]
    toGLSL(): string;
    toWGSL(): string;
}

/**
 * 着色器值类型接口
 * 表示着色器中的值/表达式，如 vec2, vec3, vec4, mat4 等
 */
export interface ShaderValue extends IElement
{
    glslType: string;
    wgslType: string;
}

/**
 * 结构体 uniform 的值所携带的元数据
 *
 * 由 `struct()` 在设置 uniform.value 时附加，用于依赖分析时识别结构体 uniform。
 */
export interface StructValueMeta
{
    /** 标记此值是结构体 uniform 值 */
    _isStruct: true;
    /** 结构体定义 */
    _structDef: import('../variables/struct').StructDefinition<import('../variables/struct').StructMembers>;
    /** 结构体实例名（用于生成 UBO 声明） */
    _instanceName: string;
}

/**
 * 外部变量（在函数外通过 var_ 定义）携带的元数据
 *
 * 由 `var_()` 在函数外定义变量时附加到结果值上，用于依赖分析时收集外部变量。
 */
export interface ExternalVarMeta
{
    /** 标记此值是外部定义的变量 */
    _isExternalVar: true;
    /** 外部变量名 */
    _varName: string;
    /** 外部变量初始化表达式 */
    _varExpr: ShaderValue;
    /** 是否仅声明类型（无初始值） */
    _isTypeOnly: boolean;
}

/**
 * 函数调用表达式携带的元数据
 *
 * 由 `ShaderFunc.call()` 和 `func()` 附加到返回值上，用于依赖分析时收集被调用的函数。
 */
export interface ShaderFuncCallMeta
{
    /** 标记此值是某个 ShaderFunc 的调用结果 */
    _shaderFunc: import('../shader/func').ShaderFunc<ShaderValue[], ShaderValue>;
}