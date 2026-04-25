import { Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { Particle } from '../Particle';
import { ParticleSystemShape } from './ParticleSystemShape';

export enum ParticleSystemShapeBoxEmitFrom
{
    /**
     * 从盒子内部发射。
     */
    Volume,
    /**
     * 从盒子外壳发射。
     */
    Shell,
    /**
     * 从盒子边缘发射。
     */
    Edge,
}

/**
 * 粒子系统 发射盒子
 */
export class ParticleSystemShapeBox extends ParticleSystemShape
{
    /**
     * 盒子X方向缩放。
     */
    @oav({ tooltip: '盒子X方向缩放。' })
    get boxX()
    {
        return this._module.box.x;
    }

    set boxX(v)
    {
        this._module.box.x = v;
    }

    /**
     * 盒子Y方向缩放。
     */
    @oav({ tooltip: '盒子Y方向缩放。' })
    get boxY()
    {
        return this._module.box.y;
    }

    set boxY(v)
    {
        this._module.box.y = v;
    }

    /**
     * 盒子Z方向缩放。
     */
    @oav({ tooltip: '盒子Z方向缩放。' })
    get boxZ()
    {
        return this._module.box.z;
    }

    set boxZ(v)
    {
        this._module.box.z = v;
    }

    /**
     * 粒子系统盒子发射类型。
     */
    @oav({ tooltip: '粒子系统盒子发射类型。', component: 'OAVEnum', componentParam: { enumClass: ParticleSystemShapeBoxEmitFrom } })
    emitFrom = ParticleSystemShapeBoxEmitFrom.Volume;

    /**
     * 计算粒子的发射位置与方向
     *
     * @param particle
     * @param position
     * @param dir
     */
    calcParticlePosDir(particle: Particle, position: Vector3, dir: Vector3)
    {
        // 计算位置
        position.copy(Vector3.random().scaleNumber(2).subNumber(1));

        if (this.emitFrom === ParticleSystemShapeBoxEmitFrom.Shell)
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
        else if (this.emitFrom === ParticleSystemShapeBoxEmitFrom.Edge)
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
        position.scale(new Vector3(this.boxX, this.boxY, this.boxZ)).scaleNumber(0.5);

        //
        dir.set(0, 0, 1);
    }
}
