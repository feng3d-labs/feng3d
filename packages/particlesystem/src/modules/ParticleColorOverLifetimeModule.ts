import { color4Multiply, minMaxGradientDefault, minMaxGradientGetValue } from '@feng3d/math';
import type { MinMaxGradient } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Particle } from '../Particle';
import { ParticleModule } from './ParticleModule';

/**
 * 粒子系统 颜色随时间变化模块
 */
@decoratorRegisterClass()
export class ParticleColorOverLifetimeModule extends ParticleModule
{
    /**
     * The gradient controlling the particle colors.
     * 控制粒子颜色的梯度。
     *
     * issue #134 第二批起 `MinMaxGradient` 是纯数据接口（class 已删除）：装配点显式写
     * `__type__`（面板按它选 `OAVMinMaxGradient` 控件、序列化也靠它识别），默认值由
     * `minMaxGradientDefault()` 补。
     */
    @serialize
    // @oav({ tooltip: "The gradient controlling the particle colors." })
    @oav({ tooltip: '控制粒子颜色的梯度。' })
    color: MinMaxGradient = { __type__: 'MinMaxGradient', ...minMaxGradientDefault() };

    /**
     * 初始化粒子状态
     * @param particle 粒子
     */
    initParticleState(particle: Particle)
    {
        particle[ColorOverLifetimeRate] = Math.random();
    }

    /**
     * 更新粒子状态
     * @param particle 粒子
     */
    updateParticleState(particle: Particle)
    {
        if (!this.enabled) return;

        // 阶段 C-b 起 math 的 `Color4` class 已删除：原 `vec3Multiply(particle.color, c, particle.color)` → `color4Multiply(a, c, out)`
        // issue #134 第二批：原 `this.color.getValue(...)` → `minMaxGradientGetValue(this.color, ...)`
        color4Multiply(particle.color, minMaxGradientGetValue(this.color, particle.rateAtLifeTime, particle[ColorOverLifetimeRate]), particle.color);
    }
}

const ColorOverLifetimeRate = '_ColorOverLifetime_rate';

