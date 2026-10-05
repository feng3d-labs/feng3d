import { Vec2 } from '../../types/vector/vec2';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';
import { Float } from '../../types/scalar/float';

/**
 * 向下取整（WGSL `floor` / GLSL `floor`）。
 *
 * @param value 输入值
 * @returns 向下取整后的值
 */
export function floor(value: Float): Float;
export function floor(value: Vec2): Vec2;
export function floor(value: Vec3): Vec3;
export function floor(value: Vec4): Vec4;
export function floor(value: Float | Vec2 | Vec3 | Vec4): Float | Vec2 | Vec3 | Vec4
{
    const result = (value as object).constructor as new () => Float | Vec2 | Vec3 | Vec4;
    const out = new result();

    out.toGLSL = () => `floor(${value.toGLSL()})`;
    out.toWGSL = () => `floor(${value.toWGSL()})`;
    out.dependencies = [value];

    return out;
}
