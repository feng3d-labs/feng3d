import { Vec2 } from '../../types/vector/vec2';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';
import { Float } from '../../types/scalar/float';

/**
 * 饱和（把值夹到 [0, 1]）。
 *
 * WGSL 没有 `saturate` 内置，生成 `clamp(x, 0.0, 1.0)`（与 HLSL/GLSL 的 `saturate` 语义一致）。
 *
 * @param value 输入值
 * @returns 夹到 [0,1] 的值
 */
export function saturate(value: Float): Float;
export function saturate(value: Vec2): Vec2;
export function saturate(value: Vec3): Vec3;
export function saturate(value: Vec4): Vec4;
export function saturate(value: Float | Vec2 | Vec3 | Vec4): Float | Vec2 | Vec3 | Vec4
{
    const Ctor = (value as object).constructor as new () => Float | Vec2 | Vec3 | Vec4;
    const out = new Ctor();
    const suffix = value instanceof Float ? '' : '';

    out.toGLSL = () => `clamp(${value.toGLSL()}, 0.0${suffix}, 1.0${suffix})`;
    // WGSL 的 clamp(vecN, float, float) 不合法，标量边界要逐分量展开
    out.toWGSL = () =>
    {
        const type = value.wgslType;

        return type === 'f32'
            ? `clamp(${value.toWGSL()}, 0.0, 1.0)`
            : `clamp(${value.toWGSL()}, ${type}(0.0), ${type}(1.0))`;
    };
    out.dependencies = [value];

    return out;
}
