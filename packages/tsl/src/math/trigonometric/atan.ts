import { formatNumber } from '../../core/formatNumber';
import { Float } from '../../types/scalar/float';
import { Vec2 } from '../../types/vector/vec2';

/**
 * atan 函数，计算反正切
 */
export function atan(a: Vec2): Vec2;
export function atan(a: Float | number, b: Float | number): Float;
export function atan(a: Float | number): Float;
export function atan(a: Float | Vec2 | number, b?: Float | number): Float | Vec2
{
    if (a instanceof Vec2)
    {
        const result = new Vec2(0, 0);
        result.toGLSL = () => `atan(${a.toGLSL()})`;
        result.toWGSL = () => `atan(${a.toWGSL()})`;
        result.dependencies = [a];

        return result;
    }
    const result = new Float();
    if (b !== undefined)
    {
        result.toGLSL = () => `atan(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL()})`;
        result.toWGSL = () => `atan2(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL()})`;
        result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? [] : [b]) : (typeof b === 'number' ? [a] : [a, b]);
    }
    else
    {
        result.toGLSL = () => `atan(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()})`;
        result.toWGSL = () => `atan(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()})`;
        result.dependencies = typeof a === 'number' ? [] : [a];
    }

    return result;
}

