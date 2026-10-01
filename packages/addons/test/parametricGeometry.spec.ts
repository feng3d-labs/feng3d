import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与同目录其它 spec 同模式）
import './browser-stub';

import { logic } from 'feng3d';

// ⚠️ 必须是**副作用导入**：`ParametricGeometry` 是 interface，写 `import { ParametricGeometry }`
// 会被编译成"仅类型导入"、**运行时被擦除**，于是该模块里的 `registerLogic` 不会执行，
// `logic()` 就会返回 null（第一版正是这样，9 条用例全挂在"logic() 返回空"）。
import '../src/geometries/ParametricGeometry';
import type { ParametricGeometry } from '../src/geometries/ParametricGeometry';
import { plane } from '../src/geometries/ParametricFunctions';

/**
 * `ParametricGeometry`（`packages/addons/src/geometries/`；此前**行覆盖率 0%**）。
 *
 * 它把"参数曲面函数 `(u, v) => Vector3`"离散成网格，字段语义在源码注释里写得很明确：
 *
 * - `slices`：u 方向切片数 → **顶点列数 = slices + 1**；
 * - `stacks`：v 方向堆叠数 → **顶点行数 = stacks + 1**；
 * - `doubleside`：是否生成反面（追加反向顶点与索引）。
 *
 * 所以**顶点总数应当是 `(slices+1) × (stacks+1)`** —— 这是本文件最有判别力的断言。
 *
 * 另外，把已测过的 {@link plane}（`(u, v) => (u, 0, v)`）当 `func` 传进来，
 * **顶点坐标就能精确预测**（全部落在 `y = 0`、`x/z ∈ [0,1]`），比"不抛异常"强得多。
 */

interface GeometryLike
{
    vertices: {
        a_position?: { data: ArrayLike<number> };
        a_normal?: { data: ArrayLike<number> };
        a_uv?: { data: ArrayLike<number> };
        a_tangent?: { data: ArrayLike<number> };
    };
    vertexIndices: ArrayLike<number>;
    bounding: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
}

function makeParametric(over: Partial<ParametricGeometry> = {}): ParametricGeometry
{
    return {
        __type__: 'ParametricGeometry',
        func: plane,
        slices: 4,
        stacks: 4,
        doubleside: false,
        ...over,
    } as ParametricGeometry;
}

function build(data: ParametricGeometry): GeometryLike
{
    const gl = logic(data);

    if (!gl) throw new Error('logic() 返回空');

    return gl as unknown as GeometryLike;
}

