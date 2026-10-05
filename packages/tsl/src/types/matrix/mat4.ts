import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../scalar/float';
import { bindToVariableHost, isVariableHost, type VariableHost } from '../../core/variableHost';
import { formatNumber } from '../../core/formatNumber';
import { Vec4 } from '../vector/vec4';
import type { Int } from '../scalar/int';

/**
 * Mat4 类，用于表示 mat4 字面量值
 * @internal 库外部不应直接使用 `new Mat4()`，应使用 `mat4()` 函数
 */
export class Mat4 implements ShaderValue
{
    readonly glslType = 'mat4';
    readonly wgslType = 'mat4x4<f32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor();
    constructor(diagonal: number);
    /** 从变量宿主（uniform / attribute / varying）构造，类型由宿主承载 */
    constructor(host: VariableHost);
    constructor(...args: (number | VariableHost)[])
    {
        if (args.length === 0) return;
        if (args.length === 1 && typeof args[0] === 'number')
        {
            // 处理数字字面量：mat4(1.0) 创建对角矩阵
            const value = args[0];
            const glslValue = formatNumber(value);
            // GLSL: mat4(1.0) 创建对角矩阵
            this.toGLSL = () => `mat4(${glslValue})`;
            // WGSL: 需要显式构造对角矩阵
            this.toWGSL = () =>
            {
                const v = glslValue;

                return `mat4x4<f32>(vec4<f32>(${v}, 0.0, 0.0, 0.0), vec4<f32>(0.0, ${v}, 0.0, 0.0), vec4<f32>(0.0, 0.0, ${v}, 0.0), vec4<f32>(0.0, 0.0, 0.0, ${v}))`;
            };
            this.dependencies = [];
        }
        else if (args.length === 1 && isVariableHost(args[0]))
        {
            // 从变量宿主（Uniform/Attribute/Varying）构造：将此实例作为宿主的类型值
            bindToVariableHost(this, args[0]);
        }
        else
        {
            throw new Error('Mat4 constructor: invalid arguments');
        }
    }

    /**
     * 动态索引访问列向量（WGSL 的 `m[i]`，返回 vec4）。
     *
     * 只提供矩阵字面量与乘法时无法表达 `viewMatrix[0].xyz`（天空盒去平移）这类用法。
     *
     * @param idx 列索引（数字常量或 Int 表达式）
     * @returns 该列向量
     */
    index(idx: number | Int): Vec4
    {
        const idxGLSL = () => (typeof idx === 'number' ? `${idx}` : idx.toGLSL());
        const idxWGSL = () => (typeof idx === 'number' ? `${idx}` : idx.toWGSL());
        const result = new Vec4(0, 0, 0, 0);
        result.toGLSL = () => `${this.toGLSL()}[${idxGLSL()}]`;
        result.toWGSL = () => `${this.toWGSL()}[${idxWGSL()}]`;
        result.dependencies = typeof idx === 'number' ? [this] : [this, idx as unknown as IElement];

        return result;
    }

    /**
     * 矩阵乘**标量**（WGSL / GLSL 的 `mat4 * f32`）——手写的蒙皮权重相乘就是这个形态。
     *
     * @param other 标量
     * @returns 相乘后的矩阵
     */
    /**
     * 矩阵逐元素相加（手写的蒙皮权重求和就是 `m0 + m1 + m2 + m3`）
     *
     * @param other 另一个矩阵
     * @returns 相加后的矩阵
     */
    add(other: Mat4): Mat4
    {
        const result = new Mat4();
        result.toGLSL = () => `(${this.toGLSL()} + ${other.toGLSL()})`;
        result.toWGSL = () => `(${this.toWGSL()} + ${other.toWGSL()})`;
        result.dependencies = [this, other];

        return result;
    }

    multiply(other: Float | number): Mat4;
    multiply<T extends Mat4 | Vec4>(other: T): T;
    multiply<T extends Mat4 | Vec4>(other: T | Float | number): T | Mat4
    {
        if (other instanceof Float || typeof other === 'number')
        {
            const scale = other;
            const mat4 = new Mat4();
            const rhs = () => (typeof scale === 'number' ? `${scale}` : scale.toGLSL());
            const rhsW = () => (typeof scale === 'number' ? `${scale}` : scale.toWGSL());

            mat4.toGLSL = () => `(${this.toGLSL()} * ${rhs()})`;
            mat4.toWGSL = () => `(${this.toWGSL()} * ${rhsW()})`;
            mat4.dependencies = typeof scale === 'number' ? [this] : [this, scale];

            return mat4;
        }
        if (other instanceof Vec4)
        {
            const vec4 = new Vec4(0, 0, 0, 0);
            vec4.toGLSL = () => `${this.toGLSL()} * ${other.toGLSL()}`;
            vec4.toWGSL = () => `${this.toWGSL()} * ${other.toWGSL()}`;
            vec4.dependencies = [this, other];

            return vec4 as T;
        }
        else
        {
            const mat4 = new Mat4();
            mat4.toGLSL = () => `${this.toGLSL()} * ${other.toGLSL()}`;
            mat4.toWGSL = () => `${this.toWGSL()} * ${other.toWGSL()}`;
            mat4.dependencies = [this, other];

            return mat4 as T;
        }
    }
}

/**
 * mat4 构造函数
 *
 * 支持以下用法：
 * - `mat4()` - 创建空的 Mat4 实例（用于 uniform/attribute 类型推断）
 * - `mat4(1.0)` - 创建对角矩阵（单位矩阵用 mat4(1.0)）
 */
export function mat4(): Mat4;
export function mat4(diagonal: number): Mat4;
/**
 * mat4 构造函数
 * @param host 变量宿主（uniform / attribute / varying），类型由宿主承载
 */
export function mat4(host: VariableHost): Mat4;
/**
 * mat4 构造函数：用 4 个列向量构造矩阵（WGSL 的 `mat4x4<f32>(c0, c1, c2, c3)`）。
 *
 * @param c0 第 0 列
 * @param c1 第 1 列
 * @param c2 第 2 列
 * @param c3 第 3 列
 */
export function mat4(c0: Vec4, c1: Vec4, c2: Vec4, c3: Vec4): Mat4;
export function mat4(...args: (number | VariableHost | Vec4)[]): Mat4
{
    // 4 个列向量 → 矩阵字面量（天空盒用它去掉视图矩阵的平移分量）
    if (args.length === 4 && args.every((arg) => arg instanceof Vec4))
    {
        const columns = args as Vec4[];
        const result = new Mat4();
        result.toGLSL = () => `mat4(${columns.map((col) => col.toGLSL()).join(', ')})`;
        result.toWGSL = () => `mat4x4<f32>(${columns.map((col) => col.toWGSL()).join(', ')})`;
        result.dependencies = columns;

        return result;
    }

    return new (Mat4 as new (...args: (number | VariableHost)[]) => Mat4)(...args as (number | VariableHost)[]);
}
