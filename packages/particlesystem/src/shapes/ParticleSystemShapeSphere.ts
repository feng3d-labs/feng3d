import { vec3Copy, vec3NormalizeThickness, vec3Random, vec3ScaleNumber, vec3SubNumber, WritableVector3Like } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { Particle } from '../Particle';
import { ParticleSystemShape } from './ParticleSystemShape';

/**
 * 从球体的体积中发射。
 */
export class ParticleSystemShapeSphere extends ParticleSystemShape
{
    /**
     * 球体半径
     */
    @oav({ tooltip: '球体半径' })
    get radius()
    {
        return this._module.radius;
    }

    set radius(v)
    {
        this._module.radius = v;
    }

    /**
     * 是否从球面发射
     */
    @oav({ tooltip: '是否从球面发射' })
    emitFromShell = false;

    /**
     * 计算粒子的发射位置与方向
     *
     * @param _particle
     * @param position
     * @param dir
     */
    calcParticlePosDir(_particle: Particle, position: WritableVector3Like, dir: WritableVector3Like)
    {
        // 计算位置
        vec3NormalizeThickness(vec3SubNumber(vec3ScaleNumber(vec3Copy(vec3Random(), dir), 2), 1, dir), 1, dir);

        vec3ScaleNumber(vec3Copy(dir, position), this.radius, position);
        if (!this.emitFromShell)
        {
            vec3ScaleNumber(position, Math.random(), position);
        }
    }
}

