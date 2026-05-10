import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../../types/scalar/float';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';

/**
 * exp 函数，计算 e 的幂
 */
export function exp<T extends Float | Vec3 | Vec4>(a: T | number): T
{
    if (a instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = () => `exp(${a.toGLSL()})`;
        result.toWGSL = () => `exp(${a.toWGSL()})`;
        result.dependencies = [a];

        return result as T;
    }
    if (a instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = () => `exp(${a.toGLSL()})`;
        result.toWGSL = () => `exp(${a.toWGSL()})`;
        result.dependencies = [a];

        return result as T;
    }
    const result = new Float();
    result.toGLSL = () => `exp(${typeof a === 'number' ? a : a.toGLSL()})`;
    result.toWGSL = () => `exp(${typeof a === 'number' ? a : a.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? [] : [a];

    return result as T;
}

