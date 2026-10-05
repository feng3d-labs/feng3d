import { mathUtilClamp, mathUtilDegToRad, minMaxCurveGetValue } from '@feng3d/math';
import { vec3Copy, vec3LerpNumber, vec3NormalizeThickness, vec3ScaleNumber, vec3Sub } from '@feng3d/math';
import type { WritableVector3Like } from '@feng3d/math';
import { ParticleSystemShapeConeEmitFrom } from '../enums/ParticleSystemShapeConeEmitFrom';
import { ParticleSystemShapeMultiModeValue } from '../enums/ParticleSystemShapeMultiModeValue';
import { ParticleSystemShapeType } from '../enums/ParticleSystemShapeType';
import type { Particle } from '../Particle';
import type { ParticleShapeModuleLike } from '../modules/ParticleShapeModule';

/**
 * 从圆锥体发射（原 `ParticleSystemShapeCone.calcParticlePosDir`）。
 *
 * 策略实例已删除：原来的 `emitFrom` 开关由 `shapeType`
 * （`Cone` / `ConeShell` / `ConeVolume` / `ConeVolumeShell`）直接推导。
 *
 * @param module 形状模块数据
 * @param particle 粒子
 * @param position 写出的位置
 * @param dir 写出的方向
 */
export function particleSystemShapeConeCalcParticlePosDir(module: ParticleShapeModuleLike, particle: Particle, position: WritableVector3Like, dir: WritableVector3Like): void
{
    const emitFrom = module.shapeType === ParticleSystemShapeType.ConeShell ? ParticleSystemShapeConeEmitFrom.BaseShell
        : module.shapeType === ParticleSystemShapeType.ConeVolume ? ParticleSystemShapeConeEmitFrom.Volume
            : module.shapeType === ParticleSystemShapeType.ConeVolumeShell ? ParticleSystemShapeConeEmitFrom.VolumeShell
                : ParticleSystemShapeConeEmitFrom.Base;

    const radius = module.radius;
    let angle = module.angle;
    const arc = module.arc;
    angle = mathUtilClamp(angle, 0, 87);
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
    // 在圆的位置
    let radiusRate = 1;
    if (emitFrom === ParticleSystemShapeConeEmitFrom.Base || emitFrom === ParticleSystemShapeConeEmitFrom.Volume)
    {
        radiusRate = Math.random();
    }
    // 在圆的位置
    const basePos = { x: Math.cos(radiusAngle), y: Math.sin(radiusAngle), z: 0 };
    // 底面位置
    const bottomPos = vec3ScaleNumber(vec3ScaleNumber(basePos, radius), radiusRate);
    // 顶面位置
    const topPos = vec3ScaleNumber(vec3ScaleNumber(basePos, radius + module.length * Math.tan(mathUtilDegToRad(angle))), radiusRate);
    topPos.z = module.length;

    // 计算方向
    vec3Sub(topPos, bottomPos, dir);
    vec3NormalizeThickness(dir, 1, dir);
    // 计算位置
    vec3Copy(bottomPos, position);
    if (emitFrom === ParticleSystemShapeConeEmitFrom.Volume || emitFrom === ParticleSystemShapeConeEmitFrom.VolumeShell)
    {
        // 上下点进行插值
        vec3LerpNumber(position, topPos, Math.random(), position);
    }
}
