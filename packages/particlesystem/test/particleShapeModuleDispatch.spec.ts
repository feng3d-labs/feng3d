import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { vec3Length } from '@feng3d/math';
import { ParticleSystemShapeType } from '../src/enums/ParticleSystemShapeType';
import { ParticleSystemSimulationSpace } from '../src/enums/ParticleSystemSimulationSpace';
import { particleShapeModuleDefault, particleShapeModuleInitParticleState, type WritableParticleShapeModuleLike } from '../src/modules/ParticleShapeModule';
import { Particle } from '../src/Particle';

/**
 * `ParticleShapeModule` 的 shapeType 分派（issue #375，形状纯函数化批改写）。
 *
 * 原文件断言的是「`shapeType` → `activeShape` 是哪个策略 class + 策略上的 `emitFromShell` / `emitFrom` /
 * `emitFromEdge` 开关」——策略 class 删除后，那些开关由 `module.shapeType` **直接推导**（见各
 * `particleSystemShape*CalcParticlePosDir`），因此本文件改为**从公开行为**钉住分发：
 *
 * 1. 枚举里**每个** `shapeType` 都跑一遍 `initParticleState`：已实现的形状必须不抛且产出有限状态，
 *    未实现的 `Mesh` / `MeshRenderer` / `SkinnedMeshRenderer` 必须走 warn 分支（原来"哪个 case 漏设开关"
 *    的担忧，现在等价于"哪个 case 漏接分发函数"，遍历调用即可覆盖）；
 * 2. 变体映射用**分布特征**验证：`SphereShell` 的点落在球面、`Sphere` 落在球内；
 *    `CircleEdge` 落在圆边、`Circle` 落在圆内。
 */

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() =>
{
    // 分派里有几处 console.warn（未实现的 Mesh、未知 shapeType）；
    // 拦下来既能断言，也避免污染测试输出
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
});

afterEach(() =>
{
    warnSpy.mockRestore();
});

/** 深层代理版假 particleSystem（与 `allModulesInvariants.spec` 同款：什么都能访问、参与算术得 1） */
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

/** 造一个形状模块数据（已接上假 particleSystem，空间取 Local —— 与各形状单测一致） */
function makeModule(shapeType: ParticleSystemShapeType, fields: Partial<WritableParticleShapeModuleLike> = {}): WritableParticleShapeModuleLike
{
    const module = particleShapeModuleDefault();
    module.enabled = true;
    module.shapeType = shapeType;
    module.particleSystem = makeDeepPermissive() as never;

    return Object.assign(module, fields);
}

/** 造一个粒子并给出初始化前的最小状态 */
function makeParticle(): Particle
{
    const particle = new Particle();
    particle.birthRateAtDuration = 0.5;

    return particle;
}

/** 枚举里所有数字值（含反向映射过滤） */
const ALL_SHAPE_TYPES = Object.values(ParticleSystemShapeType).filter((v) => typeof v === 'number') as ParticleSystemShapeType[];

describe('ParticleShapeModule 的 shapeType 分派（issue #375）', () =>
{
    it('默认构造后 shapeType 是 Cone', () =>
    {
        const module = particleShapeModuleDefault();

        expect(module.shapeType).toBe(ParticleSystemShapeType.Cone);
    });

    it.each(ALL_SHAPE_TYPES.map((t) => [ParticleSystemShapeType[t], t] as const))('%s：初始化粒子状态不抛、状态有限', (_name, shapeType) =>
    {
        const module = makeModule(shapeType);
        const particle = makeParticle();

        expect(() => particleShapeModuleInitParticleState(module, particle)).not.toThrow();

        for (const v of [particle.position, particle.velocity, particle.rotation])
        {
            expect(Number.isFinite(v.x)).toBe(true);
            expect(Number.isFinite(v.y)).toBe(true);
            expect(Number.isFinite(v.z)).toBe(true);
        }
    });

    it.each([
        ['Mesh', ParticleSystemShapeType.Mesh],
        ['MeshRenderer', ParticleSystemShapeType.MeshRenderer],
        ['SkinnedMeshRenderer', ParticleSystemShapeType.SkinnedMeshRenderer],
    ] as const)('%s：未实现的分支走 warn（而不是静默当成别的形状）', (_name, shapeType) =>
    {
        const module = makeModule(shapeType);
        const particle = makeParticle();

        particleShapeModuleInitParticleState(module, particle);

        expect(warnSpy).toHaveBeenCalledWith('未实现 ParticleSystemShapeType.Mesh');
    });

    describe('变体映射（原来靠策略上的开关区分）', () =>
    {
        it('SphereShell：采样点落在球面上；Sphere：落在球内', () =>
        {
            const radius = 3;
            const shell = makeModule(ParticleSystemShapeType.SphereShell, { radius });
            const volume = makeModule(ParticleSystemShapeType.Sphere, { radius });

            let minShell = Number.MAX_VALUE;
            let maxVolume = 0;
            for (let i = 0; i < 100; i++)
            {
                const p1 = makeParticle();
                particleShapeModuleInitParticleState(shell, p1);
                // 位置里叠加了 startSpeed 方向的贡献，这里只看"由形状产生的偏移量级"是否贴住球面：用方向（velocity）与位置一起判断
                minShell = Math.min(minShell, vec3Length(p1.position));

                const p2 = makeParticle();
                particleShapeModuleInitParticleState(volume, p2);
                maxVolume = Math.max(maxVolume, vec3Length(p2.position));
            }

            // 球壳的最小半径仍应显著大于球体内部采样的最大值（统计断言，避免单次随机）
            expect(minShell).toBeGreaterThan(maxVolume);
        });

        it('CircleEdge：采样点落在圆边；Circle：落在圆内', () =>
        {
            const radius = 4;
            const edge = makeModule(ParticleSystemShapeType.CircleEdge, { radius });
            const disk = makeModule(ParticleSystemShapeType.Circle, { radius });

            let maxDisk = 0;
            let minEdge = Number.MAX_VALUE;
            for (let i = 0; i < 100; i++)
            {
                const p1 = makeParticle();
                particleShapeModuleInitParticleState(disk, p1);
                maxDisk = Math.max(maxDisk, Math.hypot(p1.position.x, p1.position.y));

                const p2 = makeParticle();
                particleShapeModuleInitParticleState(edge, p2);
                minEdge = Math.min(minEdge, Math.hypot(p2.position.x, p2.position.y));
            }

            expect(minEdge).toBeGreaterThanOrEqual(maxDisk - 1e-6);
        });
    });
});
