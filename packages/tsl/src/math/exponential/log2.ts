import { formatNumber } from '../../core/formatNumber';
import { Float } from '../../types/scalar/float';
import { Vec2 } from '../../types/vector/vec2';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';

/**
 * log2 函数，计算以 2 为底的对数
 * GLSL/WGSL: log2(x)
 */
export function log2(a: Float): Float;
export function log2(a: number): Float;
export function log2(a: Vec2): Vec2;
export function log2(a: Vec3): Vec3;
export function log2(a: Vec4): Vec4;
export function log2(a: Float | Vec2 | Vec3 | Vec4 | number): Float | Vec2 | Vec3 | Vec4
{
    if (a instanceof Vec2)
    {
        const result = new Vec2();
        result.toGLSL = () => `log2(${a.toGLSL()})`;
        result.toWGSL = () => `log2(${a.toWGSL()})`;
        result.dependencies = [a];

        return result;
    }
    if (a instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = () => `log2(${a.toGLSL()})`;
        result.toWGSL = () => `log2(${a.toWGSL()})`;
        result.dependencies = [a];

        return result;
    }
    if (a instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = () => `log2(${a.toGLSL()})`;
        result.toWGSL = () => `log2(${a.toWGSL()})`;
        result.dependencies = [a];

        return result;
    }
    const result = new Float();
    result.toGLSL = () => `log2(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()})`;
    result.toWGSL = () => `log2(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? [] : [a];

    return result;
}

