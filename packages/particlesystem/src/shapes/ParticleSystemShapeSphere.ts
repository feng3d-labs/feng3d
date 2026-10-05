import { vec3Copy, vec3NormalizeThickness, vec3Random, vec3ScaleNumber, vec3SubNumber } from '@feng3d/math';
import type { WritableVector3Like } from '@feng3d/math';
import { ParticleSystemShapeType } from '../enums/ParticleSystemShapeType';
import type { Particle } from '../Particle';
import type { ParticleShapeModule } from '../modules/ParticleShapeModule';

/**
 * 从球体的体积 / 球面发射（原 `ParticleSystemShapeSphere.calcParticlePosDir`）。
 *
 * 策略实例已删除：原来的 `emitFromShell` 开关由 `shapeType`（`Sphere` / `SphereShell`）直接推导。
 *
 * @param module 形状模块数据
 * @param _particle 粒子（本形状不使用）
 * @param position 写出的位置
 * @param dir 写出的方向
 */
export function particleSystemShapeSphereCalcParticlePosDir(module: ParticleShapeModule, _particle: Particle, position: WritableVector3Like, dir: WritableVector3Like): void
{
    // 计算位置
    vec3NormalizeThickness(vec3SubNumber(vec3ScaleNumber(vec3Copy(vec3Random(), dir), 2), 1, dir), 1, dir);

    vec3ScaleNumber(vec3Copy(dir, position), module.radius, position);
    if (module.shapeType !== ParticleSystemShapeType.SphereShell)
    {
        vec3ScaleNumber(position, Math.random(), position);
    }
}
