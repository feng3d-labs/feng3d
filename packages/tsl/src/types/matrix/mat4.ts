import { IElement, ShaderValue } from '../../core/IElement';
import { formatNumber } from '../../core/formatNumber';
import { Vec4 } from '../vector/vec4';

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
    constructor(...args: number[])
    {
        if (args.length === 0) return;
        if (args.length === 1)
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
        else
        {
            throw new Error('Mat4 constructor: invalid arguments');
        }
    }

    multiply<T extends Mat4 | Vec4>(other: T): T
    {
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
export function mat4(...args: any[]): Mat4
{
    return new (Mat4 as any)(...args);
}
