import { IElement, ShaderValue } from '../core/IElement';
import { Int } from '../types/scalar/int';
import { type StructMembers, type StructType, isStructConstructor } from './struct';
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

    // 结构体元素：保存构造函数与父 uniform（`index()` 时用来构造元素实例）
    private _structCtor?: StructType<StructMembers>;
    private _parentUniform?: import('./uniform').Uniform;
    // 结构体元素的工厂：给定"元素访问路径"返回该元素的实例。
    // 由 struct.ts 在绑定时注入（避免 array.ts 反向依赖 struct.ts 造成循环）。
    private _structElementFactory?: (path: string) => T;

    constructor(elementType: T, length: number)
    {
        this.length = length;

        // 结构体元素（如 `array(PointLightData, 8)`）：类型名就是结构体名，
        // 且元素实例必须由"父 uniform"构造（结构体实例的成员访问路径要挂在它上面），
        // 所以这里只记下构造函数，等绑定 uniform 时再用。
        if (isStructConstructor(elementType))
        {
            this._structCtor = elementType as unknown as StructType<StructMembers>;
            this.glslType = this._structCtor._definition.name;
            this.wgslType = this._structCtor._definition.name;
            this.elementType = (() =>
            {
                if (!this._parentUniform)
                {
                    throw new Error(`结构体数组 '${this.wgslType}' 需要先绑定 uniform（应作为 struct 成员使用）`);
                }

                return this._structCtor!(this._parentUniform) as unknown as T;
            }) as () => T;

            return;
        }

        // elementType 可能是构造器函数（如 mat4/vec4）或实例；
        // 统一转换为实例以获取类型信息
        const instance: T = typeof elementType === 'function'
            ? new (elementType as new () => T)()
            : elementType;
        // 使用实例的构造函数作为工厂函数
        this.elementType = (() => new (instance.constructor as new () => T)()) as () => T;

        // 从实例获取类型信息
        this.glslType = instance.glslType;
        this.wgslType = instance.wgslType;
    }

    /**
     * 元素类型是否是结构体；是则返回它的构造函数（供结构体定义收集嵌套声明用）。
     *
     * @returns 结构体构造函数，非结构体元素时为 undefined
     */
    get _elementStructCtor(): StructType<StructMembers> | undefined
    {
        return this._structCtor;
    }

    /**
     * 克隆一个"同元素类型、同长度"的数组（供 struct 成员复制用）。
     *
     * 与 `new TSLArray(this.elementType(), this.length)` 的区别：**不调用 `elementType()`**——
     * 结构体元素在那个时点还没绑定父 uniform，调用会抛错。
     *
     * @returns 新的数组实例
     */
    _clone(): Array<T>
    {
        if (this._structCtor)
        {
            return new Array<T>(this._structCtor as unknown as T, this.length);
        }

        return new Array<T>(this.elementType(), this.length);
    }

    /**
     * 绑定父 uniform（结构体数组的元素实例要用它构造）。
     *
     * @param uniform 父 uniform
     */
    _setParentUniform(uniform: import('./uniform').Uniform): void
    {
        this._parentUniform = uniform;
    }

    /**
     * 注入结构体元素的工厂（由 struct.ts 提供，参数是元素的访问路径）。
     *
     * @param factory 工厂函数
     */
    _setStructElementFactory(factory: (path: string) => T): void
    {
        this._structElementFactory = factory;
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
        // 默认渲染成**数组构造字面量**：这样"局部数组"（未绑定变量名/访问路径）也能被
        // index() 正确渲染——否则 this.toWGSL 未定义，索引会崩（updateSprites/points 踩到过）。
        this.toGLSL = () => this.toGLSLInit();
        this.toWGSL = () => this.toWGSLInit();
        this._values = values;
        this.dependencies = values;
    }

    /**
     * 是否带初始化值（`arrayWithValues` 创建或 `initValues` 设置过）。
     *
     * @returns 有值时返回 true
     */
    get hasValues(): boolean
    {
        return this._values !== undefined;
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
        // 结构体元素：元素实例的成员访问路径要带上下标（如 lights.u_pointLights[0].position），
        // 这由 struct.ts 注入的工厂负责构造（它知道父 uniform 与结构体定义）
        if (this._structElementFactory)
        {
            const idxText = typeof idx === 'number' ? `${idx}` : (idx.toRawWGSL?.() ?? idx.toWGSL());
            const result = this._structElementFactory(`${this.toWGSL()}[${idxText}]`);

            return result;
        }

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
export function array<T extends ShaderValue>(element: T | (() => T) | StructType<StructMembers>, length: number): Array<T>
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
