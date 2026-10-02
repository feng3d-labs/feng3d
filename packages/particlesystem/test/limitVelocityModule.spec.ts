import { describe, expect, it } from 'vitest';
import { MinMaxCurve, vec3Copy, vec3Length } from '@feng3d/math';

import { Particle } from '../src/Particle';
import { ParticleSystemSimulationSpace } from '../src/enums/ParticleSystemSimulationSpace';
import { ParticleLimitVelocityOverLifetimeModule } from '../src/modules/ParticleLimitVelocityOverLifetimeModule';

/**
 * `ParticleLimitVelocityOverLifetimeModule`（issue #392，第一批的第一个模块）。
 *
 * 它是 `particlesystem/src/modules/` 里零测试的 18 个模块之一。统一契约：
 * `initParticleState` / `updateParticleState`，纯计算、无需 GPU。
 *
 * 被测的核心逻辑（`updateParticleState`）：
 * ```
 * if (!enabled) return;
 * if (space !== particleSystem.main.simulationSpace) { …矩阵变换… }   // ← 让两者相等即可跳过
 * if (separateAxes) pVelocity.clamp(-limit3D, limit3D);
 * else if (pVelocity.lengthSquared > limit*limit) pVelocity.normalize(limit);
 * vec3LerpNumber(particle.velocity, pVelocity, dampen, particle.velocity);
 * ```
 *
 * 因此测试给它一个**只含被读字段**的假 `particleSystem`（`main.simulationSpace`），
 * 让 `space` 与之相等 —— 这样就不必构造真实的 `ParticleSystem`（那需要完整的 Object3D 树）。
 */

/** 造一个粒子，速度按参数给 */
function makeParticle(vx: number, vy = 0, vz = 0): Particle
{
    const particle = new Particle();
    particle.rateAtLifeTime = 0.5;
    particle.velocity = { x: vx, y: vy, z: vz };

    return particle;
}

/**
 * 造一个开启的模块，`limit` 走 `limitMultiplier` 设置。
 *
 * `space` 与假 `particleSystem.main.simulationSpace` 都取 Local，使实现跳过矩阵变换分支
 * （那条分支要读 `logic(this.particleSystem._obj()).local2world`，需要真实场景树）。
 */
function makeModule(options: { limit?: number; dampen?: number; separateAxes?: boolean } = {}): ParticleLimitVelocityOverLifetimeModule
{
    const module = new ParticleLimitVelocityOverLifetimeModule();
    module.enabled = true;
    module.space = ParticleSystemSimulationSpace.Local;
    module.particleSystem = { main: { simulationSpace: ParticleSystemSimulationSpace.Local } } as never;

    // ⚠️ 用 `constant` 而不是 `limitMultiplier`：
    // `limitMultiplier` 的 setter 写的是 `limit.curveMultiplier`，而 `MinMaxCurve.getValue`
    // **只在 Curve / TwoCurves 模式下才乘 curveMultiplier**（Constant 模式直接返回 constant）。
    // 这是 Unity 的语义（"Curve Multiplier" 只对曲线有意义），所以默认模式下改它是空操作。
    if (options.limit !== undefined)
    {
        const curve = new MinMaxCurve();
        curve.constant = options.limit;
        module.limit = curve;
    }
    if (options.dampen !== undefined) module.dampen = options.dampen;
    if (options.separateAxes !== undefined) module.separateAxes = options.separateAxes;

    return module;
}

