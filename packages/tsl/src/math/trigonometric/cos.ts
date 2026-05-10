import { Float } from '../../types/scalar/float';
import { formatNumber } from '../../core/formatNumber';

/**
 * cos 函数，计算余弦
 */
export function cos(a: Float | number): Float
{
    const result = new Float();
    result.toGLSL = () => `cos(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()})`;
    result.toWGSL = () => `cos(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? [] : [a];

    return result;
}
