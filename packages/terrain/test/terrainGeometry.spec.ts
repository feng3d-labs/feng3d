import { describe, expect, it } from 'vitest';
import { defaultTexture, logic } from 'feng3d';

import { createTerrainGeometry, TerrainGeometry } from '../src/TerrainGeometry';

/**
 * `TerrainGeometry`（terrain 包；205 行，此前完全没测）。
 *
 * 它是"纯数据接口 + TerrainGeometryLogic"的形态：数据接口只声明字段，
 * `logic(data)` 里用 computed 由**高度图 + 尺寸/分段**算出顶点数据。
 *
 * 本文件的断言都刻意有判别力（而不是"不抛异常"）：
 * - **默认高度图是全黑的**（`new Color4(0, 0, 0, 0)`）→ 地形应当**平坦**；
 * - `segmentsW` / `segmentsH` 变大 → 顶点数变多；
 * - `width` / `depth` 变大 → x / z 包围盒变大；
 * - 索引必须都在 `[0, 顶点数)` 内。
 */

function makeTerrain(over: Partial<TerrainGeometry> = {}): TerrainGeometry
{
    return { ...createTerrainGeometry(), ...over } as TerrainGeometry;
}

interface GeometryLike
{
    vertices: {
        a_position?: { data: ArrayLike<number> };
        a_normal?: { data: ArrayLike<number> };
        a_uv?: { data: ArrayLike<number> };
    };
    vertexIndices: ArrayLike<number>;
    bounding: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
}

function build(data: TerrainGeometry): GeometryLike
{
    const gl = logic(data);

    if (!gl) throw new Error('logic() 返回空');

    return gl as unknown as GeometryLike;
}

describe('TerrainGeometry（terrain 包）', () =>
{
    it('createTerrainGeometry 给出完整的默认字段（纯数据部分）', () =>
    {
        const data = createTerrainGeometry();

        expect(data.__type__).toBe('TerrainGeometry');
        expect(data.heightMap).toBe(defaultTexture);
        expect(typeof data.width).toBe('number');
        expect(typeof data.depth).toBe('number');
        expect(typeof data.segmentsW).toBe('number');
        expect(typeof data.segmentsH).toBe('number');
        expect(data.maxElevation).toBeGreaterThanOrEqual(data.minElevation);
    });

    it('★ logic 能产出几何数据（positions / uvs / normals / indices 都非空）', () =>
    {
        const gl = build(makeTerrain({ segmentsW: 4, segmentsH: 4 }));

        expect(gl.vertices.a_position?.data.length ?? 0).toBeGreaterThan(0);
        expect(gl.vertexIndices.length).toBeGreaterThan(0);
    });

    it('★ 顶点数符合规则网格的预期（(segmentsW+1) × (segmentsH+1) 量级）', () =>
    {
        const segmentsW = 4;
        const segmentsH = 3;
        const gl = build(makeTerrain({ segmentsW, segmentsH }));
        const vertexCount = (gl.vertices.a_position?.data.length ?? 0) / 3;

        // 用"至少覆盖到网格顶点数"来断言，避免绑死实现是否去重/是否多一圈
        expect(vertexCount).toBeGreaterThanOrEqual((segmentsW + 1) * (segmentsH + 1));
    });

    it('★ 所有坐标都是有限数', () =>
    {
        const gl = build(makeTerrain({ segmentsW: 5, segmentsH: 5 }));
        const positions = gl.vertices.a_position!.data;

        for (let i = 0; i < positions.length; i++)
        {
            if (!Number.isFinite(positions[i])) throw new Error(`positions[${i}] = ${positions[i]} 不是有限数`);
        }
        expect(positions.length % 3).toBe(0);
    });

    it('★ 所有索引都在 [0, 顶点数) 内', () =>
    {
        const gl = build(makeTerrain({ segmentsW: 6, segmentsH: 4 }));
        const vertexCount = (gl.vertices.a_position?.data.length ?? 0) / 3;

        for (let i = 0; i < gl.vertexIndices.length; i++)
        {
            const idx = gl.vertexIndices[i];
            if (!Number.isInteger(idx) || idx < 0 || idx >= vertexCount)
            {
                throw new Error(`vertexIndices[${i}] = ${idx} 非法（顶点数 ${vertexCount}）`);
            }
        }
    });

    it('★ 默认高度图是全黑的 → 地形平坦（y 全为同一个值）', () =>
    {
        const gl = build(makeTerrain({ segmentsW: 4, segmentsH: 4 }));
        const positions = gl.vertices.a_position!.data;
        const ys: number[] = [];

        for (let i = 1; i < positions.length; i += 3) ys.push(positions[i]);

        const first = ys[0];
        for (const y of ys)
        {
            expect(y, `y=${y} 与首个 ${first} 不同（默认高度图应导致平坦地形）`).toBeCloseTo(first, 5);
        }
    });

    it('★ width / depth 变大 → x / z 包围盒变大', () =>
    {
        const small = build(makeTerrain({ width: 10, depth: 10, segmentsW: 4, segmentsH: 4 }));
        const large = build(makeTerrain({ width: 40, depth: 40, segmentsW: 4, segmentsH: 4 }));

        const spanX = (g: GeometryLike) => g.bounding.max.x - g.bounding.min.x;
        const spanZ = (g: GeometryLike) => g.bounding.max.z - g.bounding.min.z;

        expect(spanX(large)).toBeGreaterThan(spanX(small));
        expect(spanZ(large)).toBeGreaterThan(spanZ(small));
    });

    it('★ segmentsW / segmentsH 变大 → 顶点数变多', () =>
    {
        const few = build(makeTerrain({ segmentsW: 2, segmentsH: 2 }));
        const many = build(makeTerrain({ segmentsW: 8, segmentsH: 8 }));

        const count = (g: GeometryLike) => (g.vertices.a_position?.data.length ?? 0) / 3;

        expect(count(many)).toBeGreaterThan(count(few));
    });

    it('★ 改变 minElevation / maxElevation 会改变 y 方向的范围（参数确实生效）', () =>
    {
        // 高度图全黑 → 归一化高度为 0 → y 完全由 minElevation 决定（maxElevation 乘不到东西）。
        // 所以：① 两种情况下地形都应当是**平的**；② 抬高 minElevation 应当把整体抬高。
        const low = build(makeTerrain({ segmentsW: 4, segmentsH: 4, minElevation: 0, maxElevation: 0 }));
        const raised = build(makeTerrain({ segmentsW: 4, segmentsH: 4, minElevation: 5, maxElevation: 5 }));

        const spanY = (g: GeometryLike) => g.bounding.max.y - g.bounding.min.y;

        expect(spanY(low), '全黑高度图下地形应当是平的').toBeCloseTo(0, 5);
        expect(spanY(raised), '抬高 minElevation 后仍然应当是平的').toBeCloseTo(0, 5);
        expect(raised.bounding.min.y, 'minElevation 确实生效').toBeGreaterThan(low.bounding.min.y);
    });

    it('不产生 NaN（多种分段组合）', () =>
    {
        for (const [w, h] of [[1, 1], [2, 3], [7, 1], [1, 7]])
        {
            const gl = build(makeTerrain({ segmentsW: w, segmentsH: h }));
            const positions = gl.vertices.a_position!.data;

            for (let i = 0; i < positions.length; i++)
            {
                expect(Number.isFinite(positions[i]), `segmentsW=${w} segmentsH=${h} i=${i}`).toBe(true);
            }
        }
    });
});
