import { describe, expect, it } from 'vitest';

import { Particle } from '../src/Particle';
import { ParticleSystemSubEmitterType } from '../src/enums/ParticleSystemSubEmitterType';
import { ParticleSubEmittersModule } from '../src/modules/ParticleSubEmittersModule';

/**
 * `ParticleSubEmittersModule`（#399 第二批；158 行）。
 *
 * 它**没有** `initParticleState`，只有 `updateParticleState`，而且实现很短：
 *
 * ```ts
 * updateParticleState(particle) {
 *     for (let i = 0, n = this.subEmittersCount; i < n; i++) {
 *         const emitterType = this.GetSubEmitterType(i);
 *         if (emitterType === ParticleSystemSubEmitterType.Birth) {
 *             this.particleSystem.TriggerSubEmitter(i, [particle]);
 *         }
 *     }
 * }
 * ```
 *
 * 所以核心契约有两条：**只为 `Birth` 类型的子发射器触发**、**传的 index 是它自己的下标**。
 * 另外它**没有 `enabled` 检查**（与 velocity / noise / 颜色等模块不同），本文件把实测行为钉下来。
 */

interface Call { index: number; particles: unknown[] }

/** 假 particleSystem：深层代理 + 特判 TriggerSubEmitter 以记录调用 */
function makeFakeParticleSystem()
{
    const calls: Call[] = [];
    const fn = function () { return undefined; };

    const proxy = new Proxy(fn, {
        get(_t, prop)
        {
            if (prop === 'TriggerSubEmitter')
            {
                return (index: number, particles: unknown[]) => { calls.push({ index, particles }); };
            }
            if (prop === Symbol.toPrimitive || prop === 'valueOf') return () => 1;
            if (prop === 'toString') return () => '1';

            return makeDeep();
        },
        apply() { return undefined; },
    });

    return { calls, proxy };
}

function makeDeep(): unknown
{
    const fn = function () { return undefined; };

    return new Proxy(fn, {
        get(_t, prop)
        {
            if (prop === Symbol.toPrimitive || prop === 'valueOf') return () => 1;
            if (prop === 'toString') return () => '1';

            return makeDeep();
        },
        apply() { return undefined; },
    });
}

/** 造一个只带必要字段的假"子粒子系统"（AddSubEmitter 会写 _isSubParticleSystem） */
function makeFakeSubEmitter()
{
    return { _isSubParticleSystem: false } as unknown as never;
}

function makeModule()
{
    const module = new ParticleSubEmittersModule();
    const fake = makeFakeParticleSystem();
    module.enabled = true;
    module.particleSystem = fake.proxy as never;

    return { module, fake };
}

