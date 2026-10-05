import { Float } from '../../types/scalar/float';
import { UInt } from '../../types/scalar/uint';
import { formatNumber } from '../../core/formatNumber';

/**
 * max 函数，返回两个值中的较大者
 * @param a 第一个值
 * @param b 第二个值
 * @returns 较大的值
 */
export function max<T extends Float | UInt>(a: T | number, b: T | number): T
{
    // 无符号整数（u32）的 max：结果类型与入参一致
    if (a instanceof UInt || b instanceof UInt)
    {
        const uintResult = new UInt();
        const fmt = (v: UInt | number) => (typeof v === 'number' ? `${Math.floor(v)}u` : v.toWGSL());

        uintResult.toGLSL = () => `max(${fmt(a as UInt | number)}, ${fmt(b as UInt | number)})`;
        uintResult.toWGSL = () => `max(${fmt(a as UInt | number)}, ${fmt(b as UInt | number)})`;
        uintResult.dependencies = typeof a === 'number' ? (typeof b === 'number' ? [] : [b as UInt]) : (typeof b === 'number' ? [a as UInt] : [a as UInt, b as UInt]);

        return uintResult as unknown as T;
    }

    const result = new Float();

    result.toGLSL = () => `max(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL()})`;
    result.toWGSL = () => `max(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? [] : [b]) : (typeof b === 'number' ? [a] : [a, b]);

    return result as T;
}

