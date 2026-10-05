import { formatNumber } from '../../core/formatNumber';
import { Float } from '../../types/scalar/float';

/**
 * acos 函数，计算反余弦
 */
export function acos(a: Float | number): Float
{
    const result = new Float();
    result.toGLSL = () => `acos(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()})`;
    result.toWGSL = () => `acos(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? [] : [a];

    return result;
}

