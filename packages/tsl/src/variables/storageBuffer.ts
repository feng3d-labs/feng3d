import { IElement, ShaderValue } from '../core/IElement';

/**
 * storage buffer 的访问模式
 * - `read`：只读（`var<storage, read>`）
 * - `read_write`：可读写（`var<storage, read_write>`）
 */
export type StorageAccess = 'read' | 'read_write';

/**
 * 创建 storage buffer 的选项
 */
export interface StorageBufferOptions<T extends ShaderValue>
{
    /** 元素类型（类型构造函数或实例） */
    elementType: T | (() => T);
    /** 访问模式（默认 `read`） */
    access?: StorageAccess;
    /** 绑定的 group（默认 0） */
    group?: number;
    /** 绑定的 binding（缺省时由 TSL 自动分配） */
    binding?: number;
    /**
     * 固定长度。
     *
     * **缺省表示运行期长度**（WGSL 的 `array<T>`，storage buffer 的常见形态）；
     * 给了长度就是 `array<T, N>`。
     */
    length?: number;
}

/**
 * storage buffer（WGSL 的 `var<storage>`）。
 *
 * 与 {@link Uniform} 的区别：
 * - 数据在 storage 地址空间（可远大于 uniform 的 64KB 限制）；
 * - 内容按**运行期长度数组**组织（`array<T>`），用 {@link index} 取元素；
 * - 有只读（`read`）与可读写（`read_write`）两种访问模式（后者仅用于 compute）；
 * - 不需要在声明时提供具体值（`Uniform` 必须有 `value`）。
 *
 * 它主要用于 **compute shader**：`@group(0) @binding(0) var<storage, read> current: array<u32>;`
 *
 * @internal 库外部不应直接使用 `new StorageBuffer()`，应使用 `storageBuffer()` 函数
 */
export class StorageBuffer<T extends ShaderValue> implements IElement
{
    dependencies: IElement[] = [];

    /** 变量名 */
    readonly name: string;

    /** 访问模式 */
    readonly access: StorageAccess;

    /** 绑定的 group */
    readonly group?: number;

    /** 绑定的 binding */
    readonly binding?: number;

    /** 元素类型的语法名（如 `u32` / `f32` / 结构体名） */
    readonly elementTypeName: string;

    /** 固定长度（缺省为运行期长度） */
    readonly length?: number;

    private _autoBinding?: number;

    /** 元素工厂（用于 `index()` 生成元素实例） */
    private readonly _createElement: () => T;

    constructor(name: string, options: StorageBufferOptions<T>)
    {
        this.name = name;
        this.access = options.access ?? 'read';
        this.group = options.group;
        this.binding = options.binding;
        this.length = options.length;

        const elementType = options.elementType;
        if (typeof elementType === 'function')
        {
            // 结构体等：类型名从定义里取（结构体的实例由构造函数产出）
            const maybeStruct = elementType as unknown as { _definition?: { name: string } };
            if (maybeStruct._definition)
            {
                this.elementTypeName = maybeStruct._definition.name;
                this._createElement = () => elementType();
            }
            else
            {
                const sample = (elementType as () => T)();
                this.elementTypeName = sample.wgslType;
                this._createElement = () => (elementType as () => T)();
            }
        }
        else
        {
            this.elementTypeName = elementType.wgslType;
            this._createElement = () => elementType;
        }
    }

    /**
     * 设置自动分配的 binding（内部使用）
     *
     * @param binding 自动分配的 binding
     */
    setAutoBinding(binding: number): void
    {
        this._autoBinding = binding;
    }

    /**
     * 获取实际使用的 binding（优先显式指定，否则自动分配）
     *
     * @returns binding 值
     */
    getEffectiveBinding(): number | undefined
    {
        return this.binding !== undefined ? this.binding : this._autoBinding;
    }

    /**
     * 获取实际使用的 group（缺省 0）
     *
     * @returns group 值
     */
    getEffectiveGroup(): number
    {
        return this.group ?? 0;
    }

    /**
     * 数组类型文本（如 `array<u32>` 或 `array<u32, 64>`）
     *
     * @param suffix 类型后缀（如 WGSL 不需要）
     * @returns 类型文本
     */
    private _arrayType(): string
    {
        return this.length === undefined
            ? `array<${this.elementTypeName}>`
            : `array<${this.elementTypeName}, ${this.length}>`;
    }

    /**
     * 取第 i 个元素（`name[i]`）
     *
     * @param index 下标（数字或 ShaderValue）
     * @returns 元素实例
     */
    index(index: number | ShaderValue): T
    {
        const result = this._createElement();
        const render = (i: number | ShaderValue, toCode: (v: ShaderValue) => string) =>
            `${this.name}[${typeof i === 'number' ? i : toCode(i)}]`;
        result.toWGSL = () => render(index, (v) => v.toWGSL());
        result.toGLSL = () => render(index, (v) => v.toGLSL());
        result.dependencies = [this];

        return result;
    }

    /**
     * 转换为 GLSL 代码
     *
     * @returns GLSL 声明
     */
    toGLSL(): string
    {
        const layout = `layout(std430, binding = ${this.getEffectiveBinding() ?? 0}) `;
        const qualifier = this.access === 'read' ? 'readonly ' : '';

        return `${layout}${qualifier}buffer ${this.name} { ${this.elementTypeName} data[]; };`;
    }

    /**
     * 转换为 WGSL 代码
     *
     * @returns WGSL 声明
     */
    toWGSL(): string
    {
        const effectiveBinding = this.getEffectiveBinding();
        const binding = effectiveBinding !== undefined ? `@binding(${effectiveBinding}) ` : '';

        return `${binding}@group(${this.getEffectiveGroup()}) var<storage, ${this.access}> ${this.name}: ${this._arrayType()};`;
    }
}

/**
 * 声明 storage buffer。
 *
 * 使用方式：
 * - `const current = storageBuffer('current', { elementType: uint })` → `var<storage, read> current: array<u32>;`
 * - `storageBuffer('next', { elementType: uint, access: 'read_write', group: 0, binding: 2 })`
 * - `const at = current.index(grid);` → `current[grid]`
 *
 * @param name 变量名
 * @param options 选项（元素类型 / 访问模式 / 绑定位置 / 长度）
 * @returns StorageBuffer 实例
 */
export function storageBuffer<T extends ShaderValue>(name: string, options: StorageBufferOptions<T>): StorageBuffer<T>
{
    return new StorageBuffer<T>(name, options);
}
