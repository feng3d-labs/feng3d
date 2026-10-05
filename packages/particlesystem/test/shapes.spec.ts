import { describe, expect, it } from 'vitest';
import { vec3Length, vec3Sub } from '@feng3d/math';
import type { Vector3, WritableVector3Like } from '@feng3d/math';
import { ParticleSystemShapeType } from '../src/enums/ParticleSystemShapeType';
import { particleShapeModuleDefault, type WritableParticleShapeModuleLike } from '../src/modules/ParticleShapeModule';
import { particleSystemShapeBoxCalcParticlePosDir } from '../src/shapes/ParticleSystemShapeBox';
import { particleSystemShapeCircleCalcParticlePosDir } from '../src/shapes/ParticleSystemShapeCircle';
import { particleSystemShapeConeCalcParticlePosDir } from '../src/shapes/ParticleSystemShapeCone';
import { particleSystemShapeEdgeCalcParticlePosDir } from '../src/shapes/ParticleSystemShapeEdge';
import { particleSystemShapeHemisphereCalcParticlePosDir } from '../src/shapes/ParticleSystemShapeHemisphere';
import { particleSystemShapeSphereCalcParticlePosDir } from '../src/shapes/ParticleSystemShapeSphere';
import type { Particle } from '../src/Particle';

/**
 * 发射形状的采样测试（issue #373）。
 *
 * 各形状的 `calcParticlePosDir` 在「形状纯函数化」批之后变成
 * `particleSystemShape*CalcParticlePosDir(module, particle, position, dir)` 模块级函数（策略 class 已删除），
 * 本文件因此直接调用这些纯函数；形状开关（球壳 / 圆锥发射位置 / 圆边缘 / 盒外壳）由 `module.shapeType` 推导。
 *
 * 两条约定（与原文件一致）：
 * - **统计类断言一律多次采样**（下面的 SAMPLES 次），不依赖单次随机值；
 * - 断言只用**必然成立**的性质（如「球壳上 |pos| ≈ radius」），不指定随机方向的具体数值。
 */

/** 采样次数：足够让「极值类」断言稳定，又不至于拖慢测试 */
const SAMPLES = 200;

/** 稀疏容差：浮点计算与多次采样后的极值，留一点余量 */
const EPS = 1e-6;

/** 造一个可用的 Particle 占位（被测函数并不读它，形状实现里参数名多为 `_particle`） */
const particle = {} as Particle;

/** 形状的「算位置与方向」纯函数签名 */
type ShapeCalc = (module: WritableParticleShapeModuleLike, particle: Particle, position: WritableVector3Like, dir: WritableVector3Like) => void;

/** 构造一个形状模块数据并按需覆盖字段 */
function makeModule(fields: Partial<WritableParticleShapeModuleLike> = {}): WritableParticleShapeModuleLike
{
    return Object.assign(particleShapeModuleDefault(), fields);
}

/** 一次采样，返回 { position, dir } */
function sample(module: WritableParticleShapeModuleLike, calc: ShapeCalc): { position: Vector3; dir: Vector3 }
{
    const position = { x: 0, y: 0, z: 0 };
    const dir = { x: 0, y: 0, z: 0 };
    calc(module, particle, position, dir);

    return { position, dir };
}

/** 采样 SAMPLES 次，收集每次的位置与方向 */
function sampleMany(module: WritableParticleShapeModuleLike, calc: ShapeCalc): { positions: Vector3[]; dirs: Vector3[] }
{
    const positions: Vector3[] = [];
    const dirs: Vector3[] = [];
    for (let i = 0; i < SAMPLES; i++)
    {
        const { position, dir } = sample(module, calc);
        positions.push(position);
        dirs.push(dir);
    }

    return { positions, dirs };
}