describe('ParticleSubEmittersModule（#399）', () =>
{
    it("初始 subEmittersCount 为 0", () =>
    {
        const { module } = makeModule();

        expect(module.subEmittersCount).toBe(0);
    });

    it("AddSubEmitter 之后 subEmittersCount 增加，且把子发射器标记为子粒子系统", () =>
    {
        const { module } = makeModule();
        const sub = makeFakeSubEmitter();

        module.AddSubEmitter(sub, ParticleSystemSubEmitterType.Birth, 0 as never, 1);

        expect(module.subEmittersCount).toBe(1);
        // AddSubEmitter 会设置 subEmitter._isSubParticleSystem = true
        expect((sub as unknown as { _isSubParticleSystem: boolean })._isSubParticleSystem).toBe(true);
    });

    it("GetSubEmitterXxx 返回 AddSubEmitter 传入的值", () =>
    {
        const { module } = makeModule();
        const sub = makeFakeSubEmitter();
        module.AddSubEmitter(sub, ParticleSystemSubEmitterType.Birth, 7 as never, 0.25);

        expect(module.GetSubEmitterSystem(0)).toBe(sub as never);
        expect(module.GetSubEmitterType(0)).toBe(ParticleSystemSubEmitterType.Birth);
        expect(module.GetSubEmitterProperties(0)).toBe(7);
        expect(module.GetSubEmitterEmitProbability(0)).toBeCloseTo(0.25, 6);
    });

    it("GetSubEmitterXxx 越界时返回安全默认值（不抛）", () =>
    {
        const { module } = makeModule();

        expect(module.GetSubEmitterEmitProbability(3)).toBe(0);
        expect(() => module.GetSubEmitterType(3)).not.toThrow();
    });

    it("SetSubEmitterXxx 能改掉已添加的值", () =>
    {
        const { module } = makeModule();
        module.AddSubEmitter(makeFakeSubEmitter(), ParticleSystemSubEmitterType.Birth, 0 as never, 1);

        module.SetSubEmitterEmitProbability(0, 0.5);
        module.SetSubEmitterType(0, ParticleSystemSubEmitterType.Collision);

        expect(module.GetSubEmitterEmitProbability(0)).toBeCloseTo(0.5, 6);
        expect(module.GetSubEmitterType(0)).toBe(ParticleSystemSubEmitterType.Collision);
    });

    it("★ RemoveSubEmitter 之后数量减少", () =>
    {
        const { module } = makeModule();
        module.AddSubEmitter(makeFakeSubEmitter(), ParticleSystemSubEmitterType.Birth, 0 as never, 1);
        module.AddSubEmitter(makeFakeSubEmitter(), ParticleSystemSubEmitterType.Birth, 0 as never, 1);

        module.RemoveSubEmitter(0);

        expect(module.subEmittersCount).toBe(1);
    });

    it("★ updateParticleState 只为 Birth 类型触发 TriggerSubEmitter", () =>
    {
        const { module, fake } = makeModule();
        // 第 0 个是 Birth、第 1 个不是
        module.AddSubEmitter(makeFakeSubEmitter(), ParticleSystemSubEmitterType.Birth, 0 as never, 1);
        module.AddSubEmitter(makeFakeSubEmitter(), ParticleSystemSubEmitterType.Collision, 0 as never, 1);
        const particle = new Particle();

        module.updateParticleState(particle);

        expect(fake.calls.length, "只有 Birth 那个应当被触发").toBe(1);
        expect(fake.calls[0].index).toBe(0);
        expect(fake.calls[0].particles).toEqual([particle]);
    });

    it("★ 多个 Birth 时下标各自正确（非 Birth 的下标被跳过）", () =>
    {
        const { module, fake } = makeModule();
        module.AddSubEmitter(makeFakeSubEmitter(), ParticleSystemSubEmitterType.Birth, 0 as never, 1);   // 0 ✓
        module.AddSubEmitter(makeFakeSubEmitter(), ParticleSystemSubEmitterType.Collision, 0 as never, 1);  // 1 ✗
        module.AddSubEmitter(makeFakeSubEmitter(), ParticleSystemSubEmitterType.Birth, 0 as never, 1);   // 2 ✓

        module.updateParticleState(new Particle());

        expect(fake.calls.map((c) => c.index)).toEqual([0, 2]);
    });

    it("没有子发射器时 updateParticleState 不抛异常、也不触发", () =>
    {
        const { module, fake } = makeModule();

        expect(() => module.updateParticleState(new Particle())).not.toThrow();
        expect(fake.calls.length).toBe(0);
    });

    it("⚠️ enabled = false 时的实测行为（本模块没有 enabled 检查）", () =>
    {
        const { module, fake } = makeModule();
        module.enabled = false;
        module.AddSubEmitter(makeFakeSubEmitter(), ParticleSystemSubEmitterType.Birth, 0 as never, 1);

        module.updateParticleState(new Particle());

        // 实测：仍然触发 —— 与 velocity / noise / 颜色等模块不同（那些在 enabled=false 时会提前返回）。
        // 这里**如实记录当前行为**，是否应当改为"关闭即不触发"留给后续讨论（不在本 PR 改 src）。
        expect(fake.calls.length).toBe(1);
    });
});
