import { Vec2 } from '../../types/vector/vec2';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';
import { Float } from '../../types/scalar/float';

/**
 * 绝对值（WGSL `abs` / GLSL `abs`）。
 *
 * @param value 输入值
 * @returns 绝对值
 */
export function abs(value: Float): Float;
export function abs(value: Vec2): Vec2;
export function abs(value: Vec3): Vec3;
export function abs(value: Vec4): Vec4;
export function abs(value: Float | Vec2 | Vec3 | Vec4): Float | Vec2 | Vec3 | Vec4
{
    const ctor = (value as object).constructor as new () => Float | Vec2 | Vec3 | Vec4;
    const out = new ctor();

    out.toGLSL = () => `abs(${value.toGLSL()})`;
    out.toWGSL = () => `abs(${value.toWGSL()})`;
    out.dependencies = [value];

    return out;
}
