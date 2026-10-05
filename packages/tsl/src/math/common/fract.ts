import { Float } from '../../types/scalar/float';
import { Vec2 } from '../../types/vector/vec2';
import { formatNumber } from '../../core/formatNumber';

/**
 * fract 函数，返回 x 的小数部分
 * fract(x) = x - floor(x)
 */
export function fract(x: Float | number): Float;
export function fract(x: Vec2): Vec2;
export function fract(x: Float | Vec2 | number): Float | Vec2
{
    if (typeof x === 'number')
    {
        const result = new Float();
        result.toGLSL = () => `fract(${formatNumber(x)})`;
        result.toWGSL = () => `fract(${formatNumber(x)})`;
        result.dependencies = [];

        return result;
    }
    else if (x instanceof Vec2)
    {
        const result = new Vec2(0, 0);
        result.toGLSL = () => `fract(${x.toGLSL()})`;
        result.toWGSL = () => `fract(${x.toWGSL()})`;
        result.dependencies = [x];

        return result;
    }
    else
    {
        const result = new Float();
        result.toGLSL = () => `fract(${x.toGLSL()})`;
        result.toWGSL = () => `fract(${x.toWGSL()})`;
        result.dependencies = [x];

        return result;
    }
}
