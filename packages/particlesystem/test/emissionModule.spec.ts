import { vec3From, minMaxCurveGetValue } from '@feng3d/math';
import { describe, expect, it } from 'vitest';

import { Particle } from '../src/Particle';
import { ParticleEmissionModule } from '../src/modules/ParticleEmissionModule';

/**
 * `ParticleEmissionModule`（#399 第二批；122 行）。
 *
 * ⚠️ 先说清楚它的**性质**：它**没有 `initParticleState` / `updateParticleState` / `update`**
 * —— 与本批其它模块不同，它是**纯数据 + burst 存取**的模块（同 `ParticleSystemRenderer`）。
 * 所以本文件能测的是"**默认值**"与"**burst 存取契约**"，**没有行为逻辑可断言**。
 *
 * 这一点本身有价值：它说明"按模块名逐个补测试"时，**并非每个模块都有行为可测**，
 * 硬凑覆盖率只会写出同义反复的断言。
 */

describe('ParticleEmissionModule（#399）', () =>
{
    it('rateOverTime 默认为常量 10（与源码声明一致）', () =>
    {
        const module = new ParticleEmissionModule();

        // Constant 模式下 getValue 直接返回 constant
        expect(minMaxCurveGetValue(module.rateOverTime, 0.5)).toBe(10);
    });

    it('rateOverDistance 默认为常量 0', () =>
    {
        const module = new ParticleEmissionModule();

        expect(minMaxCurveGetValue(module.rateOverDistance, 0.5)).toBe(0);
    });

    it('rateOverTimeMultiplier 的 getter/setter 往返一致（转发到 curveMultiplier）', () =>
    {
        const module = new ParticleEmissionModule();

        module.rateOverTimeMultiplier = 3;
        expect(module.rateOverTimeMultiplier).toBe(3);
        // 也可以从曲线上直接看到
        expect(module.rateOverTime.curveMultiplier).toBe(3);
    });

    it('rateOverDistanceMultiplier 的 getter/setter 往返一致', () =>
    {
        const module = new ParticleEmissionModule();

        module.rateOverDistanceMultiplier = 7;
        expect(module.rateOverDistanceMultiplier).toBe(7);
    });

    it('★ burstCount 初始为 0', () =>
    {
        const module = new ParticleEmissionModule();

        expect(module.burstCount).toBe(0);
    });

    it('★ setBursts 之后 burstCount 反映数量', () =>
    {
        const module = new ParticleEmissionModule();
        const bursts = [{ time: 0, count: 3 }, { time: 1, count: 5 }] as never[];

        module.setBursts(bursts);

        expect(module.burstCount).toBe(2);
    });

    it('★ getBursts 能把 setBursts 写进去的内容取回来（填入传入数组）', () =>
    {
        const module = new ParticleEmissionModule();
        const bursts = [{ time: 0, count: 3 }, { time: 1, count: 5 }] as never[];
        module.setBursts(bursts);

        const out: unknown[] = [];
        module.getBursts(out as never);

        expect(out.length).toBe(2);
        expect(out[0]).toEqual(bursts[0]);
        expect(out[1]).toEqual(bursts[1]);
    });

    it('getBursts 传入的数组会被按实际数量填充（不残留旧内容）', () =>
    {
        const module = new ParticleEmissionModule();
        module.setBursts([{ time: 0, count: 1 }] as never[]);

        // 传入一个"更长"的数组：多出来的位置不应保留传入时的旧值
        const out: unknown[] = ['旧值A', '旧值B'];
        module.getBursts(out as never);

        expect(out.length).toBe(1);
        expect(out[0]).not.toBe('旧值A');
    });

    it('setBursts 的 size 参数限制容量（传超长数组时被截断）', () =>
    {
        const module = new ParticleEmissionModule();
        const bursts = [{ time: 0 }, { time: 1 }, { time: 2 }, { time: 3 }] as never[];

        module.setBursts(bursts, 2);

        expect(module.burstCount).toBeLessThanOrEqual(2);
    });

    it('★ 本模块不参与粒子状态：基类的空实现不抛、也不改粒子', () =>
    {
        const module = new ParticleEmissionModule();
        const particle = new Particle();
        vec3From(1, 2, 3, particle.velocity);
        vec3From(4, 5, 6, particle.position);

        // ⚠️ 注意：initParticleState / updateParticleState 在这里**不是 undefined** ——
        // 它们继承自 \`ParticleModule\` 的**空实现**。所以正确的断言是"调用无害"，
        // 而不是"不存在"（第一版写成 toBe('undefined') 就失败了）。
        expect(() =>
        {
            module.initParticleState(particle);
            module.updateParticleState(particle);
        }).not.toThrow();

        expect([particle.velocity.x, particle.velocity.y, particle.velocity.z]).toEqual([1, 2, 3]);
        expect([particle.position.x, particle.position.y, particle.position.z]).toEqual([4, 5, 6]);
    });
});