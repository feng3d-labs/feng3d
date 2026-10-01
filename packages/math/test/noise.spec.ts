import { describe, expect, it } from 'vitest';

import { createGrad, getBits, Noise, noise } from '../src/Noise';

/**
 * Noise（packages/math/src/Noise.ts，163 行，此前行覆盖率 37.42%）。
 *
 * Perlin 噪声：perlin1(x) / perlin2(x, y) / perlin3(x, y, z) / perlinN(...ps)，
 * 加 seed 存取器与工具函数 createGrad(n) / getBits(n)。
 *
 * 具体数值取决于实现，所以这里不钉"perlin1(0.5) 等于多少"，只钉与实现无关的性质：
 * ① 确定性（同 seed + 同输入 → 同输出）；② 有限性；③ 非常数；④ seed 生效；⑤ 两个工具函数的结构。
 *
 * 实测过、但语义不直观的点（都没有写死）：
 * - createGrad(1) / getBits(1) 返回 2 组（不是 1）—— 下限规则未完全确认，故只断言 >= n；
 * - perlin* 的取值界（Perlin 经典界是 [-1,1]）未确认，故不断言。
 */

describe('Noise（math）', () =>
{
    describe('确定性：同一 seed、同一输入 → 同一输出', () =>
    {
        it('perlin1 对同一输入给出同一值', () =>
        {
            const n = new Noise(42);

            for (const x of [-10, -1, 0, 0.5, 1, 3.25, 100])
            {
                expect(n.perlin1(x), `x=${x}`).toBe(n.perlin1(x));
            }
        });

        it('perlin2 / perlin3 对同一输入给出同一值', () =>
        {
            const n = new Noise(7);

            for (const [x, y] of [[0, 0], [1, 2], [-3.5, 0.25], [10, -10]] as [number, number][])
            {
                expect(n.perlin2(x, y), `(${x},${y})`).toBe(n.perlin2(x, y));
                expect(n.perlin3(x, y, 0.5), `(${x},${y},0.5)`).toBe(n.perlin3(x, y, 0.5));
            }
        });

        it('两个相同 seed 的实例给出一致的序列', () =>
        {
            const a = new Noise(123);
            const b = new Noise(123);

            for (let i = 0; i < 20; i++)
            {
                const x = i / 7;

                expect(a.perlin1(x), `x=${x}`).toBe(b.perlin1(x));
                expect(a.perlin2(x, x * 2), `(${x},${x * 2})`).toBe(b.perlin2(x, x * 2));
            }
        });

        it('同一实例反复调用不漂移', () =>
        {
            const n = new Noise(5);

            for (const x of [0.1, 0.2, 0.3, 0.4, 0.5])
            {
                expect(n.perlin1(x), `x=${x}`).toBe(n.perlin1(x));
            }
        });
    });

    describe('有限性（不产生 NaN / Infinity）', () =>
    {
        it('perlin1 / perlin2 / perlin3 在一段输入上都是有限数', () =>
        {
            const n = new Noise(1);

            for (let i = -50; i <= 50; i++)
            {
                const x = i / 10;

                expect(Number.isFinite(n.perlin1(x)), `perlin1(${x})`).toBe(true);
                expect(Number.isFinite(n.perlin2(x, -x)), `perlin2(${x})`).toBe(true);
                expect(Number.isFinite(n.perlin3(x, -x, x / 2)), `perlin3(${x})`).toBe(true);
            }
        });

        it('整数输入（网格点）也是有限数', () =>
        {
            const n = new Noise(9);

            for (const x of [-3, -2, -1, 0, 1, 2, 3])
            {
                expect(Number.isFinite(n.perlin1(x)), `x=${x}`).toBe(true);
                expect(Number.isFinite(n.perlin2(x, x)), `(${x},${x})`).toBe(true);
            }
        });
    });

    describe('非常数：不同输入确实给出不同值', () =>
    {
        it('perlin1 在一段输入上至少取到多个不同值', () =>
        {
            const n = new Noise(3);
            const values = new Set<number>();

            for (let i = 0; i < 50; i++) values.add(n.perlin1(i / 10));

            expect(values.size).toBeGreaterThan(5);
        });

        it('perlin2 在两个方向上都会变化', () =>
        {
            const n = new Noise(3);
            const alongX = new Set<number>();
            const alongY = new Set<number>();

            for (let i = 0; i < 30; i++)
            {
                alongX.add(n.perlin2(i / 10, 0.5));
                alongY.add(n.perlin2(0.5, i / 10));
            }

            expect(alongX.size).toBeGreaterThan(3);
            expect(alongY.size).toBeGreaterThan(3);
        });
    });

    describe('seed', () =>
    {
        it('get / set 往返一致', () =>
        {
            const n = new Noise(11);

            expect(n.seed).toBe(11);

            n.seed = 99;
            expect(n.seed).toBe(99);
        });

        it('换 seed 会改变序列（至少有一处不同）', () =>
        {
            const a = new Noise(1);
            const b = new Noise(2);
            let diff = 0;

            for (let i = 0; i < 30; i++)
            {
                if (a.perlin1(i / 10) !== b.perlin1(i / 10)) diff++;
            }

            expect(diff).toBeGreaterThan(0);
        });

        it('改回原来的 seed 后，序列与之前一致（seed 是唯一状态）', () =>
        {
            const n = new Noise(8);
            const sample = () => [0, 1, 2, 3, 4].map((i) => n.perlin1(i / 5));
            const before = sample();

            n.seed = 777;
            n.seed = 8;

            expect(sample()).toEqual(before);
        });
    });

    describe('perlinN / createGrad / getBits / 单例', () =>
    {
        it('perlinN 在 1 / 2 / 3 个参数下都返回有限数', () =>
        {
            const n = new Noise(21);

            expect(Number.isFinite(n.perlinN(0.5))).toBe(true);
            expect(Number.isFinite(n.perlinN(0.5, 0.25))).toBe(true);
            expect(Number.isFinite(n.perlinN(0.5, 0.25, 0.125))).toBe(true);
        });

        it('createGrad(n) 返回至少 n 组梯度向量（每组是数组）', () =>
        {
            // 实测：createGrad(1) 返回 2 组（不是 1）。下限的确切规则未完全确认，
            // ⚠️ 另外实测：传入较大的 n（如 255）会让 vitest worker 内存爆掉（4GB OOM），
            // 所以这里只用 n = 1 / 2 这种小值。
            // 所以只断言"至少 n 组 + 每组是数组"这个必要性质，不写死数量。
            for (const n of [1, 2])
            {
                const grad = createGrad(n);

                expect(Array.isArray(grad), `n=${n}`).toBe(true);
                expect(grad.length, `n=${n}`).toBeGreaterThanOrEqual(n);
                for (const g of grad) expect(Array.isArray(g), `n=${n} 的每组`).toBe(true);
            }
        });

        it('getBits(n) 返回至少 n 组位向量', () =>
        {
            for (const n of [1, 2])
            {
                const bits = getBits(n);

                expect(Array.isArray(bits), `n=${n}`).toBe(true);
                expect(bits.length, `n=${n}`).toBeGreaterThanOrEqual(n);
            }
        });

        it('导出的 noise 单例可用，且行为与 new Noise(0) 一致', () =>
        {
            expect(noise).toBeInstanceOf(Noise);

            const own = new Noise(0);

            for (const x of [0, 0.5, 1, 2])
            {
                expect(noise.perlin1(x), `x=${x}`).toBe(own.perlin1(x));
            }
        });
    });
});