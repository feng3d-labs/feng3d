import { vec3From } from '@feng3d/math';
import { describe, expect, it } from 'vitest';

import { Particle } from '../src/Particle';
import { ParticleSystemSimulationSpace } from '../src/enums/ParticleSystemSimulationSpace';
import { ParticleMainModule } from '../src/modules/ParticleMainModule';

/**
 * `ParticleMainModule`（issue #392 第二批，561 行 —— 这批里最大的"主模块"）。
 *
 * 本文件只钉**纯数据流**的部分（断言明确、不依赖随机）：
 *
 * ```ts
 * // initParticleState
 * particle.velocity / acceleration / angularVelocity .set(0, 0, 0)   // ★ 清零
 * useStartSize3D ? startSize.copy(minMaxCurveVector3GetValue(startSize3D, ...)) : vec3From(s, s, s, startSize)   // ★ 非 3D 时三分量相同
 * useStartRotation3D ? rotation.copy(minMaxCurveVector3GetValue(startRotation3D, ...)) : vec3From(0, 0, r, rotation)  // ★ 非 3D 时只有 Z
 * particle.startColor.copy(minMaxCurveGetValue(startColor, ...))
 *
 * // updateParticleState
 * vec3Copy(particle.startSize, particle.size); vec3Copy(particle.startColor, particle.color)
 * particleSystem.addParticleAcceleration(particle, gravity, World, MainPreGravity)
 * ```
 *
 * 假 `particleSystem` 仍用**深层代理**（`updateParticleState` 会读 `_emitInfo.rateAtDuration`；
 * `gravityModifier` 默认是 Constant 模式，不依赖那个时间参数）。
 */

function makeDeepPermissive(): unknown
{
    const fn = function () { return undefined; };

    return new Proxy(fn, {
        get(_t, prop)
        {
            if (prop === 'simulationSpace') return ParticleSystemSimulationSpace.Local;
            if (prop === Symbol.toPrimitive) return () => 1;
            if (prop === 'valueOf') return () => 1;
            if (prop === 'toString') return () => '1';

            return makeDeepPermissive();
        },
        apply()
        {
            return undefined;
        },
    });
}

interface Call { op: string; args: unknown[] }

function makeFakeParticleSystem()
{
    const calls: Call[] = [];
    const fn = function () { return undefined; };

    // 深层代理**直接作为** particleSystem：既能被任意访问/调用（\`_emitInfo.rateAtDuration\` 这类
    // 深层读取不会抛），又能在 get 里特判需要断言的方法。
    const proxy = new Proxy(fn, {
        get(_t, prop)
        {
            if (prop === 'addParticleAcceleration')
            {
                return (...args: unknown[]) => { calls.push({ op: 'addAccel', args }); };
            }
            if (prop === 'simulationSpace') return ParticleSystemSimulationSpace.Local;
            if (prop === Symbol.toPrimitive || prop === 'valueOf') return () => 1;
            if (prop === 'toString') return () => '1';

            return makeDeepPermissive();
        },
        apply() { return undefined; },
    });

    return { calls, proxy };
}

/**
 * 造一个模块：
 * - `startSize`（非 3D）= 常量 s；`startRotation`（非 3D）= 常量 r；`startColor` = 给定色；
 * - 3D 版本各分量设成可区分的值，便于断言"走的是哪条分支"。
 */
function makeModule(options: { size?: number; rotation?: number } = {})
{
    const module = new ParticleMainModule();
    const fake = makeFakeParticleSystem();
    module.enabled = true;
    module.particleSystem = fake.proxy as never;

    // ⚠️ 不要另外设 \`module.startSize\` / \`module.startRotation\`：
    // \`get startSize() { return this.startSize3D.xCurve; }\` —— 它们与 3D 曲线的 x 分量是**同一个对象**，
    // 设两次会互相覆盖（第一版就是这样把自己设的值覆盖成了 1）。
    // 只设 3D 曲线的各分量，用互不相同的值区分两条分支：
    //   非 3D 分支取 xCurve → (x, x, x)；3D 分支取 (x, 2, 3)
    module.startSize3D.xCurve.constant = options.size ?? 1;
    module.startSize3D.yCurve.constant = 2;
    module.startSize3D.zCurve.constant = 3;
    module.startRotation3D.xCurve.constant = options.rotation ?? 0.1;
    module.startRotation3D.yCurve.constant = 0.2;
    module.startRotation3D.zCurve.constant = 0.3;

    module.startColor.color.r = 0.25;
    module.startColor.color.g = 0.5;
    module.startColor.color.b = 0.75;
    module.startColor.color.a = 1;

    return { module, fake };
}

function makeParticle(): Particle
{
    const particle = new Particle();
    particle.rateAtLifeTime = 0.5;
    particle.birthRateAtDuration = 0.5;

    return particle;
}

