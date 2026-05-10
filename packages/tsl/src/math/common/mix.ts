import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../../types/scalar/float';
import { BVec3 } from '../../types/vector/bvec3';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';
import { formatNumber } from '../../core/formatNumber';

/**
 * mix 函数，线性插值
 * 支持标量插值因子和布尔向量选择器
 */
export function mix(a: Float | number, b: Float | number, t: Float | number): Float;
export function mix(a: Vec3, b: Vec3, t: Float | BVec3 | number): Vec3;
export function mix(a: Vec4, b: Vec4, t: Float | number): Vec4;
export function mix(a: Float | Vec3 | Vec4 | number, b: Float | Vec3 | Vec4 | number, t: Float | BVec3 | number): Float | Vec3 | Vec4
{
    if (a instanceof Vec3 || b instanceof Vec3)
    {
        const result = new Vec3();

        // 如果 t 是 BVec3，在 WGSL 中使用 select 函数
        if (t instanceof BVec3)
        {
            result.toGLSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL()}, ${t.toGLSL()})`;
            // WGSL 中 mix 不支持 bool 向量，需要使用 select
            result.toWGSL = () => `select(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL()}, ${t.toWGSL()})`;
            const deps: IElement[] = [t];
            if (typeof a !== 'number') deps.push(a);
            if (typeof b !== 'number') deps.push(b);
            result.dependencies = deps;
        }
        else
        {
            result.toGLSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL()}, ${typeof t === 'number' ? formatNumber(t) : t.toGLSL()})`;
            result.toWGSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL()}, ${typeof t === 'number' ? formatNumber(t) : t.toWGSL()})`;
            result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? (typeof t === 'number' ? [] : [t]) : (typeof t === 'number' ? [b] : [b, t])) : (typeof b === 'number' ? (typeof t === 'number' ? [a] : [a, t]) : (typeof t === 'number' ? [a, b] : [a, b, t]));
        }

        return result;
    }
    if (a instanceof Vec4 || b instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL()}, ${typeof t === 'number' ? formatNumber(t) : t.toGLSL()})`;
        result.toWGSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL()}, ${typeof t === 'number' ? formatNumber(t) : t.toWGSL()})`;
        result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? (typeof t === 'number' ? [] : [t]) : (typeof t === 'number' ? [b] : [b, t])) : (typeof b === 'number' ? (typeof t === 'number' ? [a] : [a, t]) : (typeof t === 'number' ? [a, b] : [a, b, t]));

        return result;
    }
    const result = new Float();
    result.toGLSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL()}, ${typeof t === 'number' ? formatNumber(t) : t.toGLSL()})`;
    result.toWGSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL()}, ${typeof t === 'number' ? formatNumber(t) : t.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? (typeof t === 'number' ? [] : [t]) : (typeof t === 'number' ? [b] : [b, t])) : (typeof b === 'number' ? (typeof t === 'number' ? [a] : [a, t]) : (typeof t === 'number' ? [a, b] : [a, b, t]));

    return result;
}

