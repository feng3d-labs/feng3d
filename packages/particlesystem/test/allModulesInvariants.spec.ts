import { vec3From } from '@feng3d/math';
import { describe, expect, it } from 'vitest';

import { Particle } from '../src/Particle';
import { ParticleSystemSimulationSpace } from '../src/enums/ParticleSystemSimulationSpace';
import { particleColorBySpeedModuleDefault, particleColorBySpeedModuleInitParticleState, particleColorBySpeedModuleUpdateParticleState, type ParticleColorBySpeedModule } from '../src/modules/ParticleColorBySpeedModule';
import { particleColorOverLifetimeModuleDefault, particleColorOverLifetimeModuleInitParticleState, particleColorOverLifetimeModuleUpdateParticleState, type ParticleColorOverLifetimeModule } from '../src/modules/ParticleColorOverLifetimeModule';
import { ParticleEmissionModule } from '../src/modules/ParticleEmissionModule';
import { particleForceOverLifetimeModuleDefault, particleForceOverLifetimeModuleInitParticleState, particleForceOverLifetimeModuleUpdateParticleState, type ParticleForceOverLifetimeModule } from '../src/modules/ParticleForceOverLifetimeModule';
import { particleInheritVelocityModuleDefault, particleInheritVelocityModuleInitParticleState, particleInheritVelocityModuleUpdateParticleState, type ParticleInheritVelocityModule } from '../src/modules/ParticleInheritVelocityModule';
import { particleLimitVelocityOverLifetimeModuleDefault, particleLimitVelocityOverLifetimeModuleInitParticleState, particleLimitVelocityOverLifetimeModuleUpdateParticleState, type ParticleLimitVelocityOverLifetimeModule } from '../src/modules/ParticleLimitVelocityOverLifetimeModule';
import { ParticleMainModule } from '../src/modules/ParticleMainModule';
import { ParticleNoiseModule } from '../src/modules/ParticleNoiseModule';
import { ParticleSizeBySpeedModule } from '../src/modules/ParticleSizeBySpeedModule';
import { ParticleSizeOverLifetimeModule } from '../src/modules/ParticleSizeOverLifetimeModule';
import { ParticleSubEmittersModule } from '../src/modules/ParticleSubEmittersModule';
import { ParticleSystemRenderer } from '../src/modules/ParticleSystemRenderer';
import { ParticleVelocityOverLifetimeModule } from '../src/modules/ParticleVelocityOverLifetimeModule';

/**
 * 可独立测试的粒子模块的"不抛异常 + 粒子状态有限"不变量（issue #392，第一批最后一项）。
 *
 * 这是**探针式**测试：用一个"什么都能访问、能调用、参与算术得 1"的假 `particleSystem`，
 * 把每个模块都跑一遍 `initParticleState` + `updateParticleState`，看有没有模块一调用就崩或产出 NaN。
 * 本会话的 #376 就是"补测试时撞出真 bug"的先例。
 *
 * **范围**：只覆盖 13 个能脱离完整运行时上下文的模块。
 * 另有 4 个模块实测会读 `particle` 上由 `ParticleSystem` 在运行期填充的中间字段，
 * 单测里只靠 stub 提供不了，已排除 —— 它们的失败**不是 bug**（实测错误）：
 *
 * | 模块 | 实测错误 |
 * |---|---|
 * | `ParticleShapeModule` | `Cannot read properties of undefined (reading 'getValue')` |
 * | `ParticleTextureSheetAnimationModule` | `Cannot read properties of undefined (reading 'has')` |
 * | `ParticleRotationBySpeedModule` | `Cannot read properties of undefined (reading 'x')`（连 `enabled = false` 也抛） |
 * | `ParticleRotationOverLifetimeModule` | 同上 |
 *
 * 这条边界本身就是有价值的结论：**它回答了"哪些模块能脱离运行时单测"**。
 */

