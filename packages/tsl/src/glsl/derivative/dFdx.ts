import { Float } from '../../types/scalar/float';
import { Vec2 } from '../../types/vector/vec2';
import { Vec3 } from '../../types/vector/vec3';

/**
 * dFdx 函数，计算屏幕空间 x 方向的导数
 * GLSL: dFdx(p)
 * WGSL: dpdx(p)
 * @param p 输入值
 * @returns 屏幕空间 x 方向的导数
 */
export function dFdx(p: Float): Float;
export function dFdx(p: Vec2): Vec2;
export function dFdx(p: Vec3): Vec3;
export function dFdx(p: Float | Vec2 | Vec3): Float | Vec2 | Vec3
{
    if (p instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = () => `dFdx(${p.toGLSL()})`;
        result.toWGSL = () => `dpdx(${p.toWGSL()})`;
        result.dependencies = [p];

        return result;
    }
    else if (p instanceof Vec2)
    {
        const result = new (Vec2 as any)();
        result.toGLSL = () => `dFdx(${p.toGLSL()})`;
        result.toWGSL = () => `dpdx(${p.toWGSL()})`;
        result.dependencies = [p];

        return result;
    }
    else
    {
        const result = new Float();
        result.toGLSL = () => `dFdx(${p.toGLSL()})`;
        result.toWGSL = () => `dpdx(${p.toWGSL()})`;
        result.dependencies = [p];

        return result;
    }
}