describe('ParticleLimitVelocityOverLifetimeModule（issue #392）', () =>
{
    it('initParticleState：给粒子写入一个 [0,1) 的速率缓存', () =>
    {
        const module = makeModule();
        const particle = makeParticle(0);

        module.initParticleState(particle);

        const rate = (particle as unknown as Record<string, number>)._LimitVelocityOverLifetime_rate;
        expect(typeof rate).toBe('number');
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThan(1);
    });

    it('enabled = false 时完全不碰粒子（速度原样保留）', () =>
    {
        const module = makeModule({ limit: 1 });
        module.enabled = false;

        const particle = makeParticle(10, 0, 0);
        const before = vec3Copy(particle.velocity);

        module.updateParticleState(particle);

        expect(particle.velocity.x).toBe(before.x);
        expect(particle.velocity.y).toBe(before.y);
        expect(particle.velocity.z).toBe(before.z);
    });

    it('速度超过上限时被限到上限（dampen = 1 时立即生效）', () =>
    {
        const module = makeModule({ limit: 2, dampen: 1 });
        const particle = makeParticle(10, 0, 0);
        module.initParticleState(particle);

        module.updateParticleState(particle);

        // 只改大小、不改方向：仍在 +X 轴上，长度被压到 limit
        expect(particle.velocity.x).toBeCloseTo(2, 5);
        expect(particle.velocity.y).toBeCloseTo(0, 5);
        expect(particle.velocity.z).toBeCloseTo(0, 5);
        expect(vec3Length(particle.velocity)).toBeCloseTo(2, 5);
    });

    it('速度未超过上限时原样保留', () =>
    {
        const module = makeModule({ limit: 5, dampen: 1 });
        const particle = makeParticle(3, 0, 0);
        module.initParticleState(particle);

        module.updateParticleState(particle);

        expect(vec3Length(particle.velocity)).toBeCloseTo(3, 5);
    });

    it('dampen 生效：0.5 时结果落在原速度与限速值之间', () =>
    {
        const module = makeModule({ limit: 2, dampen: 0.5 });
        const particle = makeParticle(10, 0, 0);
        module.initParticleState(particle);

        module.updateParticleState(particle);

        // 原 10 → 限速目标 2，按 0.5 插值 → 6
        expect(vec3Length(particle.velocity)).toBeCloseTo(6, 5);
    });

    it('separateAxes = true 时逐轴 clamp（各轴独立受限）', () =>
    {
        const module = makeModule({ limit: 1, dampen: 1, separateAxes: true });
        const particle = makeParticle(10, -10, 0.5);
        module.initParticleState(particle);

        module.updateParticleState(particle);

        // 逐轴被夹到 ±limit（limit 默认 constant 1 × multiplier 1）
        expect(Math.abs(particle.velocity.x)).toBeLessThanOrEqual(1.000001);
        expect(Math.abs(particle.velocity.y)).toBeLessThanOrEqual(1.000001);
        expect(Math.abs(particle.velocity.z)).toBeLessThanOrEqual(0.500001);
        expect(particle.velocity.x).toBeCloseTo(1, 5);
        expect(particle.velocity.y).toBeCloseTo(-1, 5);
    });

    it('改变 limit 后限速结果随之变化（参数确实生效）', () =>
    {
        const run = (limit: number) =>
        {
            const module = makeModule({ limit, dampen: 1 });
            const particle = makeParticle(10, 0, 0);
            module.initParticleState(particle);
            module.updateParticleState(particle);

            return vec3Length(particle.velocity);
        };

        expect(run(1)).toBeCloseTo(1, 5);
        expect(run(4)).toBeCloseTo(4, 5);
    });

    it('不产生 NaN / Infinity（多次随机速率下）', () =>
    {
        const module = makeModule({ limit: 2, dampen: 0.7 });
        const particle = makeParticle(10, -4, 3);

        for (let i = 0; i < 50; i++)
        {
            particle.rateAtLifeTime = i / 50;
            module.initParticleState(particle);
            module.updateParticleState(particle);

            for (const v of [particle.velocity.x, particle.velocity.y, particle.velocity.z])
            {
                expect(Number.isFinite(v), `第 ${i} 次后 velocity 出现非有限数`).toBe(true);
            }
            expect(Number.isFinite(vec3Length(particle.velocity))).toBe(true);
        }
    });
});