/**
 * 深层代理版假 particleSystem：任何属性都能继续访问、任何东西都能被调用、参与算术得 1。
 *
 * 为什么不用"一层 Proxy + 未知属性返回函数"：那只能兜一层，形如 `a.b.c` 的深层访问一旦
 * 遇到 undefined 就抛 —— 第一版就是这样误报了一批（而那些都是 stub 不全，不是模块的问题）。
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

/** 检查一个粒子上的数值状态是否都有限 */
function assertFiniteParticleState(name: string, particle: Particle): void
{
    const vectors: [string, { x: number; y: number; z: number }][] = [
        ['position', particle.position],
        ['velocity', particle.velocity],
        ['acceleration', particle.acceleration],
        ['rotation', particle.rotation],
        ['angularVelocity', particle.angularVelocity],
        ['size', particle.size],
        ['startSize', particle.startSize],
    ];

    for (const [label, v] of vectors)
    {
        for (const axis of ['x', 'y', 'z'] as const)
        {
            expect(Number.isFinite(v[axis]), name + ": " + label + "." + axis + " = " + v[axis]).toBe(true);
        }
    }

    for (const channel of ['r', 'g', 'b', 'a'] as const)
    {
        expect(Number.isFinite(particle.color[channel]), name + ": color." + channel + " = " + particle.color[channel]).toBe(true);
    }

    expect(Number.isFinite(particle.lifetime), name + ": lifetime = " + particle.lifetime).toBe(true);
}

/** 可测模块的最小形状（探针只需要开关与反向引用） */
interface TestableModule
{
    enabled: boolean;
    particleSystem?: unknown;
}

/**
 * 模块条目：已纯数据化的模块用默认工厂 + 模块级行为函数，未迁移的仍用 \`new\` + 方法转发。
 */
interface ModuleEntry
{
    name: string;
    create: () => TestableModule;
    initParticleState: (module: TestableModule, particle: Particle) => void;
    updateParticleState: (module: TestableModule, particle: Particle) => void;
}

