import { MinMaxCurve } from '../../../math/curve/MinMaxCurve';
import { oav } from '../../../objectview/ObjectView';
import { $set } from '../../../serialization/Serialization';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { ParticleSystemInheritVelocityMode } from '../enums/ParticleSystemInheritVelocityMode';
import { ParticleSystemSimulationSpace } from '../enums/ParticleSystemSimulationSpace';
import { Particle } from '../Particle';
import { ParticleModule, RegisterParticleModule } from './ParticleModule';

declare module './ParticleModule' { interface ParticleModuleMap { ParticleInheritVelocityModule: ParticleInheritVelocityModule } }
/**
 * The Inherit Velocity Module controls how the velocity of the emitter is transferred to the particles as they are emitted.
 *
 * 遗传速度模块控制发射体的速度在粒子发射时如何传递到粒子上。（只有粒子系统在世界空间中模拟时生效）
 */
@RegisterParticleModule('ParticleInheritVelocityModule')
export class ParticleInheritVelocityModule extends ParticleModule
{
    '__class__': 'ParticleInheritVelocityModule' = 'ParticleInheritVelocityModule';

    /**
     * How to apply emitter velocity to particles.
     *
     * 如何将发射体速度应用于粒子。
     */
    @SerializeProperty()
    @oav({ tooltip: '如何将发射体速度应用于粒子。', component: 'OAVEnum', componentParam: { enumClass: ParticleSystemInheritVelocityMode } })
    mode = ParticleSystemInheritVelocityMode.Initial;

    /**
     * Curve to define how much emitter velocity is applied during the lifetime of a particle.
     *
     * 曲线，用来定义在粒子的生命周期内应用了多少发射速度。
     */
    @SerializeProperty()
    @oav({ tooltip: '曲线，用来定义在粒子的生命周期内应用了多少发射速度。' })
    multiplier = $set(new MinMaxCurve(), { constant: 1, constantMin: 1, constantMax: 1 });

    /**
     * Curve to define how much emitter velocity is applied during the lifetime of a particle.
     *
     * 曲线，用来定义在粒子的生命周期内应用了多少发射速度。
     */
    get curve()
    {
        return this.multiplier;
    }

    set curve(v)
    {
        this.multiplier = v;
    }

    /**
     * Change the curve multiplier.
     *
     * 改变曲线的乘数。
     */
    get curveMultiplier()
    {
        return this.multiplier.curveMultiplier;
    }

    set curveMultiplier(v)
    {
        this.multiplier.curveMultiplier = v;
    }

    /**
     * 初始化粒子状态
     * @param particle 粒子
     */
    initParticleState(particle: Particle)
    {
        particle[InheritVelocityRate] = Math.random();

        if (!this.enabled) return;
        if (this.particleSystem.main.simulationSpace === ParticleSystemSimulationSpace.Local) return;
        if (this.mode !== ParticleSystemInheritVelocityMode.Initial) return;

        const multiplier = this.multiplier.getValue(particle.rateAtLifeTime, particle[InheritVelocityRate]);
        particle.velocity.addScaledVector(multiplier, this.particleSystem._emitInfo.speed);
    }

    /**
     * 更新粒子状态
     * @param particle 粒子
     */
    updateParticleState(particle: Particle)
    {
        if (!this.enabled) return;
        if (this.particleSystem.main.simulationSpace === ParticleSystemSimulationSpace.Local) return;
        if (this.mode !== ParticleSystemInheritVelocityMode.Current) return;

        const multiplier = this.multiplier.getValue(particle.rateAtLifeTime, particle[InheritVelocityRate]);
        particle.position.addScaledVector(multiplier, this.particleSystem._emitInfo.moveVec);
    }
}
const InheritVelocityRate = '_InheritVelocity_rate';
