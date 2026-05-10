import { IElement, ShaderValue } from '../core/IElement';
import { Float } from '../types/scalar/float';
import { Int } from '../types/scalar/int';
import { Vec2 } from '../types/vector/vec2';
import { Vec3 } from '../types/vector/vec3';
import { Vec4 } from '../types/vector/vec4';
import { IVec2 } from '../types/vector/ivec2';
import { Mat4 } from '../types/matrix/mat4';
import { Mat4x3 } from '../types/matrix/mat4x3';
import { Mat2 } from '../types/matrix/mat2';
import { isStructType, StructType, StructMembers, ResolveMembers, Struct } from './struct';

/**
 * 需要对齐的矩阵类型（在 WebGPU uniform buffer 中每列 vec3 需要按 vec4 对齐）
 */
const ALIGNED_MATRIX_TYPES = new Set(['mat2x3<f32>', 'mat3x3<f32>', 'mat4x3<f32>']);

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
        if (ALIGNED_MATRIX_TYPES.has(wgslType))
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
 * 支持的 uniform 类型
 */
type UniformType = Float | Int | Vec2 | Vec3 | Vec4 | IVec2 | Mat4 | Mat4x3 | Mat2;

/**
 * 定义 uniform 变量
 *
 * 使用方式：
 * - `const color = uniform('color', vec4())` - 定义 vec4 类型的 uniform
 * - `const mvp = uniform('mvp', mat4())` - 定义 mat4 类型的 uniform
 * - `const perDraw = uniform('perDraw', PerDraw)` - 定义结构体类型的 uniform
 * - `const color = uniform('color', vec4(), 0, 0)` - 指定 group 和 binding
 *
 * @param name uniform 名称
 * @param value 类型模板（用于推断类型）或结构体构造函数
 * @param group 可选的 group 值（默认 0）
 * @param binding 可选的 binding 值
 * @returns 与 value 相同类型的实例，关联到创建的 Uniform
 */
export function uniform<T extends UniformType>(name: string, value: T): T;
export function uniform<T extends UniformType>(name: string, value: T, group: number): T;
export function uniform<T extends UniformType>(name: string, value: T, group: number, binding: number): T;
export function uniform<T extends StructMembers>(name: string, value: StructType<T>): ResolveMembers<T>;
export function uniform<T extends StructMembers>(name: string, value: StructType<T>, group: number): ResolveMembers<T>;
export function uniform<T extends StructMembers>(name: string, value: StructType<T>, group: number, binding: number): ResolveMembers<T>;
/** @internal 用于 sampler2D/sampler2DArray 内部使用 */
export function uniform(name: string): Uniform;
export function uniform<T extends UniformType | StructMembers>(
    name: string,
    value?: T | StructType<any>,
    group?: number,
    binding?: number,
): T | ResolveMembers<any> | Uniform
{
    // 创建 Uniform 实例
    const uni = new Uniform(name, group, binding);

    // 内部使用：仅传入 name 时返回 Uniform 实例（用于 sampler2D/sampler2DArray）
    if (value === undefined)
    {
        return uni;
    }

    // 如果是结构体类型，创建结构体实例
    if (isStructType(value))
    {
        return new Struct(uni, value._definition) as unknown as ResolveMembers<any>;
    }

    // 创建与 value 相同类型的新实例
    const result = new ((value as UniformType).constructor as new () => UniformType)();

    // 设置双向引用
    result.toGLSL = () => name;
    result.toWGSL = () => name;
    result.dependencies = [uni];
    uni.value = result;

    return result as T;
}

