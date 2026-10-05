import { Float } from '../../types/scalar/float';
import type { Vec2 } from '../../types/vector/vec2';
import type { Vec3 } from '../../types/vector/vec3';
import type { Vec4 } from '../../types/vector/vec4';

/**
 * `distance`：两点距离（WGSL/GLSL 同名内置函数）。
 *
 * @param a 第一个点
 * @param b 第二个点
 * @returns 距离（f32）
 */
export function distance(a: Vec2 | Vec3 | Vec4, b: Vec2 | Vec3 | Vec4): Float
{
    const result = new Float();
    result.toGLSL = () => `distance(${a.toGLSL()}, ${b.toGLSL()})`;
    result.toWGSL = () => `distance(${a.toWGSL()}, ${b.toWGSL()})`;
    result.dependencies = [a, b];

    return result;
}
