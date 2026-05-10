import { Vec3 } from '../types/vector/vec3';

/**
 * reflect 函数，计算反射向量
 * 公式：I - 2.0 * dot(N, I) * N
 *
 * @param incident 入射向量
 * @param normal 法线向量（应为单位向量）
 * @returns 反射向量
 */
export function reflect(incident: Vec3, normal: Vec3): Vec3
{
    const result = new Vec3();
    result.toGLSL = () => `reflect(${incident.toGLSL()}, ${normal.toGLSL()})`;
    result.toWGSL = () => `reflect(${incident.toWGSL()}, ${normal.toWGSL()})`;
    result.dependencies = [incident, normal];

    return result;
}

