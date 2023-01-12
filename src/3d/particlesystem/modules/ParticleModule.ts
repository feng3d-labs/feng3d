import { EventEmitter } from '../../event/EventEmitter';
import { oav } from '../../objectview/ObjectView';
import { Constructor } from '../../polyfill/Types';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Particle } from '../Particle';
import { ParticleSystem3D } from '../ParticleSystem3D';

export interface ParticleModuleMap { }

declare module '../../serialization/Serializable' { interface SerializableMap extends ParticleModuleMap { } }

/**
 * 注册粒子模块
 *
 * 使用 @RegisterParticleModule 注册粒子模块，配合扩展 ParticleModuleMap 接口。
 *
 * 将同时使用 @Serializable 进行注册为可序列化。
 *
 * @param particleModule 粒子模块名称，默认使用类名称。
 *
 * @see Serializable
 */
export function RegisterParticleModule<K extends keyof ParticleModuleMap>(particleModule: K)
{
    return (constructor: Constructor<ParticleModuleMap[K]>) =>
    {
        Serializable(particleModule)(constructor as any);
    };
}

/**
 * 粒子模块
 */
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
    particleSystem: ParticleSystem3D;

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
