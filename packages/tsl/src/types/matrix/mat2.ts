import { IElement, ShaderValue } from '../../core/IElement';
import { formatNumber } from '../../core/formatNumber';
import { Vec2 } from '../vector/vec2';
import { Float } from '../scalar/float';

/**
 * Mat2 类，用于表示 mat2 字面量值
 * @internal 库外部不应直接使用 `new Mat2()`，应使用 `mat2()` 函数
 */
export class Mat2 implements ShaderValue
{
    readonly glslType = 'mat2';
    readonly wgslType = 'mat2x2<f32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor();
    constructor(diagonal: number);
    constructor(col0: Vec2, col1: Vec2);
    constructor(m00: Float | number, m01: Float | number, m10: Float | number, m11: Float | number);
    constructor(...args: (number | Float | Vec2)[])
    {
        if (args.length === 0) return;
        if (args.length === 1 && typeof args[0] === 'number')
        {
            // 处理数字字面量：mat2(1.0) 创建对角矩阵
            const value = args[0];
            const glslValue = formatNumber(value);
            // GLSL: mat2(1.0) 创建对角矩阵
            this.toGLSL = () => `mat2(${glslValue})`;
            // WGSL: 需要显式构造对角矩阵
            this.toWGSL = () => `mat2x2<f32>(vec2<f32>(${glslValue}, 0.0), vec2<f32>(0.0, ${glslValue}))`;
            this.dependencies = [];
        }
        else if (args.length === 2)
        {
            // mat2(col0, col1) - 从两个列向量构造
            const col0 = args[0] as Vec2;
            const col1 = args[1] as Vec2;

            this.toGLSL = () => `mat2(${col0.toGLSL()}, ${col1.toGLSL()})`;
            this.toWGSL = () => `mat2x2<f32>(${col0.toWGSL()}, ${col1.toWGSL()})`;
            this.dependencies = [col0, col1];
        }
        else if (args.length === 4)
        {
            // mat2(m00, m01, m10, m11) - 按列优先顺序构造
            // GLSL mat2 按列优先存储: mat2(a, b, c, d) = | a c |
            //                                            | b d |
            const deps: IElement[] = [];
            const formatArg = (arg: Float | number, forWGSL: boolean): string =>
            {
                if (arg instanceof Float)
                {
                    deps.push(arg);

                    return forWGSL ? arg.toWGSL() : arg.toGLSL();
                }

                return formatNumber(arg as number);
            };

            const m00 = args[0] as Float | number;
            const m01 = args[1] as Float | number;
            const m10 = args[2] as Float | number;
            const m11 = args[3] as Float | number;

            this.toGLSL = () => `mat2(${formatArg(m00, false)}, ${formatArg(m01, false)}, ${formatArg(m10, false)}, ${formatArg(m11, false)})`;
            this.toWGSL = () => `mat2x2<f32>(${formatArg(m00, true)}, ${formatArg(m01, true)}, ${formatArg(m10, true)}, ${formatArg(m11, true)})`;
            this.dependencies = deps;
        }
        else
        {
            throw new Error('Mat2 constructor: invalid arguments');
        }
    }

    /**
     * 矩阵与向量乘法
     */
    multiply(other: Vec2): Vec2;
    /**
     * 矩阵与矩阵乘法
     */
    multiply(other: Mat2): Mat2;
    multiply(other: Vec2 | Mat2): Vec2 | Mat2
    {
        if (other instanceof Vec2)
        {
            const vec2 = new Vec2();
            vec2.toGLSL = () => `${this.toGLSL()} * ${other.toGLSL()}`;
            vec2.toWGSL = () => `${this.toWGSL()} * ${other.toWGSL()}`;
            vec2.dependencies = [this, other];

            return vec2;
        }
        else
        {
            const mat2 = new Mat2();
            mat2.toGLSL = () => `${this.toGLSL()} * ${other.toGLSL()}`;
            mat2.toWGSL = () => `${this.toWGSL()} * ${other.toWGSL()}`;
            mat2.dependencies = [this, other];

            return mat2;
        }
    }
}

/**
 * mat2 构造函数
 *
 * 支持以下用法：
 * - `mat2(uniform('matrix'))` - 从 uniform 创建
 * - `mat2(attribute('matrix'))` - 从 attribute 创建
 * - `mat2(1.0)` - 创建对角矩阵（单位矩阵用 mat2(1.0)）
 * - `mat2(col0, col1)` - 从两个列向量创建
 * - `mat2(m00, m01, m10, m11)` - 按列优先顺序创建（与 GLSL 一致）
 *
 * @example
 * ```ts
 * // 创建旋转矩阵
 * const cos_r = cos(angle);
 * const sin_r = sin(angle);
 * const rot = mat2(cos_r, sin_r, sin_r.negate(), cos_r);
 * // 或使用列向量
 * const rot = mat2(vec2(cos_r, sin_r), vec2(sin_r.negate(), cos_r));
 * ```
 */
export function mat2(): Mat2;
export function mat2(diagonal: number): Mat2;
export function mat2(col0: Vec2, col1: Vec2): Mat2;
export function mat2(m00: Float | number, m01: Float | number, m10: Float | number, m11: Float | number): Mat2;
export function mat2(...args: any[]): Mat2
{
    return new (Mat2 as any)(...args);
}

