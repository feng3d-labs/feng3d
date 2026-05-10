import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../../types/scalar/float';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';
import { formatNumber } from '../../core/formatNumber';

/**
 * pow 函数，计算幂
 */
export function pow<T extends Float | Vec3 | Vec4>(a: T | number, b: T extends Vec3 ? (Vec3 | Float | number) : (T extends Vec4 ? (Vec4 | Float | number) : (Float | number))): T
{
    if (a instanceof Vec3)
    {
        const result = new Vec3();
        const other = b as Vec3 | Float | number;
        if (other instanceof Vec3)
        {
            result.toGLSL = () => `pow(${a.toGLSL()}, ${other.toGLSL()})`;
            result.toWGSL = () => `pow(${a.toWGSL()}, ${other.toWGSL()})`;
            result.dependencies = [a, other];
        }
        else
        {
            result.toGLSL = () => `pow(${a.toGLSL()}, ${typeof other === 'number' ? formatNumber(other) : other.toGLSL()})`;
            result.toWGSL = () => `pow(${a.toWGSL()}, ${typeof other === 'number' ? formatNumber(other) : other.toWGSL()})`;
            result.dependencies = typeof other === 'number' ? [a] : [a, other];
        }

        return result as T;
    }
    if (a instanceof Vec4)
    {
        const result = new Vec4();
        const other = b as Vec4 | Float | number;
        if (other instanceof Vec4)
        {
            result.toGLSL = () => `pow(${a.toGLSL()}, ${other.toGLSL()})`;
            result.toWGSL = () => `pow(${a.toWGSL()}, ${other.toWGSL()})`;
            result.dependencies = [a, other];
        }
        else
        {
            result.toGLSL = () => `pow(${a.toGLSL()}, ${typeof other === 'number' ? formatNumber(other) : other.toGLSL()})`;
            result.toWGSL = () => `pow(${a.toWGSL()}, ${typeof other === 'number' ? formatNumber(other) : other.toWGSL()})`;
            result.dependencies = typeof other === 'number' ? [a] : [a, other];
        }

        return result as T;
    }
    const result = new Float();
    result.toGLSL = () => `pow(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL()})`;
    result.toWGSL = () => `pow(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? [] : [b]) : (typeof b === 'number' ? [a] : [a, b]);

    return result as T;
}

