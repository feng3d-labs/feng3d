import { vec3Copy, vec3From, vec3Random, vec3Scale, vec3ScaleNumber, vec3SubNumber } from '@feng3d/math';
import type { WritableVector3Like } from '@feng3d/math';
import { ParticleSystemShapeType } from '../enums/ParticleSystemShapeType';
import type { Particle } from '../Particle';
import type { ParticleShapeModule } from '../modules/ParticleShapeModule';

/** 盒子发射类型（原 `ParticleSystemShapeBoxEmitFrom`，仍是稳定对外枚举） */
export enum ParticleSystemShapeBoxEmitFrom
{
    /** 从盒子内部发射 */
    Volume,
    /** 从盒子外壳发射 */
    Shell,
    /** 从盒子边缘发射 */
    Edge,
}

/**
 * 从盒子发射（原 `ParticleSystemShapeBox.calcParticlePosDir`）。
 *
 * `emitFrom` 开关由 `shapeType`（`Box` / `BoxShell` / `BoxEdge`）直接推导；
 * 原来的 `boxX` / `boxY` / `boxZ` 转发访问器删除（直接读 `module.box`）。
 *
 * @param module 形状模块数据
 * @param _particle 粒子（本形状不使用）
 * @param position 写出的位置
 * @param dir 写出的方向
 */
export function particleSystemShapeBoxCalcParticlePosDir(module: ParticleShapeModule, _particle: Particle, position: WritableVector3Like, dir: WritableVector3Like): void
{
    const emitFrom = module.shapeType === ParticleSystemShapeType.BoxShell ? ParticleSystemShapeBoxEmitFrom.Shell
        : module.shapeType === ParticleSystemShapeType.BoxEdge ? ParticleSystemShapeBoxEmitFrom.Edge
            : ParticleSystemShapeBoxEmitFrom.Volume;

    // 计算位置
    vec3Copy(vec3SubNumber(vec3ScaleNumber(vec3Random(), 2), 1), position);

    if (emitFrom === ParticleSystemShapeBoxEmitFrom.Shell)
    {
        const max = Math.max(Math.abs(position.x), Math.abs(position.y), Math.abs(position.z));
        if (Math.abs(position.x) === max)
        {
            position.x = position.x < 0 ? -1 : 1;
        }
        else if (Math.abs(position.y) === max)
        {
            position.y = position.y < 0 ? -1 : 1;
        }
        else if (Math.abs(position.z) === max)
        {
            position.z = position.z < 0 ? -1 : 1;
        }
    }
    else if (emitFrom === ParticleSystemShapeBoxEmitFrom.Edge)
    {
        const min = Math.min(Math.abs(position.x), Math.abs(position.y), Math.abs(position.z));
        if (Math.abs(position.x) === min)
        {
            position.y = position.y < 0 ? -1 : 1;
            position.z = position.z < 0 ? -1 : 1;
        }
        else if (Math.abs(position.y) === min)
        {
            position.x = position.x < 0 ? -1 : 1;
            position.z = position.z < 0 ? -1 : 1;
        }
        else if (Math.abs(position.z) === min)
        {
            position.x = position.x < 0 ? -1 : 1;
            position.y = position.y < 0 ? -1 : 1;
        }
    }
    vec3ScaleNumber(vec3Scale(position, module.box, position), 0.5, position);

    //
    vec3From(0, 0, 1, dir);
}
