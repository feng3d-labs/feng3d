import { MinMaxCurveVector3 } from '../../../math/curve/MinMaxCurveVector3';
import { oav } from '../../../objectview/ObjectView';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { ParticleSystemSimulationSpace } from '../enums/ParticleSystemSimulationSpace';
import { Particle } from '../Particle';
import { ParticleModule, RegisterParticleModule } from './ParticleModule';

declare module './ParticleModule' { interface ParticleModuleMap { ParticleForceOverLifetimeModule: ParticleForceOverLifetimeModule } }
/**
 * 粒子系统 作用在粒子上的力随时间变化模块
 *
 * 控制每个粒子在其生命周期内的力。
 * Script interface for the Force Over Lifetime module.
 */
@RegisterParticleModule('ParticleForceOverLifetimeModule')
export class ParticleForceOverLifetimeModule extends ParticleModule
{
    /**
     * 作用在粒子上的力
     */
    @SerializeProperty()
    @oav({ tooltip: '作用在粒子上的力' })
    force = new MinMaxCurveVector3();

    /**
     * Are the forces being applied in local or global space?
     *
     * 这些力是作用于局部空间还是全局空间
     */
    @SerializeProperty()
    // @oav({ tooltip: "Are the forces being applied in local or global space?", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace } })
    @oav({ tooltip: '这些力是作用于局部空间还是全局空间?', component: 'OAVEnum', componentParam: { enumClass: ParticleSystemSimulationSpace } })
    space = ParticleSystemSimulationSpace.Local;

    /**
     * When randomly selecting values between two curves or constants, this flag will cause a new random force to be chosen on each frame.
     *
     * 当在两条曲线或常数之间随机选择值时，此标志将导致在每一帧上选择一个新的随机力。
     *
     * @todo
     */
    @SerializeProperty()
    // @oav({ tooltip: "When randomly selecting values between two curves or constants, this flag will cause a new random force to be chosen on each frame." })
    @oav({ tooltip: '当在两条曲线或常数之间随机选择值时，此标志将导致在每一帧上选择一个新的随机力。' })
    randomized = false;

    /**
     * The curve defining particle forces in the X axis.
     *
     * 在X轴上定义粒子力的曲线。
     */
    get x()
    {
        return this.force.xCurve;
    }

    set x(v)
    {
        this.force.xCurve = v;
    }

    /**
     * Change the X axis mulutiplier.
     *
     * 改变X轴的乘数。
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
     * The curve defining particle forces in the Y axis.
     *
     * 在Y轴上定义粒子力的曲线。
     */
    get y()
    {
        return this.force.yCurve;
    }

    set y(v)
    {
        this.force.yCurve = v;
    }

    /**
     * Change the Y axis mulutiplier.
     *
     * 改变Y轴的乘数。
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
     * The curve defining particle forces in the Z axis.
     *
     * 在Z轴上定义粒子力的曲线。
     */
    get z()
    {
        return this.force.zCurve;
    }

    set z(v)
    {
        this.force.zCurve = v;
    }

    /**
     * Change the Z axis mulutiplier.
     *
     * 改变Z轴的乘数。
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
        particle[ForceOverLifetimeRate] = Math.random();
    }

    /**
     * 更新粒子状态
     * @param particle 粒子
     */
    updateParticleState(particle: Particle)
    {
        this.particleSystem.removeParticleAcceleration(particle, ForceOverLifetimePreForce);
        if (!this.enabled) return;

        const force = this.force.getValue(particle.rateAtLifeTime, particle[ForceOverLifetimeRate]);
        this.particleSystem.addParticleAcceleration(particle, force, this.space, ForceOverLifetimePreForce);
    }
}
const ForceOverLifetimeRate = '_ForceOverLifetime_rate';
const ForceOverLifetimePreForce = '_ForceOverLifetime_preForce';
