import { MinMaxCurveVector3 } from '../../../math/curve/MinMaxCurveVector3';
import { Vector2 } from '../../../math/geom/Vector2';
import { Vector3 } from '../../../math/geom/Vector3';
import { oav } from '../../../objectview/ObjectView';
import { mathUtil } from '../../../polyfill/MathUtil';
import { $set } from '../../../serialization/Serialization';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { Particle } from '../Particle';
import { ParticleModule, RegisterParticleModule } from './ParticleModule';

declare module './ParticleModule' { interface ParticleModuleMap { ParticleRotationBySpeedModule: ParticleRotationBySpeedModule } }
/**
 * 粒子系统 旋转角度随速度变化模块
 */
@RegisterParticleModule('ParticleRotationBySpeedModule')
export class ParticleRotationBySpeedModule extends ParticleModule
{
    /**
     * Set the rotation by speed on each axis separately.
     * 在每个轴上分别设置随速度变化的旋转。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Set the rotation by speed on each axis separately." })
    @oav({ tooltip: '在每个轴上分别设置随速度变化的旋转。' })
    separateAxes = false;

    /**
     * 角速度，随速度变化的旋转。
     */
    @SerializeProperty()
    @oav({ tooltip: '角速度，随速度变化的旋转。' })
    angularVelocity = $set(new MinMaxCurveVector3(), { xCurve: { constant: 45, constantMin: 45, constantMax: 45, curveMultiplier: 45 }, yCurve: { constant: 45, constantMin: 45, constantMax: 45, curveMultiplier: 45 }, zCurve: { constant: 45, constantMin: 45, constantMax: 45, curveMultiplier: 45 } });

    /**
     * Apply the rotation curve between these minimum and maximum speeds.
     *
     * 在这些最小和最大速度之间应用旋转曲线。
     */
    @SerializeProperty()
    @oav({ tooltip: '在这些最小和最大速度之间应用旋转曲线。' })
    range = new Vector2(0, 1);

    /**
     * Rotation by speed curve for the X axis.
     *
     * X轴的旋转随速度变化曲线。
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
     * Rotation by speed curve for the Y axis.
     *
     * Y轴的旋转随速度变化曲线。
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
     * Rotation by speed curve for the Z axis.
     *
     * Z轴的旋转随速度变化曲线。
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
        particle[RotationBySpeedRate] = Math.random();
        particle[RotationBySpeedPreAngularVelocity] = new Vector3();
    }

    /**
     * 更新粒子状态
     * @param particle 粒子
     */
    updateParticleState(particle: Particle)
    {
        const preAngularVelocity: Vector3 = particle[RotationBySpeedPreAngularVelocity];
        particle.angularVelocity.sub(preAngularVelocity);
        preAngularVelocity.set(0, 0, 0);
        if (!this.enabled) return;

        const velocity = particle.velocity.length;
        const rate = mathUtil.clamp((velocity - this.range.x) / (this.range.y - this.range.x), 0, 1);

        const v = this.angularVelocity.getValue(rate, particle[RotationBySpeedRate]);
        if (!this.separateAxes)
        {
            v.x = v.y = 0;
        }
        particle.angularVelocity.add(v);
        preAngularVelocity.copy(v);
    }
}
const RotationBySpeedRate = '_RotationBySpeed_rate';
const RotationBySpeedPreAngularVelocity = '_RotationBySpeed_preAngularVelocity';
