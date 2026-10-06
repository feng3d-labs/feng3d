import { describe, expect, it, vi } from 'vitest';
import { logic } from '@feng3d/reactivity';
import type { Object3D } from 'feng3d';
import { Particle } from '../src/Particle';
import { ParticleSystemShapeMultiModeValue } from '../src/enums/ParticleSystemShapeMultiModeValue';
import { ParticleSystemShapeType } from '../src/enums/ParticleSystemShapeType';
import { particleShapeModuleDefault, particleShapeModuleInitParticleState, type ParticleShapeModule } from '../src/modules/ParticleShapeModule';
import { particleSystemDefault, type ParticleSystemLogic } from '../src/ParticleSystem';
import { particleSystemShapeBoxCalcParticlePosDir } from '../src/shapes/ParticleSystemShapeBox';
import { particleSystemShapeCircleCalcParticlePosDir } from '../src/shapes/ParticleSystemShapeCircle';
import { particleSystemShapeConeCalcParticlePosDir } from '../src/shapes/ParticleSystemShapeCone';
import { particleSystemShapeEdgeCalcParticlePosDir } from '../src/shapes/ParticleSystemShapeEdge';

/**
 * 分支矩阵 · 形状。
 *
 * 形状的多模式字段（`arcMode` / `radiusMode`）各有 4 个取值（Random / Loop / PingPong / BurstSpread），
 * 再叠加 Box 的三种形状变体、Cone 的四种 emitFrom、Mesh 系形状的「未实现」分支——
 * 这些分支此前的用例一条都没走到（默认都是 Random + 默认变体）。
 *
 * 这里按「枚举值 × 开关」成批遍历，钉住两件事：**不许抛异常**、**位置/方向必须有限**。
 */

const MODES = [
    ParticleSystemShapeMultiModeValue.Random,
    ParticleSystemShapeMultiModeValue.Loop,
    ParticleSystemShapeMultiModeValue.PingPong,
    ParticleSystemShapeMultiModeValue.BurstSpread,
];

function makeParticle(): Particle
{
    const particle = new Particle();

    particle.birthTime = 0;
    particle.lifetime = 2;
    particle.curTime = 0.7;
    particle.preTime = 0.7;
    particle.rateAtLifeTime = 0.35;
    particle.birthRateAtDuration = 0.35;
    particle.velocity.x = 1;
    particle.velocity.y = 2;
    particle.velocity.z = 3;
    particle.position.x = 0.5;

    return particle;
}

function assertFinite(position: { x: number; y: number; z: number }, dir: { x: number; y: number; z: number }, label: string): void
{
    for (const axis of ['x', 'y', 'z'] as const)
    {
        expect(Number.isFinite(position[axis]), label + ' position.' + axis).toBe(true);
        expect(Number.isFinite(dir[axis]), label + ' dir.' + axis).toBe(true);
    }
}

/** 造一个已挂载的粒子系统 logic（形状模块的部分分支会读 particleSystem.main / object3D） */
function makeSystemLogic(): ParticleSystemLogic
{
    const data = particleSystemDefault();
    const object3D: Object3D = { __type__: 'Object3D', name: 'shape-owner', components: [data as never] };

    logic(object3D);

    return logic(data) as ParticleSystemLogic;
}

