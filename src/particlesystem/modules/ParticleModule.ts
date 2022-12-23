import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { EventEmitter } from '@feng3d/event';
import { Particle } from '../Particle';
import { ParticleSystem } from '../ParticleSystem';
import { decoratorRegisterClass } from '@feng3d/serialization';

/**
 * 粒子模块
 */
@decoratorRegisterClass()
export class ParticleModule extends EventEmitter
{
    /**
     * 是否开启
     */
    @oav({ tooltip: '是否开启' })
    @serialize
    enabled = false;

    /**
     * 粒子系统
     */
    particleSystem: ParticleSystem;

    /**
     * 初始化粒子状态
     * @param _particle 粒子
     */
    initParticleState(_particle: Particle)
    {

    }

    /**
     * 更新粒子状态
     * @param _particle 粒子
     */
    updateParticleState(_particle: Particle)
    {

    }

    /**
     * 更新
     *
     * @param _interval
     */
    update(_interval: number)
    {
    }
}
