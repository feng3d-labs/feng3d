import { clamp } from '@feng3d/math';
import { MinMaxCurveVector3, vec3Add, vec3Copy, vec3From, vec3Length, vec3Sub, Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialization, serialize } from '@feng3d/serialization';
import { Particle } from '../Particle';
import { ParticleModule } from './ParticleModule';

/**
 * 粒子系统 旋转角度随速度变化模块
 */
@decoratorRegisterClass()
export class ParticleRotationBySpeedModule extends ParticleModule
{
    /**
     * Set the rotation by speed on each axis separately.
     * 在每个轴上分别设置随速度变化的旋转。
     */
    @serialize
    // @oav({ tooltip: "Set the rotation by speed on each axis separately." })
    @oav({ tooltip: '在每个轴上分别设置随速度变化的旋转。' })
    separateAxes = false;

    /**
     * 角速度，随速度变化的旋转。
     */
    @serialize
    @oav({ tooltip: '角速度，随速度变化的旋转。' })
    angularVelocity = serialization.setValue(new MinMaxCurveVector3(), { xCurve: { constant: Math.PI / 4, constantMin: Math.PI / 4, constantMax: Math.PI / 4, curveMultiplier: Math.PI / 4 }, yCurve: { constant: Math.PI / 4, constantMin: Math.PI / 4, constantMax: Math.PI / 4, curveMultiplier: Math.PI / 4 }, zCurve: { constant: Math.PI / 4, constantMin: Math.PI / 4, constantMax: Math.PI / 4, curveMultiplier: Math.PI / 4 } });

    /**
     * Apply the rotation curve between these minimum and maximum speeds.
     *
     * 在这些最小和最大速度之间应用旋转曲线。
     */
    @serialize
    @oav({ tooltip: '在这些最小和最大速度之间应用旋转曲线。' })
    range = { x: 0, y: 1 };

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
        particle[RotationBySpeedPreAngularVelocity] = { x: 0, y: 0, z: 0 };
    }

    /**
     * 更新粒子状态
     * @param particle 粒子
     */
    updateParticleState(particle: Particle)
    {
        const preAngularVelocity: Vector3 = particle[RotationBySpeedPreAngularVelocity];
        vec3Sub(particle.angularVelocity, preAngularVelocity, particle.angularVelocity);
        vec3From(0, 0, 0, preAngularVelocity);
        if (!this.enabled) return;

        const velocity = vec3Length(particle.velocity);
        const rate = clamp((velocity - this.range.x) / (this.range.y - this.range.x), 0, 1);

        const v = this.angularVelocity.getValue(rate, particle[RotationBySpeedRate]);
        if (!this.separateAxes)
        {
            v.x = v.y = 0;
        }
        vec3Add(particle.angularVelocity, v, particle.angularVelocity);
        vec3Copy(v, preAngularVelocity);
    }
}
const RotationBySpeedRate = '_RotationBySpeed_rate';
const RotationBySpeedPreAngularVelocity = '_RotationBySpeed_preAngularVelocity';
