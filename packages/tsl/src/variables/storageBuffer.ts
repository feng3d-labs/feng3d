import { IElement, ShaderValue } from '../core/IElement';
import { createStructInstance, type StructDefinition, type StructMembers, type StructType, isStructConstructor } from './struct';

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
    /** 元素类型（类型构造函数、实例，或**结构体构造函数**） */
    elementType: T | (() => T) | StructType<StructMembers>;
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
    /**
     * 是否按数组声明（默认 true）。
     *
     * 设为 false 时声明成**单个值**——如 `var<storage, read> size: vec2<u32>;`
     * （gameOfLife 的 `size` 就是这种形态）。
     */
    array?: boolean;
    /**
     * 地址空间（默认 `'storage'`）。
     *
     * 设为 `'workgroup'` 时声明为**工作组共享内存**：`var<workgroup> local_data: array<u32, 256>;`
     * ——**没有 `@group/@binding`**，只在 compute 里可见，同一工作组的调用共享它。
     * 写入后读之前要 `workgroupBarrier()`。
     */
    addressSpace?: 'storage' | 'workgroup';
    /**
     * 是否声明为**原子类型**（`atomic<u32>`）。
     *
     * 原子变量**不能直接读写**，要用 {@link atomicAdd} / {@link atomicLoad} 等操作访问。
     */
    atomic?: boolean;
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

    /** 是否按数组声明 */
    readonly isArray: boolean;

    /** 地址空间（storage / workgroup） */
    readonly addressSpace: 'storage' | 'workgroup';

    /** 是否声明为原子类型（atomic<T>） */
    readonly isAtomic: boolean;

    private _autoBinding?: number;

    /** 元素工厂（用于 `index()` 生成元素实例） */
    private readonly _createElement: () => T;

    /** 元素的结构体定义（元素不是结构体时为 undefined） */
    readonly elementStructDef?: StructDefinition<StructMembers>;

    constructor(name: string, options: StorageBufferOptions<T>)
    {
        this.name = name;
        this.access = options.access ?? 'read';
        this.group = options.group;
        this.binding = options.binding;
        this.length = options.length;
        this.isArray = options.array !== false;
        this.addressSpace = options.addressSpace ?? 'storage';
        this.isAtomic = options.atomic === true;

        const elementType = options.elementType;
        if (isStructConstructor(elementType))
        {
            // 结构体元素：类型名取结构体名；元素实例由"父 uniform + 路径"构造
            // （与 array(struct) 的成员访问一致，见 variables/struct.ts）
            this.elementTypeName = elementType._definition.name;
            this.elementStructDef = elementType._definition;
            // 结构体的构造函数要求一个 uniform 参数；storage 的元素不需要成员路径前缀，
            // 这里给一个占位（元素实例只用于取值/赋值表达式，不参与声明）。
            this._createElement = () =>
            {
                throw new Error(`storage buffer '${this.name}' 的元素是结构体，请用 index(i) 取成员（如 particles[0].pos）`);
            };
        }
        else if (typeof elementType === 'function')
        {
            const sample = (elementType as () => T)();
            this.elementTypeName = sample.wgslType;
            this._createElement = () => (elementType as () => T)();
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
    private _storageType(): string
    {
        const inner = this.isAtomic ? `atomic<${this.elementTypeName}>` : this.elementTypeName;

        if (!this.isArray)
        {
            return inner;
        }

        return this.length === undefined
            ? `array<${inner}>`
            : `array<${inner}, ${this.length}>`;
    }

    /**
     * 单值 storage 的**值引用**（`toWGSL` 就是变量名本身）。
     *
     * 只对 `array: false` 有意义；数组形态请用 {@link index}。
     *
     * @returns 可直接参与运算的值
     */
    value(): T
    {
        if (this.isArray)
        {
            throw new Error(`storage buffer '${this.name}' 是数组声明，请用 index(i) 取元素`);
        }

        const result = this._createElement();
        result.toGLSL = () => this.name;
        result.toWGSL = () => this.name;
        result.dependencies = [this];

        return result;
    }

    /**
     * 取第 i 个元素（`name[i]`）
     *
     * @param index 下标（数字或 ShaderValue）
     * @returns 元素实例
     */
    index(index: number | ShaderValue): T
    {
        if (!this.isArray)
        {
            throw new Error(`storage buffer '${this.name}' 是单值声明（array: false），不能下标访问；请直接当作变量使用`);
        }

        // 结构体元素：成员访问器必须在**构造时**绑定"父路径 + 下标"，
        // 所以直接构造一个带路径的结构体实例（如 particles[0].pos）。
        if (this.elementStructDef)
        {
            const idxText = typeof index === 'number' ? `${index}` : index.toWGSL();

            // 把自己作为"依赖宿主"传进去：成员的 dependencies 里要有本 storage buffer，
            // 否则 analyzeDependencies 收集不到它（生成时就会缺声明与 struct 定义）
            return createStructInstance(this, this.elementStructDef, `${this.name}[${idxText}]`) as unknown as T;
        }

        const result = this._createElement();
        const render = (i: number | ShaderValue, toCode: (v: ShaderValue) => string) =>
            `${this.name}[${typeof i === 'number' ? i : toCode(i)}]`;
        result.toWGSL = () => render(index, (v) => v.toWGSL());
        result.toGLSL = () => render(index, (v) => v.toGLSL());
        // **必须带上索引表达式**：它本身可能依赖别的 storage / 函数调用
        // （如 current[getIndex(x, y)]——漏掉就会让 getIndex 内部用到的 size 收集不到）
        result.dependencies = typeof index === 'number' ? [this] : [this, index];

        return result;
    }

    /**
     * 转换为 GLSL 代码
     *
     * @returns GLSL 声明
     */
    toGLSL(): string
    {
        // 工作组共享内存：GLSL 的 `shared`（无 binding）
        if (this.addressSpace === 'workgroup')
        {
            const size = this.length === undefined ? '' : `[${this.length}]`;

            return `shared ${this.elementTypeName} ${this.name}${size};`;
        }

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
        // 工作组共享内存：没有 @group/@binding
        if (this.addressSpace === 'workgroup')
        {
            return `var<workgroup> ${this.name}: ${this._storageType()};`;
        }

        const effectiveBinding = this.getEffectiveBinding();
        const binding = effectiveBinding !== undefined ? `@binding(${effectiveBinding}) ` : '';

        return `${binding}@group(${this.getEffectiveGroup()}) var<storage, ${this.access}> ${this.name}: ${this._storageType()};`;
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
