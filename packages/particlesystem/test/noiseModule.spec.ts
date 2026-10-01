import { describe, expect, it } from 'vitest';

import { Particle } from '../src/Particle';
import { ParticleSystemSimulationSpace } from '../src/enums/ParticleSystemSimulationSpace';
import { ParticleNoiseModule } from '../src/modules/ParticleNoiseModule';

/**
 * `ParticleNoiseModule`（issue #392，第一批最大的一个，486 行）。
 *
 * 与 `ParticleVelocityOverLifetimeModule` **同一种模式**：
 *
 * ```ts
 * this.particleSystem.removeParticlePosition(particle, NoisePreOffset);
 * if (!this.enabled) return;                     // ← remove 在 enabled 判断之前
 * …算 offsetPos…
 * this.particleSystem.addParticlePosition(particle, offsetPos, this.particleSystem.main.simulationSpace, NoisePreOffset);
 * ```
 *
 * 所以同样测**契约**（用只记录调用的假 `particleSystem`），并额外钉住两条本模块特有的东西：
 * 1. **add 时用的空间是 `particleSystem.main.simulationSpace`，不是模块自己的字段**
 *    （velocity 模块用的是 `this.space`，两者不同 —— 这个差异值得断言下来）；
 * 2. **`strength = 0` 时位移必须严格是零向量**（噪声值再好也乘 0）。
 *
 * ⚠️ 装置里用 `strength3D.xCurve.constant` 而**不是** `strength` setter —— 后者大概率走
 * `curveMultiplier`，而那条只在 Curve / TwoCurves 模式生效（本会话已在两个模块上踩过）。
 */

interface Call
{
    op: 'remove' | 'add';
    args: unknown[];
}

function makeFakeParticleSystem(simulationSpace = ParticleSystemSimulationSpace.Local)
{
    const calls: Call[] = [];

    return {
        calls,
        main: { simulationSpace },
        removeParticlePosition(...args: unknown[])
        {
            calls.push({ op: 'remove', args });
        },
        addParticlePosition(...args: unknown[])
        {
            calls.push({ op: 'add', args });
        },
    };
}

function makeParticle(module?: ParticleNoiseModule): Particle
{
    const particle = new Particle();
    particle.rateAtLifeTime = 0.5;
    particle.position.set(0, 0, 0);
    // 实现会读 `particle[NoiseParticleRate]` / `[NoiseStrengthRate]`；不先 init 就会乘出 NaN
    module?.initParticleState(particle);

    return particle;
}

function makeModule(options: { enabled?: boolean; strength?: number; simulationSpace?: ParticleSystemSimulationSpace } = {})
{
    const module = new ParticleNoiseModule();
    const fake = makeFakeParticleSystem(options.simulationSpace);

    module.enabled = options.enabled ?? true;
    module.particleSystem = fake as never;

    const c = options.strength ?? 1;
    module.strength3D.xCurve.constant = c;
    module.strength3D.yCurve.constant = c;
    module.strength3D.zCurve.constant = c;

    return { module, fake };
}

describe('ParticleNoiseModule（issue #392）', () =>
{
    it('initParticleState：写入两个 [0,1) 的速率缓存', () =>
    {
        const { module } = makeModule();
        const particle = makeParticle(module);

        module.initParticleState(particle);

        const record = particle as unknown as Record<string, number>;
        for (const key of ['_Noise_strength_rate', '_Noise_particle_rate'])
        {
            expect(typeof record[key], key).toBe('number');
            expect(record[key], key).toBeGreaterThanOrEqual(0);
            expect(record[key], key).toBeLessThan(1);
        }
    });

    it('★ enabled = false 时仍然先 remove、但不 add', () =>
    {
        const { module, fake } = makeModule({ enabled: false });
        const particle = makeParticle(module);

        module.updateParticleState(particle);

        expect(fake.calls.map((c) => c.op)).toEqual(['remove']);
    });

    it('enabled = true 时：先 remove 再 add（顺序不能反）', () =>
    {
        const { module, fake } = makeModule();
        const particle = makeParticle(module);

        module.updateParticleState(particle);

        expect(fake.calls.map((c) => c.op)).toEqual(['remove', 'add']);
    });

    it('★ remove 与 add 用的是同一个 key', () =>
    {
        const { module, fake } = makeModule();
        const particle = makeParticle(module);

        module.updateParticleState(particle);

        const removeArgs = fake.calls[0].args;
        const addArgs = fake.calls[1].args;

        // removeParticlePosition(particle, key) / addParticlePosition(particle, offset, space, key)
        expect(removeArgs[0]).toBe(particle);
        expect(addArgs[0]).toBe(particle);
        expect(addArgs[3]).toBe(removeArgs[1]);
        expect(typeof removeArgs[1]).toBe('string');
    });

    it('★ add 的空间取自 particleSystem.main.simulationSpace（不是模块自己的字段）', () =>
    {
        for (const space of [ParticleSystemSimulationSpace.Local, ParticleSystemSimulationSpace.World])
        {
            const { module, fake } = makeModule({ simulationSpace: space });
            module.updateParticleState(makeParticle());

            // addParticlePosition(particle, offset, space, key)
            expect(fake.calls[1].args[2], `simulationSpace=${space}`).toBe(space);
        }
    });

    it('★ strength = 0 时位移严格为零向量（噪声值再好也乘 0）', () =>
    {
        const { module, fake } = makeModule({ strength: 0 });
        const particle = makeParticle(module);

        for (let i = 0; i < 10; i++)
        {
            particle.rateAtLifeTime = i / 10;
            module.updateParticleState(particle);

            const offset = fake.calls[fake.calls.length - 1].args[1] as { x: number; y: number; z: number };
            // ⚠️ 用数值比较而不是 `toBe(0)`：噪声值为负时 0 * -1 会得到 `-0`，
            // 而 `toBe` 走 `Object.is`（`Object.is(-0, 0) === false`），会误报失败。
            expect(offset.x).toBeCloseTo(0, 10);
            expect(offset.y).toBeCloseTo(0, 10);
            expect(offset.z).toBeCloseTo(0, 10);
        }
    });

    it('strength 非零时位移是有限数，且不产生 NaN', () =>
    {
        const { module, fake } = makeModule({ strength: 2 });
        const particle = makeParticle(module);

        for (let i = 0; i < 20; i++)
        {
            particle.rateAtLifeTime = i / 20;
            module.updateParticleState(particle);

            const offset = fake.calls[fake.calls.length - 1].args[1] as { x: number; y: number; z: number };
            for (const v of [offset.x, offset.y, offset.z]) expect(Number.isFinite(v)).toBe(true);
        }

        expect(fake.calls.length).toBe(40);
    });

    it('frequency / damping 改变不会让位移失去有限性', () =>
    {
        const { module, fake } = makeModule({ strength: 1 });
        const particle = makeParticle(module);

        for (const frequency of [0.1, 1, 10])
        {
            for (const damping of [true, false])
            {
                module.frequency = frequency;
                module.damping = damping;
                module.updateParticleState(particle);

                const offset = fake.calls[fake.calls.length - 1].args[1] as { x: number; y: number; z: number };
                for (const v of [offset.x, offset.y, offset.z])
                {
                    expect(Number.isFinite(v), `frequency=${frequency} damping=${damping}`).toBe(true);
                }
            }
        }
    });
});