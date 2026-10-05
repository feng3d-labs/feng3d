import { vec3Copy, vec3NormalizeThickness, vec3Random, vec3ScaleNumber, vec3SubNumber } from '@feng3d/math';
import type { WritableVector3Like } from '@feng3d/math';
import { ParticleSystemShapeType } from '../enums/ParticleSystemShapeType';
import type { Particle } from '../Particle';
import type { ParticleShapeModule } from '../modules/ParticleShapeModule';

/**
 * 从半球体的体积 / 球面发射（原 `ParticleSystemShapeHemisphere.calcParticlePosDir`）。
 *
 * `emitFromShell` 开关由 `shapeType`（`Hemisphere` / `HemisphereShell`）直接推导。
 *
 * @param module 形状模块数据
 * @param _particle 粒子（本形状不使用）
 * @param position 写出的位置
 * @param dir 写出的方向
 */
export function particleSystemShapeHemisphereCalcParticlePosDir(module: ParticleShapeModule, _particle: Particle, position: WritableVector3Like, dir: WritableVector3Like): void
{
    // 计算位置
    vec3NormalizeThickness(vec3SubNumber(vec3ScaleNumber(vec3Copy(vec3Random(), dir), 2), 1, dir), 1, dir);
    dir.z = Math.abs(dir.z);

    vec3ScaleNumber(vec3Copy(dir, position), module.radius, position);
    if (module.shapeType !== ParticleSystemShapeType.HemisphereShell)
    {
        vec3ScaleNumber(position, Math.random(), position);
    }
}
