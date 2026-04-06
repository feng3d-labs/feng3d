import { Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { Particle } from '../Particle';
import { ParticleSystemShape } from './ParticleSystemShape';

/**
 * 从半球体的体积中发出。
 */
export class ParticleSystemShapeHemisphere extends ParticleSystemShape
{
    @oav({ tooltip: '球体半径' })
    radius = 1;

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
    calcParticlePosDir(_particle: Particle, position: Vector3, dir: Vector3)
    {
        // 计算位置
        dir.copy(Vector3.random()).scaleNumber(2).subNumber(1).normalize();
        dir.z = Math.abs(dir.z);

        position.copy(dir).scaleNumber(this.radius);
        if (!this.emitFromShell)
        {
            position.scaleNumber(Math.random());
        }
    }
}
