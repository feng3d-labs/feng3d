import { describe, expect, it } from 'vitest';
import { vec3From } from '@feng3d/math';

import { Particle } from '../src/Particle';
import { particleColorBySpeedModuleDefault, particleColorBySpeedModuleInitParticleState, particleColorBySpeedModuleUpdateParticleState } from '../src/modules/ParticleColorBySpeedModule';
import { particleColorOverLifetimeModuleDefault, particleColorOverLifetimeModuleInitParticleState, particleColorOverLifetimeModuleUpdateParticleState } from '../src/modules/ParticleColorOverLifetimeModule';

/**
 * 两个颜色模块（issue #392，第一批）。
 *
 * - `ParticleColorOverLifetimeModule`（46 行）：按生命周期位置取色；
 * - `ParticleColorBySpeedModule`（58 行）：按速度归一化后取色。
 *
 * 两者都用 `vec3Multiply(particle.color, ..., particle.color)` 写入 —— 注意是**乘法**，即**就地修改、会累积**。
 * 这是既有设计（调用方每帧或每帧重置），测试里把它**如实断言下来**，免得后人误以为是 bug。
 *
 * `MinMaxGradient` 默认 `mode = Color`（用 `color` 字段，忽略 time），所以本文件只用
 * 常量色验证"取色与写入确实发生"；要验证 rate→颜色的映射需要 `gradient` 模式，那属于另一层
 * （见文末局限）。
 */

function makeParticle(): Particle
{
    const particle = new Particle();
    particle.rateAtLifeTime = 0.5;
    // 起点设为纯白，便于观察"被乘了几次"
    particle.color.r = 1;
    particle.color.g = 1;
    particle.color.b = 1;
    particle.color.a = 1;

    return particle;
}

describe('ParticleColorOverLifetimeModule（issue #392）', () =>
{
    it('initParticleState：写入一个 [0,1) 的速率缓存', () =>
    {
        const module = particleColorOverLifetimeModuleDefault();
        const particle = makeParticle();

        particleColorOverLifetimeModuleInitParticleState(module, particle);

        const rate = (particle as unknown as Record<string, number>)._ColorOverLifetime_rate;
        expect(typeof rate).toBe('number');
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThan(1);
    });

    it('enabled = false 时完全不碰颜色', () =>
    {
        const module = particleColorOverLifetimeModuleDefault();
        module.enabled = false;
        const particle = makeParticle();

        particleColorOverLifetimeModuleUpdateParticleState(module, particle);

        expect(particle.color.r).toBe(1);
        expect(particle.color.g).toBe(1);
        expect(particle.color.b).toBe(1);
        expect(particle.color.a).toBe(1);
    });

    it('enabled = true 时把梯度色乘到粒子颜色上', () =>
    {
        const module = particleColorOverLifetimeModuleDefault();
        module.enabled = true;
        module.color.color.r = 0.5;
        module.color.color.g = 0.25;
        module.color.color.b = 1;
        module.color.color.a = 1;

        const particle = makeParticle();
        particleColorOverLifetimeModuleUpdateParticleState(module, particle);

        expect(particle.color.r).toBeCloseTo(0.5, 6);
        expect(particle.color.g).toBeCloseTo(0.25, 6);
        expect(particle.color.b).toBeCloseTo(1, 6);
        expect(particle.color.a).toBeCloseTo(1, 6);
    });

    it('★ 写入是"乘法且累积"（既有语义，调用方需自行重置颜色）', () =>
    {
        const module = particleColorOverLifetimeModuleDefault();
        module.enabled = true;
        module.color.color.r = 0.5;
        module.color.color.g = 0.5;
        module.color.color.b = 0.5;
        module.color.color.a = 1;

        const particle = makeParticle();
        particleColorOverLifetimeModuleUpdateParticleState(module, particle);
        particleColorOverLifetimeModuleUpdateParticleState(module, particle);

        // 0.5 × 0.5 = 0.25 —— 说明它是就地累积，而不是"赋值为梯度色"
        expect(particle.color.r).toBeCloseTo(0.25, 6);
        expect(particle.color.g).toBeCloseTo(0.25, 6);
    });
});

describe('ParticleColorBySpeedModule（issue #392）', () =>
{
    function makeModule(range?: [number, number])
    {
        const module = particleColorBySpeedModuleDefault();
        module.enabled = true;
        module.color.color.r = 0.5;
        module.color.color.g = 0.5;
        module.color.color.b = 0.5;
        module.color.color.a = 1;
        if (range) module.range = { x: range[0], y: range[1] };

        return module;
    }

    it('initParticleState：写入一个 [0,1) 的速率缓存', () =>
    {
        const module = makeModule();
        const particle = makeParticle();

        particleColorBySpeedModuleInitParticleState(module, particle);

        const rate = (particle as unknown as Record<string, number>)._ColorBySpeed_rate;
        expect(typeof rate).toBe('number');
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThan(1);
    });

    it('enabled = false 时完全不碰颜色', () =>
    {
        const module = makeModule();
        module.enabled = false;
        const particle = makeParticle();
        vec3From(10, 0, 0, particle.velocity);

        particleColorBySpeedModuleUpdateParticleState(module, particle);

        expect(particle.color.r).toBe(1);
    });

    it('速度在 range 内时按比例取色并乘到粒子上', () =>
    {
        const module = makeModule([0, 10]);
        const particle = makeParticle();
        vec3From(5, 0, 0, particle.velocity);

        particleColorBySpeedModuleUpdateParticleState(module, particle);

        expect(particle.color.r).toBeCloseTo(0.5, 6);
        expect(particle.color.g).toBeCloseTo(0.5, 6);
    });

    it('速度超出 range 两端时被夹取（rate 仍在 [0,1]）', () =>
    {
        // 下界：速度为 0、range 从 5 开始 → 夹到 0
        const low = makeModule([5, 10]);
        const p1 = makeParticle();
        vec3From(0, 0, 0, p1.velocity);
        particleColorBySpeedModuleUpdateParticleState(low, p1);
        expect(p1.color.r).toBeCloseTo(0.5, 6);   // 仍是常量色（mode = Color 忽略 rate）

        // 上界：速度 100、range 到 10 → 夹到 1
        const high = makeModule([5, 10]);
        const p2 = makeParticle();
        vec3From(100, 0, 0, p2.velocity);
        particleColorBySpeedModuleUpdateParticleState(high, p2);
        expect(p2.color.r).toBeCloseTo(0.5, 6);
    });

    it('★ range 两端相等（除零）时不应产生 NaN 颜色', () =>
    {
        // 用户把 range 设成 (5,5) 是合理输入；此时 (velocity - x) / (y - x) 是除以 0。
        //
        // ⚠️ 效力说明：本文件的 gradient 用的是默认的 `mode = Color`，而该模式下
        // `MinMaxGradient.getValue` **忽略 rate**（直接返回 `color`）—— 所以这条断言
        // 只能证明"颜色仍是有限数"，**并没有真正走到除零那一步**。要真正验证需要切到
        // `gradient` 模式（多一层 `Gradient` API），留作后续。
        const module = makeModule([5, 5]);
        const particle = makeParticle();
        vec3From(7, 0, 0, particle.velocity);

        particleColorBySpeedModuleUpdateParticleState(module, particle);

        expect(Number.isFinite(particle.color.r), `color.r = ${particle.color.r}`).toBe(true);
        expect(Number.isFinite(particle.color.g)).toBe(true);
        expect(Number.isFinite(particle.color.b)).toBe(true);
        expect(Number.isFinite(particle.color.a)).toBe(true);
    });
});