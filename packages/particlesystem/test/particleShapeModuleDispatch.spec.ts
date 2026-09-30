import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ParticleSystemShapeType } from '../src/enums/ParticleSystemShapeType';
import { ParticleSystemShapeType1 } from '../src/enums/ParticleSystemShapeType1';
import { ParticleSystemShapeBoxEmitFrom } from '../src/shapes/ParticleSystemShapeBox';
import { ParticleSystemShapeConeEmitFrom } from '../src/enums/ParticleSystemShapeConeEmitFrom';
import { ParticleShapeModule } from '../src/modules/ParticleShapeModule';
import { ParticleSystemShape } from '../src/shapes/ParticleSystemShape';
import { ParticleSystemShapeBox } from '../src/shapes/ParticleSystemShapeBox';
import { ParticleSystemShapeCircle } from '../src/shapes/ParticleSystemShapeCircle';
import { ParticleSystemShapeCone } from '../src/shapes/ParticleSystemShapeCone';
import { ParticleSystemShapeEdge } from '../src/shapes/ParticleSystemShapeEdge';
import { ParticleSystemShapeHemisphere } from '../src/shapes/ParticleSystemShapeHemisphere';
import { ParticleSystemShapeSphere } from '../src/shapes/ParticleSystemShapeSphere';

/**
 * `ParticleShapeModule` 的 shapeType 分派（issue #375）。
 *
 * `_onShapeTypeChanged()` 是个 18 个 case 的大 switch，**最容易写错的地方是"变体映射"**：
 * 同一种几何的多个变体（如 `Sphere` / `SphereShell`）**共用同一个 shape 实例**，
 * 靠 `emitFromShell` / `emitFrom` / `emitFromEdge` 区分。哪个 case 漏设了开关，
 * 粒子就会以**错误的分布**发射，而且**不会报任何错** —— 这正是本文件要钉住的。
 *
 * 约定：**只断言公开可见的东西**（`shapeType` / `shape` / `activeShape` 及 shape 上的公开字段），
 * 不去碰 private 的 `_shapeXxx`（那属于实现细节）。
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

/** 造一个模块并把 shapeType 设过去（走 watcher，等价于运行时改值） */
function moduleWith(shapeType: ParticleSystemShapeType): ParticleShapeModule
{
    const module = new ParticleShapeModule();
    module.shapeType = shapeType;

    return module;
}

