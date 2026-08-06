import { Vector3 } from '@feng3d/math';
import { ParticleShapeModule } from '../modules/ParticleShapeModule';
import { Particle } from '../Particle';

/**
 * 粒子系统 发射形状
 */
export class ParticleSystemShape
{
    protected _module: ParticleShapeModule;

    constructor(module: ParticleShapeModule)
    {
        this._module = module;
    }

    /**
     * 计算粒子的发射位置与方向
     *
     * @param _particle
     * @param _position
     * @param _dir
     */
    calcParticlePosDir(_particle: Particle, _position: Vector3, _dir: Vector3)
    {

    }
}
