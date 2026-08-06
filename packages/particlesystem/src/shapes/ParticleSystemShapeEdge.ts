import { Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { ParticleSystemShapeMultiModeValue } from '../enums/ParticleSystemShapeMultiModeValue';
import { Particle } from '../Particle';
import { ParticleSystemShape } from './ParticleSystemShape';

/**
 * 粒子系统 发射边
 */
export class ParticleSystemShapeEdge extends ParticleSystemShape
{
    /**
     * 边长的一半。
     */
    @oav({ tooltip: '边长的一半。' })
    get radius()
    {
        return this._module.radius;
    }

    set radius(v)
    {
        this._module.radius = v;
    }

    /**
     * The mode used for generating particles around the radius.
     *
     * 在弧线周围产生粒子的模式。
     */
    @oav({ tooltip: '在弧线周围产生粒子的模式。', component: 'OAVEnum', componentParam: { enumClass: ParticleSystemShapeMultiModeValue } })
    get radiusMode()
    {
        return this._module.radiusMode;
    }

    set radiusMode(v)
    {
        this._module.radiusMode = v;
    }

    /**
     * Control the gap between emission points around the radius.
     *
     * 控制弧线周围发射点之间的间隙。
     */
    @oav({ tooltip: '控制弧线周围发射点之间的间隙。' })
    get radiusSpread()
    {
        return this._module.radiusSpread;
    }

    set radiusSpread(v)
    {
        this._module.radiusSpread = v;
    }

    /**
     * When using one of the animated modes, how quickly to move the emission position around the radius.
     *
     * 当使用一个动画模式时，如何快速移动发射位置周围的弧。
     */
    @oav({ tooltip: '当使用一个动画模式时，如何快速移动发射位置周围的弧。' })
    get radiusSpeed()
    {
        return this._module.radiusSpeed;
    }

    set radiusSpeed(v)
    {
        this._module.radiusSpeed = v;
    }

    /**
     * 计算粒子的发射位置与方向
     *
     * @param particle
     * @param position
     * @param dir
     */
    calcParticlePosDir(particle: Particle, position: Vector3, dir: Vector3)
    {
        const arc = 360 * this.radius;
        // 在圆心的方向
        let radiusAngle = 0;
        if (this.radiusMode === ParticleSystemShapeMultiModeValue.Random)
        {
            radiusAngle = Math.random() * arc;
        }
        else if (this.radiusMode === ParticleSystemShapeMultiModeValue.Loop)
        {
            const totalAngle = particle.birthTime * this.radiusSpeed.getValue(particle.birthRateAtDuration) * 360;
            radiusAngle = totalAngle % arc;
        }
        else if (this.radiusMode === ParticleSystemShapeMultiModeValue.PingPong)
        {
            const totalAngle = particle.birthTime * this.radiusSpeed.getValue(particle.birthRateAtDuration) * 360;
            radiusAngle = totalAngle % arc;
            if (Math.floor(totalAngle / arc) % 2 === 1)
            {
                radiusAngle = arc - radiusAngle;
            }
        }
        if (this.radiusSpread > 0)
        {
            radiusAngle = Math.floor(radiusAngle / arc / this.radiusSpread) * arc * this.radiusSpread;
        }
        radiusAngle = radiusAngle / arc;

        //
        dir.set(0, 1, 0);
        position.set(this.radius * (radiusAngle * 2 - 1), 0, 0);
    }
}
