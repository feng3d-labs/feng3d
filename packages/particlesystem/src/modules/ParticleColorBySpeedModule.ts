import { MinMaxGradient, Vector2 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { mathUtil } from '@feng3d/polyfill';
import { decoratorRegisterClass, serialize } from '@feng3d/serialization';
import { Particle } from '../Particle';
import { ParticleModule } from './ParticleModule';

/**
 * the Color By Speed module.
 *
 * 颜色随速度变化模块。
 */
@decoratorRegisterClass()
export class ParticleColorBySpeedModule extends ParticleModule
{
    /**
     * The gradient controlling the particle colors.
     *
     * 控制粒子颜色的梯度。
     */
    @serialize
    @oav({ tooltip: '控制粒子颜色的梯度。' })
    color = new MinMaxGradient();

    /**
     * Apply the color gradient between these minimum and maximum speeds.
     *
     * 在这些最小和最大速度之间应用颜色渐变。
     */
    @serialize
    @oav({ tooltip: '在这些最小和最大速度之间应用颜色渐变。' })
    range = new Vector2(0, 1);

    /**
     * 初始化粒子状态
     * @param particle 粒子
     */
    initParticleState(particle: Particle)
    {
        particle[ColorBySpeedRate] = Math.random();
    }

    /**
     * 更新粒子状态
     * @param particle 粒子
     */
    updateParticleState(particle: Particle)
    {
        if (!this.enabled) return;

        const velocity = particle.velocity.length;
        const rate = mathUtil.clamp((velocity - this.range.x) / (this.range.y - this.range.x), 0, 1);
        const color = this.color.getValue(rate, particle[ColorBySpeedRate]);
        particle.color.multiply(color);
    }
}
const ColorBySpeedRate = '_ColorBySpeed_rate';
