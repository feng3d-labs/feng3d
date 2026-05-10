import { IElement, ShaderValue } from '../../core/IElement';
import { Bool } from '../../types/scalar/bool';
import { Float } from '../../types/scalar/float';
import { Int } from '../../types/scalar/int';
import { Vec2 } from '../../types/vector/vec2';
import { Vec4 } from '../../types/vector/vec4';

/**
 * 将下划线命名转换为驼峰命名
 * @param name 下划线命名，如 "vertex_index"
 * @returns 驼峰命名，如 "vertexIndex"
 */
function toCamelCase(name: string): string
{
    return name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Builtin 类，表示 GLSL 内置变量（如 gl_Position）
 * @internal 库外部不应直接使用 `new Builtin()`
 */
export class Builtin implements IElement
{
    readonly builtinName: string; // WGSL 中内置的固定名称（如 "position" 或 "gl_Position"）
    value: ShaderValue;
    dependencies: IElement[] = [];

    /**
     * 结构体变量名前缀（当 builtin 被加入到自动生成的 VertexOutput 时设置）
     * 用于在 toWGSL() 中生成正确的字段访问路径（如 'output.position'）
     */
    private _structVarPrefix?: string;

    constructor(builtinName: 'gl_Position' | 'gl_FrontFacing' | 'gl_VertexID' | 'gl_FragCoord' | 'gl_InstanceID' | 'gl_FragColor' | 'gl_PointSize')
    {
        this.builtinName = builtinName;
    }

    /**
     * 设置结构体变量名前缀（由 vertex.ts 在生成 VertexOutput 时调用）
     * @internal
     */
    setStructVarPrefix(prefix: string): void
    {
        this._structVarPrefix = prefix;
    }

    /**
     * 获取完整的 WGSL 变量名（包括结构体前缀，如果有的话）
     * 用于在赋值语句中生成正确的变量名
     */
    getFullWGSLVarName(): string
    {
        if (this._structVarPrefix)
        {
            return `${this._structVarPrefix}.${this.defaultName}`;
        }

        return this.defaultName;
    }

    /**
     * 检查是否已被加入到自动生成的 VertexOutput 中
     * 用于在 assign 中判断是否需要使用 getFullWGSLVarName()
     */
    hasStructVarPrefix(): boolean
    {
        return this._structVarPrefix !== undefined;
    }

    /**
     * 获取 WGSL 中的 builtin 名称（将 gl_Position 映射为 position，gl_FrontFacing 映射为 front_facing）
     */
    get wgslBuiltinName(): string
    {
        if (this.builtinName === 'gl_Position') return 'position';
        if (this.builtinName === 'gl_FrontFacing') return 'front_facing';
        if (this.builtinName === 'gl_VertexID') return 'vertex_index';
        if (this.builtinName === 'gl_FragCoord') return 'position';
        if (this.builtinName === 'gl_InstanceID') return 'instance_index';
        if (this.builtinName === 'gl_PointSize') return 'point_size';

        return this.builtinName;
    }

    /**
     * 获取默认的变量名（驼峰命名格式）
     * 注意：gl_FragCoord 使用 fragCoord 而不是 position，以区分顶点着色器的 position 输出
     */
    get defaultName(): string
    {
        // gl_FragCoord 特殊处理，使用 fragCoord 作为变量名
        if (this.isFragCoord)
        {
            return 'fragCoord';
        }

        // gl_FragColor 使用 fragColor 作为变量名
        if (this.isFragColorOutput)
        {
            return 'fragColor';
        }

        return toCamelCase(this.wgslBuiltinName);
    }

    /**
     * 检查是否是 position 相关的 builtin
     */
    get isPosition(): boolean
    {
        return this.builtinName === 'gl_Position';
    }

    /**
     * 检查是否是 front_facing 相关的 builtin
     */
    get isFrontFacing(): boolean
    {
        return this.builtinName === 'gl_FrontFacing';
    }

    /**
     * 检查是否是 vertexIndex 相关的 builtin
     */
    get isVertexIndex(): boolean
    {
        return this.builtinName === 'gl_VertexID';
    }

    /**
     * 检查是否是 fragCoord 相关的 builtin
     */
    get isFragCoord(): boolean
    {
        return this.builtinName === 'gl_FragCoord';
    }

    /**
     * 检查是否是 instanceIndex 相关的 builtin
     */
    get isInstanceIndex(): boolean
    {
        return this.builtinName === 'gl_InstanceID';
    }

    /**
     * 检查是否是 gl_FragColor（片段着色器输出颜色）
     */
    get isFragColorOutput(): boolean
    {
        return this.builtinName === 'gl_FragColor';
    }

    /**
     * 检查是否是 pointSize 相关的 builtin
     */
    get isPointSize(): boolean
    {
        return this.builtinName === 'gl_PointSize';
    }

    toGLSL(): string
    {
        if (this.isPosition)
        {
            return 'gl_Position';
        }
        if (this.isFrontFacing)
        {
            return 'gl_FrontFacing';
        }
        if (this.isVertexIndex)
        {
            return 'gl_VertexID';
        }
        if (this.isFragCoord)
        {
            return 'gl_FragCoord';
        }
        if (this.isInstanceIndex)
        {
            return 'gl_InstanceID';
        }
        if (this.isFragColorOutput)
        {
            return 'gl_FragColor';
        }
        if (this.isPointSize)
        {
            return 'gl_PointSize';
        }

        throw new Error(`Builtin '${this.builtinName}' 不支持 GLSL，无法生成 GLSL 代码。`);
    }

    toWGSL(): string
    {
        // gl_FragColor 不是 WGSL builtin，直接返回变量名
        if (this.isFragColorOutput)
        {
            return this.defaultName;
        }

        // 对于特定的 builtin，强制使用正确的 WGSL 类型
        // 这些类型是 WGSL 规范要求的，不能由用户代码改变
        let wgslType: string;
        if (this.isFrontFacing)
        {
            wgslType = 'bool';
        }
        else if (this.isVertexIndex || this.isInstanceIndex)
        {
            wgslType = 'u32';
        }
        else if (this.isFragCoord || this.isPosition)
        {
            wgslType = 'vec4<f32>';
        }
        else if (this.isPointSize)
        {
            wgslType = 'f32';
        }
        else
        {
            // 对于其他 builtin，使用 value 的类型
            if (!this.value)
            {
                throw new Error(`Builtin '${this.builtinName}' 的 value 没有设置，无法生成 WGSL。`);
            }
            wgslType = this.value.wgslType ?? 'vec4<f32>';
        }

        return `@builtin(${this.wgslBuiltinName}) ${this.defaultName}: ${wgslType}`;
    }
}

interface BuiltinMap
{
    'gl_Position': Vec4,
    'gl_FrontFacing': Bool,
    'gl_VertexID': Int,
    'gl_FragCoord': Vec2,
    'gl_InstanceID': Int,
    'gl_FragColor': Vec4,
    'gl_PointSize': Float,
}

/**
 * 创建内置变量引用
 * @internal 仅供 builtins.ts 内部使用
 */
export function builtin<T extends keyof BuiltinMap>(builtinName: T, value: BuiltinMap[T]): BuiltinMap[T]
{
    const bi = new Builtin(builtinName);
    const result = new (value.constructor as new () => BuiltinMap[T])();
    result.toGLSL = () => bi.toGLSL();

    // toWGSL 返回完整变量名
    // 对于 gl_VertexID 和 gl_InstanceID，WGSL 中是 u32 类型，需要转换为 i32
    if (builtinName === 'gl_VertexID' || builtinName === 'gl_InstanceID')
    {
        result.toWGSL = () => `i32(${bi.getFullWGSLVarName()})`;
        // 存储原始 WGSL 表达式，用于数组索引（u32 类型可直接作为索引）
        (result as any).toRawWGSL = () => bi.getFullWGSLVarName();
    }
    else
    {
        result.toWGSL = () => bi.getFullWGSLVarName();
    }

    result.dependencies = [bi];
    bi.value = result;

    // 为 gl_FragCoord 设置 _builtin 引用，用于 .y 的翻转处理
    if (builtinName === 'gl_FragCoord' && result instanceof Vec2)
    {
        result._builtin = bi;
    }

    return result;
}
