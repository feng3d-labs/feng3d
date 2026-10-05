import { IElement, ShaderValue } from '../core/IElement';
import { Int } from '../types/scalar/int';
import { UInt } from '../types/scalar/uint';

/**
 * 数组类型定义，支持通过 index() 方法访问元素
 */
export class Array<T extends ShaderValue> implements ShaderValue
{
    readonly elementType: () => T;
    readonly length: number;
    readonly glslType: string;
    readonly wgslType: string;

    // ShaderValue 接口实现
    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[] = [];

    // 用于动态索引的访问路径
    private _varName?: string;

    // 初始化值列表（数组字面量）
    private _values?: T[];

    constructor(elementType: T, length: number)
    {
        // elementType 可能是构造器函数（如 mat4/vec4）或实例；
        // 统一转换为实例以获取类型信息
        const instance: T = typeof elementType === 'function'
            ? new (elementType as new () => T)()
            : elementType;
        // 使用实例的构造函数作为工厂函数
        this.elementType = (() => new (instance.constructor as new () => T)()) as () => T;
        this.length = length;

        // 从实例获取类型信息
        this.glslType = instance.glslType;
        this.wgslType = instance.wgslType;
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
     * 设置初始化值（生成数组字面量）。
     *
     * 带值后 `toWGSL()` 返回 `array<T, N>(v0, v1, ...)`（WGSL 的数组构造），
     * 不带值时它只是"数组类型"（供 struct 成员使用）。
     *
     * @param values 元素值列表
     */
    initValues(values: T[]): void
    {
        this._values = values;
        this.dependencies = values;
    }

    /**
     * 生成数组的**初始化表达式**（字面量），供声明处使用。
     *
     * 与 `toWGSL()` 分开：`initValues` 之后实例本身仍可被 `_setVarName` 覆盖成"变量名"
     * （引用处要用名字，声明处要字面量，两者不能共用一个方法）。
     *
     * @returns 数组字面量的 WGSL 文本
     */
    toWGSLInit(): string
    {
        if (this._values === undefined) return this.toWGSL();

        return `array<${this.wgslType}, ${this._values.length}>(${this._values.map((v) => v.toWGSL()).join(', ')})`;
    }

    /**
     * 生成数组的初始化表达式（字面量），供 GLSL 声明处使用。
     *
     * @returns 数组字面量的 GLSL 文本
     */
    toGLSLInit(): string
    {
        if (this._values === undefined) return this.toGLSL();

        return `${this.glslType}[${this._values.length}](${this._values.map((v) => v.toGLSL()).join(', ')})`;
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
            else if (idx.toRawWGSL)
            {
                // 使用原始 WGSL 表达式（不带类型转换），如 gl_InstanceID/gl_VertexID
                idxWGSL = idx.toRawWGSL();
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
 * @param element 元素类型实例（如 mat4(), vec4()）或类型构造函数（如 mat4, vec4）
 * @param length 数组长度
 * @returns 数组类型实例
 */
export function array<T extends ShaderValue>(element: T | (() => T), length: number): Array<T>
{
    return new Array<T>(element as T, length);
}

/**
 * 创建带初始值的数组表达式（对应 WGSL 的 `array<T, N>(v0, v1, ...)`）。
 *
 * 用于 `var_('pos', arrayWithValues(vec3, [...36 个顶点...]))` 这类模块级常量数组。
 *
 * @param element 元素类型实例或构造函数
 * @param values 元素值列表
 * @returns 数组表达式
 */
export function arrayWithValues<T extends ShaderValue>(element: T | (() => T), values: T[]): Array<T>
{
    const result = new Array<T>(element as T, values.length);
    result.initValues(values);

    return result;
}