describe('ParticleShapeModule 的 shapeType 分派（issue #375）', () =>
{
    it('默认构造后 shapeType 是 Cone，且已经分派好', () =>
    {
        const module = new ParticleShapeModule();

        expect(module.shapeType).toBe(ParticleSystemShapeType.Cone);
        expect(module.activeShape).toBeInstanceOf(ParticleSystemShapeCone);
    });

    it('赋值即生效（watcher 绑定着分派，不需要手动调 private 方法）', () =>
    {
        const module = new ParticleShapeModule();

        module.shapeType = ParticleSystemShapeType.Sphere;
        expect(module.activeShape).toBeInstanceOf(ParticleSystemShapeSphere);

        module.shapeType = ParticleSystemShapeType.Box;
        expect(module.activeShape).toBeInstanceOf(ParticleSystemShapeBox);
    });

    // ---------- 按几何分组：类型 + 变体开关 ----------

    describe('Sphere 的两个变体（体积 / 壳）', () =>
    {
        it('都指向同一类形状实例，只是 emitFromShell 不同', () =>
        {
            const volume = moduleWith(ParticleSystemShapeType.Sphere);
            const shell = moduleWith(ParticleSystemShapeType.SphereShell);

            expect(volume.activeShape).toBeInstanceOf(ParticleSystemShapeSphere);
            expect(shell.activeShape).toBeInstanceOf(ParticleSystemShapeSphere);
            expect(volume.shape).toBe(ParticleSystemShapeType1.Sphere);
            expect(shell.shape).toBe(ParticleSystemShapeType1.Sphere);

            expect((volume.activeShape as ParticleSystemShapeSphere).emitFromShell).toBe(false);
            expect((shell.activeShape as ParticleSystemShapeSphere).emitFromShell).toBe(true);
        });
    });

    describe('Hemisphere 的两个变体', () =>
    {
        it('都指向半球形状，emitFromShell 区分体积 / 壳', () =>
        {
            const volume = moduleWith(ParticleSystemShapeType.Hemisphere);
            const shell = moduleWith(ParticleSystemShapeType.HemisphereShell);

            expect(volume.activeShape).toBeInstanceOf(ParticleSystemShapeHemisphere);
            expect(shell.activeShape).toBeInstanceOf(ParticleSystemShapeHemisphere);
            expect((volume.activeShape as ParticleSystemShapeHemisphere).emitFromShell).toBe(false);
            expect((shell.activeShape as ParticleSystemShapeHemisphere).emitFromShell).toBe(true);
        });
    });

    describe('Cone 的四个变体', () =>
    {
        it('都指向圆锥形状，emitFrom 区分 Base / BaseShell / Volume / VolumeShell', () =>
        {
            const expectation: [ParticleSystemShapeType, ParticleSystemShapeConeEmitFrom][] = [
                [ParticleSystemShapeType.Cone, ParticleSystemShapeConeEmitFrom.Base],
                [ParticleSystemShapeType.ConeShell, ParticleSystemShapeConeEmitFrom.BaseShell],
                [ParticleSystemShapeType.ConeVolume, ParticleSystemShapeConeEmitFrom.Volume],
                [ParticleSystemShapeType.ConeVolumeShell, ParticleSystemShapeConeEmitFrom.VolumeShell],
            ];

            for (const [shapeType, emitFrom] of expectation)
            {
                const module = moduleWith(shapeType);

                expect(module.activeShape, `shapeType=${shapeType}`).toBeInstanceOf(ParticleSystemShapeCone);
                expect((module.activeShape as ParticleSystemShapeCone).emitFrom, `shapeType=${shapeType}`).toBe(emitFrom);
                expect(module.shape).toBe(ParticleSystemShapeType1.Cone);
            }
        });
    });

    describe('Box 的三个变体', () =>
    {
        it('都指向盒子形状，emitFrom 区分 Volume / Shell / Edge', () =>
        {
            const expectation: [ParticleSystemShapeType, ParticleSystemShapeBoxEmitFrom][] = [
                [ParticleSystemShapeType.Box, ParticleSystemShapeBoxEmitFrom.Volume],
                [ParticleSystemShapeType.BoxShell, ParticleSystemShapeBoxEmitFrom.Shell],
                [ParticleSystemShapeType.BoxEdge, ParticleSystemShapeBoxEmitFrom.Edge],
            ];

            for (const [shapeType, emitFrom] of expectation)
            {
                const module = moduleWith(shapeType);

                expect(module.activeShape, `shapeType=${shapeType}`).toBeInstanceOf(ParticleSystemShapeBox);
                expect((module.activeShape as ParticleSystemShapeBox).emitFrom, `shapeType=${shapeType}`).toBe(emitFrom);
                expect(module.shape).toBe(ParticleSystemShapeType1.Box);
            }
        });
    });

    describe('Circle 的两个变体', () =>
    {
        it('都指向圆形状，emitFromEdge 区分盘面 / 边缘', () =>
        {
            const volume = moduleWith(ParticleSystemShapeType.Circle);
            const edge = moduleWith(ParticleSystemShapeType.CircleEdge);

            expect(volume.activeShape).toBeInstanceOf(ParticleSystemShapeCircle);
            expect(edge.activeShape).toBeInstanceOf(ParticleSystemShapeCircle);
            expect((volume.activeShape as ParticleSystemShapeCircle).emitFromEdge).toBe(false);
            expect((edge.activeShape as ParticleSystemShapeCircle).emitFromEdge).toBe(true);
            expect(volume.shape).toBe(ParticleSystemShapeType1.Circle);
        });
    });

    it('SingleSidedEdge 指向 Edge 形状', () =>
    {
        const module = moduleWith(ParticleSystemShapeType.SingleSidedEdge);

        expect(module.activeShape).toBeInstanceOf(ParticleSystemShapeEdge);
        expect(module.shape).toBe(ParticleSystemShapeType1.Edge);
    });

    // ---------- 同几何的变体共用同一个实例（"复用实例 + 开关"这个设计）----------

    it('同几何的不同变体共用同一个 shape 实例（改的是它上面的开关）', () =>
    {
        const module = new ParticleShapeModule();

        module.shapeType = ParticleSystemShapeType.Cone;
        const cone = module.activeShape;

        module.shapeType = ParticleSystemShapeType.ConeVolume;
        // 同一个实例：说明实现是"复用 + 改开关"，而不是"每个变体建一个"
        expect(module.activeShape).toBe(cone);
    });

    // ---------- 未实现的三种 ----------

    it.each([
        ['Mesh', ParticleSystemShapeType.Mesh, ParticleSystemShapeType1.Mesh],
        ['MeshRenderer', ParticleSystemShapeType.MeshRenderer, ParticleSystemShapeType1.MeshRenderer],
        ['SkinnedMeshRenderer', ParticleSystemShapeType.SkinnedMeshRenderer, ParticleSystemShapeType1.SkinnedMeshRenderer],
    ])('%s：activeShape 置空并给出警告（不静默）', (_name, shapeType, expectedShape) =>
    {
        const module = moduleWith(shapeType as ParticleSystemShapeType);

        expect(module.activeShape).toBeNull();
        expect(module.shape).toBe(expectedShape);
        expect(warnSpy).toHaveBeenCalled();
    });

    // ---------- 未知值 ----------

    it('未知 shapeType 走 default：不抛异常、保持原 activeShape、并给出警告', () =>
    {
        const module = new ParticleShapeModule();
        const before = module.activeShape;

        expect(() => { module.shapeType = 999 as ParticleSystemShapeType; }).not.toThrow();

        expect(module.activeShape).toBe(before);
        expect(warnSpy).toHaveBeenCalled();
    });

    // ---------- 分派后形状是可用的 ----------

    it('分派出的形状能立刻用于采样（不是空壳）', () =>
    {
        const module = moduleWith(ParticleSystemShapeType.SphereShell);
        const shape = module.activeShape as ParticleSystemShape;

        expect(shape).toBeInstanceOf(ParticleSystemShape);
        expect(typeof shape.calcParticlePosDir).toBe('function');
    });
});