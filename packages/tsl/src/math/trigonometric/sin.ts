import { Float } from '../../types/scalar/float';
import { formatNumber } from '../../core/formatNumber';

/**
 * sin 函数，计算正弦
 */
export function sin(a: Float | number): Float
{
    const result = new Float();
    result.toGLSL = () => `sin(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()})`;
    result.toWGSL = () => `sin(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? [] : [a];

    return result;
}
