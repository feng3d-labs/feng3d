import { Float } from '../../types/scalar/float';
import type { Vec2 } from '../../types/vector/vec2';
import type { Vec3 } from '../../types/vector/vec3';
import type { Vec4 } from '../../types/vector/vec4';

/**
 * `length`：向量长度（WGSL/GLSL 同名内置函数）。
 *
 * @param v 向量
 * @returns 长度（f32）
 */
export function length(v: Vec2 | Vec3 | Vec4): Float
{
    const result = new Float();
    result.toGLSL = () => `length(${v.toGLSL()})`;
    result.toWGSL = () => `length(${v.toWGSL()})`;
    result.dependencies = [v];

    return result;
}
