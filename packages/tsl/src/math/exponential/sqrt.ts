import { Float } from '../../types/scalar/float';
import { Vec2 } from '../../types/vector/vec2';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';
import { formatNumber } from '../../core/formatNumber';

/**
 * sqrt 函数，计算平方根
 *
 * 支持 Float、Vec2、Vec3、Vec4 类型
 *
 * @example
 * ```ts
 * const x = float(4.0);
 * const y = sqrt(x); // 结果为 2.0
 *
 * const v = vec3(4.0, 9.0, 16.0);
 * const r = sqrt(v); // 结果为 vec3(2.0, 3.0, 4.0)
 * ```
 */
export function sqrt<T extends Float | Vec2 | Vec3 | Vec4>(a: T | number): T
{
    if (a instanceof Vec2)
    {
        const result = new Vec2(0, 0);
        result.toGLSL = () => `sqrt(${a.toGLSL()})`;
        result.toWGSL = () => `sqrt(${a.toWGSL()})`;
        result.dependencies = [a];

        return result as T;
    }
    if (a instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = () => `sqrt(${a.toGLSL()})`;
        result.toWGSL = () => `sqrt(${a.toWGSL()})`;
        result.dependencies = [a];

        return result as T;
    }
    if (a instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = () => `sqrt(${a.toGLSL()})`;
        result.toWGSL = () => `sqrt(${a.toWGSL()})`;
        result.dependencies = [a];

        return result as T;
    }
    const result = new Float();
    result.toGLSL = () => `sqrt(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()})`;
    result.toWGSL = () => `sqrt(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? [] : [a];

    return result as T;
}
