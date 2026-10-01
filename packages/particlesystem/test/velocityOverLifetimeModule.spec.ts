import { describe, expect, it } from 'vitest';

import { Particle } from '../src/Particle';
import { ParticleSystemSimulationSpace } from '../src/enums/ParticleSystemSimulationSpace';
import { ParticleVelocityOverLifetimeModule } from '../src/modules/ParticleVelocityOverLifetimeModule';

/**
 * `ParticleVelocityOverLifetimeModule`（issue #392，第一批的第二个模块）。
 *
 * 这个模块本身很薄：计算在 `ParticleSystem` 里，它只负责
 *
 * ```ts
 * updateParticleState(particle) {
 *     this.particleSystem.removeParticleVelocity(particle, PRE_VELOCITY);
 *     if (!this.enabled) return;                        // ← 注意 remove 在 enabled 判断**之前**
 *     const velocity = this.velocity.getValue(rateAtLifeTime, rate);
 *     this.particleSystem.addParticleVelocity(particle, velocity, this.space, PRE_VELOCITY);
 * }
 * ```
 *
 * 所以这里测的是**契约**，而不是数值计算 —— 而这几条契约恰恰容易写错：
 * - **关闭时也必须先移除上一次加上的速度**（否则关掉模块后粒子会永久保留那份速度）；
 * - **remove 与 add 必须用同一个 key**（不一致就会"加了删不掉"或"删了加不回"）；
 * - `remove` 必须在 `enabled` 早退**之前**执行（顺序反了就等于上面第一条失效）。
 *
 * 用一个**只记录调用**的假 `particleSystem` 来断言这些，避免构造真实的 `ParticleSystem`
 * （那需要完整的 Object3D 场景树）。
 */

interface Call
{
    op: 'remove' | 'add';
    args: unknown[];
}

/** 只记录调用的假 ParticleSystem */
function makeFakeParticleSystem()
{
    const calls: Call[] = [];

    return {
        calls,
        removeParticleVelocity(...args: unknown[])
        {
            calls.push({ op: 'remove', args });
        },
        addParticleVelocity(...args: unknown[])
        {
            calls.push({ op: 'add', args });
        },
    };
}

function makeParticle(): Particle
{
    const particle = new Particle();
    particle.rateAtLifeTime = 0.5;

    return particle;
}

/**
 * 造一个模块，`velocity` 三个轴都设成给定常量。
 *
 * ⚠️ 用 `xCurve.constant` 而不是 `xMultiplier`：与 #392 第一个模块踩到的是同一条语义
 * —— `curveMultiplier`（`xMultiplier` 写的就是它）**只在 Curve / TwoCurves 模式下生效**
 * （`MinMaxCurve.getValue` 在 Constant 模式下直接返回 `constant`）。
 */
function makeModule(options: { enabled?: boolean; constant?: number; space?: ParticleSystemSimulationSpace } = {})
{
    const module = new ParticleVelocityOverLifetimeModule();
    const fake = makeFakeParticleSystem();

    module.enabled = options.enabled ?? true;
    module.space = options.space ?? ParticleSystemSimulationSpace.Local;
    module.particleSystem = fake as never;

    const c = options.constant ?? 0;
    module.velocity.xCurve.constant = c;
    module.velocity.yCurve.constant = c;
    module.velocity.zCurve.constant = c;

    return { module, fake };
}

describe('ParticleVelocityOverLifetimeModule（issue #392）', () =>
{
    it('initParticleState：给粒子写入一个 [0,1) 的速率缓存', () =>
    {
        const { module } = makeModule();
        const particle = makeParticle();

        module.initParticleState(particle);

        const rate = (particle as unknown as Record<string, number>)._VelocityOverLifetime_rate;
        expect(typeof rate).toBe('number');
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThan(1);
    });

    it('enabled = true 时：先 remove 上一次的、再 add 这次的（顺序不能反）', () =>
    {
        const { module, fake } = makeModule({ constant: 2 });
        const particle = makeParticle();

        module.updateParticleState(particle);

        expect(fake.calls.map((c) => c.op)).toEqual(['remove', 'add']);
    });

    it('★ enabled = false 时仍然先 remove（否则关掉模块后速度会永久残留）', () =>
    {
        const { module, fake } = makeModule({ enabled: false, constant: 2 });
        const particle = makeParticle();

        module.updateParticleState(particle);

        // 只 remove、不 add —— 这正是"关闭即清除"的实现方式
        expect(fake.calls.map((c) => c.op)).toEqual(['remove']);
    });

    it('★ remove 与 add 用的是同一个 key（不一致就会加了删不掉）', () =>
    {
        const { module, fake } = makeModule({ constant: 1 });
        const particle = makeParticle();

        module.updateParticleState(particle);

        const removeArgs = fake.calls[0].args;
        const addArgs = fake.calls[1].args;

        // removeParticleVelocity(particle, key) / addParticleVelocity(particle, velocity, space, key)
        expect(removeArgs[0]).toBe(particle);
        expect(addArgs[0]).toBe(particle);
        expect(addArgs[3]).toBe(removeArgs[1]);
        expect(typeof removeArgs[1]).toBe('string');
    });

    it('把 space 透传给 addParticleVelocity（Local / World 都要原样传）', () =>
    {
        for (const space of [ParticleSystemSimulationSpace.Local, ParticleSystemSimulationSpace.World])
        {
            const { module, fake } = makeModule({ constant: 1, space });
            module.updateParticleState(makeParticle());

            // addParticleVelocity(particle, velocity, space, key)
            expect(fake.calls[1].args[2], `space=${space}`).toBe(space);
        }
    });

    it('把 velocity 曲线在当前时刻的取值交给 addParticleVelocity', () =>
    {
        const { module, fake } = makeModule({ constant: 3 });
        const particle = makeParticle();

        module.updateParticleState(particle);

        const passed = fake.calls[1].args[1] as { x: number; y: number; z: number };
        expect(passed.x).toBeCloseTo(3, 6);
        expect(passed.y).toBeCloseTo(3, 6);
        expect(passed.z).toBeCloseTo(3, 6);
    });

    it('常量曲线下，多次更新传给 add 的值保持稳定（不产生 NaN）', () =>
    {
        const { module, fake } = makeModule({ constant: 1.5 });
        const particle = makeParticle();

        for (let i = 0; i < 20; i++)
        {
            particle.rateAtLifeTime = i / 20;
            module.updateParticleState(particle);

            const passed = fake.calls[fake.calls.length - 1].args[1] as { x: number; y: number; z: number };
            for (const v of [passed.x, passed.y, passed.z]) expect(Number.isFinite(v)).toBe(true);
        }

        // 20 次更新 = 20 次 remove + 20 次 add
        expect(fake.calls.length).toBe(40);
    });
});