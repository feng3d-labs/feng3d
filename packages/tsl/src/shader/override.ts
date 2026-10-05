import { Float } from '../types/scalar/float';
import { Int } from '../types/scalar/int';
import { UInt } from '../types/scalar/uint';

/**
 * 创建一个**可被表达式的 override 变量引用**。
 *
 * 声明由着色器入口的 `overrides` 选项负责（见 fragment / compute），
 * 这里只负责"在表达式里写这个名字"——例如 `vec2(overrideF32('canvasSizeWidth'), ...)`。
 *
 * @param name override 变量名
 * @returns 可直接参与运算的 f32 值
 */
export function overrideF32(name: string): Float
{
    const result = new Float();
    result.toGLSL = () => name;
    result.toWGSL = () => name;
    result.dependencies = [];

    return result;
}

/**
 * 创建一个可被表达式引用的 u32 override 变量。
 *
 * @param name override 变量名
 * @returns 可直接参与运算的 u32 值
 */
export function overrideU32(name: string): UInt
{
    const result = new UInt();
    result.toGLSL = () => name;
    result.toWGSL = () => name;
    result.dependencies = [];

    return result;
}

/**
 * 创建一个可被表达式引用的 i32 override 变量。
 *
 * @param name override 变量名
 * @returns 可直接参与运算的 i32 值
 */
export function overrideI32(name: string): Int
{
    const result = new Int();
    result.toGLSL = () => name;
    result.toWGSL = () => name;
    result.dependencies = [];

    return result;
}