describe('ParticleMainModule（issue #392 第二批）', () =>
{
    it('★ initParticleState 把速度、加速度、角速度清零', () =>
    {
        const { module } = makeModule();
        const particle = makeParticle();
        // 先塞入非零值，确认确实是被"清零"而不是"本来就没有"
        vec3From(9, 9, 9, particle.velocity);
        vec3From(9, 9, 9, particle.acceleration);
        vec3From(9, 9, 9, particle.angularVelocity);

        module.initParticleState(particle);

        for (const [label, v] of [['velocity', particle.velocity], ['acceleration', particle.acceleration], ['angularVelocity', particle.angularVelocity]] as const)
        {
            expect([v.x, v.y, v.z], label).toEqual([0, 0, 0]);
        }
    });

    it('★ useStartSize3D = false 时三分量取同一个值', () =>
    {
        const { module } = makeModule({ size: 3 });
        module.useStartSize3D = false;
        const particle = makeParticle();

        module.initParticleState(particle);

        expect([particle.startSize.x, particle.startSize.y, particle.startSize.z]).toEqual([3, 3, 3]);
    });

    it('useStartSize3D = true 时各分量取 3D 曲线各自的常量（默认 1/2/3）', () =>
    {
        const { module } = makeModule();
        module.useStartSize3D = true;
        const particle = makeParticle();

        module.initParticleState(particle);

        expect([particle.startSize.x, particle.startSize.y, particle.startSize.z]).toEqual([1, 2, 3]);
    });

    it('★ useStartRotation3D = false 时只有 Z 分量被设置（X/Y 归零）', () =>
    {
        const { module } = makeModule({ rotation: 0.5 });
        module.useStartRotation3D = false;
        const particle = makeParticle();
        vec3From(9, 9, 9, particle.rotation);

        module.initParticleState(particle);

        // 非 3D 分支写的是 `vec3From(0, 0, startRotation, rotation)`，而
        // `get startRotation()` 指向 `startRotation3D.zCurve`（实测），所以期望值是该分量的常量
        expect(particle.rotation.x).toBe(0);
        expect(particle.rotation.y).toBe(0);
        expect(particle.rotation.z).toBeCloseTo(0.3, 6);
    });

    it('useStartRotation3D = true 时各分量取 3D 曲线各自的常量', () =>
    {
        const { module } = makeModule();
        module.useStartRotation3D = true;
        const particle = makeParticle();

        module.initParticleState(particle);

        expect(particle.rotation.x).toBeCloseTo(0.1, 6);
        expect(particle.rotation.y).toBeCloseTo(0.2, 6);
        expect(particle.rotation.z).toBeCloseTo(0.3, 6);
    });

    it('startColor 被复制到 particle.startColor', () =>
    {
        const { module } = makeModule();
        const particle = makeParticle();

        module.initParticleState(particle);

        expect(particle.startColor.r).toBeCloseTo(0.25, 6);
        expect(particle.startColor.g).toBeCloseTo(0.5, 6);
        expect(particle.startColor.b).toBeCloseTo(0.75, 6);
        expect(particle.startColor.a).toBeCloseTo(1, 6);
    });

    it('★ updateParticleState 把 size / color 从 start* 复制过来', () =>
    {
        const { module } = makeModule();
        const particle = makeParticle();

        module.initParticleState(particle);
        // 故意把当前值改坏，确认会被 start* 覆盖（而不是"恰好相等"）
        vec3From(0, 0, 0, particle.size);
        particle.color.r = 0;
        particle.color.g = 0;
        particle.color.b = 0;

        module.updateParticleState(particle);

        expect([particle.size.x, particle.size.y, particle.size.z]).toEqual([particle.startSize.x, particle.startSize.y, particle.startSize.z]);
        expect(particle.color.r).toBeCloseTo(particle.startColor.r, 6);
        expect(particle.color.g).toBeCloseTo(particle.startColor.g, 6);
        expect(particle.color.b).toBeCloseTo(particle.startColor.b, 6);
    });

    it('★ updateParticleState 走 addParticleAcceleration，并用 World 空间与固定 key', () =>
    {
        const { module, fake } = makeModule();
        const particle = makeParticle();

        module.updateParticleState(particle);

        const call = fake.calls.find((c) => c.op === 'addAccel');
        expect(call).toBeTruthy();
        // addParticleAcceleration(particle, acceleration, space, key)
        expect(call!.args[0]).toBe(particle);
        expect(call!.args[2]).toBe(ParticleSystemSimulationSpace.World);
        expect(typeof call!.args[3]).toBe('string');
    });

    it('不产生 NaN / Infinity（反复调用）', () =>
    {
        const { module } = makeModule();
        const particle = makeParticle();

        for (let i = 0; i < 20; i++)
        {
            particle.birthRateAtDuration = i / 20;
            module.initParticleState(particle);
            module.updateParticleState(particle);

            for (const v of [particle.size.x, particle.size.y, particle.size.z, particle.startSize.x, particle.rotation.z, particle.color.r, particle.color.a])
            {
                expect(Number.isFinite(v), `第 ${i} 次`).toBe(true);
            }
        }
    });
});