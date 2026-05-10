import { BVec3 } from '../types/vector/bvec3';
import { Vec3 } from '../types/vector/vec3';

/**
 * lessThan 函数，比较两个向量的各分量
 * 返回布尔向量，每个分量表示 a 的对应分量是否小于 b
 *
 * GLSL: lessThan(a, b)
 * WGSL: a < b
 */
export function lessThan(a: Vec3, b: Vec3): BVec3
{
    const result = new BVec3();
    result.toGLSL = () => `lessThan(${a.toGLSL()}, ${b.toGLSL()})`;
    // WGSL 直接支持向量比较运算符
    result.toWGSL = () => `(${a.toWGSL()} < ${b.toWGSL()})`;
    result.dependencies = [a, b];

    return result;
}

