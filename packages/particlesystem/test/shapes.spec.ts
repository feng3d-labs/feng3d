import { describe, expect, it } from 'vitest';
import { vec3Length, vec3Sub, Vector3 } from '@feng3d/math';
import { ParticleShapeModule } from '../src/modules/ParticleShapeModule';
import { Particle } from '../src/Particle';
import { ParticleSystemShape } from '../src/shapes/ParticleSystemShape';
import { ParticleSystemShapeBox } from '../src/shapes/ParticleSystemShapeBox';
import { ParticleSystemShapeCircle } from '../src/shapes/ParticleSystemShapeCircle';
import { ParticleSystemShapeCone } from '../src/shapes/ParticleSystemShapeCone';
import { ParticleSystemShapeEdge } from '../src/shapes/ParticleSystemShapeEdge';
import { ParticleSystemShapeHemisphere } from '../src/shapes/ParticleSystemShapeHemisphere';
import { ParticleSystemShapeSphere } from '../src/shapes/ParticleSystemShapeSphere';

/**
 * 发射形状的采样测试（issue #373）。
 *
 * `calcParticlePosDir` 是**纯计算**（按形状采样出粒子的发射位置与方向），无需 GPU，
 * 所以可以用断言把它钉住。本文件测的是**跨形状通用的不变量** + 各形状能确定的边界。
 *
 * 两条约定：
 * - **统计类断言一律多次采样**（下面的 SAMPLES 次），不依赖单次随机值——否则测试会靠运气过；
 * - 断言只用**必然成立**的性质（如"球壳上 |pos| ≈ radius"），不去指定随机方向的具体数值。
 */

/** 采样次数：足够让"极值类"断言稳定，又不至于拖慢测试 */
const SAMPLES = 200;

/** 稀疏容差：浮点计算与多次采样后的极值，留一点余量 */
const EPS = 1e-6;

/** 造一个可用的 Particle 占位（被测函数并不读它，形状实现里参数名多为 `_particle`） */
const particle = {} as Particle;

/** 一次采样，返回 { position, dir } */
function sample(shape: ParticleSystemShape): { position: Vector3; dir: Vector3 }
{
    const position = { x: 0, y: 0, z: 0 };
    const dir = { x: 0, y: 0, z: 0 };
    shape.calcParticlePosDir(particle, position, dir);

    return { position, dir };
}

/** 采样 SAMPLES 次，收集每次的位置与方向 */
function sampleMany(shape: ParticleSystemShape): { positions: Vector3[]; dirs: Vector3[] }
{
    const positions: Vector3[] = [];
    const dirs: Vector3[] = [];
    for (let i = 0; i < SAMPLES; i++)
    {
        const { position, dir } = sample(shape);
        positions.push(position);
        dirs.push(dir);
    }

    return { positions, dirs };
}

/** 构造一个 ShapeModule 并按需赋值 */
function makeModule(fields: Record<string, unknown> = {}): ParticleShapeModule
{
    const module = new ParticleShapeModule();
    for (const [key, value] of Object.entries(fields)) (module as unknown as Record<string, unknown>)[key] = value;

    return module;
}

