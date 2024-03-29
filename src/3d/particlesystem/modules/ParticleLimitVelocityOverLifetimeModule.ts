import { MinMaxCurve } from '../../../math/curve/MinMaxCurve';
import { MinMaxCurveVector3 } from '../../../math/curve/MinMaxCurveVector3';
import { Matrix4x4 } from '../../../math/geom/Matrix4x4';
import { oav } from '../../../objectview/ObjectView';
import { $set } from '../../../serialization/Serialization';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { ParticleSystemSimulationSpace } from '../enums/ParticleSystemSimulationSpace';
import { Particle } from '../Particle';
import { ParticleModule, RegisterParticleModule } from './ParticleModule';

declare module './ParticleModule' { interface ParticleModuleMap { ParticleLimitVelocityOverLifetimeModule: ParticleLimitVelocityOverLifetimeModule } }
/**
 * Limit Velocity Over Lifetime module.
 *
 * 基于时间轴限制速度模块。
 */
@RegisterParticleModule('ParticleLimitVelocityOverLifetimeModule')
export class ParticleLimitVelocityOverLifetimeModule extends ParticleModule
{
    declare __class__: 'ParticleLimitVelocityOverLifetimeModule';

    /**
     * Set the size over lifetime on each axis separately.
     *
     * 在每个轴上分别设置生命周期内的大小。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Set the size over lifetime on each axis separately." })
    @oav({ tooltip: '在每个轴上分别设置生命周期内的大小。' })
    separateAxes = false;

    /**
     * Maximum velocity curve, when not using one curve per axis.
     *
     * 最大速度曲线，当不使用每轴一个曲线时。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Maximum velocity curve, when not using one curve per axis." })
    @oav({ tooltip: '最大速度曲线，当不使用每轴一个曲线时。' })
    limit = $set(new MinMaxCurve(), { between0And1: true, constant: 1, constantMin: 1, constantMax: 1 });

    /**
     * Maximum velocity.
     *
     * 最高速度。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Maximum velocity." })
    @oav({ tooltip: '最高速度。' })
    limit3D = $set(new MinMaxCurveVector3(), { xCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1 }, yCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1 }, zCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1 } });

    /**
     * Specifies if the velocities are in local space (rotated with the transform) or global space.
     *
     * 指定速度是在局部空间(与变换一起旋转)还是在全局空间。
     */
    // @oav({ tooltip: "Specifies if the velocities are in local space (rotated with the transform) or global space.", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace } })
    @SerializeProperty()
    @oav({ tooltip: '指定速度是在局部空间(与变换一起旋转)还是在全局空间。', component: 'OAVEnum', componentParam: { enumClass: ParticleSystemSimulationSpace } })
    space = ParticleSystemSimulationSpace.Local;

    /**
     * Controls how much the velocity that exceeds the velocity limit should be dampened.
     *
     * 控制多少速度，超过速度限制应该被抑制。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Controls how much the velocity that exceeds the velocity limit should be dampened.", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace } })
    @oav({ tooltip: '控制多少速度，超过速度限制应该被抑制。' })
    dampen = 1;

    /**
     * Change the limit multiplier.
     *
     * 改变限制乘法因子。
     */
    get limitMultiplier()
    {
        return this.limit.curveMultiplier;
    }

    set limitMultiplier(v)
    {
        this.limit.curveMultiplier = v;
    }

    /**
     * Maximum velocity curve for the X axis.
     *
     * X轴的最大速度曲线。
     */
    get limitX()
    {
        return this.limit3D.xCurve;
    }

    set limitX(v)
    {
        this.limit3D.xCurve = v;
    }

    /**
     * Change the limit multiplier on the X axis.
     *
     * 改变X轴上的极限乘法器。
     */
    get limitXMultiplier()
    {
        return this.limit3D.xCurve.curveMultiplier;
    }

    set limitXMultiplier(v)
    {
        this.limit3D.xCurve.curveMultiplier = v;
    }

    /**
     * Maximum velocity curve for the Y axis.
     *
     * Y轴的最大速度曲线。
     */
    get limitY()
    {
        return this.limit3D.yCurve;
    }

    set limitY(v)
    {
        this.limit3D.yCurve = v;
    }

    /**
     * Change the limit multiplier on the Y axis.
     *
     * 改变Y轴上的极限乘法器。
     */
    get limitYMultiplier()
    {
        return this.limit3D.yCurve.curveMultiplier;
    }

    set limitYMultiplier(v)
    {
        this.limit3D.yCurve.curveMultiplier = v;
    }

    /**
     * Maximum velocity curve for the Z axis.
     *
     * Z轴的最大速度曲线。
     */
    get limitZ()
    {
        return this.limit3D.zCurve;
    }

    set limitZ(v)
    {
        this.limit3D.zCurve = v;
    }

    /**
     * Change the limit multiplier on the Z axis.
     *
     * 更改Z轴上的极限乘法器。
     */
    get limitZMultiplier()
    {
        return this.limit3D.zCurve.curveMultiplier;
    }

    set limitZMultiplier(v)
    {
        this.limit3D.zCurve.curveMultiplier = v;
    }

    /**
     * 初始化粒子状态
     *
     * @param particle 粒子
     */
    initParticleState(particle: Particle)
    {
        particle[LimitVelocityOverLifetimeRate] = Math.random();
    }

    /**
     * 更新粒子状态
     *
     * @param particle 粒子
     */
    updateParticleState(particle: Particle)
    {
        if (!this.enabled) return;

        const limit3D = this.limit3D.getValue(particle.rateAtLifeTime, particle[LimitVelocityOverLifetimeRate]);
        const limit = this.limit.getValue(particle.rateAtLifeTime, particle[LimitVelocityOverLifetimeRate]);
        const pVelocity = particle.velocity.clone();

        // 计算变换矩阵
        const mat = new Matrix4x4();
        //
        if (this.space !== this.particleSystem.main.simulationSpace)
        {
            if (this.space === ParticleSystemSimulationSpace.Global)
            {
                mat.copy(this.particleSystem.node3d.globalMatrix);
            }
            else
            {
                mat.copy(this.particleSystem.node3d.invertGlobalMatrix);
            }
        }
        // 变换到现在空间进行限速
        mat.transformVector3(pVelocity, pVelocity);
        if (this.separateAxes)
        {
            pVelocity.clamp(limit3D.negateTo(), limit3D);
        }
        else
            if (pVelocity.lengthSquared > limit * limit)
            { pVelocity.normalize(limit); }
        mat.invert();
        // 还原到原空间
        mat.transformVector3(pVelocity, pVelocity);
        //
        particle.velocity.lerpNumber(pVelocity, this.dampen);
    }
}

const LimitVelocityOverLifetimeRate = '_LimitVelocityOverLifetime_rate';
