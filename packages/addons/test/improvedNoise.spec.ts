import { describe, expect, it } from 'vitest';
import { ImprovedNoise } from '../src/math/ImprovedNoise';

/**
 * 经典 Perlin 噪声（issue #380）。
 *
 * 断言只用**必然成立的性质**，不去比对某个具体数值（那需要一份参考实现，而且换实现就会失效）。
 * **所有输入都是确定的常量**——不用 `Math.random()` 生成输入，否则失败不可复现。
 */

const perlin = new ImprovedNoise();

/** 一批确定的采样点：整数格点、轴上点、一般位置 */
const SAMPLES: [number, number, number][] = [
    [0, 0, 0], [1, 2, 3], [-1, -2, -3], [10, 20, 30],
    [0.5, 0.5, 0.5], [0.1, 0.2, 0.3], [-0.7, 0.25, 0.9],
    [1.5, -2.5, 3.5], [100.25, 200.5, 300.75], [-99.1, 42.7, 7.3],
    [0.001, 0.002, 0.003], [1000, 2000, 3000],
    [3.14159, 2.71828, 1.41421],
];

describe('ImprovedNoise：经典 Perlin 噪声（issue #380）', () =>
{
    it('值域在 [-1, 1] 内', () =>
    {
        for (const [x, y, z] of SAMPLES)
        {
            const v = perlin.noise(x, y, z);

            expect(Number.isFinite(v), `noise(${x},${y},${z}) = ${v}`).toBe(true);
            expect(v, `noise(${x},${y},${z}) = ${v}`).toBeGreaterThanOrEqual(-1);
            expect(v, `noise(${x},${y},${z}) = ${v}`).toBeLessThanOrEqual(1);
        }
    });

    it('确定性：同输入同输出（若实现里有隐藏的随机性，这条会失败）', () =>
    {
        for (const [x, y, z] of SAMPLES)
        {
            expect(perlin.noise(x, y, z), `noise(${x},${y},${z})`).toBe(perlin.noise(x, y, z));
        }

        // 换一个实例也必须一致（说明状态是静态的、不依赖实例创建顺序）
        const other = new ImprovedNoise();
        for (const [x, y, z] of SAMPLES)
        {
            expect(other.noise(x, y, z), `新实例 noise(${x},${y},${z})`).toBe(perlin.noise(x, y, z));
        }
    });

    it('不恒定：不同输入不会全部返回同一个值', () =>
    {
        const values = SAMPLES.map(([x, y, z]) => perlin.noise(x, y, z));
        const distinct = new Set(values);

        // 至少要有若干个不同的取值（Perlin 在 13 个点上不可能只有 1~2 个值）
        expect(distinct.size).toBeGreaterThan(5);
    });

    it('整数格点上的值为 0（经典 Perlin 的定义性质）', () =>
    {
        // ⚠️ 这条依赖"本实现确实满足经典定义"。若某天失败，先确认是实现变了还是这条前提不成立，
        // 不要为了迁就定义去改实现。
        const integerLattice: [number, number, number][] = [
            [0, 0, 0], [1, 1, 1], [1, 2, 3], [-4, 5, -6], [10, 0, 0], [0, 7, 0], [0, 0, 8],
        ];

        for (const [x, y, z] of integerLattice)
        {
            expect(Math.abs(perlin.noise(x, y, z)), `noise(${x},${y},${z})`).toBeLessThan(1e-12);
        }
    });

    it('连续性：非常接近的两个点，噪声值也接近', () =>
    {
        const base: [number, number, number] = [0.3, 2.7, -1.1];
        const eps = 1e-4;

        const center = perlin.noise(...base);
        // 三个轴向各挪一点点，值不应出现跳变
        for (const axis of [0, 1, 2] as const)
        {
            for (const delta of [eps, -eps])
            {
                const p: [number, number, number] = [...base];
                p[axis] += delta;

                const v = perlin.noise(...p);
                expect(Math.abs(v - center), `axis=${axis} delta=${delta}`).toBeLessThan(0.01);
            }
        }
    });

    it('非退化：坐标轴上与一般位置的样本都不是常数', () =>
    {
        // y = z = 0 时沿 x 采样
        const onAxis = [0.1, 0.2, 0.3, 0.4, 0.5, 1.1, 2.2, 3.3].map((x) => perlin.noise(x, 0, 0));
        expect(new Set(onAxis).size).toBeGreaterThan(1);

        // 一般三维位置
        const inSpace = [
            [0.1, 0.1, 0.1], [0.2, 0.1, 0.1], [0.1, 0.2, 0.1], [0.1, 0.1, 0.2], [0.5, 0.6, 0.7],
        ].map(([x, y, z]) => perlin.noise(x, y, z));
        expect(new Set(inSpace).size).toBeGreaterThan(1);
    });
});