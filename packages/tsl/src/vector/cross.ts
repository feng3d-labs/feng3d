import { Vec3 } from '../types/vector/vec3';

/**
 * cross 函数，计算两个向量的叉乘
 * @param a 第一个向量
 * @param b 第二个向量
 * @returns 叉乘结果向量
 */
export function cross(a: Vec3, b: Vec3): Vec3
{
    const result = new Vec3();
    result.toGLSL = () => `cross(${a.toGLSL()}, ${b.toGLSL()})`;
    result.toWGSL = () => `cross(${a.toWGSL()}, ${b.toWGSL()})`;
    result.dependencies = [a, b];

    return result;
}

