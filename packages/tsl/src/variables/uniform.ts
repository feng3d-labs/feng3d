import { IElement, ShaderValue } from '../core/IElement';

/**
 * 需要对齐的矩阵类型集合（惰性创建：模块顶层不执行 `new Set`，见 AGENTS.md §15 R2 零模块级副作用）
 */
let alignedMatrixTypes: Set<string> | undefined;

/**
 * 判断矩阵类型在 WebGPU uniform buffer 中是否需要按 vec4 对齐
 * @param wgslType WGSL 类型名
 * @returns 需要对齐时返回 true
 */
function isAlignedMatrixType(wgslType: string): boolean
{
    if (alignedMatrixTypes === undefined)
    {
        alignedMatrixTypes = new Set(['mat2x3<f32>', 'mat3x3<f32>', 'mat4x3<f32>']);
    }

    return alignedMatrixTypes.has(wgslType);
}

/**
 * Uniform 类
 * @internal 库外部不应直接使用 `new Uniform()`，应使用 `uniform()` 函数
 */
export class Uniform implements IElement
{
    dependencies: IElement[];

    readonly name: string;
    value?: ShaderValue;
    readonly binding?: number;
    readonly group?: number;
    private _autoBinding?: number; // 自动分配的 binding

    constructor(name: string, group?: number, binding?: number)
    {
        this.name = name;
        this.group = group;
        this.binding = binding;
    }

    /**
     * 设置自动分配的 binding（内部使用）
     */
    setAutoBinding(binding: number): void
    {
        this._autoBinding = binding;
    }

    /**
     * 获取实际使用的 binding（优先使用显式指定的，否则使用自动分配的）
     */
    getEffectiveBinding(): number | undefined
    {
        return this.binding !== undefined ? this.binding : this._autoBinding;
    }

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Uniform '${this.name}' 没有设置 value，无法生成 GLSL。`);
        }
        const glslType = this.value.glslType;

        return `uniform ${glslType} ${this.name};`;
    }

    /**
     * 获取实际使用的 group（缺省时使用默认值 0）
     */
    getEffectiveGroup(): number
    {
        return this.group ?? 0;
    }

    /**
     * 转换为 WGSL 代码
     */
    toWGSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Uniform '${this.name}' 没有设置 value，无法生成 WGSL。`);
        }
        const wgslType = this.value.wgslType;

        // 检测需要对齐的矩阵类型并显示警告
        if (isAlignedMatrixType(wgslType))
        {
            console.warn(
                `[TSL] ${wgslType} uniform "${this.name}" 在 WebGPU uniform buffer 中需要对齐，建议避免使用。\n`
                + `WebGPU uniform buffer 要求每列按 vec4 对齐（16 字节），会造成额外的内存开销和数据转换。\n`
                + `建议使用 mat4 代替，或将数据拆分为多个 vec3/vec4 uniform。`,
            );
        }

        const effectiveBinding = this.getEffectiveBinding();
        const effectiveGroup = this.getEffectiveGroup();
        const binding = effectiveBinding !== undefined ? `@binding(${effectiveBinding})` : '';
        const group = `@group(${effectiveGroup})`;
        const annotations = [binding, group].filter(Boolean).join(' ');
        const prefix = annotations ? `${annotations} ` : '';

        return `${prefix}var<uniform> ${this.name} : ${wgslType};`;
    }

}

/**
 * 定义 uniform 变量
 *
 * 使用方式：
 * - `const colorUni = uniform('color')` - 创建 uniform 宿主，类型由 `vec4(colorUni)` 等推断
 * - `const colorUni = uniform('color', 0, 0)` - 指定 group 和 binding
 * - `const color = vec4(uniform('color'))` - 创建 vec4 类型的值并关联到 uniform
 *
 * uniform 的类型在用 `vec2/vec3/vec4/float/mat4` 等类型构造函数包装时确定，
 * 此时构造函数会将自身设置为 uniform 的 `value`。
 *
 * @param name uniform 名称
 * @param group 可选的 group 值（默认 0）
 * @param binding 可选的 binding 值（缺省时自动分配）
 * @returns Uniform 宿主实例
 */
export function uniform(name: string): Uniform;
export function uniform(name: string, group: number): Uniform;
export function uniform(name: string, group: number, binding: number): Uniform;
export function uniform(name: string, group?: number, binding?: number): Uniform
{
    // 创建 Uniform 宿主实例，类型由后续的 vecN(uniform) 等调用确定
    return new Uniform(name, group, binding);
}

