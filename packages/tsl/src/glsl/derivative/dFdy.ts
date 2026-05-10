import { Float } from '../../types/scalar/float';
import { Vec2 } from '../../types/vector/vec2';
import { Vec3 } from '../../types/vector/vec3';

/**
 * dFdy 函数，计算屏幕空间 y 方向的导数
 * GLSL: dFdy(p)
 * WGSL: -dpdy(p)（取反以补偿 WebGL/WebGPU Y 轴方向差异）
 *
 * 注意：WebGL 的 Y 轴向上，WebGPU 的 Y 轴向下，
 * 因此 dpdy 的结果与 dFdy 符号相反，需要取反以保持一致。
 *
 * @param p 输入值
 * @returns 屏幕空间 y 方向的导数
 */
export function dFdy(p: Float): Float;
export function dFdy(p: Vec2): Vec2;
export function dFdy(p: Vec3): Vec3;
export function dFdy(p: Float | Vec2 | Vec3): Float | Vec2 | Vec3
{
    if (p instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = () => `dFdy(${p.toGLSL()})`;
        result.toWGSL = () => `-dpdy(${p.toWGSL()})`;
        result.dependencies = [p];

        return result;
    }
    else if (p instanceof Vec2)
    {
        const result = new (Vec2 as any)();
        result.toGLSL = () => `dFdy(${p.toGLSL()})`;
        result.toWGSL = () => `-dpdy(${p.toWGSL()})`;
        result.dependencies = [p];

        return result;
    }
    else
    {
        const result = new Float();
        result.toGLSL = () => `dFdy(${p.toGLSL()})`;
        result.toWGSL = () => `-dpdy(${p.toWGSL()})`;
        result.dependencies = [p];

        return result;
    }
}

