import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../../types/scalar/float';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';
import { formatNumber } from '../../core/formatNumber';

/**
 * step 函数，如果 edge < x 返回 1.0，否则返回 0.0
 */
export function step<T extends Float | Vec3 | Vec4>(edge: T | number, x: T | number): T
{
    if (edge instanceof Vec3 || x instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = () => `step(${typeof edge === 'number' ? formatNumber(edge) : edge.toGLSL()}, ${typeof x === 'number' ? formatNumber(x) : x.toGLSL()})`;
        result.toWGSL = () => `step(${typeof edge === 'number' ? formatNumber(edge) : edge.toWGSL()}, ${typeof x === 'number' ? formatNumber(x) : x.toWGSL()})`;
        result.dependencies = typeof edge === 'number' ? (typeof x === 'number' ? [] : [x]) : (typeof x === 'number' ? [edge] : [edge, x]);

        return result as T;
    }
    if (edge instanceof Vec4 || x instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = () => `step(${typeof edge === 'number' ? formatNumber(edge) : edge.toGLSL()}, ${typeof x === 'number' ? formatNumber(x) : x.toGLSL()})`;
        result.toWGSL = () => `step(${typeof edge === 'number' ? formatNumber(edge) : edge.toWGSL()}, ${typeof x === 'number' ? formatNumber(x) : x.toWGSL()})`;
        result.dependencies = typeof edge === 'number' ? (typeof x === 'number' ? [] : [x]) : (typeof x === 'number' ? [edge] : [edge, x]);

        return result as T;
    }
    const result = new Float();
    result.toGLSL = () => `step(${typeof edge === 'number' ? formatNumber(edge) : edge.toGLSL()}, ${typeof x === 'number' ? formatNumber(x) : x.toGLSL()})`;
    result.toWGSL = () => `step(${typeof edge === 'number' ? formatNumber(edge) : edge.toWGSL()}, ${typeof x === 'number' ? formatNumber(x) : x.toWGSL()})`;
    result.dependencies = typeof edge === 'number' ? (typeof x === 'number' ? [] : [x]) : (typeof x === 'number' ? [edge] : [edge, x]);

    return result as T;
}