describe('发射形状的采样（issue #373）', () =>
{
    // ---------- 通用不变量：6 个形状都要满足 ----------

    const cases: [string, ShapeCalc][] = [
        ['Sphere', particleSystemShapeSphereCalcParticlePosDir],
        ['Hemisphere', particleSystemShapeHemisphereCalcParticlePosDir],
        ['Box', particleSystemShapeBoxCalcParticlePosDir],
        ['Circle', particleSystemShapeCircleCalcParticlePosDir],
        ['Cone', particleSystemShapeConeCalcParticlePosDir],
        ['Edge', particleSystemShapeEdgeCalcParticlePosDir],
    ];

    it.each(cases)('%s：每次采样的方向都是单位向量', (_name, calc) =>
    {
        const module = makeModule({ radius: 2, box: { x: 2, y: 2, z: 2 }, angle: 25 });

        for (let i = 0; i < 50; i++)
        {
            const { dir } = sample(module, calc);

            // 忘了 normalize 会在这里立刻暴露（长度会明显偏离 1）
            expect(Math.abs(vec3Length(dir) - 1)).toBeLessThan(1e-6);
        }
    });

    it.each(cases)('%s：位置与方向都是有限的数值（不会产出 NaN/Infinity）', (_name, calc) =>
    {
        const module = makeModule({ radius: 2, box: { x: 2, y: 2, z: 2 }, angle: 25 });

        for (let i = 0; i < 50; i++)
        {
            const { position, dir } = sample(module, calc);

            for (const v of [position, dir])
            {
                expect(Number.isFinite(v.x)).toBe(true);
                expect(Number.isFinite(v.y)).toBe(true);
                expect(Number.isFinite(v.z)).toBe(true);
            }
        }
    });

    // ---------- 各形状能确定的边界 ----------

    describe('Sphere', () =>
    {
        it('shapeType = SphereShell 时落在球面上（|pos| ≈ radius）', () =>
        {
            const module = makeModule({ radius: 3, shapeType: ParticleSystemShapeType.SphereShell });

            const { positions } = sampleMany(module, particleSystemShapeSphereCalcParticlePosDir);

            for (const p of positions) expect(Math.abs(vec3Length(p) - 3)).toBeLessThan(1e-5);
        });

        it('shapeType = Sphere 时落在球体内（|pos| ≤ radius）', () =>
        {
            const module = makeModule({ radius: 3, shapeType: ParticleSystemShapeType.Sphere });

            const { positions } = sampleMany(module, particleSystemShapeSphereCalcParticlePosDir);

            for (const p of positions) expect(vec3Length(p)).toBeLessThanOrEqual(3 + EPS);
        });

        it('radius 生效：放大半径后采样点也随之变远', () =>
        {
            const module1 = makeModule({ radius: 1, shapeType: ParticleSystemShapeType.SphereShell });
            const module2 = makeModule({ radius: 5, shapeType: ParticleSystemShapeType.SphereShell });

            const maxOf = (m: WritableParticleShapeModuleLike) => Math.max(...sampleMany(m, particleSystemShapeSphereCalcParticlePosDir).positions.map((p) => vec3Length(p)));

            expect(maxOf(module1)).toBeLessThan(maxOf(module2));
        });
    });

    describe('Hemisphere', () =>
    {
        it('只在「上半」采样（本实现的「上」是 +Z）', () =>
        {
            const module = makeModule({ radius: 2 });

            const { positions } = sampleMany(module, particleSystemShapeHemisphereCalcParticlePosDir);

            // ⚠️ 语义来自实现本身：`calcParticlePosDir` 里是 `dir.z = Math.abs(dir.z)`，
            // 所以被裁掉的是 **z < 0** 的那半边，「上」是 **+Z 轴**（不是 Y）。
            for (const p of positions) expect(p.z).toBeGreaterThanOrEqual(-1e-6);
        });
    });

    describe('Box', () =>
    {
        it('落在盒的半尺寸范围内', () =>
        {
            const module = makeModule({ box: { x: 1, y: 2, z: 3 } });

            const { positions } = sampleMany(module, particleSystemShapeBoxCalcParticlePosDir);

            for (const p of positions)
            {
                expect(Math.abs(p.x)).toBeLessThanOrEqual(1 + 1e-6);
                expect(Math.abs(p.y)).toBeLessThanOrEqual(2 + 1e-6);
                expect(Math.abs(p.z)).toBeLessThanOrEqual(3 + 1e-6);
            }
        });
    });

    describe('Circle', () =>
    {
        it('落在圆盘内（|pos| ≤ radius）', () =>
        {
            const module = makeModule({ radius: 2.5 });

            const { positions } = sampleMany(module, particleSystemShapeCircleCalcParticlePosDir);

            for (const p of positions) expect(vec3Length(p)).toBeLessThanOrEqual(2.5 + 1e-6);
        });
    });

    // ---------- 随机性：不能是「恒定发射」 ----------

    it('多次采样不是同一个点（否则是「恒定发射」这种明显 bug）', () =>
    {
        const module = makeModule({ radius: 2, shapeType: ParticleSystemShapeType.SphereShell });

        const { positions } = sampleMany(module, particleSystemShapeSphereCalcParticlePosDir);
        const first = positions[0];
        const distinct = positions.filter((p) => vec3Length(vec3Sub(p, first, p)) > 1e-9).length;

        // 199/200 次都应与首个不同；留一点余量防止极端巧合
        expect(distinct).toBeGreaterThan(SAMPLES - 5);
    });
});