describe('发射形状的采样（issue #373）', () =>
{
    // ---------- 通用不变量：7 个形状都要满足 ----------

    const cases: [string, (m: ParticleShapeModule) => ParticleSystemShape][] = [
        ['Sphere', (m) => new ParticleSystemShapeSphere(m)],
        ['Hemisphere', (m) => new ParticleSystemShapeHemisphere(m)],
        ['Box', (m) => new ParticleSystemShapeBox(m)],
        ['Circle', (m) => new ParticleSystemShapeCircle(m)],
        ['Cone', (m) => new ParticleSystemShapeCone(m)],
        ['Edge', (m) => new ParticleSystemShapeEdge(m)],
    ];

    it.each(cases)('%s：每次采样的方向都是单位向量', (_name, create) =>
    {
        const shape = create(makeModule({ radius: 2, boxX: 2, boxY: 2, boxZ: 2, angle: 25 }));

        for (let i = 0; i < 50; i++)
        {
            const { dir } = sample(shape);

            // 忘了 normalize 会在这里立刻暴露（长度会明显偏离 1）
            expect(Math.abs(vec3Length(dir) - 1)).toBeLessThan(1e-6);
        }
    });

    it.each(cases)('%s：位置与方向都是有限的数值（不会产出 NaN/Infinity）', (_name, create) =>
    {
        const shape = create(makeModule({ radius: 2, boxX: 2, boxY: 2, boxZ: 2, angle: 25 }));

        for (let i = 0; i < 50; i++)
        {
            const { position, dir } = sample(shape);

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
        it('emitFromShell = true 时落在球面上（|pos| ≈ radius）', () =>
        {
            const module = makeModule({ radius: 3 });
            const shape = new ParticleSystemShapeSphere(module);
            shape.emitFromShell = true;

            const { positions } = sampleMany(shape);

            for (const p of positions) expect(Math.abs(vec3Length(p) - 3)).toBeLessThan(1e-5);
        });

        it('emitFromShell = false 时落在球体内（|pos| ≤ radius）', () =>
        {
            const module = makeModule({ radius: 3 });
            const shape = new ParticleSystemShapeSphere(module);
            shape.emitFromShell = false;

            const { positions } = sampleMany(shape);

            for (const p of positions) expect(vec3Length(p)).toBeLessThanOrEqual(3 + EPS);
        });

        it('radius 生效：放大半径后采样点也随之变远', () =>
        {
            const shape1 = new ParticleSystemShapeSphere(makeModule({ radius: 1 }));
            shape1.emitFromShell = true;
            const shape2 = new ParticleSystemShapeSphere(makeModule({ radius: 5 }));
            shape2.emitFromShell = true;

            const maxOf = (s: ParticleSystemShape) => Math.max(...sampleMany(s).positions.map((p) => vec3Length(p)));

            expect(maxOf(shape1)).toBeLessThan(maxOf(shape2));
        });
    });

    describe('Hemisphere', () =>
    {
        it('只在"上半"采样（本实现的"上"是 +Z）', () =>
        {
            const shape = new ParticleSystemShapeHemisphere(makeModule({}));
            shape.radius = 2;

            const { positions } = sampleMany(shape);

            // ⚠️ 语义来自实现本身：`calcParticlePosDir` 里是 `dir.z = Math.abs(dir.z)`，
            // 所以被裁掉的是 **z < 0** 的那半边，"上"是 **+Z 轴**（不是 Y）。
            // 这条断言是照着实现写的；若将来实现改成裁 y，这里必须一起改——
            // 那属于**行为变更**，不该在本 issue（只加测试）里发生。
            for (const p of positions) expect(p.z).toBeGreaterThanOrEqual(-1e-6);
        });
    });

    describe('Box', () =>
    {
        it('落在盒的半尺寸范围内', () =>
        {
            const module = makeModule({ boxX: 1, boxY: 2, boxZ: 3 });
            const shape = new ParticleSystemShapeBox(module);

            const { positions } = sampleMany(shape);

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
            const shape = new ParticleSystemShapeCircle(makeModule({ radius: 2.5 }));

            const { positions } = sampleMany(shape);

            for (const p of positions) expect(vec3Length(p)).toBeLessThanOrEqual(2.5 + 1e-6);
        });
    });

    // ---------- 随机性：不能是"恒定发射" ----------

    it('多次采样不是同一个点（否则是"恒定发射"这种明显 bug）', () =>
    {
        const shape = new ParticleSystemShapeSphere(makeModule({ radius: 2 }));
        shape.emitFromShell = true;

        const { positions } = sampleMany(shape);
        const first = positions[0];
        const distinct = positions.filter((p) => vec3Length(vec3Sub(p, first, p)) > 1e-9).length;

        // 199/200 次都应与首个不同；留一点余量防止极端巧合
        expect(distinct).toBeGreaterThan(SAMPLES - 5);
    });
});