const MODULES: ModuleEntry[] = [
    {
        name: 'ParticleColorBySpeedModule',
        create: () => ({ __type__: 'ParticleColorBySpeedModule', ...particleColorBySpeedModuleDefault() }),
        initParticleState: (m, p) => particleColorBySpeedModuleInitParticleState(m as ParticleColorBySpeedModule, p),
        updateParticleState: (m, p) => particleColorBySpeedModuleUpdateParticleState(m as ParticleColorBySpeedModule, p),
    },
    {
        name: 'ParticleColorOverLifetimeModule',
        create: () => ({ __type__: 'ParticleColorOverLifetimeModule', ...particleColorOverLifetimeModuleDefault() }),
        initParticleState: (m, p) => particleColorOverLifetimeModuleInitParticleState(m as ParticleColorOverLifetimeModule, p),
        updateParticleState: (m, p) => particleColorOverLifetimeModuleUpdateParticleState(m as ParticleColorOverLifetimeModule, p),
    },
    {
        name: 'ParticleEmissionModule',
        create: () => new ParticleEmissionModule(),
        initParticleState: (m, p) => (m as ParticleEmissionModule).initParticleState(p),
        updateParticleState: (m, p) => (m as ParticleEmissionModule).updateParticleState(p),
    },
    {
        name: 'ParticleForceOverLifetimeModule',
        create: () => ({ __type__: 'ParticleForceOverLifetimeModule', ...particleForceOverLifetimeModuleDefault() }),
        initParticleState: (m, p) => particleForceOverLifetimeModuleInitParticleState(m as ParticleForceOverLifetimeModule, p),
        updateParticleState: (m, p) => particleForceOverLifetimeModuleUpdateParticleState(m as ParticleForceOverLifetimeModule, p),
    },
    {
        name: 'ParticleInheritVelocityModule',
        create: () => ({ __type__: 'ParticleInheritVelocityModule', ...particleInheritVelocityModuleDefault() }),
        initParticleState: (m, p) => particleInheritVelocityModuleInitParticleState(m as ParticleInheritVelocityModule, p),
        updateParticleState: (m, p) => particleInheritVelocityModuleUpdateParticleState(m as ParticleInheritVelocityModule, p),
    },
    {
        name: 'ParticleLimitVelocityOverLifetimeModule',
        create: () => ({ __type__: 'ParticleLimitVelocityOverLifetimeModule', ...particleLimitVelocityOverLifetimeModuleDefault() }),
        initParticleState: (m, p) => particleLimitVelocityOverLifetimeModuleInitParticleState(m as ParticleLimitVelocityOverLifetimeModule, p),
        updateParticleState: (m, p) => particleLimitVelocityOverLifetimeModuleUpdateParticleState(m as ParticleLimitVelocityOverLifetimeModule, p),
    },
    {
        name: 'ParticleMainModule',
        create: () => new ParticleMainModule(),
        initParticleState: (m, p) => (m as ParticleMainModule).initParticleState(p),
        updateParticleState: (m, p) => (m as ParticleMainModule).updateParticleState(p),
    },
    {
        name: 'ParticleNoiseModule',
        create: () => new ParticleNoiseModule(),
        initParticleState: (m, p) => (m as ParticleNoiseModule).initParticleState(p),
        updateParticleState: (m, p) => (m as ParticleNoiseModule).updateParticleState(p),
    },
    {
        name: 'ParticleSizeBySpeedModule',
        create: () => new ParticleSizeBySpeedModule(),
        initParticleState: (m, p) => (m as ParticleSizeBySpeedModule).initParticleState(p),
        updateParticleState: (m, p) => (m as ParticleSizeBySpeedModule).updateParticleState(p),
    },
    {
        name: 'ParticleSizeOverLifetimeModule',
        create: () => new ParticleSizeOverLifetimeModule(),
        initParticleState: (m, p) => (m as ParticleSizeOverLifetimeModule).initParticleState(p),
        updateParticleState: (m, p) => (m as ParticleSizeOverLifetimeModule).updateParticleState(p),
    },
    {
        name: 'ParticleSubEmittersModule',
        create: () => new ParticleSubEmittersModule(),
        initParticleState: (m, p) => (m as ParticleSubEmittersModule).initParticleState(p),
        updateParticleState: (m, p) => (m as ParticleSubEmittersModule).updateParticleState(p),
    },
    {
        name: 'ParticleSystemRenderer',
        create: () => new ParticleSystemRenderer(),
        initParticleState: (m, p) => (m as ParticleSystemRenderer).initParticleState(p),
        updateParticleState: (m, p) => (m as ParticleSystemRenderer).updateParticleState(p),
    },
    {
        name: 'ParticleVelocityOverLifetimeModule',
        create: () => new ParticleVelocityOverLifetimeModule(),
        initParticleState: (m, p) => (m as ParticleVelocityOverLifetimeModule).initParticleState(p),
        updateParticleState: (m, p) => (m as ParticleVelocityOverLifetimeModule).updateParticleState(p),
    },
];

describe('可独立测试的粒子模块不变量（issue #392）', () =>
{
    it.each(MODULES)('$name：init + update 不抛异常', ({ name, create, initParticleState, updateParticleState }) =>
    {
        const module = create();
        module.enabled = true;
        module.particleSystem = makeDeepPermissive();

        const particle = new Particle();
        particle.rateAtLifeTime = 0.5;

        expect(() =>
        {
            initParticleState(module, particle);
            updateParticleState(module, particle);
        }, name).not.toThrow();
    });

    it.each(MODULES)('$name：跑完之后粒子状态都是有限数', ({ name, create, initParticleState, updateParticleState }) =>
    {
        const module = create();
        module.enabled = true;
        module.particleSystem = makeDeepPermissive();

        const particle = new Particle();
        particle.rateAtLifeTime = 0.5;
        vec3From(1, 2, 3, particle.position);
        vec3From(1, 2, 3, particle.velocity);

        initParticleState(module, particle);
        updateParticleState(module, particle);

        assertFiniteParticleState(name, particle);
    });

    it.each(MODULES)('$name：enabled = false 时不应抛异常（关闭路径也要安全）', ({ name, create, updateParticleState }) =>
    {
        const module = create();
        module.enabled = false;
        module.particleSystem = makeDeepPermissive();

        const particle = new Particle();
        particle.rateAtLifeTime = 0.5;

        expect(() => updateParticleState(module, particle), name).not.toThrow();
    });
});
