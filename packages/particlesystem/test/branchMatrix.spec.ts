import { describe, expect, it } from 'vitest';
import { Particle } from '../src/Particle';
import { ParticleSystemAnimationType } from '../src/enums/ParticleSystemAnimationType';
import { ParticleSystemSimulationSpace } from '../src/enums/ParticleSystemSimulationSpace';
import { ParticleSystemSubEmitterProperties } from '../src/enums/ParticleSystemSubEmitterProperties';
import { ParticleSystemSubEmitterType } from '../src/enums/ParticleSystemSubEmitterType';
import {
    particleNoiseModuleDefault, particleNoiseModuleInitParticleState, particleNoiseModuleUpdateParticleState, particleNoiseModuleUpdate,
    type ParticleNoiseModule,
} from '../src/modules/ParticleNoiseModule';
import {
    particleSubEmittersModuleAddSubEmitter, particleSubEmittersModuleDefault, particleSubEmittersModuleGetSubEmitterEmitProbability,
    particleSubEmittersModuleGetSubEmitterProperties, particleSubEmittersModuleGetSubEmitterSystem, particleSubEmittersModuleGetSubEmitterType,
    particleSubEmittersModuleRemoveSubEmitter, particleSubEmittersModuleSetSubEmitterEmitProbability, particleSubEmittersModuleSetSubEmitterProperties,
    particleSubEmittersModuleSetSubEmitterSystem, particleSubEmittersModuleSetSubEmitterType, particleSubEmittersModuleSubEmittersCount,
    particleSubEmittersModuleUpdateParticleState, type ParticleSubEmittersModule,
} from '../src/modules/ParticleSubEmittersModule';
import {
    particleTextureSheetAnimationModuleDefault, particleTextureSheetAnimationModuleInitParticleState,
    particleTextureSheetAnimationModuleUpdateParticleState, type ParticleTextureSheetAnimationModule,
} from '../src/modules/ParticleTextureSheetAnimationModule';
import type { ParticleSystem } from '../src/ParticleSystem';

/**
 * 分支矩阵：把**同一模块里靠开关切换的多条分支**逐条走到。
 *
 * 前面的模块测试大多只跑默认参数（`enabled = false` 或默认开关），于是像
 * `arcMode = Loop / PingPong / BurstSpread`、`separateAxes`、`animation = WholeSheet`、
 * 子发射器的 `Set*`/`Remove` 与越界返回这些分支一直没被求值。
 * 这里用**参数化遍历**成批覆盖，顺带把它们的行为钉住（不许抛异常、不许产出 NaN）。
 */

/** 深层放行的假 particleSystem（可指定模拟空间） */
function permissiveParticleSystem(simulationSpace = ParticleSystemSimulationSpace.Local): unknown
{
    const fn = function () { return undefined; };

    return new Proxy(fn, {
        get(_t, prop)
        {
            if (prop === 'simulationSpace') return simulationSpace;
            if (prop === Symbol.toPrimitive) return () => 1;
            if (prop === 'valueOf') return () => 1;
            if (prop === 'toString') return () => '1';

            return permissiveParticleSystem(simulationSpace);
        },
        apply() { return undefined; },
    });
}

/** 造一个已经填好运行期中间字段的粒子（模块会读它们） */
function makeParticle(): Particle
{
    const particle = new Particle();

    particle.birthTime = 0;
    particle.lifetime = 2;
    particle.curTime = 1;
    particle.preTime = 1;
    particle.rateAtLifeTime = 0.5;
    particle.birthRateAtDuration = 0.5;

    return particle;
}

