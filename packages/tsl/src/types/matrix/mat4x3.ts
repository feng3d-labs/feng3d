import { IElement, ShaderValue } from '../../core/IElement';
import { wrapForSwizzle } from '../../core/expressionUtils';
import { Vec3 } from '../vector/vec3';
import { Vec4 } from '../vector/vec4';

/**
 * Mat4x3 类，用于表示 mat4x3（4列3行）非方阵字面量值
 *
 * mat4x3 是 4 列 3 行的矩阵：
 * - GLSL: mat4x3（列主序，4 个 vec3 列向量）
 * - WGSL: mat4x3<f32>
 *
 * **注意**：WebGPU uniform buffer 中 mat4x3 每列需要按 vec4 对齐（16 字节）。
 * 紧凑格式（12 float）在 WebGL 可用，但 WebGPU 需要对齐格式（16 float）。
 * render-api 会自动处理这种格式转换。
 *
 * @internal 库外部不应直接使用 `new Mat4x3()`，应使用 `mat4x3()` 函数
 */
export class Mat4x3 implements ShaderValue
{
    readonly glslType = 'mat4x3';
    readonly wgslType = 'mat4x3<f32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor()
    {
    }

    /**
     * 矩阵与 vec4 相乘，返回 vec3
     * mat4x3 * vec4 -> vec3
     */
    multiply(other: Vec4): Vec3
    {
        const vec3 = new Vec3();
        vec3.toGLSL = () => `${this.toGLSL()} * ${other.toGLSL()}`;
        vec3.toWGSL = () => `${this.toWGSL()} * ${other.toWGSL()}`;
        vec3.dependencies = [this, other];

        return vec3;
    }

    /**
     * 通过索引访问矩阵的列（返回 Vec3）
     * mat4x3[0] 返回第一列，mat4x3[3] 返回第四列（平移向量）
     */
    col(index: number): Vec3
    {
        const vec3 = new Vec3();
        vec3.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}[${index}]`;
        vec3.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}[${index}]`;
        vec3.dependencies = [this];

        return vec3;
    }
}

/**
 * mat4x3 构造函数
 */
export function mat4x3(): Mat4x3;
export function mat4x3(...args: any[]): Mat4x3
{
    return new (Mat4x3 as any)(...args);
}