describe('分支矩阵 · 形状的多模式与变体', () =>
{
    it('Circle / CircleEdge 的 arcMode 四个取值都走到', () =>
    {
        for (const shapeType of [ParticleSystemShapeType.Circle, ParticleSystemShapeType.CircleEdge])
        {
            for (const arcMode of MODES)
            {
                const module = {
                    __type__: 'ParticleShapeModule',
                    ...particleShapeModuleDefault(),
                    shapeType,
                    arcMode,
                    arc: 180,
                    arcSpread: 0.25,
                    radius: 1.5,
                } as ParticleShapeModule;
                const position = { x: 0, y: 0, z: 0 };
                const dir = { x: 0, y: 0, z: 0 };
                const label = 'circle/' + shapeType + '/' + arcMode;

                expect(() => particleSystemShapeCircleCalcParticlePosDir(module, makeParticle(), position, dir), label).not.toThrow();
                assertFinite(position, dir, label);
            }
        }
    });

    it('Cone 四个变体的 radiusMode 都走到', () =>
    {
        for (const shapeType of [ParticleSystemShapeType.Cone, ParticleSystemShapeType.ConeShell, ParticleSystemShapeType.ConeVolume, ParticleSystemShapeType.ConeVolumeShell])
        {
            for (const radiusMode of MODES)
            {
                const module = {
                    __type__: 'ParticleShapeModule',
                    ...particleShapeModuleDefault(),
                    shapeType,
                    radiusMode,
                    radius: 1.2,
                    radiusSpread: 0.5,
                    angle: 20,
                    length: 3,
                } as ParticleShapeModule;
                const position = { x: 0, y: 0, z: 0 };
                const dir = { x: 0, y: 0, z: 0 };
                const label = 'cone/' + shapeType + '/' + radiusMode;

                expect(() => particleSystemShapeConeCalcParticlePosDir(module, makeParticle(), position, dir), label).not.toThrow();
                assertFinite(position, dir, label);
            }
        }
    });

    it('Box 三个变体（含符号分支）都走到', () =>
    {
        for (const shapeType of [ParticleSystemShapeType.Box, ParticleSystemShapeType.BoxShell, ParticleSystemShapeType.BoxEdge])
        {
            for (const x of [-1, 1])
            {
                for (const y of [-1, 1])
                {
                    const module = {
                        __type__: 'ParticleShapeModule',
                        ...particleShapeModuleDefault(),
                        shapeType,
                        box: { x: 2, y: 2, z: 2 },
                    } as ParticleShapeModule;
                    const position = { x, y, z: -1 };
                    const dir = { x: 0, y: 0, z: 0 };
                    const label = 'box/' + shapeType + '/' + x + '/' + y;

                    expect(() => particleSystemShapeBoxCalcParticlePosDir(module, makeParticle(), position, dir), label).not.toThrow();
                    assertFinite(position, dir, label);
                }
            }
        }
    });

    it('SingleSidedEdge 的 radiusMode 四个取值都走到', () =>
    {
        for (const radiusMode of MODES)
        {
            const module = {
                __type__: 'ParticleShapeModule',
                ...particleShapeModuleDefault(),
                shapeType: ParticleSystemShapeType.SingleSidedEdge,
                radiusMode,
                radius: 1,
                radiusSpread: 0.5,
            } as ParticleShapeModule;
            const position = { x: 0, y: 0, z: 0 };
            const dir = { x: 0, y: 0, z: 0 };
            const label = 'edge/' + radiusMode;

            expect(() => particleSystemShapeEdgeCalcParticlePosDir(module, makeParticle(), position, dir), label).not.toThrow();
            assertFinite(position, dir, label);
        }
    });

    it('Mesh 系形状走「未实现」分支：只警告、不抛异常', () =>
    {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        try
        {
            for (const shapeType of [ParticleSystemShapeType.Mesh, ParticleSystemShapeType.MeshRenderer, ParticleSystemShapeType.SkinnedMeshRenderer])
            {
                const module = {
                    __type__: 'ParticleShapeModule',
                    ...particleShapeModuleDefault(),
                    shapeType,
                } as ParticleShapeModule;
                module.particleSystem = makeSystemLogic();

                expect(() => particleShapeModuleInitParticleState(module, makeParticle()), 'mesh/' + shapeType).not.toThrow();
            }
        }
        finally
        {
            warn.mockRestore();
        }
    });

    it('dispatch：所有 shapeType 都能跑通', () =>
    {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        try
        {
            const allTypes = Object.values(ParticleSystemShapeType).filter((v) => typeof v === 'number') as ParticleSystemShapeType[];

            for (const shapeType of allTypes)
            {
                const module = {
                    __type__: 'ParticleShapeModule',
                    ...particleShapeModuleDefault(),
                    shapeType,
                    radius: 1,
                    box: { x: 1, y: 1, z: 1 },
                    length: 2,
                    angle: 15,
                } as ParticleShapeModule;
                module.particleSystem = makeSystemLogic();
                const particle = makeParticle();

                expect(() => particleShapeModuleInitParticleState(module, particle), 'dispatch/' + shapeType).not.toThrow();
                assertFinite(particle.position, particle.velocity, 'dispatch/' + shapeType);
            }
        }
        finally
        {
            warn.mockRestore();
        }
    });

    it('alignToDirection / randomDirectionAmount / sphericalDirectionAmount（真实宿主）', () =>
    {
        const systemLogic = makeSystemLogic();

        for (const alignToDirection of [false, true])
        {
            for (const randomDirectionAmount of [0, 1])
            {
                for (const sphericalDirectionAmount of [0, 1])
                {
                    const module = {
                        __type__: 'ParticleShapeModule',
                        ...particleShapeModuleDefault(),
                        shapeType: ParticleSystemShapeType.Sphere,
                        alignToDirection,
                        randomDirectionAmount,
                        sphericalDirectionAmount,
                    } as ParticleShapeModule;
                    module.particleSystem = systemLogic;

                    const particle = makeParticle();
                    const label = 'knobs/' + alignToDirection + '/' + randomDirectionAmount + '/' + sphericalDirectionAmount;

                    expect(() => particleShapeModuleInitParticleState(module, particle), label).not.toThrow();
                    assertFinite(particle.position, particle.velocity, label);
                }
            }
        }
    });
});