describe('分支矩阵 · 子发射器 API（Set / Get / Remove / 越界）', () =>
{
    it('Add / Get / Set / Remove 全系列行为与越界返回', () =>
    {
        const module = { __type__: 'ParticleSubEmittersModule', ...particleSubEmittersModuleDefault() } as ParticleSubEmittersModule;
        const subSystem = { __type__: 'ParticleSystem' } as unknown as ParticleSystem;

        // 空模块：所有 Get 走越界分支、所有 Set / Remove 直接返回
        expect(particleSubEmittersModuleSubEmittersCount(module)).toBe(0);
        expect(particleSubEmittersModuleGetSubEmitterSystem(module, 0)).toBe(null);
        expect(particleSubEmittersModuleGetSubEmitterProperties(module, 0)).toBe(null);
        expect(particleSubEmittersModuleGetSubEmitterType(module, 0)).toBe(null);
        expect(particleSubEmittersModuleGetSubEmitterEmitProbability(module, 0)).toBe(0);
        expect(() => particleSubEmittersModuleSetSubEmitterType(module, 0, ParticleSystemSubEmitterType.Death)).not.toThrow();
        expect(() => particleSubEmittersModuleSetSubEmitterProperties(module, 0, ParticleSystemSubEmitterProperties.InheritColor)).not.toThrow();
        expect(() => particleSubEmittersModuleSetSubEmitterSystem(module, 0, subSystem)).not.toThrow();
        expect(() => particleSubEmittersModuleSetSubEmitterEmitProbability(module, 0, 0.5)).not.toThrow();
        expect(() => particleSubEmittersModuleRemoveSubEmitter(module, 0)).not.toThrow();

        // 加入一个条目：引用同一身份、字段按参数写入
        particleSubEmittersModuleAddSubEmitter(module, subSystem, ParticleSystemSubEmitterType.Birth, ParticleSystemSubEmitterProperties.InheritNothing, 1);
        expect(particleSubEmittersModuleSubEmittersCount(module)).toBe(1);
        expect(particleSubEmittersModuleGetSubEmitterSystem(module, 0)).toBe(subSystem);
        expect((subSystem as { isSubParticleSystem?: boolean }).isSubParticleSystem).toBe(true);

        // Set 系列逐条改字段
        particleSubEmittersModuleSetSubEmitterType(module, 0, ParticleSystemSubEmitterType.Death);
        expect(particleSubEmittersModuleGetSubEmitterType(module, 0)).toBe(ParticleSystemSubEmitterType.Death);
        particleSubEmittersModuleSetSubEmitterProperties(module, 0, ParticleSystemSubEmitterProperties.InheritColor);
        expect(particleSubEmittersModuleGetSubEmitterProperties(module, 0)).toBe(ParticleSystemSubEmitterProperties.InheritColor);
        particleSubEmittersModuleSetSubEmitterEmitProbability(module, 0, 0.25);
        expect(particleSubEmittersModuleGetSubEmitterEmitProbability(module, 0)).toBe(0.25);
        const other = { __type__: 'ParticleSystem' } as unknown as ParticleSystem;

        particleSubEmittersModuleSetSubEmitterSystem(module, 0, other);
        expect(particleSubEmittersModuleGetSubEmitterSystem(module, 0)).toBe(other);

        // 触发时机不是 Birth 时，updateParticleState 不触发（走 for 循环但不进 if）
        module.particleSystem = permissiveParticleSystem() as ParticleSubEmittersModule['particleSystem'];
        expect(() => particleSubEmittersModuleUpdateParticleState(module, makeParticle())).not.toThrow();

        // 移除
        particleSubEmittersModuleRemoveSubEmitter(module, 0);
        expect(particleSubEmittersModuleSubEmittersCount(module)).toBe(0);
    });
});

describe('分支矩阵 · 噪声模块（separateAxes / damping / remap / scroll）', () =>
{
    it('各个开关组合都不抛异常、粒子状态有限', () =>
    {
        for (const separateAxes of [false, true])
        {
            for (const damping of [false, true])
            {
                for (const remapEnabled of [false, true])
                {
                    for (const quality of [0, 1, 2])
                    {
                        const module = {
                            __type__: 'ParticleNoiseModule',
                            ...particleNoiseModuleDefault(),
                            enabled: true,
                            separateAxes,
                            damping,
                            remapEnabled,
                            quality,
                            octaveCount: 3,
                            frequency: 0.4,
                        } as ParticleNoiseModule;
                        module.particleSystem = permissiveParticleSystem() as ParticleNoiseModule['particleSystem'];

                        const particle = makeParticle();

                        expect(() => particleNoiseModuleInitParticleState(module, particle), `init separateAxes=${separateAxes} damping=${damping} remap=${remapEnabled} quality=${quality}`).not.toThrow();
                        expect(() => particleNoiseModuleUpdateParticleState(module, particle)).not.toThrow();
                        // scrollValue 被 update 推进
                        expect(() => particleNoiseModuleUpdate(module, 0.1)).not.toThrow();

                        for (const axis of ['x', 'y', 'z'] as const)
                        {
                            expect(Number.isFinite(particle.velocity[axis])).toBe(true);
                        }
                    }
                }
            }
        }
    });
});

describe('分支矩阵 · 纹理表动画（WholeSheet / SingleRow / 随机行）', () =>
{
    it('两种 animation 与随机行开关都走到', () =>
    {
        for (const animation of [ParticleSystemAnimationType.WholeSheet, ParticleSystemAnimationType.SingleRow])
        {
            for (const useRandomRow of [false, true])
            {
                for (const rowIndex of [0, 1])
                {
                    const module = {
                        __type__: 'ParticleTextureSheetAnimationModule',
                        ...particleTextureSheetAnimationModuleDefault(),
                        enabled: true,
                        animation,
                        useRandomRow,
                        rowIndex,
                        cycleCount: 2,
                    } as ParticleTextureSheetAnimationModule;
                    module.particleSystem = permissiveParticleSystem() as ParticleTextureSheetAnimationModule['particleSystem'];

                    const particle = makeParticle();

                    expect(() => particleTextureSheetAnimationModuleInitParticleState(module, particle), `init animation=${animation}`).not.toThrow();
                    expect(() => particleTextureSheetAnimationModuleUpdateParticleState(module, particle)).not.toThrow();
                }
            }
        }
    });
});