describe('ParametricGeometry（addons）', () =>
{
    it('★ 顶点数等于 (slices + 1) × (stacks + 1)', () =>
    {
        for (const [slices, stacks] of [[1, 1], [4, 4], [3, 5], [8, 2]])
        {
            const gl = build(makeParametric({ slices, stacks }));
            const count = gl.vertices.a_position!.data.length / 3;

            expect(count, `slices=${slices} stacks=${stacks}`).toBe((slices + 1) * (stacks + 1));
        }
    });

    it('slices / stacks 变大 → 顶点数变多', () =>
    {
        const few = build(makeParametric({ slices: 2, stacks: 2 }));
        const many = build(makeParametric({ slices: 8, stacks: 8 }));
        const count = (g: GeometryLike) => g.vertices.a_position!.data.length / 3;

        expect(count(many)).toBeGreaterThan(count(few));
    });

    it('★ 用 plane 作 func：所有顶点 y = 0，x / z 落在 [0, 1]', () =>
    {
        const gl = build(makeParametric({ func: plane, slices: 4, stacks: 4 }));
        const positions = gl.vertices.a_position!.data;

        for (let i = 0; i < positions.length; i += 3)
        {
            expect(positions[i + 1], `第 ${i / 3} 个顶点的 y`).toBeCloseTo(0, 6);
            expect(positions[i], `第 ${i / 3} 个顶点的 x`).toBeGreaterThanOrEqual(-1e-6);
            expect(positions[i], `第 ${i / 3} 个顶点的 x`).toBeLessThanOrEqual(1 + 1e-6);
            expect(positions[i + 2], `第 ${i / 3} 个顶点的 z`).toBeGreaterThanOrEqual(-1e-6);
            expect(positions[i + 2], `第 ${i / 3} 个顶点的 z`).toBeLessThanOrEqual(1 + 1e-6);
        }
    });

    it('★ uv 落在 [0, 1] 范围内', () =>
    {
        const gl = build(makeParametric({ slices: 3, stacks: 3 }));
        const uv = gl.vertices.a_uv?.data;

        expect(uv, '应当有 a_uv').toBeTruthy();
        for (let i = 0; i < uv!.length; i++)
        {
            expect(uv![i], `uv[${i}]`).toBeGreaterThanOrEqual(-1e-6);
            expect(uv![i], `uv[${i}]`).toBeLessThanOrEqual(1 + 1e-6);
        }
    });

    it('★ 索引合法：是 3 的倍数、全部在 [0, 顶点数) 内', () =>
    {
        const gl = build(makeParametric({ slices: 5, stacks: 4 }));
        const vertexCount = gl.vertices.a_position!.data.length / 3;

        expect(gl.vertexIndices.length % 3).toBe(0);
        expect(gl.vertexIndices.length).toBeGreaterThan(0);

        for (let i = 0; i < gl.vertexIndices.length; i++)
        {
            const idx = gl.vertexIndices[i];

            expect(Number.isInteger(idx), `indices[${i}] = ${idx}`).toBe(true);
            expect(idx, `indices[${i}] = ${idx}`).toBeGreaterThanOrEqual(0);
            expect(idx, `indices[${i}] = ${idx}`).toBeLessThan(vertexCount);
        }
    });

    it('★ doubleside = true 会追加反面（索引数增加，且仍合法）', () =>
    {
        const single = build(makeParametric({ slices: 3, stacks: 3, doubleside: false }));
        const double = build(makeParametric({ slices: 3, stacks: 3, doubleside: true }));

        expect(double.vertexIndices.length).toBeGreaterThan(single.vertexIndices.length);

        const vertexCount = double.vertices.a_position!.data.length / 3;
        for (let i = 0; i < double.vertexIndices.length; i++)
        {
            expect(double.vertexIndices[i], `double.indices[${i}]`).toBeLessThan(vertexCount);
        }
    });

    it('法线 / 切线的长度与顶点数一致（若有）', () =>
    {
        const gl = build(makeParametric({ slices: 4, stacks: 3 }));
        const vertexCount = gl.vertices.a_position!.data.length / 3;

        if (gl.vertices.a_normal?.data) expect(gl.vertices.a_normal.data.length).toBe(vertexCount * 3);
        if (gl.vertices.a_tangent?.data) expect(gl.vertices.a_tangent.data.length).toBe(vertexCount * 3);
        if (gl.vertices.a_uv?.data) expect(gl.vertices.a_uv.data.length).toBe(vertexCount * 2);
    });

    it('包围盒有限，且与 func 的值域一致（plane → y 范围为 0）', () =>
    {
        const gl = build(makeParametric({ func: plane, slices: 4, stacks: 4 }));

        expect(Number.isFinite(gl.bounding.min.x)).toBe(true);
        expect(Number.isFinite(gl.bounding.max.x)).toBe(true);
        expect(gl.bounding.min.y).toBeCloseTo(0, 6);
        expect(gl.bounding.max.y).toBeCloseTo(0, 6);
    });

    it('不产生 NaN / Infinity（多种 slices / stacks 组合）', () =>
    {
        for (const [slices, stacks] of [[1, 1], [2, 3], [10, 1]])
        {
            const gl = build(makeParametric({ slices, stacks }));
            const positions = gl.vertices.a_position!.data;

            for (let i = 0; i < positions.length; i++)
            {
                expect(Number.isFinite(positions[i]), `slices=${slices} stacks=${stacks} i=${i}`).toBe(true);
            }
        }
    });
});
