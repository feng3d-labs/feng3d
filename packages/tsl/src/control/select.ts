import { Bool } from '../types/scalar/bool';
import { Float } from '../types/scalar/float';
import { UInt } from '../types/scalar/uint';
import { Vec2 } from '../types/vector/vec2';
import { Vec3 } from '../types/vector/vec3';
import { Vec4 } from '../types/vector/vec4';
import { formatNumber } from '../core/formatNumber';

/**
 * select 函数，条件选择（三元运算符）
 *
 * 根据条件选择两个值中的一个：
 * - 条件为 true 时返回 trueValue
 * - 条件为 false 时返回 falseValue
 *
 * GLSL: 生成三元运算符 `(condition ? trueValue : falseValue)`
 * WGSL: 生成内置函数 `select(falseValue, trueValue, condition)`
 *
 * 注意：WGSL 不支持三元运算符 `? :`，必须使用 select() 内置函数
 *
 * @example
 * ```ts
 * const x = float(1.0);
 * const y = float(2.0);
 * const cond = x.lessThan(y);
 * const result = select(cond, vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0));
 * // 如果 x < y，结果为红色，否则为蓝色
 * ```
 */
export function select<T extends Float | UInt | Vec2 | Vec3 | Vec4>(
    condition: Bool,
    trueValue: T | number,
    falseValue: T | number,
): T
{
    // 判断返回类型
    if (trueValue instanceof Vec4 || falseValue instanceof Vec4)
    {
        const result = new Vec4();
        const trueStr = () => typeof trueValue === 'number' ? `vec4(${formatNumber(trueValue)})` : trueValue.toGLSL();
        const falseStr = () => typeof falseValue === 'number' ? `vec4(${formatNumber(falseValue)})` : falseValue.toGLSL();
        const trueStrWGSL = () => typeof trueValue === 'number' ? `vec4<f32>(${formatNumber(trueValue)})` : trueValue.toWGSL();
        const falseStrWGSL = () => typeof falseValue === 'number' ? `vec4<f32>(${formatNumber(falseValue)})` : falseValue.toWGSL();

        result.toGLSL = () => `(${condition.toGLSL()} ? ${trueStr()} : ${falseStr()})`;
        result.toWGSL = () => `select(${falseStrWGSL()}, ${trueStrWGSL()}, ${condition.toWGSL()})`;
        result.dependencies = [
            condition,
            ...(typeof trueValue === 'number' ? [] : [trueValue]),
            ...(typeof falseValue === 'number' ? [] : [falseValue]),
        ];

        return result as T;
    }

    if (trueValue instanceof Vec3 || falseValue instanceof Vec3)
    {
        const result = new Vec3();
        const trueStr = () => typeof trueValue === 'number' ? `vec3(${formatNumber(trueValue)})` : trueValue.toGLSL();
        const falseStr = () => typeof falseValue === 'number' ? `vec3(${formatNumber(falseValue)})` : falseValue.toGLSL();
        const trueStrWGSL = () => typeof trueValue === 'number' ? `vec3<f32>(${formatNumber(trueValue)})` : trueValue.toWGSL();
        const falseStrWGSL = () => typeof falseValue === 'number' ? `vec3<f32>(${formatNumber(falseValue)})` : falseValue.toWGSL();

        result.toGLSL = () => `(${condition.toGLSL()} ? ${trueStr()} : ${falseStr()})`;
        result.toWGSL = () => `select(${falseStrWGSL()}, ${trueStrWGSL()}, ${condition.toWGSL()})`;
        result.dependencies = [
            condition,
            ...(typeof trueValue === 'number' ? [] : [trueValue]),
            ...(typeof falseValue === 'number' ? [] : [falseValue]),
        ];

        return result as T;
    }

    if (trueValue instanceof Vec2 || falseValue instanceof Vec2)
    {
        const result = new Vec2(0, 0);
        const trueStr = () => typeof trueValue === 'number' ? `vec2(${formatNumber(trueValue)})` : trueValue.toGLSL();
        const falseStr = () => typeof falseValue === 'number' ? `vec2(${formatNumber(falseValue)})` : falseValue.toGLSL();
        const trueStrWGSL = () => typeof trueValue === 'number' ? `vec2<f32>(${formatNumber(trueValue)})` : trueValue.toWGSL();
        const falseStrWGSL = () => typeof falseValue === 'number' ? `vec2<f32>(${formatNumber(falseValue)})` : falseValue.toWGSL();

        result.toGLSL = () => `(${condition.toGLSL()} ? ${trueStr()} : ${falseStr()})`;
        result.toWGSL = () => `select(${falseStrWGSL()}, ${trueStrWGSL()}, ${condition.toWGSL()})`;
        result.dependencies = [
            condition,
            ...(typeof trueValue === 'number' ? [] : [trueValue]),
            ...(typeof falseValue === 'number' ? [] : [falseValue]),
        ];

        return result as T;
    }

    // UInt 类型（如把布尔条件转成 0u / 1u）
    if (trueValue instanceof UInt || falseValue instanceof UInt)
    {
        const result = new UInt();
        const trueStrW = () => typeof trueValue === 'number' ? `${Math.floor(trueValue)}u` : trueValue.toWGSL();
        const falseStrW = () => typeof falseValue === 'number' ? `${Math.floor(falseValue)}u` : falseValue.toWGSL();

        result.toGLSL = () => `(${condition.toGLSL()} ? ${trueStrW().replace(/u$/, '')} : ${falseStrW().replace(/u$/, '')})`;
        result.toWGSL = () => `select(${falseStrW()}, ${trueStrW()}, ${condition.toWGSL()})`;
        result.dependencies = [
            condition,
            ...(typeof trueValue === 'number' ? [] : [trueValue]),
            ...(typeof falseValue === 'number' ? [] : [falseValue]),
        ];

        return result as T;
    }

    // Float 类型
    const result = new Float();
    const trueStr = () => typeof trueValue === 'number' ? formatNumber(trueValue) : trueValue.toGLSL();
    const falseStr = () => typeof falseValue === 'number' ? formatNumber(falseValue) : falseValue.toGLSL();
    const trueStrWGSL = () => typeof trueValue === 'number' ? formatNumber(trueValue) : trueValue.toWGSL();
    const falseStrWGSL = () => typeof falseValue === 'number' ? formatNumber(falseValue) : falseValue.toWGSL();

    result.toGLSL = () => `(${condition.toGLSL()} ? ${trueStr()} : ${falseStr()})`;
    result.toWGSL = () => `select(${falseStrWGSL()}, ${trueStrWGSL()}, ${condition.toWGSL()})`;
    result.dependencies = [
        condition,
        ...(typeof trueValue === 'number' ? [] : [trueValue]),
        ...(typeof falseValue === 'number' ? [] : [falseValue]),
    ];

    return result as T;
}
