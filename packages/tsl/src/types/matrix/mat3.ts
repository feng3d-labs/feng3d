import { IElement, ShaderValue } from '../../core/IElement';
import { bindToVariableHost, isVariableHost, type VariableHost } from '../../core/variableHost';
import { formatNumber } from '../../core/formatNumber';
import { Vec3 } from '../vector/vec3';
import type { Int } from '../scalar/int';

/**
 * Mat3 类，用于表示 mat3 字面量值
 * @internal 库外部不应直接使用 `new Mat3()`，应使用 `mat3()` 函数
 */
export class Mat3 implements ShaderValue
{
    readonly glslType = 'mat3';
    readonly wgslType = 'mat3x3<f32>';

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
            // 处理数字字面量：mat3(1.0) 创建对角矩阵
            const value = args[0];
            const glslValue = formatNumber(value);
            // GLSL: mat3(1.0) 创建对角矩阵
            this.toGLSL = () => `mat3(${glslValue})`;
            // WGSL: 需要显式构造对角矩阵
            this.toWGSL = () =>
            {
                const v = glslValue;

                return `mat3x3<f32>(vec3<f32>(${v}, 0.0, 0.0), vec3<f32>(0.0, ${v}, 0.0), vec3<f32>(0.0, 0.0, ${v}))`;
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
            throw new Error('Mat3 constructor: invalid arguments');
        }
    }

    /**
     * 动态索引访问列向量（WGSL 的 `m[i]`，返回 vec3）。
     *
     * @param idx 列索引（数字常量或 Int 表达式）
     * @returns 该列向量
     */
    index(idx: number | Int): Vec3
    {
        const idxGLSL = () => (typeof idx === 'number' ? `${idx}` : idx.toGLSL());
        const idxWGSL = () => (typeof idx === 'number' ? `${idx}` : idx.toWGSL());
        const result = new Vec3(0, 0, 0);
        result.toGLSL = () => `${this.toGLSL()}[${idxGLSL()}]`;
        result.toWGSL = () => `${this.toWGSL()}[${idxWGSL()}]`;
        result.dependencies = typeof idx === 'number' ? [this] : [this, idx as unknown as IElement];

        return result;
    }

    multiply<T extends Mat3 | Vec3>(other: T): T
    {
        if (other instanceof Vec3)
        {
            const vec3 = new Vec3(0, 0, 0);
            vec3.toGLSL = () => `${this.toGLSL()} * ${other.toGLSL()}`;
            vec3.toWGSL = () => `${this.toWGSL()} * ${other.toWGSL()}`;
            vec3.dependencies = [this, other];

            return vec3 as T;
        }
        else
        {
            const mat3 = new Mat3();
            mat3.toGLSL = () => `${this.toGLSL()} * ${other.toGLSL()}`;
            mat3.toWGSL = () => `${this.toWGSL()} * ${other.toWGSL()}`;
            mat3.dependencies = [this, other];

            return mat3 as T;
        }
    }
}

/**
 * mat3 构造函数
 *
 * 支持以下用法：
 * - `mat3()` - 创建空的 Mat3 实例（用于 uniform/attribute 类型推断）
 * - `mat3(1.0)` - 创建对角矩阵（单位矩阵用 mat3(1.0)）
 */
export function mat3(): Mat3;
export function mat3(diagonal: number): Mat3;
/**
 * mat3 构造函数
 * @param host 变量宿主（uniform / attribute / varying），类型由宿主承载
 */
export function mat3(host: VariableHost): Mat3;
/**
 * mat3 构造函数：用 3 个列向量构造矩阵（WGSL 的 `mat3x3<f32>(c0, c1, c2)`）。
 *
 * 粒子公告牌矩阵（旋转矩阵）就是这种构造方式。
 *
 * @param c0 第 0 列
 * @param c1 第 1 列
 * @param c2 第 2 列
 */
export function mat3(c0: Vec3, c1: Vec3, c2: Vec3): Mat3;
export function mat3(...args: (number | VariableHost | Vec3)[]): Mat3
{
    // 3 个列向量 → 矩阵字面量
    if (args.length === 3 && args.every((arg) => arg instanceof Vec3))
    {
        const columns = args as Vec3[];
        const result = new Mat3();
        result.toGLSL = () => `mat3(${columns.map((col) => col.toGLSL()).join(', ')})`;
        result.toWGSL = () => `mat3x3<f32>(${columns.map((col) => col.toWGSL()).join(', ')})`;
        result.dependencies = columns;

        return result;
    }

    return new (Mat3 as new (...args: (number | VariableHost)[]) => Mat3)(...args as (number | VariableHost)[]);
}
