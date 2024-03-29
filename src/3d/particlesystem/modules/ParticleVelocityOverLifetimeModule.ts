import { MinMaxCurveVector3 } from '../../../math/curve/MinMaxCurveVector3';
import { oav } from '../../../objectview/ObjectView';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { ParticleSystemSimulationSpace } from '../enums/ParticleSystemSimulationSpace';
import { Particle } from '../Particle';
import { ParticleModule, RegisterParticleModule } from './ParticleModule';

declare module './ParticleModule' { interface ParticleModuleMap { ParticleVelocityOverLifetimeModule: ParticleVelocityOverLifetimeModule } }
/**
 * 粒子系统 速度随时间变化模块
 *
 * Controls the velocity of each particle during its lifetime.
 * 控制每个粒子在其生命周期内的速度。
 */
@RegisterParticleModule('ParticleVelocityOverLifetimeModule')
export class ParticleVelocityOverLifetimeModule extends ParticleModule
{
    declare __class__: 'ParticleVelocityOverLifetimeModule';

    /**
     * Curve to control particle speed based on lifetime.
     *
     * 基于寿命的粒子速度控制曲线。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Curve to control particle speed based on lifetime." })
    @oav({ tooltip: '基于寿命的粒子速度控制曲线。' })
    velocity = new MinMaxCurveVector3();

    /**
     * Specifies if the velocities are in local space (rotated with the transform) or global space.
     *
     * 指定速度是在局部空间(与变换一起旋转)还是在全局空间。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Specifies if the velocities are in local space (rotated with the transform) or global space.", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace } })
    @oav({ tooltip: '指定速度是在局部空间(与变换一起旋转)还是在全局空间。', component: 'OAVEnum', componentParam: { enumClass: ParticleSystemSimulationSpace } })
    space = ParticleSystemSimulationSpace.Local;

    /**
     * Curve to control particle speed based on lifetime, on the X axis.
     *
     * 曲线控制粒子速度基于寿命，在X轴上。
     */
    get x()
    {
        return this.velocity.xCurve;
    }

    set x(v)
    {
        this.velocity.xCurve = v;
    }

    /**
     * X axis speed multiplier.
     *
     * X轴速度倍增器。
     */
    get xMultiplier()
    {
        return this.x.curveMultiplier;
    }

    set xMultiplier(v)
    {
        this.x.curveMultiplier = v;
    }

    /**
     * Curve to control particle speed based on lifetime, on the Y axis.
     *
     * 曲线控制粒子速度基于寿命，在Y轴上。
     */
    get y()
    {
        return this.velocity.yCurve;
    }

    set y(v)
    {
        this.velocity.yCurve = v;
    }

    /**
     * Y axis speed multiplier.
     *
     * Y轴速度倍增器。
     */
    get yMultiplier()
    {
        return this.y.curveMultiplier;
    }

    set yMultiplier(v)
    {
        this.y.curveMultiplier = v;
    }

    /**
     * Curve to control particle speed based on lifetime, on the Z axis.
     *
     * 曲线控制粒子速度基于寿命，在Z轴上。
     */
    get z()
    {
        return this.velocity.zCurve;
    }

    set z(v)
    {
        this.velocity.zCurve = v;
    }

    /**
     * Z axis speed multiplier.
     *
     * Z轴速度倍增器。
     */
    get zMultiplier()
    {
        return this.z.curveMultiplier;
    }

    set zMultiplier(v)
    {
        this.z.curveMultiplier = v;
    }

    /**
     * 初始化粒子状态
     * @param particle 粒子
     */
    initParticleState(particle: Particle)
    {
        particle[VelocityOverLifetimeRate] = Math.random();
    }

    /**
     * 更新粒子状态
     * @param particle 粒子
     */
    updateParticleState(particle: Particle)
    {
        this.particleSystem.removeParticleVelocity(particle, VelocityOverLifetimePreVelocity);
        if (!this.enabled) return;

        const velocity = this.velocity.getValue(particle.rateAtLifeTime, particle[VelocityOverLifetimeRate]);
        this.particleSystem.addParticleVelocity(particle, velocity, this.space, VelocityOverLifetimePreVelocity);
    }
}

const VelocityOverLifetimeRate = '_VelocityOverLifetime_rate';
const VelocityOverLifetimePreVelocity = '_VelocityOverLifetime_preVelocity';
