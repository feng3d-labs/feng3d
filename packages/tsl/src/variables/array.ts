import { IElement, ShaderValue } from '../core/IElement';
import { Mat4 } from '../types/matrix/mat4';
import { Int } from '../types/scalar/int';
import { UInt } from '../types/scalar/uint';
import { Vec4 } from '../types/vector/vec4';

/**
 * 数组类型定义，支持通过 index() 方法访问元素
 */
export class Array<T extends ShaderValue> implements ShaderValue
{
    readonly elementType: (...args: any[]) => T;
    readonly length: number;
    readonly glslType: string;
    readonly wgslType: string;

    // ShaderValue 接口实现
    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[] = [];

    // 用于动态索引的访问路径
    private _varName?: string;

    constructor(elementType: T, length: number)
    {
        // 使用实例的构造函数作为工厂函数
        this.elementType = (() => new ((elementType as any).constructor)()) as (...args: any[]) => T;
        this.length = length;

        // 从实例获取类型信息
        this.glslType = elementType.glslType;
        this.wgslType = elementType.wgslType;
    }

    /**
     * 设置访问路径（用于 struct 成员）
     */
    _setAccessPath(parentGLSL: string, parentWGSL: string, memberName: string): this
    {
        this.toGLSL = () => `${parentGLSL}.${memberName}`;
        this.toWGSL = () => `${parentWGSL}.${memberName}`;

        return this;
    }

    /**
     * 设置变量名（用于 var_ 声明）
     */
    _setVarName(name: string): this
    {
        this._varName = name;
        this.toGLSL = () => name;
        this.toWGSL = () => name;

        return this;
    }

    /**
     * 索引数组元素
     * @param idx 索引，可以是数字、Int 或 UInt
     */
    index(idx: number | Int | UInt): T
    {
        const result = this.elementType();

        // 动态计算索引字符串，确保在 toGLSL/toWGSL 调用时获取最新值
        result.toGLSL = () =>
        {
            const idxGLSL = typeof idx === 'number' ? `${idx}` : idx.toGLSL();

            return `${this.toGLSL()}[${idxGLSL}]`;
        };

        result.toWGSL = () =>
        {
            let idxWGSL: string;
            if (typeof idx === 'number')
            {
                idxWGSL = `${idx}`;
            }
            else if ((idx as any).toRawWGSL)
            {
                // 使用原始 WGSL 表达式（不带类型转换），如 gl_InstanceID/gl_VertexID
                idxWGSL = (idx as any).toRawWGSL();
            }
            else
            {
                idxWGSL = idx.toWGSL();
            }

            return `${this.toWGSL()}[${idxWGSL}]`;
        };

        // 将数组自身和索引添加到依赖中，以便依赖分析能够找到结构体定义
        result.dependencies = typeof idx === 'number' ? [this] : [this, idx];

        return result;
    }
}

/**
 * 创建数组类型（用于 UBO 数组成员）
 * @param element 元素类型实例（如 mat4(), vec4() 等）
 * @param length 数组长度
 * @returns 数组类型实例
 */
export function array<T extends Mat4 | Vec4>(element: T, length: number): Array<T>
{
    return new Array<T>(element, length);
}
