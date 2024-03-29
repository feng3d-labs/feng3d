import { MinMaxCurveVector3 } from '../../../math/curve/MinMaxCurveVector3';
import { Vector3 } from '../../../math/geom/Vector3';
import { oav } from '../../../objectview/ObjectView';
import { $set } from '../../../serialization/Serialization';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { Particle } from '../Particle';
import { ParticleModule, RegisterParticleModule } from './ParticleModule';

declare module './ParticleModule' { interface ParticleModuleMap { ParticleRotationOverLifetimeModule: ParticleRotationOverLifetimeModule } }
/**
 * 粒子系统 旋转角度随时间变化模块
 */
@RegisterParticleModule('ParticleRotationOverLifetimeModule')
export class ParticleRotationOverLifetimeModule extends ParticleModule
{
    /**
     * Set the rotation over lifetime on each axis separately.
     * 在每个轴上分别设置基于生命周期的旋转。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Set the rotation over lifetime on each axis separately." })
    @oav({ tooltip: '在每个轴上分别设置基于生命周期的旋转。' })
    separateAxes = false;

    /**
     * 角速度，基于生命周期的旋转。
     */
    @SerializeProperty()
    @oav({ tooltip: '角速度，基于生命周期的旋转。' })
    angularVelocity = $set(new MinMaxCurveVector3(), { xCurve: { constant: 45, constantMin: 45, constantMax: 45, curveMultiplier: 45 }, yCurve: { constant: 45, constantMin: 45, constantMax: 45, curveMultiplier: 45 }, zCurve: { constant: 45, constantMin: 45, constantMax: 45, curveMultiplier: 45 } });

    /**
     * Rotation over lifetime curve for the X axis.
     *
     * X轴的旋转寿命曲线。
     */
    get x()
    {
        return this.angularVelocity.xCurve;
    }

    set x(v)
    {
        this.angularVelocity.xCurve = v;
    }

    /**
     * Rotation multiplier around the X axis.
     *
     * 绕X轴旋转乘法器
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
     * Rotation over lifetime curve for the Y axis.
     *
     * Y轴的旋转寿命曲线。
     */
    get y()
    {
        return this.angularVelocity.yCurve;
    }

    set y(v)
    {
        this.angularVelocity.yCurve = v;
    }

    /**
     * Rotation multiplier around the Y axis.
     *
     * 绕Y轴旋转乘法器
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
     * Rotation over lifetime curve for the Z axis.
     *
     * Z轴的旋转寿命曲线。
     */
    get z()
    {
        return this.angularVelocity.zCurve;
    }

    set z(v)
    {
        this.angularVelocity.zCurve = v;
    }

    /**
     * Rotation multiplier around the Z axis.
     *
     * 绕Z轴旋转乘法器
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
        particle[RotationOverLifetimeRate] = Math.random();
        particle[RotationOverLifetimePreAngularVelocity] = new Vector3();
    }

    /**
     * 更新粒子状态
     * @param particle 粒子
     */
    updateParticleState(particle: Particle)
    {
        const preAngularVelocity: Vector3 = particle[RotationOverLifetimePreAngularVelocity];
        particle.angularVelocity.sub(preAngularVelocity);
        preAngularVelocity.set(0, 0, 0);
        if (!this.enabled) return;

        const v = this.angularVelocity.getValue(particle.rateAtLifeTime, particle[RotationOverLifetimeRate]);
        if (!this.separateAxes)
        {
            v.x = v.y = 0;
        }
        particle.angularVelocity.add(v);
        preAngularVelocity.copy(v);
    }
}
const RotationOverLifetimeRate = '_RotationOverLifetime_rate';
const RotationOverLifetimePreAngularVelocity = '_RotationOverLifetime_preAngularVelocity';
