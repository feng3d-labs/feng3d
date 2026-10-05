import { minMaxCurveGetValue, vec3From } from '@feng3d/math';
import type { WritableVector3Like } from '@feng3d/math';
import { ParticleSystemShapeMultiModeValue } from '../enums/ParticleSystemShapeMultiModeValue';
import type { Particle } from '../Particle';
import type { ParticleShapeModule } from '../modules/ParticleShapeModule';

/**
 * 从边发射（原 `ParticleSystemShapeEdge.calcParticlePosDir`）。
 *
 * 本形状没有自己的开关，`radius` / `radiusMode` / `radiusSpeed` / `radiusSpread` 的转发访问器删除（直接读 `module`）。
 *
 * @param module 形状模块数据
 * @param particle 粒子
 * @param position 写出的位置
 * @param dir 写出的方向
 */
export function particleSystemShapeEdgeCalcParticlePosDir(module: ParticleShapeModule, particle: Particle, position: WritableVector3Like, dir: WritableVector3Like): void
{
    const arc = 360 * module.radius;
    // 在圆心的方向
    let radiusAngle = 0;
    if (module.radiusMode === ParticleSystemShapeMultiModeValue.Random)
    {
        radiusAngle = Math.random() * arc;
    }
    else if (module.radiusMode === ParticleSystemShapeMultiModeValue.Loop)
    {
        const totalAngle = particle.birthTime * minMaxCurveGetValue(module.radiusSpeed, particle.birthRateAtDuration) * 360;
        radiusAngle = totalAngle % arc;
    }
    else if (module.radiusMode === ParticleSystemShapeMultiModeValue.PingPong)
    {
        const totalAngle = particle.birthTime * minMaxCurveGetValue(module.radiusSpeed, particle.birthRateAtDuration) * 360;
        radiusAngle = totalAngle % arc;
        if (Math.floor(totalAngle / arc) % 2 === 1)
        {
            radiusAngle = arc - radiusAngle;
        }
    }
    if (module.radiusSpread > 0)
    {
        radiusAngle = Math.floor(radiusAngle / arc / module.radiusSpread) * arc * module.radiusSpread;
    }
    radiusAngle = radiusAngle / arc;

    //
    vec3From(0, 1, 0, dir);
    vec3From(module.radius * (radiusAngle * 2 - 1), 0, 0, position);
}
