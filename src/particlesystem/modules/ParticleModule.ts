import { EventEmitter } from '../../event/EventEmitter';
import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Particle } from '../Particle';
import { ParticleSystem } from '../ParticleSystem';



/**
 * 粒子模块
 */
@Serializable('ParticleModule')
export class ParticleModule extends EventEmitter
{
    /**
     * 是否开启
     */
    @oav({ tooltip: '是否开启' })
    @SerializeProperty()
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
