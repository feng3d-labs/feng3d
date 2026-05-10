import { IElement, ShaderValue } from '../core/IElement';
import { Vec2 } from '../types/vector/vec2';
import { Vec3 } from '../types/vector/vec3';
import { Vec4 } from '../types/vector/vec4';

/**
 * normalize 函数，归一化向量
 * @param v 要归一化的向量
 * @returns 归一化后的向量
 */
export function normalize(v: Vec2): Vec2;
export function normalize(v: Vec3): Vec3;
export function normalize(v: Vec4): Vec4;
export function normalize(v: Vec2 | Vec3 | Vec4): Vec2 | Vec3 | Vec4
{
    if (v instanceof Vec2)
    {
        const result = new Vec2();
        result.toGLSL = () => `normalize(${v.toGLSL()})`;
        result.toWGSL = () => `normalize(${v.toWGSL()})`;
        result.dependencies = [v];

        return result;
    }
    else if (v instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = () => `normalize(${v.toGLSL()})`;
        result.toWGSL = () => `normalize(${v.toWGSL()})`;
        result.dependencies = [v];

        return result;
    }
    else
    {
        const result = new Vec3();
        result.toGLSL = () => `normalize(${v.toGLSL()})`;
        result.toWGSL = () => `normalize(${v.toWGSL()})`;
        result.dependencies = [v];

        return result;
    }
}

