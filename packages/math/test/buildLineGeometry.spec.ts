import { describe, expect, it } from 'vitest';

import { buildLineGeometry } from '../src/buildLineGeometry';

/**
 * `buildLineGeometry`（`packages/math/src/buildLineGeometry.ts`，**266 行**，此前**行覆盖率 0.75%**）
 * —— 移植自 pixi.js 的 `buildLine.ts`。
 *
 * 它把一串点构建成**可渲染的"粗线"几何**（三角化），写入调用方给的 `geometry`：
 *
 * ```ts
 * buildLineGeometry(
 *     { points: number[], epsilon?, close?, lineStyle? },
 *     geometry = { points: [], indices: [] },   // 就地填充
 * )
 * ```
 *
 * **本文件只钉与实现细节无关的不变量**（不猜顶点数的具体公式 —— 那取决于虚线切分、`epsilon`
 * 去重、`lineStyle` 宽度等一整套逻辑）：
 *
 * 1. **返回的就是传入的 `geometry` 对象**（同一引用）；
 * 2. 输出全是**有限数**；
 * 3. **`indices` 是 3 的倍数**（三角形列表），且索引都落在 `[0, points.length / 2)`；
 * 4. 点数增加 → 输出顶点数**单调不减**；
 * 5. 空 / 单点等退化输入**不抛异常**。
 */

/** 造一条扁平点数组（每 2 个数一个点） */
const flat = (...pairs: [number, number][]) => pairs.flatMap(([x, y]) => [x, y]);

/** 一次构建，返回填充后的 geometry */
function build(points: number[], extra: Record<string, unknown> = {})
{
    const geometry = { points: [] as number[], indices: [] as number[] };

    buildLineGeometry({ points, ...extra } as never, geometry);

    return geometry;
}

/** 输出顶点数（每 2 个数一个顶点） */
const vertexCount = (g: { points: number[] }) => g.points.length / 2;

describe('buildLineGeometry（math）', () =>
{
    describe('★ 返回与目标对象', () =>
    {
        it('★ 返回的就是传入的 geometry 对象本身（同一引用）', () =>
        {
            const geometry = { points: [] as number[], indices: [] as number[] };
            const ret = buildLineGeometry({ points: flat([0, 0], [10, 0]) } as never, geometry);

            expect(ret).toBe(geometry);
        });

        it('★ 不传 geometry 时会返回一个带 points / indices 的新对象', () =>
        {
            const ret = buildLineGeometry({ points: flat([0, 0], [10, 0]) } as never);

            expect(ret).toBeDefined();
            expect(Array.isArray(ret.points)).toBe(true);
            expect(Array.isArray(ret.indices)).toBe(true);
        });
    });

    describe('★★ 输出的基本合法性（对多组输入）', () =>
    {
        const inputs: [string, number[]][] = [
            ['一条水平线段', flat([0, 0], [10, 0])],
            ['两段折线', flat([0, 0], [10, 0], [10, 10])],
            ['三段折线', flat([0, 0], [10, 0], [10, 10], [0, 10])],
            ['斜线', flat([-5, -5], [5, 5])],
            ['多段折线', flat([0, 0], [5, 5], [10, 0], [15, 5], [20, 0])],
        ];

        it('★★ 所有输出的数值都是有限的', () =>
        {
            for (const [name, points] of inputs)
            {
                const g = build(points);

                for (let i = 0; i < g.points.length; i++)
                {
                    expect(Number.isFinite(g.points[i]), `${name} points[${i}]=${g.points[i]}`).toBe(true);
                }
            }
        });

        it('★★ indices 是 3 的倍数（三角形列表）', () =>
        {
            for (const [name, points] of inputs)
            {
                const g = build(points);

                expect(g.indices.length % 3, `${name} 的 indices 长度 ${g.indices.length}`).toBe(0);
            }
        });

        it('★★ 所有索引都落在 [0, 顶点数)', () =>
        {
            for (const [name, points] of inputs)
            {
                const g = build(points);
                const n = vertexCount(g);

                for (let i = 0; i < g.indices.length; i++)
                {
                    const idx = g.indices[i];

                    expect(Number.isInteger(idx), `${name} indices[${i}]=${idx}`).toBe(true);
                    expect(idx, `${name} indices[${i}]=${idx} 越界（顶点数 ${n}）`).toBeGreaterThanOrEqual(0);
                    expect(idx, `${name} indices[${i}]=${idx} 越界（顶点数 ${n}）`).toBeLessThan(n);
                }
            }
        });

        it('★ 每条索引数都是偶数长度之外的合法三元组（顶点数 × 2 === points.length）', () =>
        {
            for (const [name, points] of inputs)
            {
                const g = build(points);

                expect(g.points.length % 2, `${name}`).toBe(0);
            }
        });
    });

    describe('★★ 单调性：点越多，输出顶点不少于少的', () =>
    {
        it('★★ 折线点数增加时顶点数单调不减', () =>
        {
            let prev = -1;

            for (let n = 2; n <= 8; n++)
            {
                const points: number[] = [];

                for (let i = 0; i < n; i++) points.push(i * 10, (i % 2) * 10);

                const count = vertexCount(build(points));

                expect(count, `n=${n}（顶点 ${count}，上一次 ${prev}）`).toBeGreaterThanOrEqual(prev);
                prev = count;
            }
        });

        it('★ 两点构成的线段会产生非空几何（至少有顶点）', () =>
        {
            const g = build(flat([0, 0], [10, 0]));

            expect(vertexCount(g)).toBeGreaterThan(0);
        });
    });

    describe('★ 退化与可选参数', () =>
    {
        it('★ 空点集不抛异常', () =>
        {
            expect(() => buildLineGeometry({ points: [] } as never)).not.toThrow();
        });

        it('★ 单点不抛异常', () =>
        {
            expect(() => buildLineGeometry({ points: flat([3, 4]) } as never)).not.toThrow();
        });

        it('★ 重复点（距离小于 epsilon）不抛异常', () =>
        {
            expect(() => buildLineGeometry({ points: flat([0, 0], [0, 0], [1, 0]) } as never)).not.toThrow();
        });

        it('★★ close = true 时输出顶点不少于 close = false', () =>
        {
            const pts = flat([0, 0], [10, 0], [10, 10]);
            const open = build(pts, { close: false });
            const closed = build(pts, { close: true });

            // 闭合会多接一段，几何量应当不少于不闭合的情形
            expect(closed.indices.length).toBeGreaterThanOrEqual(open.indices.length);
        });

        it('★ 显式传 epsilon 不抛异常（极小 / 极大都试一遍）', () =>
        {
            const pts = flat([0, 0], [10, 0], [10, 10]);

            for (const epsilon of [0, 1e-10, 1e-4, 1, 100])
            {
                expect(() => build(pts, { epsilon }), `epsilon=${epsilon}`).not.toThrow();
            }
        });

        it('★ 每条输出的顶点与索引长度都是偶数 / 3 的倍数（两种 close 值下）', () =>
        {
            const pts = flat([0, 0], [10, 0], [10, 10], [0, 10]);

            for (const close of [false, true])
            {
                const g = build(pts, { close });

                expect(g.points.length % 2, `close=${close}`).toBe(0);
                expect(g.indices.length % 3, `close=${close}`).toBe(0);
            }
        });
    });
});
