import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../../types/scalar/float';
import { formatNumber } from '../../core/formatNumber';

/**
 * max 函数，返回两个值中的较大者
 * @param a 第一个值
 * @param b 第二个值
 * @returns 较大的值
 */
export function max<T extends Float>(a: T | number, b: T | number): T
{
    const result = new Float();

    result.toGLSL = () => `max(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL()})`;
    result.toWGSL = () => `max(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? [] : [b]) : (typeof b === 'number' ? [a] : [a, b]);

    return result as T;
}

