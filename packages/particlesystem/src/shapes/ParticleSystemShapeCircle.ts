import { mathUtilDegToRad, minMaxCurveGetValue, vec3From, vec3ScaleNumber } from '@feng3d/math';
import type { WritableVector3Like } from '@feng3d/math';
import { ParticleSystemShapeMultiModeValue } from '../enums/ParticleSystemShapeMultiModeValue';
import { ParticleSystemShapeType } from '../enums/ParticleSystemShapeType';
import type { Particle } from '../Particle';
import type { ParticleShapeModuleLike } from '../modules/ParticleShapeModule';

/**
 * 从圆盘发射（原 `ParticleSystemShapeCircle.calcParticlePosDir`）。
 *
 * `emitFromEdge` 开关由 `shapeType`（`Circle` / `CircleEdge`）直接推导；
 * `radius` / `arc` / `arcMode` / `arcSpread` / `arcSpeed` 的转发访问器删除（直接读 `module`）。
 *
 * @param module 形状模块数据
 * @param particle 粒子
 * @param position 写出的位置
 * @param dir 写出的方向
 */
export function particleSystemShapeCircleCalcParticlePosDir(module: ParticleShapeModuleLike, particle: Particle, position: WritableVector3Like, dir: WritableVector3Like): void
{
    const emitFromEdge = module.shapeType === ParticleSystemShapeType.CircleEdge;
    const radius = module.radius;
    const arc = module.arc;
    // 在圆心的方向
    let radiusAngle = 0;
    if (module.arcMode === ParticleSystemShapeMultiModeValue.Random)
    {
        radiusAngle = Math.random() * arc;
    }
    else if (module.arcMode === ParticleSystemShapeMultiModeValue.Loop)
    {
        const totalAngle = particle.birthTime * minMaxCurveGetValue(module.arcSpeed, particle.birthRateAtDuration) * 360;
        radiusAngle = totalAngle % arc;
    }
    else if (module.arcMode === ParticleSystemShapeMultiModeValue.PingPong)
    {
        const totalAngle = particle.birthTime * minMaxCurveGetValue(module.arcSpeed, particle.birthRateAtDuration) * 360;
        radiusAngle = totalAngle % arc;
        if (Math.floor(totalAngle / arc) % 2 === 1)
        {
            radiusAngle = arc - radiusAngle;
        }
    }
    if (module.arcSpread > 0)
    {
        radiusAngle = Math.floor(radiusAngle / arc / module.arcSpread) * arc * module.arcSpread;
    }
    radiusAngle = mathUtilDegToRad(radiusAngle);
    // 计算位置
    vec3From(Math.cos(radiusAngle), Math.sin(radiusAngle), 0, dir);
    vec3ScaleNumber(dir, radius, position);
    if (!emitFromEdge)
    {
        vec3ScaleNumber(position, Math.random(), position);
    }
}
