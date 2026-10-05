import { color4Multiply, minMaxGradientDefault, minMaxGradientGetValue, vec3Length } from '@feng3d/math';
import type { MinMaxGradient } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass, mathUtil } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
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
     *
     * issue #134 第二批起 `MinMaxGradient` 是纯数据接口（class 已删除）：装配点显式写
     * `__type__`（面板按它选 `OAVMinMaxGradient` 控件、序列化也靠它识别），默认值由
     * `minMaxGradientDefault()` 补。
     */
    @serialize
    @oav({ tooltip: '控制粒子颜色的梯度。' })
    color: MinMaxGradient = { __type__: 'MinMaxGradient', ...minMaxGradientDefault() };

    /**
     * Apply the color gradient between these minimum and maximum speeds.
     *
     * 在这些最小和最大速度之间应用颜色渐变。
     */
    @serialize
    @oav({ tooltip: '在这些最小和最大速度之间应用颜色渐变。' })
    range = { x: 0, y: 1 };

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

        const velocity = vec3Length(particle.velocity);
        const rate = mathUtil.clamp((velocity - this.range.x) / (this.range.y - this.range.x), 0, 1);
        // issue #134 第二批：原 `this.color.getValue(...)` → `minMaxGradientGetValue(this.color, ...)`
        const color = minMaxGradientGetValue(this.color, rate, particle[ColorBySpeedRate]);
        // 阶段 C-b 起 math 的 `Color4` class 已删除：原 `vec3Multiply(particle.color, color, particle.color)` → `color4Multiply(a, c, out)`
        color4Multiply(particle.color, color, particle.color);
    }
}
const ColorBySpeedRate = '_ColorBySpeed_rate';
